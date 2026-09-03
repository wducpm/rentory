-- Hai kỳ của hóa đơn vốn nullable (move_in không có kỳ điện nước, move_out
-- không có kỳ dịch vụ). Khai báo `default null` để PostgREST sinh type
-- optional, tránh phải ép kiểu ở tầng TypeScript.
create or replace function update_invoice(
  p_invoice_id     uuid,
  p_issue_date     date,
  p_utility_period text default null,
  p_service_period text default null,
  p_elec_start     numeric default null,
  p_elec_end       numeric default null,
  p_water_start    numeric default null,
  p_water_end      numeric default null,
  p_items          jsonb default '[]'::jsonb,
  p_note           text default null
) returns boolean
language plpgsql as $$
declare
  v_inv       invoices%rowtype;
  v_room      rooms%rowtype;
  v_owns_mark boolean;
begin
  select * into v_inv from invoices where id = p_invoice_id;
  if not found then
    raise exception 'Không tìm thấy hóa đơn %', p_invoice_id;
  end if;

  select * into v_room from rooms where id = v_inv.room_id;

  -- HD-08a: chỉ hóa đơn đang sở hữu mốc mới được ghi đè mốc khi sửa
  v_owns_mark := v_room.current_elec  = v_inv.elec_end
             and v_room.current_water = v_inv.water_end;

  update invoices
     set issue_date     = p_issue_date,
         utility_period = p_utility_period,
         service_period = p_service_period,
         elec_start     = coalesce(p_elec_start,  v_inv.elec_start),
         elec_end       = coalesce(p_elec_end,    v_inv.elec_end),
         water_start    = coalesce(p_water_start, v_inv.water_start),
         water_end      = coalesce(p_water_end,   v_inv.water_end),
         note           = p_note
   where id = p_invoice_id;

  perform replace_invoice_items(p_invoice_id, p_items);

  if v_owns_mark and (p_elec_end <> v_inv.elec_end or p_water_end <> v_inv.water_end) then
    perform apply_meter_mark(
      v_inv.room_id, p_elec_end, p_water_end,
      ('invoice_' || v_inv.type::text)::mark_source,
      p_issue_date, p_invoice_id, 'Sửa hóa đơn'
    );
  end if;

  return v_owns_mark;
end;
$$;
