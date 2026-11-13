import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { CanonicalRequirement } from '../schema/canonical-requirement.ts';
import type { ProductionAdapter, ProductionExecutionContext, ProductionResult } from './adapter-contract.ts';
import { failure, success } from './adapter-contract.ts';
import { installSnapshotShims } from './production-runner.ts';

export type WhatsAppDispatchName = 'generateAndSendPriceRanges' | 'sendBrandVariations' | 'finalizeAndSendQuote' | 'handleCheckoutAction' | 'handleSlotSelection';
export interface WhatsAppBinding { method: WhatsAppDispatchName; buildArgs(input: CanonicalRequirement, context: ProductionExecutionContext): readonly unknown[] | Promise<readonly unknown[]>; }

const LIVE_ENV_KEYS = ['WHATSAPP_PHONE_ID','WA_PHONE_NUMBER_ID','WHATSAPP_TOKEN','WA_ACCESS_TOKEN','MSG91_AUTH_KEY','MSG91_WHATSAPP_NUMBER'];

interface OfflineDispatchResult<T> {
  result: T;
  outboundPayloads: unknown[];
}

async function offline<T>(fn: () => Promise<T> | T): Promise<OfflineDispatchResult<T>> {
  const previous = new Map<string, string | undefined>();
  for (const key of LIVE_ENV_KEYS) { previous.set(key, process.env[key]); delete process.env[key]; }
  const previousFetch = globalThis.fetch;
  const previousWarn = console.warn;
  const outboundPayloads: unknown[] = [];

  const captureJson = (value: unknown): void => {
    if (typeof value !== 'string') return;
    try { outboundPayloads.push(JSON.parse(value)); } catch { /* non-JSON console text */ }
  };

  globalThis.fetch = async (...args: Parameters<typeof fetch>) => {
    const init = args[1];
    if (typeof init?.body === 'string') captureJson(init.body);
    return new Response(JSON.stringify({ certification: true, offline: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  };
  console.warn = (...args: any[]) => {
    for (const arg of args) captureJson(arg);
    previousWarn(...args);
  };

  try {
    const result = await fn();
    return { result, outboundPayloads };
  } finally {
    for (const [key, value] of previous) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
    globalThis.fetch = previousFetch;
    console.warn = previousWarn;
  }
}

export class WhatsAppQuoteDispatchAdapter implements ProductionAdapter<CanonicalRequirement, unknown> {
  readonly id = 'whatsapp-quote-dispatch'; readonly version = '2B.3-v3';
  constructor(private readonly binding: WhatsAppBinding) {}
  async execute(input: CanonicalRequirement, context: ProductionExecutionContext): Promise<ProductionResult<unknown>> {
    const started = new Date().toISOString(); const t0 = performance.now();
    const evidence = { adapter: this.id, module: 'lib/whatsapp/quote-dispatch.ts', export_name: this.binding.method, started_at: started, duration_ms: 0, notes: ['LIVE_OUTBOUND_DISABLED'] as string[] };
    try {
      await installSnapshotShims(context);
      const mod = await import(pathToFileURL(join(context.repoRoot, 'lib/whatsapp/quote-dispatch.ts')).href) as Record<string, unknown>;
      const fn = mod[this.binding.method];
      if (typeof fn !== 'function') throw new Error(`PRODUCTION_EXPORT_NOT_FOUND: ${this.binding.method}`);
      const args = await this.binding.buildArgs(input, context);
      const session = args[1] as Record<string, unknown> | undefined;
      if (session?.phone_number) {
        const firestoreShim = await import(new URL("./snapshot-firestore-shim/firebase-admin-firestore.mjs", import.meta.url).href) as any;
        const db = firestoreShim.getFirestore();
        await db.collection("whatsapp_sessions").doc(String(session.phone_number)).set(session);
      }
      const dispatch = await offline(() => (fn as (...args: unknown[]) => Promise<unknown> | unknown)(...args));
      const value = { result: dispatch.result, outboundPayloads: dispatch.outboundPayloads };
      evidence.duration_ms = performance.now() - t0; return success(value, evidence);
    } catch (error) { evidence.duration_ms = performance.now() - t0; return failure(error, evidence); }
  }
}
