import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE, isValidSession } from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const authed = await isValidSession(request.cookies.get(SESSION_COOKIE)?.value);
  const isLogin = request.nextUrl.pathname === "/login";

  if (isLogin && authed) return NextResponse.redirect(new URL("/", request.url));
  if (!isLogin && !authed) return NextResponse.redirect(new URL("/login", request.url));
  return NextResponse.next();
}

// Only the presentation is locked; /join (audience) stays public.
export const config = {
  matcher: ["/", "/login"],
};
