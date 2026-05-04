import { adminAuth } from "./firebase-admin";
import { cookies } from "next/headers";
import type { DecodedIdToken } from "firebase-admin/auth";

export interface SessionResult {
  isAuthenticated: boolean;
  user: DecodedIdToken | null;
  role: "super_admin" | "sales_staff" | null;
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
    // Verify the session cookie and obtain the decoded claims
    // We expect the custom claims (role) to be bundled inside
    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // Check role enforcement
    const role = decodedToken.role as "super_admin" | "sales_staff" | undefined;
    
    if (role !== "super_admin" && role !== "sales_staff") {
      return { isAuthenticated: false, user: null, role: null };
    }

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
 * Enforces any admin role (super_admin or sales_staff). Redirects if not authorized.
 */
export async function requireAdmin() {
  const session = await verifySession();
  if (!session.isAuthenticated) {
    redirect("/admin/login");
  }
  return session;
}
