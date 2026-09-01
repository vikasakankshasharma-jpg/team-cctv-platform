import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#1d1d1f',
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 28,
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
    paddingRight: 20,
  },
  invoiceTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#16a34a', // Emerald / Green
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
    width: 65,
    textAlign: 'right',
  },
  quoteMetaValue: {
    fontSize: 8,
    fontWeight: 'bold',
    width: 85,
    textAlign: 'right',
  },
  paidBadge: {
    position: 'absolute',
    top: 20,
    right: 25,
    backgroundColor: '#22c55e',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 4,
    transform: 'rotate(12deg)',
    borderWidth: 1.5,
    borderColor: '#16a34a',
    zIndex: 10,
  },
  paidBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  customerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  customerInfoCol: {
    width: '48%',
  },
  paymentInfoCol: {
    width: '48%',
  },
  sectionHeading: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  customerName: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#000000',
  },
  customerPhone: {
    fontSize: 8,
    color: '#6b7280',
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  paymentLabel: {
    fontSize: 8,
    color: '#6b7280',
    width: 75,
  },
  paymentValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#111827',
    flex: 1,
  },
  table: {
    width: '100%',
    marginBottom: 28,
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
    paddingVertical: 10,
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
    marginTop: 10,
  },
  termsBox: {
    width: '58%',
  },
  termsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  termsHighlight: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 6,
    lineHeight: 1.4,
  },
  termsText: {
    fontSize: 7,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  totalsBox: {
    width: '38%',
    flexDirection: 'column',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 8,
    color: '#4b5563',
  },
  totalValue: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#111827',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
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
    color: '#16a34a',
  },
  watermark: {
    position: 'absolute',
    top: 350,
    left: 120,
    fontSize: 120,
    color: '#22c55e',
    transform: 'rotate(-45deg)',
    zIndex: -1,
    opacity: 0.15,
  },
});

export const InvoicePDFDocument = ({ quote }: { quote: any }) => {
  const {
    id = '',
    customer_name = '',
    customer_mobile = '',
  } = quote || {};

  const createdAt = quote?.createdAt || quote?.created_at;
  const paidAt = quote?.paid_at || quote?.paidAt || quote?.payment_date || createdAt;

  const formatDate = (dateVal: any) => {
    if (!dateVal) return 'N/A';
    try {
      const d = typeof dateVal === 'object' && typeof dateVal?.toDate === 'function'
        ? dateVal.toDate()
        : new Date(dateVal);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
    } catch {
      return 'N/A';
    }
  };

  const createdDate = formatDate(createdAt) !== 'N/A' ? formatDate(createdAt) : new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: '2-digit' });
  const paidDate = formatDate(paidAt) !== 'N/A' ? formatDate(paidAt) : createdDate;

  const pricing = quote?.pricingSnapshot ? {
    total_payable: quote.pricingSnapshot.total_payable || 0,
    items: quote.pricingSnapshot.items || [],
    addons: quote.pricingSnapshot.addons || [],
    labor_cost: quote.pricingSnapshot.labor_cost || 0,
    gross_subtotal: quote.pricingSnapshot.gross_subtotal || 0,
    gst_rate: quote.pricingSnapshot.gst_rate || 18,
    gst_amount: quote.pricingSnapshot.gst_amount || 0,
  } : {
    total_payable: quote?.total_payable || 0,
    items: quote?.configuration_snapshot || [],
    addons: quote?.addons_snapshot || [],
    labor_cost: quote?.labor_cost || 0,
    gross_subtotal: quote?.gross_subtotal || 0,
    gst_rate: quote?.gst_rate || 18,
    gst_amount: quote?.gst_amount || 0,
  };

  const formatCurrency = (amount: number) => 'Rs. ' + (amount || 0).toLocaleString('en-IN');

  const totalGstRate = pricing.gst_rate || 18;
  const cgstRate = totalGstRate / 2;
  const sgstRate = totalGstRate / 2;
  const cgstAmount = Math.round(((pricing.gst_amount || 0) / 2) * 100) / 100;
  const sgstAmount = (pricing.gst_amount || 0) - cgstAmount;

  const invoiceRef = id ? `INV-${new Date().getFullYear()}-${id.substring(0, 6).toUpperCase()}` : `INV-${new Date().getFullYear()}-000000`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={styles.watermark}>PAID</Text>

        {/* Top-Right Stamp Badge */}
        <View style={styles.paidBadge}>
          <Text style={styles.paidBadgeText}>PAID</Text>
        </View>

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.logoText}>TEAM CCTV</Text>
            <Text style={styles.companyInfo}>Premium Security Solutions</Text>
            <Text style={styles.companyInfo}>GST Registration: Active</Text>
            <Text style={styles.companyInfo}>sales@teamcctv.com</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>TAX INVOICE</Text>
            <View style={styles.quoteMetaGrid}>
              <View style={styles.quoteMetaRow}>
                <Text style={styles.quoteMetaLabel}>Invoice Ref:</Text>
                <Text style={styles.quoteMetaValue}>{invoiceRef}</Text>
              </View>
              <View style={styles.quoteMetaRow}>
                <Text style={styles.quoteMetaLabel}>Invoice Date:</Text>
                <Text style={styles.quoteMetaValue}>{createdDate}</Text>
              </View>
              <View style={styles.quoteMetaRow}>
                <Text style={styles.quoteMetaLabel}>Status:</Text>
                <Text style={[styles.quoteMetaValue, { color: '#16a34a' }]}>PAID</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer and Payment Details Section */}
        <View style={styles.customerSection}>
          <View style={styles.customerInfoCol}>
            <Text style={styles.sectionHeading}>BILLED TO:</Text>
            <Text style={styles.customerName}>{customer_name || quote?.customerName || 'Customer'}</Text>
            <Text style={styles.customerPhone}>Phone: {customer_mobile || quote?.customerMobile || quote?.phone || 'N/A'}</Text>
          </View>
          <View style={styles.paymentInfoCol}>
            <Text style={styles.sectionHeading}>PAYMENT DETAILS:</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment ID:</Text>
              <Text style={styles.paymentValue}>{quote?.payment_id || quote?.paymentId || quote?.razorpay_payment_id || quote?.cf_payment_id || 'N/A'}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Method:</Text>
              <Text style={styles.paymentValue}>{quote?.payment_method || quote?.paymentMethod || 'Online Payment'}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Paid On:</Text>
              <Text style={styles.paymentValue}>{paidDate}</Text>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
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
                <Text style={styles.itemTitle}>{item.display_name || item.name}</Text>
                <Text style={styles.itemBrand}>Brand: {item.brand || 'TEAM CCTV'}</Text>
              </View>
              <Text style={[styles.colQty, styles.itemText]}>{item.qty}</Text>
              <Text style={[styles.colUnit, styles.itemText]}>{formatCurrency(item.unit_price || item.unitPrice || 0)}</Text>
              <Text style={[styles.colTotal, styles.itemText]}>{formatCurrency(item.line_total || item.lineTotal || ((item.unit_price || 0) * (item.qty || 1)))}</Text>
            </View>
          ))}

          {pricing.addons.map((addon: any, i: number) => (
            <View key={`addon-${i}`} style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.itemTitle}>{addon.display_name || addon.name}</Text>
                <Text style={styles.itemBrand}>Brand: Add-on</Text>
              </View>
              <Text style={[styles.colQty, styles.itemText]}>{addon.qty || 1}</Text>
              <Text style={[styles.colUnit, styles.itemText]}>{formatCurrency(addon.price || 0)}</Text>
              <Text style={[styles.colTotal, styles.itemText]}>{formatCurrency((addon.price || 0) * (addon.qty || 1))}</Text>
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
            <Text style={styles.termsTitle}>Terms & Confirmation</Text>
            <Text style={styles.termsHighlight}>
              Thank you for your payment! Installation will be scheduled within 48 hours.
            </Text>
            <Text style={styles.termsText}>1. Standard 1-Year Warranty on all hardware items unless specified otherwise.</Text>
            <Text style={styles.termsText}>2. 1-Year Free AMC (Annual Maintenance Contract) included covering 2 free service visits.</Text>
            <Text style={styles.termsText}>3. Our installation team will contact you shortly to coordinate site arrival time.</Text>
            <Text style={styles.termsText}>4. For any questions or support, please contact us at sales@teamcctv.com.</Text>
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
              <Text style={styles.totalLabel}>CGST ({cgstRate}%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(cgstAmount)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>SGST ({sgstRate}%):</Text>
              <Text style={styles.totalValue}>{formatCurrency(sgstAmount)}</Text>
            </View>

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total Paid:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(pricing.total_payable)}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
