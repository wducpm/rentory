-- ═══════════════════════════════════════════════════════════════════════════
-- Rentory · 0001_init
-- Nghiệp vụ hóa đơn phòng: mốc công tơ, 3 loại hóa đơn, thu tiền.
-- Tham chiếu quy tắc: HANDOFF mục 4.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Enums ──────────────────────────────────────────────────────────────────
create type room_status  as enum ('occupied','vacant','maintenance');
create type invoice_type as enum ('move_in','periodic','move_out');
create type fee_type     as enum ('rent','elec','water','internet','common','deposit','deposit_refund');
create type mark_source  as enum ('invoice_move_in','invoice_periodic','invoice_move_out','manual');

-- ── Tòa nhà ────────────────────────────────────────────────────────────────
create table buildings (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                        -- '190nguyentrai' → subdomain
  name text not null,                               -- '190 Nguyễn Trãi'
  address text,
  admin_id uuid not null references auth.users(id) on delete restrict, -- 1 admin / tòa
  created_at timestamptz not null default now()
);

create table building_settings (
  building_id uuid primary key references buildings(id) on delete cascade,
  elec_price   int not null default 3800,           -- đ / số
  water_price  int not null default 30000,          -- đ / khối
  internet_fee int not null default 100000,         -- đ / phòng / kỳ
  common_fee   int not null default 150000,         -- đ / người / kỳ
  updated_at timestamptz not null default now()
);

-- ── Phòng ──────────────────────────────────────────────────────────────────
create table rooms (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  code text not null,                               -- '201'
  floor int,
  base_rent int not null default 0,
  status room_status not null default 'vacant',
  current_elec  numeric not null default 0,         -- N1: mốc hiện tại (điện)
  current_water numeric not null default 0,         -- N1: mốc hiện tại (nước)
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  unique (building_id, code)
);
create index rooms_building on rooms (building_id) where not archived;

-- ── Hợp đồng thuê ──────────────────────────────────────────────────────────
create table contracts (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  tenant_name text not null,
  phone text,
  occupants int not null default 1 check (occupants >= 1),
  start_date date not null,
  end_date date,
  deposit int not null,                             -- bắt buộc khai báo khi nhận phòng
  rent int not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- Một phòng chỉ có tối đa 1 hợp đồng đang hiệu lực
create unique index one_active_contract_per_room on contracts (room_id) where active;
create index contracts_room on contracts (room_id, start_date desc);

-- ── Hóa đơn ────────────────────────────────────────────────────────────────
create table invoices (
  id uuid primary key default gen_random_uuid(),
  building_id uuid not null references buildings(id) on delete cascade,
  room_id     uuid not null references rooms(id)     on delete cascade,
  contract_id uuid not null references contracts(id) on delete cascade,
  code text not null,                               -- mã lưu, đủ năm (4.4)
  type invoice_type not null,
  issue_date date not null,                         -- ngày lập / ngày chốt số
  utility_period char(7),                           -- 'YYYY-MM', NULL với move_in
  service_period char(7),                           -- 'YYYY-MM', NULL với move_out
  -- N5: snapshot chỉ số tại thời điểm lập, không tính lại
  elec_start  numeric not null,
  elec_end    numeric not null,
  water_start numeric not null,
  water_end   numeric not null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (building_id, code),
  -- HD-09: chặn chỉ số cuối < chỉ số đầu. Thay công tơ (HD-11) xử lý bằng
  -- sửa mốc thủ công TRƯỚC khi lập hóa đơn nên vẫn thỏa ràng buộc này.
  constraint invoice_readings_forward check (elec_end >= elec_start and water_end >= water_start),
  -- 4.3: move_in không có kỳ điện nước; move_out không có kỳ dịch vụ
  constraint invoice_periods_by_type check (
    case type
      when 'move_in'  then utility_period is null     and service_period is not null
      when 'periodic' then utility_period is not null and service_period is not null
      when 'move_out' then utility_period is not null and service_period is null
    end
  ),
  constraint invoice_period_format check (
    (utility_period is null or utility_period ~ '^\d{4}-\d{2}$') and
    (service_period  is null or service_period  ~ '^\d{4}-\d{2}$')
  )
);
create index invoices_room_date on invoices (room_id, issue_date desc, created_at desc);
create index invoices_contract  on invoices (contract_id);

create table invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  fee fee_type not null,
  amount int not null,                              -- N7: độc lập với chỉ số
  is_deposit boolean not null default false,        -- HD-15: loại khỏi doanh thu
  unique (invoice_id, fee)
);
create index invoice_items_invoice on invoice_items (invoice_id);

-- ── Log ghi đè mốc công tơ (N3) ────────────────────────────────────────────
create table meter_mark_logs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references rooms(id) on delete cascade,
  effective_date date not null,
  elec  numeric not null,                           -- giá trị sau ghi đè
  water numeric not null,
  prev_elec  numeric,                               -- giá trị trước
  prev_water numeric,
  source mark_source not null,                      -- N2: 4 nguồn ghi đè
  invoice_id uuid references invoices(id) on delete set null,
  note text,
  created_at timestamptz not null default now()
);
create index meter_mark_logs_room on meter_mark_logs (room_id, effective_date desc, created_at desc);

-- ── Thu tiền (TT-01) ───────────────────────────────────────────────────────
create table receipts (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references invoices(id) on delete cascade,
  receipt_date date not null,
  edited boolean not null default false,            -- TT-04: sửa thay vì hủy
  created_at timestamptz not null default now()
);
create index receipts_invoice on receipts (invoice_id, receipt_date desc, created_at desc);

create table receipt_items (
  id uuid primary key default gen_random_uuid(),
  receipt_id uuid not null references receipts(id) on delete cascade,
  fee fee_type not null,
  amount int not null,
  unique (receipt_id, fee)
);

-- TT-03: số ghi nhận của một khoản = BẢN GHI MỚI NHẤT, không cộng dồn.
create view recognized_items
with (security_invoker = on) as
select distinct on (r.invoice_id, ri.fee)
  r.invoice_id,
  ri.fee,
  ri.amount,
  r.receipt_date,
  r.id as receipt_id
from receipts r
join receipt_items ri on ri.receipt_id = r.id
order by r.invoice_id, ri.fee, r.receipt_date desc, r.created_at desc;

-- ── updated_at ─────────────────────────────────────────────────────────────
create function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger contracts_updated_at         before update on contracts         for each row execute function set_updated_at();
create trigger invoices_updated_at          before update on invoices          for each row execute function set_updated_at();
create trigger building_settings_updated_at before update on building_settings for each row execute function set_updated_at();

-- ═══════════════════════════════════════════════════════════════════════════
-- RLS — 1 admin / tòa nhà. Mọi bảng dẫn về buildings.admin_id = auth.uid().
-- ═══════════════════════════════════════════════════════════════════════════
create function is_my_building(b uuid) returns boolean
language sql stable security definer
set search_path = public, pg_temp as
$$ select exists (select 1 from buildings where id = b and admin_id = auth.uid()); $$;

create function building_of_room(r uuid) returns uuid
language sql stable security definer
set search_path = public, pg_temp as
$$ select building_id from rooms where id = r; $$;

create function building_of_invoice(i uuid) returns uuid
language sql stable security definer
set search_path = public, pg_temp as
$$ select building_id from invoices where id = i; $$;

create function building_of_receipt(rc uuid) returns uuid
language sql stable security definer
set search_path = public, pg_temp as
$$ select i.building_id from receipts r join invoices i on i.id = r.invoice_id where r.id = rc; $$;

alter table buildings         enable row level security;
alter table building_settings enable row level security;
alter table rooms             enable row level security;
alter table contracts         enable row level security;
alter table invoices          enable row level security;
alter table invoice_items     enable row level security;
alter table meter_mark_logs   enable row level security;
alter table receipts          enable row level security;
alter table receipt_items     enable row level security;

create policy own_building on buildings
  for all to authenticated
  using (admin_id = auth.uid()) with check (admin_id = auth.uid());

-- có building_id trực tiếp
create policy own_building_settings on building_settings
  for all to authenticated
  using (is_my_building(building_id)) with check (is_my_building(building_id));

create policy own_rooms on rooms
  for all to authenticated
  using (is_my_building(building_id)) with check (is_my_building(building_id));

create policy own_invoices on invoices
  for all to authenticated
  using (is_my_building(building_id)) with check (is_my_building(building_id));

-- qua room
create policy own_contracts on contracts
  for all to authenticated
  using (is_my_building(building_of_room(room_id)))
  with check (is_my_building(building_of_room(room_id)));

create policy own_meter_mark_logs on meter_mark_logs
  for all to authenticated
  using (is_my_building(building_of_room(room_id)))
  with check (is_my_building(building_of_room(room_id)));

-- qua invoice
create policy own_invoice_items on invoice_items
  for all to authenticated
  using (is_my_building(building_of_invoice(invoice_id)))
  with check (is_my_building(building_of_invoice(invoice_id)));

create policy own_receipts on receipts
  for all to authenticated
  using (is_my_building(building_of_invoice(invoice_id)))
  with check (is_my_building(building_of_invoice(invoice_id)));

-- qua receipt → invoice
create policy own_receipt_items on receipt_items
  for all to authenticated
  using (is_my_building(building_of_receipt(receipt_id)))
  with check (is_my_building(building_of_receipt(receipt_id)));

-- Không cấp quyền cho vai trò ẩn danh
revoke all on all tables in schema public from anon;
grant select on recognized_items to authenticated;
