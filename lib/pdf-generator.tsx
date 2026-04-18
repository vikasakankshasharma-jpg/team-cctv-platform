import React from 'react';
import { Page, Text, View, Document, StyleSheet, Font } from '@react-pdf/renderer';
import type { PricingResult, Lead, AppSettings } from '@/types';

// Register a more modern font if possible, or stick to Helvetica/Bold for stability
// Font.register({ family: 'Inter', src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff' });

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
    backgroundColor: '#ffffff',
  },
  // Header section with Blue accent
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottom: '2px solid #2563eb',
    paddingBottom: 16,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e3a8a', // Deep Blue
    letterSpacing: 1,
  },
  brandSlogan: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  headerMeta: {
    textAlign: 'right',
  },
  quoteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 2,
  },
  quoteSub: {
    fontSize: 9,
    color: '#64748b',
  },

  // Customer & Info Grid
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 20,
  },
  infoCol: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    border: '1px solid #f1f5f9',
  },
  infoLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  infoValue: {
    fontSize: 11,
    color: '#1e293b',
    fontWeight: 'bold',
  },

  // Table
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 8,
    paddingLeft: 4,
    borderLeft: '4px solid #3b82f6',
  },
  table: {
    width: '100%',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1px solid #f1f5f9',
    padding: 10,
    alignItems: 'center',
  },
  colDesc: { flex: 4, fontSize: 10, color: '#334155' },
  colQty: { flex: 1, fontSize: 10, color: '#475569', textAlign: 'center' },
  colRate: { flex: 1.5, fontSize: 10, color: '#475569', textAlign: 'right' },
  colTotal: { flex: 1.5, fontSize: 10, color: '#0f172a', fontWeight: 'bold', textAlign: 'right' },
  headerCol: { fontWeight: 'bold', color: '#64748b', fontSize: 9, textTransform: 'uppercase' },

  // Summary Card
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  summaryCard: {
    width: '45%',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    border: '1px solid #e2e8f0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summLabel: { fontSize: 10, color: '#64748b' },
  summVal: { fontSize: 10, color: '#334155', fontWeight: 'bold' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTop: '2px solid #e2e8f0',
  },
  totalLabel: { fontSize: 14, fontWeight: 'bold', color: '#0f172a' },
  totalVal: { fontSize: 16, fontWeight: 'bold', color: '#2563eb' },

  // Professional Sections
  professionalBlock: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#fffdfa',
    border: '1px solid #fed7aa',
    borderRadius: 8,
  },
  blockTitle: { fontSize: 10, fontWeight: 'bold', color: '#9a3412', marginBottom: 6 },
  blockText: { fontSize: 9, color: '#7c2d12', lineHeight: 1.4 },

  footer: {
    position: 'absolute',
    bottom: 15,
    left: 30,
    right: 30,
    paddingTop: 8,
    borderTop: '1px solid #e2e8f0',
    textAlign: 'center',
  },
  footerText: {
    fontSize: 8,
    color: '#94a3b8',
    marginBottom: 2,
  }
});

interface QuotePDFProps {
  quote: PricingResult;
  lead: Lead;
  settings: AppSettings;
  quoteId: string;
  sharedToNumber?: string;  // Secondary recipient number for WhatsApp share
}

export function QuotePDFDocument({ quote, lead, settings, quoteId, sharedToNumber }: QuotePDFProps) {
  const dateStr = new Date().toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric'
  });

  return (
    <Document title={`TEAM_CCTV_Quote_${quoteId}`}>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>{settings.company_name}</Text>
            <Text style={styles.brandSlogan}>Professional Security Infrastructure</Text>
          </View>
          <View style={styles.headerMeta}>
            <Text style={styles.quoteTitle}>QUOTATION</Text>
            <Text style={styles.quoteSub}>#{quoteId.toUpperCase().slice(0, 8)}</Text>
            <Text style={[styles.quoteSub, { marginTop: 4 }]}>Date: {dateStr}</Text>
          </View>
        </View>

        {/* Customer & Project Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Prepared For</Text>
            <Text style={styles.infoValue}>{lead.customer_name}</Text>
            <Text style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>+91 {lead.mobile_number}</Text>
            {lead.address && (
              <View style={{ marginTop: 6, borderTop: '1px solid #e2e8f0', paddingTop: 6 }}>
                <Text style={{ fontSize: 8, color: '#475569', fontWeight: 'bold' }}>SITE ADDRESS:</Text>
                <Text style={{ fontSize: 8, color: '#64748b' }}>{lead.address.pincode}, {lead.address.full_address}</Text>
                <Text style={{ fontSize: 7, color: '#888' }}>Landmark: {lead.address.landmark1}</Text>
                <Text style={{ fontSize: 7, color: '#94a3b8' }}>{lead.address.landmark2}</Text>
                <Text style={{ fontSize: 7, color: '#cbd5e1', marginTop: 2 }}>GPS: {lead.address.coordinates.lat.toFixed(4)}, {lead.address.coordinates.lng.toFixed(4)}</Text>
              </View>
            )}
            {!lead.address && <Text style={{ fontSize: 9, color: '#64748b' }}>{lead.property_type.toUpperCase()} Setup</Text>}
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>System Details</Text>
            <Text style={styles.infoValue}>{quote.technology} Surveillance</Text>
            <Text style={{ fontSize: 9, color: '#64748b', marginTop: 4 }}>Level: {quote.plan_type.toUpperCase()}</Text>
            <Text style={{ fontSize: 9, color: '#64748b' }}>Setup: {lead.property_type.toUpperCase()}</Text>
          </View>
        </View>

        {/* Main Hardware Table */}
        <Text style={styles.sectionTitle}>Hardware & Core Components</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colDesc, styles.headerCol]}>Description</Text>
            <Text style={[styles.colQty, styles.headerCol]}>Qty</Text>
            <Text style={[styles.colRate, styles.headerCol]}>Rate</Text>
            <Text style={[styles.colTotal, styles.headerCol]}>Amount</Text>
          </View>
          
          {quote.items.map((item, i) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.display_name}</Text>
              <Text style={styles.colQty}>{item.qty}</Text>
              <Text style={styles.colRate}>₹{item.unit_price.toLocaleString('en-IN')}</Text>
              <Text style={styles.colTotal}>₹{item.line_total.toLocaleString('en-IN')}</Text>
            </View>
          ))}

          {/* Add-ons in same table for cleaner look */}
          {quote.addons.map((addon, i) => (
            <View key={`addon-${i}`} style={[styles.tableRow, { backgroundColor: '#fcfcfc' }]}>
              <Text style={[styles.colDesc, { color: '#2563eb', fontWeight: 'bold' }]}>
                Add-on: {addon.display_name}
              </Text>
              <Text style={styles.colQty}>{addon.qty || 1}</Text>
              <Text style={styles.colRate}>₹{(addon.price / (addon.qty || 1)).toLocaleString('en-IN')}</Text>
              <Text style={styles.colTotal}>₹{addon.price.toLocaleString('en-IN')}</Text>
            </View>
          ))}
        </View>

        {/* Financial Summary Box */}
        <View style={styles.summaryContainer} wrap={false}>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summLabel}>Hardware Subtotal</Text>
              <Text style={styles.summVal}>₹{quote.base_hardware_cost.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summLabel}>Installation & Labor</Text>
              <Text style={styles.summVal}>₹{quote.labor_cost.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summLabel}>Estimated Cabling</Text>
              <Text style={styles.summVal}>₹{quote.cabling_cost.toLocaleString('en-IN')}</Text>
            </View>
            {quote.referral_discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summLabel, { color: '#16a34a' }]}>Referral Discount</Text>
                <Text style={[styles.summVal, { color: '#16a34a' }]}>-₹{quote.referral_discount.toLocaleString('en-IN')}</Text>
              </View>
            )}
            <View style={[styles.summaryRow, { marginTop: 8, paddingTop: 8, borderTop: '1px solid #e2e8f0' }]}>
              <Text style={styles.summLabel}>GST ({quote.gst_rate}%)</Text>
              <Text style={styles.summVal}>₹{quote.gst_amount.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Grand Total</Text>
              <Text style={styles.totalVal}>₹{quote.total_payable.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Professional T&C and Bank Details */}
        <View style={styles.infoGrid} wrap={false}>
          <View style={[styles.infoCol, { backgroundColor: '#fff' }]}>
            <Text style={styles.infoLabel}>Terms & Conditions</Text>
            <Text style={[styles.blockText, { fontSize: 8 }]}>
              1. 10% as an advance.{"\n"}
              2. 80% at the time of material received at Site and before starting Installation work.{"\n"}
              3. Remaining 10% after completion of work and handover the Site.{"\n"}
              4. 1-Year Comprehensive On-Site Warranty.{"\n"}
              5. Validity: 10 Days from {dateStr}.
            </Text>
          </View>
          <View style={[styles.infoCol, { backgroundColor: '#fff' }]}>
            <Text style={styles.infoLabel}>Bank / Payment Details</Text>
            <Text style={[styles.blockText, { fontSize: 8 }]}>
              A/c Name: TEAM CCTV SOLUTIONS{"\n"}
              A/c No: 098712345678 (HDFC BANK){"\n"}
              IFSC: HDFC0001234{"\n"}
              UPI ID: teamcctv@okhdfc
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          {sharedToNumber && (
            <View style={{ marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid #e2e8f0' }}>
              <Text style={[styles.footerText, { color: '#2563eb', fontWeight: 'bold', fontSize: 9 }]}>
                This quote was also shared with: +91 {sharedToNumber}
              </Text>
            </View>
          )}
          <Text style={styles.footerText}>Thank you for choosing {settings.company_name} for your security needs.</Text>
          <Text style={[styles.footerText, { fontSize: 7 }]}>
            This is a computer-generated quotation and does not require a physical signature.
          </Text>
        </View>

      </Page>
    </Document>
  );
}
