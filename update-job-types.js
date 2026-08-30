const fs = require('fs');
let code = fs.readFileSync('types/index.ts', 'utf8');

const newTypes = `
// ============================================================
// Phase 4C: Operations & Job Card
// ============================================================

export type JobStatus = 
  | "PENDING_DISPATCH" 
  | "BACKORDERED" 
  | "ASSIGNED" 
  | "IN_PROGRESS" 
  | "MATERIAL_SHORTAGE" 
  | "COMPLETED" 
  | "CANCELLED";

export interface SiteSurveySnapshot {
  mounting_height: string;
  surface_type: string;
  furnishing_status: string;
  wall_penetration: string;
  ladder_required: boolean;
  outdoor_camera_count: number;
  indoor_camera_count: number;
}

export interface Job {
  id: string;
  lead_id: string;
  quote_id?: string;
  invoice_ids: string[];
  change_order_ids?: string[];
  
  status: JobStatus;
  assigned_to?: string; // Installer ID
  
  site_survey?: SiteSurveySnapshot;
  inventory_alert?: string;
  
  scheduled_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}
`;

// Replace the old generic Job interface if it exists, otherwise append
if (code.includes('export interface Job {')) {
  // We need to carefully replace the old Job interface or just append our detailed one 
  // Let's replace the whole old Job block. 
  // Actually, string replacement is tricky with regex if it spans multiple lines.
  // I will just append and name it OperationsJob, but the rest of the codebase might be using 'Job'.
  // Let's check if 'export interface Job' is already in types/index.ts.
}

