import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";
import type { ProductionExecutionContext } from "./adapter-contract.ts";
import { invokeCalculatePricing, toProductionInputs } from "./pricing-engine.adapter.ts";

async function loadModule(repoRoot: string, relativePath: string): Promise<Record<string, any>> {
  return await import(pathToFileURL(join(repoRoot, relativePath)).href) as Record<string, any>;
}

async function resolveFirstPlan(requirement: CanonicalRequirement, context: ProductionExecutionContext): Promise<Record<string, unknown>> {
  const { cctvRequirement } = toProductionInputs(requirement);
  const configMod = await loadModule(context.repoRoot, "lib/configuration-engine.ts");
  const resolverMod = await loadModule(context.repoRoot, "lib/product-resolver.ts");
  const config = await configMod.generateConfiguration(cctvRequirement);
  const resolved = await resolverMod.resolveProducts(config, cctvRequirement, context.snapshot.products);
  const entry = Object.entries(resolved?.plans ?? {}).find(([, plan]) => plan && Array.isArray((plan as any).cameras));
  if (!entry) throw new Error("CERT_NO_RESOLVED_PLAN");
  return entry[1] as Record<string, unknown>;
}

export function buildPricingV2Params(input: CanonicalRequirement, context: ProductionExecutionContext): Record<string, unknown> {
  // This binder is intentionally synchronous at the public adapter boundary. The expensive
  // configuration resolution is performed by the adapter before invocation.
  const { cctvRequirement } = toProductionInputs(input);
  return {
    resolvedSystem: undefined,
    req: cctvRequirement,
    settings: context.snapshot.app_settings,
    addons: context.snapshot.addons,
    selectedAddonIds: [],
    activeOffer: undefined,
    referralDiscountPercent: 0,
    referralDiscountFlat: 0,
    products: context.snapshot.products,
  };
}

export async function resolvePricingV2Params(input: CanonicalRequirement, context: ProductionExecutionContext): Promise<Record<string, unknown>> {
  return { ...buildPricingV2Params(input, context), resolvedSystem: await resolveFirstPlan(input, context) };
}

export async function buildVariantGeneratorParams(input: CanonicalRequirement, context: ProductionExecutionContext): Promise<Record<string, unknown>> {
  const { selection } = toProductionInputs(input);
  return {
    selection,
    products: context.snapshot.products,
    addons: context.snapshot.addons,
    settings: context.snapshot.app_settings,
    cablingDone: (selection as any).cabling_mode === "all_existing",
    cablingMeters: Number((selection as any).cable_length_meters ?? (selection as any).total_cable_length_meters ?? 0),
    promoterDiscount: { percent: 0, flat: 0 },
    evaluatedAddonRules: undefined,
    activeOffer: undefined,
  };
}

export async function buildQuotationProfitArgs(input: CanonicalRequirement, context: ProductionExecutionContext): Promise<readonly unknown[]> {
  const pricingMod = await loadModule(context.repoRoot, "lib/pricing-engine.ts");
  const { selection } = toProductionInputs(input);
  const pricing = await invokeCalculatePricing(pricingMod.calculatePricing, selection, context.snapshot);
  return [pricing, context.snapshot.app_settings];
}

export function buildQuoteGenerateBody(input: CanonicalRequirement): Record<string, unknown> {
  const { cctvRequirement } = toProductionInputs(input);
  return { ...cctvRequirement, selected_addons: [], partner_id: undefined };
}

export function buildBuildCalculateBody(input: CanonicalRequirement, context: ProductionExecutionContext): Record<string, unknown> {
  const cameras = Array.isArray((input as any).cameras) ? (input as any).cameras : [];
  const count = Number((input as any).camera_count ?? cameras.reduce((n: number, c: any) => n + Number(c?.count ?? 0), 0));
  const technology = String((input as any).technology ?? cameras[0]?.technology ?? "HD").toUpperCase();
  const resolution = String((input as any).resolution ?? cameras[0]?.resolution ?? "2MP");
  const camera = context.snapshot.products.find((p: any) => p?.is_active === true && p?.is_deleted !== true && p?.is_quotation_eligible !== false && p?.category === "cctv_camera" && String(p?.technology ?? "").toUpperCase() === technology && String(p?.resolution ?? "") === resolution);
  const recorder = context.snapshot.products.find((p: any) => p?.is_active === true && p?.is_deleted !== true && p?.is_quotation_eligible !== false && p?.category === "recorder");
  const storage = context.snapshot.products.find((p: any) => p?.is_active === true && p?.is_deleted !== true && p?.is_quotation_eligible !== false && p?.category === "storage" && /hard disk/i.test(String(p?.storage_type ?? "")));
  const selected = [
    camera && { product_id: String(camera.id ?? camera.sku), quantity: count },
    recorder && { product_id: String(recorder.id ?? recorder.sku), quantity: 1 },
    storage && { product_id: String(storage.id ?? storage.sku), quantity: 1 },
  ].filter(Boolean);
  return { selections: selected, existingEquipment: undefined };
}

export function buildWhatsAppSession(input: CanonicalRequirement): Record<string, unknown> {
  const { cctvRequirement } = toProductionInputs(input);
  const phone = `cert-${String(cctvRequirement.camera_count ?? 0)}-${String(cctvRequirement.technology ?? "HD")}`;
  return {
    phone_number: phone,
    state: "PRICE_RANGE",
    wizard_answers: { ...cctvRequirement },
    last_message_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    customer_name: "Certification Runner",
    language: "en",
  };
}
