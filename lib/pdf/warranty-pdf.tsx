import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register fonts for a more formal certificate look
Font.register({
  family: 'Times-Roman',
  src: 'https://fonts.cdnfonts.com/s/15392/TimesNewRoman.woff'
});

const emerald = '#047857';
const lightEmerald = '#d1fae5';

// Create styles
const styles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: '#1f2937',
    backgroundColor: '#ffffff'
  },
  topBar: {
    height: 15,
    backgroundColor: emerald,
    width: '100%',
  },
  contentWrap: {
    padding: 40,
    paddingTop: 30,
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 40,
  },
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoShield: {
    width: 24,
    height: 28,
    backgroundColor: emerald,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: emerald,
    letterSpacing: 1,
  },
  certInfo: {
    alignItems: 'flex-end',
  },
  titleWrap: {
    alignItems: 'center',
    marginBottom: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 20,
    position: 'relative',
  },
  titleText: {
    fontSize: 28,
    fontFamily: 'Times-Roman',
    color: '#111827',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  subtitleText: {
    fontSize: 12,
    fontFamily: 'Times-Roman',
    color: '#6b7280',
    marginTop: 5,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  
  // Simulated Gold/Green Seal
  sealBox: {
    position: 'absolute',
    right: 0,
    top: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fbbf24', // Gold
    borderWidth: 4,
    borderColor: emerald,
    alignItems: 'center',
    justifyContent: 'center',
    transform: 'rotate(-10deg)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
  },
  sealText1: { fontSize: 8, color: emerald, fontWeight: 'bold' },
  sealText2: { fontSize: 16, color: emerald, fontWeight: 'bold', marginVertical: 2 },
  sealText3: { fontSize: 7, color: emerald, fontWeight: 'bold' },

  infoSection: {
    flexDirection: 'row',
    marginBottom: 30,
  },
  infoCol: {
    width: '50%',
  },
  labelLine: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  label: {
    width: 100,
    fontSize: 10,
    color: '#4b5563',
  },
  valueLine: {
    flex: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#d1d5db',
    paddingBottom: 2,
  },
  valueText: {
    fontSize: 11,
    color: '#111827',
    fontWeight: 'bold',
  },

  // Table
  tableContainer: {
    marginTop: 20,
  },
  tableTitle: {
    fontSize: 12,
    fontFamily: 'Times-Roman',
    fontWeight: 'bold',
    marginBottom: 10,
    color: emerald,
  },
  table: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: lightEmerald,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 10,
    backgroundColor: '#ffffff',
  },
  colProduct: { width: '45%' },
  colSerial: { width: '30%' },
  colTerm: { width: '10%', textAlign: 'center' },
  colExpiry: { width: '15%', textAlign: 'right' },
  headerText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: emerald,
    textTransform: 'uppercase',
  },
  cellText: {
    fontSize: 9,
    color: '#374151',
  },
  
  // Terms
  termsBox: {
    marginTop: 30,
    paddingTop: 15,
  },
  termsTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  termsText: {
    fontSize: 8,
    color: '#6b7280',
    lineHeight: 1.6,
  },

  // Footer Signatures
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  sigBlock: {
    width: 150,
    alignItems: 'center',
  },
  sigLine: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#111827',
    marginBottom: 5,
  },
  sigText: {
    fontSize: 9,
    color: '#374151',
  },

  pageBorder: {
    position: 'absolute',
    top: 15,
    left: 15,
    right: 15,
    bottom: 15,
    borderWidth: 1,
    borderColor: emerald,
    opacity: 0.2,
    pointerEvents: 'none',
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
        <View style={styles.topBar} />
        <View style={styles.pageBorder} />

        <View style={styles.contentWrap}>
          
          <View style={styles.headerRow}>
            <View style={styles.logoSection}>
              <View style={styles.logoShield}>
                <Text style={{color: '#fff', fontSize: 18, fontWeight: 'bold'}}></Text>
              </View>
              <Text style={styles.logoText}>TEAM CCTV</Text>
            </View>
            <View style={styles.certInfo}>
              <Text style={{ fontSize: 9, color: '#6b7280' }}>Certificate No.</Text>
              <Text style={{ fontSize: 11, fontWeight: 'bold', color: emerald }}>{certificate.certNumber}</Text>
            </View>
          </View>

          <View style={styles.titleWrap}>
            <Text style={styles.titleText}>Official Warranty</Text>
            <Text style={styles.subtitleText}>Certificate of Coverage</Text>
            
            <View style={styles.sealBox}>
              <Text style={styles.sealText1}>FULL</Text>
              <Text style={styles.sealText2}>100%</Text>
              <Text style={styles.sealText3}>COVERAGE</Text>
            </View>
          </View>

          <View style={styles.infoSection}>
            <View style={styles.infoCol}>
              <View style={styles.labelLine}>
                <Text style={styles.label}>Customer Name</Text>
                <View style={styles.valueLine}>
                  <Text style={styles.valueText}>{customerName}</Text>
                </View>
              </View>
              <View style={styles.labelLine}>
                <Text style={styles.label}>Contact No.</Text>
                <View style={styles.valueLine}>
                  <Text style={styles.valueText}>{customerPhone}</Text>
                </View>
              </View>
              <View style={styles.labelLine}>
                <Text style={styles.label}>Installation Address</Text>
                <View style={styles.valueLine}>
                  <Text style={styles.valueText}>{customerAddress || "N/A"}</Text>
                </View>
              </View>
            </View>
            <View style={[styles.infoCol, { paddingLeft: 20 }]}>
              <View style={styles.labelLine}>
                <Text style={styles.label}>Date of Issue</Text>
                <View style={styles.valueLine}>
                  <Text style={styles.valueText}>{formatDate(certificate.issuedAt)}</Text>
                </View>
              </View>
              <View style={styles.labelLine}>
                <Text style={styles.label}>Installation Date</Text>
                <View style={styles.valueLine}>
                  <Text style={styles.valueText}>{formatDate(certificate.installationDate)}</Text>
                </View>
              </View>
              <View style={styles.labelLine}>
                <Text style={styles.label}>Job Reference</Text>
                <View style={styles.valueLine}>
                  <Text style={styles.valueText}>{certificate.jobId}</Text>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.tableContainer}>
            <Text style={styles.tableTitle}>Equipment Covered</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.colProduct, styles.headerText]}>Product Details</Text>
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
                  <Text style={[styles.colExpiry, styles.cellText, { fontWeight: 'bold' }]}>
                    {formatDate(asset.warrantyEndDate)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.termsBox}>
            <Text style={styles.termsTitle}>Terms & Conditions</Text>
            <Text style={styles.termsText}>
              1. Warranty Coverage: This certificate warrants that the equipment listed above is free from manufacturing defects in material and workmanship.{"\n"}
              2. Exclusions: Warranty does not cover damages caused by lightning strikes, power surges, water ingress (for non-waterproof items), physical damage, or unauthorized tampering.{"\n"}
              3. Claims Process: To claim warranty service, present this certificate or quote the Certificate Number. On-site visits after the initial free service period may incur standard visiting charges.
            </Text>
          </View>

          <View style={styles.signatureRow}>
            <View style={styles.sigBlock}>
              <View style={styles.sigLine} />
              <Text style={styles.sigText}>Authorized Signature</Text>
            </View>
            <View style={styles.sigBlock}>
              <Text style={[styles.sigText, { fontWeight: 'bold', fontSize: 11, marginBottom: 5, color: emerald }]}>TEAM CCTV SEAL</Text>
              <Text style={styles.sigText}>Certified Secure</Text>
            </View>
          </View>

        </View>
      </Page>
    </Document>
  );
};
