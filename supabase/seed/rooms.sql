-- ═══════════════════════════════════════════════════════════════════════════
-- Danh sách phòng và hợp đồng — 190 Nguyễn Trãi
-- Nguồn: danh-sach-phong-2026-09-07.md (xuất 09:36 07/09/2026, kỳ 2026-09)
-- 21 phòng: tầng 2→8, mỗi tầng 3 phòng. 17 đang thuê, 4 trống.
--
-- Chỉ số điện/nước trong file nguồn là "đầu kỳ" của kỳ 2026-09, tức chính là
-- MỐC HIỆN TẠI của phòng (N1) — điểm bắt đầu để tính hóa đơn kế tiếp.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Phòng ──────────────────────────────────────────────────────────────────
insert into rooms (building_id, code, floor, current_elec, current_water)
select b.id, v.code, v.floor, v.elec, v.water
from buildings b
cross join (values
  ('201', 2, 7233, 175), ('202', 2, 2861,  86), ('203', 2,  582, 205),
  ('301', 3, 3522, 127), ('302', 3,  122, 152), ('303', 3, 4882, 152),
  ('401', 4, 6568, 171), ('402', 4, 5095, 220), ('403', 4, 4909, 150),
  ('501', 5,  113, 159), ('502', 5, 4304, 113), ('503', 5, 5033, 189),
  ('601', 6, 5686, 223), ('602', 6, 3357,  74), ('603', 6, 4567, 162),
  ('701', 7, 7070, 179), ('702', 7, 6228, 146), ('703', 7, 5285, 141),
  ('801', 8, 7342, 432), ('802', 8, 7038, 198), ('803', 8,    0,   0)
) as v(code, floor, elec, water)
where b.slug = '190nguyentrai'
on conflict (building_id, code) do update
  set floor = excluded.floor,
      current_elec = excluded.current_elec,
      current_water = excluded.current_water;

-- ── Hợp đồng đang hiệu lực ─────────────────────────────────────────────────
-- 501, 603, 801, 803 không có ở đây → phòng Trống (BR-P04: trạng thái suy ra
-- từ việc có hay không hợp đồng hiệu lực, không lưu cột riêng).
insert into contracts (room_id, start_date, end_date, deposit, rent, active)
select r.id, v.start_date::date, nullif(v.end_date, '')::date,
       v.deposit, v.rent, true
from rooms r
join buildings b on b.id = r.building_id and b.slug = '190nguyentrai'
join (values
  ('201', '2026-06-01', '2027-07-01', 4000000, 4000000),
  ('202', '2026-05-01', '',           4400000, 4400000),  -- không thời hạn
  ('203', '2025-09-01', '2027-08-31', 4200000, 4200000),
  ('301', '2026-07-01', '2027-06-30', 4000000, 4300000),
  ('302', '2026-08-18', '2027-08-17', 4600000, 4400000),
  ('303', '2026-07-01', '2027-06-30', 4200000, 4200000),
  ('401', '2026-06-01', '2026-12-30', 4000000, 4300000),
  ('402', '2026-09-04', '2027-09-04', 4500000, 4500000),
  ('403', '2026-08-18', '2027-08-18', 4500000, 4500000),
  ('502', '2026-05-01', '2026-10-31', 4200000, 4200000),
  ('503', '2026-07-01', '2027-06-30', 3800000, 4200000),
  ('601', '2026-07-01', '2027-06-30', 4000000, 4000000),
  ('602', '2026-07-01', '2027-06-30', 4700000, 4100000),
  ('701', '2026-03-01', '2026-09-30', 4100000, 4100000),
  ('702', '2026-06-01', '2027-06-30', 4100000, 4100000),
  ('703', '2026-05-01', '2026-10-31', 4300000, 4300000),
  ('802', '2026-03-01', '2027-02-28', 6800000, 6400000)
) as v(code, start_date, end_date, deposit, rent) on v.code = r.code
where not exists (
  select 1 from contracts c where c.room_id = r.id and c.active
);

-- ── Người ở ────────────────────────────────────────────────────────────────
-- BR-P13: lưu danh sách đầy đủ, không chỉ số lượng. BR-P15: số người tính phí
-- dịch vụ chung = số dòng ở đây. BR-P14: đúng một người đại diện mỗi hợp đồng.
insert into contract_occupants (contract_id, full_name, phone, is_primary)
select c.id, v.full_name, nullif(v.phone, ''), v.is_primary
from contracts c
join rooms r on r.id = c.room_id
join buildings b on b.id = r.building_id and b.slug = '190nguyentrai'
join (values
  ('201', 'Minh Hiệp',              '0976151815',  true),
  ('202', 'Luyện Lăng Thu Thảo',    '0814272366',  true),
  ('203', 'Đỗ Quốc Huy',            '09816661930', true),
  ('203', 'Nguyễn Thu Phương',      '0986068317',  false),
  ('301', 'Phạm Quỳnh Trang',       '0833560168',  true),
  ('302', 'Nguyễn Tuyết Mai',       '0326710666',  true),
  ('303', 'Vân Nam',                '0972162903',  true),
  ('303', 'Đỗ Thị Kim Ngân',        '0389404983',  false),
  ('401', 'Nguyễn Hà My',           '0348933191',  true),
  ('401', 'Nguyễn Phương Anh',      '',            false),
  ('402', 'Hoàng Linh',             '0865035992',  true),
  ('402', 'Hồng Phương',            '',            false),
  ('403', 'Vi Tú Vi',               '',            true),
  ('502', 'Lê Thị Hà',              '0878560867',  true),
  ('503', 'Hồ Thị Trang',           '0382409493',  true),
  ('601', 'Hà Thu Trang',           '0868194994',  true),
  ('602', 'Ngô Ngọc Quỳnh',         '0989277238',  true),
  ('701', 'Đặng Đức Quyết',         '0914631325',  true),
  ('701', 'Minh Hằng',              '0834726885',  false),
  ('702', 'Lê Phan Khánh Linh',     '0915834118',  true),
  ('703', 'Lê Phương Thảo',         '0976608159',  true),
  ('703', 'Trà Vy',                 '',            false),
  ('802', 'Đinh Thị Huyền',         '0399380905',  true)
) as v(code, full_name, phone, is_primary) on v.code = r.code
where c.active
  and not exists (
    select 1 from contract_occupants o
    where o.contract_id = c.id and o.full_name = v.full_name
  );
