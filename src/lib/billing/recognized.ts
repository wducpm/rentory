import type { FeeType, InvoiceItem, Receipt } from "./types";

/**
 * TT-03 — Số ghi nhận của một khoản = **bản ghi thu mới nhất**, KHÔNG cộng dồn.
 * Thứ tự: receipt_date desc, created_at desc (khớp view `recognized_items`).
 */
export function recognizedAmount(
  receipts: Receipt[],
  fee: FeeType,
): number | null {
  const candidates = receipts
    .filter((r) => r.items.some((i) => i.fee === fee))
    .sort(compareReceiptsDesc);

  const latest = candidates[0];
  if (!latest) return null;
  return latest.items.find((i) => i.fee === fee)!.amount;
}

function compareReceiptsDesc(a: Receipt, b: Receipt): number {
  if (a.receipt_date !== b.receipt_date)
    return a.receipt_date < b.receipt_date ? 1 : -1;
  const ac = a.created_at ?? "";
  const bc = b.created_at ?? "";
  if (ac !== bc) return ac < bc ? 1 : -1;
  return 0;
}

/** Tổng đã ghi nhận thu của một hóa đơn (theo TT-03, từng khoản lấy bản mới nhất). */
export function paidTotal(items: InvoiceItem[], receipts: Receipt[]): number {
  return items.reduce(
    (sum, item) => sum + (recognizedAmount(receipts, item.fee) ?? 0),
    0,
  );
}

/**
 * TT-06 — trạng thái **suy ra**, không set tay.
 *
 * Quy tắc dẫn xuất (TT-06a): dòng có số tiền 0 không cần bản ghi thu — nếu bắt
 * buộc thì hóa đơn trả phòng (dịch vụ mặc định 0, HD-03) sẽ không bao giờ về
 * được "Đã thu". Suy ra từ TT-06 + HD-03, chưa được xác nhận trực tiếp.
 */
export function unpaidFees(
  items: InvoiceItem[],
  receipts: Receipt[],
): FeeType[] {
  return items
    .filter((i) => i.amount !== 0)
    .filter((i) => recognizedAmount(receipts, i.fee) === null)
    .map((i) => i.fee);
}

export function invoiceStatus(
  items: InvoiceItem[],
  receipts: Receipt[],
): "paid" | "due" {
  return unpaidFees(items, receipts).length === 0 ? "paid" : "due";
}
