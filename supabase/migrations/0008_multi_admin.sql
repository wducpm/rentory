-- ═══════════════════════════════════════════════════════════════════════════
-- 0008 — Nhiều tài khoản quản trị cho một tòa nhà
--
-- Trước: buildings.admin_id, RLS so admin_id = auth.uid() → đúng một tài khoản
-- truy cập được. Thêm tài khoản thứ hai buộc phải đổi mô hình này.
-- Sau: bảng building_admins là NGUỒN DUY NHẤT quyết ai vào được tòa nào.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists building_admins (
  building_id uuid not null references buildings(id) on delete cascade,
  user_id     uuid not null references auth.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (building_id, user_id)
);
create index if not exists building_admins_user on building_admins (user_id);

-- Giữ nguyên quyền của admin đang có
insert into building_admins (building_id, user_id)
select id, admin_id from buildings
on conflict do nothing;

-- Mọi policy đều gọi qua hàm này nên chỉ cần đổi một chỗ.
create or replace function is_my_building(b uuid) returns boolean
language sql stable security definer
set search_path = public, pg_temp as
$$ select exists (
     select 1 from building_admins
     where building_id = b and user_id = auth.uid()
   ); $$;

drop policy if exists own_building on buildings;
create policy own_building on buildings
  for all to authenticated
  using (is_my_building(id)) with check (is_my_building(id));

alter table building_admins enable row level security;
create policy own_building_admin on building_admins
  for select to authenticated
  using (user_id = auth.uid());

-- Bỏ cột cũ để không còn hai nguồn sự thật về quyền truy cập.
alter table buildings drop column if exists admin_id;
