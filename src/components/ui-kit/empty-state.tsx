import Link from "next/link";
import { IconTile } from "./icon-tile";

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  actionHref,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="bg-card border-border flex flex-col items-center rounded-2xl border px-6 py-10 text-center">
      <IconTile tone="neutral">{icon}</IconTile>
      <p className="mt-3 text-sm font-semibold">{title}</p>
      {description ? (
        <p className="text-muted-foreground mt-1 max-w-xs text-xs">
          {description}
        </p>
      ) : null}
      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="bg-primary text-primary-foreground focus-visible:ring-ring mt-4 inline-flex h-11 items-center rounded-xl px-4 text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}
