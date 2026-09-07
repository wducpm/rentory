"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { currentBuilding } from "@/lib/building";
import { existingInvoiceCodes, roomHasInvoices } from "@/lib/data";
import { buildInvoiceCode, nextCodeSeq, type InvoiceType } from "@/lib/billing";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string };

function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

const itemSchema = z.object({
  fee: z.enum([
    "rent",
    "elec",
    "water",
    "internet",
    "common",
    "deposit",
    "deposit_refund",
  ]),
  amount: z.number().int(),
  is_deposit: z.boolean().default(false),
});

const readingSchema = z.number().min(0);

/** CR-02 · CR-03 — danh sách người ở. BR-P17 validate ở đây, không ở DB. */
const occupantsSchema = z
  .array(
    z.object({
      full_name: z.string().trim().min(1, "Chưa nhập họ tên của một người ở"),
      phone: z.string().trim().default(""),
      national_id: z.string().trim().default(""),
      is_primary: z.boolean().default(false),
    }),
  )
  .min(1, "Phải có ít nhất một người ở")
  .superRefine((list, ctx) => {
    const primaries = list.filter((o) => o.is_primary);
    if (primaries.length !== 1)
      ctx.addIssue({
        code: "custom",
        message: "Phải chọn đúng một người đại diện",
      });
    // BR-P17: SĐT bắt buộc riêng với người đại diện
    if (primaries.length === 1 && !primaries[0].phone)
      ctx.addIssue({
        code: "custom",
        message: "Người đại diện bắt buộc có số điện thoại",
      });
  });

/** Sinh mã lưu, tự thêm hậu tố khi trùng trong cùng kỳ (4.4). */
async function makeCode(
  buildingId: string,
  roomCode: string,
  type: InvoiceType,
  utility: string | null,
  service: string | null,
) {
  const base = buildInvoiceCode(roomCode, type, utility, service);
  const seq = nextCodeSeq(base, await existingInvoiceCodes(buildingId));
  return buildInvoiceCode(roomCode, type, utility, service, seq);
}

async function ctx() {
  const building = await currentBuilding();
  if (!building) throw new Error("Không xác định được tòa nhà.");
  return { building, supabase: await createClient() };
}

// ── S-10 · cài đặt tòa ────────────────────────────────────────────────────
const settingsSchema = z.object({
  elec_price: z.number().int().min(0),
  water_price: z.number().int().min(0),
  internet_fee: z.number().int().min(0),
  common_fee: z.number().int().min(0),
  invoice_note: z.string().nullable().default(null),
});

export async function saveSettings(
  input: z.input<typeof settingsSchema>,
): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { building, supabase } = await ctx();
  const { error } = await supabase
    .from("building_settings")
    .upsert({ building_id: building.id, ...parsed.data });

  if (error) return fail(error.message);
  revalidateSettings();
  return { ok: true, data: undefined };
}

function revalidateSettings() {
  revalidatePath("/settings");
  revalidatePath("/invoices", "layout");
}

// ── S-10 · quản lý phòng ──────────────────────────────────────────────────
// CR-05: giá thuê thuộc hợp đồng, phòng không còn cột giá.
// BR-S02: admin chỉ nhập phần số, tiền tố P do hệ thống gắn khi hiển thị.
const roomSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{2,4}$/, "Số phòng phải là 2–4 chữ số, không kèm chữ P"),
  floor: z.number().int().nullable(),
});

export async function createRoom(
  input: z.input<typeof roomSchema>,
): Promise<ActionResult> {
  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { building, supabase } = await ctx();
  const { error } = await supabase
    .from("rooms")
    .insert({ building_id: building.id, ...parsed.data });

  if (error)
    return fail(
      error.code === "23505"
        ? `Phòng ${parsed.data.code} đã tồn tại.`
        : error.message,
    );

  revalidatePath("/settings");
  revalidatePath("/rooms");
  return { ok: true, data: undefined };
}

export async function updateRoom(
  roomId: string,
  input: z.input<typeof roomSchema>,
): Promise<ActionResult> {
  const parsed = roomSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { supabase } = await ctx();

  // CR-04 · BR-P12/BR-S10: mã hóa đơn snapshot số phòng, đổi tên sẽ làm mã cũ
  // lệch thực tế. Trigger ở DB cũng chặn, đây là lớp báo lỗi dễ hiểu cho admin.
  const { data: current } = await supabase
    .from("rooms")
    .select("code")
    .eq("id", roomId)
    .maybeSingle();

  if (current && current.code !== parsed.data.code && (await roomHasInvoices(roomId)))
    return fail(
      `Phòng ${current.code} đã phát sinh hóa đơn nên không đổi được tên. Mã hóa đơn đã lưu số phòng cũ.`,
    );

  const { error } = await supabase
    .from("rooms")
    .update(parsed.data)
    .eq("id", roomId);

  if (error) return fail(error.message);
  revalidatePath("/settings");
  revalidatePath("/rooms");
  revalidatePath(`/rooms/${roomId}`);
  return { ok: true, data: undefined };
}

/**
 * BR-S06/BR-S07 — loại phòng khỏi danh sách cho thuê.
 * CR-07: không có chức năng khôi phục ở v1, nên chỉ nhận một chiều.
 */
export async function archiveRoom(roomId: string): Promise<ActionResult> {
  const { supabase } = await ctx();

  // BR-S06: phòng đang có hợp đồng hiệu lực phải trả phòng trước
  const { data: active } = await supabase
    .from("contracts")
    .select("id")
    .eq("room_id", roomId)
    .eq("active", true)
    .maybeSingle();

  if (active)
    return fail("Phòng đang có hợp đồng hiệu lực. Trả phòng trước khi lưu trữ.");

  const { error } = await supabase
    .from("rooms")
    .update({ archived: true })
    .eq("id", roomId);

  if (error) return fail(error.message);
  revalidatePath("/settings");
  revalidatePath("/rooms");
  return { ok: true, data: undefined };
}

// ── HD-11 · sửa mốc thủ công ──────────────────────────────────────────────
const markSchema = z.object({
  room_id: z.string().uuid(),
  elec: readingSchema,
  water: readingSchema,
  effective_date: z.string(),
  note: z.string().trim().min(1, "Ghi rõ lý do sửa mốc (VD: thay công tơ)"),
});

export async function setMeterMark(
  input: z.input<typeof markSchema>,
): Promise<ActionResult> {
  const parsed = markSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { supabase } = await ctx();
  const { error } = await supabase.rpc("set_meter_mark", {
    p_room_id: parsed.data.room_id,
    p_elec: parsed.data.elec,
    p_water: parsed.data.water,
    p_effective_date: parsed.data.effective_date,
    p_note: parsed.data.note,
  });

  if (error) return fail(error.message);
  revalidatePath("/meters");
  revalidatePath(`/rooms/${parsed.data.room_id}`);
  return { ok: true, data: undefined };
}

// ── HD-02 · S-06 chốt kỳ ──────────────────────────────────────────────────
const periodicSchema = z.object({
  room_id: z.string().uuid(),
  contract_id: z.string().uuid(),
  room_code: z.string(),
  issue_date: z.string(),
  utility_period: z.string(),
  service_period: z.string(),
  elec_start: readingSchema,
  elec_end: readingSchema,
  water_start: readingSchema,
  water_end: readingSchema,
  items: z.array(itemSchema),
  note: z.string().nullable().default(null),
});

/**
 * FR-105 + BR-M07 — lập hóa đơn định kỳ.
 *
 * Một hợp đồng chỉ có MỘT hóa đơn định kỳ cho mỗi kỳ dịch vụ: nếu kỳ đó đã có
 * hóa đơn thì cập nhật bản đã có thay vì tạo bản thứ hai. Việc ghi đè mốc khi
 * cập nhật do `update_invoice` quyết theo HD-08a — chỉ đổi mốc nếu hóa đơn đó
 * đang giữ mốc, không thì mốc sẽ nhảy lùi.
 */
export async function savePeriodicInvoice(
  input: z.input<typeof periodicSchema>,
): Promise<ActionResult<{ id: string; created: boolean }>> {
  const parsed = periodicSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;

  // BR-M03 / HD-09: chặn lưu khi chỉ số cuối < chỉ số đầu
  if (d.elec_end < d.elec_start || d.water_end < d.water_start)
    return fail(
      "Chỉ số cuối nhỏ hơn chỉ số đầu. Nếu thay công tơ, sửa mốc thủ công trước (HD-11).",
    );

  const { building, supabase } = await ctx();

  const { data: existing } = await supabase
    .from("invoices")
    .select("id")
    .eq("contract_id", d.contract_id)
    .eq("type", "periodic")
    .eq("service_period", d.service_period)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase.rpc("update_invoice", {
      p_invoice_id: existing.id,
      p_issue_date: d.issue_date,
      p_utility_period: d.utility_period,
      p_service_period: d.service_period,
      p_elec_start: d.elec_start,
      p_elec_end: d.elec_end,
      p_water_start: d.water_start,
      p_water_end: d.water_end,
      p_items: d.items,
      p_note: d.note ?? undefined,
    });
    if (error) return fail(error.message);
    revalidateMeters(d.room_id, existing.id);
    return { ok: true, data: { id: existing.id, created: false } };
  }

  const code = await makeCode(
    building.id,
    d.room_code,
    "periodic",
    d.utility_period,
    d.service_period,
  );

  const { data, error } = await supabase.rpc("create_periodic_invoice", {
    p_room_id: d.room_id,
    p_contract_id: d.contract_id,
    p_code: code,
    p_issue_date: d.issue_date,
    p_utility_period: d.utility_period,
    p_service_period: d.service_period,
    p_elec_start: d.elec_start,
    p_elec_end: d.elec_end,
    p_water_start: d.water_start,
    p_water_end: d.water_end,
    p_items: d.items,
    p_note: d.note ?? undefined,
  });

  if (error) return fail(error.message);
  revalidateMeters(d.room_id, data as string);
  return { ok: true, data: { id: data as string, created: true } };
}

function revalidateMeters(roomId: string, invoiceId: string) {
  revalidatePath("/");
  revalidatePath("/rooms");
  revalidatePath("/meters");
  revalidatePath(`/rooms/${roomId}`);
  revalidatePath(`/invoices/${invoiceId}`);
}

// ── HD-01 · S-07 nhận phòng ───────────────────────────────────────────────
const moveInSchema = z.object({
  room_id: z.string().uuid(),
  room_code: z.string(),
  occupants: occupantsSchema,
  start_date: z.string(),
  contract_start: z.string(),
  end_date: z.string().nullable().default(null),
  deposit: z.number().int().min(0),
  rent: z.number().int().min(0),
  service_period: z.string(),
  elec: readingSchema,
  water: readingSchema,
  items: z.array(itemSchema),
  note: z.string().nullable().default(null),
});

export async function moveIn(
  input: z.input<typeof moveInSchema>,
): Promise<ActionResult<string>> {
  const parsed = moveInSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;

  if (d.end_date && d.end_date <= d.contract_start)
    return fail("Ngày kết thúc hợp đồng phải sau ngày bắt đầu.");

  const { building, supabase } = await ctx();
  const code = await makeCode(
    building.id,
    d.room_code,
    "move_in",
    null,
    d.service_period,
  );

  const { data, error } = await supabase.rpc("move_in", {
    p_room_id: d.room_id,
    p_occupants: d.occupants,
    p_start_date: d.start_date,
    p_contract_start: d.contract_start,
    p_end_date: d.end_date ?? undefined,
    p_deposit: d.deposit,
    p_rent: d.rent,
    p_code: code,
    p_service_period: d.service_period,
    p_elec: d.elec,
    p_water: d.water,
    p_items: d.items,
    p_note: d.note ?? undefined,
  });

  if (error)
    return fail(
      error.code === "23505"
        ? "Phòng này đang có hợp đồng hiệu lực."
        : error.message,
    );

  revalidatePath("/");
  revalidatePath("/rooms");
  revalidatePath(`/rooms/${d.room_id}`);
  return { ok: true, data: data as string };
}

// ── HD-03 · S-08 trả phòng ────────────────────────────────────────────────
const moveOutSchema = z.object({
  room_id: z.string().uuid(),
  room_code: z.string(),
  contract_id: z.string().uuid(),
  issue_date: z.string(),
  utility_period: z.string(),
  elec_start: readingSchema,
  elec_end: readingSchema,
  water_start: readingSchema,
  water_end: readingSchema,
  items: z.array(itemSchema),
  note: z.string().nullable().default(null),
});

export async function moveOut(
  input: z.input<typeof moveOutSchema>,
): Promise<ActionResult<string>> {
  const parsed = moveOutSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;

  if (d.elec_end < d.elec_start || d.water_end < d.water_start)
    return fail(
      "Chỉ số cuối nhỏ hơn chỉ số đầu. Nếu thay công tơ, sửa mốc thủ công trước (HD-11).",
    );

  const { building, supabase } = await ctx();
  const code = await makeCode(
    building.id,
    d.room_code,
    "move_out",
    d.utility_period,
    null,
  );

  const { data, error } = await supabase.rpc("move_out", {
    p_contract_id: d.contract_id,
    p_code: code,
    p_issue_date: d.issue_date,
    p_utility_period: d.utility_period,
    p_elec_start: d.elec_start,
    p_elec_end: d.elec_end,
    p_water_start: d.water_start,
    p_water_end: d.water_end,
    p_items: d.items,
    p_note: d.note ?? undefined,
  });

  if (error) return fail(error.message);
  revalidatePath("/");
  revalidatePath("/rooms");
  revalidatePath(`/rooms/${d.room_id}`);
  return { ok: true, data: data as string };
}

// ── HD-06 + HD-08 · sửa hóa đơn ───────────────────────────────────────────
const updateInvoiceSchema = z.object({
  invoice_id: z.string().uuid(),
  issue_date: z.string(),
  utility_period: z.string().nullable(),
  service_period: z.string().nullable(),
  elec_start: readingSchema,
  elec_end: readingSchema,
  water_start: readingSchema,
  water_end: readingSchema,
  items: z.array(itemSchema),
  note: z.string().nullable().default(null),
});

export async function updateInvoice(
  input: z.input<typeof updateInvoiceSchema>,
): Promise<ActionResult<{ markMoved: boolean }>> {
  const parsed = updateInvoiceSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;

  if (d.elec_end < d.elec_start || d.water_end < d.water_start)
    return fail("Chỉ số cuối nhỏ hơn chỉ số đầu (HD-09).");

  const { supabase } = await ctx();
  const { data, error } = await supabase.rpc("update_invoice", {
    p_invoice_id: d.invoice_id,
    p_issue_date: d.issue_date,
    p_utility_period: d.utility_period ?? undefined,
    p_service_period: d.service_period ?? undefined,
    p_elec_start: d.elec_start,
    p_elec_end: d.elec_end,
    p_water_start: d.water_start,
    p_water_end: d.water_end,
    p_items: d.items,
    p_note: d.note ?? undefined,
  });

  if (error) return fail(error.message);
  revalidatePath("/");
  revalidatePath("/rooms");
  revalidatePath(`/invoices/${d.invoice_id}`);
  return { ok: true, data: { markMoved: Boolean(data) } };
}

// ── TT-01 · S-05 thu tiền ─────────────────────────────────────────────────
const receiptSchema = z.object({
  invoice_id: z.string().uuid(),
  receipt_date: z.string(),
  items: z
    .array(z.object({ fee: itemSchema.shape.fee, amount: z.number().int() }))
    .min(1, "Chưa chọn khoản nào để thu"),
});

export async function createReceipt(
  input: z.input<typeof receiptSchema>,
): Promise<ActionResult<string>> {
  const parsed = receiptSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);

  const { supabase } = await ctx();
  const { data, error } = await supabase.rpc("create_receipt", {
    p_invoice_id: parsed.data.invoice_id,
    p_receipt_date: parsed.data.receipt_date,
    p_items: parsed.data.items,
  });

  if (error) return fail(error.message);
  revalidatePath("/");
  revalidatePath("/rooms");
  revalidatePath(`/invoices/${parsed.data.invoice_id}`);
  return { ok: true, data: data as string };
}

// ── TT-04 · sửa số tiền một bản ghi thu (không có hủy phiếu) ──────────────
export async function updateReceiptItem(
  receiptId: string,
  fee: z.infer<typeof itemSchema>["fee"],
  amount: number,
  invoiceId: string,
): Promise<ActionResult> {
  const { supabase } = await ctx();
  const { error } = await supabase.rpc("update_receipt_item", {
    p_receipt_id: receiptId,
    p_fee: fee,
    p_amount: Math.round(amount),
  });

  if (error) return fail(error.message);
  revalidatePath(`/invoices/${invoiceId}`);
  return { ok: true, data: undefined };
}

// ── S-03 · sửa hợp đồng đang hiệu lực ─────────────────────────────────────
// Chỉ đổi điều khoản từ đây về sau. Hóa đơn đã lập giữ nguyên snapshot (N5),
// phiếu thu đã ghi không đổi (HD-08 không lan truyền).
const contractSchema = z.object({
  contract_id: z.string().uuid(),
  rent: z.number().int().min(0),
  end_date: z.string().nullable().default(null),
  occupants: occupantsSchema,
});

export async function updateContract(
  input: z.input<typeof contractSchema>,
): Promise<ActionResult> {
  const parsed = contractSchema.safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0].message);
  const d = parsed.data;

  const { supabase } = await ctx();
  const { error } = await supabase.rpc("update_contract", {
    p_contract_id: d.contract_id,
    p_rent: d.rent,
    p_end_date: d.end_date ?? undefined,
    p_occupants: d.occupants,
  });

  if (error) return fail(error.message);
  revalidatePath("/");
  revalidatePath("/rooms");
  return { ok: true, data: undefined };
}
