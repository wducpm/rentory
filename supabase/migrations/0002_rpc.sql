-- ═══════════════════════════════════════════════════════════════════════════
-- Rentory · 0002_rpc
-- Mọi thao tác ghi cần nhiều bảng đều gói trong một RPC để chạy atomic:
-- lưu hóa đơn PHẢI kéo theo ghi đè mốc (HD-04) và ghi log (N3) — không được
-- phép thành công một nửa.
--
-- Toàn bộ hàm ở đây là SECURITY INVOKER (mặc định) nên RLS của admin vẫn áp.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Helper: ghi đè mốc + log (HD-04 + N2 + N3) ─────────────────────────────
create function apply_meter_mark(
  p_room_id        uuid,
  p_elec           numeric,
  p_water          numeric,
  p_source         mark_source,
  p_effective_date date,
  p_invoice_id     uuid default null,
  p_note           text default null
) returns void
language plpgsql as $$
declare
  v_prev_elec  numeric;
  v_prev_water numeric;
begin
  select current_elec, current_water into v_prev_elec, v_prev_water
  from rooms where id = p_room_id for update;

  if not found then
    raise exception 'Không tìm thấy phòng %', p_room_id;
  end if;

  update rooms
     set current_elec = p_elec, current_water = p_water
   where id = p_room_id;

  -- N3: mỗi lần ghi đè đều để lại dấu vết
  insert into meter_mark_logs
    (room_id, effective_date, elec, water, prev_elec, prev_water, source, invoice_id, note)
  values
    (p_room_id, p_effective_date, p_elec, p_water, v_prev_elec, v_prev_water, p_source, p_invoice_id, p_note);
end;
$$;

-- ── Helper: ghi các dòng tiền của hóa đơn ──────────────────────────────────
create function replace_invoice_items(p_invoice_id uuid, p_items jsonb)
returns void
language plpgsql as $$
begin
  delete from invoice_items
   where invoice_id = p_invoice_id
     and fee not in (
       select (value->>'fee')::fee_type from jsonb_array_elements(p_items)
     );

  insert into invoice_items (invoice_id, fee, amount, is_deposit)
  select p_invoice_id,
         (value->>'fee')::fee_type,
         (value->>'amount')::int,
         coalesce((value->>'is_deposit')::boolean, false)
    from jsonb_array_elements(p_items)
  on conflict (invoice_id, fee) do update
    set amount = excluded.amount, is_deposit = excluded.is_deposit;
end;
$$;

-- ── Helper: chèn hóa đơn + dòng tiền + ghi đè mốc ──────────────────────────
create function insert_invoice_with_mark(
  p_room_id        uuid,
  p_contract_id    uuid,
  p_code           text,
  p_type           invoice_type,
  p_issue_date     date,
  p_utility_period text,
  p_service_period text,
  p_elec_start     numeric,
  p_elec_end       numeric,
  p_water_start    numeric,
  p_water_end      numeric,
  p_items          jsonb,
  p_note           text default null
) returns uuid
language plpgsql as $$
declare
  v_building_id uuid;
  v_invoice_id  uuid;
begin
  select building_id into v_building_id from rooms where id = p_room_id;
  if v_building_id is null then
    raise exception 'Không tìm thấy phòng %', p_room_id;
  end if;

  -- N5: snapshot chỉ số và số tiền tại thời điểm lập
  insert into invoices (
    building_id, room_id, contract_id, code, type, issue_date,
    utility_period, service_period,
    elec_start, elec_end, water_start, water_end, note
  ) values (
    v_building_id, p_room_id, p_contract_id, p_code, p_type, p_issue_date,
    p_utility_period, p_service_period,
    p_elec_start, p_elec_end, p_water_start, p_water_end, p_note
  ) returning id into v_invoice_id;

  perform replace_invoice_items(v_invoice_id, p_items);

  -- HD-04: lưu bất kỳ hóa đơn nào → mốc hiện tại = chỉ số cuối của hóa đơn đó
  perform apply_meter_mark(
    p_room_id, p_elec_end, p_water_end,
    ('invoice_' || p_type::text)::mark_source,
    p_issue_date, v_invoice_id, null
  );

  return v_invoice_id;
end;
$$;

-- ── HD-02: lập hóa đơn định kỳ ─────────────────────────────────────────────
create function create_periodic_invoice(
  p_room_id        uuid,
  p_contract_id    uuid,
  p_code           text,
  p_issue_date     date,
  p_utility_period text,
  p_service_period text,
  p_elec_start     numeric,
  p_elec_end       numeric,
  p_water_start    numeric,
  p_water_end      numeric,
  p_items          jsonb,
  p_note           text default null
) returns uuid
language sql as $$
  select insert_invoice_with_mark(
    p_room_id, p_contract_id, p_code, 'periodic', p_issue_date,
    p_utility_period, p_service_period,
    p_elec_start, p_elec_end, p_water_start, p_water_end, p_items, p_note
  );
$$;

-- ── HD-01 + S-07: nhận phòng (tạo hợp đồng + hóa đơn nhận phòng) ───────────
create function move_in(
  p_room_id        uuid,
  p_tenant_name    text,
  p_phone          text,
  p_occupants      int,
  p_start_date     date,
  p_deposit        int,
  p_rent           int,
  p_code           text,
  p_service_period text,
  p_elec           numeric,
  p_water          numeric,
  p_items          jsonb,
  p_note           text default null
) returns uuid
language plpgsql as $$
declare
  v_contract_id uuid;
  v_invoice_id  uuid;
begin
  insert into contracts (room_id, tenant_name, phone, occupants, start_date, deposit, rent, active)
  values (p_room_id, p_tenant_name, nullif(p_phone, ''), p_occupants, p_start_date, p_deposit, p_rent, true)
  returning id into v_contract_id;

  -- HD-01: chỉ số đầu = chỉ số cuối = số chốt bàn giao → điện nước = 0
  v_invoice_id := insert_invoice_with_mark(
    p_room_id, v_contract_id, p_code, 'move_in', p_start_date,
    null, p_service_period,
    p_elec, p_elec, p_water, p_water, p_items, p_note
  );

  update rooms set status = 'occupied' where id = p_room_id;

  return v_invoice_id;
end;
$$;

-- ── HD-03 + S-08: trả phòng (hóa đơn tất toán + đóng hợp đồng) ─────────────
create function move_out(
  p_contract_id    uuid,
  p_code           text,
  p_issue_date     date,
  p_utility_period text,
  p_elec_start     numeric,
  p_elec_end       numeric,
  p_water_start    numeric,
  p_water_end      numeric,
  p_items          jsonb,
  p_note           text default null
) returns uuid
language plpgsql as $$
declare
  v_room_id    uuid;
  v_invoice_id uuid;
begin
  select room_id into v_room_id from contracts where id = p_contract_id;
  if v_room_id is null then
    raise exception 'Không tìm thấy hợp đồng %', p_contract_id;
  end if;

  v_invoice_id := insert_invoice_with_mark(
    v_room_id, p_contract_id, p_code, 'move_out', p_issue_date,
    p_utility_period, null,
    p_elec_start, p_elec_end, p_water_start, p_water_end, p_items, p_note
  );

  update contracts set active = false, end_date = p_issue_date where id = p_contract_id;
  update rooms set status = 'vacant' where id = v_room_id;

  return v_invoice_id;
end;
$$;

-- ── HD-06 + HD-08 + HD-08a: sửa hóa đơn ────────────────────────────────────
-- Không lan truyền: chỉ đổi chính hóa đơn này. Ghi đè mốc CHỈ khi hóa đơn này
-- đang sở hữu mốc (HD-08a) — nếu không mốc sẽ nhảy lùi.
create function update_invoice(
  p_invoice_id     uuid,
  p_issue_date     date,
  p_utility_period text,
  p_service_period text,
  p_elec_start     numeric,
  p_elec_end       numeric,
  p_water_start    numeric,
  p_water_end      numeric,
  p_items          jsonb,
  p_note           text default null
) returns boolean
language plpgsql as $$
declare
  v_inv        invoices%rowtype;
  v_room       rooms%rowtype;
  v_owns_mark  boolean;
begin
  select * into v_inv from invoices where id = p_invoice_id;
  if not found then
    raise exception 'Không tìm thấy hóa đơn %', p_invoice_id;
  end if;

  select * into v_room from rooms where id = v_inv.room_id;

  -- HD-08a: hóa đơn này có đang sở hữu mốc không?
  v_owns_mark := v_room.current_elec  = v_inv.elec_end
             and v_room.current_water = v_inv.water_end;

  update invoices
     set issue_date     = p_issue_date,
         utility_period = p_utility_period,
         service_period = p_service_period,
         elec_start     = p_elec_start,
         elec_end       = p_elec_end,
         water_start    = p_water_start,
         water_end      = p_water_end,
         note           = p_note
   where id = p_invoice_id;

  perform replace_invoice_items(p_invoice_id, p_items);

  if v_owns_mark and (p_elec_end <> v_inv.elec_end or p_water_end <> v_inv.water_end) then
    perform apply_meter_mark(
      v_inv.room_id, p_elec_end, p_water_end,
      ('invoice_' || v_inv.type::text)::mark_source,
      p_issue_date, p_invoice_id, 'Sửa hóa đơn'
    );
  end if;

  return v_owns_mark;
end;
$$;

-- ── HD-11: sửa mốc thủ công (thay công tơ) ─────────────────────────────────
create function set_meter_mark(
  p_room_id        uuid,
  p_elec           numeric,
  p_water          numeric,
  p_effective_date date,
  p_note           text default null
) returns void
language sql as $$
  select apply_meter_mark(p_room_id, p_elec, p_water, 'manual', p_effective_date, null, p_note);
$$;

-- ── TT-01: lập phiếu thu ───────────────────────────────────────────────────
create function create_receipt(
  p_invoice_id   uuid,
  p_receipt_date date,
  p_items        jsonb                    -- [{fee, amount}]
) returns uuid
language plpgsql as $$
declare
  v_receipt_id uuid;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'Phiếu thu phải có ít nhất một khoản';
  end if;

  insert into receipts (invoice_id, receipt_date)
  values (p_invoice_id, p_receipt_date)
  returning id into v_receipt_id;

  insert into receipt_items (receipt_id, fee, amount)
  select v_receipt_id, (value->>'fee')::fee_type, (value->>'amount')::int
    from jsonb_array_elements(p_items);

  return v_receipt_id;
end;
$$;

-- ── TT-04: sửa số tiền của một bản ghi thu (không có hủy phiếu) ────────────
create function update_receipt_item(
  p_receipt_id uuid,
  p_fee        fee_type,
  p_amount     int
) returns void
language plpgsql as $$
begin
  update receipt_items set amount = p_amount
   where receipt_id = p_receipt_id and fee = p_fee;

  if not found then
    raise exception 'Phiếu thu % không có khoản %', p_receipt_id, p_fee;
  end if;

  update receipts set edited = true where id = p_receipt_id;
end;
$$;
