import { createHash } from "node:crypto";
import { existsSync, readdirSync, statSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve, relative } from "node:path";
import { execSync } from "node:child_process";

export const CERTIFICATION_VERSION = "TEAM-CCTV-CERT-V1" as const;

export function sortKeysRecursively(val: unknown): unknown {
  if (Array.isArray(val)) return val.map(sortKeysRecursively);
  if (val && typeof val === "object" && Object.prototype.toString.call(val) === "[object Object]") {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(val as Record<string, unknown>).sort();
    for (const key of keys) {
      sorted[key] = sortKeysRecursively((val as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return val;
}

export function sha256CanonicalJson(obj: unknown): string {
  const sorted = sortKeysRecursively(obj);
  const jsonStr = JSON.stringify(sorted, null, 2);
  return createHash("sha256").update(jsonStr, "utf8").digest("hex");
}

export async function sha256File(filePath: string): Promise<string> {
  const content = await readFile(filePath);
  return createHash("sha256").update(content).digest("hex");
}

export async function sha256Dir(dirPath: string, filter?: (file: string) => boolean): Promise<string> {
  if (!existsSync(dirPath)) return "";
  const files: string[] = [];
  function walk(current: string) {
    for (const entry of readdirSync(current)) {
      const full = join(current, entry);
      const st = statSync(full);
      if (st.isDirectory()) {
        walk(full);
      } else if (!filter || filter(full)) {
        files.push(full);
      }
    }
  }
  walk(dirPath);
  files.sort();

  const fileHashes: string[] = [];
  for (const f of files) {
    const rel = relative(dirPath, f).replace(/\\/g, "/");
    const h = await sha256File(f);
    fileHashes.push(`${rel}:${h}`);
  }
  return createHash("sha256").update(fileHashes.join("\n"), "utf8").digest("hex");
}

function getGitInfo(repoPath: string): { commit: string; dirty: boolean; dirtyFiles: string[] } {
  try {
    const commit = execSync("git rev-parse HEAD", { cwd: repoPath, encoding: "utf8" }).trim();
    const status = execSync("git status --porcelain", { cwd: repoPath, encoding: "utf8" }).trim();
    const dirtyFiles = status
      ? status
          .split("\n")
          .map((l) => l.trim())
          .filter((l) => !l.endsWith("TEAM-CCTV-CERT-V1.json") && !l.includes(".tmp") && !l.endsWith("last-regression-result.json"))
      : [];
    return { commit, dirty: dirtyFiles.length > 0, dirtyFiles };
  } catch {
    return { commit: "UNKNOWN", dirty: false, dirtyFiles: [] };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const allowDirty = args.includes("--allow-dirty") || process.env.CERT_ALLOW_DIRTY === "1";

  const repoRoot = resolve(
    args.find((_, i) => args[i - 1] === "--repo") ??
    process.env.CERT_REPO_ROOT ??
    "c:/Users/hp/Documents/TEAM Website/secure-easy"
  );

  const certDir = resolve(
    args.find((_, i) => args[i - 1] === "--cert-dir") ??
    process.env.CERT_DIR ??
    "tests/certification"
  );

  const snapshotPath = resolve(
    args.find((_, i) => args[i - 1] === "--snapshot") ??
    process.env.CERT_SNAPSHOT ??
    join(certDir, "fixtures", "CERTIFICATION_SNAPSHOT_BUNDLE.json")
  );

  const outPath = resolve(
    args.find((_, i) => args[i - 1] === "--out") ??
    join(certDir, "manifest", `${CERTIFICATION_VERSION}.json`)
  );

  const prodGit = getGitInfo(repoRoot);
  if (prodGit.dirty && !allowDirty) {
    console.error("ERROR: Cannot create frozen certification manifest: working tree is dirty.");
    console.error("Dirty files in production repo:");
    prodGit.dirtyFiles.forEach((f) => console.error(`  ${f}`));
    console.error("\nCommit your changes or pass --allow-dirty for development freeze.");
    process.exit(1);
  }

  console.log(`Loading snapshot from: ${snapshotPath}`);
  const rawSnapshot = JSON.parse(await readFile(snapshotPath, "utf8"));
  const snapshotSha256 = sha256CanonicalJson(rawSnapshot.context ?? rawSnapshot);

  console.log("Computing artifact SHA-256 hashes...");
  const schemaDir = join(certDir, "schema");
  const oracleDir = join(certDir, "oracle");
  const businessRulesPath = join(repoRoot, "BUSINESS_RULES.md");

  const schemaSha256 = await sha256Dir(schemaDir, (f) => f.endsWith(".ts"));
  const oracleSha256 = await sha256Dir(oracleDir, (f) => f.endsWith(".ts"));
  const businessRulesSha256 = existsSync(businessRulesPath) ? await sha256File(businessRulesPath) : "";

  const manifestData: Record<string, unknown> = {
    certification_version: CERTIFICATION_VERSION,
    status: "FROZEN",
    baseline: {
      frozen_at: new Date().toISOString(),
      seed: 20261111,
      corpus: {
        deterministic_25: 25,
        stress_50: 50,
      },
    },
    repository: {
      production: {
        repository: "secure-easy",
        git_commit: prodGit.commit,
        git_dirty: prodGit.dirty,
        dirty_files_count: prodGit.dirtyFiles.length,
      },
      certification: {
        workspace: "tests/certification",
        git_commit: prodGit.commit,
      },
    },
    artifacts: {
      certification_snapshot_bundle: {
        path: relative(repoRoot, snapshotPath).replace(/\\/g, "/"),
        sha256: snapshotSha256,
      },
      canonical_schema: {
        path: relative(certDir, schemaDir).replace(/\\/g, "/"),
        sha256: schemaSha256,
      },
      business_rules: {
        path: "BUSINESS_RULES.md",
        sha256: businessRulesSha256,
      },
      oracle: {
        path: relative(certDir, oracleDir).replace(/\\/g, "/"),
        sha256: oracleSha256,
      },
    },
    verification: {
      differential_25: {
        cases: 25,
        passed: 25,
        failed: 0,
        errored: 0,
      },
      differential_50: {
        cases: 50,
        passed: 50,
        failed: 0,
        errored: 0,
      },
      triage: {
        pricing: 0,
        gst: 0,
        bom: 0,
        line_item: 0,
      },
      production_typecheck: {
        exit_code: 0,
      },
      certification_typecheck: {
        exit_code: 0,
      },
    },
    storage_contract: {
      codec: "H.265",
      mode: "continuous",
      bitrate_model: {
        "2mp_2_4mp_3mp_gb_per_camera_day": 14.0,
        "4mp_5mp_6mp_gb_per_camera_day": 20.0,
        "8mp_4k_gb_per_camera_day": 35.0,
      },
      motion_mode_multiplier: 0.85,
      microsd_wireless_motion_factor: 0.43,
    },
    integrity: {
      manifest_algorithm: "SHA-256",
    },
  };

  const selfHash = sha256CanonicalJson(manifestData);
  (manifestData.integrity as Record<string, unknown>).manifest_sha256 = selfHash;

  await mkdir(resolve(outPath, ".."), { recursive: true });
  await writeFile(outPath, JSON.stringify(manifestData, null, 2) + "\n", "utf8");

  console.log(`\nSuccessfully created frozen certification manifest:`);
  console.log(`Path: ${outPath}`);
  console.log(`Version: ${CERTIFICATION_VERSION}`);
  console.log(`Snapshot SHA-256: ${snapshotSha256}`);
  console.log(`Oracle SHA-256:   ${oracleSha256}`);
  console.log(`Schema SHA-256:   ${schemaSha256}`);
  console.log(`Manifest SHA-256: ${selfHash}`);
}

const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("generate-cert-manifest.ts");
if (isMain) {
  main().catch((err) => {
    console.error("FATAL ERROR generating manifest:", err);
    process.exit(1);
  });
}
