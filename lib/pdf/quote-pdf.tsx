import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { QuoteSnapshot, PricingResult, QuoteLineItem } from '@/types';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 12,
    color: '#1d1d1f',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 40,
    borderBottom: '1 solid #e5e5ea',
    paddingBottom: 20,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0066cc',
  },
  quoteInfo: {
    textAlign: 'right',
    color: '#86868b',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  greeting: {
    marginBottom: 20,
  },
  highlightBox: {
    backgroundColor: '#f5f5f7',
    padding: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  highlightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#0066cc',
  },
  bulletPoint: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  bulletText: {
    marginLeft: 10,
  },
  totalPriceBox: {
    marginTop: 20,
    alignItems: 'center',
    padding: 20,
    borderTop: '1 solid #e5e5ea',
  },
  totalPriceText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1d1d1f',
  },
  planTag: {
    marginTop: 10,
    backgroundColor: '#e5f0ff',
    color: '#0066cc',
    padding: '4 12',
    borderRadius: 12,
    fontSize: 10,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 30,
    marginBottom: 15,
    borderBottom: '1 solid #e5e5ea',
    paddingBottom: 5,
  },
  configItem: {
    marginBottom: 15,
  },
  configLabel: {
    fontWeight: 'bold',
    color: '#86868b',
    fontSize: 10,
    marginBottom: 2,
  },
  configValue: {
    fontSize: 12,
  },
  table: {
    width: '100%',
    marginTop: 20,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottom: '1 solid #e5e5ea',
    paddingVertical: 8,
  },
  tableHeader: {
    fontWeight: 'bold',
    color: '#86868b',
  },
  col1: { width: '50%' },
  col2: { width: '15%', textAlign: 'center' },
  col3: { width: '35%', textAlign: 'right' },
  tableTotalRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    marginTop: 10,
  },
  tableTotalLabel: {
    width: '65%',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  tableTotalValue: {
    width: '35%',
    textAlign: 'right',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#86868b',
    fontSize: 9,
    borderTop: '1 solid #e5e5ea',
    paddingTop: 10,
  },
});

export const QuotePDFDocument = ({ quote }: { quote: QuoteSnapshot }) => {
  const { 
    id, 
    customer_name, 
    customer_mobile, 
    requirementSnapshot: req, 
    pricingSnapshot: pricing,
    selectedPlan,
    validUntil
  } = quote;

  const validDate = new Date(validUntil).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  const createdDate = new Date(quote.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });

  // Format currency
  const formatCurrency = (amount: number) => `Rs. ${amount.toLocaleString('en-IN')}`;

  return (
    <Document>
      {/* Page 1: Executive Quote */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>TEAM CCTV</Text>
          <View style={styles.quoteInfo}>
            <Text>Quotation: {id}</Text>
            <Text>Date: {createdDate}</Text>
            <Text>Valid Until: {validDate}</Text>
          </View>
        </View>

        <View style={styles.greeting}>
          <Text>Hi {customer_name || 'Customer'},</Text>
        </View>

        <Text style={styles.title}>Your {selectedPlan.charAt(0).toUpperCase() + selectedPlan.slice(1)} CCTV System</Text>

        <View style={styles.highlightBox}>
          <Text style={styles.highlightTitle}>System Highlights</Text>
          <View style={styles.bulletPoint}>
            <Text>•</Text>
            <Text style={styles.bulletText}>{req.camera_count} × Cameras ({req.technology_preference || 'IP'})</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text>•</Text>
            <Text style={styles.bulletText}>{req.recording_days === 0 ? 'Live Viewing Only' : `${req.recording_days} Days Recording`}</Text>
          </View>
          <View style={styles.bulletPoint}>
            <Text>•</Text>
            <Text style={styles.bulletText}>{req.wants_remote_viewing ? 'Mobile Viewing Included' : 'Local Viewing Only'}</Text>
          </View>
        </View>

        <View style={styles.totalPriceBox}>
          <Text style={styles.totalPriceText}>{formatCurrency(pricing.total_payable)}</Text>
          <Text style={styles.planTag}>{selectedPlan.toUpperCase()} PLAN</Text>
        </View>

        <Text style={styles.footer}>TEAM CCTV • +91 9876543210 • info@teamcctv.com</Text>
      </Page>

      {/* Page 2: System Configuration */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>System Configuration</Text>
        
        <View style={styles.configItem}>
          <Text style={styles.configLabel}>CAMERAS</Text>
          {pricing.items.filter((item: any) => item.product_id.includes('cam')).map((cam: any, i: number) => (
             <Text key={i} style={styles.configValue}>{cam.qty} × {cam.display_name}</Text>
          ))}
        </View>

        <View style={styles.configItem}>
          <Text style={styles.configLabel}>RECORDER</Text>
          {pricing.items.filter((item: any) => item.product_id.includes('dvr') || item.product_id.includes('nvr')).map((rec: any, i: number) => (
             <Text key={i} style={styles.configValue}>{rec.qty} × {rec.display_name}</Text>
          ))}
        </View>

        <View style={styles.configItem}>
          <Text style={styles.configLabel}>STORAGE</Text>
          {pricing.items.filter((item: any) => item.product_id.includes('hdd')).map((hdd: any, i: number) => (
             <Text key={i} style={styles.configValue}>{hdd.qty} × {hdd.display_name}</Text>
          ))}
        </View>

        <View style={styles.configItem}>
          <Text style={styles.configLabel}>CABLING & POWER</Text>
          <Text style={styles.configValue}>High-quality surveillance grade cables and power supplies included.</Text>
        </View>

        <View style={styles.configItem}>
          <Text style={styles.configLabel}>INSTALLATION</Text>
          <Text style={styles.configValue}>Professional installation and setup by certified technicians.</Text>
        </View>

        <Text style={styles.footer}>Quotation: {id} • TEAM CCTV</Text>
      </Page>

      {/* Page 3: BOQ + Terms */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Bill of Quantities (BOQ)</Text>
        
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.col1}>Item Description</Text>
            <Text style={styles.col2}>Qty</Text>
            <Text style={styles.col3}>Amount</Text>
          </View>
          
          {pricing.items.map((item: any, i: number) => (
            <View key={i} style={styles.tableRow}>
              <Text style={styles.col1}>{item.display_name}</Text>
              <Text style={styles.col2}>{item.qty}</Text>
              <Text style={styles.col3}>{formatCurrency(item.line_total)}</Text>
            </View>
          ))}

          {pricing.addons.map((addon: any, i: number) => (
            <View key={`addon-${i}`} style={styles.tableRow}>
              <Text style={styles.col1}>{addon.display_name}</Text>
              <Text style={styles.col2}>{addon.qty || 1}</Text>
              <Text style={styles.col3}>{formatCurrency(addon.price * (addon.qty || 1))}</Text>
            </View>
          ))}

          <View style={styles.tableRow}>
            <Text style={styles.col1}>Labor & Installation</Text>
            <Text style={styles.col2}>1</Text>
            <Text style={styles.col3}>{formatCurrency(pricing.labor_cost)}</Text>
          </View>

          <View style={styles.tableTotalRow}>
            <Text style={styles.tableTotalLabel}>Subtotal:</Text>
            <Text style={styles.tableTotalValue}>{formatCurrency(pricing.gross_subtotal)}</Text>
          </View>
          <View style={styles.tableTotalRow}>
            <Text style={styles.tableTotalLabel}>GST ({pricing.gst_rate}%):</Text>
            <Text style={styles.tableTotalValue}>{formatCurrency(pricing.gst_amount)}</Text>
          </View>
          <View style={styles.tableTotalRow}>
            <Text style={styles.tableTotalLabel}>Total Payable:</Text>
            <Text style={[styles.tableTotalValue, { color: '#0066cc', fontSize: 16 }]}>{formatCurrency(pricing.total_payable)}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Terms & Conditions</Text>
        <View style={{ fontSize: 10, color: '#86868b' }}>
          <Text style={{ marginBottom: 4 }}>1. Warranty: Standard 1-year warranty on all electronic equipment.</Text>
          <Text style={{ marginBottom: 4 }}>2. Payment: 50% advance, balance upon completion of installation.</Text>
          <Text style={{ marginBottom: 4 }}>3. Validity: This quotation is valid until {validDate}.</Text>
          <Text style={{ marginBottom: 4 }}>4. Exclusions: Civil work, core cutting, or conduit piping not explicitly mentioned are excluded.</Text>
        </View>

        <Text style={styles.footer}>Quotation: {id} • TEAM CCTV</Text>
      </Page>
    </Document>
  );
};
