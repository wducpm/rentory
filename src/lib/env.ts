import { z } from "zod";

/**
 * Env công khai — có mặt cả trên client. Next.js inline `process.env.NEXT_PUBLIC_*`
 * lúc build nên phải truy cập bằng literal, không destructure `process.env`.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
});

/** Env server-only. Không bao giờ import từ Client Component. */
export function serverEnv() {
  return z
    .object({
      SUPABASE_SECRET_KEY: z.string().min(1),
      DEFAULT_BUILDING_SLUG: z.string().min(1).default("190nguyentrai"),
    })
    .parse({
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
      DEFAULT_BUILDING_SLUG: process.env.DEFAULT_BUILDING_SLUG,
    });
}

export const DEFAULT_BUILDING_SLUG =
  process.env.DEFAULT_BUILDING_SLUG ?? "190nguyentrai";
