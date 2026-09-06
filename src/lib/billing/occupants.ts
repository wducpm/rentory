import type { ContractOccupant, RoomStatus } from "./types";

/**
 * CR-02 · BR-P14 — người đại diện: đầu mối liên lạc, tên hiển thị trên hóa đơn,
 * danh sách phòng và lịch sử hoạt động.
 *
 * Dữ liệu hợp lệ luôn có đúng một người `is_primary` (DB ép bằng unique index).
 * Nếu vì lý do nào đó không có, lấy người đầu tiên để UI không vỡ.
 */
export function primaryOccupant(
  occupants: ContractOccupant[],
): ContractOccupant | null {
  return occupants.find((o) => o.is_primary) ?? occupants[0] ?? null;
}

export function primaryName(occupants: ContractOccupant[]): string {
  return primaryOccupant(occupants)?.full_name ?? "—";
}

/** BR-P15 — số người tính phí dịch vụ chung = số dòng người ở. */
export function occupantCount(occupants: ContractOccupant[]): number {
  return occupants.length;
}

/**
 * BR-P17 — họ tên bắt buộc với mọi người; SĐT bắt buộc riêng với người đại diện.
 * Trả về danh sách lỗi kèm chỉ số dòng để UI báo đúng chỗ (AC-21.8, AC-21.9).
 */
export type OccupantIssue = { index: number; field: "full_name" | "phone"; message: string };

export function validateOccupants(
  occupants: ContractOccupant[],
): OccupantIssue[] {
  const issues: OccupantIssue[] = [];

  occupants.forEach((o, index) => {
    if (!o.full_name.trim())
      issues.push({ index, field: "full_name", message: "Chưa nhập họ tên" });
    if (o.is_primary && !(o.phone ?? "").trim())
      issues.push({
        index,
        field: "phone",
        message: "Người đại diện bắt buộc có số điện thoại",
      });
  });

  if (occupants.length === 0)
    issues.push({ index: 0, field: "full_name", message: "Phải có ít nhất một người ở" });
  else if (occupants.filter((o) => o.is_primary).length !== 1)
    issues.push({ index: 0, field: "full_name", message: "Phải chọn đúng một người đại diện" });

  return issues;
}

/**
 * FR-205 — tăng số người thì thêm dòng trống ở cuối.
 *
 * AC-21.3: danh sách mới thì người đầu mặc định là đại diện. Nhưng nếu danh
 * sách đang có người mà thao tác làm mất người đại diện, KHÔNG tự gán người
 * thay — AC-24.4 bắt admin chọn đích danh, tự gán sẽ nuốt mất quyết định đó.
 */
export function resizeOccupants(
  occupants: ContractOccupant[],
  size: number,
): ContractOccupant[] {
  const next = occupants.slice(0, size);
  const grew = next.length < size;
  while (next.length < size)
    next.push({ full_name: "", phone: "", is_primary: false });

  const hadPrimary = occupants.some((o) => o.is_primary);
  if (next.length > 0 && !next.some((o) => o.is_primary) && (!hadPrimary || grew))
    next[0].is_primary = true;

  return next;
}

/** CR-01 · BR-P04 — trạng thái phòng suy từ hợp đồng, không set tay. */
export function roomStatus(hasActiveContract: boolean): RoomStatus {
  return hasActiveContract ? "occupied" : "vacant";
}

/** FR-208 · CR-06 — ngưỡng cảnh báo hợp đồng sắp hết hạn. Đặt một chỗ duy nhất. */
export const CONTRACT_EXPIRY_WARNING_DAYS = 15;

export function daysUntil(endDate: string | null, today: string): number | null {
  if (!endDate) return null;
  const ms =
    new Date(`${endDate}T00:00:00`).getTime() -
    new Date(`${today}T00:00:00`).getTime();
  return Math.round(ms / 86_400_000);
}

/** BR-P11 — quá hạn không tự đóng hợp đồng, chỉ cảnh báo. */
export function isExpiringSoon(endDate: string | null, today: string): boolean {
  const left = daysUntil(endDate, today);
  return left !== null && left <= CONTRACT_EXPIRY_WARNING_DAYS;
}
