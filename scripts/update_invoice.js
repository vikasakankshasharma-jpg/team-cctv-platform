const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\lib\\pdf\\invoice-pdf.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add styles for Payment History
const styleInjection = `
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
`;
content = content.replace(/totalsBox: \{[\s\S]*?\},/, (match) => match + '\n' + styleInjection);

// 2. Inject Payment History Table below Totals Box
const historyLogic = `
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

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total Paid:</Text>
              <Text style={styles.grandTotalValue}>{formatCurrency(pricing.total_payable)}</Text>
            </View>
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
`;

content = content.replace(/<View style=\{styles\.totalsBox\}>[\s\S]*?<\/View>\s*<\/View>/, historyLogic);

fs.writeFileSync(filePath, content);
console.log("Updated Invoice PDF with Payment History Breakdown");
