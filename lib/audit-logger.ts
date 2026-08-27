import { adminDb } from "./firebase-admin";

export type AuditAction = 
  | "INVENTORY_ADJUST" 
  | "INVENTORY_RECEIVE"
  | "INVENTORY_CONSUME"
  | "SERIAL_ALLOCATE" 
  | "SERIAL_INSTALL" 
  | "SERIAL_RMA"
  | "WARRANTY_POLICY_CHANGE"
  | "AMC_PLAN_CHANGE"
  | "AMC_CONTRACT_CHANGE"
  | "TICKET_STATUS_CHANGE"
  | "INVOICE_CREATE"
  | "PAYMENT_RECEIVE"
  | "ROLE_CHANGE"
  | "CUSTOMER_IDENTITY_CHANGE"
  | "CUSTOMER_MIGRATION"
  | "SECURITY_EVENT";

export interface AuditLogEntry {
  actorUid: string;
  actorRole: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  customerId?: string | null;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId: string;
  timestamp: string;
  success: boolean;
}

export class AuditLogger {
  
  /**
   * Logs an audit event outside of a transaction
   */
  static async log(entry: AuditLogEntry) {
    try {
      await adminDb.collection("audit_logs").add(entry);
    } catch (e) {
      console.error("[CRITICAL] Failed to write audit log:", e);
    }
  }

  /**
   * Attaches an audit event to an existing Firestore Transaction
   */
  static logInTransaction(transaction: FirebaseFirestore.Transaction, entry: AuditLogEntry) {
    const ref = adminDb.collection("audit_logs").doc();
    transaction.set(ref, entry);
  }
}
