import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";
import type { FrozenContext, FrozenAddonRule, FrozenProduct } from "../types/certification.ts";
import { isQuotableProduct } from "../types/oracle.ts";

export interface OracleAddonLine { sku: string; quantity: number; reason: string; }
export interface OracleAddonResult { lines: OracleAddonLine[]; issues: string[]; }

function productText(product: FrozenProduct): string {
  return `${product.technical_name ?? ""} ${product.display_name ?? product.name ?? ""}`.toLowerCase();
}

function getPath(value: unknown, path: string): unknown {
  let current: unknown = value;
  for (const segment of path.split(".")) {
    if (!current || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

function equalValue(actual: unknown, expected: unknown): boolean {
  if (Array.isArray(expected)) return expected.some((item) => equalValue(actual, item));
  if (typeof actual === "string" && typeof expected === "string") return actual.toLowerCase() === expected.toLowerCase();
  return actual === expected;
}

function conditionMatches(condition: Record<string, unknown>, requirement: CanonicalRequirement): boolean {
  for (const [key, expected] of Object.entries(condition)) {
    if (key === "$and" && Array.isArray(expected)) {
      if (!expected.every((item) => item && typeof item === "object" && conditionMatches(item as Record<string, unknown>, requirement))) return false;
      continue;
    }
    if (key === "$or" && Array.isArray(expected)) {
      if (!expected.some((item) => item && typeof item === "object" && conditionMatches(item as Record<string, unknown>, requirement))) return false;
      continue;
    }
    if (key.startsWith("$")) continue;
    const actual = getPath(requirement, key) ?? getPath(requirement, key.replace(/^requirement\./, ""));
    if (expected && typeof expected === "object" && !Array.isArray(expected)) {
      const rule = expected as Record<string, unknown>;
      if ("$eq" in rule && !equalValue(actual, rule.$eq)) return false;
      if ("$in" in rule && !Array.isArray(rule.$in)) return false;
      if ("$in" in rule && !(rule.$in as unknown[]).some((item) => equalValue(actual, item))) return false;
      if ("$contains" in rule) {
        const haystack = Array.isArray(actual) ? actual : [actual];
        if (!haystack.some((item) => equalValue(item, rule.$contains))) return false;
      }
      continue;
    }
    if (!equalValue(actual, expected)) return false;
  }
  return true;
}

function ruleApplies(rule: FrozenAddonRule, requirement: CanonicalRequirement): boolean {
  if (rule.condition && typeof rule.condition === "object") return conditionMatches(rule.condition, requirement);
  // Backward-compatible trigger only when no structured condition is available.
  const text = JSON.stringify(rule).toLowerCase();
  if (text.includes("ladder")) return requirement.ceiling_height === "very_high";
  return false;
}

function quantityFromFormula(rule: FrozenAddonRule, requirement: CanonicalRequirement): number {
  const formula = String(rule.quantity_formula ?? "").toLowerCase();
  const wired = requirement.cameras.filter((camera) => camera.technology !== "Wireless").reduce((sum, camera) => sum + camera.count, 0);
  if (/per[_ -]?camera/.test(formula) || /camera_count/.test(formula)) return Math.max(1, wired || requirement.camera_count);
  if (/per[_ -]?wired/.test(formula)) return Math.max(1, wired);
  const numeric = Number(formula);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 1;
}

function findAddon(context: FrozenContext, rule: FrozenAddonRule): FrozenProduct | undefined {
  const sku = rule.addon_sku ?? rule.addon_product_sku;
  if (sku) {
    const exact = context.addons.find((product) => isQuotableProduct(product) && product.sku.trim().toUpperCase() === sku.trim().toUpperCase());
    if (exact) return exact;
  }
  const text = JSON.stringify(rule).toLowerCase();
  return context.addons.find((product) => isQuotableProduct(product) && text.split(/[^a-z0-9]+/).filter((token) => token.length > 4).some((token) => productText(product).includes(token)));
}

export function calculateOracleAddons(requirement: CanonicalRequirement, context: FrozenContext): OracleAddonResult {
  const lines: OracleAddonLine[] = [];
  const issues: string[] = [];
  // Junction boxes are BOM-owned. Do not add them here.

  const broadband = (requirement.broadband_status ?? "").toLowerCase();
  const broadbandTriggers: Array<[string, RegExp, string]> = [
    ["sim_router", /sim[_ -]?router|4g[_ -]?router|sim router/i, "Broadband status requires SIM router."],
    ["wifi_extender", /wifi[_ -]?extender|wi-fi[_ -]?extender|range extender/i, "Broadband status requires Wi-Fi extender."],
  ];
  for (const [trigger, matcher, reason] of broadbandTriggers) {
    if (broadband.includes(trigger)) {
      const product = context.addons.find((item) => isQuotableProduct(item) && matcher.test(productText(item)));
      if (product) lines.push({ sku: product.sku, quantity: 1, reason });
      else issues.push(`BROADBAND_ADDON_NOT_FOUND:${trigger}`);
    }
  }

  for (const rule of context.addon_rules) {
    if (!ruleApplies(rule, requirement)) continue;
    const product = findAddon(context, rule);
    if (!product) {
      issues.push(`ADDON_RULE_PRODUCT_NOT_FOUND:${rule.addon_sku ?? rule.addon_product_sku ?? "unknown"}`);
      continue;
    }
    lines.push({ sku: product.sku, quantity: quantityFromFormula(rule, requirement), reason: `Structured addon rule${rule.id ? ` ${rule.id}` : ""} matched.` });
  }

  return { lines, issues };
}
