import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { AppSettings } from '@/types';
import { ensurePdfFontsForLocale, normalizePdfLocale } from '@/lib/pdf/pdf-fonts-indic';
import { resolvePdfImageSrc } from '@/lib/pdf/pdf-image';
import { formatHardwarePackageTitle, getPdfLabels } from '@/lib/pdf/pdf-i18n';
import {
  calculateGstBreakup,
  cleanPdfItemName,
  computeRemainingMilestones,
  formatCleanAddress,
  formatDocNumber,
  formatPdfDate,
  formatPdfINR,
  getIndianStateCode,
} from '@/lib/pdf/pdf-helpers';
import { SPEECH_LOCALE_MAP } from '@/lib/i18n/mapping';

// Compact 1-page Tax Invoice / Payment Receipt layout
const styles = StyleSheet.create({
  page: {
    paddingTop: 18,
    paddingBottom: 28,
    paddingHorizontal: 22,
    fontFamily: 'Helvetica',
    fontSize: 8.2,
    color: '#0f172a',
    position: 'relative',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerLeft: {
    flexDirection: 'column',
    maxWidth: '55%',
  },
  headerLogo: {
    width: 132,
    height: 30,
    objectFit: 'contain',
    marginBottom: 3,
  },
  logoText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
    color: '#0f172a',
    letterSpacing: 0.4,
  },
  companyInfo: {
    fontSize: 7,
    color: '#64748b',
    lineHeight: 1.3,
  },
  headerRight: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    maxWidth: '45%',
  },
  statusBadge: {
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    borderRadius: 3,
    borderWidth: 0.8,
    marginBottom: 4,
    alignSelf: 'flex-end',
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 6.8,
    fontWeight: 'bold',
    letterSpacing: 0.6,
  },
  invoiceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3.5,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'right',
  },
  quoteMetaGrid: {
    flexDirection: 'column',
    alignItems: 'flex-end',
  },
  quoteMetaRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 1.5,
  },
  quoteMetaLabel: {
    color: '#64748b',
    fontSize: 7,
    marginRight: 6,
    textAlign: 'right',
  },
  quoteMetaValue: {
    fontSize: 7,
    fontWeight: 'bold',
    textAlign: 'right',
    color: '#0f172a',
  },
  packageStrip: {
    backgroundColor: '#f1f5f9',
    borderLeftWidth: 2.5,
    borderLeftColor: '#0f1f3d',
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    marginBottom: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  packageStripText: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  customerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
    padding: 6.5,
    backgroundColor: '#f8fafc',
    borderRadius: 4,
    borderWidth: 0.8,
    borderColor: '#e2e8f0',
  },
  customerInfoCol: {
    width: '51%',
    paddingRight: 8,
  },
  paymentInfoCol: {
    width: '49%',
    borderLeftWidth: 0.5,
    borderLeftColor: '#e2e8f0',
    paddingLeft: 8,
  },
  sectionHeading: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#64748b',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  customerName: {
    fontSize: 8.8,
    fontWeight: 'bold',
    marginBottom: 1.5,
    color: '#0f172a',
  },
  customerPhone: {
    fontSize: 7,
    color: '#475569',
    lineHeight: 1.28,
  },
  paymentRow: {
    flexDirection: 'row',
    marginBottom: 1.5,
  },
  paymentLabel: {
    fontSize: 7,
    color: '#64748b',
    width: 68,
  },
  paymentValue: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
  },
  table: {
    width: '100%',
    marginBottom: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  colDesc: { width: '44%', fontWeight: 'bold', paddingRight: 6 },
  colHsn: { width: '13%', textAlign: 'center', fontWeight: 'bold' },
  colGst: { width: '8%', textAlign: 'center', fontWeight: 'bold' },
  colQty: { width: '7%', textAlign: 'center', fontWeight: 'bold' },
  colUnit: { width: '13%', textAlign: 'right', fontWeight: 'bold' },
  colTotal: { width: '15%', textAlign: 'right', fontWeight: 'bold' },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e2e8f0',
  },
  itemTitle: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#0f172a',
    lineHeight: 1.25,
  },
  itemBrand: {
    fontSize: 6.2,
    color: '#64748b',
    marginTop: 0.5,
  },
  itemText: {
    fontSize: 7.3,
    color: '#334155',
  },
  bottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    gap: 10,
    alignItems: 'flex-start',
  },
  termsBox: {
    width: '57%',
  },
  termsTitle: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  termsHighlight: {
    fontSize: 6.8,
    fontWeight: 'bold',
    color: '#15803d',
    marginBottom: 2.5,
    lineHeight: 1.28,
  },
  termsText: {
    fontSize: 6.3,
    color: '#64748b',
    lineHeight: 1.28,
  },
  bankWrap: {
    marginTop: 4,
    paddingTop: 3.5,
    borderTopWidth: 0.5,
    borderTopColor: '#cbd5e1',
  },
  totalsBox: {
    width: '41%',
    flexDirection: 'column',
  },
  paymentHistoryBox: {
    marginTop: 5,
    borderTopWidth: 0.5,
    borderTopColor: '#cbd5e1',
    paddingTop: 4,
  },
  phTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  phRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 1.5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f1f5f9',
  },
  phColStage: { width: '38%', fontSize: 6.3, color: '#334155' },
  phColDate: { width: '24%', fontSize: 6.3, color: '#64748b' },
  phColMethod: { width: '18%', fontSize: 6.3, color: '#64748b' },
  phColAmount: { width: '20%', fontSize: 6.3, fontWeight: 'bold', textAlign: 'right', color: '#0f172a' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  totalLabel: {
    fontSize: 7.2,
    color: '#64748b',
  },
  totalValue: {
    fontSize: 7.2,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2.5,
    paddingTop: 3.5,
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  grandTotalLabel: {
    fontSize: 8.2,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  grandTotalValue: {
    fontSize: 9.8,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  watermark: {
    position: 'absolute',
    top: 310,
    left: 24,
    right: 24,
    fontSize: 54,
    fontWeight: 'bold',
    textAlign: 'center',
    transform: 'rotate(-30deg)',
    zIndex: -1,
    opacity: 0.06,
  },
  footerBar: {
    position: 'absolute',
    bottom: 8,
    left: 22,
    right: 22,
    borderTopWidth: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerMicroText: {
    fontSize: 6.3,
    color: '#94a3b8',
  },
  pageNum: {
    fontSize: 6.5,
    fontWeight: 'bold',
    color: '#64748b',
  },
});

/**
 * Derives the statutory Indian GST HSN (Goods) or SAC (Services) code.
 */
function getHsnSacCode(item: any): string {
  if (item?.hsn_code && String(item.hsn_code).trim().length > 0) return String(item.hsn_code).trim();
  if (item?.hsn && String(item.hsn).trim().length > 0) return String(item.hsn).trim();
  if (item?.sac_code && String(item.sac_code).trim().length > 0) return String(item.sac_code).trim();

  const name = String(item?.display_name || item?.name || item?.product_id || '').toLowerCase();
  const cat = String(item?.category || '').toLowerCase();

  if (
    cat === 'service' ||
    cat === 'labor' ||
    cat === 'amc' ||
    name.includes('labor') ||
    name.includes('installation') ||
    name.includes('fitting') ||
    name.includes('visit') ||
    name.includes('fee') ||
    name.includes('surcharge') ||
    name.includes('amc')
  ) {
    return '9987';
  }
  if (cat === 'cable' || name.includes('cable') || name.includes('wire') || name.includes('cat6') || name.includes('coaxial') || name.includes('patch cord')) {
    return '8544';
  }
  if (cat === 'recorder' || name.includes('nvr') || name.includes('dvr') || name.includes('xvr')) {
    return '8521';
  }
  if (cat === 'storage' || name.includes('hdd') || name.includes('hard disk') || name.includes('microsd') || name.includes('sd card') || name.includes('ssd')) {
    return '8471';
  }
  if (cat === 'power_device' || cat === 'power' || name.includes('power') || name.includes('smps') || name.includes('adapter') || name.includes('poe')) {
    return '8504';
  }
  if (cat === 'connector' || name.includes('connector') || name.includes('bnc') || name.includes('dc pin') || name.includes('rj45')) {
    return '8536';
  }
  if (cat === 'rack' || name.includes('rack') || name.includes('enclosure')) {
    return '8529';
  }
  return '8525';
}

export const InvoicePDFDocument = ({ quote, settings, locale }: { quote: any; settings?: AppSettings; locale?: string }) => {
  const {
    id = '',
    customer_name = '',
    customer_mobile = '',
  } = quote || {};

  const pdfLocale = normalizePdfLocale(locale ?? quote?.preferred_language ?? quote?.language ?? quote?.locale);
  const pdfFont = ensurePdfFontsForLocale(pdfLocale);
  const isEn = pdfLocale === 'en';
  const noUpper = isEn ? {} : { textTransform: 'none' as const, letterSpacing: 0 };
  const L = getPdfLabels(pdfLocale);
  const dateLocale = SPEECH_LOCALE_MAP[pdfLocale] || 'en-IN';

  const companyName = settings?.company_legal_name || settings?.company_name || "TEAM CCTV";
  const tagline = settings?.company_tagline || L.companyTagline;
  const sellerGstin = settings?.company_gstin && settings.company_gstin.trim().length > 0 ? settings.company_gstin.trim() : "";
  const sellerState = settings?.company_state || "Rajasthan";
  const sellerStateCode = getIndianStateCode(settings?.company_state_code || sellerState, sellerGstin, "08");
  const sellerEmail = settings?.company_email || "sales@teamcctv.com";
  const sellerPhone = settings?.company_phone ? ` | ${L.phoneShort}: ${settings.company_phone}` : "";
  const sellerWeb = settings?.company_website || "cctvquotation.com";

  const sellerAddress = formatCleanAddress(
    settings?.company_address_line1,
    settings?.company_address_line2,
    settings?.company_city,
    settings?.company_state ? `${settings.company_state}${settings.company_pincode ? ` - ${settings.company_pincode}` : ''}` : settings?.company_pincode
  );

  const createdAt = quote?.createdAt || quote?.created_at;
  const paidAt = quote?.paid_at || quote?.paidAt || quote?.payment_date || createdAt;
  const createdDate = formatPdfDate(createdAt, dateLocale, 'short') !== 'N/A'
    ? formatPdfDate(createdAt, dateLocale, 'short')
    : formatPdfDate(new Date(), dateLocale, 'short');
  const paidDate = formatPdfDate(paidAt, dateLocale, 'short') !== 'N/A'
    ? formatPdfDate(paidAt, dateLocale, 'short')
    : createdDate;

  // Support all BOM shapes: pricingSnapshot.items, pricingSnapshot.line_items, breakdown.items, quote.items, lineItems
  const rawItemsAll =
    (Array.isArray(quote?.pricingSnapshot?.items) && quote.pricingSnapshot.items.length > 0) ? quote.pricingSnapshot.items :
    (Array.isArray(quote?.pricingSnapshot?.line_items) && quote.pricingSnapshot.line_items.length > 0) ? quote.pricingSnapshot.line_items :
    (Array.isArray(quote?.pricingSnapshot?.breakdown?.items) && quote.pricingSnapshot.breakdown.items.length > 0) ? quote.pricingSnapshot.breakdown.items :
    (Array.isArray(quote?.items) && quote.items.length > 0) ? quote.items :
    (Array.isArray(quote?.line_items) && quote.line_items.length > 0) ? quote.line_items :
    (Array.isArray(quote?.lineItems) && quote.lineItems.length > 0) ? quote.lineItems :
    (Array.isArray(quote?.configuration_snapshot) && quote.configuration_snapshot.length > 0) ? quote.configuration_snapshot :
    [];

  // Filter out negative pseudo-items so discounts live in the summary block cleanly
  const rawItems = rawItemsAll.filter((it: any) => Number(it?.unit_price ?? it?.unitPrice ?? it?.price ?? 0) >= 0);
  const legacyNegDiscount = rawItemsAll
    .filter((it: any) => Number(it?.unit_price ?? it?.unitPrice ?? it?.price ?? 0) < 0)
    .reduce((s: number, it: any) => s + Math.abs(Number(it?.line_total ?? it?.lineTotal ?? (Number(it?.unit_price ?? it?.unitPrice ?? 0) * Number(it?.qty ?? it?.quantity ?? 1)))), 0);

  const rawAddons =
    (Array.isArray(quote?.pricingSnapshot?.addons) && quote.pricingSnapshot.addons.length > 0) ? quote.pricingSnapshot.addons :
    (Array.isArray(quote?.addons) && quote.addons.length > 0) ? quote.addons :
    (Array.isArray(quote?.selected_addons) && quote.selected_addons.length > 0) ? quote.selected_addons :
    (Array.isArray(quote?.addons_snapshot) && quote.addons_snapshot.length > 0) ? quote.addons_snapshot :
    [];

  const laborCost =
    Number(quote?.pricingSnapshot?.labor_cost || quote?.labor_cost || quote?.laborCost || 0);

  const hasExplicitLaborRow = rawItems.some((it: any) => {
    const t = String(it?.display_name || it?.name || '').toLowerCase();
    return t.includes('installation') || t.includes('labor');
  });

  const computedItemsSubtotal =
    rawItems.reduce((sum: number, it: any) => {
      const q = Number(it?.qty ?? it?.quantity ?? 1);
      const u = Number(it?.unit_price ?? it?.unitPrice ?? it?.price ?? 0);
      return sum + Number(it?.line_total ?? it?.lineTotal ?? it?.amount ?? q * u);
    }, 0) +
    rawAddons.reduce((sum: number, ad: any) => {
      const q = Number(ad?.qty ?? ad?.quantity ?? 1);
      const u = Number(ad?.price ?? ad?.unit_price ?? 0);
      return sum + Number(ad?.total ?? q * u);
    }, 0) +
    (!hasExplicitLaborRow && laborCost > 0 ? laborCost : 0);

  const rawTotalPayable = Number(
    quote?.pricingSnapshot?.total_payable ||
    quote?.total_payable ||
    quote?.totalPayable ||
    quote?.total ||
    quote?.amount ||
    0
  );

  const isSmartPayDiscount =
    quote?.payment_type === 'full_discount' ||
    quote?.payment_type === 'full_discounted' ||
    Number(quote?.full_payment_discount || 0) > 0;

  const isFullPaymentType =
    quote?.payment_type === 'full' || isSmartPayDiscount;

  const discountAmount = Math.max(
    legacyNegDiscount,
    Number(
      quote?.full_payment_discount ||
      quote?.negotiated_discount ||
      quote?.discount_amount ||
      quote?.pricingSnapshot?.discount_amount ||
      (isSmartPayDiscount && rawTotalPayable > 0
        ? (rawTotalPayable - (quote?.total_payable_after_discount || quote?.razorpay_order_amount || Math.round(rawTotalPayable * 0.98)))
        : 0) ||
      0
    )
  );

  const gstRate = Number(
    quote?.pricingSnapshot?.gst_rate ||
    quote?.gst_percent ||
    quote?.gstPercent ||
    quote?.gst_rate ||
    18
  );

  const storedNetTaxable = Number(
    quote?.pricingSnapshot?.net_taxable_amount ||
    quote?.pricingSnapshot?.gross_subtotal ||
    quote?.gross_subtotal ||
    quote?.subtotal ||
    0
  );

  const breakup = calculateGstBreakup({
    itemsSubtotalExTax: computedItemsSubtotal > 0 ? computedItemsSubtotal : storedNetTaxable,
    discountAmount,
    gstPercent: gstRate,
    storedTotalPayable: quote?.total_payable_after_discount && discountAmount > 0 ? undefined : rawTotalPayable,
    storedNetTaxable: storedNetTaxable > 0 ? storedNetTaxable : undefined,
    storedGstAmount: Number(quote?.pricingSnapshot?.gst_amount || quote?.gst_amount || 0),
    discountIsPostTax: isSmartPayDiscount,
  });

  const totalPayable =
    typeof quote?.total_payable_after_discount === 'number' && discountAmount > 0
      ? Math.round(quote.total_payable_after_discount)
      : breakup.totalPayable;

  // Authoritative payment & stage determination
  const rawPaid = Number(
    quote?.amount_paid ??
    quote?.paid_amount ??
    (quote?.payment_status === 'advance_paid' || quote?.status === 'BOOKED' ? (quote?.booking_amount || 500) : 0)
  );
  const amountPaid = isNaN(rawPaid) ? 0 : Math.max(0, Math.round(rawPaid));
  const payStatus = String(quote?.payment_status || '').toLowerCase();

  const isQuoteStatusPaid =
    quote?.status === 'PAID' ||
    quote?.status === 'COMPLETED' ||
    payStatus === 'paid' ||
    payStatus === 'captured';

  const isDeliveryPaid =
    payStatus === 'delivery_paid' ||
    (Array.isArray(quote?.payment_history) && quote.payment_history.some((p: any) => p.stage === 'delivery_90'));

  const isFullyPaid = totalPayable > 0 && (
    isQuoteStatusPaid ||
    isFullPaymentType ||
    (quote?.amount_due === 0 && amountPaid > 500) ||
    (amountPaid >= (totalPayable - 1) && quote?.status !== 'BOOKED' && payStatus !== 'advance_paid' && !isDeliveryPaid)
  );

  const isAdvancePaid = !isFullyPaid && !isDeliveryPaid && (
    amountPaid > 0 ||
    payStatus === 'advance_paid' ||
    quote?.status === 'BOOKED' ||
    String(quote?.payment_type || '').includes('advance')
  );

  const effectivePaid = isFullyPaid
    ? (amountPaid > 0 ? amountPaid : totalPayable)
    : (isDeliveryPaid || isAdvancePaid)
      ? (amountPaid > 0 ? amountPaid : 500)
      : 0;

  const milestones = computeRemainingMilestones({
    totalPayable,
    amountPaid: effectivePaid,
    paymentStatus: quote?.payment_status,
    explicitAmountDue: typeof quote?.amount_due === 'number' ? quote.amount_due : undefined,
    hasDeliveryPayment: isDeliveryPaid,
  });

  const pricing = {
    raw_total: rawTotalPayable || breakup.grossSubtotal + breakup.gstAmount,
    discount_amount: breakup.discountAmount,
    total_payable: totalPayable,
    amount_paid: effectivePaid,
    amount_due: milestones.amountDue,
    net_taxable: breakup.netTaxable,
    gst_rate: gstRate,
    gst_amount: breakup.gstAmount,
    cgst_amount: breakup.cgstAmount,
    sgst_amount: breakup.sgstAmount,
    items: rawItems,
    addons: rawAddons,
    labor_cost: laborCost,
  };

  const invoiceRef =
    quote?.invoice_number
      ? String(quote.invoice_number).toUpperCase()
      : formatDocNumber(id || quote?.quote_number, 'invoice', createdAt);

  // Buyer & Tax State Details
  const billing = quote?.billing_details || {};
  const isBusiness = Boolean(billing.is_business || quote?.company_name || quote?.gstin || quote?.gst_number);
  const rawContactName = billing.customer_name || billing.full_name || customer_name || quote?.customerName || quote?.customer?.name;
  const billedName = isBusiness
    ? (billing.company_name || quote?.company_name || rawContactName || 'Business Client')
    : (rawContactName || L.valuedCustomer);

  const contactPerson = isBusiness && rawContactName && rawContactName !== billedName ? rawContactName : '';
  const buyerGstin = billing.gstin || quote?.gstin || quote?.gst_number || L.unregisteredPerson;
  const phoneVal = billing.phone || customer_mobile || quote?.customerMobile || quote?.customer?.phone || 'N/A';
  const emailVal = billing.email || quote?.customer_email || quote?.customerEmail || quote?.customer?.email || '';

  const addressLine1 = formatCleanAddress(billing.address_line1 || billing.street || quote?.installationAddress);
  const buyerCity = billing.city || quote?.city || quote?.requirementSnapshot?.city || '';
  const buyerState = billing.state || quote?.state || sellerState;
  const buyerPin = billing.pincode || quote?.pincode || quote?.requirementSnapshot?.lead_pincode || '';
  const cityStateZip = formatCleanAddress(
    buyerCity,
    buyerState && buyerPin ? `${buyerState} ${buyerPin}` : (buyerState || buyerPin)
  );

  const stateCode = getIndianStateCode(
    billing.state_code || buyerState,
    billing.gstin || quote?.gstin || quote?.gst_number,
    sellerStateCode
  );
  const isInterState = stateCode !== sellerStateCode;
  const placeOfSupply = `${buyerState} (${stateCode})`;

  // Determine Visual Status / Titles (100% localized)
  let documentTitle = L.invoiceTitle;
  let badgeText = isEn ? 'PAID & SETTLED' : 'PAID (भुगतान पूर्ण)';
  let invoiceStatusColor = '#16a34a';
  let invoiceStatusBorder = '#15803d';
  let supplyTypeLabel = isBusiness ? 'B2B (GST Input Credit)' : (isEn ? 'B2C (Tax Invoice)' : 'B2C (टैक्स इनवॉइस)');
  let invoiceTypeDesc = isBusiness ? 'GST Input Credit Eligible' : (isEn ? 'Standard Tax Invoice' : 'स्टैंडर्ड टैक्स इनवॉइस');

  if (isDeliveryPaid) {
    documentTitle = L.deliveryReceiptTitle;
    badgeText = isEn ? 'DELIVERY PAID (90%)' : 'डिलीवरी PAID (90%)';
    invoiceStatusColor = '#0284c7';
    invoiceStatusBorder = '#0369a1';
    supplyTypeLabel = isEn ? 'B2C / Partial Stage 2' : 'B2C (डिलीवरी रसीद)';
    invoiceTypeDesc = `${L.deliveryPayment90} · ${L.amountPaidLabel}: ${formatPdfINR(pricing.amount_paid)}`;
  } else if (isAdvancePaid) {
    documentTitle = L.advanceReceiptTitle;
    badgeText = isEn ? 'ADVANCE PAID' : 'एडवांस PAID';
    invoiceStatusColor = '#d97706';
    invoiceStatusBorder = '#b45309';
    supplyTypeLabel = isEn ? 'B2C (Advance Receipt)' : 'B2C (बुकिंग टोकन रसीद)';
    invoiceTypeDesc = `${L.bookingAdvance500} (${formatPdfINR(pricing.amount_paid)})`;
  } else if (!isFullyPaid) {
    documentTitle = L.proformaTitle;
    badgeText = isEn ? 'UNPAID / PROFORMA' : 'PROFORMA / बकाया';
    invoiceStatusColor = '#64748b';
    invoiceStatusBorder = '#475569';
    supplyTypeLabel = 'B2C (Proforma)';
  } else if (pricing.discount_amount > 0 && isSmartPayDiscount) {
    invoiceTypeDesc = `${L.totalPayable} (${formatPdfINR(pricing.amount_paid)} - ${L.smartPayDiscountLabel})`;
  }

  const packageTitle = formatHardwarePackageTitle(quote);
  const totalRowCount = pricing.items.length + pricing.addons.length + (!hasExplicitLaborRow && laborCost > 0 ? 1 : 0);
  const rowPadV = totalRowCount > 11 ? 2.2 : totalRowCount > 8 ? 3 : 3.8;
  const hasHistory = Array.isArray(quote?.payment_history) && quote.payment_history.length > 0;

  return (
    <Document title={`${companyName} — ${documentTitle} #${invoiceRef}`}>
      <Page size="A4" style={[styles.page, { fontFamily: pdfFont }]}>
        {/* Watermark */}
        <Text style={[styles.watermark, noUpper, { color: invoiceStatusColor }]}>{badgeText}</Text>

        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {(() => {
              const resolvedLogo = resolvePdfImageSrc(settings?.pdf_logo_url || settings?.company_logo_url, '/logo-horizontal.jpg');
              return resolvedLogo ? (
                // eslint-disable-next-line jsx-a11y/alt-text
                <Image src={resolvedLogo} style={styles.headerLogo} />
              ) : (
                <Text style={styles.logoText}>{companyName}</Text>
              );
            })()}
            {tagline ? <Text style={styles.companyInfo}>{tagline}</Text> : null}
            {sellerAddress ? <Text style={styles.companyInfo}>{sellerAddress}</Text> : null}
            <Text style={styles.companyInfo}>
              {sellerGstin ? `${L.gstinPrefix}: ${sellerGstin}` : L.gstPending} | {sellerState} ({sellerStateCode})
            </Text>
            <Text style={styles.companyInfo}>{sellerEmail}{sellerPhone} | {sellerWeb}</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={[styles.statusBadge, { backgroundColor: invoiceStatusColor, borderColor: invoiceStatusBorder }]}>
              <Text style={[styles.statusBadgeText, noUpper]}>{badgeText}</Text>
            </View>
            <Text style={[styles.invoiceTitle, { color: invoiceStatusColor }, noUpper]}>{documentTitle}</Text>
            <View style={styles.quoteMetaGrid}>
              <View style={styles.quoteMetaRow}>
                <Text style={styles.quoteMetaLabel}>{L.invoiceNo}:</Text>
                <Text style={styles.quoteMetaValue}>{invoiceRef}</Text>
              </View>
              <View style={styles.quoteMetaRow}>
                <Text style={styles.quoteMetaLabel}>{L.dateIssued}:</Text>
                <Text style={styles.quoteMetaValue}>{createdDate}</Text>
              </View>
              <View style={styles.quoteMetaRow}>
                <Text style={styles.quoteMetaLabel}>{L.supplyTypeLabel}:</Text>
                <Text style={styles.quoteMetaValue}>{supplyTypeLabel}</Text>
              </View>
              <View style={styles.quoteMetaRow}>
                <Text style={styles.quoteMetaLabel}>{L.statusLabel}:</Text>
                <Text style={[styles.quoteMetaValue, { color: invoiceStatusColor }]}>
                  {isAdvancePaid || isDeliveryPaid
                    ? `${badgeText} (${formatPdfINR(pricing.amount_paid)})`
                    : badgeText}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Hardware Package Title Strip (AGENTS.md compliant) */}
        {packageTitle ? (
          <View style={styles.packageStrip}>
            <Text style={styles.packageStripText}>{packageTitle}</Text>
            <Text style={[styles.packageStripText, { color: '#15803d', fontSize: 6.8 }]}>{L.gstIncluded18}</Text>
          </View>
        ) : null}

        {/* Customer and Payment Details Section */}
        <View style={styles.customerSection}>
          <View style={styles.customerInfoCol}>
            <Text style={[styles.sectionHeading, noUpper]}>{L.billTo}:</Text>
            <Text style={styles.customerName}>{billedName}</Text>
            {contactPerson ? <Text style={styles.customerPhone}>Attn: {contactPerson}</Text> : null}
            <Text style={styles.customerPhone}>
              <Text style={{ fontWeight: 'bold' }}>{L.gstinPrefix}: </Text>{buyerGstin}
            </Text>
            <Text style={styles.customerPhone}>{L.placeOfSupplyLabel}: {placeOfSupply}</Text>
            {addressLine1 ? <Text style={styles.customerPhone}>{addressLine1}</Text> : null}
            {cityStateZip ? <Text style={styles.customerPhone}>{cityStateZip}</Text> : null}
            <Text style={styles.customerPhone}>
              {L.phoneShort}: {phoneVal}{emailVal ? ` | ${emailVal}` : ''}
            </Text>
          </View>

          <View style={styles.paymentInfoCol}>
            <Text style={[styles.sectionHeading, noUpper]}>{L.paymentMilestones}:</Text>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{L.paymentIdLabel}:</Text>
              <Text style={styles.paymentValue}>
                {quote?.payment_id || quote?.paymentId || quote?.razorpay_payment_id || quote?.cf_payment_id || (
                  isAdvancePaid
                    ? `ADVANCE-ONLINE (${formatPdfINR(pricing.amount_paid)})`
                    : isDeliveryPaid
                      ? `STAGE-2-PAID (${formatPdfINR(pricing.amount_paid)})`
                      : isFullyPaid
                        ? 'PAID (ONLINE)'
                        : 'PENDING'
                )}
              </Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{L.paymentMethodLabel}:</Text>
              <Text style={styles.paymentValue}>{quote?.payment_method || quote?.paymentMethod || 'Online / Razorpay'}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{L.dateIssued}:</Text>
              <Text style={styles.paymentValue}>{paidDate}</Text>
            </View>
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{L.receiptTypeLabel}:</Text>
              <Text style={styles.paymentValue}>{invoiceTypeDesc}</Text>
            </View>
          </View>
        </View>

        {/* Line Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>{L.itemDescription}</Text>
            <Text style={styles.colHsn}>HSN/SAC</Text>
            <Text style={styles.colGst}>GST</Text>
            <Text style={styles.colQty}>{L.qty}</Text>
            <Text style={styles.colUnit}>{L.unitPrice}</Text>
            <Text style={styles.colTotal}>{L.amount}</Text>
          </View>

          {pricing.items.map((item: any, i: number) => {
            const qty = Number(item?.qty ?? item?.quantity ?? 1);
            const unitPrice = Number(item?.unit_price ?? item?.unitPrice ?? item?.price ?? 0);
            const lineTotal = Number(item?.line_total ?? item?.lineTotal ?? item?.amount ?? unitPrice * qty);
            const itemTitle = cleanPdfItemName(item?.display_name || item?.name || 'Hardware Item');
            const brandStr = item?.brand ? `${L.brandLabel}: ${item.brand}` : cleanPdfItemName(item?.description || '');
            return (
              <View key={`item-${i}`} style={[styles.tableRow, { paddingVertical: rowPadV }]} wrap={false}>
                <View style={styles.colDesc}>
                  <Text style={styles.itemTitle}>{itemTitle}</Text>
                  {brandStr ? <Text style={styles.itemBrand}>{brandStr}</Text> : null}
                </View>
                <Text style={[styles.colHsn, styles.itemText]}>{getHsnSacCode(item)}</Text>
                <Text style={[styles.colGst, styles.itemText]}>{`${gstRate}%`}</Text>
                <Text style={[styles.colQty, styles.itemText]}>{qty}</Text>
                <Text style={[styles.colUnit, styles.itemText]}>{formatPdfINR(unitPrice)}</Text>
                <Text style={[styles.colTotal, styles.itemText, { fontWeight: 'bold' }]}>{formatPdfINR(lineTotal)}</Text>
              </View>
            );
          })}

          {pricing.addons.map((addon: any, i: number) => {
            const qty = Number(addon?.qty ?? addon?.quantity ?? 1);
            const price = Number(addon?.price ?? addon?.unit_price ?? 0);
            const lineTotal = Number(addon?.total ?? price * qty);
            return (
              <View key={`addon-${i}`} style={[styles.tableRow, { paddingVertical: rowPadV }]} wrap={false}>
                <View style={styles.colDesc}>
                  <Text style={styles.itemTitle}>{cleanPdfItemName(addon?.display_name || addon?.name || 'Addon Service')}</Text>
                </View>
                <Text style={[styles.colHsn, styles.itemText]}>{getHsnSacCode(addon)}</Text>
                <Text style={[styles.colGst, styles.itemText]}>{`${gstRate}%`}</Text>
                <Text style={[styles.colQty, styles.itemText]}>{qty}</Text>
                <Text style={[styles.colUnit, styles.itemText]}>{formatPdfINR(price)}</Text>
                <Text style={[styles.colTotal, styles.itemText, { fontWeight: 'bold' }]}>{formatPdfINR(lineTotal)}</Text>
              </View>
            );
          })}

          {!hasExplicitLaborRow && laborCost > 0 ? (
            <View style={[styles.tableRow, { paddingVertical: rowPadV }]} wrap={false}>
              <View style={styles.colDesc}>
                <Text style={styles.itemTitle}>{L.proInstall}</Text>
                <Text style={styles.itemBrand}>{L.serviceLabel}</Text>
              </View>
              <Text style={[styles.colHsn, styles.itemText]}>9987</Text>
              <Text style={[styles.colGst, styles.itemText]}>{`${gstRate}%`}</Text>
              <Text style={[styles.colQty, styles.itemText]}>1</Text>
              <Text style={[styles.colUnit, styles.itemText]}>{formatPdfINR(laborCost)}</Text>
              <Text style={[styles.colTotal, styles.itemText, { fontWeight: 'bold' }]}>{formatPdfINR(laborCost)}</Text>
            </View>
          ) : null}
        </View>

        {/* Bottom Section: Terms+Bank+History (Left) & Exact GST Totals (Right) */}
        <View style={styles.bottomSection} wrap={false}>
          <View style={styles.termsBox}>
            <Text style={styles.termsTitle}>{L.termsTitle}</Text>
            <Text style={[styles.termsHighlight, (isAdvancePaid || isDeliveryPaid) ? { color: invoiceStatusColor } : { color: '#16a34a' }]}>
              {pricing.amount_due > 0
                ? `${L.amountPaidLabel}: ${formatPdfINR(pricing.amount_paid)}  |  ${L.balanceDueLabel}: ${formatPdfINR(pricing.amount_due)}`
                : (pricing.discount_amount > 0 && isSmartPayDiscount
                    ? `${L.gstInclusiveBadge} (${L.smartPayDiscountLabel})`
                    : L.gstInclusiveBadge)}
            </Text>
            <Text style={styles.termsText}>1. {L.warranty1YrTitle}: {L.warranty1YrBody}</Text>
            <Text style={styles.termsText}>2. {L.supportTitle}: {L.supportBody}</Text>
            <Text style={styles.termsText}>3. {L.bookingAdvance500}: ₹500 · {L.deliveryPayment90} · {L.finalPayment10}</Text>

            {settings?.bank_account_no ? (
              <View style={styles.bankWrap}>
                <Text style={[styles.termsText, { fontWeight: 'bold', color: '#1f2937' }]}>
                  {L.bankDetailsTitle}: {settings.bank_name || 'Bank'} | A/c: {settings.bank_account_no} | IFSC: {settings.bank_ifsc || ''}
                </Text>
                <Text style={styles.termsText}>
                  {settings.bank_account_name || companyName}{settings.bank_upi_id ? ` | UPI: ${settings.bank_upi_id}` : ''}
                </Text>
              </View>
            ) : null}

            {hasHistory ? (
              <View style={styles.paymentHistoryBox}>
                <Text style={styles.phTitle}>{L.paymentHistoryTitle}</Text>
                {quote.payment_history.slice(0, 4).map((ph: any, idx: number) => {
                  const stageLabel =
                    ph.stage === 'booking'
                      ? L.bookingAdvance500
                      : ph.stage === 'delivery_90'
                        ? L.deliveryPayment90
                        : ph.stage === 'installation_final'
                          ? L.finalPayment10
                          : L.totalPayable;
                  const dateStr = formatPdfDate(ph.captured_at, dateLocale, 'short');
                  return (
                    <View key={idx} style={styles.phRow}>
                      <Text style={styles.phColStage}>{stageLabel}</Text>
                      <Text style={styles.phColDate}>{dateStr}</Text>
                      <Text style={styles.phColMethod}>{(ph.method || 'Online').toUpperCase()}</Text>
                      <Text style={styles.phColAmount}>{formatPdfINR(ph.amount)}</Text>
                    </View>
                  );
                })}
              </View>
            ) : null}
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>{L.taxableValue}:</Text>
              <Text style={styles.totalValue}>{formatPdfINR(pricing.net_taxable)}</Text>
            </View>

            {pricing.discount_amount > 0 && !isSmartPayDiscount ? (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#16a34a', fontWeight: 'bold' }]}>{L.discountApplied}:</Text>
                <Text style={[styles.totalValue, { color: '#16a34a' }]}>-{formatPdfINR(pricing.discount_amount)}</Text>
              </View>
            ) : null}

            {isInterState ? (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{`IGST (${gstRate}%):`}</Text>
                <Text style={styles.totalValue}>{formatPdfINR(pricing.gst_amount)}</Text>
              </View>
            ) : (
              <>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{`CGST (${gstRate / 2}%):`}</Text>
                  <Text style={styles.totalValue}>{formatPdfINR(pricing.cgst_amount)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{`SGST (${gstRate / 2}%):`}</Text>
                  <Text style={styles.totalValue}>{formatPdfINR(pricing.sgst_amount)}</Text>
                </View>
              </>
            )}

            {pricing.discount_amount > 0 && isSmartPayDiscount ? (
              <>
                <View style={[styles.totalRow, { borderTopWidth: 0.5, borderTopColor: '#e2e8f0', paddingTop: 2 }]}>
                  <Text style={styles.totalLabel}>{L.preDiscountTotal}:</Text>
                  <Text style={styles.totalValue}>{formatPdfINR(pricing.net_taxable + pricing.gst_amount)}</Text>
                </View>
                <View style={styles.totalRow}>
                  <Text style={[styles.totalLabel, { color: '#16a34a', fontWeight: 'bold' }]}>{L.smartPayDiscountLabel}:</Text>
                  <Text style={[styles.totalValue, { color: '#16a34a' }]}>-{formatPdfINR(pricing.discount_amount)}</Text>
                </View>
              </>
            ) : null}

            <View style={[styles.grandTotalRow, { paddingBottom: pricing.amount_due > 0 || pricing.amount_paid > 0 ? 3 : 0 }]}>
              <Text style={styles.grandTotalLabel}>{L.totalPayable}:</Text>
              <Text style={styles.grandTotalValue}>{formatPdfINR(pricing.total_payable)}</Text>
            </View>

            {pricing.amount_paid > 0 ? (
              <View style={[styles.totalRow, { marginTop: 3 }]}>
                <Text style={[styles.totalLabel, { color: invoiceStatusColor, fontWeight: 'bold' }]}>{L.amountPaidLabel}:</Text>
                <Text style={[styles.totalValue, { color: invoiceStatusColor }]}>{formatPdfINR(pricing.amount_paid)}</Text>
              </View>
            ) : null}

            {milestones.dueOnDelivery90 > 0 ? (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#dc2626', fontWeight: 'bold' }]}>{L.deliveryPayment90}:</Text>
                <Text style={[styles.totalValue, { color: '#dc2626' }]}>{formatPdfINR(milestones.dueOnDelivery90)}</Text>
              </View>
            ) : null}

            {milestones.dueOnInstall10 > 0 ? (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: '#b45309', fontWeight: 'bold' }]}>{L.finalPayment10}:</Text>
                <Text style={[styles.totalValue, { color: '#b45309' }]}>{formatPdfINR(milestones.dueOnInstall10)}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Pinned Micro Footer */}
        <View style={styles.footerBar} fixed>
          <Text style={styles.footerMicroText}>
            {L.computerGeneratedNote} | {companyName} ({sellerWeb}) | {sellerEmail}
          </Text>
          <Text
            style={styles.pageNum}
            render={({ pageNumber, totalPages }) => `${L.pageLabel} ${pageNumber} ${L.ofLabel} ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  );
};
