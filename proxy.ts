import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware to protect Admin Routes.
 * Since we can't easily verify Firebase ID tokens purely in Edge Middleware
 * (Firebase Admin SDK relies on Node.js core modules), we use middleware to:
 * 1. Check if the user is trying to access an /admin route (except /admin/login).
 * 2. Check if the `session` cookie or `Authorization` header exists.
 * If neither exists, redirect to /admin/login immediately.
 * 
 * Deep verification happens inside the API routes and Page Server Components.
 */

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. Inject Premium Security Headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // 2. Protect Admin Command Centre Routes
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") {
      return response;
    }

    // Check for a session cookie or auth header (set by our client app when logged in)
    const sessionCookie = request.cookies.get("admin_session");
    
    // Strict block for everything else
    if (!sessionCookie) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/admin/:path*",
  ],
};
