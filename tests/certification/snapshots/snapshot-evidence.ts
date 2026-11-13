import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { FrozenContext } from "../types/certification.ts";
import { sha256Json } from "../fixtures/frozen-context.ts";
import type { SnapshotValidationReport } from "./snapshot-validator.ts";

export interface CertificationSnapshotBundle {
  snapshot_id: string;
  generated_at: string;
  source: {
    source_file: string;
    catalog_file?: string;
    git_commit: string;
    business_rules_version: string;
    harness_version: string;
  };
  context: FrozenContext;
  validation: SnapshotValidationReport;
  canonical_sha256: string;
}

export function snapshotSha256(context: FrozenContext): string {
  return sha256Json(context);
}

export function buildSnapshotId(sha256: string, generatedAt = new Date().toISOString()): string {
  const stamp = generatedAt.replace(/[-:.TZ]/g, "").slice(0, 14);
  return `S-${stamp}-${sha256.slice(0, 12)}`;
}

export async function writeSnapshotEvidence(bundle: CertificationSnapshotBundle, outputDir: string): Promise<void> {
  await mkdir(outputDir, { recursive: true });
  await writeFile(join(outputDir, "snapshot.json"), JSON.stringify(bundle.context, null, 2) + "\n", "utf8");
  await writeFile(join(outputDir, "certification-evidence.json"), JSON.stringify({
    snapshot_id: bundle.snapshot_id,
    generated_at: bundle.generated_at,
    source: bundle.source,
    canonical_sha256: bundle.canonical_sha256,
    product_count: bundle.context.products.length,
    addon_count: bundle.context.addons.length,
    validation: bundle.validation,
  }, null, 2) + "\n", "utf8");
  await writeFile(join(outputDir, "snapshot-validation.json"), JSON.stringify(bundle.validation, null, 2) + "\n", "utf8");
}
