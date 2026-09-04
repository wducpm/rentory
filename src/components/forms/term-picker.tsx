"use client";

import { cn } from "@/lib/utils";
import { addMonthsIso } from "@/lib/labels";

/** Chọn nhanh thời hạn hợp đồng: 6 tháng hoặc 1 năm tính từ ngày bắt đầu. */
const TERMS = [
  { months: 6, label: "6 tháng" },
  { months: 12, label: "1 năm" },
] as const;

export function TermPicker({
  startDate,
  endDate,
  onPick,
}: {
  startDate: string;
  endDate: string;
  onPick: (endDate: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {TERMS.map(({ months, label }) => {
        const value = addMonthsIso(startDate, months);
        const active = endDate === value;
        return (
          <button
            key={months}
            type="button"
            aria-pressed={active}
            onClick={() => onPick(value)}
            className={cn(
              "focus-visible:ring-ring inline-flex h-11 flex-1 items-center justify-center rounded-xl text-xs font-semibold focus-visible:ring-2 focus-visible:outline-none",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-card border-border text-muted-foreground border",
            )}
          >
            {label}
          </button>
        );
      })}
      {endDate ? (
        <button
          type="button"
          onClick={() => onPick("")}
          className="border-border text-muted-foreground focus-visible:ring-ring inline-flex h-11 items-center rounded-xl border px-3 text-xs font-semibold focus-visible:ring-2 focus-visible:outline-none"
        >
          Không hạn
        </button>
      ) : null}
    </div>
  );
}
