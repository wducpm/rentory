-- ═══════════════════════════════════════════════════════════════════════════
-- 0009 — CCCD của từng người ở
-- Mỗi người ở giờ khai ba trường: họ tên · SĐT · CCCD.
-- Không bắt buộc (nhiều hợp đồng cũ chưa thu thập), nhưng có chỗ lưu tử tế
-- thay vì nhét vào ô tên như dữ liệu nguồn của P.403 đang làm.
-- ═══════════════════════════════════════════════════════════════════════════

alter table contract_occupants
  add column if not exists national_id text;

-- Ghi lại danh sách người ở, giờ mang thêm CCCD.
create or replace function replace_contract_occupants(
  p_contract_id uuid,
  p_occupants   jsonb
) returns void
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

  insert into contract_occupants
    (contract_id, full_name, phone, national_id, is_primary)
  select p_contract_id,
         value->>'full_name',
         nullif(value->>'phone', ''),
         nullif(value->>'national_id', ''),
         coalesce((value->>'is_primary')::boolean, false)
    from jsonb_array_elements(p_occupants);
end;
$$;

-- Dữ liệu nguồn nhét CCCD vào ô tên của P.403; tách ra đúng cột.
update contract_occupants
   set full_name   = 'Vi Tú Vi',
       national_id = '025306000478'
 where full_name like 'Vi Tú Vi%'
   and national_id is null;
