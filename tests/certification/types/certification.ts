import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";

export type {
  ActiveOffer,
  CameraRequirement,
  CanonicalRequirement,
  ExistingSystem,
  ExistingSystemRequirement,
  Location,
  RecorderRequirement,
  StorageRequirement,
  WirelessPower,
} from "../schema/canonical-requirement.ts";

export {
  ActiveOfferSchema,
  CameraRequirementSchema,
  CanonicalRequirementSchema,
  CeilingHeightSchema,
  ExistingSystemSchema,
  LocationSchema,
  RecorderRequirementSchema,
  StorageRequirementSchema,
  WirelessPowerSchema,
} from "../schema/canonical-requirement.ts";

export type {
  ActiveOfferType,
  CablingMode,
  CeilingHeight,
  HybridWiredTechnology,
  InstallationPreference,
  InstallationType,
  PowerWiringOption,
  RecordingMode,
  RequirementClassification,
  Technology,
  TechnologyAlias,
  WirelessFamily,
  WiringType,
} from "../schema/enums.ts";

export interface CertificationCase {
  id: string;
  family: string;
  description: string;
  requirement: CanonicalRequirement;
  expected_classification: "VALID" | "INVALID" | "MANUAL_QUOTE";
  expected_issue_codes?: string[];
}

export interface ClassificationIssue {
  code: string;
  severity: "ERROR" | "WARNING" | "INFO";
  message: string;
  field?: string;
}

export interface ClassificationResult {
  classification: "VALID" | "INVALID" | "MANUAL_QUOTE";
  requires_manual_quote: boolean;
  issues: ClassificationIssue[];
}

export interface FrozenFileManifestEntry {
  file: string;
  sha256: string;
  bytes: number;
}

export interface FrozenManifest {
  schema_version: 1;
  generated_at: string;
  git_commit: string;
  business_rules_version: string;
  harness_version: string;
  files: FrozenFileManifestEntry[];
  catalog_sha256: string;
  addons_sha256: string;
  addon_rules_sha256: string;
  geo_rules_sha256: string;
  promoters_sha256: string;
  app_settings_sha256: string;
  sku_crosswalk_sha256: string;
  manifest_sha256?: string;
}

export interface FrozenProduct {
  id?: string;
  sku: string;
  technical_name?: string;
  display_name?: string;
  name?: string;
  brand?: string;
  model?: string;
  category?: string;
  technology?: string;
  technologies?: string[];
  resolution?: string;
  resolution_tier?: string;
  wireless_family?: string;
  channels?: number;
  max_cameras?: number;
  channel_capacity?: number;
  channel_count?: number;
  capacity?: number;
  is_active?: boolean;
  is_deleted?: boolean;
  is_quotation_eligible?: boolean;
  is_addon?: boolean;
  unit_price?: number;
  base_cost?: number;
  margin_percent?: number;
  margin?: number;
  gst_inclusive?: boolean;
  stock_status?: string;
  [key: string]: unknown;
}

export interface FrozenAddonRule {
  id?: string;
  addon_sku?: string;
  addon_product_sku?: string;
  condition?: Record<string, unknown>;
  quantity_formula?: string;
  [key: string]: unknown;
}

export interface FrozenContext {
  products: readonly FrozenProduct[];
  addons: readonly FrozenProduct[];
  addon_rules: readonly FrozenAddonRule[];
  geo_rules: readonly Record<string, unknown>[];
  promoters: readonly Record<string, unknown>[];
  app_settings: Readonly<Record<string, unknown>>;
  sku_crosswalk: Readonly<Record<string, unknown>>;
  manifest: FrozenManifest;
}
