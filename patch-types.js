const fs = require('fs');
let c = fs.readFileSync('types/index.ts', 'utf8');

c += `
export interface VendorCategory {
  id?: string;
  vendor_id: string;
  name: string;
  url: string;
  parent_url: string | null;
  level: number;
  created_at?: unknown;
}

export interface StagedProduct extends Partial<Product> {
  id?: string;
  vendor_id: string;
  vendor_product_id: string;
  raw_title: string;
  raw_description?: string;
  raw_specs?: string;
  image_url?: string;
  status: "pending" | "approved" | "rejected";
  created_at?: unknown;
}
`;

fs.writeFileSync('types/index.ts', c);
console.log("Types added");
