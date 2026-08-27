import { adminDb, serverTimestamp } from "./firebase-admin";

export interface PricingAuditLog {
  targetType: "RULE" | "PRODUCT";
  targetId: string;       // e.g., "BRAND_CP_Plus" or SKU
  field: string;          // e.g., "markup_percent" or "base_cost"
  oldValue: number | null;
  newValue: number;
  adminId: string;        // The user who made the change
  reason?: string;
  timestamp?: any;
}

export async function logPricingChange(log: PricingAuditLog) {
  try {
    await adminDb.collection("pricing_audit_logs").add({
      ...log,
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to write pricing audit log", err);
  }
}
