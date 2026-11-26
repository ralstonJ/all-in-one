import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-token";
import { AXX_COOKIE, verifyAxToken } from "@/lib/axxion/token";

/**
 * Route guard for two separate apps:
 * - /axxion/** (Axxion claims portal) needs an Axxion session; /axxion/login is open.
 * - everything else (workshop app) needs a workshop session; /login is open.
 * Each app's cookie only works for that app.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (pathname === "/axxion" || pathname.startsWith("/axxion/")) {
    const token = request.cookies.get(AXX_COOKIE)?.value;
    const session = token ? await verifyAxToken(token) : null;
    const isLogin = pathname === "/axxion/login";
    if (!session && !isLogin) {
      const url = new URL("/axxion/login", request.url);
      if (pathname !== "/axxion" && pathname !== "/axxion/home") url.searchParams.set("next", pathname + search);
      const response = NextResponse.redirect(url);
      if (token) response.cookies.set(AXX_COOKIE, "", { path: "/axxion", maxAge: 0 });
      return response;
    }
    if (session && isLogin) return NextResponse.redirect(new URL("/axxion/home", request.url));
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  const isLoginPage = pathname === "/login";

  if (!session && !isLoginPage) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    const response = NextResponse.redirect(url);
    if (token) response.cookies.delete(SESSION_COOKIE); // drop stale/invalid cookie
    return response;
  }

  if (session && isLoginPage) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next internals and static assets.
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|xml|json)$).*)",
  ],
};
