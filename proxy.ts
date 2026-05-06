import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, importX509, decodeProtectedHeader } from "jose";

let publicKeys: Record<string, string> | null = null;
let publicKeysFetchedAt = 0;

async function getPublicKeys() {
  const now = Date.now();
  if (publicKeys && now - publicKeysFetchedAt < 1000 * 60 * 60 * 6) {
    return publicKeys;
  }
  try {
    const res = await fetch("https://www.googleapis.com/identitytoolkit/v3/relyingparty/publicKeys");
    if (res.ok) {
      publicKeys = await res.json();
      publicKeysFetchedAt = now;
      return publicKeys!;
    }
  } catch (e) {
    console.error("Failed to fetch Firebase public keys", e);
  }
  return null;
}

async function verifyFirebaseSessionCookie(sessionCookie: string) {
  try {
    const keys = await getPublicKeys();
    if (!keys) return false;

    const header = decodeProtectedHeader(sessionCookie);
    const kid = header.kid;
    if (!kid || !keys[kid]) return false;

    const cert = keys[kid];
    const publicKey = await importX509(cert, "RS256");
    
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const { payload } = await jwtVerify(sessionCookie, publicKey, {
      issuer: `https://session.firebase.google.com/${projectId}`,
      audience: projectId,
    });
    
    return payload;
  } catch (e) {
    return false;
  }
}

export async function proxy(request: NextRequest) {
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

  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: http: 'unsafe-eval';
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https://www.facebook.com https://firebasestorage.googleapis.com https://lh3.googleusercontent.com https://www.googletagmanager.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.google-analytics.com https://www.googletagmanager.com https://*.ingest.sentry.io https://api.postalpincode.in https://nominatim.openstreetmap.org;
    frame-src 'self' https://www.google.com https://maps.google.com https://www.recaptcha.net;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", cspHeader);
  if (pathname.startsWith("/admin")) {
    const adminSession = request.cookies.get("admin_session")?.value;

    if (pathname === "/admin/login") {
      if (adminSession && await verifyFirebaseSessionCookie(adminSession)) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      return addSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }), cspHeader);
    }

    if (!adminSession || !(await verifyFirebaseSessionCookie(adminSession))) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // 2. Protect Partner Portal Routes
  if (pathname.startsWith("/partner")) {
    const partnerSession = request.cookies.get("partner_session")?.value;

    if (pathname === "/partner/login") {
      if (partnerSession && await verifyFirebaseSessionCookie(partnerSession)) {
        return NextResponse.redirect(new URL("/partner/dashboard", request.url));
      }
      return addSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }), cspHeader);
    }

    if (!pathname.startsWith("/partner/auth") && (!partnerSession || !(await verifyFirebaseSessionCookie(partnerSession)))) {
      const loginUrl = new URL("/partner/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return addSecurityHeaders(NextResponse.next({ request: { headers: requestHeaders } }), cspHeader);
}

function addSecurityHeaders(response: NextResponse, cspHeader: string) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
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
