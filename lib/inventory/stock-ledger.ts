/**
 * @file lib/inventory/stock-ledger.ts
 * @description Phase 8 Physical Inventory & Serialized Asset Ledger.
 * Bridges software commitments with physical warehouse stock, serial tracking,
 * and delivery reconciliation for Jaipur CCTV installations.
 */

export interface StockItem {
  sku: string;
  name: string;
  category: "CAMERA" | "RECORDER" | "STORAGE" | "POWER" | "CABLE" | "ACCESSORY";
  isSerialized: boolean;
  openingQty: number;
  inwardQty: number; // Purchased / stocked
  reservedQty: number; // Committed to active orders
  dispatchedQty: number; // In transit with installer
  deliveredQty: number; // Handed over with Delivery OTP
  consumedQty: number; // Installed and verified with Completion PIN
  returnedQty: number; // Returned to warehouse
}

export interface SerializedStockAsset {
  serialNumber: string;
  sku: string;
  category: "CAMERA" | "RECORDER" | "STORAGE";
  macAddress?: string;
  status: "AVAILABLE" | "RESERVED" | "DISPATCHED" | "DELIVERED" | "INSTALLED" | "DEFECTIVE_RETURN";
  assignedJobId?: string;
  assignedQuoteId?: string;
  inwardDate: string;
  installedDate?: string;
}

export interface StockBalance {
  sku: string;
  totalAvailable: number; // (opening + inward + returned) - (reserved + dispatched + delivered + consumed)
  inStock: number; // Physically present in warehouse (totalAvailable + reserved)
  onField: number; // dispatched + delivered
  installed: number; // consumed
}

/**
 * Computes live physical stock balance for an inventory item.
 */
export function computeStockBalance(item: StockItem): StockBalance {
  const totalPhysicalIn = item.openingQty + item.inwardQty + item.returnedQty;
  const totalAllocated = item.reservedQty + item.dispatchedQty + item.deliveredQty + item.consumedQty;
  const availableToSell = Math.max(0, totalPhysicalIn - totalAllocated);
  const physicallyInWarehouse = Math.max(0, totalPhysicalIn - (item.dispatchedQty + item.deliveredQty + item.consumedQty));

  return {
    sku: item.sku,
    totalAvailable: availableToSell,
    inStock: physicallyInWarehouse,
    onField: item.dispatchedQty + item.deliveredQty,
    installed: item.consumedQty,
  };
}

/**
 * Validates that all high-value items in a job card have unique valid serial numbers.
 */
export function reconcileJobSerializedAssets(params: {
  jobId: string;
  requiredSerials: { sku: string; category: string }[];
  capturedAssets: SerializedStockAsset[];
}): { reconciled: boolean; missingCount: number; errors: string[] } {
  const errors: string[] = [];
  const capturedSerials = new Set<string>();

  for (const asset of params.capturedAssets) {
    if (!asset.serialNumber || asset.serialNumber.trim().length < 4) {
      errors.push(`Invalid serial number: "${asset.serialNumber}" for SKU ${asset.sku}`);
    }
    if (capturedSerials.has(asset.serialNumber)) {
      errors.push(`Duplicate serial detected in same job: "${asset.serialNumber}"`);
    }
    capturedSerials.add(asset.serialNumber);
  }

  const missingCount = Math.max(0, params.requiredSerials.length - capturedSerials.size);
  if (missingCount > 0) {
    errors.push(`Missing ${missingCount} required serialized asset(s) for Job ${params.jobId}`);
  }

  return {
    reconciled: errors.length === 0,
    missingCount,
    errors,
  };
}
