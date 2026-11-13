import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import type { Lead, PricingResult, AppSettings } from '@/types';
import { ensurePdfFontsForLocale, normalizePdfLocale } from '@/lib/pdf/pdf-fonts-indic';
import { resolvePdfImageSrc } from '@/lib/pdf/pdf-image';
import { getPdfLabels, buildQuoteTerms } from '@/lib/pdf/pdf-i18n';
import { SPEECH_LOCALE_MAP } from '@/lib/i18n/mapping';

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Inter',
    fontSize: 10,
    color: '#333333',
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingBottom: 20,
  },
  logoContainer: {
    width: 170,
  },
  logoImage: {
    width: 140,
    height: 34,
    objectFit: 'contain',
    marginBottom: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 700,
    color: '#111827',
    marginBottom: 4,
  },
  companyDetails: {
    fontSize: 9,
    color: '#6B7280',
    lineHeight: 1.4,
  },
  titleContainer: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 28,
    fontWeight: 700,
    color: '#2563EB', // Blue-600
    marginBottom: 8,
  },
  quoteMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 140,
    marginBottom: 4,
  },
  metaLabel: {
    color: '#6B7280',
    fontSize: 9,
  },
  metaValue: {
    fontWeight: 600,
    fontSize: 9,
    color: '#111827',
  },
  customerSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: '#4B5563',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#111827',
    marginBottom: 4,
  },
  customerDetails: {
    fontSize: 10,
    color: '#4B5563',
    lineHeight: 1.5,
  },
  table: {
    width: 'auto',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    alignItems: 'center',
    minHeight: 28,
  },
  tableHeaderCell: {
    padding: '6 8',
    fontSize: 9,
    fontWeight: 700,
    color: '#374151',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
    minHeight: 32,
  },
  tableCell: {
    padding: '8 8',
    fontSize: 9,
    color: '#111827',
  },
  colProduct: { flex: 3 },
  colQty: { flex: 0.8, textAlign: 'center' },
  colPrice: { flex: 1.2, textAlign: 'right' },
  colTotal: { flex: 1.2, textAlign: 'right' },
  productName: {
    fontWeight: 600,
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 8,
    color: '#6B7280',
  },
  totalsSection: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  totalsBox: {
    width: 220,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  totalLabel: {
    color: '#4B5563',
    fontSize: 9,
  },
  totalValue: {
    fontWeight: 600,
    fontSize: 9,
    color: '#111827',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: 4,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#2563EB',
    paddingHorizontal: 8,
  },
  grandTotalLabel: {
    fontWeight: 700,
    fontSize: 11,
    color: '#111827',
  },
  grandTotalValue: {
    fontWeight: 700,
    fontSize: 12,
    color: '#2563EB',
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    left: 40,
    right: 40,
  },
  termsTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: '#374151',
    marginBottom: 6,
  },
  termsText: {
    fontSize: 8,
    color: '#6B7280',
    lineHeight: 1.5,
  },
  watermark: {
    position: 'absolute',
    top: '45%',
    left: '25%',
    opacity: 0.03,
    transform: 'rotate(-45deg)',
    fontSize: 100,
    fontWeight: 700,
    color: '#000000',
    zIndex: -1,
  }
});

interface QuotePDFProps {
  lead: Lead;
  quote: PricingResult;
  settings: AppSettings | null;
  issueDate?: string;
  validUntilDate?: string;
  locale?: string;
}

export function QuotePDFDocument({ lead, quote, settings, issueDate, validUntilDate, locale }: QuotePDFProps) {
  const pdfLocale = normalizePdfLocale(locale || (lead as any)?.preferred_language || (quote as any)?.preferred_language);
  const pdfFont = ensurePdfFontsForLocale(pdfLocale);
  const L = getPdfLabels(pdfLocale);
  const dateLocale = SPEECH_LOCALE_MAP[pdfLocale] || 'en-IN';

  const quoteDate = issueDate || new Date().toLocaleDateString(dateLocale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  
  // eslint-disable-next-line react-hooks/purity
  const validUntil = validUntilDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(dateLocale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const companyName = settings?.company_legal_name || settings?.company_name || "TEAM CCTV";
  const tagline = settings?.company_tagline || L.companyTagline;
  const gstinDisplay = settings?.company_gstin && settings.company_gstin.trim().length > 0
    ? `${L.gstinPrefix}: ${settings.company_gstin.trim()}`
    : L.gstPending;
  const emailDisplay = settings?.company_email || "sales@teamcctv.com";
  const phoneDisplay = settings?.company_phone ? `\n${L.phoneShort}: ${settings.company_phone}` : "";
  const addressParts = [
    settings?.company_address_line1,
    settings?.company_address_line2,
    settings?.company_city,
    settings?.company_state ? `${settings.company_state}${settings.company_pincode ? ` - ${settings.company_pincode}` : ''}` : settings?.company_pincode
  ].filter(Boolean);
  const addressDisplay = addressParts.length > 0 ? `\n${addressParts.join(", ")}` : "";
  const resolvedLogo = resolvePdfImageSrc(settings?.pdf_logo_url || settings?.company_logo_url, "/logo-horizontal.jpg");
  
  // Default terms tailored for CCTV quotation
  const defaultTerms = buildQuoteTerms(pdfLocale, settings?.quote_validity_days || 7, settings?.wire_cost_per_meter || 20);
  
  const termsText = settings?.pdf_terms || defaultTerms;

  return (
    <Document>
      <Page size="A4" style={[styles.page, { fontFamily: pdfFont }]}>
        <Text style={[styles.watermark, pdfLocale !== 'en' ? { fontSize: 64 } : {}]}>{L.watermarkQuote}</Text>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {resolvedLogo ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={resolvedLogo} style={styles.logoImage} />
            ) : (
              <Text style={styles.logoText}>{companyName}</Text>
            )}
            <Text style={styles.companyDetails}>
              {tagline}
              {addressDisplay}
              {'\n'}{gstinDisplay}
              {'\n'}{emailDisplay}{phoneDisplay}
            </Text>
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={[styles.title, pdfLocale !== 'en' ? { fontSize: 18 } : {}]}>{L.quotationTitle}</Text>
            <View style={styles.quoteMeta}>
              <Text style={styles.metaLabel}>{L.leadRef}:</Text>
              <Text style={styles.metaValue}>{lead.id ? lead.id.slice(0, 8).toUpperCase() : 'DRF-101'}</Text>
            </View>
            <View style={styles.quoteMeta}>
              <Text style={styles.metaLabel}>{L.dateIssued}:</Text>
              <Text style={styles.metaValue}>{quoteDate}</Text>
            </View>
            <View style={styles.quoteMeta}>
              <Text style={styles.metaLabel}>{L.validUntil}:</Text>
              <Text style={styles.metaValue}>{validUntil}</Text>
            </View>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.customerSection}>
          <Text style={[styles.sectionTitle, pdfLocale !== 'en' ? { textTransform: 'none' } : {}]}>{L.preparedFor}:</Text>
          <Text style={styles.customerName}>{lead.customer_name || L.valuedCustomer}</Text>
          <Text style={styles.customerDetails}>
            {L.phoneLabel}: {lead.mobile_number}
            {lead.address?.full_address && `\n${L.installationSite}: ${lead.address.full_address}`}
            {lead.address?.pincode && ` - ${lead.address.pincode}`}
          </Text>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colProduct]}>{L.itemDescription}</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>{L.qty}</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>{L.unitPrice}</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>{L.amount}</Text>
          </View>
          
          {/* Hardware Items */}
          {quote.items.map((item, i) => (
            <View style={styles.tableRow} key={`item-${i}`}>
              <View style={[styles.tableCell, styles.colProduct]}>
                <Text style={styles.productName}>{item.display_name}</Text>
                {item.brand && (
                  <Text style={styles.productBrand}>
                    {L.brandLabel}: {item.brand === "Budget Brand" || item.brand === "Budget" ? L.budgetBrandLabel : item.brand}
                  </Text>
                )}
              </View>
              <Text style={[styles.tableCell, styles.colQty]}>{item.qty}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(item.unit_price)}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(item.line_total)}</Text>
            </View>
          ))}

          {/* Addons / Cabling */}
          {quote.addons.map((addon, i) => (
            <View style={styles.tableRow} key={`addon-${i}`}>
              <View style={[styles.tableCell, styles.colProduct]}>
                <Text style={styles.productName}>{addon.display_name}</Text>
                <Text style={styles.productBrand}>{L.accessoryService}</Text>
              </View>
              <Text style={[styles.tableCell, styles.colQty]}>{addon.qty || 1}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(addon.price)}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency((addon.price || 0) * (addon.qty || 1))}</Text>
            </View>
          ))}
          
          {/* Labor / Installation */}
          {quote.labor_cost > 0 && (
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.colProduct]}>
                <Text style={styles.productName}>{L.proInstall}</Text>
                <Text style={styles.productBrand}>{L.serviceLabel}</Text>
              </View>
              <Text style={[styles.tableCell, styles.colQty]}>1</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{formatCurrency(quote.labor_cost)}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{formatCurrency(quote.labor_cost)}</Text>
            </View>
          )}
        </View>

        {/* Totals */}
        <View style={styles.totalsSection}>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{L.subtotal}:</Text>
              <Text style={styles.totalValue}>{formatCurrency(quote.gross_subtotal)}</Text>
            </View>
            
            {quote.referral_discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{L.discountApplied}:</Text>
                <Text style={[styles.totalValue, { color: '#16A34A' }]}>-{formatCurrency(quote.referral_discount)}</Text>
              </View>
            )}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{L.taxableValue}:</Text>
              <Text style={styles.totalValue}>{formatCurrency(quote.net_taxable_amount)}</Text>
            </View>

            {quote.gst_amount > 0 && (() => {
              const displayGstPct = quote.gst_rate > 1 ? quote.gst_rate : (quote.gst_rate * 100);
              return (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{L.gstAt18} ({displayGstPct.toFixed(0)}%):</Text>
                  <Text style={styles.totalValue}>{formatCurrency(quote.gst_amount)}</Text>
                </View>
              );
            })()}

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>{L.totalPayable}:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(quote.total_payable)}</Text>
            </View>
            <Text style={{ fontSize: 7.5, color: '#16A34A', textAlign: 'right', marginTop: 4 }}>{L.gstInclusiveBadge}</Text>
          </View>
        </View>

        {/* Footer / Terms */}
        <View style={styles.footer}>
          <Text style={[styles.termsTitle, pdfLocale !== 'en' ? { textTransform: 'none' } : {}]}>{L.termsTitle}</Text>
          <Text style={styles.termsText}>{termsText}</Text>
        </View>
      </Page>
    </Document>
  );
}
