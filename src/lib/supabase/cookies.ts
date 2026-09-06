import type { CookieOptions } from "@supabase/ssr";

/**
 * Đăng nhập một lần là ở lại vĩnh viễn trên thiết bị đó, chỉ mất khi user tự
 * bấm Đăng xuất.
 *
 * Ba tầng phải cùng thỏa, thiếu tầng nào cũng bị đá ra:
 *
 * 1. **Supabase Auth** — `sessions_timebox = 0` và `sessions_inactivity_timeout = 0`
 *    (không giới hạn tuổi phiên, không hết hạn vì bỏ lâu không dùng). Đây là
 *    cấu hình dự án, không nằm trong repo.
 * 2. **Refresh token** — access token chỉ sống 1 giờ nhưng `@supabase/ssr` tự
 *    đổi lấy token mới bằng refresh token, nên hết hạn không làm rớt phiên.
 * 3. **Cookie** — nếu không đặt `maxAge`, trình duyệt coi đây là session cookie
 *    và xóa ngay khi đóng trình duyệt. Đó chính là tầng cần chỉnh ở đây.
 *
 * 400 ngày là trần Chrome áp cho mọi cookie (RFC 6265bis); đặt cao hơn cũng bị
 * cắt về mức này. Mỗi request đi qua middleware đều ghi lại cookie nên hạn được
 * đẩy lùi liên tục — thực tế là vô hạn chừng nào còn mở app.
 */
export const SESSION_COOKIE_MAX_AGE = 400 * 24 * 60 * 60;

export const persistentCookieOptions: CookieOptions = {
  maxAge: SESSION_COOKIE_MAX_AGE,
  path: "/",
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
};
