import { strict as assert } from "node:assert";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { exportFrozenSnapshot, loadFrozenContext } from "../fixtures/frozen-context.ts";

test("frozen snapshot export, SHA-256 verification and deep freeze work", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "certification-"));

  try {
    const manifest = await exportFrozenSnapshot(rootDir, {
      products: [{ sku: "CAM-IP-001", is_active: true, is_addon: false }],
      addons: [{ sku: "ADD-001", is_active: true, is_addon: true }],
      addon_rules: [],
      geo_rules: [],
      promoters: [],
      app_settings: {},
      sku_crosswalk: {},
      git_commit: "test-commit",
      business_rules_version: "test-rules",
      harness_version: "1.0.0",
    });

    assert.equal(manifest.schema_version, 1);

    const loaded = await loadFrozenContext(rootDir);
    assert.equal(loaded.products.length, 1);
    assert.equal(loaded.addons.length, 1);
    assert.equal(loaded.products[0]?.sku, "CAM-IP-001");
    assert.equal(loaded.addons[0]?.sku, "ADD-001");
    assert.ok(Object.isFrozen(loaded));
    assert.ok(Object.isFrozen(loaded.products));
    assert.ok(Object.isFrozen(loaded.products[0]));
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("catalog addon contamination is rejected at export time", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "certification-"));

  try {
    await assert.rejects(
      () =>
        exportFrozenSnapshot(rootDir, {
          products: [{ sku: "BAD-ADDON", is_addon: true }],
          addons: [],
          addon_rules: [],
          geo_rules: [],
          promoters: [],
          app_settings: {},
          sku_crosswalk: {},
          git_commit: "test",
          business_rules_version: "test",
          harness_version: "1.0.0",
        }),
      /CATALOG_ADDON_CONTAMINATION/,
    );
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});

test("tampered snapshot fails SHA-256 verification on load", async () => {
  const rootDir = await mkdtemp(join(tmpdir(), "certification-"));

  try {
    await exportFrozenSnapshot(rootDir, {
      products: [{ sku: "CAM-001", is_active: true }],
      addons: [],
      addon_rules: [],
      geo_rules: [],
      promoters: [],
      app_settings: {},
      sku_crosswalk: {},
      git_commit: "test",
      business_rules_version: "test",
      harness_version: "1.0.0",
    });

    const catalogPath = join(rootDir, "catalog.snapshot.json");
    const original = await readFile(catalogPath);
    const tampered = Buffer.concat([original, Buffer.from("\n")]);
    await writeFile(catalogPath, tampered);

    await assert.rejects(() => loadFrozenContext(rootDir), /FROZEN_HASH_MISMATCH/);
  } finally {
    await rm(rootDir, { recursive: true, force: true });
  }
});
