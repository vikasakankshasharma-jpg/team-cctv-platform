import { performance } from "node:perf_hooks";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";
import type { ProductionAdapter, ProductionExecutionContext, ProductionResult } from "./adapter-contract.ts";
import { failure, success } from "./adapter-contract.ts";

const MODULE = "lib/pricing-engine.ts";

/**
 * Translate the certification canonical model into the two production contracts
 * used by the pricing/configuration pipeline. This is deliberately a boundary
 * translator; it does not contain pricing business rules.
 */
export function toProductionInputs(requirement: CanonicalRequirement): {
  selection: Record<string, unknown>;
  cctvRequirement: Record<string, unknown>;
} {
  const cameras = Array.isArray((requirement as any).cameras) ? (requirement as any).cameras : [];
  const technology = String((requirement as any).technology ?? cameras[0]?.technology ?? "HD").toUpperCase();
  const cameraCount = Number((requirement as any).camera_count ?? cameras.reduce((n: number, c: any) => n + Number(c?.count ?? 0), 0));
  const resolution = (requirement as any).resolution ?? cameras.find((c: any) => c?.resolution)?.resolution;
  const recordingDays = Number((requirement as any).recording_days ?? 0);
  const cablingMode = (requirement as any).cabling_mode;
  const cableMeters = Number((requirement as any).cable_length_meters ?? (requirement as any).total_cable_length_meters ?? 0);
  const toMixedCameraRequirement = (c: any): Record<string, unknown> => {
    const wirelessFamily = String(c?.wireless_family ?? "").toLowerCase();
    const requestedFeatures = Array.isArray(c?.requested_features) ? c.requested_features : [];
    const featureTokens = requestedFeatures.map((f: unknown) => String(f).toLowerCase());
    const technologyToken = String(c?.technology ?? "").toLowerCase();

    let type = "Indoor";
    if (wirelessFamily === "4g_solar" || wirelessFamily.includes("4g") || featureTokens.some((f: string) => f.includes("4g") && f.includes("solar"))) {
      type = "4G Solar";
    } else if (featureTokens.includes("ptz") || featureTokens.some((f: string) => f.includes("ptz"))) {
      type = "PTZ";
    } else if (
      wirelessFamily.includes("outdoor") ||
      featureTokens.includes("outdoor") ||
      featureTokens.includes("bullet")
    ) {
      type = featureTokens.includes("wifi") || wirelessFamily.includes("wifi") || technologyToken === "wireless"
        ? "Outdoor WiFi"
        : "Outdoor";
    } else if (
      technologyToken === "wireless" ||
      wirelessFamily.includes("wifi") ||
      featureTokens.includes("wifi")
    ) {
      type = "WiFi Indoor";
    }

    return {
      type,
      count: Number(c?.count ?? 0),
      resolution: c?.resolution,
      technology: c?.technology,
      features: requestedFeatures,
    };
  };

  const canonicalCameras = cameras.map(toMixedCameraRequirement);
  const rawMixedCameraRequirements = Array.isArray((requirement as any).mixed_camera_requirements)
    ? (requirement as any).mixed_camera_requirements
    : [];
  const productionMixedCameraRequirements = rawMixedCameraRequirements.length > 0
    ? rawMixedCameraRequirements.map(toMixedCameraRequirement)
    : canonicalCameras;

  const productionCameras = productionMixedCameraRequirements.length > 0
    ? productionMixedCameraRequirements
    : [{ type: "Indoor", technology, count: cameraCount, resolution, features: [] }];
  const technologyPreference = String((requirement as any).technology_preference ?? technology).toUpperCase();

  const selection: Record<string, unknown> = {
    ...requirement,
    camera_count: cameraCount,
    technology,
    resolution,
    recording_days: recordingDays,
    cabling_mode: cablingMode,
    cable_length_meters: cableMeters,
    total_cable_length_meters: cableMeters,
    mixed_camera_requirements: productionMixedCameraRequirements,
    cameras: productionCameras,
    installation_preference: (requirement as any).installation_preference ?? "pro",
    property_type: (requirement as any).property_type,
  };

  const cctvRequirement: Record<string, unknown> = {
    ...requirement,
    camera_count: cameraCount,
    technology,
    resolution,
    recording_days: recordingDays,
    cabling_mode: cablingMode,
    cable_length_meters: cableMeters,
    total_cable_length_meters: cableMeters,
    mixed_camera_requirements: productionMixedCameraRequirements,
    cameras: productionCameras,
    technology_preference: technologyPreference,
    installation_preference: (requirement as any).installation_preference ?? "pro",
    property_type: (requirement as any).property_type,
  };

  return { selection, cctvRequirement };
}

async function loadModule(repoRoot: string, relativePath: string): Promise<Record<string, any>> {
  const moduleUrl = pathToFileURL(join(repoRoot, relativePath));
  return await import(moduleUrl.href) as Record<string, any>;
}

function pickFunction(module: Record<string, unknown>, name: string, modulePath: string): (...args: any[]) => any {
  const fn = module[name];
  if (typeof fn !== "function") throw new Error(`PRODUCTION_EXPORT_NOT_FOUND: ${name} in ${modulePath}`);
  return fn as (...args: any[]) => any;
}

/** Direct contract invocation for the verified one-object calculatePricing API. */
export async function invokeCalculatePricing(
  fn: (...args: any[]) => any,
  selection: Record<string, unknown>,
  snapshot: ProductionExecutionContext["snapshot"],
): Promise<unknown> {
  const params = {
    selection,
    products: snapshot.products,
    addons: snapshot.addons,
    settings: snapshot.app_settings,
    cablingDone: (selection as any).cabling_mode === "all_existing",
    cablingMeters: Number((selection as any).cable_length_meters ?? (selection as any).total_cable_length_meters ?? 0),
    propertyType: (selection as any).property_type,
    requirements: Array.isArray((selection as any).requested_features) ? (selection as any).requested_features : undefined,
    referralDiscountPercent: 0,
    referralDiscountFlat: 0,
    // Production expects Record<string, AddonRuleResult>; raw frozen addon_rules are intentionally not passed here.
    activeOffer: undefined,
    geoRules: snapshot.geo_rules,
    locationParams: (selection as any).location,
    site_surcharge_flags: (selection as any).site_surcharge_flags,
  };
  return await fn(params);
}

/**
 * Resolve the real configuration first, then invoke the verified nine-argument
 * generatePricingSnapshot contract. No function-arity inference is used.
 */
export async function invokeGeneratePricingSnapshot(
  pricingModule: Record<string, any>,
  repoRoot: string,
  requirement: Record<string, unknown>,
  snapshot: ProductionExecutionContext["snapshot"],
): Promise<unknown> {
  const configurationModule = await loadModule(repoRoot, "lib/configuration-engine.ts");
  const resolverModule = await loadModule(repoRoot, "lib/product-resolver.ts");
  const generateConfiguration = pickFunction(configurationModule, "generateConfiguration", "lib/configuration-engine.ts");
  const resolveProducts = pickFunction(resolverModule, "resolveProducts", "lib/product-resolver.ts");
  const generatePricingSnapshot = pickFunction(pricingModule, "generatePricingSnapshot", MODULE);

  const config = await generateConfiguration(requirement);
  const resolved = await resolveProducts(config, requirement, snapshot.products);
  const resolvedPlans = resolved?.plans ?? {};
  const snapshotsByKey: Record<string, unknown> = {};

  for (const [key, resolvedSystem] of Object.entries(resolvedPlans)) {
    if (!resolvedSystem || !Array.isArray((resolvedSystem as any).cameras)) continue;
    snapshotsByKey[key] = await generatePricingSnapshot(
      resolvedSystem,
      requirement,
      snapshot.addons,
      [],
      snapshot.app_settings,
      undefined,
      0,
      0,
      snapshot.products,
    );
  }

  return {
    plans: snapshotsByKey,
    lifecycleWarnings: resolved?.lifecycleWarnings ?? [],
  };
}

export interface PricingEngineAdapterValue {
  calculatePricing: unknown;
  generatePricingSnapshot: unknown;
}

export class PricingEngineAdapter implements ProductionAdapter<CanonicalRequirement, PricingEngineAdapterValue> {
  readonly id = "pricing-engine";
  readonly version = "2B.2-v5";

  async execute(input: CanonicalRequirement, context: ProductionExecutionContext): Promise<ProductionResult<PricingEngineAdapterValue>> {
    const started = new Date().toISOString();
    const t0 = performance.now();
    const evidence = {
      adapter: this.id,
      module: MODULE,
      export_name: "calculatePricing + generatePricingSnapshot",
      started_at: started,
      duration_ms: 0,
      notes: [] as string[],
    };
    try {
      const pricingModule = await loadModule(context.repoRoot, "lib/pricing-engine.ts");
      const calculatePricing = pickFunction(pricingModule, "calculatePricing", MODULE);
      const { selection, cctvRequirement } = toProductionInputs(input);
      const calculation = await invokeCalculatePricing(calculatePricing, selection, context.snapshot);
      const snapshot = await invokeGeneratePricingSnapshot(pricingModule, context.repoRoot, cctvRequirement, context.snapshot);
      evidence.duration_ms = performance.now() - t0;
      return success({ calculatePricing: calculation, generatePricingSnapshot: snapshot }, evidence);
    } catch (error) {
      evidence.duration_ms = performance.now() - t0;
      return failure(error, evidence);
    }
  }
}
