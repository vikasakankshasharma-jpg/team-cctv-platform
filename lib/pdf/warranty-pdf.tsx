import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1d1d1f',
    position: 'relative',
    backgroundColor: '#ffffff'
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#10b981',
    paddingBottom: 20,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#047857',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 1,
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  infoCol: {
    width: '45%',
  },
  infoLabel: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 11,
    color: '#111827',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  table: {
    width: '100%',
    marginBottom: 30,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    padding: 8,
  },
  colProduct: { width: '40%' },
  colSerial: { width: '30%' },
  colTerm: { width: '15%', textAlign: 'center' },
  colExpiry: { width: '15%', textAlign: 'right' },
  headerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  cellText: {
    fontSize: 9,
    color: '#1f2937',
  },
  termsBox: {
    marginTop: 40,
    padding: 15,
    backgroundColor: '#f9fafb',
    borderRadius: 4,
  },
  termsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
  },
  termsText: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  sealBox: {
    position: 'absolute',
    right: 40,
    top: 150,
    opacity: 0.1,
    transform: 'rotate(-15deg)'
  },
  sealText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: '#10b981',
  }
});

interface WarrantyPDFProps {
  certificate: any;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
}

export const WarrantyPDF = ({ certificate, customerName, customerPhone, customerAddress }: WarrantyPDFProps) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Background Seal */}
        <View style={styles.sealBox}>
          <Text style={styles.sealText}>WARRANTY</Text>
        </View>

        <View style={styles.headerRow}>
          <View>
            <Text style={styles.logoText}>TEAM CCTV</Text>
            <Text style={{ fontSize: 9, color: '#4b5563' }}>Professional Security Solutions</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>Certificate: {certificate.certNumber}</Text>
            <Text style={{ fontSize: 9, color: '#6b7280', marginTop: 4 }}>Date: {formatDate(certificate.issuedAt)}</Text>
          </View>
        </View>

        <Text style={styles.titleText}>OFFICIAL WARRANTY CERTIFICATE</Text>

        <View style={styles.infoSection}>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Issued To</Text>
            <Text style={styles.infoValue}>{customerName}</Text>
            <Text style={{ fontSize: 9, color: '#4b5563', marginBottom: 2 }}>{customerPhone}</Text>
            <Text style={{ fontSize: 9, color: '#4b5563' }}>{customerAddress}</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.infoLabel}>Installation Details</Text>
            <Text style={styles.infoValue}>Job ID: {certificate.jobId}</Text>
            <Text style={{ fontSize: 9, color: '#4b5563', marginBottom: 2 }}>
              Installation Date: {formatDate(certificate.installationDate)}
            </Text>
            <Text style={{ fontSize: 9, color: '#4b5563' }}>
              Status: {certificate.status}
            </Text>
          </View>
        </View>

        {/* Annexure A: Schedule of Equipment */}
        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 10, color: '#111827' }}>
          Annexure A - Covered Equipment Schedule
        </Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.colProduct, styles.headerText]}>Product Name / SKU</Text>
            <Text style={[styles.colSerial, styles.headerText]}>Serial Number</Text>
            <Text style={[styles.colTerm, styles.headerText]}>Term</Text>
            <Text style={[styles.colExpiry, styles.headerText]}>Expiry Date</Text>
          </View>
          
          {certificate.assets.map((asset: any, idx: number) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={[styles.colProduct, styles.cellText]}>
                {asset.productName || asset.skuId || "CCTV Equipment"}
              </Text>
              <Text style={[styles.colSerial, styles.cellText]}>
                {asset.serialNumber || "N/A"}
              </Text>
              <Text style={[styles.colTerm, styles.cellText]}>
                {asset.warrantyMonths} Mo
              </Text>
              <Text style={[styles.colExpiry, styles.cellText]}>
                {formatDate(asset.warrantyEndDate)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.termsBox}>
          <Text style={styles.termsTitle}>Terms & Conditions of Warranty</Text>
          <Text style={styles.termsText}>
            1. This warranty covers manufacturing defects and hardware failures under normal use.{"\n"}
            2. Warranty does not cover damage caused by lightning, physical damage, water ingress (for indoor rated equipment), or unauthorized tampering.{"\n"}
            3. To claim warranty service, please present this certificate or quote the Certificate Number to our support team.{"\n"}
            4. Service visits after the initial 1-year free service period may incur standard visiting charges, even if the hardware replacement is covered under this extended warranty.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>TEAM CCTV - Authorized Warranty Document</Text>
          <Text style={styles.footerText}>Generated Automatically</Text>
        </View>
      </Page>
    </Document>
  );
};
