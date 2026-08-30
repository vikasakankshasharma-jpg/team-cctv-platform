const fs = require('fs');
let code = fs.readFileSync('types/index.ts', 'utf8');

const newTypes = `
export interface AuditLog {
  id: string;
  entity_type: "quote" | "invoice" | "change_order" | "job" | "inventory";
  entity_id: string;
  action: "created" | "updated" | "payment_success" | "payment_failed" | "inventory_deducted";
  actor: "system" | "webhook" | "admin" | "installer";
  details: Record<string, any>;
  created_at: string;
}

export interface PaymentTransaction {
  id: string;
  transaction_id: string;
  order_id: string;
  reference_entity_id: string; // Invoice ID or Change Order ID
  reference_entity_type: "invoice" | "change_order";
  amount: number;
  status: "SUCCESS" | "FAILED";
  gateway_response: Record<string, any>;
  created_at: string;
}
`;

if (!code.includes('export interface AuditLog')) {
  code += '\n' + newTypes;
  fs.writeFileSync('types/index.ts', code);
}
