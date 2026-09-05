import "server-only";
import { createClient } from "@/lib/supabase/server";
import { currentBuilding } from "@/lib/building";
import {
  sortForMeterReading,
  invoiceStatusFromRows,
  paidTotalFromRows,
  unpaidFeesFromRows,
  type FeeType,
  type InvoiceItem,
  type InvoiceType,
} from "@/lib/billing";
import type { Database } from "@/types/database";

type T = Database["public"]["Tables"];
export type RoomRow = T["rooms"]["Row"];
export type ContractRow = T["contracts"]["Row"];
export type InvoiceRow = T["invoices"]["Row"];
export type SettingsRow = T["building_settings"]["Row"];
export type MarkLogRow = T["meter_mark_logs"]["Row"];

export type RecognizedRow = {
  invoice_id: string;
  fee: FeeType;
  amount: number;
  receipt_date: string;
  receipt_id: string;
};

/** Hóa đơn kèm dòng tiền và trạng thái thu đã suy ra (TT-06). */
export type InvoiceWithStatus = InvoiceRow & {
  items: InvoiceItem[];
  total: number;
  paid: number;
  status: "paid" | "due";
  unpaid: FeeType[];
};

export class NoBuildingError extends Error {}

async function requireBuilding() {
  const building = await currentBuilding();
  if (!building) {
    throw new NoBuildingError(
      "Tài khoản này chưa được gán làm admin của tòa nhà nào.",
    );
  }
  return building;
}

export async function getBuildingContext() {
  const building = await requireBuilding();
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("building_settings")
    .select("*")
    .eq("building_id", building.id)
    .maybeSingle();
  return { building, settings: settings ?? null };
}

function decorate(
  invoice: InvoiceRow,
  items: InvoiceItem[],
  recognized: RecognizedRow[],
): InvoiceWithStatus {
  const rows = recognized.filter((r) => r.invoice_id === invoice.id);
  return {
    ...invoice,
    items,
    total: items.reduce((s, i) => s + i.amount, 0),
    paid: paidTotalFromRows(items, rows),
    status: invoiceStatusFromRows(items, rows),
    unpaid: unpaidFeesFromRows(items, rows),
  };
}

export type RoomSummary = {
  room: RoomRow;
  contract: ContractRow | null;
  invoiceCount: number;
  dueCount: number;
  dueAmount: number;
};

/** S-02 — danh sách phòng: trạng thái, khách hiện tại, HĐ chưa thu, mốc hiện tại. */
export async function listRooms(): Promise<{
  building: Awaited<ReturnType<typeof requireBuilding>>;
  rooms: RoomSummary[];
}> {
  const building = await requireBuilding();
  const supabase = await createClient();

  const [roomsRes, contractsRes, invoicesRes, itemsRes, recognizedRes] =
    await Promise.all([
      supabase
        .from("rooms")
        .select("*")
        .eq("building_id", building.id)
        .eq("archived", false)
        .order("code"),
      supabase.from("contracts").select("*").eq("active", true),
      supabase.from("invoices").select("*").eq("building_id", building.id),
      supabase.from("invoice_items").select("*"),
      supabase.from("recognized_items").select("*"),
    ]);

  const invoices = invoicesRes.data ?? [];
  const itemsByInvoice = groupItems(itemsRes.data ?? []);
  const recognized = (recognizedRes.data ?? []) as RecognizedRow[];

  const decorated = invoices.map((inv) =>
    decorate(inv, itemsByInvoice.get(inv.id) ?? [], recognized),
  );

  const rooms = (roomsRes.data ?? []).map((room) => {
    const mine = decorated.filter((i) => i.room_id === room.id);
    const due = mine.filter((i) => i.status === "due");
    return {
      room,
      contract:
        (contractsRes.data ?? []).find((c) => c.room_id === room.id) ?? null,
      invoiceCount: mine.length,
      dueCount: due.length,
      dueAmount: due.reduce((s, i) => s + (i.total - i.paid), 0),
    };
  });

  return { building, rooms };
}

function groupItems(
  rows: T["invoice_items"]["Row"][],
): Map<string, InvoiceItem[]> {
  const map = new Map<string, InvoiceItem[]>();
  for (const r of rows) {
    const list = map.get(r.invoice_id) ?? [];
    list.push({ fee: r.fee, amount: r.amount, is_deposit: r.is_deposit });
    map.set(r.invoice_id, list);
  }
  return map;
}

/** S-03 — chi tiết phòng. */
export async function getRoom(roomId: string) {
  const building = await requireBuilding();
  const supabase = await createClient();

  const [roomRes, contractsRes, invoicesRes, settingsRes] = await Promise.all([
    supabase.from("rooms").select("*").eq("id", roomId).maybeSingle(),
    supabase
      .from("contracts")
      .select("*")
      .eq("room_id", roomId)
      .order("start_date", { ascending: false }),
    supabase
      .from("invoices")
      .select("*")
      .eq("room_id", roomId)
      .order("issue_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("building_settings")
      .select("*")
      .eq("building_id", building.id)
      .maybeSingle(),
  ]);

  if (!roomRes.data) return null;

  const invoiceIds = (invoicesRes.data ?? []).map((i) => i.id);
  const [itemsRes, recognizedRes] = await Promise.all([
    invoiceIds.length
      ? supabase.from("invoice_items").select("*").in("invoice_id", invoiceIds)
      : Promise.resolve({ data: [] as T["invoice_items"]["Row"][] }),
    invoiceIds.length
      ? supabase.from("recognized_items").select("*").in("invoice_id", invoiceIds)
      : Promise.resolve({ data: [] as RecognizedRow[] }),
  ]);

  const itemsByInvoice = groupItems(itemsRes.data ?? []);
  const recognized = (recognizedRes.data ?? []) as RecognizedRow[];

  return {
    building,
    settings: settingsRes.data ?? null,
    room: roomRes.data,
    contracts: contractsRes.data ?? [],
    activeContract: (contractsRes.data ?? []).find((c) => c.active) ?? null,
    invoices: (invoicesRes.data ?? []).map((inv) =>
      decorate(inv, itemsByInvoice.get(inv.id) ?? [], recognized),
    ),
  };
}

/** S-04 — chi tiết hóa đơn + toàn bộ phiếu thu của nó (S-09 cần lịch sử từng lần). */
export async function getInvoice(invoiceId: string) {
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .maybeSingle();
  if (!invoice) return null;

  const [itemsRes, recognizedRes, roomRes, contractRes, receiptsRes, settingsRes] =
    await Promise.all([
      supabase.from("invoice_items").select("*").eq("invoice_id", invoiceId),
      supabase.from("recognized_items").select("*").eq("invoice_id", invoiceId),
      supabase.from("rooms").select("*").eq("id", invoice.room_id).maybeSingle(),
      supabase
        .from("contracts")
        .select("*")
        .eq("id", invoice.contract_id)
        .maybeSingle(),
      supabase
        .from("receipts")
        .select("*, receipt_items(*)")
        .eq("invoice_id", invoiceId)
        .order("receipt_date", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("building_settings")
        .select("*")
        .eq("building_id", invoice.building_id)
        .maybeSingle(),
    ]);

  const items = groupItems(itemsRes.data ?? []).get(invoiceId) ?? [];
  const recognized = (recognizedRes.data ?? []) as RecognizedRow[];

  return {
    invoice: decorate(invoice, items, recognized),
    recognized,
    room: roomRes.data,
    contract: contractRes.data,
    receipts: receiptsRes.data ?? [],
    settings: settingsRes.data ?? null,
  };
}

/**
 * S-06 — lưới chốt kỳ.
 *
 * BR-M02: chỉ phòng đang có hợp đồng hiệu lực. Phòng Trống / Bảo trì không
 * xuất hiện vì không có ai để lập hóa đơn.
 * BR-M01: sắp giảm dần theo số phòng, khớp thứ tự admin đi đọc công tơ.
 *
 * Kèm toàn bộ hóa đơn định kỳ đã lập của các hợp đồng này để màn biết kỳ nào
 * đã chốt (BR-M07) và cho sửa lại chỉ số (FR-106). Một tòa cỡ vài chục phòng
 * nên tải hết một lần rẻ hơn là truy vấn theo từng kỳ admin chọn.
 */
export async function listMeterRows() {
  const building = await requireBuilding();
  const supabase = await createClient();

  const [roomsRes, contractsRes, settingsRes] = await Promise.all([
    supabase
      .from("rooms")
      .select("*")
      .eq("building_id", building.id)
      .eq("archived", false),
    supabase.from("contracts").select("*").eq("active", true),
    supabase
      .from("building_settings")
      .select("*")
      .eq("building_id", building.id)
      .maybeSingle(),
  ]);

  const contracts = contractsRes.data ?? [];
  const occupied = sortForMeterReading(
    (roomsRes.data ?? [])
      .map((room) => ({
        room,
        contract: contracts.find((c) => c.room_id === room.id) ?? null,
      }))
      .filter((r) => r.contract !== null)
      .map((r) => ({ ...r, code: r.room.code })),
  );

  const contractIds = occupied.map((r) => r.contract!.id);
  const invoicesRes = contractIds.length
    ? await supabase
        .from("invoices")
        .select("*")
        .eq("type", "periodic")
        .in("contract_id", contractIds)
    : { data: [] as InvoiceRow[] };

  const invoices = invoicesRes.data ?? [];
  const itemsRes = invoices.length
    ? await supabase
        .from("invoice_items")
        .select("*")
        .in(
          "invoice_id",
          invoices.map((i) => i.id),
        )
    : { data: [] as T["invoice_items"]["Row"][] };

  const itemsByInvoice = groupItems(itemsRes.data ?? []);

  return {
    building,
    settings: settingsRes.data,
    rooms: occupied,
    periodicInvoices: invoices.map((inv) => ({
      ...inv,
      items: itemsByInvoice.get(inv.id) ?? [],
    })),
  };
}

/** S-09 — timeline gộp: hóa đơn · phiếu thu · lần ghi đè mốc. */
export async function getRoomHistory(roomId: string) {
  const supabase = await createClient();

  const [invoicesRes, marksRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("*")
      .eq("room_id", roomId)
      .order("issue_date", { ascending: false }),
    supabase
      .from("meter_mark_logs")
      .select("*")
      .eq("room_id", roomId)
      .order("effective_date", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);

  const invoiceIds = (invoicesRes.data ?? []).map((i) => i.id);
  const receiptsRes = invoiceIds.length
    ? await supabase
        .from("receipts")
        .select("*, receipt_items(*)")
        .in("invoice_id", invoiceIds)
        .order("receipt_date", { ascending: false })
    : { data: [] };

  return {
    invoices: invoicesRes.data ?? [],
    marks: marksRes.data ?? [],
    receipts: receiptsRes.data ?? [],
  };
}

/** Mã hóa đơn đã dùng trong tòa — để tính hậu tố trùng (4.4). */
export async function existingInvoiceCodes(buildingId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("code")
    .eq("building_id", buildingId);
  return (data ?? []).map((r) => r.code);
}

export type { InvoiceType };

export type DashboardData = {
  building: Awaited<ReturnType<typeof requireBuilding>>;
  totalRooms: number;
  occupiedRooms: number;
  vacantRooms: number;
  period: string;
  periodInvoices: number;
  periodPaid: number;
  dueInvoices: (InvoiceWithStatus & {
    roomCode: string;
    tenantName: string | null;
  })[];
  dueAmount: number;
  unreadMeters: number;
};

/** Trang chủ — chỉ dùng dữ liệu trong phạm vi (không doanh thu / lãi lỗ). */
export async function getDashboard(): Promise<DashboardData> {
  const building = await requireBuilding();
  const supabase = await createClient();

  const [roomsRes, contractsRes, invoicesRes, itemsRes, recognizedRes] =
    await Promise.all([
      supabase
        .from("rooms")
        .select("*")
        .eq("building_id", building.id)
        .eq("archived", false)
        .order("code"),
      supabase.from("contracts").select("*").eq("active", true),
      supabase.from("invoices").select("*").eq("building_id", building.id),
      supabase.from("invoice_items").select("*"),
      supabase.from("recognized_items").select("*"),
    ]);

  const rooms = roomsRes.data ?? [];
  const contracts = contractsRes.data ?? [];
  const itemsByInvoice = groupItems(itemsRes.data ?? []);
  const recognized = (recognizedRes.data ?? []) as RecognizedRow[];

  const decorated = (invoicesRes.data ?? []).map((inv) =>
    decorate(inv, itemsByInvoice.get(inv.id) ?? [], recognized),
  );

  const period = new Date().toISOString().slice(0, 7);
  const inPeriod = decorated.filter((i) => i.issue_date.slice(0, 7) === period);

  const due = decorated
    .filter((i) => i.status === "due")
    .sort((a, b) => (a.issue_date < b.issue_date ? -1 : 1))
    .map((i) => {
      const room = rooms.find((r) => r.id === i.room_id);
      const contract = contracts.find((c) => c.id === i.contract_id);
      return {
        ...i,
        roomCode: room?.code ?? "?",
        tenantName: contract?.tenant_name ?? null,
      };
    });

  const occupied = rooms.filter((r) => r.status === "occupied").length;

  // Phòng đang thuê mà kỳ này chưa có hóa đơn định kỳ → còn phải chốt số
  const closedThisPeriod = new Set(
    inPeriod.filter((i) => i.type === "periodic").map((i) => i.room_id),
  );
  const unreadMeters = rooms.filter(
    (r) => r.status === "occupied" && !closedThisPeriod.has(r.id),
  ).length;

  return {
    building,
    totalRooms: rooms.length,
    occupiedRooms: occupied,
    vacantRooms: rooms.filter((r) => r.status === "vacant").length,
    period,
    periodInvoices: inPeriod.length,
    periodPaid: inPeriod.filter((i) => i.status === "paid").length,
    dueInvoices: due,
    dueAmount: due.reduce((s, i) => s + (i.total - i.paid), 0),
    unreadMeters,
  };
}
