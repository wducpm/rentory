import { z } from "zod";

/**
 * Env công khai — có mặt cả trên client. Next.js inline `process.env.NEXT_PUBLIC_*`
 * lúc build nên phải truy cập bằng literal, không destructure `process.env`.
 *
 * Parse **lazy**: nếu parse ngay lúc import thì mọi module chỉ cần một hằng số
 * từ đây (ví dụ `tenant.ts`) cũng sẽ nổ khi thiếu env.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

let cachedPublicEnv: z.infer<typeof publicSchema> | null = null;

export function publicEnv() {
  cachedPublicEnv ??= publicSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
  return cachedPublicEnv;
}

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
