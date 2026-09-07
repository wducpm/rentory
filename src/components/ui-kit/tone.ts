/** 6 tone màu trạng thái dùng chung cho IconTile / Pill (DESIGN_SYSTEM §1). */
export type Tone =
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "neutral";

/** Ô icon: nền nhạt + viền cùng tông, theo mockup (`bg-blue-50 border-blue-100`). */
export const TILE_TONE: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary border border-primary/15",
  success: "bg-success-soft text-success-strong border border-success/20",
  warning: "bg-warning-soft text-warning-strong border border-warning/25",
  destructive: "bg-destructive-soft text-destructive border border-destructive/20",
  info: "bg-info-soft text-info border border-info/15",
  neutral: "bg-neutral-soft text-muted-foreground border border-border",
};

/**
 * Pill trạng thái dùng biến thể `*-strong` cho chữ.
 *
 * Đặt màu gốc lên nền `*-soft` chỉ đạt 2.1–3.4:1 — dưới ngưỡng 4.5:1 và thực
 * tế là không đọc nổi. Các cặp dưới đây đều ≥ 4.8:1.
 */
export const PILL_TONE: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary-strong",
  success: "bg-success-soft text-success-strong",
  warning: "bg-warning-soft text-warning-strong",
  destructive: "bg-destructive-soft text-destructive-strong",
  info: "bg-info-soft text-info-strong",
  neutral: "bg-neutral-soft text-neutral-strong",
};

/** Chấm 6px đứng trước nhãn trạng thái trong pill. */
export const DOT_TONE: Record<Tone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  neutral: "bg-muted-foreground",
};

export const BAR_TONE: Record<Tone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  neutral: "bg-muted-foreground",
};
