const fs = require('fs');
let c = fs.readFileSync('components/customer/CustomerDashboardClient.tsx', 'utf-8').replace(/\r\n/g, '\n');

const oldLink = `<a
                          href={\`/api/quote/\${q.quoteId}/download\`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black transition-all whitespace-nowrap"
                        >
                          <Download className="w-4 h-4 text-zinc-500 shrink-0" />
                          <span>Download PDF</span>
                        </a>`;

const newLink = `{q.rawLead?.status === 'lost' ? (
                          <a
                            href="https://wa.me/918001234567?text=Hi!%20I%20would%20like%20to%20request%20a%20new%20quote%20or%20price%20match."
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 text-xs font-black transition-all whitespace-nowrap"
                          >
                            <Headphones className="w-4 h-4 shrink-0" />
                            <span>Request Re-Quote</span>
                          </a>
                        ) : (
                          <a
                            href={\`/api/quote/\${q.quoteId}/download\`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black transition-all whitespace-nowrap"
                          >
                            <Download className="w-4 h-4 text-zinc-500 shrink-0" />
                            <span>Download PDF</span>
                          </a>
                        )}`;

c = c.replace(oldLink, newLink);
fs.writeFileSync('components/customer/CustomerDashboardClient.tsx', c);
console.log('✅ Re-quote button added');
