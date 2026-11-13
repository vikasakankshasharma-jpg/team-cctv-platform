#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { triageReport } from "../reports/discrepancy-triage.ts";
import type { CertificationReport } from "../reports/discrepancy-report.ts";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const source = resolve(arg("--report") ?? process.argv[2] ?? "certification-discrepancy-report.json");
const out = resolve(arg("--out") ?? "certification-discrepancy-triage.json");
const report = JSON.parse(await readFile(source, "utf8")) as CertificationReport;
const triage = triageReport(report, source);
await writeFile(out, JSON.stringify(triage, null, 2) + "\n", "utf8");
console.log(JSON.stringify(triage.summary));
