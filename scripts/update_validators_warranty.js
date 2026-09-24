const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\lib\\validators.ts';
let content = fs.readFileSync(filePath, 'utf8');

const newSchemas = `
// ==============================================================================
// WARRANTY & SUPPORT TICKETS
// ==============================================================================

export const WarrantySchema = z.object({
  id: z.string().optional(),
  quote_id: z.string(),
  lead_id: z.string(),
  customer_id: z.string().optional(),
  customer_phone: z.string().optional(),
  status: z.enum(["active", "expired", "voided"]).default("active"),
  starts_at: z.string(), // ISO Date
  expires_at: z.string(), // ISO Date
  total_amc_visits_allowed: z.number().default(2),
  amc_visits_used: z.number().default(0),
  hardware_coverage_months: z.number().default(12),
  created_at: z.any().optional(),
  updated_at: z.any().optional(),
});

export type Warranty = z.infer<typeof WarrantySchema>;

export const SupportTicketSchema = z.object({
  id: z.string().optional(),
  ticket_number: z.string().optional(),
  warranty_id: z.string().optional(), // Can be null if out of warranty
  quote_id: z.string(),
  lead_id: z.string(),
  customer_name: z.string(),
  customer_phone: z.string(),
  issue_category: z.enum(["camera_offline", "dvr_beeping", "app_not_working", "wiring_issue", "other"]),
  issue_description: z.string().min(10, "Please provide more detail"),
  media_urls: z.array(z.string().url()).optional(),
  status: z.enum(["open", "assigned", "in_progress", "resolved", "cancelled"]).default("open"),
  payment_status: z.enum(["free_amc", "chargeable_labor", "fully_chargeable", "paid"]).default("free_amc"),
  assigned_installer_id: z.string().optional(),
  resolution_notes: z.string().optional(),
  created_at: z.any().optional(),
  updated_at: z.any().optional(),
});

export type SupportTicket = z.infer<typeof SupportTicketSchema>;
`;

content += newSchemas;
fs.writeFileSync(filePath, content);
console.log("Appended Warranty & Support Schemas to validators.ts");
