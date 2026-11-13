import type { FrozenContext } from "../types/certification.ts";
import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";

export interface ProductionExecutionContext {
  repoRoot: string;
  snapshot: FrozenContext;
  caseId?: string;
  env?: Record<string, string | undefined>;
}

export interface ProductionEvidence {
  adapter: string;
  module: string;
  export_name: string;
  started_at: string;
  duration_ms: number;
  input_sha256?: string;
  notes?: string[];
}

export interface ProductionResult<T = unknown> {
  ok: boolean;
  value?: T;
  error?: { name: string; message: string; stack?: string };
  evidence: ProductionEvidence;
}

export interface ProductionAdapter<I = CanonicalRequirement, O = unknown> {
  readonly id: string;
  readonly version: string;
  execute(input: I, context: ProductionExecutionContext): Promise<ProductionResult<O>>;
}

export function success<T>(value: T, evidence: ProductionEvidence): ProductionResult<T> {
  return { ok: true, value, evidence };
}

export function failure(error: unknown, evidence: ProductionEvidence): ProductionResult<never> {
  const e = error instanceof Error ? error : new Error(String(error));
  return { ok: false, error: { name: e.name, message: e.message, stack: e.stack }, evidence };
}
