import { cn } from "@/lib/utils";
import { formatVnd } from "@/lib/billing";

/** Tiền VND — luôn `tabular` để cột tiền thẳng hàng (DESIGN_SYSTEM §2). */
export function Money({
  value,
  className,
  signed = false,
}: {
  value: number;
  className?: string;
  signed?: boolean;
}) {
  return (
    <span
      className={cn(
        "tabular",
        signed && value < 0 && "text-destructive",
        className,
      )}
    >
      {formatVnd(value)}
    </span>
  );
}
