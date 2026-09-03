import { DEFAULT_BUILDING_SLUG } from "@/lib/env";

/** Header do middleware gắn vào request để Server Component đọc lại. */
export const BUILDING_SLUG_HEADER = "x-building-slug";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "[::1]"]);

/**
 * 2.5 — tách slug tòa nhà từ `host`.
 *
 * Một codebase, một deployment, nhiều tòa: `190nguyentrai.ducpm.work` →
 * '190nguyentrai'. Host không có subdomain hợp lệ (localhost, *.vercel.app,
 * apex domain) → rơi về DEFAULT_BUILDING_SLUG, nếu không local dev và Preview
 * sẽ chết.
 */
export function buildingSlugFromHost(host: string | null): string {
  if (!host) return DEFAULT_BUILDING_SLUG;

  const hostname = host.split(":")[0].toLowerCase();

  if (LOCAL_HOSTS.has(hostname)) return DEFAULT_BUILDING_SLUG;
  if (hostname.endsWith(".vercel.app")) return DEFAULT_BUILDING_SLUG;

  const labels = hostname.split(".");
  // Cần ít nhất sub.domain.tld để có subdomain thật
  if (labels.length < 3) return DEFAULT_BUILDING_SLUG;

  const sub = labels[0];
  if (!sub || sub === "www") return DEFAULT_BUILDING_SLUG;

  return sub;
}
