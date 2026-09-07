"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/**
 * Ô nhập số. `inputMode="decimal"` để mobile bật bàn phím số;
 * cao 44px theo DESIGN_SYSTEM §4.
 */
export function NumberField({
  id,
  label,
  value,
  onChange,
  onBlur,
  suffix,
  hint,
  min = 0,
  step = "any",
  className,
  disabled,
}: {
  id: string;
  label?: string;
  value: number | "";
  onChange: (v: number | "") => void;
  /** Gọi khi rời ô — dùng để chốt giá trị xuống nháp thay vì lưu từng phím gõ. */
  onBlur?: () => void;
  suffix?: string;
  hint?: string;
  min?: number;
  step?: string;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label ? (
        <Label htmlFor={id} className="text-xs">
          {label}
        </Label>
      ) : null}
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          step={step}
          disabled={disabled}
          value={value}
          onChange={(e) =>
            onChange(e.target.value === "" ? "" : Number(e.target.value))
          }
          onBlur={onBlur}
          className={cn(
            "border-input bg-card focus-visible:ring-ring tabular h-11 w-full rounded-xl border px-3 text-sm font-semibold focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50",
            suffix && "pr-12",
          )}
        />
        {suffix ? (
          <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? <p className="text-muted-foreground text-[11px]">{hint}</p> : null}
    </div>
  );
}
