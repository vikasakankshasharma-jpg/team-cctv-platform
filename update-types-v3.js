const fs = require('fs');
let code = fs.readFileSync('types/index.ts', 'utf8');

code = code.replace(
  '  status: "pending_dispatch" | "assigned" | "en_route" | "in_progress" | "pending_customer_approval" | "completed" | "audited" | "cancelled";\n  scheduled_at?: unknown;\n  sla_deadline?: string | null;\n  created_at: unknown;\n  updated_at?: unknown;\n}',
  '  status: "pending_dispatch" | "assigned" | "en_route" | "in_progress" | "pending_customer_approval" | "completed" | "audited" | "cancelled" | "backordered";\n  scheduled_at?: unknown;\n  sla_deadline?: string | null;\n  created_at: unknown;\n  updated_at?: unknown;\n  invoice_ids?: string[];\n  change_order_ids?: string[];\n  inventory_alert?: string;\n}'
);

const newTypes = `
// ============================================================
// Phase 3: Financial Contracts & Change Orders
// ============================================================

export interface InvoiceItemSnapshot {
  product_id: string;
  display_name: string;
  qty: number;
  unit_price: number;
  line_total: number;
  base_cost_at_quote: number;
  stock_status_at_quote?: string;
  brand?: string;
}

export interface ChangeOrder {
  id: string;
  base_invoice_id: string;
  base_job_id: string;
  supplementary_quote_id: string;

  reason: "extra_material" | "extra_labor" | "site_change" | "customer_request";
  items: InvoiceItemSnapshot[];

  subtotal: number;
  gst_amount: number;
  total_payable: number;

  status: "draft" | "pending_customer_approval" | "approved" | "rejected" | "paid" | "cancelled";

  created_by: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  quote_id: string;
  base_invoice_id?: string;

  customer_mobile: string;
  items: InvoiceItemSnapshot[];

  subtotal: number;
  gst_amount: number;
  total_payable: number;

  payment_status: "unpaid" | "paid_advance" | "fully_paid";
  payment_references: string[];

  is_supplementary: boolean;
  change_order_id?: string;

  created_at: string;
}

// ============================================================
// Phase 3: Inventory & Stock Ledger
// ============================================================

export interface InventoryItem {
  id: string; // product_id
  total_stock: number;
  reserved_stock: number;
  available_stock: number; // total_stock - reserved_stock
  last_updated: string;
}

export interface InventoryLedgerEntry {
  id: string;
  product_id: string;
  qty: number; // Positive for addition/returns, negative for consumption
  type: "purchase" | "consumption" | "reservation" | "reversal" | "adjustment";
  reference_entity_id: string; // Job ID, Invoice ID, or ChangeOrder ID
  reference_entity_type: "job" | "invoice" | "change_order" | "manual";
  notes?: string;
  created_at: string;
}

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

if (!code.includes('export interface ChangeOrder')) {
  code += '\\n' + newTypes;
}

fs.writeFileSync('types/index.ts', code);
