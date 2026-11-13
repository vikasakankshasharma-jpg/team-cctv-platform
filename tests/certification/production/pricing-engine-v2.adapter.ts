import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { CanonicalRequirement } from '../schema/canonical-requirement.ts';
import type { ProductionAdapter, ProductionExecutionContext, ProductionResult } from './adapter-contract.ts';
import { failure, success } from './adapter-contract.ts';
import { installSnapshotShims } from './production-runner.ts';

export interface PricingV2Binding {
  buildParams(input: CanonicalRequirement, context: ProductionExecutionContext): unknown | Promise<unknown>;
}

export class PricingEngineV2Adapter implements ProductionAdapter<CanonicalRequirement, unknown> {
  readonly id = 'pricing-engine-v2';
  readonly version = '2B.3-v2';
  constructor(private readonly binding: PricingV2Binding) {}

  async execute(input: CanonicalRequirement, context: ProductionExecutionContext): Promise<ProductionResult<unknown>> {
    const started = new Date().toISOString();
    const t0 = performance.now();
    const evidence = { adapter: this.id, module: 'lib/pricing-engine-v2.ts', export_name: 'calculatePricingV2', started_at: started, duration_ms: 0, notes: [] as string[] };
    try {
      await installSnapshotShims(context);
      const mod = await import(pathToFileURL(join(context.repoRoot, 'lib/pricing-engine-v2.ts')).href) as Record<string, unknown>;
      const fn = mod.calculatePricingV2;
      if (typeof fn !== 'function') throw new Error('PRODUCTION_EXPORT_NOT_FOUND: calculatePricingV2 in lib/pricing-engine-v2.ts');
      const params = await this.binding.buildParams(input, context);
      const value = await (fn as (params: unknown) => Promise<unknown> | unknown)(params);
      evidence.duration_ms = performance.now() - t0;
      return success(value, evidence);
    } catch (error) {
      evidence.duration_ms = performance.now() - t0;
      return failure(error, evidence);
    }
  }
}
