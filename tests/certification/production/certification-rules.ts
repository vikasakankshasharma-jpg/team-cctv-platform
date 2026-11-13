export type RequirementClassification = "VALID" | "MANUAL_QUOTE" | "INVALID";

export function classifyCameraCount(cameraCount: number, technology: string): RequirementClassification {
  if (!Number.isFinite(cameraCount) || cameraCount <= 0 || cameraCount > 128) return "INVALID";
  const normalized = technology.trim().toUpperCase();
  const manualThreshold = normalized === "IP" ? 32 : 16;
  return cameraCount <= manualThreshold ? "VALID" : "MANUAL_QUOTE";
}

export function isQuotableDespiteStock(product: { is_active?: boolean; is_deleted?: boolean; is_quotation_eligible?: boolean; stock_status?: string }): boolean {
  return product.is_active === true && product.is_deleted !== true && product.is_quotation_eligible !== false;
}

export const OUT_OF_STOCK_BLOCKED_CODE = "OUT_OF_STOCK_BLOCKED";
