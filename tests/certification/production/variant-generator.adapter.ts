import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { CanonicalRequirement } from '../schema/canonical-requirement.ts';
import type { ProductionAdapter, ProductionExecutionContext, ProductionResult } from './adapter-contract.ts';
import { failure, success } from './adapter-contract.ts';
import { installSnapshotShims } from './production-runner.ts';

export interface VariantGeneratorBinding { buildParams(input: CanonicalRequirement, context: ProductionExecutionContext): unknown | Promise<unknown>; }

export class VariantGeneratorAdapter implements ProductionAdapter<CanonicalRequirement, unknown> {
  readonly id = 'variant-generator';
  readonly version = '2B.3-v2';
  constructor(private readonly binding: VariantGeneratorBinding) {}
  async execute(input: CanonicalRequirement, context: ProductionExecutionContext): Promise<ProductionResult<unknown>> {
    const started = new Date().toISOString(); const t0 = performance.now();
    const evidence = { adapter: this.id, module: 'lib/quotation/variant-generator.ts', export_name: 'generateAllCatalogVariations', started_at: started, duration_ms: 0, notes: [] as string[] };
    try {
      await installSnapshotShims(context);
      const mod = await import(pathToFileURL(join(context.repoRoot, 'lib/quotation/variant-generator.ts')).href) as Record<string, unknown>;
      const fn = mod.generateAllCatalogVariations;
      if (typeof fn !== 'function') throw new Error('PRODUCTION_EXPORT_NOT_FOUND: generateAllCatalogVariations');
      const value = await (fn as (params: unknown) => Promise<unknown> | unknown)(await this.binding.buildParams(input, context));
      evidence.duration_ms = performance.now() - t0; return success(value, evidence);
    } catch (error) { evidence.duration_ms = performance.now() - t0; return failure(error, evidence); }
  }
}
