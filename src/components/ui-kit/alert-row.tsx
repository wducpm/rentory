import Link from "next/link";
import { IconTile } from "./icon-tile";
import type { Tone } from "./tone";

export function AlertRow({
  icon,
  tone = "warning",
  title,
  meta,
  detail,
  detailTone = "warning",
  href,
  action,
}: {
  icon: React.ReactNode;
  tone?: Tone;
  title: string;
  meta?: string;
  detail: string;
  detailTone?: Tone;
  href: string;
  action: string;
}) {
  return (
    <div className="bg-card border-border flex items-center gap-3 rounded-2xl border p-3">
      <IconTile tone={tone}>{icon}</IconTile>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 text-sm font-semibold">
          <span className="shrink-0">{title}</span>
          {meta ? (
            <>
              <span className="bg-muted-foreground/40 size-1 shrink-0 rounded-full" />
              <span className="text-foreground/80 truncate font-medium">
                {meta}
              </span>
            </>
          ) : null}
        </p>
        <p
          className={
            detailTone === "destructive"
              ? "text-destructive mt-0.5 truncate text-xs font-medium"
              : "text-warning mt-0.5 truncate text-xs font-medium"
          }
        >
          {detail}
        </p>
      </div>

      <Link
        href={href}
        className="bg-primary-soft text-primary focus-visible:ring-ring inline-flex h-9 shrink-0 items-center rounded-xl px-3 text-xs font-semibold focus-visible:ring-2 focus-visible:outline-none"
      >
        {action}
      </Link>
    </div>
  );
}
