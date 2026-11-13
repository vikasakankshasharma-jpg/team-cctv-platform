import type { ProductionAdapter } from './adapter-contract.ts';
import type { CanonicalRequirement } from '../schema/canonical-requirement.ts';

export interface AdapterDescriptor {
  id: string;
  version: string;
  module: string;
  export_name: string;
  exact_signature_verified: boolean;
}

export const PHASE_2B_ADAPTER_DESCRIPTORS: readonly AdapterDescriptor[] = [
  { id: 'pricing-engine', version: '2B.2-v5', module: 'lib/pricing-engine.ts', export_name: 'calculatePricing + generatePricingSnapshot', exact_signature_verified: true },
  { id: 'pricing-engine-v2', version: '2B.3-v1', module: 'lib/pricing-engine-v2.ts', export_name: 'calculatePricingV2', exact_signature_verified: true },
  { id: 'variant-generator', version: '2B.3-v1', module: 'lib/quotation/variant-generator.ts', export_name: 'generateAllCatalogVariations', exact_signature_verified: true },
  { id: 'quotation-profit', version: '2B.3-v1', module: 'lib/quotation-profit.ts', export_name: 'calculateQuotationProfitBreakup', exact_signature_verified: true },
  { id: 'quote-generate-route', version: '2B.3-v1', module: 'app/api/quote/generate/route.ts', export_name: 'POST', exact_signature_verified: true },
  { id: 'build-calculate-route', version: '2B.3-v1', module: 'app/api/build/calculate/route.ts', export_name: 'POST', exact_signature_verified: true },
  { id: 'whatsapp-quote-dispatch', version: '2B.3-v1', module: 'lib/whatsapp/quote-dispatch.ts', export_name: 'generateAndSendPriceRanges / sendBrandVariations / finalizeAndSendQuote / handleCheckoutAction / handleSlotSelection', exact_signature_verified: true },
];

export function adapterById(id: string): AdapterDescriptor {
  const found = PHASE_2B_ADAPTER_DESCRIPTORS.find((x) => x.id === id);
  if (!found) throw new Error(`UNKNOWN_PHASE_2B_ADAPTER: ${id}`);
  return found;
}

export type CanonicalAdapter = ProductionAdapter<CanonicalRequirement, unknown>;
