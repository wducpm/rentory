/**
 * BR-M01 — thứ tự đọc công tơ.
 *
 * Admin đi từ tầng cao xuống tầng thấp, nên danh sách phải sắp **giảm dần**
 * theo phần số của mã phòng: 802 → 801 → 703 → … → 201. Thứ tự này phải khớp
 * thứ tự đi thực tế, nếu không admin phải dò từng dòng.
 */
export function roomCodeOrder(code: string): number {
  const digits = code.match(/\d+/);
  return digits ? Number(digits[0]) : Number.NEGATIVE_INFINITY;
}

export function compareRoomCodeDesc(a: string, b: string): number {
  const na = roomCodeOrder(a);
  const nb = roomCodeOrder(b);
  if (na !== nb) return nb - na;
  // Mã không có số (hoặc trùng phần số) → so chuỗi giảm dần cho ổn định
  return a < b ? 1 : a > b ? -1 : 0;
}

export function sortForMeterReading<T extends { code: string }>(
  rooms: T[],
): T[] {
  return [...rooms].sort((x, y) => compareRoomCodeDesc(x.code, y.code));
}

/** FR-101 — ngày chốt mặc định là ngày cuối tháng hiện tại. */
export function lastDayOfMonth(reference: Date = new Date()): string {
  const d = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}
