-- Seed tòa nhà đầu tiên. Chạy sau khi đã tạo tài khoản admin trong auth.users.
-- Danh sách phòng KHÔNG seed ở đây — thêm qua màn Cài đặt toà (S-10).
insert into buildings (slug, name, address)
values ('190nguyentrai', '190 Nguyễn Trãi', '190 Nguyễn Trãi, Thanh Xuân, Hà Nội')
on conflict (slug) do nothing;

insert into building_settings (building_id, elec_price, water_price, internet_fee, common_fee)
select b.id, 3800, 30000, 100000, 150000
from buildings b
where b.slug = '190nguyentrai'
on conflict (building_id) do nothing;

-- 0008: quyền truy cập nằm ở building_admins, một tòa nhiều tài khoản được.
insert into building_admins (building_id, user_id)
select b.id, u.id
from buildings b, auth.users u
where b.slug = '190nguyentrai'
  and u.email in ('admin@rentory.local', '190nt@rentory.local')
on conflict do nothing;
