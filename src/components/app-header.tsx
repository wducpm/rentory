import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { IconTile } from "@/components/ui-kit";
import type { Tone } from "@/components/ui-kit";

export function AppHeader({
  eyebrow,
  title,
  icon,
  tone = "primary",
  backHref,
  actions,
}: {
  eyebrow?: string;
  title: string;
  icon?: React.ReactNode;
  tone?: Tone;
  backHref?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="bg-background/85 sticky top-0 z-20 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3 md:px-6">
        {backHref ? (
          <Link
            href={backHref}
            aria-label="Quay lại"
            className="bg-card border-border focus-visible:ring-ring inline-flex size-10 shrink-0 items-center justify-center rounded-xl border focus-visible:ring-2 focus-visible:outline-none"
          >
            <ChevronLeft className="size-5" aria-hidden />
          </Link>
        ) : icon ? (
          <IconTile tone={tone}>{icon}</IconTile>
        ) : null}

        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {eyebrow}
            </p>
          ) : null}
          <h1 className="font-heading truncate text-xl leading-tight font-bold">
            {title}
          </h1>
        </div>

        {actions ? (
          <div className="flex shrink-0 items-center gap-2">{actions}</div>
        ) : null}
      </div>
    </header>
  );
}
