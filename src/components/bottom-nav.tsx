"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Home, Settings2, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * 4 tab — design gốc có thêm "Hoá đơn" (danh sách toàn tòa) và "Báo cáo",
 * cả hai nằm ngoài phạm vi HANDOFF nên không dựng (DESIGN_SYSTEM §7).
 */
const TABS = [
  { href: "/", label: "Trang chủ", icon: Home },
  { href: "/rooms", label: "Phòng", icon: Building2 },
  { href: "/meters", label: "Chỉ số", icon: Gauge },
  { href: "/settings", label: "Cài đặt", icon: Settings2 },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Điều hướng chính"
      className="bg-card/95 border-border fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-md"
    >
      <ul className="mx-auto flex max-w-3xl items-stretch pb-[env(safe-area-inset-bottom)]">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "focus-visible:ring-ring flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl py-2 text-[11px] font-semibold transition-colors focus-visible:ring-2 focus-visible:outline-none",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon
                  className="size-5"
                  strokeWidth={active ? 2.4 : 1.9}
                  aria-hidden
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
