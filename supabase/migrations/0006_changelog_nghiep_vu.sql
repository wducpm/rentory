-- ═══════════════════════════════════════════════════════════════════════════
-- 0006 — CHANGELOG nghiệp vụ 03/09/2026 (docs/CHANGELOG-nghiep-vu.md)
-- CR-01 bỏ trạng thái Bảo trì · CR-02 danh sách người ở · CR-05 bỏ base_rent
-- ═══════════════════════════════════════════════════════════════════════════

-- ── CR-02 · bảng người ở ───────────────────────────────────────────────────
-- Số người ở = ĐẾM SỐ DÒNG, không lưu cột riêng (BR-P15) để tránh hai nguồn
-- sự thật lệch nhau.
create table if not exists contract_occupants (
  id uuid primary key default gen_random_uuid(),
  contract_id uuid not null references contracts(id) on delete cascade,
  full_name text not null,                    -- BR-P17: bắt buộc mọi người
  phone text,                                 -- BR-P17: bắt buộc riêng người đại diện (validate ở app)
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

-- BR-P14: đúng một người đại diện trên mỗi hợp đồng
create unique index if not exists one_primary_per_contract
  on contract_occupants (contract_id) where is_primary;
create index if not exists contract_occupants_contract
  on contract_occupants (contract_id);

-- Di trú dữ liệu đang có: mỗi hợp đồng cũ có đúng một tên → thành người đại diện.
-- `occupants` cũ chỉ là con số nên không dựng lại được tên những người còn lại;
-- sinh dòng khuyết danh cho đủ số để phí dịch vụ chung không đổi sau khi di trú.
insert into contract_occupants (contract_id, full_name, phone, is_primary)
select c.id, c.tenant_name, c.phone, true
from contracts c
where not exists (
  select 1 from contract_occupants o where o.contract_id = c.id
);

insert into contract_occupants (contract_id, full_name, phone, is_primary)
select c.id, 'Người ở ' || g.n, null, false
from contracts c
cross join lateral generate_series(2, greatest(c.occupants, 1)) as g(n)
where c.occupants > 1
  and (select count(*) from contract_occupants o where o.contract_id = c.id) = 1;

alter table contract_occupants enable row level security;

create policy own_contract_occupants on contract_occupants
  for all to authenticated
  using (is_my_building(building_of_room(
    (select room_id from contracts where contracts.id = contract_id))))
  with check (is_my_building(building_of_room(
    (select room_id from contracts where contracts.id = contract_id))));

alter table contracts drop column if exists tenant_name;
alter table contracts drop column if exists phone;
alter table contracts drop column if exists occupants;

-- ── CR-01 · bỏ trạng thái Bảo trì ──────────────────────────────────────────
-- Chỉ còn Đang thuê / Trống, mà hai giá trị này tương ứng 1-1 với "có/không có
-- hợp đồng hiệu lực". Lưu thành cột riêng chỉ tạo cơ hội lệch với contracts.active.
alter table rooms drop column if exists status;
drop type if exists room_status;

-- ── CR-05 · giá thuê chỉ thuộc hợp đồng ────────────────────────────────────
-- Hai khách khác nhau ở cùng phòng có thể có giá khác nhau; giữ hai nguồn giá
-- sẽ dẫn tới lệch. Gợi ý giá khi nhận phòng lấy từ hợp đồng gần nhất (FR-209).
alter table rooms drop column if exists base_rent;

-- ── CR-04 · chặn đổi tên phòng đã có hóa đơn ───────────────────────────────
-- Mã hóa đơn snapshot số phòng (HĐ-P201-…). Đổi tên sẽ làm mã cũ lệch thực tế
-- nên chặn ở tầng DB luôn, không chỉ ở ứng dụng (BR-P12, BR-S10).
create or replace function guard_room_code_rename() returns trigger
language plpgsql as $$
begin
  if new.code is distinct from old.code
     and exists (select 1 from invoices where room_id = old.id) then
    raise exception 'Phòng % đã phát sinh hóa đơn nên không đổi được tên', old.code
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists rooms_guard_code_rename on rooms;
create trigger rooms_guard_code_rename
  before update on rooms
  for each row execute function guard_room_code_rename();

-- ── CR-02 · RPC nhận danh sách người ở thay cho tenant_name/phone/occupants ─
drop function if exists move_in(uuid, text, text, int, date, int, int, text, text, numeric, numeric, jsonb, text, date, date);
drop function if exists update_contract(uuid, text, text, int, int, date);

-- p_occupants: [{full_name, phone, is_primary}] — đúng một dòng is_primary
create function replace_contract_occupants(p_contract_id uuid, p_occupants jsonb)
returns void
language plpgsql as $$
declare
  v_count int;
begin
  select count(*) into v_count from jsonb_array_elements(p_occupants);
  if v_count < 1 then
    raise exception 'Hợp đồng phải có ít nhất một người ở';
  end if;

  select count(*) into v_count
  from jsonb_array_elements(p_occupants) e
  where coalesce((e.value->>'is_primary')::boolean, false);
  if v_count <> 1 then
    raise exception 'Phải có đúng một người đại diện (đang có %)', v_count;
  end if;

  delete from contract_occupants where contract_id = p_contract_id;

  insert into contract_occupants (contract_id, full_name, phone, is_primary)
  select p_contract_id,
         value->>'full_name',
         nullif(value->>'phone', ''),
         coalesce((value->>'is_primary')::boolean, false)
    from jsonb_array_elements(p_occupants);
end;
$$;

create function move_in(
  p_room_id        uuid,
  p_start_date     date,
  p_deposit        int,
  p_rent           int,
  p_code           text,
  p_service_period text,
  p_elec           numeric,
  p_water          numeric,
  p_items          jsonb,
  p_occupants      jsonb,
  p_note           text default null,
  p_contract_start date default null,
  p_end_date       date default null
) returns uuid
language plpgsql as $$
declare
  v_contract_id uuid;
  v_invoice_id  uuid;
begin
  insert into contracts (room_id, start_date, end_date, deposit, rent, active)
  values (p_room_id, coalesce(p_contract_start, p_start_date), p_end_date,
          p_deposit, p_rent, true)
  returning id into v_contract_id;

  perform replace_contract_occupants(v_contract_id, p_occupants);

  -- HD-01: chỉ số đầu = chỉ số cuối = số chốt bàn giao → điện nước = 0
  v_invoice_id := insert_invoice_with_mark(
    p_room_id, v_contract_id, p_code, 'move_in', p_start_date,
    null, p_service_period,
    p_elec, p_elec, p_water, p_water, p_items, p_note
  );

  return v_invoice_id;
end;
$$;

-- Sửa hợp đồng: chỉ đổi điều khoản từ đây về sau. Hóa đơn đã lập giữ nguyên
-- snapshot (N5), phiếu thu không đổi (HD-08). Ngày vào và cọc gốc không sửa.
create function update_contract(
  p_contract_id uuid,
  p_rent        int,
  p_end_date    date default null,
  p_occupants   jsonb default null
) returns void
language plpgsql as $$
begin
  update contracts
     set rent = p_rent, end_date = p_end_date
   where id = p_contract_id;

  if not found then
    raise exception 'Không tìm thấy hợp đồng %', p_contract_id;
  end if;

  if p_occupants is not null then
    perform replace_contract_occupants(p_contract_id, p_occupants);
  end if;
end;
$$;

-- move_out không còn set rooms.status vì cột đã bỏ (CR-01); trạng thái suy ra
-- từ contracts.active.
create or replace function move_out(
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

  return v_invoice_id;
end;
$$;
