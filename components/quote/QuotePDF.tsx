/**
 * TEAM CCTV — Quote PDF Document
 * File: components/quote/QuotePDF.tsx
 *
 * Used by:
 *  • App Router API route:  app/api/v1/quotes/[id]/pdf/route.tsx
 *  • Direct client render:  <PDFDownloadLink document={<QuotePDF quote={q} />} />
 *
 * Requires: @react-pdf/renderer (already in package.json)
 *
 * Design mirrors the web quote page:
 *  - Deep navy header with gold quote number
 *  - Clean DM Sans body (embedded via base64 or Google Fonts URL)
 *  - Itemised table with subtotals, CGST, SGST, grand total
 *  - Three trust-term cards at the bottom
 *  - Company footer with GSTIN
 */

import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from "@react-pdf/renderer";

// ─── Font Registration ────────────────────────────────────────────────────────
// Swap these URLs for locally hosted font files in /public/fonts/ for reliability.
Font.register({
  family: "DM Sans",
  fonts: [
    { src: "/fonts/dm-sans.woff2", fontWeight: 400 },
    { src: "/fonts/dm-sans.woff2", fontWeight: 500 },
    { src: "/fonts/dm-sans.woff2", fontWeight: 700 },
  ],
});

Font.register({
  family: "Playfair Display",
  fonts: [
    { src: "/fonts/playfair-display.woff2", fontWeight: 600 },
    { src: "/fonts/playfair-display.woff2", fontWeight: 700 },
  ],
});

// ─── Types ────────────────────────────────────────────────────────────────────
// Reuse from your types/ folder — imported here for standalone clarity.
interface LineItem {
  id: string;
  name: string;
  description: string;
  badge?: { label: string };
  quantity: number;
  unitPrice: number;
}

interface QuoteData {
  id: string;
  quoteNumber: string;
  status: string;
  issuedAt: string;
  validUntil: string;
  customer: { name: string; phone: string; email?: string };
  installationAddress: string;
  propertyType: string;
  propertyDetail: string;
  siteVisitDate?: string;
  lineItems: LineItem[];
  gstPercent: number;
  advancePercent: number;
  companyGstin: string;
  notes?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatINR(n: number) {
  return "₹" + n.toLocaleString("en-IN");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Colour tokens (mirrors web page) ────────────────────────────────────────
const C = {
  navy:    "#0F1F3D",
  navyMid: "#1A3057",
  gold:    "#C8922A",
  goldBg:  "#F5E6C8",
  cream:   "#FAFAF7",
  white:   "#FFFFFF",
  text:    "#1C1C28",
  muted:   "#6B7380",
  border:  "#E4E4DC",
  greenBg: "#E8F5F0",
  green:   "#0A7A5A",
  navyBg:  "#E8EDF5",
  noteBg:  "#F5F9FF",
  noteBdr: "#D0E3F8",
  rowHover:"#FAFAF5",
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  page: {
    fontFamily: "DM Sans",
    backgroundColor: C.cream,
    paddingTop: 0,
    paddingBottom: 40,
    paddingHorizontal: 0,
    fontSize: 10,
    color: C.text,
  },

  // ── Header
  header: {
    backgroundColor: C.navy,
    paddingHorizontal: 40,
    paddingTop: 28,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  brandIconBox: {
    width: 36,
    height: 36,
    backgroundColor: C.gold,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  brandIconText: { color: C.white, fontSize: 18 },
  brandName: {
    color: C.white,
    fontSize: 16,
    fontWeight: 700,
  },
  brandTagline: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 7.5,
    fontWeight: 400,
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginTop: 1,
  },
  quoteLabel: { alignItems: "flex-end" },
  quoteLabelText: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 7.5,
    fontWeight: 500,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  quoteNumber: {
    color: C.gold,
    fontSize: 18,
    fontWeight: 700,
    letterSpacing: 0.4,
    marginTop: 3,
  },
  headerDivider: {
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.1)",
    marginBottom: 16,
  },
  headerMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  metaLabel: {
    color: "rgba(255,255,255,0.38)",
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  metaValue: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 9.5,
    fontWeight: 500,
  },

  // ── Body
  body: {
    paddingHorizontal: 40,
    paddingTop: 24,
  },

  // ── Bill grid
  billGrid: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 22,
  },
  billBlock: { flex: 1 },
  billLabel: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: C.muted,
    marginBottom: 6,
  },
  billName: {
    fontSize: 11.5,
    fontWeight: 700,
    color: C.text,
    marginBottom: 2,
  },
  billDetail: {
    fontSize: 9,
    color: C.muted,
    lineHeight: 1.5,
  },
  addressBox: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#F6F6F3",
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 5,
    padding: "8 10",
    marginTop: 8,
    alignItems: "flex-start",
  },
  addressPin: { fontSize: 9, color: C.gold, marginTop: 0.5 },
  addressText: { fontSize: 8.5, color: C.muted, lineHeight: 1.5, flex: 1 },

  // ── Section label
  sectionLabel: {
    fontSize: 7,
    fontWeight: 700,
    letterSpacing: 1,
    textTransform: "uppercase",
    color: C.muted,
    marginBottom: 8,
  },

  // ── Table
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: C.navy,
    paddingBottom: 6,
    marginBottom: 0,
  },
  th: {
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: C.navy,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
    paddingVertical: 9,
  },
  itemName: { fontSize: 9.5, fontWeight: 700, color: C.text, marginBottom: 1.5 },
  itemDesc: { fontSize: 8, color: C.muted, lineHeight: 1.4 },
  badge: {
    fontSize: 7,
    fontWeight: 700,
    color: C.white,
    backgroundColor: C.navy,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
    alignSelf: "flex-start",
    marginTop: 3,
    letterSpacing: 0.3,
  },

  // Column widths
  colDesc:  { flex: 4.6 },
  colQty:   { flex: 1,   textAlign: "center" },
  colPrice: { flex: 1.8, textAlign: "right" },
  colAmt:   { flex: 1.8, textAlign: "right" },

  qtyBox: {
    width: 24,
    height: 18,
    backgroundColor: "#F0F0EA",
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  qtyText: { fontSize: 9, fontWeight: 700, color: C.text },

  // ── Totals
  totalsWrap: {
    alignItems: "flex-end",
    marginTop: 6,
    marginBottom: 22,
  },
  totalsBox: { width: 200 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: C.border,
  },
  totalLabel: { fontSize: 9, color: C.muted },
  totalValue: { fontSize: 9, color: C.text, fontWeight: 500 },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: C.navy,
    borderRadius: 6,
    padding: "10 12",
    marginTop: 6,
  },
  grandLabel: {
    fontSize: 7.5,
    fontWeight: 700,
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  grandValue: {
    fontSize: 17,
    fontWeight: 700,
    color: C.gold,
  },

  // ── Terms
  termsGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  termCard: {
    flex: 1,
    backgroundColor: "#F7F7F3",
    borderWidth: 0.5,
    borderColor: C.border,
    borderRadius: 6,
    padding: "10 10 9",
    flexDirection: "row",
    gap: 7,
    alignItems: "flex-start",
  },
  termIcon: {
    width: 22,
    height: 22,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  termTitle: { fontSize: 8.5, fontWeight: 700, color: C.text, marginBottom: 2 },
  termBody:  { fontSize: 7.5, color: C.muted, lineHeight: 1.45 },

  // ── Note
  noteBox: {
    backgroundColor: C.noteBg,
    borderLeftWidth: 2.5,
    borderLeftColor: C.navy,
    borderWidth: 0.5,
    borderColor: C.noteBdr,
    borderRadius: 5,
    padding: "10 12",
    marginBottom: 20,
  },
  noteTitle: {
    fontSize: 7.5,
    fontWeight: 700,
    color: C.navy,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  noteBody: { fontSize: 8.5, color: "#2C3E6B", lineHeight: 1.55 },

  // ── Signature
  signatureRow: {
    flexDirection: "row",
    gap: 24,
    marginTop: 10,
    marginBottom: 28,
  },
  sigBox: {
    flex: 1,
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    paddingTop: 8,
  },
  sigLabel: { fontSize: 7.5, color: C.muted, letterSpacing: 0.5 },

  // ── Footer
  footer: {
    borderTopWidth: 0.5,
    borderTopColor: C.border,
    backgroundColor: "#F5F5F0",
    paddingHorizontal: 40,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerLeft: { fontSize: 8, color: C.muted },
  footerBrand: { fontWeight: 700, color: C.text },
  footerRight: { flexDirection: "row", gap: 14 },
  footerContact: { fontSize: 8, color: C.muted },

  // ── Page number
  pageNum: {
    position: "absolute",
    bottom: 14,
    right: 40,
    fontSize: 7.5,
    color: C.muted,
  },
});

// ─── Component ────────────────────────────────────────────────────────────────

export function QuotePDF({ quote }: { quote: QuoteData }) {
  const subtotal  = quote.lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const halfGst   = (subtotal * quote.gstPercent) / 200;
  const total     = subtotal + halfGst * 2;
  const advance   = Math.round(total * quote.advancePercent / 100);

  return (
    <Document
      title={`TEAM CCTV — Quotation #${quote.quoteNumber}`}
      author="TEAM CCTV"
      subject="CCTV Installation Quotation"
    >
      <Page size="A4" style={s.page}>

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.headerTop}>
            <View style={s.brandRow}>
              <View style={s.brandIconBox}>
                <Text style={s.brandIconText}>▶</Text>
              </View>
              <View>
                <Text style={s.brandName}>TEAM CCTV</Text>
                <Text style={s.brandTagline}>Smart Security Solutions · Jaipur</Text>
              </View>
            </View>
            <View style={s.quoteLabel}>
              <Text style={s.quoteLabelText}>Quotation</Text>
              <Text style={s.quoteNumber}>#{quote.quoteNumber}</Text>
            </View>
          </View>

          <View style={s.headerDivider} />

          <View style={s.headerMeta}>
            {[
              ["Date Issued",    formatDate(quote.issuedAt)],
              ["Prepared For",   quote.customer.name],
              ["Valid Until",    formatDate(quote.validUntil)],
              ["Lead Reference", quote.id.substring(0, 14) + "…"],
            ].map(([label, value]) => (
              <View key={label}>
                <Text style={s.metaLabel}>{label}</Text>
                <Text style={s.metaValue}>{value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── BODY ────────────────────────────────────────────────────── */}
        <View style={s.body}>

          {/* Bill grid */}
          <View style={s.billGrid}>
            {/* Bill To */}
            <View style={s.billBlock}>
              <Text style={s.billLabel}>Bill To</Text>
              <Text style={s.billName}>{quote.customer.name}</Text>
              <Text style={s.billDetail}>{quote.customer.phone}</Text>
              {quote.customer.email && <Text style={s.billDetail}>{quote.customer.email}</Text>}
              <View style={s.addressBox}>
                <Text style={s.addressPin}>📍</Text>
                <Text style={s.addressText}>{quote.installationAddress}</Text>
              </View>
            </View>

            {/* Installation site */}
            <View style={s.billBlock}>
              <Text style={s.billLabel}>Installation Site</Text>
              <Text style={s.billName}>{quote.propertyType}</Text>
              <Text style={s.billDetail}>{quote.propertyDetail}</Text>
              <View style={s.addressBox}>
                <Text style={s.addressPin}>📍</Text>
                <Text style={s.addressText}>
                  {quote.installationAddress}
                  {quote.siteVisitDate ? `\nSite visit: ${formatDate(quote.siteVisitDate)}` : ""}
                </Text>
              </View>
            </View>
          </View>

          {/* Table */}
          <Text style={s.sectionLabel}>Scope of Work &amp; Materials</Text>

          <View style={s.tableHeader}>
            <Text style={[s.th, s.colDesc]}>Item / Description</Text>
            <Text style={[s.th, s.colQty]}>Qty</Text>
            <Text style={[s.th, s.colPrice]}>Unit Price</Text>
            <Text style={[s.th, s.colAmt]}>Amount</Text>
          </View>

          {quote.lineItems.map((item) => {
            const amt = item.quantity * item.unitPrice;
            return (
              <View key={item.id} style={s.tableRow} wrap={false}>
                <View style={s.colDesc}>
                  <Text style={s.itemName}>{item.name}</Text>
                  <Text style={s.itemDesc}>{item.description}</Text>
                  {item.badge && <Text style={s.badge}>{item.badge.label}</Text>}
                </View>
                <View style={[s.colQty, { alignItems: "center" }]}>
                  <View style={s.qtyBox}>
                    <Text style={s.qtyText}>{item.quantity}</Text>
                  </View>
                </View>
                <Text style={[s.colPrice, { fontSize: 9.5, paddingTop: 0.5 }]}>{formatINR(item.unitPrice)}</Text>
                <Text style={[s.colAmt, { fontSize: 9.5, fontWeight: 700, paddingTop: 0.5 }]}>{formatINR(amt)}</Text>
              </View>
            );
          })}

          {/* Totals */}
          <View style={s.totalsWrap}>
            <View style={s.totalsBox}>
              {[
                { label: "Subtotal",                              value: formatINR(subtotal) },
                { label: `CGST @ ${quote.gstPercent / 2}%`,      value: formatINR(halfGst)  },
                { label: `SGST @ ${quote.gstPercent / 2}%`,      value: formatINR(halfGst)  },
              ].map((row) => (
                <View key={row.label} style={s.totalRow}>
                  <Text style={s.totalLabel}>{row.label}</Text>
                  <Text style={s.totalValue}>{row.value}</Text>
                </View>
              ))}
              <View style={s.grandRow}>
                <Text style={s.grandLabel}>Total Payable</Text>
                <Text style={s.grandValue}>{formatINR(total)}</Text>
              </View>
            </View>
          </View>

          {/* Terms cards */}
          <View style={s.termsGrid}>
            {[
              {
                bg: C.goldBg,
                icon: "🛡",
                title: "1-Year Warranty",
                body: "All equipment + labour covered. Free replacement if defective.",
              },
              {
                bg: C.greenBg,
                icon: "✓",
                title: `${quote.advancePercent}% Advance`,
                body: `${formatINR(advance)} to confirm booking. Balance on completion.`,
              },
              {
                bg: C.navyBg,
                icon: "📞",
                title: "Support Included",
                body: "Free remote support 12 months. On-site response within 24h.",
              },
            ].map((t) => (
              <View key={t.title} style={s.termCard}>
                <View style={[s.termIcon, { backgroundColor: t.bg }]}>
                  <Text style={{ fontSize: 10 }}>{t.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.termTitle}>{t.title}</Text>
                  <Text style={s.termBody}>{t.body}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Notes */}
          {quote.notes && (
            <View style={s.noteBox}>
              <Text style={s.noteTitle}>Important Note</Text>
              <Text style={s.noteBody}>
                {quote.notes}
                {"\n"}GSTIN: {quote.companyGstin}
              </Text>
            </View>
          )}

          {/* Signature lines */}
          <View style={s.signatureRow}>
            <View style={s.sigBox}>
              <Text style={s.sigLabel}>Customer Signature &amp; Date</Text>
            </View>
            <View style={s.sigBox}>
              <Text style={s.sigLabel}>Authorised Signatory — TEAM CCTV</Text>
            </View>
          </View>

        </View>

        {/* ── FOOTER ──────────────────────────────────────────────────── */}
        <View style={s.footer} fixed>
          <Text style={s.footerLeft}>
            <Text style={s.footerBrand}>TEAM CCTV</Text>
            {" "}· GSTIN: {quote.companyGstin}
          </Text>
          <View style={s.footerRight}>
            <Text style={s.footerContact}>+91 98290 00000</Text>
            <Text style={s.footerContact}>support@cctvquotation.com</Text>
          </View>
        </View>

        {/* Page number */}
        <Text
          style={s.pageNum}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          fixed
        />

      </Page>
    </Document>
  );
}

// ─── Server-side PDF generation helper ───────────────────────────────────────
/**
 * Call this from your Cloud Function or Next.js API route:
 *
 *   const buffer = await generateQuotePdfBuffer(quote);
 *   // Save to Firebase Storage → return signed URL
 *
 * Route: app/api/v1/quotes/[id]/pdf/route.tsx
 *   const q = await getQuoteFromFirestore(id);
 *   const buf = await generateQuotePdfBuffer(q);
 *   return new Response(buf, {
 *     headers: {
 *       "Content-Type": "application/pdf",
 *       "Content-Disposition": `attachment; filename="TEAM-CCTV-Quote-${q.quoteNumber}.pdf"`,
 *     },
 *   });
 */
export async function generateQuotePdfBuffer(quote: QuoteData): Promise<Buffer> {
  const blob   = await pdf(<QuotePDF quote={quote} />).toBlob();
  const arrBuf = await blob.arrayBuffer();
  return Buffer.from(arrBuf);
}
