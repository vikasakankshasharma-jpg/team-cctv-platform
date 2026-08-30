const fs = require('fs');
let code = fs.readFileSync('types/index.ts', 'utf8');

const newTypes = `
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
`;

if (!code.includes('export interface InventoryItem')) {
  code += '\n' + newTypes;
  fs.writeFileSync('types/index.ts', code);
}
