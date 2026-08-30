const fs = require('fs');
let code = fs.readFileSync('types/index.ts', 'utf8');

if (code.includes('updated_at?: unknown;\\n}')) {
  // Try replacement
  code = code.replace(
    '  updated_at?: unknown;\\n}', 
    '  updated_at?: unknown;\\n  invoice_ids?: string[];\\n  change_order_ids?: string[];\\n}'
  );
} else {
  // Fallback regex replacement
  code = code.replace(
    /updated_at\?\: unknown;\r?\n\}/,
    'updated_at?: unknown;\n  invoice_ids?: string[];\n  change_order_ids?: string[];\n}'
  );
}

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
`;

if (!code.includes('export interface ChangeOrder')) {
  code += '\\n' + newTypes;
}

fs.writeFileSync('types/index.ts', code);
