import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { QuoteSnapshot, PricingResult, QuoteLineItem } from '@/types';

// Create styles optimized for professional single-page layout
const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 28,
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: '#0f172a',
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'column',
    maxWidth: '56%',
  },
  logoText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#000000',
    letterSpacing: 0.5,
  },
  companyInfo: {
    fontSize: 7.5,
    color: '#64748b',
    lineHeight: 1.35,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    maxWidth: '44%',
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2563eb', // Indigo / Brand Blue
    marginBottom: 5,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quoteMetaGrid: {
    flexDirection: 'column',
  },
  quoteMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  quoteMetaLabel: {
    color: '#64748b',
    fontSize: 7.5,
    marginRight: 8,
    textAlign: 'right',
  },
  quoteMetaValue: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#0f172a',
    textAlign: 'right',
  },
  customerBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  customerInfoCol: {
    width: '49%',
  },
  metaInfoCol: {
    width: '49%',
  },
  preparedForLabel: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerName: {
    fontSize: 9.5,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#0f172a',
  },
  customerPhone: {
    fontSize: 7.5,
    color: '#475569',
  },
  table: {
    width: '100%',
    marginBottom: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  colDesc: { width: '56%', fontWeight: 'bold' },
  colQty: { width: '10%', textAlign: 'center', fontWeight: 'bold' },
  colUnit: { width: '16%', textAlign: 'right', fontWeight: 'bold' },
  colTotal: { width: '18%', textAlign: 'right', fontWeight: 'bold' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
  },
  itemTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 1,
  },
  itemBrand: {
    fontSize: 6.5,
    color: '#64748b',
  },
  itemText: {
    fontSize: 7.5,
    color: '#334155',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  termsBox: {
    width: '58%',
  },
  termsTitle: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 3,
  },
  termsText: {
    fontSize: 6.5,
    color: '#64748b',
    lineHeight: 1.35,
  },
  totalsBox: {
    width: '38%',
    flexDirection: 'column',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2.5,
  },
  totalLabel: {
    fontSize: 7.5,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 3,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  grandTotalLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  grandTotalValue: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#2563eb',
  },
  watermark: {
    position: 'absolute',
    top: 320,
    left: 28,
    right: 28,
    fontSize: 60,
    fontWeight: 'bold',
    textAlign: 'center',
    transform: 'rotate(-30deg)',
    zIndex: -1,
    opacity: 0.05,
    color: '#2563eb',
  },
  footerMicroText: {
    position: 'absolute',
    bottom: 8,
    left: 28,
    right: 28,
    textAlign: 'center',
    fontSize: 6.5,
    color: '#94a3b8',
  },
});

export const QuotePDFDocument = ({ quote }: { quote: QuoteSnapshot }) => {
  const { 
    id, 
    customer_name, 
    customer_mobile, 
  } = quote;

  const validUntil = quote.validUntil || quote.expires_at;
  const createdAt = quote.createdAt || quote.created_at;

  let rawItems: any[] = [];
  if (Array.isArray(quote?.items) && quote.items.length > 0) {
    rawItems = quote.items;
  } else if (Array.isArray(quote?.configurationSnapshot?.items)) {
    rawItems = quote.configurationSnapshot.items;
  } else if (Array.isArray(quote?.pricingSnapshot?.breakdown?.items)) {
    rawItems = quote.pricingSnapshot.breakdown.items;
  } else if (Array.isArray(quote?.pricingSnapshot?.items)) {
    rawItems = quote.pricingSnapshot.items;
  } else if (Array.isArray(quote?.hardware_cart)) {
    rawItems = quote.hardware_cart;
  } else if (Array.isArray(quote?.configuration_snapshot)) {
    rawItems = quote.configuration_snapshot;
  }

  const pricing = {
    total_payable: quote?.pricingSnapshot?.total_payable ?? quote?.total_payable ?? 0,
    items: rawItems,
    addons: Array.isArray(quote?.addons) ? quote.addons : (quote?.pricingSnapshot?.addons || quote?.addons_snapshot || []),
    labor_cost: quote?.pricingSnapshot?.labor_cost ?? quote?.labor_cost ?? 0,
    gross_subtotal: quote?.pricingSnapshot?.gross_subtotal ?? quote?.gross_subtotal ?? 0,
    gst_rate: quote?.pricingSnapshot?.gst_rate ?? quote?.gst_rate ?? 18,
    gst_amount: quote?.pricingSnapshot?.gst_amount ?? quote?.gst_amount ?? 0
  };

  const validDate = validUntil ? new Date(validUntil).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' }) : 'N/A';
  const createdDate = createdAt ? new Date(createdAt).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' }) : 'N/A';

  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString('en-IN')}`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.watermark}>QUOTATION</Text>

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.logoText}>TEAM CCTV</Text>
            <Text style={styles.companyInfo}>Premium Security Solutions</Text>
            <Text style={styles.companyInfo}>GST Registration Pending</Text>
            <Text style={styles.companyInfo}>sales@teamcctv.com</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.quoteTitle}>QUOTATION</Text>
            <View style={styles.quoteMetaGrid}>
              <View style={styles.quoteMetaRow}>
                <Text style={styles.quoteMetaLabel}>Quote Ref:</Text>
                <Text style={styles.quoteMetaValue}>{id ? `QT-${new Date().getFullYear()}-${id.substring(0, 6).toUpperCase()}` : 'DRAFT'}</Text>
              </View>
              <View style={styles.quoteMetaRow}>
                <Text style={styles.quoteMetaLabel}>Date:</Text>
                <Text style={styles.quoteMetaValue}>{createdDate}</Text>
              </View>
              <View style={styles.quoteMetaRow}>
                <Text style={styles.quoteMetaLabel}>Valid Until:</Text>
                <Text style={styles.quoteMetaValue}>{validDate}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Prepared For Box */}
        <View style={styles.customerBox}>
          <View style={styles.customerInfoCol}>
            <Text style={styles.preparedForLabel}>PREPARED FOR:</Text>
            <Text style={styles.customerName}>{customer_name || 'Customer'}</Text>
            <Text style={styles.customerPhone}>Phone: {customer_mobile || 'N/A'}</Text>
          </View>
          <View style={styles.metaInfoCol}>
            <Text style={styles.preparedForLabel}>PROJECT DETAILS:</Text>
            <Text style={styles.customerPhone}>Surveillance Security Quotation</Text>
            <Text style={styles.customerPhone}>Doorstep Installation & Termination</Text>
          </View>
        </View>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colUnit}>Unit Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>

          {pricing.items.map((item: any, i: number) => {
            const name = item.display_name || item.name || item.title || "CCTV Component";
            const qty = item.qty || item.quantity || 1;
            const unitPrice = item.unit_price || item.unitPrice || item.price || 0;
            const lineTotal = item.line_total || item.lineTotal || (qty * unitPrice);
            return (
              <View key={`item-${i}`} style={styles.tableRow} wrap={false}>
                <View style={styles.colDesc}>
                  <Text style={styles.itemTitle}>{name}</Text>
                  <Text style={styles.itemBrand}>Brand: {item.brand || 'TEAM CCTV'}</Text>
                </View>
                <Text style={[styles.colQty, styles.itemText]}>{qty}</Text>
                <Text style={[styles.colUnit, styles.itemText]}>{formatCurrency(unitPrice)}</Text>
                <Text style={[styles.colTotal, styles.itemText]}>{formatCurrency(lineTotal)}</Text>
              </View>
            );
          })}

          {pricing.addons && pricing.addons.map((addon: any, i: number) => {
            const name = addon.display_name || addon.name || "Add-on component";
            const qty = addon.qty || addon.quantity || 1;
            const price = addon.price || addon.unit_price || 0;
            return (
              <View key={`addon-${i}`} style={styles.tableRow} wrap={false}>
                <View style={styles.colDesc}>
                  <Text style={styles.itemTitle}>{name}</Text>
                  <Text style={styles.itemBrand}>Brand: Add-on</Text>
                </View>
                <Text style={[styles.colQty, styles.itemText]}>{qty}</Text>
                <Text style={[styles.colUnit, styles.itemText]}>{formatCurrency(price)}</Text>
                <Text style={[styles.colTotal, styles.itemText]}>{formatCurrency(price * qty)}</Text>
              </View>
            );
          })}

          {pricing.labor_cost > 0 && (
            <View style={styles.tableRow} wrap={false}>
              <View style={styles.colDesc}>
                <Text style={styles.itemTitle}>Labor & Installation</Text>
                <Text style={styles.itemBrand}>Service</Text>
              </View>
              <Text style={[styles.colQty, styles.itemText]}>1</Text>
              <Text style={[styles.colUnit, styles.itemText]}>{formatCurrency(pricing.labor_cost)}</Text>
              <Text style={[styles.colTotal, styles.itemText]}>{formatCurrency(pricing.labor_cost)}</Text>
            </View>
          )}
        </View>

        {/* Bottom Section */}
        <View style={styles.bottomSection} wrap={false}>
          <View style={styles.termsBox}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>1. Prices are valid for 7 days from the date of this quotation.</Text>
            <Text style={styles.termsText}>2. Standard 1-Year Warranty on all hardware items unless specified otherwise.</Text>
            <Text style={styles.termsText}>3. 1-Year Free AMC (Annual Maintenance Contract) included covering 2 free service visits.</Text>
            <Text style={styles.termsText}>4. Additional cabling beyond the estimated requirement will be charged at actual per-meter rate as quoted above.</Text>
            <Text style={styles.termsText}>5. Booking advance required for order confirmation, balance on completion of installation.</Text>
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>{formatCurrency(pricing.gross_subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Taxable Amount:</Text>
              <Text style={styles.totalValue}>{formatCurrency(pricing.gross_subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST ({pricing.gst_rate}%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(pricing.gst_amount)}</Text>
            </View>
            
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(pricing.total_payable)}</Text>
            </View>
          </View>
        </View>

        {/* Micro Footer */}
        <Text style={styles.footerMicroText}>
          Computer-generated quotation. Valid for 7 days. | TEAM CCTV (cctvquotation.com) | Support: sales@teamcctv.com
        </Text>
      </Page>
    </Document>
  );
};
