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

function normalizeSku(sku: string): string {
  return sku.trim().toUpperCase().replace(/[\s_-]+/g, "");
}

function roundRupee(value: number): number {
  return Math.round(value);
}

function approvedMarginPercent(product: FrozenProduct): number | undefined {
  if (typeof product.margin_percent === "number" && Number.isFinite(product.margin_percent)) {
    return product.margin_percent;
  }
  if (typeof product.margin === "number" && Number.isFinite(product.margin)) {
    return product.margin;
  }
  return undefined;
}

function expectedUnitPrice(product: FrozenProduct): number | undefined {
  if (typeof product.base_cost !== "number" || !Number.isFinite(product.base_cost)) {
    return undefined;
  }
  const margin = approvedMarginPercent(product);
  if (margin === undefined) {
    return undefined;
  }
  return roundRupee(product.base_cost * (1 + margin / 100));
}

/**
 * Reconciles source price-list records against frozen catalog SKUs using exact
 * normalized matching, whole-rupee margin rounding, and bidirectional coverage checks.
 */
export function buildSkuCrosswalk(
  sourceProducts: readonly FrozenProduct[],
  catalogProducts: readonly FrozenProduct[],
  toleranceRupees = 0,
): SkuCrosswalkResult {
  const sourceBySku = new Map<string, FrozenProduct[]>();
  for (const source of sourceProducts) {
    const key = normalizeSku(source.sku);
    const existing = sourceBySku.get(key) ?? [];
    existing.push(source);
    sourceBySku.set(key, existing);
  }

  // Duplicate source sheet rows are reported separately from catalog ambiguity.
  const duplicateSourceSkus = Array.from(sourceBySku.entries())
    .filter(([, products]) => products.length > 1)
    .map(([key]) => key);

  const catalogBySku = new Map<string, FrozenProduct[]>();
  for (const product of catalogProducts) {
    const key = normalizeSku(product.sku);
    const existing = catalogBySku.get(key) ?? [];
    existing.push(product);
    catalogBySku.set(key, existing);
  }

  const entries: SkuCrosswalkEntry[] = [];
  const unmappedSourceSkus: string[] = [];
  const ambiguousSourceSkus: string[] = [];
  const costDriftSkus: string[] = [];
  const marginDriftSkus: string[] = [];

  for (const source of sourceProducts) {
    const key = normalizeSku(source.sku);
    const candidates = catalogBySku.get(key) ?? [];

    if (candidates.length === 0) {
      unmappedSourceSkus.push(source.sku);
      entries.push({
        source_sku: source.sku,
        catalog_skus: [],
        status: "UNMAPPED",
        source_base_cost: source.base_cost,
        source_unit_price: source.unit_price,
        reason: "Source SKU has no catalog SKU match.",
      });
      continue;
    }

    if (candidates.length > 1) {
      ambiguousSourceSkus.push(source.sku);
      entries.push({
        source_sku: source.sku,
        catalog_skus: candidates.map((product) => product.sku),
        status: "AMBIGUOUS",
        source_base_cost: source.base_cost,
        source_unit_price: source.unit_price,
        reason: "Multiple catalog products share the normalized SKU.",
      });
      continue;
    }

    const catalog = candidates[0];

    const costDelta =
      typeof source.base_cost === "number" && typeof catalog.base_cost === "number"
        ? catalog.base_cost - source.base_cost
        : undefined;
    const costDrift = costDelta !== undefined && Math.abs(costDelta) > toleranceRupees;

    const expectedPrice = expectedUnitPrice(catalog);
    const unitPriceDelta =
      expectedPrice !== undefined && typeof catalog.unit_price === "number"
        ? catalog.unit_price - expectedPrice
        : undefined;
    const marginDrift = unitPriceDelta !== undefined && Math.abs(unitPriceDelta) > toleranceRupees;

    let status: "MATCHED" | "COST_DRIFT" | "MARGIN_DRIFT" = "MATCHED";
    if (costDrift) {
      status = "COST_DRIFT";
      costDriftSkus.push(source.sku);
    } else if (marginDrift) {
      status = "MARGIN_DRIFT";
      marginDriftSkus.push(source.sku);
    }

    entries.push({
      source_sku: source.sku,
      catalog_skus: [catalog.sku],
      status,
      source_base_cost: source.base_cost,
      catalog_base_cost: catalog.base_cost,
      source_unit_price: source.unit_price,
      catalog_unit_price: catalog.unit_price,
      approved_margin_percent: approvedMarginPercent(catalog),
      expected_unit_price: expectedPrice,
      base_cost_delta: costDelta,
      unit_price_delta: unitPriceDelta,
      reason:
        status === "MATCHED"
          ? "Exact normalized SKU match with no detected cost/margin drift."
          : status === "COST_DRIFT"
            ? "Catalog base cost differs from source price sheet."
            : "Catalog unit price differs from approved rounded margin price.",
    });
  }

  const sourceSkuSet = new Set(sourceProducts.map((product) => normalizeSku(product.sku)));
  const missingActiveCatalogSkus = catalogProducts
    .filter(
      (product) =>
        product.is_active === true &&
        product.is_deleted !== true &&
        product.is_quotation_eligible !== false,
    )
    .filter((product) => !sourceSkuSet.has(normalizeSku(product.sku)))
    .map((product) => product.sku);

  return {
    entries,
    missing_active_catalog_skus: missingActiveCatalogSkus,
    duplicate_source_skus: duplicateSourceSkus,
    unmapped_source_skus: unmappedSourceSkus,
    ambiguous_source_skus: ambiguousSourceSkus,
    cost_drift_skus: costDriftSkus,
    margin_drift_skus: marginDriftSkus,
  };
}
