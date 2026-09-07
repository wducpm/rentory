import { cn } from "@/lib/utils";
import { DOT_TONE, PILL_TONE, type Tone } from "./tone";

export function Pill({
  tone = "neutral",
  dot = false,
  className,
  children,
}: {
  tone?: Tone;
  /** Chấm màu đứng trước nhãn — dùng cho pill trạng thái phòng. */
  dot?: boolean;
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
      {dot ? (
        <span
          aria-hidden
          className={cn("size-1.5 shrink-0 rounded-full", DOT_TONE[tone])}
        />
      ) : null}
      {children}
    </span>
  );
}
