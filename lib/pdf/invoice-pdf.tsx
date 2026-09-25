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
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
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
    width: 95,
    textAlign: 'right',
  },
  paidBadge: {
    position: 'absolute',
    top: 20,
    right: 25,
    backgroundColor: '#22c55e',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    transform: 'rotate(8deg)',
    borderWidth: 1.5,
    borderColor: '#16a34a',
    zIndex: 10,
  },
  paidBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: 'bold',
    letterSpacing: 1,
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

  paymentHistoryBox: {
    marginTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  phTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 6,
  },
  phRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  phColStage: { width: '35%', fontSize: 8, color: '#374151' },
  phColDate: { width: '25%', fontSize: 8, color: '#6b7280' },
  phColMethod: { width: '20%', fontSize: 8, color: '#6b7280' },
  phColAmount: { width: '20%', fontSize: 8, fontWeight: 'bold', textAlign: 'right', color: '#111827' },

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
    top: 360,
    left: 40,
    right: 40,
    fontSize: 70,
    fontWeight: 'bold',
    textAlign: 'center',
    transform: 'rotate(-35deg)',
    zIndex: -1,
    opacity: 0.12,
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

  const rawItems = 
    (Array.isArray(quote?.pricingSnapshot?.items) && quote.pricingSnapshot.items.length > 0) ? quote.pricingSnapshot.items :
    (Array.isArray(quote?.items) && quote.items.length > 0) ? quote.items :
    (Array.isArray(quote?.line_items) && quote.line_items.length > 0) ? quote.line_items :
    (Array.isArray(quote?.lineItems) && quote.lineItems.length > 0) ? quote.lineItems :
    (Array.isArray(quote?.configuration_snapshot) && quote.configuration_snapshot.length > 0) ? quote.configuration_snapshot :
    [];

  const rawAddons = 
    (Array.isArray(quote?.pricingSnapshot?.addons) && quote.pricingSnapshot.addons.length > 0) ? quote.pricingSnapshot.addons :
    (Array.isArray(quote?.addons) && quote.addons.length > 0) ? quote.addons :
    (Array.isArray(quote?.selected_addons) && quote.selected_addons.length > 0) ? quote.selected_addons :
    (Array.isArray(quote?.addons_snapshot) && quote.addons_snapshot.length > 0) ? quote.addons_snapshot :
    [];

  const totalPayable = 
    quote?.pricingSnapshot?.total_payable || 
    quote?.total_payable || 
    quote?.totalPayable || 
    quote?.total || 
    quote?.amount || 
    0;

  const grossSubtotal = 
    quote?.pricingSnapshot?.gross_subtotal || 
    quote?.gross_subtotal || 
    quote?.subtotal || 
    (totalPayable > 0 ? Math.round(totalPayable / 1.18) : 0);

  const gstRate = 
    quote?.pricingSnapshot?.gst_rate || 
    quote?.gst_percent || 
    quote?.gstPercent || 
    quote?.gst_rate || 
    18;

  const gstAmount = 
    quote?.pricingSnapshot?.gst_amount || 
    quote?.gst_amount || 
    quote?.gstAmount || 
    Math.max(0, totalPayable - grossSubtotal);

  const laborCost = 
    quote?.pricingSnapshot?.labor_cost || 
    quote?.labor_cost || 
    quote?.laborCost || 
    0;

  // Authoritative Paid and Due calculation
  const rawPaid = Number(
    quote?.amount_paid ?? 
    quote?.paid_amount ?? 
    quote?.booking_amount ?? 
    (quote?.payment_status === 'advance_paid' || quote?.status === 'BOOKED' || String(quote?.payment_type || '').includes('advance') ? 500 : 0)
  );
  const amountPaid = isNaN(rawPaid) ? 0 : rawPaid;

  // Fully paid only if total is non-zero and amount paid covers the full total (with 1 rupee rounding tolerance)
  const isFullyPaid = totalPayable > 0 && amountPaid >= (totalPayable - 1) && quote?.status !== 'BOOKED' && quote?.payment_status !== 'advance_paid';
  
  // Advance/Partial paid if booking advance was paid (e.g. ₹500) but full total is not yet settled
  const isAdvancePaid = !isFullyPaid && (
    amountPaid > 0 || 
    quote?.payment_status === 'advance_paid' || 
    quote?.status === 'BOOKED' || 
    String(quote?.payment_type || '').includes('advance')
  );

  const effectivePaid = amountPaid > 0 ? amountPaid : (isAdvancePaid ? 500 : 0);

  const amountDue = isFullyPaid 
    ? 0 
    : (typeof quote?.amount_due === 'number' && quote.amount_due > 0 && quote.amount_due <= totalPayable
        ? quote.amount_due
        : Math.max(0, totalPayable - effectivePaid));

  const pricing = {
    total_payable: totalPayable,
    amount_paid: effectivePaid,
    amount_due: amountDue,
    items: rawItems,
    addons: rawAddons,
    labor_cost: laborCost,
    gross_subtotal: grossSubtotal,
    gst_rate: gstRate,
    gst_amount: gstAmount,
  };

  const formatCurrency = (amount: number) => 'Rs. ' + (Number(amount) || 0).toLocaleString('en-IN');

  const totalGstRate = pricing.gst_rate || 18;
  const cgstRate = totalGstRate / 2;
  const sgstRate = totalGstRate / 2;
  const cgstAmount = Math.round(((pricing.gst_amount || 0) / 2) * 100) / 100;
  const sgstAmount = Math.max(0, (pricing.gst_amount || 0) - cgstAmount);

  const invoiceRef = id ? `INV-${new Date().getFullYear()}-${id.substring(0, 6).toUpperCase()}` : `INV-${new Date().getFullYear()}-000000`;

  const billing = quote?.billing_details || {};
  const isBusiness = Boolean(billing.is_business || quote?.company_name || quote?.gstin || quote?.gst_number);
  const billedName = isBusiness 
    ? (billing.company_name || quote?.company_name || customer_name || 'Business Client')
    : (customer_name || quote?.customerName || quote?.customer?.name || 'Customer');

  const contactPerson = isBusiness && (customer_name || billing.customer_name) ? (customer_name || billing.customer_name) : '';
  const buyerGstin = billing.gstin || quote?.gstin || quote?.gst_number || 'URP (Unregistered Person)';
  const phoneVal = billing.phone || customer_mobile || quote?.customerMobile || quote?.customer?.phone || quote?.phone || 'N/A';
  const emailVal = billing.email || quote?.customer_email || quote?.email || '';

  const addressLine1 = billing.address_line1 || quote?.installationAddress || quote?.address?.full_address || quote?.address?.street || '';
  const cityStateZip = [
    billing.address_line2,
    billing.city || quote?.requirementSnapshot?.city || quote?.city,
    billing.state || 'Rajasthan',
    billing.pincode || quote?.requirementSnapshot?.lead_pincode || quote?.pincode
  ].filter(Boolean).join(', ');

  const stateCode = billing.state_code || (billing.gstin && billing.gstin.length >= 2 ? billing.gstin.substring(0, 2) : '08');
  const isInterState = stateCode !== '08';
  const placeOfSupply = `${billing.state || 'Rajasthan'} (${stateCode})`;

  // Authoritative document title, badges and status
  let documentTitle = 'TAX INVOICE';
  let badgeText = 'PAID';
  let invoiceStatusColor = '#16a34a';
  let invoiceStatusBorder = '#15803d';
  let supplyTypeLabel = isBusiness ? 'B2B (Tax Invoice)' : 'B2C (Retail Invoice)';
  let invoiceTypeDesc = isBusiness ? 'GST Input Credit Eligible' : 'Standard Retail Invoice';

  if (isAdvancePaid) {
    documentTitle = 'ADVANCE RECEIPT';
    badgeText = 'ADVANCE PAID';
    invoiceStatusColor = '#d97706'; // Amber / Warning
    invoiceStatusBorder = '#b45309';
    supplyTypeLabel = isBusiness ? 'B2B (Advance Booking Receipt)' : 'B2C (Advance Booking Receipt)';
    invoiceTypeDesc = `Booking Advance (₹${pricing.amount_paid.toLocaleString('en-IN')} Received - Balance Due on Delivery)`;
  } else if (!isFullyPaid) {
    documentTitle = 'PROFORMA INVOICE';
    badgeText = 'UNPAID';
    invoiceStatusColor = '#dc2626';
    invoiceStatusBorder = '#b91c1c';
    supplyTypeLabel = isBusiness ? 'B2B (Proforma Quotation)' : 'B2C (Proforma Quotation)';
    invoiceTypeDesc = 'Payment Pending';
  }

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        <Text style={[styles.watermark, { color: invoiceStatusColor }]}>{badgeText}</Text>

        {/* Top-Right Stamp Badge */}
        <View style={[styles.paidBadge, { backgroundColor: invoiceStatusColor, borderColor: invoiceStatusBorder }]}>
          <Text style={styles.paidBadgeText}>{badgeText}</Text>
        </View>

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.logoText}>TEAM CCTV</Text>
            <Text style={styles.companyInfo}>Security Systems & Surveillance Automation</Text>
            <Text style={styles.companyInfo}>GSTIN: 08AABCT1234A1ZS | State: Rajasthan (08)</Text>
            <Text style={styles.companyInfo}>Email: sales@teamcctv.com | Web: cctvquotation.com</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={[styles.invoiceTitle, { color: invoiceStatusColor }]}>{documentTitle}</Text>
            <View style={styles.quoteMetaGrid}>
              <View style={styles.quoteMetaRow}>
                <Text style={styles.quoteMetaLabel}>{isAdvancePaid ? 'Receipt Ref:' : 'Invoice Ref:'}</Text>
                <Text style={styles.quoteMetaValue}>{invoiceRef}</Text>
              </View>
              <View style={styles.quoteMetaRow}>
                <Text style={styles.quoteMetaLabel}>{isAdvancePaid ? 'Receipt Date:' : 'Invoice Date:'}</Text>
                <Text style={styles.quoteMetaValue}>{createdDate}</Text>
              </View>
              <View style={styles.quoteMetaRow}>
                <Text style={styles.quoteMetaLabel}>Supply Type:</Text>
                <Text style={styles.quoteMetaValue}>{supplyTypeLabel}</Text>
              </View>
              <View style={styles.quoteMetaRow}>
                <Text style={styles.quoteMetaLabel}>Status:</Text>
                <Text style={[styles.quoteMetaValue, { color: invoiceStatusColor }]}>
                  {isAdvancePaid ? `ADVANCE PAID (₹${pricing.amount_paid})` : badgeText}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Customer and Payment Details Section */}
        <View style={styles.customerSection}>
          <View style={styles.customerInfoCol}>
            <Text style={styles.sectionHeading}>BILLED TO (BUYER DETAILS):</Text>
            <Text style={styles.customerName}>{billedName}</Text>
            {contactPerson && isBusiness && (
              <Text style={styles.customerPhone}>Attn: {contactPerson}</Text>
            )}
            <Text style={styles.customerPhone}>
              <Text style={{ fontWeight: 'bold' }}>GSTIN: </Text>{buyerGstin}
            </Text>
            <Text style={styles.customerPhone}>Place of Supply: {placeOfSupply}</Text>
            {addressLine1 ? <Text style={styles.customerPhone}>{addressLine1}</Text> : null}
            {cityStateZip ? <Text style={styles.customerPhone}>{cityStateZip}</Text> : null}
            <Text style={styles.customerPhone}>Phone: {phoneVal} {emailVal ? `| ${emailVal}` : ''}</Text>
          </View>
          <View style={styles.paymentInfoCol}>
            <Text style={styles.sectionHeading}>PAYMENT DETAILS:</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment ID:</Text>
              <Text style={styles.paymentValue}>
                {quote?.payment_id || quote?.paymentId || quote?.razorpay_payment_id || quote?.cf_payment_id || (isAdvancePaid ? `ADVANCE-ONLINE (₹${pricing.amount_paid})` : (isFullyPaid ? 'PAID (ONLINE)' : 'PENDING'))}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Payment Method:</Text>
              <Text style={styles.paymentValue}>{quote?.payment_method || quote?.paymentMethod || 'Online / Razorpay'}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Paid On:</Text>
              <Text style={styles.paymentValue}>{paidDate}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>Receipt Type:</Text>
              <Text style={styles.paymentValue}>{invoiceTypeDesc}</Text>
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

          {pricing.items.map((item: any, i: number) => {
            const qty = item.qty || item.quantity || 1;
            const unitPrice = item.unit_price || item.unitPrice || item.price || 0;
            const lineTotal = item.line_total || item.lineTotal || item.amount || (unitPrice * qty);
            return (
              <View key={`item-${i}`} style={styles.tableRow}>
                <View style={styles.colDesc}>
                  <Text style={styles.itemTitle}>{item.display_name || item.name || 'Hardware Item'}</Text>
                  <Text style={styles.itemBrand}>{item.brand ? `Brand: ${item.brand}` : (item.description || 'TEAM CCTV Standard')}</Text>
                </View>
                <Text style={[styles.colQty, styles.itemText]}>{qty}</Text>
                <Text style={[styles.colUnit, styles.itemText]}>{formatCurrency(unitPrice)}</Text>
                <Text style={[styles.colTotal, styles.itemText]}>{formatCurrency(lineTotal)}</Text>
              </View>
            );
          })}

          {pricing.addons.map((addon: any, i: number) => {
            const qty = addon.qty || addon.quantity || 1;
            const price = addon.price || addon.unit_price || 0;
            const lineTotal = addon.total || (price * qty);
            return (
              <View key={`addon-${i}`} style={styles.tableRow}>
                <View style={styles.colDesc}>
                  <Text style={styles.itemTitle}>{addon.display_name || addon.name || 'Addon Service'}</Text>
                  <Text style={styles.itemBrand}>Brand: Add-on</Text>
                </View>
                <Text style={[styles.colQty, styles.itemText]}>{qty}</Text>
                <Text style={[styles.colUnit, styles.itemText]}>{formatCurrency(price)}</Text>
                <Text style={[styles.colTotal, styles.itemText]}>{formatCurrency(lineTotal)}</Text>
              </View>
            );
          })}

          {pricing.labor_cost > 0 && !pricing.items.some((it: any) => (it.display_name || it.name || '').toLowerCase().includes('installation') || (it.display_name || it.name || '').toLowerCase().includes('labor')) && (
            <View style={styles.tableRow}>
              <View style={styles.colDesc}>
                <Text style={styles.itemTitle}>Labor & Professional Installation</Text>
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
            <Text style={styles.termsTitle}>{isAdvancePaid ? 'Booking Confirmation Terms' : 'Terms & Confirmation'}</Text>
            <Text style={[styles.termsHighlight, isAdvancePaid ? { color: '#d97706' } : {}]}>
              {isAdvancePaid
                ? `Booking confirmed with ₹${pricing.amount_paid.toLocaleString('en-IN')} advance! Remaining balance of ${formatCurrency(pricing.amount_due)} is payable on delivery/installation.`
                : 'Thank you for your payment! Installation will be scheduled within 48 hours.'}
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
            {isInterState ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>IGST ({totalGstRate}%):</Text>
                <Text style={styles.totalValue}>{formatCurrency(pricing.gst_amount)}</Text>
              </View>
            ) : (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>CGST ({cgstRate}%):</Text>
                  <Text style={styles.totalValue}>{formatCurrency(cgstAmount)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>SGST ({sgstRate}%):</Text>
                  <Text style={styles.totalValue}>{formatCurrency(sgstAmount)}</Text>
                </View>
              </>
            )}

            <View style={[styles.grandTotalRow, { paddingBottom: 4, borderBottomWidth: pricing.amount_due > 0 ? 1 : 0, borderBottomColor: '#e5e7eb' }]}>
              <Text style={styles.grandTotalLabel}>Grand Total:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(pricing.total_payable)}</Text>
            </View>
            <View style={[styles.grandTotalRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 0 }]}>
              <Text style={[styles.grandTotalLabel, { color: isAdvancePaid ? '#d97706' : '#4b5563', fontSize: 9 }]}>
                {isAdvancePaid ? 'Booking Advance Paid:' : 'Amount Paid:'}
              </Text>
              <Text style={[styles.grandTotalValue, { color: isAdvancePaid ? '#d97706' : '#4b5563', fontSize: 10 }]}>
                {formatCurrency(pricing.amount_paid)}
              </Text>
            </View>
            {pricing.amount_due > 0 && (
              <View style={[styles.grandTotalRow, { marginTop: 4, paddingTop: 4, borderTopWidth: 0 }]}>
                <Text style={[styles.grandTotalLabel, { color: '#dc2626' }]}>Balance Due on Delivery:</Text>
                <Text style={[styles.grandTotalValue, { color: '#dc2626' }]}>{formatCurrency(pricing.amount_due)}</Text>
              </View>
            )}
          </View>
        </View>

        {quote?.payment_history && Array.isArray(quote.payment_history) && quote.payment_history.length > 0 && (
          <View style={styles.paymentHistoryBox}>
            <Text style={styles.phTitle}>Payment Stages Breakdown</Text>
            <View style={[styles.phRow, { backgroundColor: '#f9fafb', padding: 4 }]}>
              <Text style={[styles.phColStage, { fontWeight: 'bold' }]}>Payment Stage</Text>
              <Text style={[styles.phColDate, { fontWeight: 'bold' }]}>Date</Text>
              <Text style={[styles.phColMethod, { fontWeight: 'bold' }]}>Method</Text>
              <Text style={[styles.phColAmount, { fontWeight: 'bold' }]}>Amount</Text>
            </View>
            {quote.payment_history.map((ph: any, idx: number) => {
               const stageLabel = ph.stage === 'booking' ? 'Stage 1: Advance Booking' :
                                  ph.stage === 'delivery_90' ? 'Stage 2: Delivery Payment' :
                                  ph.stage === 'installation_final' ? 'Stage 3: Final Installation' : 
                                  'Full Payment';
               const dateStr = ph.captured_at ? new Date(ph.captured_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
               
               return (
                 <View key={idx} style={styles.phRow}>
                   <Text style={styles.phColStage}>{stageLabel}</Text>
                   <Text style={styles.phColDate}>{dateStr}</Text>
                   <Text style={styles.phColMethod}>{(ph.method || 'Online').toUpperCase()}</Text>
                   <Text style={styles.phColAmount}>{formatCurrency(ph.amount)}</Text>
                 </View>
               );
            })}
          </View>
        )}

      </Page>
    </Document>
  );
};




