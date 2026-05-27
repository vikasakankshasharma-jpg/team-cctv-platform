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

  // E2E Mock Session bypass for automated visual scans (development only)
  if (sessionCookie === "mock-admin-session" && process.env.NODE_ENV === "development") {
    return {
      isAuthenticated: true,
      user: {
        uid: "mock-admin-uid",
        email: "admin@example.com",
        role: "super_admin",
      } as any,
      role: "super_admin"
    };
  }
  
  if (sessionCookie === "mock-salesperson-session" && process.env.NODE_ENV === "development") {
    return {
      isAuthenticated: true,
      user: {
        uid: "mock-salesperson-uid",
        email: "sales@example.com",
        role: "sales_staff",
      } as any,
      role: "sales_staff"
    };
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

/**
 * Enforces any admin role (super_admin or sales_staff) for API routes.
 * Returns a 401 response instead of redirecting.
 */
export async function requireAdminApi() {
  const session = await verifySession();
  if (!session.isAuthenticated) {
    throw new Error("Unauthorized"); // This will be caught by the API route and returned as 401
  }
  return session;
}
