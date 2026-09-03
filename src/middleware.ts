import { NextResponse, type NextRequest } from "next/server";
import { BUILDING_SLUG_HEADER, buildingSlugFromHost } from "@/lib/tenant";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_PATHS = ["/login", "/auth"];

export async function middleware(request: NextRequest) {
  // 2.5 — định tuyến theo subdomain: host → slug → gắn vào context request
  const slug = buildingSlugFromHost(request.headers.get("host"));

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(BUILDING_SLUG_HEADER, slug);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(BUILDING_SLUG_HEADER, slug);

  const user = await updateSession(request, response);

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Bỏ qua static asset và file ảnh — chỉ chạy trên request điều hướng và API.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
