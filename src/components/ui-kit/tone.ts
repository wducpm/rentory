/** 6 tone màu trạng thái dùng chung cho IconTile / Pill (DESIGN_SYSTEM §1). */
export type Tone =
  | "primary"
  | "success"
  | "warning"
  | "destructive"
  | "info"
  | "neutral";

export const TILE_TONE: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  destructive: "bg-destructive-soft text-destructive",
  info: "bg-info-soft text-info",
  neutral: "bg-neutral-soft text-muted-foreground",
};

export const PILL_TONE: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning",
  destructive: "bg-destructive-soft text-destructive",
  info: "bg-info-soft text-info",
  neutral: "bg-neutral-soft text-muted-foreground",
};

export const BAR_TONE: Record<Tone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
  info: "bg-info",
  neutral: "bg-muted-foreground",
};
