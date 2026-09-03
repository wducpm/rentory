import Link from "next/link";
import { IconTile } from "./icon-tile";
import { Pill } from "./pill";
import type { Tone } from "./tone";

export function FeatureCard({
  href,
  icon,
  tone = "primary",
  badge,
  badgeTone = "neutral",
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  tone?: Tone;
  badge?: string;
  badgeTone?: Tone;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="bg-card border-border focus-visible:ring-ring active:bg-accent/40 flex flex-col rounded-2xl border p-4 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
    >
      <div className="flex items-start gap-2">
        <IconTile tone={tone}>{icon}</IconTile>
        {badge ? (
          <Pill tone={badgeTone} className="ml-auto">
            {badge}
          </Pill>
        ) : null}
      </div>
      <h3 className="mt-3 text-[15px] font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-0.5 text-xs">{subtitle}</p>
    </Link>
  );
}
