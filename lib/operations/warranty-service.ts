/**
 * @file lib/operations/warranty-service.ts
 * @description Phase 7.3 Warranty Certificate Minting & Immutability Controller.
 * Locks serialized assets, installation dates, and coverage into immutable snapshot certificates.
 */

import {
  type OperationalJobCard,
  type WarrantyCertificateSnapshot,
  type SerializedAssetRecord,
} from "./operational-contract";
import { OperationalStateError } from "./job-lifecycle";

/**
 * Gate 7.3.6: Mints an immutable Warranty Certificate upon verified job completion.
 */
export function mintWarrantyCertificate(params: {
  job: OperationalJobCard;
  customerId: string;
  defaultWarrantyMonths?: number;
}): WarrantyCertificateSnapshot {
  const { job, customerId, defaultWarrantyMonths = 12 } = params;

  if (job.status !== "COMPLETED" || !job.completed_at) {
    throw new OperationalStateError(
      "Cannot mint warranty certificate for uncompleted job",
      "JOB_NOT_COMPLETED"
    );
  }

  const assets = job.installed_assets || [];
  if (assets.length === 0) {
    throw new OperationalStateError(
      "Cannot mint warranty certificate: zero serialized assets installed",
      "MISSING_SERIALIZED_ASSETS"
    );
  }

  const installDate = new Date(job.completed_at);
  const endDate = new Date(installDate);
  endDate.setMonth(endDate.getMonth() + defaultWarrantyMonths);

  const certNumber = `WARR-${installDate.getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

  // Deep clone assets to guarantee snapshot immutability
  const immutableAssets: SerializedAssetRecord[] = assets.map((a) => ({
    serialNumber: a.serialNumber,
    skuId: a.skuId,
    productName: a.productName,
    warrantyMonths: a.warrantyMonths || defaultWarrantyMonths,
  }));

  const certificate: WarrantyCertificateSnapshot = {
    id: `cert_${job.id}_${Date.now()}`,
    certNumber,
    jobId: job.id,
    quoteId: job.quote_id,
    customerId,
    installationDate: installDate.toISOString(),
    warrantyStart: installDate.toISOString(),
    warrantyEnd: endDate.toISOString(),
    assets: immutableAssets,
    status: "ACTIVE",
    issuedAt: new Date().toISOString(),
  };

  return Object.freeze(certificate);
}
