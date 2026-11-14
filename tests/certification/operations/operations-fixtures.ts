/**
 * @file tests/certification/operations/operations-fixtures.ts
 * @description Phase 7.3 Operations Test Fixtures & Reference Contexts.
 * Provides frozen commercial inputs, test OTPs, material manifests, and serialized asset mock data.
 */

import {
  type OperationalJobCard,
  type MaterialManifestItem,
  type SerializedAssetRecord,
  type InstallationQCChecklist,
} from "../../../lib/operations/operational-contract";

export const TEST_DELIVERY_OTP = "543210";
export const TEST_COMPLETION_OTP = "987654";

export const canonicalMaterialManifest: MaterialManifestItem[] = [
  { product_id: "CAM-CP-IP-4MP-BULLET", sku: "TA41L3C-D-Q", qty: 4 },
  { product_id: "REC-CP-NVR-104F1", sku: "CP-UNR-104F1", qty: 1 },
  { product_id: "HDD-BUD-1TB", sku: "HDD-BUD-1TB", qty: 1 },
  { product_id: "POE-SEC-16PORT", sku: "POE-SEC-16PORT", qty: 1 },
];

export const canonicalSerializedAssets: SerializedAssetRecord[] = [
  { serialNumber: "CAM-SN-001-A", skuId: "CAM-CP-IP-4MP-BULLET", productName: "CP-Plus 4MP IP Bullet Camera", warrantyMonths: 12 },
  { serialNumber: "CAM-SN-002-B", skuId: "CAM-CP-IP-4MP-BULLET", productName: "CP-Plus 4MP IP Bullet Camera", warrantyMonths: 12 },
  { serialNumber: "CAM-SN-003-C", skuId: "CAM-CP-IP-4MP-BULLET", productName: "CP-Plus 4MP IP Bullet Camera", warrantyMonths: 12 },
  { serialNumber: "CAM-SN-004-D", skuId: "CAM-CP-IP-4MP-BULLET", productName: "CP-Plus 4MP IP Bullet Camera", warrantyMonths: 12 },
];

export const validQcChecklist: InstallationQCChecklist = {
  camera_focus_verified: true,
  night_vision_tested: true,
  wiring_secured_and_dressed: true,
  mobile_app_connected: true,
  customer_walkthrough_conducted: true,
};

export function createTestJobCard(overrides: Partial<OperationalJobCard> = {}): OperationalJobCard {
  return {
    id: `JOB-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    quote_id: "quote_cert_comm_01",
    lead_id: "lead_comm_01",
    status: "PENDING_DISPATCH",
    installer_id: null,
    assignment_history: [],
    delivery_otp: TEST_DELIVERY_OTP,
    completion_otp: TEST_COMPLETION_OTP,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}
