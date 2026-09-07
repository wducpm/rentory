import { Droplets, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Cặp chỉ số điện/nước hai cột — dùng chung giữa thẻ phòng (S-02) và chi tiết
 * phòng (S-03) để hai màn không bao giờ lệch nhau về nhãn hay đơn vị.
 *
 * `size="lg"` cho màn chi tiết: mốc hiện tại là dữ liệu chính của S-03 nên
 * đọc bằng số lớn; `size="sm"` cho thẻ trong danh sách.
 */
export function MeterPair({
  elec,
  water,
  elecLabel = "Chỉ số điện",
  size = "sm",
  className,
}: {
  elec: number | string;
  water: number | string;
  /** Phòng trống dùng "Chỉ số bàn giao" — đây là mốc bàn giao, chưa phát sinh. */
  elecLabel?: string;
  size?: "sm" | "lg";
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-2",
        size === "lg"
          ? "gap-3"
          : "bg-muted gap-2 rounded-xl p-2.5",
        className,
      )}
    >
      <Meter icon={<Zap />} label={elecLabel} value={elec} unit="kWh" size={size} />
      <Meter
        icon={<Droplets />}
        label="Chỉ số nước"
        value={water}
        unit="m³"
        size={size}
      />
    </div>
  );
}

function Meter({
  icon,
  label,
  value,
  unit,
  size,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  unit: string;
  size: "sm" | "lg";
}) {
  const lg = size === "lg";
  return (
    <div
      className={cn(
        "min-w-0",
        lg && "bg-card border-border rounded-2xl border p-4",
      )}
    >
      <p
        className={cn(
          "text-muted-foreground flex items-center gap-1 font-semibold tracking-wide uppercase",
          lg ? "text-[11px] tracking-wider" : "text-[10px]",
        )}
      >
        <span
          className={cn("text-info", lg ? "[&>svg]:size-4" : "[&>svg]:size-3.5")}
          aria-hidden
        >
          {icon}
        </span>
        <span className="truncate">{label}</span>
      </p>
      <p
        className={cn(
          "tabular font-semibold",
          lg ? "mt-1 text-3xl leading-none" : "mt-0.5 text-sm",
        )}
      >
        {value}{" "}
        <span
          className={cn(
            "text-muted-foreground font-normal",
            lg ? "text-xs" : "text-[10px]",
          )}
        >
          {unit}
        </span>
      </p>
    </div>
  );
}
