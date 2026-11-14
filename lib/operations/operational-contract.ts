/**
 * @file lib/operations/operational-contract.ts
 * @description Phase 7.3 Operational Lifecycle Contracts & Domain Models.
 * Defines the operational authority decoupled from financial/quote authority.
 */

export type JobOperationalStatus =
  | "PENDING_DISPATCH"
  | "BACKORDERED"
  | "ASSIGNED"
  | "DISPATCHED"
  | "DELIVERED"
  | "IN_PROGRESS"
  | "MATERIAL_SHORTAGE"
  | "PARTIALLY_COMPLETED"
  | "COMPLETED"
  | "CANCELLED";

export interface InstallerAssignmentAudit {
  installer_id: string;
  assigned_by: string;
  assigned_at: string;
  assignment_reason?: string;
  previous_installer_id?: string | null;
}

export interface MaterialManifestItem {
  product_id: string;
  sku: string;
  qty: number;
}

export interface MaterialDeliveryAudit {
  job_id: string;
  delivery_otp_verified_at: string;
  verified_by: string;
  material_manifest: MaterialManifestItem[];
  delivered_quantity: number;
}

export interface InstallationQCChecklist {
  camera_focus_verified: boolean;
  night_vision_tested: boolean;
  wiring_secured_and_dressed: boolean;
  mobile_app_connected: boolean;
  customer_walkthrough_conducted: boolean;
}

export interface SerializedAssetRecord {
  serialNumber: string;
  skuId: string;
  productName: string;
  warrantyMonths: number;
}

export interface WarrantyCertificateSnapshot {
  id: string;
  certNumber: string;
  jobId: string;
  quoteId: string;
  customerId: string;
  installationDate: string;
  warrantyStart: string;
  warrantyEnd: string;
  assets: SerializedAssetRecord[];
  status: "ACTIVE" | "EXPIRED" | "VOID";
  issuedAt: string;
}

export interface PmVisitSchedule {
  visitNumber: number;
  scheduledDate: string;
  status: "scheduled" | "completed";
}

export interface AmcEntitlementRecord {
  id: string;
  quoteId: string;
  planName: string;
  isComplimentary: boolean;
  durationMonths: number;
  includedPmVisits: number;
  scheduledPmVisits: PmVisitSchedule[];
  startDate: string;
  endDate: string;
  status: "ACTIVE" | "EXPIRED";
}

export interface OperationalJobCard {
  id: string;
  quote_id: string;
  lead_id: string;
  status: JobOperationalStatus;
  installer_id?: string | null;
  assignment_history: InstallerAssignmentAudit[];
  delivery_audit?: MaterialDeliveryAudit;
  delivery_otp?: string;
  completion_otp?: string;
  qc_checklist?: InstallationQCChecklist;
  installed_assets?: SerializedAssetRecord[];
  warranty_cert_id?: string;
  amc_entitlement_id?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}
