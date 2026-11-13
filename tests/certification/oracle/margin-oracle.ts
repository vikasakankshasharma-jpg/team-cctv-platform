import type { FrozenProduct } from "../types/certification.ts";
import { calculateApprovedUnitPrice } from "../types/oracle.ts";

export const DEFAULT_COMPONENT_MARGINS = {
  margin_cctv_camera: 15,
  margin_recorder: 15,
  margin_hdd: 5,
  margin_power_supply: 25,
  margin_junction_box: 50,
  margin_connectors: 50,
  margin_hdmi_cable: 20,
  margin_rack: 30,
  cable_margin: 40,
  labor_margin: 0,
} as const;

export type MarginComponent = keyof typeof DEFAULT_COMPONENT_MARGINS;
export type BudgetMarginComponent = "margin_cctv_camera_budget" | "margin_hdd_budget";
export type RoundingMode = "nearest_1" | "nearest_10";

export interface MarginOraclePolicy {
  margins?: Partial<Record<MarginComponent | BudgetMarginComponent, number>>;
  rounding_mode?: RoundingMode;
}

export interface MarginOracleResult {
  sku?: string;
  component: MarginComponent;
  base_cost: number;
  margin_percent: number;
  raw_selling_price: number;
  /** GST-inclusive gross selling price. Kept under an explicit name to avoid ex-tax mislabeling. */
  selling_price_gross_inclusive: number;
  rounding_mode: RoundingMode;
}

function roundByMode(value: number, mode: RoundingMode): number {
  return mode === "nearest_10" ? Math.round(value / 10) * 10 : Math.round(value);
}

function normalizedBrand(product: FrozenProduct): string {
  return `${product.brand ?? ""} ${product.category ?? ""} ${product.technical_name ?? ""} ${product.display_name ?? product.name ?? ""}`.toLowerCase();
}

function isBudgetBrand(product: FrozenProduct): boolean {
  return /(^|\b)(budget|economy|economical)(\b|$)/i.test(normalizedBrand(product));
}

export function marginComponentForProduct(product: FrozenProduct): MarginComponent {
  const text = normalizedBrand(product);
  if (text.includes("camera")) return "margin_cctv_camera";
  if (text.includes("recorder") || text.includes("nvr") || text.includes("dvr")) return "margin_recorder";
  if (text.includes("hdd") || text.includes("hard disk") || text.includes("surveillance disk")) return "margin_hdd";
  if (text.includes("smps") || text.includes("power supply") || text.includes("poe")) return "margin_power_supply";
  if (text.includes("junction")) return "margin_junction_box";
  if (text.includes("connector") || text.includes("bnc") || text.includes("rj45") || text.includes("balun")) return "margin_connectors";
  if (text.includes("hdmi")) return "margin_hdmi_cable";
  if (text.includes("rack")) return "margin_rack";
  if (text.includes("cable")) return "cable_margin";
  if (text.includes("labor") || text.includes("installation") || text.includes("visit")) return "labor_margin";
  // Unknown lines must never silently inherit a 20% markup. Labor is the zero-markup safe default.
  return "labor_margin";
}

export function approvedMarginForProduct(product: FrozenProduct, policy: MarginOraclePolicy = {}): number {
  const component = marginComponentForProduct(product);
  if (component === "margin_cctv_camera" && isBudgetBrand(product)) {
    return policy.margins?.margin_cctv_camera_budget ?? 30;
  }
  if (component === "margin_hdd" && isBudgetBrand(product)) {
    return policy.margins?.margin_hdd_budget ?? 10;
  }
  return policy.margins?.[component] ?? DEFAULT_COMPONENT_MARGINS[component];
}

export function calculateOracleMargin(product: FrozenProduct, policy: MarginOraclePolicy = {}): MarginOracleResult | undefined {
  if (typeof product.base_cost !== "number" || !Number.isFinite(product.base_cost)) return undefined;
  const component = marginComponentForProduct(product);
  const marginPercent = approvedMarginForProduct(product, policy);
  const roundingMode = policy.rounding_mode ?? "nearest_1";
  const raw = product.base_cost * (1 + marginPercent / 100);
  return {
    sku: product.sku,
    component,
    base_cost: product.base_cost,
    margin_percent: marginPercent,
    raw_selling_price: raw,
    selling_price_gross_inclusive: roundByMode(raw, roundingMode),
    rounding_mode: roundingMode,
  };
}

export function compareProductMarginAgainstApprovedPrice(product: FrozenProduct, policy: MarginOraclePolicy = {}) {
  const result = calculateOracleMargin(product, policy);
  if (!result) return undefined;
  const approved = calculateApprovedUnitPrice(product);
  return {
    oracle: result,
    approved,
    delta: typeof product.unit_price === "number" ? product.unit_price - result.selling_price_gross_inclusive : undefined,
  };
}
