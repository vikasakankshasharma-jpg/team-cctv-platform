export { PHASE_2B_ADAPTER_DESCRIPTORS, adapterById } from './adapter-registry.ts';
export { PostRouteAdapter } from './request-route.adapter.ts';
export { PricingEngineV2Adapter } from './pricing-engine-v2.adapter.ts';
export { VariantGeneratorAdapter } from './variant-generator.adapter.ts';
export { QuotationProfitAdapter } from './quotation-profit.adapter.ts';
export { WhatsAppQuoteDispatchAdapter } from './whatsapp-quote-dispatch.adapter.ts';
export { runDifferentialCorpus } from './differential-runner.ts';
export { createPricingEngineV2Adapter, createVariantGeneratorAdapter, createQuotationProfitAdapter, createQuoteGenerateRouteAdapter, createBuildCalculateRouteAdapter, createWhatsAppQuoteDispatchAdapter } from './default-adapters.ts';
export { PricingEngineAdapter } from './pricing-engine.adapter.ts';
