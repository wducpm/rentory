import { cn } from "@/lib/utils";
import { PILL_TONE, type Tone } from "./tone";

export function Pill({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] leading-none font-semibold",
        PILL_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
