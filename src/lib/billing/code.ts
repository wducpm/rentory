import type { InvoiceType, Period } from "./types";
import { periodMonth, periodYear } from "./periods";

/**
 * 4.4 — Mã hóa đơn.
 *
 * Cấu trúc `HĐ-P{phòng}-ĐN/T{tháng}.{yy}-DV/T{tháng}.{yy}` — đoạn nào không có
 * thì bỏ hẳn, nhờ vậy mã tự cho biết loại hóa đơn.
 *
 *   move_in  → HĐ-P201-DV/T8.25
 *   periodic → HĐ-P201-ĐN/T8.25-DV/T9.25
 *   move_out → HĐ-P201-ĐN/T9.25
 */

const YY = (p: Period) => String(periodYear(p) % 100).padStart(2, "0");
const seg = (label: "ĐN" | "DV", p: Period) =>
  `${label}/T${periodMonth(p)}.${YY(p)}`;

/** Mã **lưu** trong DB: luôn có 2 chữ số năm ở mọi đoạn. */
export function buildInvoiceCode(
  roomCode: string,
  type: InvoiceType,
  utilityPeriod: Period | null,
  servicePeriod: Period | null,
  seq?: number,
): string {
  const parts = [`HĐ-P${roomCode}`];

  if (type !== "move_in") {
    if (!utilityPeriod)
      throw new Error(`Hóa đơn ${type} bắt buộc có kỳ điện nước`);
    parts.push(seg("ĐN", utilityPeriod));
  }
  if (type !== "move_out") {
    if (!servicePeriod)
      throw new Error(`Hóa đơn ${type} bắt buộc có kỳ dịch vụ`);
    parts.push(seg("DV", servicePeriod));
  }

  // Trùng mã trong cùng kỳ → thêm hậu tố thứ tự (HĐ-P201-ĐN/T9.25-2)
  if (seq && seq > 1) parts.push(String(seq));

  return parts.join("-");
}

const STORED_CODE_RE =
  /^HĐ-P([^-]+)(?:-ĐN\/T(\d{1,2})\.(\d{2}))?(?:-DV\/T(\d{1,2})\.(\d{2}))?(?:-(\d+))?$/;

export type ParsedInvoiceCode = {
  roomCode: string;
  utility: { month: number; yy: number } | null;
  service: { month: number; yy: number } | null;
  seq: number | null;
};

export function parseInvoiceCode(storedCode: string): ParsedInvoiceCode {
  const m = STORED_CODE_RE.exec(storedCode);
  if (!m) throw new Error(`Mã hóa đơn không hợp lệ: ${storedCode}`);
  const [, roomCode, um, uy, sm, sy, seq] = m;
  return {
    roomCode,
    utility: um ? { month: Number(um), yy: Number(uy) } : null,
    service: sm ? { month: Number(sm), yy: Number(sy) } : null,
    seq: seq ? Number(seq) : null,
  };
}

/**
 * Mã **hiển thị**: bỏ năm cho gọn — trừ khi hai kỳ khác năm thì hiện đủ.
 *   HĐ-P201-ĐN/T8.25-DV/T9.25  → HĐ-P201-ĐN/T8-DV/T9
 *   HĐ-P201-ĐN/T12.25-DV/T1.26 → HĐ-P201-ĐN/T12.25-DV/T1.26
 */
export function displayInvoiceCode(storedCode: string): string {
  const { roomCode, utility, service, seq } = parseInvoiceCode(storedCode);

  const differentYears =
    utility !== null && service !== null && utility.yy !== service.yy;

  const fmt = (label: "ĐN" | "DV", p: { month: number; yy: number }) =>
    differentYears
      ? `${label}/T${p.month}.${String(p.yy).padStart(2, "0")}`
      : `${label}/T${p.month}`;

  const parts = [`HĐ-P${roomCode}`];
  if (utility) parts.push(fmt("ĐN", utility));
  if (service) parts.push(fmt("DV", service));
  if (seq) parts.push(String(seq));
  return parts.join("-");
}

/**
 * Chọn `seq` nhỏ nhất chưa dùng cho một mã gốc. `existingCodes` là các mã đã
 * lưu của cùng tòa nhà (đối chiếu theo mã lưu, đủ năm).
 */
export function nextCodeSeq(baseCode: string, existingCodes: string[]): number {
  const taken = new Set(existingCodes);
  if (!taken.has(baseCode)) return 1;
  let seq = 2;
  while (taken.has(`${baseCode}-${seq}`)) seq += 1;
  return seq;
}
