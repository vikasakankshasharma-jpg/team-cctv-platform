import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // CSRF Protection for state-changing requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const host = request.headers.get('host');

    // Only enforce if both host and either origin/referer exist
    if (host && (origin || referer)) {
      const allowedOrigin = process.env.NODE_ENV === 'production' 
        ? `https://${host}` 
        : `http://${host}`;

      if (origin && origin !== allowedOrigin) {
        return new NextResponse(
          JSON.stringify({ error: "CSRF Validation Failed: Origin mismatch" }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      
      if (!origin && referer && !referer.startsWith(allowedOrigin)) {
        return new NextResponse(
          JSON.stringify({ error: "CSRF Validation Failed: Referer mismatch" }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }
  }

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
  
  // Basic CSP - adjust as needed for external scripts/styles
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://connect.facebook.net https://apis.google.com https://www.recaptcha.net https://www.gstatic.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https://www.facebook.com https://firebasestorage.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://www.google-analytics.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firebasestorage.googleapis.com;
    frame-src 'self' https://www.google.com https://www.recaptcha.net;
  `.replace(/\s{2,}/g, ' ').trim();
  
  response.headers.set("Content-Security-Policy", cspHeader);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
