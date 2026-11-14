/**
 * @file tests/certification/journey/journey-test-context.ts
 * @description Phase 7.1 Customer Journey Test Context & Mock Storage.
 * Provides isolated in-memory quote persistence and route resolution simulation.
 */

import { certifiedProducts, certifiedAddons, certifiedSettings } from "./journey-fixtures";

export interface StoredQuoteRecord {
  id: string;
  leadId: string;
  plan_type?: string;
  technology: string;
  total_payable: number;
  net_taxable_amount: number;
  gst_amount: number;
  items: any[];
  configuration_snapshot: any[];
  request_id: string;
  calculation_fingerprint: string;
  catalog_snapshot_hash: string;
  created_at: string;
  expires_at: string;
  version: number;
}

export interface StoredLeadRecord {
  id: string;
  customer_name: string;
  mobile_number: string;
  created_at: string;
}

export class JourneyTestContext {
  private readonly quotes = new Map<string, StoredQuoteRecord>();
  private readonly leads = new Map<string, StoredLeadRecord>();

  saveQuote(quoteData: Omit<StoredQuoteRecord, "id">): string {
    const quoteId = `quote_mock_${Math.random().toString(36).slice(2, 10)}`;
    const record: StoredQuoteRecord = {
      id: quoteId,
      ...quoteData,
    };
    this.quotes.set(quoteId, Object.freeze(JSON.parse(JSON.stringify(record))));
    return quoteId;
  }

  getQuote(quoteId: string): StoredQuoteRecord | null {
    const quote = this.quotes.get(quoteId);
    return quote ? JSON.parse(JSON.stringify(quote)) : null;
  }

  saveLead(leadData: Omit<StoredLeadRecord, "id">): string {
    const leadId = `lead_mock_${Math.random().toString(36).slice(2, 10)}`;
    const record: StoredLeadRecord = {
      id: leadId,
      ...leadData,
    };
    this.leads.set(leadId, Object.freeze(JSON.parse(JSON.stringify(record))));
    return leadId;
  }

  getLead(leadId: string): StoredLeadRecord | null {
    const lead = this.leads.get(leadId);
    return lead ? JSON.parse(JSON.stringify(lead)) : null;
  }

  /**
   * Simulates the exact route resolver in app/(customer)/quote/[leadId]/page.tsx:
   * First checks quotes collection by identity, then falls back to leads.
   */
  resolveQuoteOrLeadRoute(param: string): {
    type: "QUOTE_SNAPSHOT" | "LEAD_CONFIGURATOR" | "NOT_FOUND";
    resolvedLeadId?: string;
    resolvedQuoteId?: string;
    quoteData?: StoredQuoteRecord;
  } {
    // 1. Check exact identity in quotes collection
    const quote = this.quotes.get(param);
    if (quote) {
      return {
        type: "QUOTE_SNAPSHOT",
        resolvedLeadId: quote.leadId,
        resolvedQuoteId: quote.id,
        quoteData: quote,
      };
    }

    // 2. Check uppercase quote identity
    const upperQuote = this.quotes.get(param.toUpperCase());
    if (upperQuote) {
      return {
        type: "QUOTE_SNAPSHOT",
        resolvedLeadId: upperQuote.leadId,
        resolvedQuoteId: upperQuote.id,
        quoteData: upperQuote,
      };
    }

    // 3. Fallback to leads collection
    const lead = this.leads.get(param);
    if (lead) {
      return {
        type: "LEAD_CONFIGURATOR",
        resolvedLeadId: lead.id,
      };
    }

    return { type: "NOT_FOUND" };
  }

  /**
   * Creates an adversarial, mutated catalog (T2 mutation) where product prices
   * have increased by +50%, simulating real-world price changes.
   */
  getAdversarialMutatedProducts(): any[] {
    return certifiedProducts.map((p: any) => ({
      ...p,
      unit_price: typeof p.unit_price === "number" ? Math.round(p.unit_price * 1.5) : p.unit_price,
      base_cost: typeof p.base_cost === "number" ? Math.round(p.base_cost * 1.5) : p.base_cost,
    }));
  }
}
