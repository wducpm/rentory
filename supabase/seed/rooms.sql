-- Danh sách phòng tòa 190 Nguyễn Trãi (người dùng cung cấp 03/09/2026):
-- tầng 2→7 mỗi tầng 3 phòng, tầng 8 chỉ 2 phòng = 20 phòng.
-- base_rent để 0 — đơn giá thuê từng phòng do admin điền sau ở S-10.
insert into rooms (building_id, code, floor, base_rent)
select b.id, f.floor::text || lpad(r.n::text, 2, '0'), f.floor, 0
from buildings b
cross join generate_series(2, 8) as f(floor)
cross join generate_series(1, 3) as r(n)
where b.slug = '190nguyentrai'
  and not (f.floor = 8 and r.n = 3)          -- tầng 8 chỉ có 2 phòng
on conflict (building_id, code) do nothing;
