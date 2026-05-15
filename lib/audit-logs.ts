/**
 * @file lib/audit-logs.ts
 * @description Centralized enterprise audit logging for TEAM CCTV Platform.
 * Logs all sensitive administrative and financial actions to Firestore.
 */

import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export type AuditAction = 
  | "PRODUCT_CREATE" | "PRODUCT_UPDATE" | "PRODUCT_DELETE"
  | "LEAD_UPDATE" | "LEAD_REASSIGN"
  | "QUOTE_ACCEPT" | "QUOTE_RECALCULATE"
  | "SETTINGS_UPDATE"
  | "FRANCHISE_CREATE" | "FRANCHISE_UPDATE" | "FRANCHISE_DELETE"
  | "SALESPERSON_CREATE" | "SALESPERSON_UPDATE"
  | "BULK_PRODUCT_IMPORT" | "BULK_PRODUCT_EXPORT"
  | "ADMIN_LOGIN" | "ADMIN_LOGIN_FAILURE";

export interface AuditLogEntry {
  action: AuditAction;
  actor_id: string;
  actor_email?: string;
  resource_id?: string;
  resource_type: "product" | "lead" | "quote" | "settings" | "auth" | "franchise_dealer" | "salesperson";
  metadata?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Persists an audit log entry to Firestore.
 */
export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    if (!adminDb) return;

    await adminDb.collection("audit_logs").add({
      ...entry,
      timestamp: serverTimestamp(),
    });
  } catch (error) {
    // Non-blocking: Audit logging failure should not crash the primary action
    console.error("FAILED TO WRITE AUDIT LOG:", error);
  }
}

/**
 * Middleware/Helper to automatically extract request info for logging.
 */
export function getRequestMetadata(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";
  return { ip, ua };
}
