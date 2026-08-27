import { QuoteSnapshot } from "@/types";

export interface WhatsAppMessagePayload {
  phone: string;
  customerName: string;
  quoteId: string;
  totalAmount: number;
  pdfUrl: string;
  selectedPlan: string;
  planDetails: {
    cameras: number;
    days: number;
    remote: boolean;
  };
}

export interface WhatsAppProvider {
  sendQuote(payload: WhatsAppMessagePayload): Promise<{ success: boolean; messageId?: string; error?: string }>;
}
