const fs = require('fs');
let code = fs.readFileSync('types/index.ts', 'utf8');

const newTypes = `
// ============================================================
// Phase 4A: CRM & Follow-up Queue
// ============================================================

export type LeadPriority = "HOT" | "WARM" | "NURTURE" | "COLD";
export type FollowUpStatus = "pending" | "sending" | "sent" | "failed" | "retry_pending" | "needs_manual_followup" | "cancelled";

export interface FollowUpTask {
  id: string; // Idempotent key (e.g., LEAD_ID-INITIAL_FOLLOWUP)
  lead_id: string;
  quote_id?: string;
  priority: LeadPriority;
  campaign_type: string;
  channel: "whatsapp" | "sms" | "email" | "call";
  
  due_at: string;
  attempt_count: number;
  max_attempts: number;
  
  status: FollowUpStatus;
  last_outcome?: string;
  assigned_to?: string;
  
  created_at: string;
  updated_at: string;
}
`;

if (!code.includes('export interface FollowUpTask')) {
  code += '\n' + newTypes;
  fs.writeFileSync('types/index.ts', code);
}
