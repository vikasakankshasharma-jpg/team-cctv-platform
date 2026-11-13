import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { CanonicalRequirement } from '../schema/canonical-requirement.ts';
import type { ProductionAdapter, ProductionExecutionContext, ProductionResult } from './adapter-contract.ts';
import { failure, success } from './adapter-contract.ts';
import { installSnapshotShims } from './production-runner.ts';

export type RequestBodyBuilder = (input: CanonicalRequirement, context: ProductionExecutionContext) => unknown;

export interface RouteAdapterOptions {
  id: string;
  version: string;
  module: string;
  body: RequestBodyBuilder;
}

async function loadPost(repoRoot: string, relativePath: string): Promise<(request: Request) => Promise<Response>> {
  const mod = await import(pathToFileURL(join(repoRoot, relativePath)).href) as Record<string, unknown>;
  const post = mod.POST;
  if (typeof post !== 'function') throw new Error(`PRODUCTION_EXPORT_NOT_FOUND: POST in ${relativePath}`);
  return post as (request: Request) => Promise<Response>;
}

export class PostRouteAdapter implements ProductionAdapter<CanonicalRequirement, { status: number; body: unknown }> {
  readonly id: string;
  readonly version: string;
  private readonly module: string;
  private readonly bodyBuilder: RequestBodyBuilder;

  constructor(options: RouteAdapterOptions) {
    this.id = options.id;
    this.version = options.version;
    this.module = options.module;
    this.bodyBuilder = options.body;
  }

  async execute(input: CanonicalRequirement, context: ProductionExecutionContext): Promise<ProductionResult<{ status: number; body: unknown }>> {
    const started = new Date().toISOString();
    const t0 = performance.now();
    const evidence = { adapter: this.id, module: this.module, export_name: 'POST', started_at: started, duration_ms: 0, notes: [] as string[] };
    try {
      await installSnapshotShims(context);
      const body = this.bodyBuilder(input, context);
      const request = new Request('http://certification.local/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      });
      const post = await loadPost(context.repoRoot, this.module);
      const response = await post(request);
      const text = await response.text();
      let parsed: unknown = null;
      try { parsed = text ? JSON.parse(text) : null; } catch { parsed = text; }
      evidence.duration_ms = performance.now() - t0;
      return success({ status: response.status, body: parsed }, evidence);
    } catch (error) {
      evidence.duration_ms = performance.now() - t0;
      return failure(error, evidence);
    }
  }
}
