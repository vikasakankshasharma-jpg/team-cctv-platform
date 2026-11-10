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
  | "ASK_SURFACE_TYPE"
  | "ASK_CUSTOM_CABLE_METERS"
  | "ASK_CABLING_OR_POWER"
  | "ASK_HYBRID_POWER"
  | "ASK_INTERNET"
  | "ASK_TIMELINE"
  | "ASK_PINCODE"
  | "ASK_NAME"
  | "GENERATING"
  | "SHOW_PRICE_RANGES"
  | "SHOW_BRAND_VARIATIONS"
  | "QUOTE_FROZEN"
  | "BOOKING_SLOT"
  | "PAUSED_FOR_AGENT"
  | "COMPLETED";

export type WhatsAppIncomingType = 
  | "text" 
  | "interactive" 
  | "nfm_reply" 
  | "location" 
  | "image" 
  | "document" 
  | "audio" 
  | "video" 
  | "sticker";

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
  last_processed_message_id?: string;
  last_inbound_text?: string;
  language?: string; // LocaleCode e.g. "en" | "hi" | "mr" | "gu" | "ta" | "te" | "kn" | "bn" | "ml" | "pa" | "or"
}
