import { cn } from "@/lib/utils";
import { TILE_TONE, type Tone } from "./tone";

export function IconTile({
  tone = "primary",
  size = "md",
  className,
  children,
}: {
  tone?: Tone;
  size?: "sm" | "md";
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl",
        size === "sm" ? "size-9 [&>svg]:size-4" : "size-11 [&>svg]:size-5",
        TILE_TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
