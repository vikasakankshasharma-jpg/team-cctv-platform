import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { CanonicalRequirement } from '../schema/canonical-requirement.ts';
import type { ProductionAdapter, ProductionExecutionContext, ProductionResult } from './adapter-contract.ts';
import { failure, success } from './adapter-contract.ts';
import { installSnapshotShims } from './production-runner.ts';

export interface QuotationProfitBinding { buildArgs(input: CanonicalRequirement, context: ProductionExecutionContext): readonly unknown[] | Promise<readonly unknown[]>; }

export class QuotationProfitAdapter implements ProductionAdapter<CanonicalRequirement, unknown> {
  readonly id = 'quotation-profit'; readonly version = '2B.3-v2';
  constructor(private readonly binding: QuotationProfitBinding) {}
  async execute(input: CanonicalRequirement, context: ProductionExecutionContext): Promise<ProductionResult<unknown>> {
    const started = new Date().toISOString(); const t0 = performance.now();
    const evidence = { adapter: this.id, module: 'lib/quotation-profit.ts', export_name: 'calculateQuotationProfitBreakup', started_at: started, duration_ms: 0, notes: [] as string[] };
    try {
      await installSnapshotShims(context);
      const mod = await import(pathToFileURL(join(context.repoRoot, 'lib/quotation-profit.ts')).href) as Record<string, unknown>;
      const fn = mod.calculateQuotationProfitBreakup;
      if (typeof fn !== 'function') throw new Error('PRODUCTION_EXPORT_NOT_FOUND: calculateQuotationProfitBreakup');
      const value = await (fn as (...args: unknown[]) => Promise<unknown> | unknown)(...(await this.binding.buildArgs(input, context)));
      evidence.duration_ms = performance.now() - t0; return success(value, evidence);
    } catch (error) { evidence.duration_ms = performance.now() - t0; return failure(error, evidence); }
  }
}
