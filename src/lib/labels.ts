import type { FeeType, InvoiceType } from "@/lib/billing";

export const FEE_LABEL: Record<FeeType, string> = {
  rent: "Tiền phòng",
  elec: "Điện",
  water: "Nước",
  internet: "Internet",
  common: "Dịch vụ chung",
  deposit: "Cọc",
  deposit_refund: "Hoàn cọc",
};

export const INVOICE_TYPE_LABEL: Record<InvoiceType, string> = {
  move_in: "Nhận phòng",
  periodic: "Định kỳ",
  move_out: "Trả phòng",
};

export const ROOM_STATUS_LABEL = {
  occupied: "Đang thuê",
  vacant: "Trống",
  maintenance: "Bảo trì",
} as const;

export const MARK_SOURCE_LABEL = {
  invoice_move_in: "HĐ nhận phòng",
  invoice_periodic: "HĐ định kỳ",
  invoice_move_out: "HĐ trả phòng",
  manual: "Sửa thủ công",
} as const;

/** 'YYYY-MM' → 'tháng 8/2025' */
export function periodLabel(period: string | null): string {
  if (!period) return "—";
  const [y, m] = period.split("-");
  return `tháng ${Number(m)}/${y}`;
}

/** 'YYYY-MM-DD' → '20/08/2025' */
export function dateLabel(iso: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

export function todayIso(): string {
  const now = new Date();
  const tz = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return tz.toISOString().slice(0, 10);
}

/** HD-13: "Điện nước tháng X · Dịch vụ tháng Y" */
export function periodsLine(
  utility: string | null,
  service: string | null,
): string {
  const parts: string[] = [];
  if (utility) parts.push(`Điện nước ${periodLabel(utility)}`);
  if (service) parts.push(`Dịch vụ ${periodLabel(service)}`);
  return parts.join(" · ");
}

/** Cộng thêm n tháng vào ngày 'YYYY-MM-DD'. Dùng cho chọn nhanh thời hạn HĐ. */
export function addMonthsIso(iso: string, months: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const base = new Date(y, m - 1 + months, 1);
  // Ngày 31 cộng sang tháng 30 ngày thì lùi về ngày cuối tháng đó
  const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
  base.setDate(Math.min(d, lastDay));
  return `${base.getFullYear()}-${String(base.getMonth() + 1).padStart(2, "0")}-${String(
    base.getDate(),
  ).padStart(2, "0")}`;
}
