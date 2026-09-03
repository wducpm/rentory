/**
 * Tiền là **số nguyên VND**. Mọi phép nhân đơn giá × tiêu thụ đều làm tròn về
 * số nguyên ngay tại đây để không có float nào lọt vào DB.
 */
export function vnd(value: number): number {
  return Math.round(value);
}

const formatter = new Intl.NumberFormat("vi-VN");

export function formatVnd(value: number): string {
  return `${formatter.format(value)}đ`;
}
