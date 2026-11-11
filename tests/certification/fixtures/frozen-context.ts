import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

import type {
  FrozenAddonRule,
  FrozenContext,
  FrozenFileManifestEntry,
  FrozenManifest,
  FrozenProduct,
} from "../types/certification.ts";

const SNAPSHOT_FILES = {
  products: "catalog.snapshot.json",
  addons: "addons.snapshot.json",
  addon_rules: "addon-rules.snapshot.json",
  geo_rules: "geo-rules.snapshot.json",
  promoters: "promoters.snapshot.json",
  app_settings: "app-settings.snapshot.json",
  sku_crosswalk: "sku-crosswalk.json",
  manifest: "snapshot-manifest.json",
} as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Recursive deterministic JSON serialization.
 * Object keys are sorted recursively (`undefined` properties omitted like `JSON.stringify`);
 * arrays preserve their order.
 */
export function canonicalJson(value: unknown): string {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => (item === undefined ? "null" : canonicalJson(item))).join(",")}]`;
  }

  if (isObject(value)) {
    const keys = Object.keys(value)
      .filter((key) => value[key] !== undefined)
      .sort();

    return `{${keys
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }

  throw new TypeError(`Unsupported JSON value: ${typeof value}`);
}

export function sha256Json(value: unknown): string {
  return createHash("sha256").update(canonicalJson(value), "utf8").digest("hex");
}

export function sha256Bytes(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

function assertNoAddonProducts(products: readonly FrozenProduct[]): void {
  const addonProducts = products.filter((product) => product.is_addon === true);
  if (addonProducts.length > 0) {
    const skus = addonProducts.map((product) => product.sku).join(", ");
    throw new Error(
      `CATALOG_ADDON_CONTAMINATION: catalog contains is_addon=true products: ${skus}`,
    );
  }
}

function assertNoDuplicateSkus(products: readonly FrozenProduct[], label: string): void {
  const seen = new Set<string>();
  for (const product of products) {
    const sku = product.sku.trim();
    if (seen.has(sku)) {
      throw new Error(`DUPLICATE_${label.toUpperCase()}_SKU: ${sku}`);
    }
    seen.add(sku);
  }
}

async function writeCanonicalJson(
  filePath: string,
  value: unknown,
): Promise<{ sha256: string; bytes: number }> {
  const content = `${canonicalJson(value)}\n`;
  const bytes = Buffer.from(content, "utf8");
  await writeFile(filePath, bytes);
  return {
    sha256: sha256Bytes(bytes),
    bytes: bytes.byteLength,
  };
}

export interface FrozenSnapshotExportInput {
  products: readonly FrozenProduct[];
  addons: readonly FrozenProduct[];
  addon_rules: readonly FrozenAddonRule[];
  geo_rules: readonly Record<string, unknown>[];
  promoters: readonly Record<string, unknown>[];
  app_settings: Readonly<Record<string, unknown>>;
  sku_crosswalk: Readonly<Record<string, unknown>>;
  git_commit: string;
  business_rules_version: string;
  harness_version: string;
}

/** Exports an immutable certification snapshot with per-file SHA-256 verification metadata. */
export async function exportFrozenSnapshot(
  rootDir: string,
  input: FrozenSnapshotExportInput,
): Promise<FrozenManifest> {
  assertNoAddonProducts(input.products);
  assertNoDuplicateSkus(input.products, "catalog");
  assertNoDuplicateSkus(input.addons, "addon");

  await mkdir(rootDir, { recursive: true });

  const files: FrozenFileManifestEntry[] = [];

  const write = async (filename: string, value: unknown): Promise<string> => {
    const result = await writeCanonicalJson(join(rootDir, filename), value);
    files.push({
      file: filename,
      sha256: result.sha256,
      bytes: result.bytes,
    });
    return result.sha256;
  };

  const catalogSha = await write(SNAPSHOT_FILES.products, input.products);
  const addonsSha = await write(SNAPSHOT_FILES.addons, input.addons);
  const addonRulesSha = await write(SNAPSHOT_FILES.addon_rules, input.addon_rules);
  const geoRulesSha = await write(SNAPSHOT_FILES.geo_rules, input.geo_rules);
  const promotersSha = await write(SNAPSHOT_FILES.promoters, input.promoters);
  const appSettingsSha = await write(SNAPSHOT_FILES.app_settings, input.app_settings);
  const crosswalkSha = await write(SNAPSHOT_FILES.sku_crosswalk, input.sku_crosswalk);

  const manifest: FrozenManifest = {
    schema_version: 1,
    generated_at: new Date().toISOString(),
    git_commit: input.git_commit,
    business_rules_version: input.business_rules_version,
    harness_version: input.harness_version,
    files,
    catalog_sha256: catalogSha,
    addons_sha256: addonsSha,
    addon_rules_sha256: addonRulesSha,
    geo_rules_sha256: geoRulesSha,
    promoters_sha256: promotersSha,
    app_settings_sha256: appSettingsSha,
    sku_crosswalk_sha256: crosswalkSha,
  };

  await writeCanonicalJson(join(rootDir, SNAPSHOT_FILES.manifest), manifest);
  return manifest;
}

async function readJsonFile(rootDir: string, filename: string): Promise<unknown> {
  const bytes = await readFile(join(rootDir, filename));
  return JSON.parse(bytes.toString("utf8"));
}

async function verifyFileHash(rootDir: string, entry: FrozenFileManifestEntry): Promise<void> {
  const bytes = await readFile(join(rootDir, entry.file));
  const actual = sha256Bytes(bytes);
  if (actual !== entry.sha256) {
    throw new Error(`FROZEN_HASH_MISMATCH: ${entry.file}: expected ${entry.sha256}, got ${actual}`);
  }
}

function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.freeze(value);
    for (const child of Object.values(value as Record<string, unknown>)) {
      if (child && typeof child === "object" && !Object.isFrozen(child)) {
        deepFreeze(child);
      }
    }
  }
  return value;
}

/** Loads and verifies a frozen snapshot directory, returning an immutable `FrozenContext`. */
export async function loadFrozenContext(rootDir: string): Promise<FrozenContext> {
  const manifest = (await readJsonFile(rootDir, SNAPSHOT_FILES.manifest)) as FrozenManifest;

  if (manifest.schema_version !== 1) {
    throw new Error(`UNSUPPORTED_FROZEN_MANIFEST_SCHEMA: ${manifest.schema_version}`);
  }

  for (const entry of manifest.files) {
    await verifyFileHash(rootDir, entry);
  }

  const products = (await readJsonFile(rootDir, SNAPSHOT_FILES.products)) as FrozenProduct[];
  const addons = (await readJsonFile(rootDir, SNAPSHOT_FILES.addons)) as FrozenProduct[];

  assertNoAddonProducts(products);
  assertNoDuplicateSkus(products, "catalog");
  assertNoDuplicateSkus(addons, "addon");

  const context: FrozenContext = {
    products: deepFreeze(products),
    addons: deepFreeze(addons),
    addon_rules: deepFreeze(
      (await readJsonFile(rootDir, SNAPSHOT_FILES.addon_rules)) as FrozenAddonRule[],
    ),
    geo_rules: deepFreeze(
      (await readJsonFile(rootDir, SNAPSHOT_FILES.geo_rules)) as Record<string, unknown>[],
    ),
    promoters: deepFreeze(
      (await readJsonFile(rootDir, SNAPSHOT_FILES.promoters)) as Record<string, unknown>[],
    ),
    app_settings: deepFreeze(
      (await readJsonFile(rootDir, SNAPSHOT_FILES.app_settings)) as Record<string, unknown>,
    ),
    sku_crosswalk: deepFreeze(
      (await readJsonFile(rootDir, SNAPSHOT_FILES.sku_crosswalk)) as Record<string, unknown>,
    ),
    manifest: deepFreeze(manifest),
  };

  return deepFreeze(context);
}
