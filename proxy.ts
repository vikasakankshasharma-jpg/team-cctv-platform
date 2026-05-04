import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Protect Admin Command Centre Routes
  if (pathname.startsWith("/admin")) {
    const adminSession = request.cookies.get("admin_session")?.value;

    if (pathname === "/admin/login") {
      if (adminSession) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return addSecurityHeaders(NextResponse.next());
    }

    if (!adminSession) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect Partner Portal Routes
  if (pathname.startsWith("/partner")) {
    const partnerSession = request.cookies.get("partner_session")?.value;

    if (pathname === "/partner/login") {
      if (partnerSession) {
        return NextResponse.redirect(new URL("/partner/dashboard", request.url));
      }
      return addSecurityHeaders(NextResponse.next());
    }

    if (!pathname.startsWith("/partner/auth") && !partnerSession) {
      const loginUrl = new URL("/partner/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

function addSecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/partner/:path*",
  ],
};
