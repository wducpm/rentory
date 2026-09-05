-- ═══════════════════════════════════════════════════════════════════════════
-- 0005 — SRS "Chỉ số & Lập hóa đơn"
-- ═══════════════════════════════════════════════════════════════════════════

-- Mục 8 + AC-14.4: ghi chú cuối hóa đơn, tùy từng tòa, không hard-code vào mẫu.
alter table building_settings
  add column if not exists invoice_note text;

-- BR-M07: một hợp đồng chỉ có MỘT hóa đơn định kỳ cho mỗi kỳ dịch vụ.
-- Bấm "Lập hóa đơn" lần hai cho cùng kỳ phải cập nhật bản đã có, không tạo bản mới.
-- Ràng buộc theo hợp đồng chứ không theo phòng, nên vẫn thỏa HD-10: một phòng
-- có thể có nhiều hóa đơn cùng kỳ nếu thuộc các hợp đồng khác nhau.
create unique index if not exists one_periodic_invoice_per_service_period
  on invoices (contract_id, service_period)
  where type = 'periodic';
