import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";
import type { ProductionExecutionContext } from "./adapter-contract.ts";
import { PricingEngineV2Adapter } from "./pricing-engine-v2.adapter.ts";
import { VariantGeneratorAdapter } from "./variant-generator.adapter.ts";
import { QuotationProfitAdapter } from "./quotation-profit.adapter.ts";
import { PostRouteAdapter } from "./request-route.adapter.ts";
import { WhatsAppQuoteDispatchAdapter } from "./whatsapp-quote-dispatch.adapter.ts";
import { resolvePricingV2Params, buildVariantGeneratorParams, buildQuotationProfitArgs, buildQuoteGenerateBody, buildBuildCalculateBody, buildWhatsAppSession } from "./production-bindings.ts";

export function createPricingEngineV2Adapter(): PricingEngineV2Adapter {
  return new PricingEngineV2Adapter({ buildParams: resolvePricingV2Params });
}
export function createVariantGeneratorAdapter(): VariantGeneratorAdapter {
  return new VariantGeneratorAdapter({ buildParams: buildVariantGeneratorParams });
}
export function createQuotationProfitAdapter(): QuotationProfitAdapter {
  return new QuotationProfitAdapter({ buildArgs: buildQuotationProfitArgs });
}
export function createQuoteGenerateRouteAdapter(): PostRouteAdapter {
  return new PostRouteAdapter({ id: "quote-generate-route", version: "2B.3-v2", module: "app/api/quote/generate/route.ts", body: buildQuoteGenerateBody });
}
export function createBuildCalculateRouteAdapter(): PostRouteAdapter {
  return new PostRouteAdapter({ id: "build-calculate-route", version: "2B.3-v2", module: "app/api/build/calculate/route.ts", body: buildBuildCalculateBody });
}
export function createWhatsAppQuoteDispatchAdapter(): WhatsAppQuoteDispatchAdapter {
  return new WhatsAppQuoteDispatchAdapter({
    method: "generateAndSendPriceRanges",
    buildArgs: async (input: CanonicalRequirement, _context: ProductionExecutionContext) => [String(buildWhatsAppSession(input).phone_number), buildWhatsAppSession(input)],
  });
}
