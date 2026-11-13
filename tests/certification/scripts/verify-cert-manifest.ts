import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  CERTIFICATION_VERSION,
  sha256CanonicalJson,
  sha256File,
  sha256Dir,
  sortKeysRecursively,
} from "./generate-cert-manifest.ts";

async function main() {
  const args = process.argv.slice(2);

  const certDir = resolve(
    args.find((_, i) => args[i - 1] === "--cert-dir") ??
    process.env.CERT_DIR ??
    "tests/certification"
  );

  const manifestPath = resolve(
    args.find((_, i) => args[i - 1] === "--manifest") ??
    process.env.CERT_MANIFEST ??
    join(certDir, "manifest", `${CERTIFICATION_VERSION}.json`)
  );

  const repoRoot = resolve(
    args.find((_, i) => args[i - 1] === "--repo") ??
    process.env.CERT_REPO_ROOT ??
    "c:/Users/hp/Documents/TEAM Website/secure-easy"
  );

  const snapshotPath = resolve(
    args.find((_, i) => args[i - 1] === "--snapshot") ??
    process.env.CERT_SNAPSHOT ??
    join(certDir, "fixtures", "CERTIFICATION_SNAPSHOT_BUNDLE.json")
  );

  if (!existsSync(manifestPath)) {
    console.error(`ERROR: Manifest file not found at ${manifestPath}`);
    process.exit(1);
  }

  const rawManifest = JSON.parse(await readFile(manifestPath, "utf8")) as Record<string, any>;
  const recordedSelfHash = rawManifest.integrity?.manifest_sha256;

  // 1. Verify self-integrity
  const checkManifest = JSON.parse(JSON.stringify(rawManifest));
  delete checkManifest.integrity.manifest_sha256;
  const computedSelfHash = sha256CanonicalJson(checkManifest);

  let hasErrors = false;

  console.log(`\nVerifying Certification Manifest: ${rawManifest.certification_version}`);
  console.log(`Status: ${rawManifest.status} (Frozen at ${rawManifest.baseline?.frozen_at})\n`);

  if (computedSelfHash === recordedSelfHash) {
    console.log(`[PASS] Manifest self-integrity hash matched (${computedSelfHash.slice(0, 16)}...)`);
  } else {
    console.error(`[FAIL] Manifest self-integrity mismatch!`);
    console.error(`  Expected: ${recordedSelfHash}`);
    console.error(`  Computed: ${computedSelfHash}`);
    hasErrors = true;
  }

  // 2. Verify Snapshot Bundle
  if (existsSync(snapshotPath)) {
    const rawSnapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
    const computedSnapshotHash = sha256CanonicalJson(rawSnapshot.context ?? rawSnapshot);
    const expectedSnapshotHash = rawManifest.artifacts?.certification_snapshot_bundle?.sha256;

    if (computedSnapshotHash === expectedSnapshotHash) {
      console.log(`[PASS] Snapshot bundle hash matched (${computedSnapshotHash.slice(0, 16)}...)`);
    } else {
      console.error(`[FAIL] Snapshot bundle hash mismatch!`);
      console.error(`  Expected: ${expectedSnapshotHash}`);
      console.error(`  Computed: ${computedSnapshotHash}`);
      hasErrors = true;
    }
  } else {
    console.warn(`[WARN] Snapshot bundle file not found at ${snapshotPath}; skipping file re-check`);
  }

  // 3. Verify Canonical Schema
  const schemaDir = join(certDir, "schema");
  const computedSchemaHash = await sha256Dir(schemaDir, (f) => f.endsWith(".ts"));
  const expectedSchemaHash = rawManifest.artifacts?.canonical_schema?.sha256;
  if (computedSchemaHash === expectedSchemaHash) {
    console.log(`[PASS] Canonical schema hash matched (${computedSchemaHash.slice(0, 16)}...)`);
  } else {
    console.error(`[FAIL] Canonical schema hash mismatch!`);
    console.error(`  Expected: ${expectedSchemaHash}`);
    console.error(`  Computed: ${computedSchemaHash}`);
    hasErrors = true;
  }

  // 4. Verify Oracle
  const oracleDir = join(certDir, "oracle");
  const computedOracleHash = await sha256Dir(oracleDir, (f) => f.endsWith(".ts"));
  const expectedOracleHash = rawManifest.artifacts?.oracle?.sha256;
  if (computedOracleHash === expectedOracleHash) {
    console.log(`[PASS] Oracle code hash matched (${computedOracleHash.slice(0, 16)}...)`);
  } else {
    console.error(`[FAIL] Oracle code hash mismatch!`);
    console.error(`  Expected: ${expectedOracleHash}`);
    console.error(`  Computed: ${computedOracleHash}`);
    hasErrors = true;
  }

  // 5. Verify Business Rules
  const businessRulesPath = join(repoRoot, "BUSINESS_RULES.md");
  if (existsSync(businessRulesPath)) {
    const computedRulesHash = await sha256File(businessRulesPath);
    const expectedRulesHash = rawManifest.artifacts?.business_rules?.sha256;
    if (computedRulesHash === expectedRulesHash) {
      console.log(`[PASS] Business rules hash matched (${computedRulesHash.slice(0, 16)}...)`);
    } else {
      console.error(`[FAIL] Business rules hash mismatch!`);
      console.error(`  Expected: ${expectedRulesHash}`);
      console.error(`  Computed: ${computedRulesHash}`);
      hasErrors = true;
    }
  }

  console.log("\n-----------------------------------------------");
  if (hasErrors) {
    console.error("CERTIFICATION MANIFEST VERIFICATION: FAILED");
    console.error("-----------------------------------------------");
    process.exit(1);
  } else {
    console.log("CERTIFICATION MANIFEST VERIFICATION: SUCCESS");
    console.log(`All artifacts strictly match ${CERTIFICATION_VERSION}`);
    console.log("-----------------------------------------------");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("FATAL ERROR verifying manifest:", err);
  process.exit(1);
});
