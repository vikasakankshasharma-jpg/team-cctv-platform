export type WhatsAppBotState = 
  | "IDLE"
  | "GREETING"
  | "WAITING_FOR_FLOW"
  | "ASK_PINCODE"
  | "ASK_PROPERTY"
  | "ASK_CAMERA_COUNT"
  | "ASK_TECH"
  | "ASK_STORAGE"
  | "GENERATING"
  | "QUOTE_SENT"
  | "ADJUST_QUOTE"
  | "COMPLETED";

export interface WhatsAppSession {
  id?: string;
  phone_number: string;
  state: WhatsAppBotState;
  wizard_answers: Record<string, any>;
  last_message_at: unknown; // Firestore Timestamp
  created_at: unknown; // Firestore Timestamp
  lead_id?: string;
  quote_id?: string;
}
