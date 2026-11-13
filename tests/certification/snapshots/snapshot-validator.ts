import type { FrozenContext, FrozenProduct } from "../types/certification.ts";
import { buildSkuCrosswalk, type SkuCrosswalkResult } from "../fixtures/sku-crosswalk.ts";

export type SnapshotFindingSeverity = "CRITICAL" | "ERROR" | "WARNING";

export interface SnapshotFinding {
  code: string;
  severity: SnapshotFindingSeverity;
  message: string;
  sku?: string;
  field?: string;
  expected?: unknown;
  actual?: unknown;
}

export interface SnapshotValidationReport {
  valid: boolean;
  findings: SnapshotFinding[];
  sku_crosswalk?: SkuCrosswalkResult;
}

const FORBIDDEN_SKUS = new Set(["DEFAULT_500GB_HDD", "FALLBACK_CATALOG", "mock-bnc", "mockSettings"].map((sku) => sku.trim().toUpperCase().replace(/[\s_-]+/g, "")));
const FORBIDDEN_SKU_REGEXES = [/^MOCK-/i, /^__CALCULATED_/i];

function add(findings: SnapshotFinding[], finding: SnapshotFinding): void {
  findings.push(finding);
}

function validateProducts(products: readonly FrozenProduct[], label: "catalog" | "addons", findings: SnapshotFinding[]): void {
  const seen = new Set<string>();
  for (const product of products) {
    const sku = typeof product.sku === "string" ? product.sku.trim() : "";
    if (!sku) {
      add(findings, { code: "MISSING_SKU", severity: "CRITICAL", message: `${label} product has no SKU.` });
      continue;
    }
    const normalized = sku.trim().toUpperCase().replace(/[\s_-]+/g, "");
    if (seen.has(normalized)) {
      add(findings, { code: "DUPLICATE_SKU", severity: "CRITICAL", sku, message: `Duplicate ${label} SKU detected.` });
    }
    seen.add(normalized);

    if (FORBIDDEN_SKUS.has(normalized) || FORBIDDEN_SKU_REGEXES.some((pattern) => pattern.test(sku))) {
      add(findings, { code: "FORBIDDEN_SKU", severity: "CRITICAL", sku, message: "Forbidden mock/default SKU is present." });
    }
    if (sku.toUpperCase().includes("FALLBACK_CATALOG")) {
      add(findings, { code: "FORBIDDEN_FALLBACK_CATALOG", severity: "CRITICAL", sku, message: "Fallback catalog marker is present." });
    }
    if (label === "catalog" && product.is_addon === true) {
      add(findings, { code: "ADDON_CONTAMINATION", severity: "CRITICAL", sku, message: "is_addon=true product is inside normal catalog products." });
    }
    if (label === "addons" && product.is_addon !== true) {
      add(findings, { code: "ADDON_SEPARATION_ERROR", severity: "ERROR", sku, message: "Addon snapshot contains a product without is_addon=true." });
    }
    if (product.is_active === true && product.is_deleted !== true && product.is_quotation_eligible !== false) {
      const displayName = typeof (product as any).display_name === "string" ? (product as any).display_name.trim() : "";
      const name = typeof (product as any).name === "string" ? (product as any).name.trim() : "";
      const technicalName = typeof (product as any).technical_name === "string" ? (product as any).technical_name.trim() : "";
      if (!displayName && !name && !technicalName) {
        add(findings, { code: "MISSING_DISPLAY_NAME", severity: "ERROR", sku, field: "display_name", message: "Active quotable catalog item has no display_name, name, or technical_name; production pricing may assume display_name is defined." });
      }
    }
    if (product.is_active === true && product.is_deleted !== true && product.is_quotation_eligible !== false && typeof product.unit_price === "number" && typeof product.base_cost === "number" && product.unit_price === product.base_cost) {
      add(findings, { code: "UNIT_PRICE_EQUALS_BASE_COST", severity: "CRITICAL", sku, field: "unit_price", expected: "unit_price must reflect approved selling-price policy", actual: product.unit_price, message: "Catalog unit_price equals base_cost; possible pricing-master drift." });
    }
  }
}

export function validateFrozenSnapshot(context: FrozenContext, sourceProducts?: readonly FrozenProduct[]): SnapshotValidationReport {
  const findings: SnapshotFinding[] = [];
  validateProducts(context.products, "catalog", findings);
  validateProducts(context.addons, "addons", findings);

  let crosswalk: SkuCrosswalkResult | undefined;
  if (sourceProducts) {
    crosswalk = buildSkuCrosswalk(sourceProducts, context.products);
    for (const sku of crosswalk.duplicate_source_skus) {
      add(findings, { code: "DUPLICATE_SOURCE_SKU", severity: "CRITICAL", sku, message: "Source price list contains duplicate SKU." });
    }
    for (const sku of crosswalk.unmapped_source_skus) {
      add(findings, { code: "UNMAPPED_SOURCE_SKU", severity: "CRITICAL", sku, message: "Source SKU has no catalog match." });
    }
    for (const sku of crosswalk.ambiguous_source_skus) {
      add(findings, { code: "AMBIGUOUS_CATALOG_SKU", severity: "CRITICAL", sku, message: "Source SKU maps to multiple catalog products." });
    }
    for (const sku of crosswalk.cost_drift_skus) {
      add(findings, { code: "BASE_COST_DRIFT", severity: "CRITICAL", sku, message: "Catalog base cost differs from source price list." });
    }
    for (const sku of crosswalk.margin_drift_skus) {
      add(findings, { code: "UNIT_PRICE_MARGIN_DRIFT", severity: "CRITICAL", sku, message: "Catalog unit price differs from approved rounded margin price." });
    }
    for (const sku of crosswalk.missing_active_catalog_skus) {
      add(findings, { code: "ACTIVE_CATALOG_SKU_NOT_IN_SOURCE", severity: "WARNING", sku, message: "Active quotable catalog SKU is absent from source price list." });
    }
  } else {
    add(findings, { code: "SKU_CROSSWALK_NOT_RUN", severity: "WARNING", message: "No source price-list products were supplied; crosswalk audit was not executed." });
  }

  return { valid: !findings.some((finding) => finding.severity === "CRITICAL" || finding.severity === "ERROR"), findings, sku_crosswalk: crosswalk };
}
