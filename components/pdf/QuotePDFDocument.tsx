import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font, Image } from '@react-pdf/renderer';
import type { Lead, PricingResult, AppSettings } from '@/types';
import { FONT_REGULAR, FONT_SEMIBOLD, FONT_BOLD } from '@/lib/pdf-fonts';

const formatCurrency = (amount: number) => 
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

// Register fonts using embedded base64 data URIs — zero network requests, works everywhere
Font.register({
  family: 'Inter',
  fonts: [
    { src: FONT_REGULAR },
    { src: FONT_SEMIBOLD, fontWeight: 600 },
    { src: FONT_BOLD, fontWeight: 700 }
  ]
});

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
    width: 150,
  },
  logoImage: {
    width: 120,
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
}

export function QuotePDFDocument({ lead, quote, settings }: QuotePDFProps) {
  const quoteDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
  
  const validUntil = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const companyName = settings?.company_name || "TEAM CCTV";
  const logoUrl = settings?.pdf_logo_url || settings?.company_logo_url;
  
  // Default terms tailored for CCTV quotation
  const defaultTerms = "1. Prices are valid for 7 days from the date of this quotation.\n2. Standard 1-Year Warranty on all hardware items unless specified otherwise.\n3. 1-Year Free AMC (Annual Maintenance Contract) included covering 2 free service visits.\n4. Additional cabling beyond the estimated requirement will be charged at ₹" + (settings?.wire_cost_per_meter || 20) + "/meter.\n5. 50% advance payment required for order confirmation, balance on completion of installation.";
  
  const termsText = settings?.pdf_terms || defaultTerms;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.watermark}>QUOTATION</Text>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {logoUrl ? (
              // eslint-disable-next-line jsx-a11y/alt-text
              <Image src={logoUrl} style={styles.logoImage} />
            ) : (
              <Text style={styles.logoText}>{companyName}</Text>
            )}
            <Text style={styles.companyDetails}>
              Premium Security Solutions
              {'\n'}GSTIN: {settings?.gst_rate ? "APPLIED" : "PENDING"}
              {'\n'}sales@teamcctv.com
            </Text>
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={styles.title}>QUOTATION</Text>
            <View style={styles.quoteMeta}>
              <Text style={styles.metaLabel}>Quote Ref:</Text>
              <Text style={styles.metaValue}>{lead.id ? lead.id.slice(0, 8).toUpperCase() : 'DRF-101'}</Text>
            </View>
            <View style={styles.quoteMeta}>
              <Text style={styles.metaLabel}>Date:</Text>
              <Text style={styles.metaValue}>{quoteDate}</Text>
            </View>
            <View style={styles.quoteMeta}>
              <Text style={styles.metaLabel}>Valid Until:</Text>
              <Text style={styles.metaValue}>{validUntil}</Text>
            </View>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.customerSection}>
          <Text style={styles.sectionTitle}>Prepared For:</Text>
          <Text style={styles.customerName}>{lead.customer_name || 'Valued Customer'}</Text>
          <Text style={styles.customerDetails}>
            Phone: {lead.mobile_number}
            {lead.address?.full_address && `\nAddress: ${lead.address.full_address}`}
            {lead.address?.pincode && ` - ${lead.address.pincode}`}
          </Text>
        </View>

        {/* Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colProduct]}>Description</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>Qty</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>Total</Text>
          </View>
          
          {/* Hardware Items */}
          {quote.items.map((item, i) => (
            <View style={styles.tableRow} key={`item-${i}`}>
              <View style={[styles.tableCell, styles.colProduct]}>
                <Text style={styles.productName}>{item.display_name}</Text>
                {item.brand && <Text style={styles.productBrand}>Brand: {item.brand}</Text>}
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
                <Text style={styles.productBrand}>Accessory / Service</Text>
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
                <Text style={styles.productName}>Professional Installation & Setup</Text>
                <Text style={styles.productBrand}>Service</Text>
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
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(quote.gross_subtotal)}</Text>
            </View>
            
            {quote.referral_discount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Discount Applied:</Text>
                <Text style={[styles.totalValue, { color: '#16A34A' }]}>-{formatCurrency(quote.referral_discount)}</Text>
              </View>
            )}
            
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Taxable Amount:</Text>
              <Text style={styles.totalValue}>{formatCurrency(quote.net_taxable_amount)}</Text>
            </View>

            {quote.gst_amount > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>GST ({(quote.gst_rate * 100).toFixed(0)}%):</Text>
                <Text style={styles.totalValue}>{formatCurrency(quote.gst_amount)}</Text>
              </View>
            )}

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(quote.total_payable)}</Text>
            </View>
          </View>
        </View>

        {/* Footer / Terms */}
        <View style={styles.footer}>
          <Text style={styles.termsTitle}>Terms & Conditions</Text>
          <Text style={styles.termsText}>{termsText}</Text>
        </View>
      </Page>
    </Document>
  );
}
