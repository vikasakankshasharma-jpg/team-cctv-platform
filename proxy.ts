import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Enterprise Middleware for TEAM CCTV Platform.
 * Handles:
 * 1. Route protection for sensitive groups (/admin, /partner, /dealer, /salesperson)
 * 2. Redirection for unauthenticated users
 * 3. Robust Security Headers (CSP, HSTS, X-Frame, etc.)
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const adminSession = request.cookies.get('admin_session')?.value;
  const partnerSession = request.cookies.get('partner_session')?.value;
  const session = adminSession || partnerSession;

  // 1. Route Protection Logic
  const protectedPaths = ['/admin', '/partner', '/dealer', '/salesperson'];
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));
  const isLoginPage = pathname.includes('/login');

  if (isProtectedPath && !isLoginPage && !session) {
    const url = request.nextUrl.clone();
    if (pathname.startsWith('/admin')) url.pathname = '/admin/login';
    else if (pathname.startsWith('/partner')) url.pathname = '/partner/login';
    else if (pathname.startsWith('/dealer')) url.pathname = '/dealer/login';
    else if (pathname.startsWith('/salesperson')) url.pathname = '/admin/login';
    else url.pathname = '/';
    
    return NextResponse.redirect(url);
  }

  // 2. Security Headers (Enterprise Standard)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  
  // CSP Definition
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com https://www.google.com https://www.gstatic.com https://*.googleapis.com https://apis.google.com https://www.recaptcha.net https://*.firebaseapp.com https://www.googletagmanager.com https://connect.facebook.net https://apis.mappls.com https://*.mappls.com blob:;
    script-src-elem 'self' 'unsafe-inline' https://checkout.razorpay.com https://*.razorpay.com https://www.google.com https://www.gstatic.com https://*.googleapis.com https://apis.google.com https://www.recaptcha.net https://*.firebaseapp.com https://www.googletagmanager.com https://connect.facebook.net https://apis.mappls.com https://*.mappls.com blob:;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://apis.mappls.com https://*.mappls.com;
    style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://apis.mappls.com https://*.mappls.com;
    img-src 'self' blob: data: https: http:;
    font-src 'self' https://fonts.gstatic.com https://apis.mappls.com https://*.mappls.com;
    connect-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://lumberjack-cx.razorpay.com https://*.googleapis.com https://*.google.com https://www.google.com https://www.recaptcha.net https://*.firebaseapp.com https://*.firebasestorage.app https://vitals.vercel-insights.com https://*.sentry.io https://api.postalpincode.in https://aniket-thapa.github.io https://nominatim.openstreetmap.org https://www.googletagmanager.com https://www.google-analytics.com https://analytics.google.com https://connect.facebook.net https://www.facebook.com https://apis.mappls.com https://*.mappls.com;
    frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com https://*.razorpay.com https://www.google.com https://www.recaptcha.net https://*.firebaseapp.com;
    worker-src 'self' blob:;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', cspHeader);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
  
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  return response;
}

// Global coverage for security headers
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};

