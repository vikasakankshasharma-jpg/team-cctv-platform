import { adminAuth } from "./firebase-admin";
import { cookies, headers } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";

export interface SessionResult {
  isAuthenticated: boolean;
  user: DecodedIdToken | null;
  role: string | null;
  permissions?: any;
  uid?: string;
}

/**
 * Retrieves and verifies session cookies or Authorization Bearer tokens.
 * Used inside Server Components and Next.js API Routes to protect resources.
 */
export async function verifySession(portalType?: 'customer' | 'admin' | 'installer' | 'partner'): Promise<SessionResult> {
  const cookieStore = await cookies();
  let sessionCookie: string | undefined;

  if (portalType) {
    sessionCookie = cookieStore.get(`${portalType}_session`)?.value;
  } else {
    // Fallback if no portal type specified (checks all)
    sessionCookie = cookieStore.get("admin_session")?.value || 
                    cookieStore.get("installer_session")?.value || 
                    cookieStore.get("partner_session")?.value || 
                    cookieStore.get("customer_session")?.value;
  }

  // Fallback: Check Bearer token from Authorization header if cookie is missing or invalid
  if (!sessionCookie) {
    try {
      const headersList = await headers();
      const authHeader = headersList.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const idToken = authHeader.split("Bearer ")[1]?.trim();
        if (idToken) {
          const decodedToken = await adminAuth.verifyIdToken(idToken);
          const role = (decodedToken.role as string) || "customer";
          const permissions = decodedToken.permissions || null;
          return { isAuthenticated: true, user: decodedToken, role, permissions, uid: decodedToken.uid };
        }
      }
    } catch {
      // Ignore header verification error and proceed to unauthenticated return
    }
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
    // Secondary check: verify if an Authorization Bearer token is provided when cookie is expired
    try {
      const headersList = await headers();
      const authHeader = headersList.get("authorization");
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const idToken = authHeader.split("Bearer ")[1]?.trim();
        if (idToken) {
          const decodedToken = await adminAuth.verifyIdToken(idToken);
          const role = (decodedToken.role as string) || "customer";
          const permissions = decodedToken.permissions || null;
          return { isAuthenticated: true, user: decodedToken, role, permissions, uid: decodedToken.uid };
        }
      }
    } catch {
      // Header check also failed
    }

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
  let session = await verifySession('admin');
  if (!session.isAuthenticated) {
    session = await verifySession();
  }
  const role = String(session.role || "").toLowerCase();
  if (!session.isAuthenticated || (role !== "super_admin" && role !== "admin")) {
    redirect("/admin/login");
  }
  return session;
}

const EXTERNAL_ROLES = ["customer", "installer", "partner"];

/**
 * Enforces any internal staff role. Redirects if not authorized.
 */
export async function requireAdmin() {
  let session = await verifySession('admin');
  if (!session.isAuthenticated) {
    session = await verifySession();
  }
  // Dynamic RBAC Check: If authenticated and role is not an external role, grant access
  const role = String(session.role || "").toLowerCase();
  if (!session.isAuthenticated || !session.role || EXTERNAL_ROLES.includes(role)) {
    redirect("/admin/login");
  }
  return session;
}

/**
 * Enforces any internal staff role for API routes.
 * Returns a 401 response instead of redirecting.
 */
export async function requireAdminApi() {
  let session = await verifySession('admin');
  if (!session.isAuthenticated) {
    session = await verifySession();
  }
  // Dynamic RBAC Check: If authenticated and role is not an external role, grant access
  const role = String(session.role || "").toLowerCase();
  if (!session.isAuthenticated || !session.role || EXTERNAL_ROLES.includes(role)) {
    throw new Error("Unauthorized");
  }
  return session;
}

/**
 * Strict Role Enforcement for APIs.
 * Pass an array of allowed roles. Throws if unauthorized.
 * Prioritizes admin session, normalizes casing, and supports super_admin/admin master access and RBAC permissions.
 */
export async function requireRoleApi(allowedRoles: string[]): Promise<SessionResult> {
  // Always check admin session first
  let session = await verifySession('admin');
  if (!session.isAuthenticated) {
    session = await verifySession();
  }

  if (!session.isAuthenticated || !session.role) {
    throw new Error("Unauthorized");
  }

  const userRole = String(session.role).toLowerCase();
  const normalizedAllowed = allowedRoles.map(r => String(r).toLowerCase());

  // Master Access: super_admin and admin ALWAYS have full access across all admin APIs
  if (userRole === "super_admin" || userRole === "admin") {
    return session;
  }

  // Direct role match (case-insensitive)
  if (normalizedAllowed.includes(userRole)) {
    return session;
  }

  // Granular RBAC Permission checking if permissions claim is attached
  if (session.permissions) {
    const perms = session.permissions;
    if ((normalizedAllowed.includes("catalog") || normalizedAllowed.includes("inventory_admin")) && perms.catalog?.edit_catalog) {
      return session;
    }
    if (normalizedAllowed.includes("crm_sales") && perms.crm_sales?.view_all_leads) {
      return session;
    }
    if (normalizedAllowed.includes("operations") && perms.operations?.manage_dispatch) {
      return session;
    }
    if (normalizedAllowed.includes("financial") && perms.financial?.view_financials) {
      return session;
    }
  }

  throw new Error("Unauthorized");
}
