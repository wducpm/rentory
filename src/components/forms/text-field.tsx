"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

export function TextField({
  id,
  label,
  value,
  onChange,
  onBlur,
  type = "text",
  placeholder,
  hint,
  className,
  required,
}: {
  id: string;
  label?: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  type?: "text" | "tel" | "date";
  placeholder?: string;
  hint?: string;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("grid gap-1.5", className)}>
      {label ? (
        <Label htmlFor={id} className="text-xs">
          {label}
        </Label>
      ) : null}
      <input
        id={id}
        type={type}
        inputMode={type === "tel" ? "tel" : undefined}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="border-input bg-card focus-visible:ring-ring h-11 w-full rounded-xl border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
      />
      {hint ? <p className="text-muted-foreground text-[11px]">{hint}</p> : null}
    </div>
  );
}
