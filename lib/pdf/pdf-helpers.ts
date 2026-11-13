import type { LocaleCode } from "@/lib/i18n/mapping";
import { normalizePdfLocale } from "@/lib/pdf/pdf-fonts-indic";

/**
 * Strips internal pricing-engine camera location suffixes such as `(outdoor)`, `(-indoor)`,
 * `(- indoor)`, or `(indoor)` while keeping meaningful hardware badges and prefixes intact.
 */
export function cleanPdfItemName(name: unknown): string {
  const raw = String(name ?? "").trim();
  if (!raw) return "";
  return raw
    .replace(/\s*\(\s*-?\s*(?:outdoor|indoor)\s*\)/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Joins and deduplicates address tokens so fields like `area="Jothwara"` + `city="Jothwara"`
 * render cleanly as `"Jothwara, 302012"` instead of `"Jothwara, Jothwara 302012"`.
 * Filters out placeholder strings like `"address pending"` or `"pending"`.
 */
export function dedupeAddressText(raw: unknown): string {
  const str = String(raw ?? "").trim();
  if (!str) return "";
  const lower = str.toLowerCase();
  if (lower === "pending" || lower.includes("address pending") || lower === "n/a") {
    return "";
  }

  const rawChunks = str
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const seenWords = new Set<string>();
  const cleanedChunks: string[] = [];

  for (const chunk of rawChunks) {
    // Handle inline repeats like "Jothwara - Jothwara 302012" or "Jothwara 302012"
    const normalized = chunk.replace(/\s+/g, " ").trim();
    const key = normalized.toLowerCase();
    if (!normalized || seenWords.has(key)) continue;

    // Also avoid repeating the city token at the start of the next chunk (e.g. "Jothwara, Jothwara 302012")
    let adjusted = normalized;
    const prevChunk = cleanedChunks[cleanedChunks.length - 1];
    if (prevChunk) {
      const prevLow = prevChunk.toLowerCase().replace(/\s*-\s*\d{6}$/, "").trim();
      if (prevLow && key.startsWith(prevLow + " ")) {
        adjusted = normalized.slice(prevLow.length).replace(/^[\s,-]+/, "").trim();
      } else if (prevLow && key.startsWith(prevLow + " -")) {
        adjusted = normalized.slice(prevLow.length).replace(/^[\s,-]+/, "").trim();
      }
    }

    if (!adjusted) continue;
    const adjKey = adjusted.toLowerCase();
    if (seenWords.has(adjKey)) continue;

    // Collapse trailing/orphan hyphens (e.g. ", - 302012")
    adjusted = adjusted.replace(/^-\s*/, "").replace(/\s*-\s*$/, "").trim();
    if (!adjusted) continue;

    seenWords.add(key);
    seenWords.add(adjKey);
    cleanedChunks.push(adjusted);
  }

  return cleanedChunks.join(", ").replace(/\s*,\s*-\s*/g, " - ");
}

export function formatCleanAddress(...parts: Array<unknown>): string {
  const tokens: string[] = [];
  for (const p of parts) {
    const s = String(p ?? "").trim();
    if (!s) continue;
    const low = s.toLowerCase();
    if (low === "pending" || low.includes("address pending") || low === "n/a") continue;
    tokens.push(s);
  }
  if (tokens.length === 0) return "";
  return dedupeAddressText(tokens.join(", "));
}

/**
 * Formats Quotation or Tax Invoice reference IDs cleanly without double-prefixing
 * (prevents bugs like `INV-2026-QT-202`).
 */
export function formatDocNumber(rawId: unknown, kind: "quote" | "invoice", dateFallback?: unknown): string {
  const s = String(rawId ?? "").trim();
  if (!s) {
    const yr = parsePdfYear(dateFallback);
    return kind === "invoice" ? `INV-${yr}-000000` : `QT-${yr}-DRAFT`;
  }
  const upper = s.toUpperCase();
  if (kind === "invoice") {
    if (/^(INV|CO)[-_]/.test(upper)) return upper;
    const stripped = upper.replace(/^QT[-_]/, "");
    const suffix = stripped.length > 12 ? stripped.slice(-8) : stripped;
    const yr = parsePdfYear(dateFallback);
    return `INV-${yr}-${suffix}`;
  }
  if (/^(QT|QUO)[-_]/.test(upper)) return upper;
  return s.length > 14 ? upper.slice(0, 10) : s;
}

function parsePdfYear(rawDate?: unknown): number {
  const d = parsePdfDate(rawDate);
  return d ? d.getFullYear() : new Date().getFullYear();
}

/**
 * Parses ISO strings, epoch numbers, Date instances, and Firestore serialized
 * `{ toDate() }` or `{ _seconds, _nanoseconds }` / `{ seconds }` objects.
 */
export function parsePdfDate(dateVal: unknown): Date | null {
  if (!dateVal) return null;
  try {
    if (dateVal instanceof Date) {
      return Number.isNaN(dateVal.getTime()) ? null : dateVal;
    }
    if (typeof dateVal === "object") {
      const obj = dateVal as Record<string, any>;
      if (typeof obj.toDate === "function") {
        const d = obj.toDate();
        return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
      }
      const secs = obj._seconds ?? obj.seconds;
      if (typeof secs === "number" && Number.isFinite(secs)) {
        const d = new Date(secs * 1000);
        return Number.isNaN(d.getTime()) ? null : d;
      }
    }
    if (typeof dateVal === "number" && Number.isFinite(dateVal)) {
      const d = new Date(dateVal > 1e12 ? dateVal : dateVal * 1000);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (typeof dateVal === "string" && dateVal.trim()) {
      const d = new Date(dateVal);
      return Number.isNaN(d.getTime()) ? null : d;
    }
  } catch {
    return null;
  }
  return null;
}

export function formatPdfDate(
  dateVal: unknown,
  dateLocale = "en-IN",
  monthFormat: "short" | "long" = "short"
): string {
  const d = parsePdfDate(dateVal);
  if (!d) return "N/A";
  return d.toLocaleDateString(dateLocale, {
    day: "2-digit",
    month: monthFormat,
    year: "numeric",
  });
}

const INDIAN_STATE_GST_CODES: Record<string, string> = {
  "jammu and kashmir": "01",
  "jammu & kashmir": "01",
  "himachal pradesh": "02",
  punjab: "03",
  chandigarh: "04",
  uttarakhand: "05",
  haryana: "06",
  delhi: "07",
  "new delhi": "07",
  rajasthan: "08",
  "uttar pradesh": "09",
  bihar: "10",
  sikkim: "11",
  "arunachal pradesh": "12",
  nagaland: "13",
  manipur: "14",
  mizoram: "15",
  tripura: "16",
  meghalaya: "17",
  assam: "18",
  "west bengal": "19",
  jharkhand: "20",
  odisha: "21",
  orissa: "21",
  chhattisgarh: "22",
  "madhya pradesh": "23",
  gujarat: "24",
  "daman and diu": "25",
  "dadra and nagar haveli": "26",
  "dadra and nagar haveli and daman and diu": "26",
  maharashtra: "27",
  "andhra pradesh": "37",
  karnataka: "29",
  goa: "30",
  lakshadweep: "31",
  kerala: "32",
  "tamil nadu": "33",
  puducherry: "34",
  pondicherry: "34",
  "andaman and nicobar islands": "35",
  telangana: "36",
  ladakh: "38",
};

/**
 * Resolves the 2-digit Indian GST State Code from GSTIN, explicit numeric code,
 * or full state name, falling back to `fallbackCode` only if genuinely unknown.
 */
export function getIndianStateCode(
  stateNameOrCode?: unknown,
  gstin?: unknown,
  fallbackCode = "08"
): string {
  const g = String(gstin ?? "").trim();
  if (/^\d{2}[A-Z0-9]{13}$/i.test(g) || /^\d{2}/.test(g)) {
    const code = g.slice(0, 2);
    if (/^\d{2}$/.test(code)) return code;
  }
  const raw = String(stateNameOrCode ?? "").trim();
  if (/^\d{2}$/.test(raw)) return raw;
  if (raw) {
    const mapped = INDIAN_STATE_GST_CODES[raw.toLowerCase()];
    if (mapped) return mapped;
  }
  return fallbackCode;
}

export interface GstBreakupResult {
  grossSubtotal: number;
  discountAmount: number;
  netTaxable: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  totalPayable: number;
}

/**
 * Computes strictly consistent Ex-Tax -> Discount -> CGST/SGST -> Total Payable math
 * where `netTaxable + cgstAmount + sgstAmount === totalPayable` (or `rawTotal - discount`
 * if a post-tax SmartPay/referral discount is applied). Zero ₹1 rounding mismatches.
 */
export function calculateGstBreakup(params: {
  itemsSubtotalExTax: number;
  discountAmount?: number;
  gstPercent?: number;
  storedTotalPayable?: number;
  storedNetTaxable?: number;
  storedGstAmount?: number;
  discountIsPostTax?: boolean;
}): GstBreakupResult {
  const gstPct = Number(params.gstPercent || 18);
  const itemsSub = Math.max(0, Math.round(Number(params.itemsSubtotalExTax || 0)));
  const disc = Math.max(0, Math.round(Number(params.discountAmount || 0)));

  if (disc > 0 && params.discountIsPostTax) {
    // Post-tax discount (e.g. 2% SmartPay / Cashback on final invoice total):
    // Keep pre-discount Taxable + GST intact, then show Pre-Discount Total - Discount = Final Payable
    const baseTaxable =
      params.storedNetTaxable && params.storedNetTaxable > 0
        ? Math.round(params.storedNetTaxable)
        : itemsSub;
    const rawTotal =
      params.storedTotalPayable && params.storedTotalPayable > 0
        ? Math.round(params.storedTotalPayable)
        : Math.round(baseTaxable * (1 + gstPct / 100));
    const gstAmt = Math.max(0, rawTotal - baseTaxable);
    const cgst = Math.round((gstAmt / 2) * 100) / 100;
    const sgst = Math.round((gstAmt - cgst) * 100) / 100;
    const finalPayable = Math.max(0, rawTotal - disc);
    return {
      grossSubtotal: itemsSub || baseTaxable,
      discountAmount: disc,
      netTaxable: baseTaxable,
      gstAmount: gstAmt,
      cgstAmount: cgst,
      sgstAmount: sgst,
      totalPayable: finalPayable,
    };
  }

  // Standard pre-tax calculation (or discount-free quote)
  const netTaxable =
    params.storedNetTaxable && params.storedNetTaxable > 0 && disc === 0
      ? Math.round(params.storedNetTaxable)
      : Math.max(0, itemsSub - disc);

  const computedTotal = Math.round(netTaxable * (1 + gstPct / 100));
  const finalPayable =
    params.storedTotalPayable && params.storedTotalPayable > 0 && disc === 0
      ? Math.round(params.storedTotalPayable)
      : computedTotal;

  // Derive gstAmount so `netTaxable + gstAmount === finalPayable` to ₹0.00!
  const gstAmt = Math.max(0, finalPayable - netTaxable);
  const cgst = Math.round((gstAmt / 2) * 100) / 100;
  const sgst = Math.round((gstAmt - cgst) * 100) / 100;

  return {
    grossSubtotal: itemsSub || netTaxable,
    discountAmount: disc,
    netTaxable,
    gstAmount: gstAmt,
    cgstAmount: cgst,
    sgstAmount: sgst,
    totalPayable: finalPayable,
  };
}

/**
 * Formats INR values cleanly. Only displays `.50` paise when needed (e.g., odd GST split)
 * so printed Tax Invoice totals add up visibly to the exact rupee.
 */
export function formatPdfINR(value: number): string {
  const num = Number(value || 0);
  const hasFractional = Math.abs(num - Math.round(num)) >= 0.005;
  return (
    "₹" +
    num.toLocaleString("en-IN", {
      minimumFractionDigits: hasFractional ? 2 : 0,
      maximumFractionDigits: hasFractional ? 2 : 0,
    })
  );
}

const PROPERTY_LABELS: Record<string, { en: string; hi: string }> = {
  home: { en: "Home / Residence", hi: "घर / फ्लैट (Home)" },
  house: { en: "Independent House / Villa", hi: "मकान / कोठी (House)" },
  villa: { en: "Villa / Bungalow", hi: "विला / बंगला (Villa)" },
  flat: { en: "Apartment / Flat", hi: "फ्लैट / अपार्टमेंट (Flat)" },
  residential: { en: "Residential Property", hi: "निवासी घर (Residential)" },
  shop: { en: "Shop / Showroom", hi: "दुकान / शोरूम (Shop)" },
  office: { en: "Office / Workplace", hi: "ऑफिस / दफ्तर (Office)" },
  commercial: { en: "Commercial Premises", hi: "कमर्शियल परिसर (Commercial)" },
  warehouse: { en: "Godown / Warehouse", hi: "गोदाम / वेयरहाउस (Warehouse)" },
  factory: { en: "Factory / Industrial", hi: "फैक्ट्री / कारखाना (Factory)" },
  school: { en: "School / Institute", hi: "स्कूल / संस्थान (School)" },
  hospital: { en: "Clinic / Hospital", hi: "क्लिनिक / अस्पताल (Hospital)" },
  farm: { en: "Farmhouse / Open Plot", hi: "फार्महाउस / प्लॉट (Farm)" },
};

export function localizePropertyType(rawType: unknown, locale?: unknown): string {
  const s = String(rawType ?? "").trim();
  if (!s) return normalizePdfLocale(locale) === "hi" ? "निवासी / कमर्शियल साइट" : "Installation Site";
  const low = s.toLowerCase();
  const entry = PROPERTY_LABELS[low];
  const loc: LocaleCode = normalizePdfLocale(locale);
  if (entry) {
    return loc === "hi" ? entry.hi : entry.en;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export interface MilestoneBalanceResult {
  amountDue: number;
  dueOnDelivery90: number;
  dueOnInstall10: number;
  isDeliveryPaid: boolean;
}

/**
 * Splits remaining invoice balance accurately across Delivery (90%) and Handover (10%)
 * or marks 100% of remaining balance under Handover when Delivery stage is already paid.
 */
export function computeRemainingMilestones(params: {
  totalPayable: number;
  amountPaid: number;
  paymentStatus?: string;
  explicitAmountDue?: number;
  hasDeliveryPayment?: boolean;
}): MilestoneBalanceResult {
  const total = Math.max(0, Math.round(params.totalPayable));
  const paid = Math.max(0, Math.round(params.amountPaid));
  const status = String(params.paymentStatus || "").toLowerCase();
  const isDeliveryPaid = Boolean(params.hasDeliveryPayment) || status === "delivery_paid";

  const remaining =
    typeof params.explicitAmountDue === "number" &&
    params.explicitAmountDue >= 0 &&
    params.explicitAmountDue <= total &&
    Math.abs((total - paid) - params.explicitAmountDue) <= 1
      ? Math.round(params.explicitAmountDue)
      : Math.max(0, total - paid);

  if (remaining <= 0) {
    return { amountDue: 0, dueOnDelivery90: 0, dueOnInstall10: 0, isDeliveryPaid };
  }
  if (isDeliveryPaid) {
    return { amountDue: remaining, dueOnDelivery90: 0, dueOnInstall10: remaining, isDeliveryPaid: true };
  }
  const delivery90 = Math.round(remaining * 0.9);
  const install10 = Math.max(0, remaining - delivery90);
  return {
    amountDue: remaining,
    dueOnDelivery90: delivery90,
    dueOnInstall10: install10,
    isDeliveryPaid: false,
  };
}
