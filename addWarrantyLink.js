const fs = require('fs');
let c = fs.readFileSync('components/customer/CustomerDashboardClient.tsx', 'utf-8').replace(/\r\n/g, '\n');

const oldInvoice = `{/* Download Invoice (if paid) */}
                      {q.isPaid && (
                        <a
                          href={\`/api/invoice/\${q.quoteId}/download\`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-all whitespace-nowrap"
                        >
                          <Download className="w-4 h-4 shrink-0" />
                          <span>Tax Invoice</span>
                        </a>
                      )}`;

const newInvoice = `{/* Download Invoice (if paid) */}
                      {q.isPaid && (
                        <a
                          href={\`/api/invoice/\${q.quoteId}/download\`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-sm transition-all whitespace-nowrap"
                        >
                          <Download className="w-4 h-4 shrink-0" />
                          <span>Tax Invoice</span>
                        </a>
                      )}
                      
                      {q.isPaid && q.rawLead?.install_status === "COMPLETED" && (
                        <Link
                          href="/customer/documents"
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-xs font-black transition-all whitespace-nowrap"
                        >
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span>Warranty</span>
                        </Link>
                      )}`;

// Add ShieldCheck icon if needed
if (!c.includes('ShieldCheck')) {
  c = c.replace('FileText,', 'FileText,\n  ShieldCheck,');
}

c = c.replace(oldInvoice, newInvoice); // Replaces the first one (in bookedQuotes)
fs.writeFileSync('components/customer/CustomerDashboardClient.tsx', c);
console.log('✅ Added Warranty button');
