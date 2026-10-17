/**
 * @file lib/brand-utils.ts
 * @description Centralized Canonical Brand Normalization and Utilities.
 * Guarantees zero duplicate brand tabs, casing-mismatched filters, or disparate
 * brand names (e.g. "CP PLUS" vs "CP Plus") across all quotation variants, builders, and reviews.
 */

// Canonical Brand Display Names dictionary
const CANONICAL_BRAND_NAMES: Record<string, string> = {
  "cpplus": "CP Plus",
  "cp plus": "CP Plus",
  "cp-plus": "CP Plus",
  "cp": "CP Plus",
  "budget": "Budget Brand",
  "budget brand": "Budget Brand",
  "generic": "Budget Brand",
  "oem": "Budget Brand",
  "local": "Budget Brand",
  "hikvision": "Hikvision",
  "hik": "Hikvision",
  "dahua": "Dahua",
  "dah": "Dahua",
  "prama": "Prama",
  "trueview": "Trueview",
  "secureye": "Secureye",
  "godrej": "Godrej",
  "realtime": "Realtime",
  "seagate": "Seagate",
  "wd": "WD",
  "western digital": "WD",
  "sandisk": "SanDisk",
  "d-link": "D-Link",
  "dlink": "D-Link",
  "tp-link": "TP-Link",
  "tplink": "TP-Link",
  "erd": "ERD",
  "honeywell": "Honeywell",
  "bosch": "Bosch",
  "axis": "Axis",
  "panasonic": "Panasonic",
  "sony": "Sony",
  "ezviz": "EZVIZ",
  "imou": "Imou",
  "uniview": "Uniview",
  "unv": "Uniview",
};

/**
 * Returns a normalized string key for brand comparison (lowercase, trimmed, alphanumeric only).
 * Maps common aliases (e.g. "cp plus", "CP PLUS", "cp-plus" -> "cpplus").
 */
export function getCanonicalBrandKey(brand?: string | null): string {
  if (!brand) return "";
  const cleaned = brand.toLowerCase().trim();
  
  if (cleaned === "all" || cleaned === "all brands" || cleaned === "all_brands" || cleaned === "any") {
    return "all";
  }
  if (cleaned.includes("cp plus") || cleaned.includes("cp-plus") || cleaned === "cp" || cleaned === "cpplus") {
    return "cpplus";
  }
  if (cleaned.includes("budget") || cleaned.includes("generic") || cleaned.includes("local") || cleaned.includes("oem")) {
    return "budget";
  }
  if (cleaned.includes("hikvision") || cleaned === "hik") {
    return "hikvision";
  }
  if (cleaned.includes("dahua") || cleaned === "dah") {
    return "dahua";
  }
  if (cleaned.includes("prama")) {
    return "prama";
  }
  if (cleaned.includes("trueview")) {
    return "trueview";
  }
  if (cleaned.includes("secureye")) {
    return "secureye";
  }
  if (cleaned.includes("western digital") || cleaned === "wd" || cleaned.startsWith("wd-") || cleaned.startsWith("wd ")) {
    return "wd";
  }
  if (cleaned.includes("seagate")) {
    return "seagate";
  }
  if (cleaned.includes("sandisk")) {
    return "sandisk";
  }
  if (cleaned.includes("d-link") || cleaned.includes("dlink")) {
    return "dlink";
  }
  if (cleaned.includes("tp-link") || cleaned.includes("tplink")) {
    return "tplink";
  }
  if (cleaned.includes("ezviz")) {
    return "ezviz";
  }
  if (cleaned.includes("imou")) {
    return "imou";
  }

  // Fallback: strip spaces and punctuation
  return cleaned.replace(/[^a-z0-9]/g, "");
}

/**
 * Converts any brand name into its standard, beautifully formatted canonical display name.
 * e.g. "CP PLUS" -> "CP Plus", "cpplus" -> "CP Plus", "hikvision" -> "Hikvision"
 */
export function getCanonicalBrandName(brand?: string | null): string {
  if (!brand) return "";
  const trimmed = brand.trim();
  if (!trimmed) return "";

  const key = getCanonicalBrandKey(trimmed);
  if (CANONICAL_BRAND_NAMES[key]) {
    return CANONICAL_BRAND_NAMES[key];
  }

  // Check direct lookup for original trimmed lowercase
  const lower = trimmed.toLowerCase();
  if (CANONICAL_BRAND_NAMES[lower]) {
    return CANONICAL_BRAND_NAMES[lower];
  }

  // If unknown, convert to standard Title Case (e.g. "my brand" -> "My Brand")
  return trimmed
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Safely infers a brand from a product name/SKU if brand field is missing or generic.
 */
export function inferBrandFromName(name?: string | null): string | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  if (lower.includes("cp plus") || lower.includes("cpplus") || /\bcp\b/i.test(name)) return "CP Plus";
  if (lower.includes("hikvision") || /\bhik\b/i.test(name)) return "Hikvision";
  if (lower.includes("dahua")) return "Dahua";
  if (lower.includes("prama")) return "Prama";
  if (lower.includes("trueview")) return "Trueview";
  if (lower.includes("secureye")) return "Secureye";
  if (lower.includes("seagate")) return "Seagate";
  if (lower.includes("sandisk")) return "SanDisk";
  if (lower.includes("wd purple") || lower.includes("western digital") || /\bwd\b/i.test(name)) return "WD";
  if (lower.includes("d-link") || lower.includes("dlink")) return "D-Link";
  if (lower.includes("tp-link") || lower.includes("tplink")) return "TP-Link";
  return null;
}

/**
 * Tests whether a product matches a requested brand filter.
 * Case-insensitive, punctuation-tolerant, and handles brand aliases.
 */
export function isBrandMatch(
  p: { brand?: string | null; display_name?: string; technical_name?: string },
  brandFilter?: string | null
): boolean {
  if (!brandFilter) return true;
  const filterKey = getCanonicalBrandKey(brandFilter);
  if (!filterKey || filterKey === "all" || filterKey === "allbrands") return true;

  // If filter is "budget", match budget brand products
  if (filterKey === "budget") {
    if (p.brand && getCanonicalBrandKey(p.brand) === "budget") return true;
    const name = `${p.display_name || ""} ${p.technical_name || ""}`.toLowerCase();
    return name.includes("budget") || name.includes("generic");
  }

  // Check explicit brand
  if (p.brand) {
    const productBrandKey = getCanonicalBrandKey(p.brand);
    if (productBrandKey === filterKey) return true;
  }

  // Check inferred brand from product name
  const inferred = inferBrandFromName(`${p.display_name || ""} ${p.technical_name || ""}`);
  if (inferred) {
    if (getCanonicalBrandKey(inferred) === filterKey) return true;
  }

  // Fallback substring checks
  const filterLower = brandFilter.toLowerCase().trim();
  if (p.brand && p.brand.toLowerCase().includes(filterLower)) return true;
  if (p.display_name && p.display_name.toLowerCase().includes(filterLower)) return true;

  return false;
}

/**
 * Extracts a unique, case-insensitively deduplicated list of canonical brand names
 * from a collection of products.
 * Guarantees zero duplicate tabs like ["CP PLUS", "CP Plus"].
 */
export function getUniqueCanonicalBrands(
  products: Array<{ brand?: string | null; display_name?: string; category?: string; is_active?: boolean }>,
  categoryFilter?: string | string[]
): string[] {
  const allowedCategories = categoryFilter 
    ? (Array.isArray(categoryFilter) ? categoryFilter : [categoryFilter])
    : null;

  const brandKeyToNameMap = new Map<string, string>();

  products.forEach(p => {
    // If active flag is explicitly false, skip
    if (p.is_active === false) return;

    // Filter by category if specified
    if (allowedCategories && p.category && !allowedCategories.includes(p.category)) {
      return;
    }

    const rawBrand = p.brand || inferBrandFromName(p.display_name);
    if (!rawBrand) return;

    const brandKey = getCanonicalBrandKey(rawBrand);
    if (!brandKey || brandKey === "all") return;

    if (!brandKeyToNameMap.has(brandKey)) {
      brandKeyToNameMap.set(brandKey, getCanonicalBrandName(rawBrand));
    }
  });

  // Sort canonical brand names alphabetically, placing "Budget Brand" first if desired, or standard alphabetical
  return Array.from(brandKeyToNameMap.values()).sort((a, b) => {
    if (a === "Budget Brand") return -1;
    if (b === "Budget Brand") return 1;
    return a.localeCompare(b);
  });
}
