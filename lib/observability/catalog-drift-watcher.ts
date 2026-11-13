/**
 * @file lib/observability/catalog-drift-watcher.ts
 * @description Invariants 6.2.11-6.2.13: Governed Catalog Drift Watcher.
 * Detects mutations between live Firestore products and the certified governed catalog.
 * Strict Invariant: ALERT ONLY — NEVER AUTO-REVERT! Preserves intentional business updates.
 */

export type DriftSeverity = "INFO" | "WARNING" | "CRITICAL";

export type DriftCategory =
  | "PRICE_DRIFT"
  | "SKU_DRIFT"
  | "ACTIVE_STATUS_DRIFT"
  | "QUOTATION_ELIGIBILITY_DRIFT"
  | "COMPATIBILITY_DRIFT"
  | "PRODUCT_ATTRIBUTE_DRIFT";

export interface CatalogDriftFinding {
  sku: string;
  field: string;
  category: DriftCategory;
  severity: DriftSeverity;
  governedValue: unknown;
  liveValue: unknown;
  variance?: number;
  variancePercent?: number;
  message: string;
  actionRequired: "REVIEW_REQUIRED" | "INFORMATIONAL";
}

export interface CatalogDriftIncident {
  incidentId: string;
  timestamp: string;
  sku: string;
  findings: CatalogDriftFinding[];
  maxSeverity: DriftSeverity;
  requiresReview: boolean;
  autoReverted: false; // Invariant 6.2.12: Strictly false
}

/**
 * Compares a live Firestore product against its certified governed state.
 * Emits alert findings without mutating either record.
 */
export function inspectProductDrift(
  liveProduct: Record<string, any>,
  governedProduct: Record<string, any>
): CatalogDriftIncident {
  const timestamp = new Date().toISOString();
  const sku = String(liveProduct?.sku || governedProduct?.sku || liveProduct?.id || governedProduct?.id || "UNKNOWN");
  const incidentId = `drift_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const findings: CatalogDriftFinding[] = [];

  // 1. Missing or Deleted Product
  if (!liveProduct) {
    findings.push({
      sku,
      field: "presence",
      category: "SKU_DRIFT",
      severity: "CRITICAL",
      governedValue: "EXISTS",
      liveValue: "DELETED_OR_MISSING",
      message: `Governed product ${sku} has been removed or deleted from live Firestore.`,
      actionRequired: "REVIEW_REQUIRED",
    });
  } else if (!governedProduct) {
    findings.push({
      sku,
      field: "presence",
      category: "SKU_DRIFT",
      severity: "WARNING",
      governedValue: "UNGOVERNED",
      liveValue: "NEW_UNGOVERNED_PRODUCT",
      message: `New uncertified product ${sku} detected in live Firestore without governance entry.`,
      actionRequired: "REVIEW_REQUIRED",
    });
  } else {
    // 2. Price Drift (CRITICAL if NaN/Negative, WARNING if changed)
    const governedPrice = governedProduct.unit_price;
    const livePrice = liveProduct.unit_price;

    if (livePrice === undefined || livePrice === null || !Number.isFinite(livePrice) || livePrice <= 0) {
      findings.push({
        sku,
        field: "unit_price",
        category: "PRICE_DRIFT",
        severity: "CRITICAL",
        governedValue: governedPrice,
        liveValue: livePrice,
        message: `Live product ${sku} has invalid or non-finite unit_price: ${livePrice}`,
        actionRequired: "REVIEW_REQUIRED",
      });
    } else if (governedPrice !== livePrice) {
      const variance = livePrice - governedPrice;
      const variancePercent = governedPrice > 0 ? Number(((variance / governedPrice) * 100).toFixed(2)) : undefined;
      findings.push({
        sku,
        field: "unit_price",
        category: "PRICE_DRIFT",
        severity: "WARNING",
        governedValue: governedPrice,
        liveValue: livePrice,
        variance,
        variancePercent,
        message: `Unit price for ${sku} drifted from governed ₹${governedPrice} to live ₹${livePrice} (${variance > 0 ? "+" : ""}${variance} ₹).`,
        actionRequired: "REVIEW_REQUIRED",
      });
    }

    // 3. Active / Quotation Eligibility Drift
    if (governedProduct.is_active !== liveProduct.is_active) {
      findings.push({
        sku,
        field: "is_active",
        category: "ACTIVE_STATUS_DRIFT",
        severity: "WARNING",
        governedValue: governedProduct.is_active,
        liveValue: liveProduct.is_active,
        message: `Active status for ${sku} changed from ${governedProduct.is_active} to ${liveProduct.is_active}.`,
        actionRequired: "REVIEW_REQUIRED",
      });
    }

    if (governedProduct.is_quotation_eligible !== liveProduct.is_quotation_eligible) {
      findings.push({
        sku,
        field: "is_quotation_eligible",
        category: "QUOTATION_ELIGIBILITY_DRIFT",
        severity: "WARNING",
        governedValue: governedProduct.is_quotation_eligible,
        liveValue: liveProduct.is_quotation_eligible,
        message: `Quotation eligibility for ${sku} changed from ${governedProduct.is_quotation_eligible} to ${liveProduct.is_quotation_eligible}.`,
        actionRequired: "REVIEW_REQUIRED",
      });
    }

    // 4. Attribute / Compatibility Drift (INFO)
    const governedName = governedProduct.name || governedProduct.display_name;
    const liveName = liveProduct.name || liveProduct.display_name;
    if (governedName && liveName && governedName !== liveName) {
      findings.push({
        sku,
        field: "display_name",
        category: "PRODUCT_ATTRIBUTE_DRIFT",
        severity: "INFO",
        governedValue: governedName,
        liveValue: liveName,
        message: `Product display name updated for ${sku}.`,
        actionRequired: "INFORMATIONAL",
      });
    }
  }

  const maxSeverity: DriftSeverity = findings.some((f) => f.severity === "CRITICAL")
    ? "CRITICAL"
    : findings.some((f) => f.severity === "WARNING")
    ? "WARNING"
    : "INFO";

  return {
    incidentId,
    timestamp,
    sku,
    findings,
    maxSeverity,
    requiresReview: findings.some((f) => f.actionRequired === "REVIEW_REQUIRED"),
    autoReverted: false, // Strict governance invariant
  };
}
