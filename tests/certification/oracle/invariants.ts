import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";
import type { FrozenProduct } from "../types/certification.ts";
import { detectImpossibleCombinations } from "../schema/impossible-combinations.ts";
import { isQuotableProduct } from "../types/oracle.ts";
import { calculateReverseInclusiveTax } from "./tax-oracle.ts";

export interface OracleInvariantFailure {
  code: string;
  severity: "CRITICAL" | "ERROR" | "WARNING";
  message: string;
}

export interface OracleInvariantReport {
  valid: boolean;
  failures: OracleInvariantFailure[];
}

const forbidden = new Set(["DEFAULT_500GB_HDD", "MOCK-BNC", "FALLBACK_CATALOG"]);

export function validateOracleInvariants(requirement: CanonicalRequirement, products: readonly FrozenProduct[] = []): OracleInvariantReport {
  const failures: OracleInvariantFailure[] = [];
  const impossible = detectImpossibleCombinations(requirement);
  if (!impossible.valid) {
    for (const issue of impossible.issues) failures.push({ code: issue.code, severity: issue.severity === "MANUAL_QUOTE" ? "WARNING" : "ERROR", message: issue.message });
  }

  for (const product of products) {
    const normalized = product.sku.toUpperCase();
    if (forbidden.has(normalized) || normalized.includes("FALLBACK_CATALOG")) failures.push({ code: "FORBIDDEN_PRODUCTION_SKU", severity: "CRITICAL", message: `Forbidden SKU ${product.sku} detected.` });
    if (product.is_active === true && product.is_deleted !== true && product.is_quotation_eligible !== false && !isQuotableProduct(product)) failures.push({ code: "QUOTABILITY_INVARIANT_FAILED", severity: "CRITICAL", message: `Active eligible product ${product.sku} is not quotable.` });
  }

  const gstSamples = [0, 1, 118, 1180, 11800];
  for (const gross of gstSamples) {
    const tax = calculateReverseInclusiveTax(gross);
    if (!tax.reconciled) failures.push({ code: "GST_RECONCILIATION_FAILED", severity: "CRITICAL", message: `GST reconciliation failed for gross ${gross}.` });
  }

  return { valid: !failures.some((failure) => failure.severity === "CRITICAL" || failure.severity === "ERROR"), failures };
}
