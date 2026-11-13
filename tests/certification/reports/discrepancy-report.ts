import type { ComparisonFinding, ComparisonResult } from '../comparator/semantic-comparator.ts';
import type { CanonicalRequirement } from '../schema/canonical-requirement.ts';

export interface CaseReport { caseId: string; seed: number; status: 'PASS' | 'FAIL' | 'ERROR'; classification: string; findings: ComparisonFinding[]; duration_ms: number; minimalCase?: CanonicalRequirement; }
export interface CertificationReport { version: string; generated_at: string; corpus_seed: number; cases: CaseReport[]; summary: { total: number; passed: number; failed: number; errored: number; total_cases?: number; pass?: number; fail?: number; error?: number; classifications?: Record<string, number>; }; }

export function createCaseReport(caseId: string, seed: number, classification: string, result: ComparisonResult, duration_ms: number): CaseReport {
  return { caseId, seed, classification, findings: result.findings, status: result.equal ? 'PASS' : 'FAIL', duration_ms };
}

export function createCertificationReport(seed: number, cases: CaseReport[]): CertificationReport {
  return {
    version: '2B.8-v1', generated_at: new Date().toISOString(), corpus_seed: seed, cases,
    summary: { total: cases.length, passed: cases.filter(x => x.status === 'PASS').length, failed: cases.filter(x => x.status === 'FAIL').length, errored: cases.filter(x => x.status === 'ERROR').length },
  };
}
