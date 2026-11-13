import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";
import { sha256Json } from "../fixtures/frozen-context.ts";
import type { ProductionAdapter, ProductionExecutionContext, ProductionResult } from "./adapter-contract.ts";

export function inputSha256(input: unknown): string {
  return sha256Json(input);
}

export async function installSnapshotShims(context: ProductionExecutionContext): Promise<void> {
  const shim = await import(new URL("./snapshot-firestore-shim/install-snapshot.mjs", import.meta.url).href) as { installSnapshot: (snapshot: unknown) => Promise<void> };
  await shim.installSnapshot(context.snapshot);
}

export async function runProductionAdapter<I, O>(adapter: ProductionAdapter<I, O>, input: I, context: ProductionExecutionContext): Promise<ProductionResult<O>> {
  await installSnapshotShims(context);
  return adapter.execute(input, context);
}

export async function runProductionCase(adapter: ProductionAdapter<CanonicalRequirement, unknown>, input: CanonicalRequirement, context: ProductionExecutionContext): Promise<ProductionResult<unknown>> {
  return runProductionAdapter(adapter, input, context);
}
