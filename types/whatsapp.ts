export type WhatsAppBotState = 
  | "IDLE"
  | "GREETING"
  | "ASK_PROP"
  | "ASK_INSTALL_TYPE"
  | "ASK_ADDON_COMPATIBILITY"
  | "ASK_WIRELESS_VARIANT"
  | "ASK_CAMERA_SETUP"
  | "ASK_CAMERA_OUTDOOR"
  | "ASK_CAMERA_INDOOR"
  | "ASK_HYBRID_WIRELESS"
  | "ASK_WIRELESS_QTY"
  | "ASK_CAMERA_COUNT"
  | "ASK_CAMERA_SPLIT"
  | "ASK_TECH"
  | "ASK_STORAGE_DAYS"
  | "ASK_RECORDING_MODE"
  | "ASK_MOUNTING_CONDITIONS"
  | "ASK_CABLING_OR_POWER"
  | "ASK_INTERNET"
  | "ASK_TIMELINE"
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
