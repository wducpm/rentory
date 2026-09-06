-- 0006 gỡ move_in theo chữ ký của 0004 (có p_contract_start/p_end_date), nhưng
-- bản gốc từ 0002 vẫn còn nằm lại thành overload. Bản cũ đó insert vào
-- contracts.tenant_name/phone/occupants — những cột đã bị 0006 xóa — nên gọi
-- trúng nó sẽ lỗi. Gỡ hẳn để move_in chỉ còn đúng một chữ ký.
drop function if exists move_in(
  uuid, text, text, integer, date, integer, integer, text, text,
  numeric, numeric, jsonb, text
);
