import type { ComparisonFinding } from "../comparator/semantic-comparator.ts";
import type { CertificationReport, CaseReport } from "./discrepancy-report.ts";

export type DiscrepancyCategory =
  | "CLASSIFICATION"
  | "GST"
  | "BOM"
  | "LINE_ITEM"
  | "PRICING"
  | "POLICY"
  | "PRODUCTION_EXECUTION"
  | "OTHER";

export interface TriageFinding {
  category: DiscrepancyCategory;
  severity: ComparisonFinding["severity"];
  path: string;
  kind: string;
  message: string;
}

export interface CaseTriage {
  caseId: string;
  seed: number;
  oracleClassification: string;
  status: CaseReport["status"];
  categories: DiscrepancyCategory[];
  findings: TriageFinding[];
  minimalCase?: CaseReport["minimalCase"];
}

export interface DiscrepancyTriageReport {
  version: "3.0";
  generated_at: string;
  source_report: string;
  summary: {
    total_cases: number;
    pass: number;
    fail: number;
    error: number;
    by_oracle_classification: Record<string, number>;
    by_category: Record<string, number>;
  };
  cases: CaseTriage[];
}

function categoryFor(finding: ComparisonFinding): DiscrepancyCategory {
  const path = finding.path.toLowerCase();
  const message = finding.message.toLowerCase();
  const expected = JSON.stringify(finding.expected ?? "").toLowerCase();
  const actual = JSON.stringify(finding.actual ?? "").toLowerCase();
  const text = `${path} ${finding.kind.toLowerCase()} ${message} ${expected} ${actual}`;
  if (finding.kind.includes("PRODUCTION_EXECUTION") || finding.kind.includes("RUNNER_ERROR")) return "PRODUCTION_EXECUTION";
  if (path.includes("requiresindustrialquote") || path.includes("manual_quote") || path.includes("classification")) return "CLASSIFICATION";
  if (text.includes("gst") || path.includes("taxable") || path.includes("tax")) return "GST";
  if (text.includes("junction") || text.includes("acc_junction_box") || text.includes("cable") || text.includes("wire") || text.includes("bnc") || text.includes("connector_bnc_dc") || text.includes("rj45") || text.includes("poe") || text.includes("smps") || text.includes("power") || text.includes("pvc")) return "BOM";
  if (path.includes("lines[") || path.endsWith(".lines") || text.includes("line item")) return "LINE_ITEM";
  if (path.includes("gross_subtotal") || path.includes("total_payable") || path.includes("margin") || text.includes("price")) return "PRICING";
  if (text.includes("policy") || text.includes("manual quote") || text.includes("boundary")) return "POLICY";
  return "OTHER";
}

export function triageCase(caseReport: CaseReport): CaseTriage {
  const findings = caseReport.findings.map((finding) => ({ category: categoryFor(finding), severity: finding.severity, path: finding.path, kind: finding.kind, message: finding.message }));
  return {
    caseId: caseReport.caseId,
    seed: caseReport.seed,
    oracleClassification: caseReport.classification,
    status: caseReport.status,
    categories: [...new Set(findings.map((finding) => finding.category))],
    findings,
    minimalCase: caseReport.minimalCase,
  };
}

export function triageReport(report: CertificationReport, sourceReport: string): DiscrepancyTriageReport {
  const cases = report.cases.map(triageCase);
  const byOracle: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const item of cases) {
    byOracle[item.oracleClassification] = (byOracle[item.oracleClassification] ?? 0) + 1;
    for (const category of item.categories) byCategory[category] = (byCategory[category] ?? 0) + 1;
  }
  return {
    version: "3.0",
    generated_at: new Date().toISOString(),
    source_report: sourceReport,
    summary: {
      total_cases: cases.length,
      pass: cases.filter((x) => x.status === "PASS").length,
      fail: cases.filter((x) => x.status === "FAIL").length,
      error: cases.filter((x) => x.status === "ERROR").length,
      by_oracle_classification: byOracle,
      by_category: byCategory,
    },
    cases,
  };
}
