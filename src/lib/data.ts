import "server-only";
import { createClient } from "@/lib/supabase/server";
import { currentBuilding } from "@/lib/building";
import {
  sortForMeterReading,
  invoiceMonth,
  invoiceStatusFromRows,
  paidTotalFromRows,
  primaryName,
  roomStatus,
  unpaidFeesFromRows,
  type ContractOccupant,
  type FeeType,
  type InvoiceItem,
  type InvoiceType,
  type RoomStatus,
} from "@/lib/billing";
import type { Database } from "@/types/database";

type T = Database["public"]["Tables"];
export type RoomRow = T["rooms"]["Row"];
export type ContractRow = T["contracts"]["Row"];
export type InvoiceRow = T["invoices"]["Row"];
export type SettingsRow = T["building_settings"]["Row"];
export type MarkLogRow = T["meter_mark_logs"]["Row"];
export type OccupantRow = T["contract_occupants"]["Row"];

/** CR-02: hợp đồng luôn đi kèm danh sách người ở (số người = số dòng). */
export type ContractWithOccupants = ContractRow & {
  occupants: ContractOccupant[];
};

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
  /** CR-01 · BR-P04: suy từ hợp đồng, không đọc cột. */
  status: RoomStatus;
  contract: ContractWithOccupants | null;
  /** BR-P14: tên hiển thị lấy từ người đại diện. */
  tenantName: string | null;
  invoiceCount: number;
  dueCount: number;
  dueAmount: number;
  /** Hóa đơn chưa thu cũ nhất — đích của nút Thu tiền trên thẻ phòng. */
  dueInvoiceId: string | null;
};

/** S-02 — danh sách phòng: trạng thái, khách hiện tại, HĐ chưa thu, mốc hiện tại. */
export async function listRooms(): Promise<{
  building: Awaited<ReturnType<typeof requireBuilding>>;
  rooms: RoomSummary[];
}> {
  const building = await requireBuilding();
  const supabase = await createClient();

  const [roomsRes, contractsRes, invoicesRes, itemsRes, recognizedRes, occRes] =
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
      allOccupants(supabase),
    ]);

  const invoices = invoicesRes.data ?? [];
  const itemsByInvoice = groupItems(itemsRes.data ?? []);
  const recognized = (recognizedRes.data ?? []) as RecognizedRow[];

  const decorated = invoices.map((inv) =>
    decorate(inv, itemsByInvoice.get(inv.id) ?? [], recognized),
  );

  const contracts = contractsRes.data ?? [];
  const occupantsByContract = groupOccupants(occRes.data ?? []);

  const rooms: RoomSummary[] = (roomsRes.data ?? []).map((room) => {
    const mine = decorated.filter((i) => i.room_id === room.id);
    const due = mine
      .filter((i) => i.status === "due")
      .sort((a, b) => (a.issue_date < b.issue_date ? -1 : 1));
    const contract = contracts.find((c) => c.room_id === room.id) ?? null;
    const occupants = contract
      ? (occupantsByContract.get(contract.id) ?? [])
      : [];

    return {
      room,
      // CR-01: trạng thái suy từ hợp đồng hiệu lực
      status: roomStatus(contract !== null),
      contract: contract ? { ...contract, occupants } : null,
      tenantName: contract ? primaryName(occupants) : null,
      invoiceCount: mine.length,
      dueCount: due.length,
      dueAmount: due.reduce((s, i) => s + (i.total - i.paid), 0),
      dueInvoiceId: due[0]?.id ?? null,
    };
  });

  return { building, rooms };
}

/**
 * FR-209 · BR-P18 — gợi ý giá thuê khi nhận phòng: lấy giá của hợp đồng gần
 * nhất của phòng, kể cả hợp đồng đã đóng. Phòng chưa từng có hợp đồng → null,
 * admin nhập tay (AC-21.10).
 */
export async function suggestedRent(roomId: string): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contracts")
    .select("rent")
    .eq("room_id", roomId)
    .order("start_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.rent ?? null;
}

/** CR-04 · BR-P12 — phòng đã phát sinh hóa đơn thì không đổi tên được. */
export async function roomHasInvoices(roomId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("invoices")
    .select("id", { count: "exact", head: true })
    .eq("room_id", roomId);
  return (count ?? 0) > 0;
}

/** Gom người ở theo hợp đồng; giữ người đại diện lên đầu cho dễ đọc. */
function groupOccupants(rows: OccupantRow[]): Map<string, ContractOccupant[]> {
  const map = new Map<string, ContractOccupant[]>();
  for (const r of rows) {
    const list = map.get(r.contract_id) ?? [];
    list.push({
      id: r.id,
      full_name: r.full_name,
      phone: r.phone,
      national_id: r.national_id,
      is_primary: r.is_primary,
    });
    map.set(r.contract_id, list);
  }
  for (const list of map.values())
    list.sort((a, b) => Number(b.is_primary) - Number(a.is_primary));
  return map;
}

/**
 * Truy vấn người ở của cả tòa. Gọi kèm trong `Promise.all` của từng màn thay
 * vì chờ có contract id rồi mới lọc `.in()` — RLS đã giới hạn theo tòa nên
 * dữ liệu thừa không đáng kể, mà tiết kiệm được một lượt đi–về.
 */
function allOccupants(supabase: Awaited<ReturnType<typeof createClient>>) {
  return supabase.from("contract_occupants").select("*");
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

  const [roomRes, contractsRes, invoicesRes, settingsRes, occRes] = await Promise.all([
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
    allOccupants(supabase),
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

  const contracts = contractsRes.data ?? [];
  const occupantsByContract = groupOccupants(occRes.data ?? []);
  const withOccupants: ContractWithOccupants[] = contracts.map((c) => ({
    ...c,
    occupants: occupantsByContract.get(c.id) ?? [],
  }));
  const activeContract = withOccupants.find((c) => c.active) ?? null;

  return {
    building,
    settings: settingsRes.data ?? null,
    room: roomRes.data,
    contracts: withOccupants,
    activeContract,
    // CR-01: trạng thái suy từ hợp đồng
    status: roomStatus(activeContract !== null),
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

  const [itemsRes, recognizedRes, roomRes, contractRes, receiptsRes, settingsRes, occRes] =
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
      allOccupants(supabase),
    ]);

  const items = groupItems(itemsRes.data ?? []).get(invoiceId) ?? [];
  const recognized = (recognizedRes.data ?? []) as RecognizedRow[];

  const occupants = contractRes.data
    ? (groupOccupants(occRes.data ?? []).get(contractRes.data.id) ?? [])
    : [];

  return {
    invoice: decorate(invoice, items, recognized),
    recognized,
    room: roomRes.data,
    contract: contractRes.data
      ? { ...contractRes.data, occupants }
      : null,
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

  const [roomsRes, contractsRes, settingsRes, occRes] = await Promise.all([
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
    allOccupants(supabase),
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

  const occupantsByContract = groupOccupants(occRes.data ?? []);

  // Hóa đơn định kỳ và dòng tiền của chúng trước đây chạy nối đuôi nhau sau
  // batch trên. Lấy song song theo building_id để cả màn chỉ còn hai lượt.
  const [invoicesRes, itemsRes] = await Promise.all([
    supabase
      .from("invoices")
      .select("*")
      .eq("building_id", building.id)
      .eq("type", "periodic"),
    supabase.from("invoice_items").select("*"),
  ]);

  const invoices = invoicesRes.data ?? [];
  const itemsByInvoice = groupItems(itemsRes.data ?? []);

  return {
    building,
    settings: settingsRes.data,
    rooms: occupied.map((r) => ({
      ...r,
      contract: {
        ...r.contract!,
        occupants: occupantsByContract.get(r.contract!.id) ?? [],
      },
    })),
    periodicInvoices: invoices.map((inv) => ({
      ...inv,
      items: itemsByInvoice.get(inv.id) ?? [],
    })),
  };
}

/** S-09 — timeline gộp: hóa đơn · phiếu thu · lần ghi đè mốc. */
export async function getRoomHistory(roomId: string) {
  const supabase = await createClient();

  const [invoicesRes, marksRes, contractsRes, occRes] = await Promise.all([
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
    supabase.from("contracts").select("*").eq("room_id", roomId),
    allOccupants(supabase),
  ]);

  const invoiceIds = (invoicesRes.data ?? []).map((i) => i.id);
  const receiptsRes = invoiceIds.length
    ? await supabase
        .from("receipts")
        .select("*, receipt_items(*)")
        .in("invoice_id", invoiceIds)
        .order("receipt_date", { ascending: false })
    : { data: [] };

  // FR-207: mỗi mục ghi rõ thuộc về khách nào (BR-P14: tên người đại diện)
  const contracts = contractsRes.data ?? [];
  const occupantsByContract = groupOccupants(occRes.data ?? []);
  const tenantOf = new Map(
    contracts.map((c) => [
      c.id,
      primaryName(occupantsByContract.get(c.id) ?? []),
    ]),
  );

  return {
    invoices: invoicesRes.data ?? [],
    marks: marksRes.data ?? [],
    receipts: receiptsRes.data ?? [],
    tenantOf,
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
  /** Hóa đơn của kỳ ĐÃ QUA mà còn khoản chưa thu — nợ dồn sang kỳ sau. */
  overdueInvoices: (InvoiceWithStatus & {
    roomCode: string;
    tenantName: string | null;
    month: string;
  })[];
  dueAmount: number;
  unreadMeters: number;
};

/** Trang chủ — chỉ dùng dữ liệu trong phạm vi (không doanh thu / lãi lỗ). */
export async function getDashboard(): Promise<DashboardData> {
  const building = await requireBuilding();
  const supabase = await createClient();

  const [roomsRes, contractsRes, invoicesRes, itemsRes, recognizedRes, occRes] =
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
      allOccupants(supabase),
    ]);

  const rooms = roomsRes.data ?? [];
  const contracts = contractsRes.data ?? [];
  const occupantsByContract = groupOccupants(occRes.data ?? []);
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
        tenantName: contract
          ? primaryName(occupantsByContract.get(contract.id) ?? [])
          : null,
      };
    });

  // CR-01: đếm theo hợp đồng hiệu lực, không đọc cột status
  const occupiedIds = new Set(contracts.map((c) => c.room_id));
  const occupied = rooms.filter((r) => occupiedIds.has(r.id)).length;

  // Phòng đang thuê mà kỳ này chưa có hóa đơn định kỳ → còn phải chốt số
  const closedThisPeriod = new Set(
    inPeriod.filter((i) => i.type === "periodic").map((i) => i.room_id),
  );
  const unreadMeters = rooms.filter(
    (r) => occupiedIds.has(r.id) && !closedThisPeriod.has(r.id),
  ).length;

  return {
    building,
    totalRooms: rooms.length,
    occupiedRooms: occupied,
    vacantRooms: rooms.filter((r) => !occupiedIds.has(r.id)).length,
    period,
    periodInvoices: inPeriod.length,
    periodPaid: inPeriod.filter((i) => i.status === "paid").length,
    dueInvoices: due,
    overdueInvoices: due
      .map((i) => ({ ...i, month: invoiceMonth(i) }))
      .filter((i): i is (typeof due)[number] & { month: string } =>
        i.month !== null && i.month < period,
      ),
    dueAmount: due.reduce((s, i) => s + (i.total - i.paid), 0),
    unreadMeters,
  };
}

/**
 * S-11 — hóa đơn của một phòng theo **kỳ tháng**.
 *
 * Kỳ ở đây là tháng gọi tên hóa đơn (`invoiceMonth`): hóa đơn tháng M gồm điện
 * nước tháng M−1 và dịch vụ tháng M. Một tháng thường chỉ có một hóa đơn, nhưng
 * tháng nhận phòng hoặc trả phòng có thể có hai nên trả về mảng.
 *
 * `overdue` là các kỳ **đã qua** mà còn khoản chưa thu — cơ sở cho cảnh báo
 * "sang kỳ sau vẫn chưa thu hết".
 */
export async function getRoomPeriodInvoices(roomId: string, period: string) {
  const building = await requireBuilding();
  const supabase = await createClient();

  const [roomRes, contractsRes, invoicesRes, settingsRes, occRes] =
    await Promise.all([
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
      allOccupants(supabase),
    ]);

  if (!roomRes.data) return null;

  const invoiceIds = (invoicesRes.data ?? []).map((i) => i.id);
  const [itemsRes, recognizedRes] = await Promise.all([
    invoiceIds.length
      ? supabase.from("invoice_items").select("*").in("invoice_id", invoiceIds)
      : Promise.resolve({ data: [] as T["invoice_items"]["Row"][] }),
    invoiceIds.length
      ? supabase
          .from("recognized_items")
          .select("*")
          .in("invoice_id", invoiceIds)
      : Promise.resolve({ data: [] as RecognizedRow[] }),
  ]);

  const itemsByInvoice = groupItems(itemsRes.data ?? []);
  const recognized = (recognizedRes.data ?? []) as RecognizedRow[];

  const all = (invoicesRes.data ?? []).map((inv) =>
    decorate(inv, itemsByInvoice.get(inv.id) ?? [], recognized),
  );

  const occupantsByContract = groupOccupants(occRes.data ?? []);
  const contracts = contractsRes.data ?? [];
  const active = contracts.find((c) => c.active) ?? null;

  return {
    room: roomRes.data,
    settings: settingsRes.data ?? null,
    activeContract: active
      ? { ...active, occupants: occupantsByContract.get(active.id) ?? [] }
      : null,
    // Kỳ đang xem
    invoices: all
      .filter((i) => invoiceMonth(i) === period)
      .map((i) => ({
        ...i,
        recognized: recognized.filter((r) => r.invoice_id === i.id),
      })),
    /** Mọi kỳ có hóa đơn — để date picker biết chỗ nào có dữ liệu. */
    months: [...new Set(all.map(invoiceMonth).filter((m): m is string => !!m))],
    /** Kỳ đã qua mà còn nợ (dùng cho cảnh báo). */
    overdue: all
      .filter((i) => i.status === "due")
      .map((i) => ({ month: invoiceMonth(i), id: i.id, unpaid: i.total - i.paid }))
      .filter((i): i is { month: string; id: string; unpaid: number } =>
        i.month !== null && i.month < period,
      ),
  };
}
