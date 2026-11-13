#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";
import { buildFrozenSnapshot, normalizeProduct, readSnapshotSource } from "../snapshots/snapshot-builder.ts";
import { snapshotSha256, buildSnapshotId, writeSnapshotEvidence, type CertificationSnapshotBundle } from "../snapshots/snapshot-evidence.ts";
import { validateFrozenSnapshot } from "../snapshots/snapshot-validator.ts";
import { loadFrozenContext } from "../fixtures/frozen-context.ts";
import { exportFirestoreSource, writeFirestoreSource } from "../snapshots/firestore-source-exporter.ts";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

function required(name: string): string {
  const value = arg(name);
  if (!value) throw new Error(`Missing required argument: ${name}`);
  return value;
}


async function loadEnvironmentFiles(): Promise<void> {
  const require = createRequire(import.meta.url);
  const paths = [arg("--env-file"), resolve(".env.local"), resolve(".env")].filter((value): value is string => Boolean(value));
  try {
    const dotenv = require("dotenv") as { config?: (options?: { path?: string; override?: boolean }) => unknown };
    if (typeof dotenv.config !== "function") return;
    for (const path of paths) dotenv.config({ path, override: false });
  } catch {
    // Explicit process environment variables remain supported when dotenv is unavailable.
  }
}

async function main(): Promise<void> {
  await loadEnvironmentFiles();
  const sourceArg = arg("--source");
  const firestoreMode = process.argv.includes("--firestore");
  if (!sourceArg && !firestoreMode) throw new Error("Missing --source or --firestore");
  const outputDir = resolve(required("--out"));
  const catalogFile = arg("--catalog");
  const gitCommit = arg("--git-commit") ?? "UNKNOWN";
  const businessRulesVersion = arg("--business-rules") ?? "UNKNOWN";
  const harnessVersion = arg("--harness") ?? "PHASE-3.0";

  await mkdir(outputDir, { recursive: true });
  let sourceFile = sourceArg;
  if (firestoreMode) {
    const collections = (arg("--collections") ?? "products,addons,addon_rules,geo_pricing_rules,recommendation_rules,coverage_zones,promoters,app_config,settings").split(",").map((x) => x.trim()).filter(Boolean);
    const firestoreSource = await exportFirestoreSource({
      projectId: arg("--project-id"),
      collections,
      serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    });
    sourceFile = resolve(outputDir, "firestore-source.json");
    await writeFirestoreSource(firestoreSource, sourceFile);
  }
  if (!sourceFile) throw new Error("Source file could not be resolved.");
  await buildFrozenSnapshot({ sourceFile, catalogFile, outputDir, gitCommit, businessRulesVersion, harnessVersion });

  const snapshot = await loadFrozenContext(outputDir);
  const source = await readSnapshotSource(sourceFile);
  const rawSourceProducts = source.source_products ?? source.products;
  const sourceProducts = Array.isArray(rawSourceProducts)
    ? rawSourceProducts
        .filter((row): row is Record<string, unknown> => typeof row === "object" && row !== null)
        .map((row) => normalizeProduct(row, false))
    : undefined;
  const validation = validateFrozenSnapshot(snapshot, sourceProducts);
  const generatedAt = new Date().toISOString();
  const sha256 = snapshotSha256(snapshot);
  const bundle: CertificationSnapshotBundle = {
    snapshot_id: buildSnapshotId(sha256, generatedAt),
    generated_at: generatedAt,
    source: { source_file: resolve(sourceFile), catalog_file: catalogFile ? resolve(catalogFile) : undefined, git_commit: gitCommit, business_rules_version: businessRulesVersion, harness_version: harnessVersion },
    context: snapshot,
    validation,
    canonical_sha256: sha256,
  };

  await writeSnapshotEvidence(bundle, outputDir);
  await writeFile(resolve(outputDir, "CERTIFICATION_SNAPSHOT_BUNDLE.json"), JSON.stringify(bundle, null, 2) + "\n", "utf8");

  console.log(JSON.stringify({ snapshot_id: bundle.snapshot_id, sha256, valid: validation.valid, findings: validation.findings }, null, 2));
  if (!validation.valid) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 2;
});
