import { verifySession } from "./auth-server";

export type Role = "SUPER_ADMIN" | "ADMIN" | "SALES" | "OPERATIONS" | "TECHNICIAN" | "CUSTOMER";

export async function checkRole(request?: Request | null, allowedRoles: Role[] = ["SUPER_ADMIN", "ADMIN"]) {
  const session = await verifySession();
  
  if (!session.isAuthenticated) {
     return false; // Unauthorized
  }

  const userRole = session.role?.toUpperCase() as Role || "UNAUTHORIZED";

  if ((userRole as any) === "UNAUTHORIZED" || !allowedRoles.includes(userRole)) {
     return false; // Forbidden
  }
  return true;
}


