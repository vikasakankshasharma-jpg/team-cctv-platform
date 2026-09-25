import { adminAuth } from "./firebase-admin";
import { cookies } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";

export interface SessionResult {
  isAuthenticated: boolean;
  user: DecodedIdToken | null;
  role: string | null;
  permissions?: any;
  uid?: string;
}

/**
 * Retrieves and verifies the admin_session cookie.
 * Used inside Server Components and Next.js API Routes to protect resources.
 */
export async function verifySession(): Promise<SessionResult> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("customer_session")?.value || cookieStore.get("admin_session")?.value;

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

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, false);
    const role = (decodedToken.role as string) || "customer";
    const permissions = decodedToken.permissions || null;
    return { isAuthenticated: true, user: decodedToken, role, permissions, uid: decodedToken.uid };
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

const EXTERNAL_ROLES = ["customer", "installer", "partner"];

/**
 * Enforces any internal staff role. Redirects if not authorized.
 */
export async function requireAdmin() {
  const session = await verifySession();
  // Dynamic RBAC Check: If authenticated and role is not an external role, grant access
  if (!session.isAuthenticated || !session.role || EXTERNAL_ROLES.includes(session.role)) {
    redirect("/admin/login");
  }
  return session;
}

/**
 * Enforces any internal staff role for API routes.
 * Returns a 401 response instead of redirecting.
 */
export async function requireAdminApi() {
  const session = await verifySession();
  // Dynamic RBAC Check: If authenticated and role is not an external role, grant access
  if (!session.isAuthenticated || !session.role || EXTERNAL_ROLES.includes(session.role)) {
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
