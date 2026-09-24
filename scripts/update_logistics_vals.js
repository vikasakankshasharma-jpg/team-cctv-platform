const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\lib\\validators.ts';
let content = fs.readFileSync(filePath, 'utf8');

const logisticsSchemas = `
// 🚚 LOGISTICS & PROCUREMENT (Phase 2)
export const CreateVendorSchema = z.object({
  name: z.string().min(2, "Vendor name is required"),
  gstin: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GST format").optional().nullable(),
  contact_person: z.string().optional(),
  mobile_number: z.string().optional(),
  email: z.string().email().optional().nullable(),
  brand_affiliations: z.array(z.string()).default([]), // e.g. ["hikvision", "cpplus"]
  is_active: z.boolean().default(true),
});
export type CreateVendorInput = z.infer<typeof CreateVendorSchema>;

export const POItemSchema = z.object({
  sku: z.string(),
  name: z.string(),
  quantity: z.number().int().positive(),
  unit_price: z.number().positive(),
  total: z.number().positive(),
});

export const CreatePOSchema = z.object({
  vendor_id: z.string().min(1),
  hub_id: z.string().min(1),
  items: z.array(POItemSchema).min(1, "PO must have at least one item"),
  total_amount: z.number().positive(),
  expected_delivery_date: z.string().optional(),
  notes: z.string().optional(),
});
export type CreatePOInput = z.infer<typeof CreatePOSchema>;
`;

// Insert it before the Hubs section
content = content.replace(
  /\/\/ ADMIN - HUBS & INSTALLERS/g,
  logisticsSchemas + '\n\n// ADMIN - HUBS & INSTALLERS'
);

fs.writeFileSync(filePath, content);
console.log("Updated validators.ts for Logistics");
