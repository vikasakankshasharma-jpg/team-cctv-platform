import type { CanonicalRequirement } from '../schema/canonical-requirement.ts';
import type { ProductionAdapter, ProductionExecutionContext } from './adapter-contract.ts';
import { runProductionAdapter } from './production-runner.ts';
import { compareOracleVsProduction } from '../comparator/semantic-comparator.ts';
import { createCaseReport, createCertificationReport, type CertificationReport, type CaseReport } from '../reports/discrepancy-report.ts';
import { generateCorpus, type CorpusCase } from '../corpus/deterministic-corpus.ts';
import { shrinkRequirement } from "../corpus/shrinker.ts";

export interface DifferentialRunnerOptions { seed: number; cases: number; shrink?: boolean; oracle: (requirement: CanonicalRequirement, snapshot: ProductionExecutionContext['snapshot']) => unknown; }

export async function runDifferentialCorpus(adapter: ProductionAdapter<CanonicalRequirement, unknown>, context: ProductionExecutionContext, options: DifferentialRunnerOptions): Promise<CertificationReport> {
  const corpus = generateCorpus(options.seed, options.cases); const reports: CaseReport[] = [];
  for (const corpusCase of corpus) {
    const started = performance.now();
    try {
      const oracle = options.oracle(corpusCase.requirement, context.snapshot);
      const production = await runProductionAdapter(adapter, corpusCase.requirement, { ...context, caseId: corpusCase.caseId });
      if (!production.ok) {
        reports.push({ caseId: corpusCase.caseId, seed: corpusCase.seed, classification: corpusCase.expectedClassification, status: 'ERROR', findings: [{ severity: 'CRITICAL', path: '$', kind: 'PRODUCTION_EXECUTION_ERROR', expected: undefined, actual: production.error, message: production.error?.message ?? 'Production adapter failed' }], duration_ms: performance.now() - started });
        continue;
      }
      let comparison = compareOracleVsProduction(oracle, production.value);
      let minimalCase: CanonicalRequirement | undefined;
      if (!comparison.equal && options.shrink) {
        minimalCase = await shrinkRequirement(corpusCase.requirement, async (candidate) => {
          const candidateOracle = await options.oracle(candidate, context.snapshot);
          const candidateProduction = await runProductionAdapter(adapter, candidate, { ...context, caseId: `${corpusCase.caseId}:shrink` });
          if (!candidateProduction.ok) return false;
          return !compareOracleVsProduction(candidateOracle, candidateProduction.value).equal;
        });
        const shrunkOracle = await options.oracle(minimalCase, context.snapshot);
        const shrunkProduction = await runProductionAdapter(adapter, minimalCase, { ...context, caseId: `${corpusCase.caseId}:minimal` });
        if (shrunkProduction.ok) comparison = compareOracleVsProduction(shrunkOracle, shrunkProduction.value);
      }
      const report = createCaseReport(corpusCase.caseId, corpusCase.seed, corpusCase.expectedClassification, comparison, performance.now() - started);
      if (minimalCase) report.minimalCase = minimalCase;
      reports.push(report);
    } catch (error) {
      reports.push({ caseId: corpusCase.caseId, seed: corpusCase.seed, classification: corpusCase.expectedClassification, status: 'ERROR', findings: [{ severity: 'CRITICAL', path: '$', kind: 'RUNNER_ERROR', expected: undefined, actual: error instanceof Error ? error.message : String(error), message: 'Differential runner error' }], duration_ms: performance.now() - started });
    }
  }
  return createCertificationReport(options.seed, reports);
}
