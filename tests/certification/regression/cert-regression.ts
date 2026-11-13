import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { CERTIFICATION_VERSION } from "../scripts/generate-cert-manifest.ts";

interface GateResult {
  name: string;
  command: string;
  passed: boolean;
  exitCode: number;
  durationMs: number;
  detail: string;
  output?: string;
}

function runCommand(name: string, command: string, args: string[], cwd: string): GateResult {
  const start = Date.now();
  console.log(`[RUN] ${name}...`);
  const res = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    shell: true,
  });
  const durationMs = Date.now() - start;
  const stdout = (res.stdout || "").trim();
  const stderr = (res.stderr || "").trim();
  const exitCode = res.status ?? (res.error ? 1 : 0);
  const passed = exitCode === 0;

  return {
    name,
    command: `${command} ${args.join(" ")}`,
    passed,
    exitCode,
    durationMs,
    detail: passed ? "OK" : stderr.slice(0, 300) || stdout.slice(0, 300) || "Failed",
    output: stdout + (stderr ? `\nSTDERR:\n${stderr}` : ""),
  };
}

async function main() {
  const args = process.argv.slice(2);
  const repoRoot = resolve(
    args.find((_, i) => args[i - 1] === "--repo") ??
    process.env.CERT_REPO_ROOT ??
    "c:/Users/hp/Documents/TEAM Website/secure-easy"
  );

  const certWorkspace = resolve(
    args.find((_, i) => args[i - 1] === "--cert-workspace") ??
    process.env.CERT_WORKSPACE ??
    process.cwd()
  );

  const snapshotPath = resolve(
    args.find((_, i) => args[i - 1] === "--snapshot") ??
    process.env.CERT_SNAPSHOT ??
    join(certWorkspace, "tests/certification/fixtures/CERTIFICATION_SNAPSHOT_BUNDLE.json")
  );

  const tmpDir = join(certWorkspace, "tests/certification/regression/.tmp");
  await mkdir(tmpDir, { recursive: true });

  const diff25Report = join(tmpDir, "diff-25.json");
  const diff50Report = join(tmpDir, "diff-50.json");
  const triageReport = join(tmpDir, "triage-25.json");

  console.log("╔══════════════════════════════════════════════╗");
  console.log("║       TEAM CCTV CERTIFICATION REGRESSION     ║");
  console.log(`║                  ${CERTIFICATION_VERSION}                          ║`);
  console.log("╚══════════════════════════════════════════════╝\n");

  const results: GateResult[] = [];

  // Gate 1: Production TypeScript
  const g1 = runCommand("Production TypeScript", "npx", ["tsc", "--noEmit"], repoRoot);
  results.push({ ...g1, detail: g1.passed ? "0 errors" : g1.detail });

  // Gate 2: Certification TypeScript
  const g2 = runCommand("Certification TypeScript", "npx", ["tsc", "-p", "tsconfig.certification.json", "--noEmit"], certWorkspace);
  results.push({ ...g2, detail: g2.passed ? "0 errors" : g2.detail });

  // Gate 3: Production Phase 1 Schema Gate
  const phase1Files = [
    "tests/certification/self-tests/frozen-context.test.ts",
    "tests/certification/self-tests/impossible-combinations.test.ts",
    "tests/certification/self-tests/normalize.test.ts",
    "tests/certification/self-tests/oracle.test.ts",
    "tests/certification/self-tests/schema.test.ts",
    "tests/certification/self-tests/sku-crosswalk.test.ts",
  ];
  const g3 = runCommand("Phase 1 Gate", "node", ["--test", ...phase1Files], repoRoot);
  results.push({ ...g3, detail: g3.passed ? "27/27" : g3.detail });

  // Gate 4: Differential 25
  const g4 = runCommand(
    "Differential 25",
    "node",
    [
      "--import", "./tests/certification/production/esm-loader/register.mjs",
      "tests/certification/cli/differential-certify.ts",
      "--repo", `"${repoRoot}"`,
      "--snapshot", `"${snapshotPath}"`,
      "--out", `"${diff25Report}"`,
      "--seed", "20261111",
      "--cases", "25",
    ],
    certWorkspace
  );
  let d25Detail = g4.passed ? "25/25" : g4.detail;
  try {
    if (existsSync(diff25Report)) {
      const j = JSON.parse(await readFile(diff25Report, "utf8"));
      d25Detail = `${j.summary?.passed ?? 0}/${j.summary?.total ?? 25}`;
    }
  } catch {}
  results.push({ ...g4, detail: d25Detail });

  // Gate 5: Differential 50
  const g5 = runCommand(
    "Differential 50",
    "node",
    [
      "--import", "./tests/certification/production/esm-loader/register.mjs",
      "tests/certification/cli/differential-certify.ts",
      "--repo", `"${repoRoot}"`,
      "--snapshot", `"${snapshotPath}"`,
      "--out", `"${diff50Report}"`,
      "--seed", "20261111",
      "--cases", "50",
    ],
    certWorkspace
  );
  let d50Detail = g5.passed ? "50/50" : g5.detail;
  try {
    if (existsSync(diff50Report)) {
      const j = JSON.parse(await readFile(diff50Report, "utf8"));
      d50Detail = `${j.summary?.passed ?? 0}/${j.summary?.total ?? 50}`;
    }
  } catch {}
  results.push({ ...g5, detail: d50Detail });

  // Gate 6: Discrepancy Triage
  const g6 = runCommand(
    "Discrepancy Triage",
    "node",
    [
      "--import", "./tests/certification/production/esm-loader/register.mjs",
      "tests/certification/cli/discrepancy-triage.ts",
      "--report", `"${diff25Report}"`,
      "--out", `"${triageReport}"`,
    ],
    certWorkspace
  );
  let triageCounts = { pricing: 0, gst: 0, bom: 0, line_item: 0 };
  try {
    if (existsSync(triageReport)) {
      const t = JSON.parse(await readFile(triageReport, "utf8"));
      triageCounts = {
        pricing: t.summary?.by_category?.PRICING ?? 0,
        gst: t.summary?.by_category?.GST ?? 0,
        bom: t.summary?.by_category?.BOM ?? 0,
        line_item: t.summary?.by_category?.LINE_ITEM ?? 0,
      };
    }
  } catch {}
  const triagePassed = g6.passed && Object.values(triageCounts).every((v) => v === 0);
  results.push({
    ...g6,
    passed: triagePassed,
    detail: `pricing:${triageCounts.pricing} gst:${triageCounts.gst} bom:${triageCounts.bom} line_item:${triageCounts.line_item}`,
  });

  // Gate 7: Manifest Integrity
  const g7 = runCommand(
    "Manifest Verification",
    "node",
    [
      "--import", "./tests/certification/production/esm-loader/register.mjs",
      "tests/certification/scripts/verify-cert-manifest.ts",
      "--repo", `"${repoRoot}"`,
      "--snapshot", `"${snapshotPath}"`,
    ],
    certWorkspace
  );
  results.push({ ...g7, detail: g7.passed ? "SHA-256 match" : "drift detected" });

  // Print Summary Table
  console.log("\n═══════════════════════════════════════════════════════════════");
  for (const r of results) {
    const status = r.passed ? "[PASS]" : "[FAIL]";
    const nameCol = r.name.padEnd(28, " ");
    const detailCol = r.detail.padEnd(20, " ");
    const msCol = `${r.durationMs}ms`.padStart(8, " ");
    console.log(`${status} ${nameCol} ${detailCol} ${msCol}`);
  }
  console.log("═══════════════════════════════════════════════════════════════");

  const allPassed = results.every((r) => r.passed);
  console.log("\n-----------------------------------------------");
  console.log(`CERTIFICATION REGRESSION: ${allPassed ? "PASS" : "BLOCKED"}`);
  console.log("-----------------------------------------------");
  console.log(`Certification Version : ${CERTIFICATION_VERSION}`);
  console.log(`Seed                  : 20261111`);
  console.log(`Corpus                : 25 + 50`);
  console.log(`Repo Root             : ${repoRoot}`);
  console.log(`Snapshot Bundle       : ${snapshotPath}`);
  console.log(`Exit code             : ${allPassed ? 0 : 1}\n`);

  // Write machine-readable report
  const regressionReportPath = join(certWorkspace, "tests/certification/regression/last-regression-result.json");
  const regressionReport = {
    certification_version: CERTIFICATION_VERSION,
    timestamp: new Date().toISOString(),
    status: allPassed ? "PASS" : "FAIL",
    gates: results.map((r) => ({
      name: r.name,
      passed: r.passed,
      exit_code: r.exitCode,
      duration_ms: r.durationMs,
      detail: r.detail,
    })),
  };
  await writeFile(regressionReportPath, JSON.stringify(regressionReport, null, 2) + "\n", "utf8");

  process.exit(allPassed ? 0 : 1);
}

main().catch((err) => {
  console.error("FATAL ERROR in regression orchestrator:", err);
  process.exit(1);
});
