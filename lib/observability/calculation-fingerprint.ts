/**
 * @file lib/observability/calculation-fingerprint.ts
 * @description Phase 6.2.2 Calculation Fingerprint & Catalog Snapshot Hasher.
 * Produces deterministic, collision-resistant SHA-256 fingerprints identifying the exact
 * calculation context that produced a quotation amount.
 */

import { createHash } from "node:crypto";
import {
  PRICING_ENGINE_VERSION,
  PRICING_POLICY_VERSION,
  type CalculationTelemetryRequirement,
} from "./telemetry-types";

/**
 * Deterministically sorts object keys recursively.
 * Arrays retain their semantic order. Undefined values are omitted.
 */
export function canonicalizeJson(val: unknown): unknown {
  if (val === null || val === undefined) return val;
  if (Array.isArray(val)) return val.map(canonicalizeJson);
  if (typeof val === "object" && Object.prototype.toString.call(val) === "[object Object]") {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(val as Record<string, unknown>).sort();
    for (const key of keys) {
      const v = (val as Record<string, unknown>)[key];
      if (v !== undefined) {
        sorted[key] = canonicalizeJson(v);
      }
    }
    return sorted;
  }
  return val;
}

/**
 * Computes deterministic canonical JSON string.
 */
export function toCanonicalJsonString(val: unknown): string {
  const canonical = canonicalizeJson(val);
  return JSON.stringify(canonical);
}

/**
 * Extracts strictly calculation-relevant fields from a catalog product.
 * Strips volatile timestamps, display marketing copy, vendor notes, and image URLs.
 */
export function extractCalculationRelevantProduct(p: any): Record<string, unknown> {
  const sku = String(p.sku || p.id || "").trim();
  return {
    sku,
    unit_price: typeof p.unit_price === "number" ? p.unit_price : 0,
    base_cost: typeof p.base_cost === "number" ? p.base_cost : 0,
    margin_percent: typeof p.margin_percent === "number" ? p.margin_percent : p.margin_percentage,
    category: p.category || "",
    brand: p.brand || "",
    technology: p.technology || (Array.isArray(p.technologies) ? p.technologies[0] : ""),
    resolution: p.resolution || "",
    is_active: p.is_active === true,
    is_deleted: p.is_deleted === true,
    is_quotation_eligible: p.is_quotation_eligible !== false,
  };
}

/**
 * Computes deterministic SHA-256 hash of the calculation-relevant catalog snapshot.
 */
export function computeCatalogSnapshotHash(products: readonly any[]): string {
  if (!Array.isArray(products) || products.length === 0) {
    return createHash("sha256").update("EMPTY_CATALOG", "utf8").digest("hex");
  }

  const calculationProducts = products
    .filter((p) => p && typeof p === "object")
    .map(extractCalculationRelevantProduct)
    .sort((a, b) => String(a.sku).localeCompare(String(b.sku)));

  const canonicalCatalogJson = toCanonicalJsonString(calculationProducts);
  return createHash("sha256").update(canonicalCatalogJson, "utf8").digest("hex");
}

/**
 * Strips any potential volatile properties (IDs, timestamps) from a customer requirement
 * before fingerprint computation.
 */
export function extractCalculationRelevantRequirement(req: any): CalculationTelemetryRequirement {
  if (!req || typeof req !== "object") return {};

  const cleanReq: CalculationTelemetryRequirement = {};
  if (typeof req.camera_count === "number" || typeof req.cameraCount === "number") {
    cleanReq.cameraCount = req.camera_count ?? req.cameraCount;
  }
  if (typeof req.outdoor_camera_count === "number" || typeof req.outdoorCameraCount === "number") {
    cleanReq.outdoorCameraCount = req.outdoor_camera_count ?? req.outdoorCameraCount;
  }
  if (typeof req.indoor_camera_count === "number" || typeof req.indoorCameraCount === "number") {
    cleanReq.indoorCameraCount = req.indoor_camera_count ?? req.indoorCameraCount;
  }
  if (req.technology) cleanReq.technology = String(req.technology).toUpperCase();
  if (req.resolution) cleanReq.resolution = String(req.resolution).toUpperCase();
  if (req.brand) cleanReq.brand = String(req.brand).toUpperCase();
  if (typeof req.storage_retention_days === "number" || typeof req.storageDays === "number") {
    cleanReq.storageDays = req.storage_retention_days ?? req.storageDays;
  }
  if (req.property_type || req.propertyType) {
    cleanReq.propertyType = String(req.property_type || req.propertyType).toLowerCase();
  }
  if (req.requiresIndustrialQuote !== undefined) {
    cleanReq.requiresIndustrialQuote = Boolean(req.requiresIndustrialQuote);
  }

  return cleanReq;
}

/**
 * Formula:
 * F = SHA256(canonicalRequirementJSON || "|" || engineVersion || "|" || catalogSnapshotHash || "|" || pricingPolicyVersion)
 *
 * Guaranteed Invariant: Volatile data (requestId, quoteId, timestamp, duration) is strictly excluded.
 */
export function computeCalculationFingerprint(params: {
  requirement: unknown;
  engineVersion?: string;
  catalogSnapshotHash: string;
  pricingPolicyVersion?: string;
}): string {
  const cleanReq = extractCalculationRelevantRequirement(params.requirement);
  const canonicalReqJson = toCanonicalJsonString(cleanReq);
  const engineVer = params.engineVersion || PRICING_ENGINE_VERSION;
  const policyVer = params.pricingPolicyVersion || PRICING_POLICY_VERSION;

  const payload = `${canonicalReqJson}|${engineVer}|${params.catalogSnapshotHash}|${policyVer}`;
  return createHash("sha256").update(payload, "utf8").digest("hex");
}
