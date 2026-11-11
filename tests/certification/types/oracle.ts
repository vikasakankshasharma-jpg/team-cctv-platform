import type { FrozenProduct } from "./certification.ts";
import { normalizeTechnology } from "../schema/normalize.ts";
import type { Technology } from "../schema/enums.ts";

export interface ResolvedProduct {
  product: FrozenProduct;
  resolved_technology?: Technology;
  source: "technology" | "technologies";
}

/** Resolves a frozen catalog product's canonical technology independently of production code. */
export function resolveProductTechnology(product: FrozenProduct): Technology | undefined {
  if (product.technology !== undefined) {
    const resolved = normalizeTechnology(product.technology);
    if (resolved) {
      return resolved;
    }
  }

  if (Array.isArray(product.technologies)) {
    const resolvedTechnologies = product.technologies
      .map(normalizeTechnology)
      .filter((value): value is Technology => value !== undefined);

    const unique = Array.from(new Set(resolvedTechnologies));

    // A product advertising multiple technologies must not be silently assigned to one.
    if (unique.length === 1) {
      return unique[0];
    }
  }

  return undefined;
}

export function resolveProduct(product: FrozenProduct): ResolvedProduct {
  if (product.technology !== undefined && normalizeTechnology(product.technology) !== undefined) {
    return {
      product,
      resolved_technology: resolveProductTechnology(product),
      source: "technology",
    };
  }

  return {
    product,
    resolved_technology: resolveProductTechnology(product),
    source: "technologies",
  };
}

export function productSupportsTechnology(product: FrozenProduct, technology: Technology): boolean {
  return resolveProductTechnology(product) === technology;
}

/** Quotable invariant: active, non-deleted, eligible items remain quotable regardless of stock. */
export function isQuotableProduct(product: FrozenProduct): boolean {
  return (
    product.is_active === true &&
    product.is_deleted !== true &&
    product.is_quotation_eligible !== false
  );
}

export function productChannelCapacity(product: FrozenProduct): number | undefined {
  const candidates = [
    product.channels,
    product.max_cameras,
    product.channel_capacity,
    product.channel_count,
    product.capacity,
  ];

  for (const value of candidates) {
    if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
      return value;
    }
  }

  return undefined;
}

export interface OracleMarginResult {
  base_cost: number;
  margin_percent: number;
  expected_unit_price: number;
}

export function approvedMarginPercent(product: FrozenProduct): number | undefined {
  if (typeof product.margin_percent === "number" && Number.isFinite(product.margin_percent)) {
    return product.margin_percent;
  }
  if (typeof product.margin === "number" && Number.isFinite(product.margin)) {
    return product.margin;
  }
  return undefined;
}

/** Computes whole-rupee expected selling unit price from GST-inclusive base cost and margin %. */
export function calculateApprovedUnitPrice(product: FrozenProduct): OracleMarginResult | undefined {
  if (typeof product.base_cost !== "number" || !Number.isFinite(product.base_cost)) {
    return undefined;
  }

  const marginPercent = approvedMarginPercent(product);
  if (marginPercent === undefined) {
    return undefined;
  }

  const expectedUnitPrice = Math.round(product.base_cost * (1 + marginPercent / 100));

  return {
    base_cost: product.base_cost,
    margin_percent: marginPercent,
    expected_unit_price: expectedUnitPrice,
  };
}
