-- ═══════════════════════════════════════════════════════════════════════════
-- 0004 — Thời hạn hợp đồng
-- S-07 nhận phòng cho nhập ngày bắt đầu / kết thúc hợp đồng (mặc định bắt đầu
-- = ngày nhận phòng). S-03 cho sửa lại thông tin hợp đồng đang hiệu lực.
-- ═══════════════════════════════════════════════════════════════════════════

-- move_in: tách ngày bắt đầu hợp đồng khỏi ngày nhận phòng, thêm ngày kết thúc.
-- p_start_date vẫn là ngày nhận phòng (issue_date của hóa đơn nhận phòng);
-- p_contract_start mặc định bằng nó nếu không truyền.
create or replace function move_in(
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
  p_note           text default null,
  p_contract_start date default null,
  p_end_date       date default null
) returns uuid
language plpgsql as $$
declare
  v_contract_id uuid;
  v_invoice_id  uuid;
begin
  insert into contracts (
    room_id, tenant_name, phone, occupants,
    start_date, end_date, deposit, rent, active
  ) values (
    p_room_id, p_tenant_name, nullif(p_phone, ''), p_occupants,
    coalesce(p_contract_start, p_start_date), p_end_date, p_deposit, p_rent, true
  )
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

-- Sửa thông tin hợp đồng đang hiệu lực (S-03).
-- Chỉ đổi điều khoản từ đây về sau: hóa đơn đã lập giữ nguyên snapshot (N5),
-- phiếu thu đã ghi không đổi (HD-08 không lan truyền).
-- Ngày vào và cọc gốc KHÔNG sửa được — chúng đã nằm trên hóa đơn nhận phòng.
create function update_contract(
  p_contract_id uuid,
  p_tenant_name text,
  p_phone       text,
  p_occupants   int,
  p_rent        int,
  p_end_date    date default null
) returns void
language plpgsql as $$
begin
  update contracts
     set tenant_name = p_tenant_name,
         phone       = nullif(p_phone, ''),
         occupants   = p_occupants,
         rent        = p_rent,
         end_date    = p_end_date
   where id = p_contract_id;

  if not found then
    raise exception 'Không tìm thấy hợp đồng %', p_contract_id;
  end if;
end;
$$;
