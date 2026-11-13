import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { FrozenAddonRule, FrozenProduct } from "../types/certification.ts";
import { exportFrozenSnapshot, type FrozenSnapshotExportInput } from "../fixtures/frozen-context.ts";
import { buildSkuCrosswalk } from "../fixtures/sku-crosswalk.ts";

export interface SnapshotSourceDocument {
  products?: unknown;
  catalog?: unknown;
  catalog_products?: unknown;
  source_products?: unknown;
  addons?: unknown;
  addon_rules?: unknown;
  geo_rules?: unknown;
  promoters?: unknown;
  app_settings?: unknown;
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
}

function firstNumber(...values: unknown[]): number | undefined {
  for (const value of values) if (typeof value === "number" && Number.isFinite(value)) return value;
  return undefined;
}

export function normalizeProduct(raw: Record<string, unknown>, defaultIsAddon = false): FrozenProduct {
  const sku = String(raw.sku ?? raw.id ?? raw.product_id ?? "").trim();
  return {
    ...raw,
    sku,
    id: typeof raw.id === "string" ? raw.id : undefined,
    technical_name: typeof raw.technical_name === "string" ? raw.technical_name : undefined,
    display_name: typeof raw.display_name === "string" ? raw.display_name : typeof raw.name === "string" ? raw.name : undefined,
    name: typeof raw.name === "string" ? raw.name : undefined,
    unit_price: firstNumber(raw.unit_price, raw.price, raw.selling_price),
    base_cost: firstNumber(raw.base_cost, raw.baseCost, raw.cost_price, raw.cost),
    is_addon: typeof raw.is_addon === "boolean" ? raw.is_addon : defaultIsAddon,
  };
}

export async function readSnapshotSource(filePath: string): Promise<SnapshotSourceDocument> {
  const raw = JSON.parse(await readFile(resolve(filePath), "utf8")) as unknown;
  if (Array.isArray(raw)) return { products: raw };
  if (typeof raw === "object" && raw !== null) return raw as SnapshotSourceDocument;
  throw new Error(`SNAPSHOT_SOURCE_INVALID: ${filePath}`);
}

export interface BuildSnapshotOptions {
  sourceFile: string;
  outputDir: string;
  gitCommit?: string;
  businessRulesVersion?: string;
  harnessVersion?: string;
  catalogFile?: string;
}

export async function buildFrozenSnapshot(options: BuildSnapshotOptions) {
  const source = await readSnapshotSource(options.sourceFile);
  const catalogSource = options.catalogFile ? await readSnapshotSource(options.catalogFile) : source;

  const sourceProducts = asArray(source.source_products ?? source.products).map((raw) => normalizeProduct(raw, false));
  const catalogProducts = asArray(catalogSource.catalog_products ?? catalogSource.catalog ?? catalogSource.products).map((raw) => normalizeProduct(raw, false));

  const addonSource = source.addons ?? catalogProducts.filter((product) => product.is_addon === true);
  const addons = asArray(addonSource).map((raw) => normalizeProduct(raw, true));
  const normalProducts = catalogProducts.filter((product) => product.is_addon !== true);

  const crosswalk = buildSkuCrosswalk(sourceProducts, normalProducts);
  const audit = {
    generated_from: resolve(options.sourceFile),
    source_product_count: sourceProducts.length,
    catalog_product_count: normalProducts.length,
    crosswalk,
  };

  const input: FrozenSnapshotExportInput = {
    products: normalProducts,
    addons,
    addon_rules: asArray(source.addon_rules) as unknown as FrozenAddonRule[],
    geo_rules: asArray(source.geo_rules),
    promoters: asArray(source.promoters),
    app_settings: (source.app_settings && typeof source.app_settings === "object" ? source.app_settings : {}) as Record<string, unknown>,
    sku_crosswalk: audit,
    git_commit: options.gitCommit ?? "UNKNOWN",
    business_rules_version: options.businessRulesVersion ?? "UNKNOWN",
    harness_version: options.harnessVersion ?? "PHASE-2A",
  };

  return exportFrozenSnapshot(options.outputDir, input);
}

export function snapshotBuilderUsage(): string {
  return "buildFrozenSnapshot({ sourceFile, outputDir, catalogFile?, gitCommit?, businessRulesVersion?, harnessVersion? })";
}
