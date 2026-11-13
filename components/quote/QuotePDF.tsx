/**
 * TEAM CCTV — Quote PDF Document
 * File: components/quote/QuotePDF.tsx
 *
 * Compact single-page executive quotation layout:
 *  - Deep navy header with clean white logo pill & gold quote number
 *  - Hardware-derived package banner (AGENTS.md compliant — zero 3-tier labels)
 *  - Non-redundant Bill To + Installation Site strip
 *  - Clean BOM table with centered Qty pills and adaptive row density (fits 1 page)
 *  - Side-by-side Important Note/Milestones & exact GST breakup (₹0.00 discrepancy)
 *  - Pinned bottom footer with dynamic page numbers
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
  Image,
} from "@react-pdf/renderer";

import { FONT_REGULAR, FONT_SEMIBOLD, FONT_BOLD } from "@/lib/pdf-fonts";
import { ensurePdfFontsForLocale, normalizePdfLocale } from "@/lib/pdf/pdf-fonts-indic";
import { resolvePdfImageSrc } from "@/lib/pdf/pdf-image";
import {
  formatHardwarePackageTitle,
  getPdfLabels,
  getQuoteValidityNote,
} from "@/lib/pdf/pdf-i18n";
import {
  calculateGstBreakup,
  cleanPdfItemName,
  dedupeAddressText,
  formatDocNumber,
  formatPdfDate,
  formatPdfINR,
  getIndianStateCode,
  localizePropertyType,
} from "@/lib/pdf/pdf-helpers";
import { SPEECH_LOCALE_MAP } from "@/lib/i18n/mapping";

// ─── Font Registration ────────────────────────────────────────────────────────
Font.register({
  family: "DM Sans",
  fonts: [
    { src: FONT_REGULAR, fontWeight: 400 },
    { src: FONT_SEMIBOLD, fontWeight: 500 },
    { src: FONT_BOLD, fontWeight: 700 },
  ],
});

Font.register({
  family: "Playfair Display",
  fonts: [
    { src: FONT_SEMIBOLD, fontWeight: 600 },
    { src: FONT_BOLD, fontWeight: 700 },
  ],
});

// ─── Types ────────────────────────────────────────────────────────────────────
export interface LineItem {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  badge?: { label: string; color?: string };
  quantity: number;
  unitPrice: number;
}

export interface QuoteData {
  id: string;
  leadId?: string;
  quoteNumber: string;
  status: string;
  issuedAt: any;
  validUntil: any;
  customer: { name: string; phone: string; email?: string };
  installationAddress: string;
  propertyType: string;
  propertyDetail?: string;
  siteVisitDate?: string;
  lineItems: LineItem[];
  gstPercent: number;
  advancePercent: number;
  companyGstin: string;
  discountAmount?: number;
  discountIsPostTax?: boolean;
  storedTotalPayable?: number;
  storedNetTaxable?: number;
  storedGstAmount?: number;
  packageTitle?: string;
  billing_details?: {
    is_business?: boolean;
    company_name?: string;
    gstin?: string;
    customer_name?: string;
    phone?: string;
    email?: string;
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    state_code?: string;
    pincode?: string;
  };
  requirementSnapshot?: Record<string, any>;
  pricingSnapshot?: Record<string, any>;
  version?: number;
  isRevision?: boolean;
  revisionNotes?: string;
  notes?: string;
  preferred_language?: string;
  language?: string;
  locale?: string;
}

// ─── Colour tokens ───────────────────────────────────────────────────────────
const C = {
  navy: "#0F1F3D",
  gold: "#C8922A",
  goldBg: "#F5E6C8",
  cream: "#FAFAF7",
  white: "#FFFFFF",
  text: "#1C1C28",
  muted: "#64748B",
  border: "#E2E8F0",
  greenBg: "#E8F5F0",
  green: "#0A7A5A",
  navyBg: "#E8EDF5",
  noteBg: "#F5F9FF",
  noteBdr: "#CFE0F5",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "DM Sans",
    backgroundColor: C.cream,
    paddingTop: 0,
    paddingBottom: 32,
    paddingHorizontal: 0,
    fontSize: 9,
    color: C.text,
  },

  // ── Header
  header: {
    backgroundColor: C.navy,
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 26,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  brandPill: {
    backgroundColor: C.white,
    borderRadius: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
  },
  brandLogoHorizontal: {
    height: 22,
    objectFit: "contain",
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  brandIconBox: {
    width: 30,
    height: 30,
    backgroundColor: C.white,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  brandIconImage: {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  },
  brandName: {
    color: C.white,
    fontSize: 13.5,
    fontWeight: 700,
  },
  brandTagline: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 6.8,
    fontWeight: 400,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 1,
  },
  quoteLabel: { alignItems: "flex-end" },
  quoteLabelText: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  quoteNumber: {
    color: C.gold,
    fontSize: 14,
    fontWeight: 700,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  headerDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.14)",
    marginBottom: 6,
  },
  headerMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  metaCell: { flex: 1 },
  metaLabel: {
    color: "rgba(255,255,255,0.52)",
    fontSize: 6.5,
    fontWeight: 700,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 1.5,
  },
  metaValue: {
    color: "rgba(255,255,255,0.94)",
    fontSize: 8.5,
    fontWeight: 400,
  },

  // ── Package Specification Banner
  packageBar: {
    backgroundColor: "#EEF2F8",
    borderBottomWidth: 0.5,
    borderBottomColor: "#D6E0EE",
    borderLeftWidth: 3,
    borderLeftColor: C.gold,
    paddingVertical: 4.5,
    paddingHorizontal: 26,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  packageTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: C.navy,
  },
  packageBadge: {
    fontSize: 6.8,
    fontWeight: 700,
    color: C.green,
    backgroundColor: C.greenBg,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },

  // ── Body
  body: {
    paddingHorizontal: 26,
    paddingTop: 9,
  },

  // ── Compact Customer + Site Strip
  billCard: {
    flexDirection: "row",
    gap: 14,
    backgroundColor: "#F6F6F2",
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 5,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  billLeft: { flex: 1.25 },
  billRight: {
    flex: 0.95,
    borderLeftWidth: 0.5,
    borderLeftColor: C.border,
    paddingLeft: 12,
  },
  billLabel: {
    fontSize: 6.5,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: C.muted,
    marginBottom: 2,
  },
  billName: {
    fontSize: 9.5,
    fontWeight: 700,
    color: C.text,
    marginBottom: 1.5,
  },
  billDetail: {
    fontSize: 7.5,
    color: "#475569",
    lineHeight: 1.35,
  },

  // ── Table
  sectionLabel: {
    fontSize: 6.8,
    fontWeight: 700,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    color: C.muted,
    marginBottom: 4,
  },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1.2,
    borderBottomColor: C.navy,
    backgroundColor: "#F1F3F6",
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  th: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: C.navy,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingHorizontal: 6,
  },
  colDesc: { flex: 5.1, paddingRight: 10 },
  colQty: { flex: 0.9, alignItems: "center", justifyContent: "center", textAlign: "center" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colAmt: { flex: 1.7, textAlign: "right" },

  itemName: { fontSize: 8.2, fontWeight: 700, color: C.text, lineHeight: 1.25 },
  itemDesc: { fontSize: 6.8, color: C.muted, lineHeight: 1.25, marginTop: 1 },
  badge: {
    fontSize: 6,
    fontWeight: 700,
    color: C.white,
    backgroundColor: C.navy,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2.5,
    alignSelf: "flex-start",
    marginTop: 1.5,
  },
  qtyBox: {
    minWidth: 22,
    paddingHorizontal: 5,
    height: 15,
    backgroundColor: "#ECECE6",
    borderRadius: 3.5,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: { fontSize: 7.8, fontWeight: 700, color: C.text },

  // ── 2-Column Bottom Summary (Notes left + Totals right)
  bottomGrid: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    alignItems: "flex-start",
  },
  bottomLeft: { flex: 1.28 },
  bottomRight: { flex: 0.92 },

  noteBox: {
    backgroundColor: C.noteBg,
    borderLeftWidth: 2.5,
    borderLeftColor: C.navy,
    borderWidth: 0.5,
    borderColor: C.noteBdr,
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  noteTitle: {
    fontSize: 6.8,
    fontWeight: 700,
    color: C.navy,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  noteBody: { fontSize: 7, color: "#2C3E6B", lineHeight: 1.35 },

  milestoneBar: {
    marginTop: 5,
    backgroundColor: "#F6F6F2",
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 4,
    paddingVertical: 4.5,
    paddingHorizontal: 8,
  },
  milestoneTitle: {
    fontSize: 6.5,
    fontWeight: 700,
    color: C.muted,
    textTransform: "uppercase",
    marginBottom: 1.5,
  },
  milestoneRow: {
    fontSize: 6.8,
    color: C.text,
    lineHeight: 1.3,
  },

  bankBox: {
    marginTop: 5,
    backgroundColor: "#F0F6F2",
    borderLeftWidth: 2.5,
    borderLeftColor: C.green,
    borderWidth: 0.5,
    borderColor: "#CBE4D5",
    borderRadius: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
  },
  bankTitle: {
    fontSize: 6.8,
    fontWeight: 700,
    color: C.green,
    textTransform: "uppercase",
    marginBottom: 1.5,
  },

  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3.2,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  totalLabel: { fontSize: 7.8, color: C.muted },
  totalValue: { fontSize: 7.8, color: C.text, fontWeight: 500 },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.navy,
    borderRadius: 5,
    paddingVertical: 6.5,
    paddingHorizontal: 10,
    marginTop: 4,
    gap: 8,
  },
  grandLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: "rgba(255,255,255,0.8)",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  grandValue: {
    fontSize: 12,
    fontWeight: 700,
    color: C.gold,
  },

  // ── Compact Trust Strip
  termsGrid: {
    flexDirection: "row",
    gap: 7,
    marginTop: 7,
  },
  termCard: {
    flex: 1,
    backgroundColor: "#F6F6F2",
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 4,
    paddingVertical: 5.5,
    paddingHorizontal: 7,
    flexDirection: "row",
    gap: 5.5,
    alignItems: "flex-start",
  },
  termIcon: {
    width: 17,
    height: 17,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  termTitle: { fontSize: 7.3, fontWeight: 700, color: C.text, marginBottom: 1 },
  termBody: { fontSize: 6.4, color: C.muted, lineHeight: 1.3 },

  // ── Compact Signatory Strip
  signatureStrip: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 8,
    paddingTop: 5,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
  },
  sigNote: { fontSize: 6.6, color: C.muted },
  sigLabel: { fontSize: 6.8, fontWeight: 700, color: C.text },

  // ── Pinned Footer (always anchored at bottom of page, never mid-page)
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    backgroundColor: "#F2F3F5",
    paddingHorizontal: 26,
    paddingVertical: 7,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: { fontSize: 7, color: C.muted },
  footerBrand: { fontWeight: 700, color: C.text },
  footerRight: { flexDirection: "row", gap: 10, alignItems: "center" },
  footerContact: { fontSize: 7, color: C.muted },
  pageNum: { fontSize: 7, fontWeight: 700, color: C.navy },
});

// ─── Component ────────────────────────────────────────────────────────────────
export function QuotePDF({
  quote,
  settings,
  isInvoice,
  locale,
}: {
  quote: QuoteData;
  settings?: any;
  isInvoice?: boolean;
  locale?: string;
}) {
  const pdfLocale = normalizePdfLocale(
    locale ?? quote?.preferred_language ?? quote?.language ?? quote?.locale
  );
  const pdfFont = ensurePdfFontsForLocale(pdfLocale);
  const isEn = pdfLocale === "en";
  const noUpper = isEn ? {} : { textTransform: "none" as const, letterSpacing: 0 };
  const L = getPdfLabels(pdfLocale);
  const dateLocale = SPEECH_LOCALE_MAP[pdfLocale] || "en-IN";

  const companyName = settings?.company_legal_name || settings?.company_name || "TEAM CCTV";
  const tagline = settings?.company_tagline || L.companyTagline;
  const rawGstin = (settings?.company_gstin || quote.companyGstin || "").trim();
  const gstinDisplay = rawGstin ? `${L.gstinPrefix}: ${rawGstin}` : L.gstPending;
  const emailDisplay = settings?.company_email || "sales@teamcctv.com";
  const phoneDisplay = settings?.company_phone || "+91 98290 00000";
  const webDisplay = settings?.company_website || "cctvquotation.com";

  // Separate real positive items from any legacy negative discount lines
  const positiveItems = (quote.lineItems || []).filter((i) => i.unitPrice >= 0);
  const legacyNegDiscount = (quote.lineItems || [])
    .filter((i) => i.unitPrice < 0)
    .reduce((sum, i) => sum + Math.abs(i.quantity * i.unitPrice), 0);

  const itemsSubtotal = positiveItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const totalDiscount = Math.max(Number(quote.discountAmount || 0), legacyNegDiscount);

  const breakup = calculateGstBreakup({
    itemsSubtotalExTax: itemsSubtotal,
    discountAmount: totalDiscount,
    gstPercent: quote.gstPercent || 18,
    storedTotalPayable: quote.storedTotalPayable ?? (quote.pricingSnapshot as any)?.total_payable,
    storedNetTaxable: quote.storedNetTaxable ?? (quote.pricingSnapshot as any)?.net_taxable_amount,
    storedGstAmount: quote.storedGstAmount ?? (quote.pricingSnapshot as any)?.gst_amount,
    discountIsPostTax: quote.discountIsPostTax,
  });

  // Check Inter-State supply
  const sellerStateCode =
    settings?.company_state_code ||
    (rawGstin.length >= 2 ? rawGstin.substring(0, 2) : "08");
  const buyerStateCode = getIndianStateCode(
    quote.billing_details?.state_code || quote.billing_details?.state,
    quote.billing_details?.gstin,
    sellerStateCode
  );
  const isInterState = buyerStateCode !== sellerStateCode;

  const docTitle = isInvoice ? L.invoiceTitle : L.quotationTitle;
  const displayQuoteNo = formatDocNumber(quote.quoteNumber || quote.id, isInvoice ? "invoice" : "quote", quote.issuedAt);
  const refShort = formatDocNumber(quote.leadId || quote.id, "quote", quote.issuedAt);

  const cleanAddress = dedupeAddressText(quote.installationAddress);
  const localizedProp = localizePropertyType(quote.propertyType, pdfLocale);
  const resolvedPackageTitle =
    quote.packageTitle ||
    formatHardwarePackageTitle({
      ...quote,
      requirementSnapshot: quote.requirementSnapshot,
    });

  // Compact row spacing scales cleanly so 1-14 item quotes stay on 1 single page
  const itemCount = positiveItems.length;
  const rowPadV = itemCount > 11 ? 2.5 : itemCount > 8 ? 3.5 : 4.5;
  const rowFontSize = itemCount > 11 ? 7.6 : 8.2;

  const validityNote = getQuoteValidityNote(pdfLocale, settings?.quote_validity_days || 7);

  return (
    <Document
      title={`${companyName} — ${docTitle} #${displayQuoteNo}`}
      author={companyName}
      subject={`CCTV Installation ${docTitle}`}
    >
      <Page size="A4" style={[s.page, { fontFamily: pdfFont }]}>
        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerTop}>
            {(() => {
              const rawLogo =
                settings?.pdf_logo_url || settings?.company_logo_url || "/logo-horizontal.jpg";
              const logoUrl =
                rawLogo && !rawLogo.startsWith("C:") && !rawLogo.includes("\\")
                  ? rawLogo
                  : "/logo-horizontal.jpg";
              const resolvedLogo = resolvePdfImageSrc(rawLogo, "/logo-horizontal.jpg");
              const isHorizontal =
                logoUrl.includes("horizontal") || logoUrl.includes("banner");

              if (resolvedLogo && isHorizontal) {
                return (
                  <View style={s.brandPill}>
                    {/* eslint-disable-next-line jsx-a11y/alt-text */}
                    <Image src={resolvedLogo} style={s.brandLogoHorizontal} />
                  </View>
                );
              }
              const shieldIcon = resolvePdfImageSrc("/icon-192x192.png", "/logo-square.jpg") || resolvedLogo;
              return (
                <View style={s.brandRow}>
                  <View style={s.brandIconBox}>
                    {shieldIcon ? (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <Image src={shieldIcon} style={s.brandIconImage} />
                    ) : (
                      <Text style={{ color: C.navy, fontSize: 12, fontWeight: 700 }}>T</Text>
                    )}
                  </View>
                  <View>
                    <Text style={s.brandName}>{companyName}</Text>
                    <Text style={[s.brandTagline, noUpper]}>{tagline}</Text>
                  </View>
                </View>
              );
            })()}

            <View style={s.quoteLabel}>
              <Text style={[s.quoteLabelText, noUpper]}>{docTitle}</Text>
              <Text style={s.quoteNumber}>#{displayQuoteNo}</Text>
            </View>
          </View>

          <View style={s.headerDivider} />

          <View style={s.headerMeta}>
            {[
              [L.dateIssued, formatPdfDate(quote.issuedAt, dateLocale, "short")],
              [L.preparedFor, quote.customer?.name || L.valuedCustomer],
              [L.validUntil, formatPdfDate(quote.validUntil, dateLocale, "short")],
              [L.leadRef, `#${refShort}`],
            ].map(([label, value]) => (
              <View key={label} style={s.metaCell}>
                <Text style={[s.metaLabel, noUpper]}>{label}</Text>
                <Text style={s.metaValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── HARDWARE PACKAGE BANNER (Zero 3-Tier Labels) ────────────── */}
        {resolvedPackageTitle ? (
          <View style={s.packageBar}>
            <Text style={s.packageTitle}>{resolvedPackageTitle}</Text>
            <Text style={s.packageBadge}>{L.gstIncluded18}</Text>
          </View>
        ) : null}

        {/* ── BODY ────────────────────────────────────────────────────── */}
        <View style={s.body}>
          {/* Unified Customer & Installation Site Strip (no duplicate address box) */}
          <View style={s.billCard}>
            <View style={s.billLeft}>
              <Text style={[s.billLabel, noUpper]}>{L.billTo}</Text>
              <Text style={s.billName}>{quote.customer?.name || L.valuedCustomer}</Text>
              {quote.billing_details?.company_name ? (
                <Text style={[s.billDetail, { fontWeight: 700, color: C.text }]}>
                  {quote.billing_details.company_name}
                  {quote.billing_details.gstin ? ` · ${L.gstinPrefix}: ${quote.billing_details.gstin}` : ""}
                </Text>
              ) : null}
              <Text style={s.billDetail}>
                {[quote.customer?.phone, quote.customer?.email].filter(Boolean).join("  |  ")}
              </Text>
              {cleanAddress ? <Text style={s.billDetail}>{cleanAddress}</Text> : null}
            </View>

            <View style={s.billRight}>
              <Text style={[s.billLabel, noUpper]}>{L.installationSite}</Text>
              <Text style={s.billName}>{localizedProp}</Text>
              {quote.propertyDetail ? (
                <Text style={s.billDetail}>{quote.propertyDetail}</Text>
              ) : null}
              {quote.siteVisitDate ? (
                <Text style={s.billDetail}>
                  {L.siteVisit}: {formatPdfDate(quote.siteVisitDate, dateLocale, "short")}
                </Text>
              ) : null}
              {!cleanAddress && quote.billing_details?.city ? (
                <Text style={s.billDetail}>
                  {dedupeAddressText(
                    `${quote.billing_details.city} ${quote.billing_details.pincode || ""}`
                  )}
                </Text>
              ) : null}
            </View>
          </View>

          {/* BOM Table */}
          <Text style={[s.sectionLabel, noUpper]}>{L.scopeAndMaterials}</Text>
          <View style={s.tableHeader}>
            <Text style={[s.th, s.colDesc, noUpper]}>{L.itemDescription}</Text>
            <Text style={[s.th, s.colQty, noUpper]}>{L.qty}</Text>
            <Text style={[s.th, s.colPrice, noUpper]}>{L.unitPrice}</Text>
            <Text style={[s.th, s.colAmt, noUpper]}>{L.amount}</Text>
          </View>

          {positiveItems.map((item, idx) => {
            const amt = item.quantity * item.unitPrice;
            const cleanedName = cleanPdfItemName(item.name);
            const cleanDesc = cleanPdfItemName(item.description || "");
            return (
              <View
                key={`${item.id}-${idx}`}
                style={[
                  s.tableRow,
                  { paddingVertical: rowPadV },
                  idx % 2 === 1 ? { backgroundColor: "#F9F9F6" } : {},
                ]}
                wrap={false}
              >
                <View style={s.colDesc}>
                  <Text style={[s.itemName, { fontSize: rowFontSize }]}>{cleanedName}</Text>
                  {cleanDesc ? <Text style={s.itemDesc}>{cleanDesc}</Text> : null}
                </View>
                <View style={s.colQty}>
                  <View style={s.qtyBox}>
                    <Text style={s.qtyText}>{item.quantity}</Text>
                  </View>
                </View>
                <Text style={[s.colPrice, { fontSize: rowFontSize }]}>
                  {formatPdfINR(item.unitPrice)}
                </Text>
                <Text style={[s.colAmt, { fontSize: rowFontSize, fontWeight: 700 }]}>
                  {formatPdfINR(amt)}
                </Text>
              </View>
            );
          })}

          {/* ── Side-by-Side Bottom Block: Note/Milestones + Exact Totals ── */}
          <View style={s.bottomGrid} wrap={false}>
            <View style={s.bottomLeft}>
              <View style={s.noteBox}>
                <Text style={[s.noteTitle, noUpper]}>{L.importantNoteTitle}</Text>
                <Text style={s.noteBody}>
                  {L.gstInclusiveBadge}
                  {validityNote ? `\n${validityNote}` : ""}
                  {quote.revisionNotes ? `\n${quote.revisionNotes}` : ""}
                </Text>
              </View>

              <View style={s.milestoneBar}>
                <Text style={[s.milestoneTitle, noUpper]}>{L.paymentMilestones}</Text>
                <Text style={s.milestoneRow}>
                  1. {L.bookingAdvance500}: ₹500  ·  2. {L.deliveryPayment90}  ·  3. {L.finalPayment10}
                </Text>
              </View>

              {isInvoice && (settings?.bank_account_no || settings?.bank_details) ? (
                <View style={s.bankBox}>
                  <Text style={[s.bankTitle, noUpper]}>{L.bankDetailsTitle}</Text>
                  <Text style={s.noteBody}>
                    {settings?.bank_account_no
                      ? `${settings.bank_name || "Bank"} | A/c: ${settings.bank_account_no} | IFSC: ${settings.bank_ifsc || ""}${settings.bank_upi_id ? ` | UPI: ${settings.bank_upi_id}` : ""}`
                      : settings.bank_details}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={s.bottomRight}>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>{L.taxableValue}</Text>
                <Text style={s.totalValue}>{formatPdfINR(breakup.netTaxable)}</Text>
              </View>

              {breakup.discountAmount > 0 && !quote.discountIsPostTax ? (
                <View style={s.totalRow}>
                  <Text style={[s.totalLabel, { color: C.green }]}>{L.discountApplied}</Text>
                  <Text style={[s.totalValue, { color: C.green }]}>
                    -{formatPdfINR(breakup.discountAmount)}
                  </Text>
                </View>
              ) : null}

              {isInterState ? (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>
                    {`IGST @ ${quote.gstPercent || 18}%`}
                  </Text>
                  <Text style={s.totalValue}>{formatPdfINR(breakup.gstAmount)}</Text>
                </View>
              ) : (
                <>
                  <View style={s.totalRow}>
                    <Text style={s.totalLabel}>{`CGST @ ${(quote.gstPercent || 18) / 2}%`}</Text>
                    <Text style={s.totalValue}>{formatPdfINR(breakup.cgstAmount)}</Text>
                  </View>
                  <View style={s.totalRow}>
                    <Text style={s.totalLabel}>{`SGST @ ${(quote.gstPercent || 18) / 2}%`}</Text>
                    <Text style={s.totalValue}>{formatPdfINR(breakup.sgstAmount)}</Text>
                  </View>
                </>
              )}

              {breakup.discountAmount > 0 && quote.discountIsPostTax ? (
                <View style={s.totalRow}>
                  <Text style={[s.totalLabel, { color: C.green }]}>{L.discountApplied}</Text>
                  <Text style={[s.totalValue, { color: C.green }]}>
                    -{formatPdfINR(breakup.discountAmount)}
                  </Text>
                </View>
              ) : null}

              <View style={s.grandRow}>
                <Text style={[s.grandLabel, noUpper]}>{L.totalPayable}</Text>
                <Text style={s.grandValue}>{formatPdfINR(breakup.totalPayable)}</Text>
              </View>
            </View>
          </View>

          {/* ── Trust Cards (3 compact columns) ──────────────────────────── */}
          <View style={s.termsGrid} wrap={false}>
            {[
              { bg: C.goldBg, icon: "W", title: L.warranty1YrTitle, body: L.warranty1YrBody },
              { bg: C.greenBg, icon: "A", title: L.advanceTitle, body: L.advanceBody },
              { bg: C.navyBg, icon: "S", title: L.supportTitle, body: L.supportBody },
            ].map((t) => (
              <View key={t.title} style={s.termCard}>
                <View style={[s.termIcon, { backgroundColor: t.bg }]}>
                  <Text style={{ fontSize: 8.5, fontWeight: 700, color: C.navy }}>{t.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.termTitle}>{t.title}</Text>
                  <Text style={s.termBody}>{t.body}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── Compact Signatory Line ────────────────────────────────────── */}
          <View style={s.signatureStrip} wrap={false}>
            <Text style={s.sigNote}>{L.computerGeneratedNote}</Text>
            <Text style={[s.sigLabel, noUpper]}>
              {settings?.authorized_signatory_label || `${L.authorisedSignatory} — ${companyName}`}
            </Text>
          </View>
        </View>

        {/* ── PINNED FOOTER ────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>
            <Text style={s.footerBrand}>{companyName}</Text>
            {" "}· {gstinDisplay} · {webDisplay}
          </Text>
          <View style={s.footerRight}>
            <Text style={s.footerContact}>{phoneDisplay}</Text>
            <Text style={s.footerContact}>{emailDisplay}</Text>
            <Text
              style={s.pageNum}
              render={({ pageNumber, totalPages }) =>
                `${L.pageLabel} ${pageNumber} ${L.ofLabel} ${totalPages}`
              }
            />
          </View>
        </View>
      </Page>
    </Document>
  );
}

// ─── Server-side PDF generation helper ───────────────────────────────────────
export async function generateQuotePdfBuffer(
  quote: QuoteData,
  settings?: any,
  isInvoice?: boolean,
  locale?: string
): Promise<Buffer> {
  const blob = await pdf(
    <QuotePDF quote={quote} settings={settings} isInvoice={isInvoice} locale={locale} />
  ).toBlob();
  const arrBuf = await blob.arrayBuffer();
  return Buffer.from(arrBuf);
}
