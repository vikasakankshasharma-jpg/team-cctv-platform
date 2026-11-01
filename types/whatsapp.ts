export type WhatsAppBotState = 
  | "IDLE"
  | "GREETING"
  | "ASK_PROP"
  | "ASK_INSTALL_TYPE"
  | "ASK_CAMERA_COUNT"
  | "ASK_CAMERA_SPLIT"
  | "ASK_TECH"
  | "ASK_STORAGE"
  | "ASK_CABLING"
  | "ASK_INTERNET"
  | "ASK_TIMELINE"
  | "ASK_SITE_CONDITIONS"
  | "ASK_PINCODE"
  | "GENERATING"
  | "SHOW_PRICE_RANGES"
  | "SHOW_BRAND_VARIATIONS"
  | "QUOTE_FROZEN"
  | "BOOKING_SLOT"
  | "PAUSED_FOR_AGENT"
  | "COMPLETED";

export interface WhatsAppSession {
  id?: string;
  phone_number: string;
  customer_name?: string;
  state: WhatsAppBotState;
  wizard_answers: Record<string, any>;
  last_message_at: unknown; // Firestore Timestamp / Date
  created_at: unknown; // Firestore Timestamp / Date
  lead_id?: string;
  quote_id?: string;
  selected_brand?: string;
  partner_id?: string;
  utm_source?: string;
  utm_campaign?: string;
  nearest_hub?: string;
}
