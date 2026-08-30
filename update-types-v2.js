const fs = require('fs');
let code = fs.readFileSync('types/index.ts', 'utf8');

if (!code.includes('invoice_ids')) {
  code = code.replace(
    'status: "pending_dispatch" | "assigned" | "en_route" | "in_progress" | "pending_customer_approval" | "completed" | "audited" | "cancelled";',
    'status: "pending_dispatch" | "assigned" | "en_route" | "in_progress" | "pending_customer_approval" | "completed" | "audited" | "cancelled" | "backordered";'
  );
  code = code.replace(
    '  updated_at?: unknown;\\n}', 
    '  updated_at?: unknown;\\n  invoice_ids?: string[];\\n  change_order_ids?: string[];\\n  inventory_alert?: string;\\n}'
  );
  
  // Wait, I messed up the regex for updated_at yesterday, let's use string split and join
}
