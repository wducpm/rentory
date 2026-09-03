-- Seed tòa nhà đầu tiên. Chạy sau khi đã tạo tài khoản admin trong auth.users.
-- Danh sách phòng KHÔNG seed ở đây — thêm qua màn Cài đặt toà (S-10).
insert into buildings (slug, name, address, admin_id)
select '190nguyentrai', '190 Nguyễn Trãi', '190 Nguyễn Trãi, Thanh Xuân, Hà Nội', u.id
from auth.users u
where u.email = 'admin@rentory.local'
on conflict (slug) do nothing;

insert into building_settings (building_id, elec_price, water_price, internet_fee, common_fee)
select b.id, 3800, 30000, 100000, 150000
from buildings b
where b.slug = '190nguyentrai'
on conflict (building_id) do nothing;
