import type { InvoiceType, Period } from "./types";

/** 'YYYY-MM' của một ngày 'YYYY-MM-DD'. */
export function periodOf(isoDate: string): Period {
  return isoDate.slice(0, 7);
}

/** Kỳ liền sau. */
export function nextPeriod(p: Period): Period {
  const [y, m] = p.split("-").map(Number);
  return m === 12
    ? `${y + 1}-01`
    : `${y}-${String(m + 1).padStart(2, "0")}`;
}

/** Kỳ liền trước. */
export function prevPeriod(p: Period): Period {
  const [y, m] = p.split("-").map(Number);
  return m === 1
    ? `${y - 1}-12`
    : `${y}-${String(m - 1).padStart(2, "0")}`;
}

export function periodYear(p: Period): number {
  return Number(p.slice(0, 4));
}

export function periodMonth(p: Period): number {
  return Number(p.slice(5, 7));
}

/**
 * 4.1 + 4.3 — kỳ mặc định của hóa đơn. Admin sửa được.
 *
 *   move_in  : chỉ có kỳ dịch vụ = kỳ hiện tại (phần còn lại của tháng nhận phòng)
 *   periodic : điện nước = kỳ vừa kết thúc (tháng chốt); dịch vụ = kỳ tiếp theo
 *   move_out : chỉ có kỳ điện nước = tháng trả phòng; dịch vụ đã thu trước
 */
export function derivePeriods(
  type: InvoiceType,
  issueDate: string,
): { utility_period: Period | null; service_period: Period | null } {
  const current = periodOf(issueDate);
  switch (type) {
    case "move_in":
      return { utility_period: null, service_period: current };
    case "periodic":
      return { utility_period: current, service_period: nextPeriod(current) };
    case "move_out":
      return { utility_period: current, service_period: null };
  }
}

/**
 * Tháng gọi tên một hóa đơn — "hóa đơn tháng M" = điện nước M−1 + dịch vụ M.
 *
 * Hóa đơn định kỳ và nhận phòng đã mang sẵn kỳ dịch vụ nên lấy thẳng. Hóa đơn
 * trả phòng chỉ có kỳ điện nước (HD-03, dịch vụ đã thu ở kỳ trước) nên suy ra
 * tháng liền sau: số điện tháng M được chốt và thu trong hóa đơn tháng M+1.
 */
export function invoiceMonth(inv: {
  utility_period: string | null;
  service_period: string | null;
}): Period | null {
  if (inv.service_period) return inv.service_period;
  return inv.utility_period ? nextPeriod(inv.utility_period) : null;
}
