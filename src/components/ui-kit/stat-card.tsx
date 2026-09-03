import { cn } from "@/lib/utils";
import { Pill } from "./pill";
import { BAR_TONE, type Tone } from "./tone";

export function StatCard({
  label,
  value,
  denominator,
  percent,
  tone = "primary",
  footer,
  footerPill,
  footerPillTone = "neutral",
}: {
  label: string;
  value: number | string;
  denominator?: string;
  percent?: number;
  tone?: Tone;
  footer?: string;
  footerPill?: string;
  footerPillTone?: Tone;
}) {
  const pct =
    percent === undefined ? undefined : Math.max(0, Math.min(100, percent));

  return (
    <div className="bg-card border-border flex flex-col rounded-2xl border p-4">
      <div className="flex items-start gap-2">
        <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          {label}
        </span>
        {pct !== undefined ? (
          <Pill tone={tone} className="ml-auto">
            {pct}%
          </Pill>
        ) : null}
      </div>

      <p className="mt-2 flex items-baseline gap-1">
        <span className="tabular text-3xl leading-none font-bold">{value}</span>
        {denominator ? (
          <span className="text-muted-foreground text-xs font-medium">
            {denominator}
          </span>
        ) : null}
      </p>

      {pct !== undefined ? (
        <div
          className="bg-neutral-soft mt-3 h-1.5 w-full overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={label}
        >
          <div
            className={cn("h-full rounded-full", BAR_TONE[tone])}
            style={{ width: `${pct}%` }}
          />
        </div>
      ) : null}

      {footer || footerPill ? (
        <div className="mt-3 flex items-center gap-2">
          {footer ? (
            <span className="text-muted-foreground truncate text-[11px]">
              {footer}
            </span>
          ) : null}
          {footerPill ? (
            <Pill tone={footerPillTone} className="ml-auto">
              {footerPill}
            </Pill>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
