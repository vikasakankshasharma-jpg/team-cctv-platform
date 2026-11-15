import crypto from "crypto";

/**
 * CATALOG FINGERPRINTING & IDEMPOTENCY ENGINE
 * 
 * Enforces strict decoupling between Product Identity and Mutable Commercial Pricing:
 * - Product Identity (Brand + Model + Variant) determines SPECIFICATIONS (Immutable).
 * - Price / Vendor Cost (Base Cost, Selling Price) is MUTABLE.
 * 
 * Invariant: A price change NEVER triggers re-parsing, spec extraction, or AI calls.
 */

export interface ProductIdentity {
  brand: string;
  model: string;
  variant?: string;
  identityKey: string;
}

/**
 * Normalizes manufacturer model codes (e.g. "CP-UNC-DA24L2 - V3" -> "cp-unc-da24l2-v3")
 */
export function normalizeModelCode(rawModel: string): string {
  if (!rawModel) return "";
  return rawModel
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "")
    .replace(/[–—]/g, "-");
}

/**
 * Computes a stable, deterministic identity key for a CCTV product.
 * Example: ("CP PLUS", "CP-UNC-DA24L2-V3") -> "cpplus|cp-unc-da24l2-v3"
 */
export function computeProductIdentityKey(brand: string, model: string, variant?: string): string {
  const normBrand = (brand || "generic").toLowerCase().trim().replace(/[^a-z0-9]/g, "");
  const normModel = normalizeModelCode(model);
  const normVariant = variant ? normalizeModelCode(variant) : "";
  return normVariant ? `${normBrand}|${normModel}|${normVariant}` : `${normBrand}|${normModel}`;
}

/**
 * Computes an SHA-256 content hash of hardware specifications.
 * Crucially EXCLUDES pricing attributes to prevent false re-parsing on price updates.
 */
export function computeProductSpecHash(specs: {
  brand: string;
  model: string;
  category?: string;
  resolution_mp?: number;
  channels?: number;
  technologies?: string[];
  features?: string[];
}): string {
  const payload = JSON.stringify({
    b: specs.brand?.toLowerCase().trim(),
    m: normalizeModelCode(specs.model),
    c: specs.category?.toLowerCase().trim(),
    r: specs.resolution_mp ?? null,
    ch: specs.channels ?? null,
    t: (specs.technologies || []).map(t => t.toLowerCase()).sort(),
    f: (specs.features || []).map(f => f.toLowerCase()).sort(),
  });
  return crypto.createHash("sha256").update(payload).digest("hex");
}

/**
 * Evaluates whether an incoming catalog product is an identical existing item
 * with only pricing changes.
 */
export function isPriceOnlyCatalogUpdate(
  existingProduct: {
    brand?: string;
    model?: string;
    technical_name?: string;
    spec_hash?: string;
  },
  incomingProduct: {
    brand?: string;
    model?: string;
    technical_name?: string;
    spec_hash?: string;
  }
): boolean {
  const existingKey = computeProductIdentityKey(
    existingProduct.brand || "",
    existingProduct.model || existingProduct.technical_name || ""
  );
  const incomingKey = computeProductIdentityKey(
    incomingProduct.brand || "",
    incomingProduct.model || incomingProduct.technical_name || ""
  );

  if (existingKey !== incomingKey) return false;

  // If both have spec hashes, verify specs have not drifted
  if (existingProduct.spec_hash && incomingProduct.spec_hash) {
    return existingProduct.spec_hash === incomingProduct.spec_hash;
  }

  // Same identity key confirmed
  return true;
}
