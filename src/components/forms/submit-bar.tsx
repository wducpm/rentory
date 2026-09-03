"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** Thanh hành động dính đáy, nằm trên bottom-nav. */
export function SubmitBar({
  label,
  pending,
  disabled,
  onClick,
  tone = "primary",
  hint,
}: {
  label: string;
  pending?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  tone?: "primary" | "destructive";
  hint?: string;
}) {
  return (
    <div className="bg-background/90 border-border fixed inset-x-0 bottom-16 z-20 border-t backdrop-blur-md">
      <div className="mx-auto max-w-3xl px-4 py-3 md:px-6">
        {hint ? (
          <p className="text-muted-foreground mb-2 text-center text-[11px]">
            {hint}
          </p>
        ) : null}
        <button
          type={onClick ? "button" : "submit"}
          onClick={onClick}
          disabled={pending || disabled}
          className={cn(
            "focus-visible:ring-ring inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-50",
            tone === "primary"
              ? "bg-primary text-primary-foreground"
              : "bg-destructive text-destructive-foreground",
          )}
        >
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {label}
        </button>
      </div>
    </div>
  );
}
