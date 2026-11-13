import type { FrozenProduct } from "../types/certification.ts";

export type SkuCrosswalkStatus =
  | "MATCHED"
  | "UNMAPPED"
  | "AMBIGUOUS"
  | "COST_DRIFT"
  | "MARGIN_DRIFT";

export interface SkuCrosswalkEntry {
  source_sku: string;
  catalog_skus: string[];
  status: SkuCrosswalkStatus;
  source_base_cost?: number;
  catalog_base_cost?: number;
  source_unit_price?: number;
  catalog_unit_price?: number;
  approved_margin_percent?: number;
  expected_unit_price?: number;
  base_cost_delta?: number;
  unit_price_delta?: number;
  reason: string;
}

export interface SkuCrosswalkResult {
  entries: SkuCrosswalkEntry[];
  missing_active_catalog_skus: string[];
  duplicate_source_skus: string[];
  unmapped_source_skus: string[];
  ambiguous_source_skus: string[];
  cost_drift_skus: string[];
  margin_drift_skus: string[];
}

function normalizeSku(sku: unknown): string {
  return String(sku ?? "").trim().toUpperCase().replace(/[\s_-]+/g, "");
}

function approvedMarginPercent(product: FrozenProduct): number | undefined {
  const candidates = [product.margin_percent, (product as FrozenProduct & { margin_percentage?: unknown }).margin_percentage, product.margin];
  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return undefined;
}

function expectedUnitPrice(product: FrozenProduct): number | undefined {
  if (typeof product.base_cost !== "number" || !Number.isFinite(product.base_cost)) return undefined;
  const margin = approvedMarginPercent(product);
  return margin === undefined ? undefined : Math.round((product.base_cost * (100 + margin)) / 100);
}

export function buildSkuCrosswalk(
  sourceProducts: readonly FrozenProduct[],
  catalogProducts: readonly FrozenProduct[],
  toleranceRupees = 0,
): SkuCrosswalkResult {
  const sourceBySku = new Map<string, FrozenProduct[]>();
  for (const source of sourceProducts) {
    const key = normalizeSku(source.sku ?? source.id);
    const rows = sourceBySku.get(key) ?? [];
    rows.push(source);
    sourceBySku.set(key, rows);
  }
  const duplicateSourceSkus = [...sourceBySku.entries()].filter(([, rows]) => rows.length > 1).map(([key]) => key);

  const catalogBySku = new Map<string, FrozenProduct[]>();
  for (const product of catalogProducts) {
    const key = normalizeSku(product.sku ?? product.id);
    const rows = catalogBySku.get(key) ?? [];
    rows.push(product);
    catalogBySku.set(key, rows);
  }

  const entries: SkuCrosswalkEntry[] = [];
  const unmappedSourceSkus: string[] = [];
  const ambiguousSourceSkus: string[] = [];
  const costDriftSkus: string[] = [];
  const marginDriftSkus: string[] = [];

  for (const source of sourceProducts) {
    const sourceSku = String(source.sku ?? source.id ?? "").trim();
    const key = normalizeSku(sourceSku);
    const candidates = catalogBySku.get(key) ?? [];
    if (!sourceSku) continue;
    if (candidates.length === 0) {
      unmappedSourceSkus.push(sourceSku);
      entries.push({ source_sku: sourceSku, catalog_skus: [], status: "UNMAPPED", source_base_cost: source.base_cost, source_unit_price: source.unit_price, reason: "Source SKU has no catalog SKU match." });
      continue;
    }
    if (candidates.length > 1) {
      ambiguousSourceSkus.push(sourceSku);
      entries.push({ source_sku: sourceSku, catalog_skus: candidates.map((p) => String(p.sku ?? p.id ?? "").trim()), status: "AMBIGUOUS", source_base_cost: source.base_cost, source_unit_price: source.unit_price, reason: "Multiple catalog products share the normalized SKU." });
      continue;
    }
    const catalog = candidates[0];
    const costDelta = typeof source.base_cost === "number" && typeof catalog.base_cost === "number" ? catalog.base_cost - source.base_cost : undefined;
    const costDrift = costDelta !== undefined && Math.abs(costDelta) > toleranceRupees;
    const expectedPrice = expectedUnitPrice(catalog);
    const unitPriceDelta = expectedPrice !== undefined && typeof catalog.unit_price === "number" ? catalog.unit_price - expectedPrice : undefined;
    const marginDrift = unitPriceDelta !== undefined && Math.abs(unitPriceDelta) > toleranceRupees;
    let status: "MATCHED" | "COST_DRIFT" | "MARGIN_DRIFT" = "MATCHED";
    if (costDrift) { status = "COST_DRIFT"; costDriftSkus.push(sourceSku); }
    else if (marginDrift) { status = "MARGIN_DRIFT"; marginDriftSkus.push(sourceSku); }
    entries.push({ source_sku: sourceSku, catalog_skus: [String(catalog.sku ?? catalog.id ?? "").trim()], status, source_base_cost: source.base_cost, catalog_base_cost: catalog.base_cost, source_unit_price: source.unit_price, catalog_unit_price: catalog.unit_price, approved_margin_percent: approvedMarginPercent(catalog), expected_unit_price: expectedPrice, base_cost_delta: costDelta, unit_price_delta: unitPriceDelta, reason: status === "MATCHED" ? "Exact normalized SKU match with no detected cost/margin drift." : status === "COST_DRIFT" ? "Catalog base cost differs from source price sheet." : "Catalog unit price differs from approved rounded margin price." });
  }

  const sourceSkuSet = new Set(sourceProducts.map((p) => normalizeSku(p.sku ?? p.id)));
  const missingActiveCatalogSkus = catalogProducts
    .filter((p) => p.is_active === true && p.is_deleted !== true && p.is_quotation_eligible !== false)
    .filter((p) => !sourceSkuSet.has(normalizeSku(p.sku ?? p.id)))
    .map((p) => String(p.sku ?? p.id ?? "").trim())
    .filter(Boolean);

  return { entries, missing_active_catalog_skus: missingActiveCatalogSkus, duplicate_source_skus: duplicateSourceSkus, unmapped_source_skus: unmappedSourceSkus, ambiguous_source_skus: ambiguousSourceSkus, cost_drift_skus: costDriftSkus, margin_drift_skus: marginDriftSkus };
}
