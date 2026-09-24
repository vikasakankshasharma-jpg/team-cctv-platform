const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\lib\\validators.ts';
let content = fs.readFileSync(filePath, 'utf8');

const surveySchema = `
// ==============================================================================
// SITE SURVEYS / CALENDAR BOOKING
// ==============================================================================

export const SiteSurveySchema = z.object({
  id: z.string().optional(),
  lead_id: z.string().optional(),
  customer_name: z.string().min(2, "Name is required"),
  customer_phone: z.string().min(10, "Valid phone number required"),
  address: z.string().min(10, "Please provide full address"),
  pincode: z.string().min(6, "Valid pincode required"),
  date: z.string(), // YYYY-MM-DD
  time_slot: z.enum(["morning_10_1", "afternoon_2_5", "evening_5_7"]),
  status: z.enum(["pending", "assigned", "completed", "cancelled"]).default("pending"),
  assigned_installer_id: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.any().optional(),
  updated_at: z.any().optional(),
});

export type SiteSurvey = z.infer<typeof SiteSurveySchema>;
`;

content += surveySchema;
fs.writeFileSync(filePath, content);
console.log("Appended SiteSurveySchema to validators.ts");
