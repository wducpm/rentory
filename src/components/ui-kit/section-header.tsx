import Link from "next/link";

export function SectionHeader({
  title,
  count,
  href,
  action = "Xem tất cả",
}: {
  title: string;
  count?: number;
  href?: string;
  action?: string;
}) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <h2 className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
        {title}
      </h2>
      {count !== undefined && count > 0 ? (
        <span className="bg-destructive text-destructive-foreground inline-flex size-4 items-center justify-center rounded-full text-[10px] font-bold">
          {count}
        </span>
      ) : null}
      {href ? (
        <Link
          href={href}
          className="text-primary focus-visible:ring-ring ml-auto rounded-md px-1 py-0.5 text-xs font-semibold focus-visible:ring-2 focus-visible:outline-none"
        >
          {action}
        </Link>
      ) : null}
    </div>
  );
}
