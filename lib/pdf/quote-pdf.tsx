import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { QuoteSnapshot, PricingResult, QuoteLineItem } from '@/types';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1d1d1f',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  headerLeft: {
    flexDirection: 'column',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000000',
  },
  companyInfo: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.4,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  quoteTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4f46e5', // Indigo-600
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  quoteMetaGrid: {
    flexDirection: 'column',
  },
  quoteMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 3,
  },
  quoteMetaLabel: {
    color: '#6b7280',
    fontSize: 8,
    marginRight: 10,
    width: 60,
    textAlign: 'right',
  },
  quoteMetaValue: {
    fontSize: 8,
    fontWeight: 'bold',
    width: 70,
    textAlign: 'right',
  },
  preparedForLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#000000',
  },
  customerPhone: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 30,
  },
  table: {
    width: '100%',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  colDesc: { width: '55%', fontWeight: 'bold' },
  colQty: { width: '10%', textAlign: 'center', fontWeight: 'bold' },
  colUnit: { width: '15%', textAlign: 'right', fontWeight: 'bold' },
  colTotal: { width: '20%', textAlign: 'right', fontWeight: 'bold' },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  itemTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },
  itemBrand: {
    fontSize: 7,
    color: '#9ca3af',
  },
  itemText: {
    fontSize: 9,
    color: '#374151',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  termsBox: {
    width: '60%',
  },
  termsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  termsText: {
    fontSize: 7,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  totalsBox: {
    width: '35%',
    flexDirection: 'column',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: 9,
    color: '#4b5563',
  },
  totalValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  grandTotalLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#111827',
  },
  grandTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  watermark: {
    position: 'absolute',
    top: 350,
    left: 80,
    fontSize: 120,
    color: '#f3f4f6',
    transform: 'rotate(-45deg)',
    zIndex: -1,
    opacity: 0.5,
  }
});

export const QuotePDFDocument = ({ quote }: { quote: QuoteSnapshot }) => {
  const { 
    id, 
    customer_name, 
    customer_mobile, 
    expires_at: validUntil,
    created_at: createdAt,
  } = quote;

  const pricing = {
    total_payable: quote.total_payable || 0,
    items: quote.configuration_snapshot || [],
    addons: quote.addons_snapshot || [],
    labor_cost: quote.labor_cost || 0,
    gross_subtotal: quote.gross_subtotal || 0,
    gst_rate: quote.gst_rate || 18,
    gst_amount: quote.gst_amount || 0
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

        {/* Prepared For */}
        <Text style={styles.preparedForLabel}>PREPARED FOR:</Text>
        <Text style={styles.customerName}>{customer_name || 'Customer'}</Text>
        <Text style={styles.customerPhone}>Phone: {customer_mobile || 'N/A'}</Text>

        {/* Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colUnit}>Unit Price</Text>
            <Text style={styles.colTotal}>Total</Text>
          </View>

          {pricing.items.map((item: any, i: number) => (
            <View key={`item-${i}`} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.itemTitle}>{item.display_name}</Text>
                <Text style={styles.itemBrand}>Brand: {item.brand || 'TEAM CCTV'}</Text>
              </View>
              <Text style={[styles.colQty, styles.itemText]}>{item.qty}</Text>
              <Text style={[styles.colUnit, styles.itemText]}>{formatCurrency(item.unit_price)}</Text>
              <Text style={[styles.colTotal, styles.itemText]}>{formatCurrency(item.line_total)}</Text>
            </View>
          ))}

          {pricing.addons.map((addon: any, i: number) => (
            <View key={`addon-${i}`} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.itemTitle}>{addon.display_name}</Text>
                <Text style={styles.itemBrand}>Brand: Add-on</Text>
              </View>
              <Text style={[styles.colQty, styles.itemText]}>{addon.qty || 1}</Text>
              <Text style={[styles.colUnit, styles.itemText]}>{formatCurrency(addon.price)}</Text>
              <Text style={[styles.colTotal, styles.itemText]}>{formatCurrency(addon.price * (addon.qty || 1))}</Text>
            </View>
          ))}

          {pricing.labor_cost > 0 && (
            <View style={styles.tableRow}>
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
        <View style={styles.bottomSection}>
          <View style={styles.termsBox}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>1. Prices are valid for 7 days from the date of this quotation.</Text>
            <Text style={styles.termsText}>2. Standard 1-Year Warranty on all hardware items unless specified otherwise.</Text>
            <Text style={styles.termsText}>3. 1-Year Free AMC (Annual Maintenance Contract) included covering 2 free service visits.</Text>
            <Text style={styles.termsText}>4. Additional cabling beyond the estimated requirement will be charged at actual per-meter rate as quoted above.</Text>
            <Text style={styles.termsText}>5. 50% advance payment required for order confirmation, balance on completion of installation.</Text>
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

      </Page>
    </Document>
  );
};
