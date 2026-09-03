import type {
  MarkSource,
  MeterMarkLog,
  Room,
  SavedInvoice,
} from "./types";

export type ApplyMarkResult = {
  room: Room;
  log: MeterMarkLog;
};

/**
 * HD-04 + N2 + N3 — ghi đè mốc hiện tại của phòng và sinh bản ghi log.
 *
 * Pure function: trả về phòng sau khi ghi đè + dòng log cần insert. Việc ghi DB
 * do tầng gọi lo (một transaction: update rooms + insert meter_mark_logs).
 */
export function applyMark(
  room: Room,
  elec: number,
  water: number,
  source: MarkSource,
  invoiceId?: string | null,
  opts?: { effectiveDate?: string; note?: string | null },
): ApplyMarkResult {
  const prevElec = Number(room.current_elec);
  const prevWater = Number(room.current_water);
  const nextElec = Number(elec);
  const nextWater = Number(water);

  return {
    room: { ...room, current_elec: nextElec, current_water: nextWater },
    log: {
      room_id: room.id,
      effective_date: opts?.effectiveDate ?? todayIso(),
      elec: nextElec,
      water: nextWater,
      prev_elec: prevElec,
      prev_water: prevWater,
      source,
      invoice_id: invoiceId ?? null,
      note: opts?.note ?? null,
    },
  };
}

/**
 * HD-08a — hóa đơn này có đang **sở hữu mốc** của phòng không?
 *
 * Sửa hóa đơn mới nhất → ghi đè mốc. Sửa hóa đơn cũ hơn → chỉ đổi chính nó,
 * không đụng mốc (nếu không mốc sẽ nhảy lùi).
 */
export function isLatestInvoice(invoice: SavedInvoice, room: Room): boolean {
  return (
    Number(invoice.elec_end) === Number(room.current_elec) &&
    Number(invoice.water_end) === Number(room.current_water)
  );
}

/** Hóa đơn mới nhất của phòng: issue_date desc, created_at desc. */
export function latestInvoice<T extends SavedInvoice>(
  invoices: T[],
): T | undefined {
  return [...invoices].sort((a, b) => {
    if (a.issue_date !== b.issue_date) return a.issue_date < b.issue_date ? 1 : -1;
    const ac = a.created_at ?? "";
    const bc = b.created_at ?? "";
    if (ac !== bc) return ac < bc ? 1 : -1;
    return 0;
  })[0];
}

/** Nguồn ghi đè tương ứng với loại hóa đơn (N2). */
export function markSourceOf(
  type: "move_in" | "periodic" | "move_out",
): MarkSource {
  return `invoice_${type}` as MarkSource;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
