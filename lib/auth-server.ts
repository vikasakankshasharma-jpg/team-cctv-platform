import { adminAuth } from "./firebase-admin";
import { cookies } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";

export interface SessionResult {
  isAuthenticated: boolean;
  user: DecodedIdToken | null;
  role: string | null;
}

/**
 * Retrieves and verifies the admin_session cookie.
 * Used inside Server Components and Next.js API Routes to protect resources.
 */
export async function verifySession(): Promise<SessionResult> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session")?.value;

  if (!sessionCookie) {
    return { isAuthenticated: false, user: null, role: null };
  }

  try {
    if (sessionCookie.startsWith("mock_session_") && process.env.NODE_ENV !== "production") {
      const parts = sessionCookie.replace("mock_session_", "").split("_UID_");
      const role = parts[0];
      const uid = parts.length > 1 ? parts[1] : `mock-${role}-id`;
      return { isAuthenticated: true, user: { uid } as any, role };
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const role = (decodedToken.role as "super_admin" | "sales_staff" | "installer" | undefined) || null;
    return { isAuthenticated: true, user: decodedToken, role };
  } catch (error) {
    console.error("Session verification failed:", error);
    return { isAuthenticated: false, user: null, role: null };
  }
}

import { redirect } from "next/navigation";

/**
 * Enforces super_admin role. Redirects if not authorized.
 * Useful for rapid authorization in sensitive API routes or pages.
 */
export async function requireSuperAdmin() {
  const session = await verifySession();
  if (!session.isAuthenticated || session.role !== "super_admin") {
    redirect("/admin/login");
  }
  return session;
}

/**
 * Enforces any admin role (super_admin, admin, or sales_staff). Redirects if not authorized.
 */
export async function requireAdmin() {
  const session = await verifySession();
  if (!session.isAuthenticated || !["super_admin", "admin", "sales_staff"].includes(session.role as string)) {
    redirect("/admin/login");
  }
  return session;
}

/**
 * Enforces any admin role (super_admin, admin, or sales_staff) for API routes.
 * Returns a 401 response instead of redirecting.
 */
export async function requireAdminApi() {
  const session = await verifySession();
  if (!session.isAuthenticated || !["super_admin", "admin", "sales_staff"].includes(session.role as string)) {
    throw new Error("Unauthorized"); // This will be caught by the API route and returned as 401
  }
  return session;
}

/**
 * Strict Role Enforcement for APIs.
 * Pass an array of allowed roles. Throws if unauthorized.
 */
export async function requireRoleApi(allowedRoles: string[]): Promise<SessionResult> {
  const session = await verifySession();
  if (!session.isAuthenticated || !session.role || !allowedRoles.includes(session.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}
