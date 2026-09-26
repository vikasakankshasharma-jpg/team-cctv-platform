import re

def main():
    file_path = 'components/customer/CustomerDashboardClient.tsx'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Add Tab Button
    tab_html = """              <button
                onClick={() => setActiveTab('invoiced')}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                  activeTab === 'invoiced' 
                    ? 'bg-white dark:bg-zinc-900 text-indigo-600 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                <Download className="w-4 h-4" />
                Invoiced ({invoicedQuotes.length})
              </button>
            </div>
          </div>"""

    content = re.sub(r'              </button>\s*</div>\s*</div>', tab_html, content)

    # Add Invoiced Section
    invoiced_section = """          {activeTab === 'invoiced' && (
            <div>
              {/* Invoiced Quotes */}
              <div className="bg-zinc-50 dark:bg-zinc-800/20 px-6 py-3 border-b border-zinc-100 dark:border-zinc-800">
                <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                  <Download className="w-4 h-4 text-indigo-500" /> Fully Invoiced & Completed ({invoicedQuotes.length})
                </h3>
              </div>
              
              {invoicedQuotes.length === 0 ? (
                <div className="p-5 md:p-12 text-center border-b border-zinc-100 dark:border-zinc-800">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 text-zinc-400 rounded-3xl flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white mb-1">
                    No fully invoiced orders yet.
                  </h3>
                </div>
              ) : (
                <div className="flex flex-col gap-6 p-4 sm:p-6 bg-zinc-50/40 dark:bg-zinc-950/40">
                  {invoicedQuotes.slice(0, visibleInvoiced).map((q: any) => (
                    <div key={q.quoteId} className="bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-zinc-200 dark:bg-zinc-800 group-hover:bg-indigo-500 transition-colors" />
                      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10 pl-2 sm:pl-0">
                        {/* Left Details */}
                        <div className="space-y-3 flex-1">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="font-mono text-xs font-black bg-zinc-100 dark:bg-zinc-800 px-3 py-1 rounded-lg text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                              {q.quoteId}
                              <button onClick={() => handleCopy(q.quoteId)} title="Copy Quote ID" aria-label="Copy Quote ID">
                                {copiedId === q.quoteId ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300" />}
                              </button>
                            </span>
                            <LeadStatusBadge lead={q.rawLead} quote={q.rawQuote} />
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                            {q.propertyType && <span className="font-bold uppercase tracking-wider">• {q.propertyType}</span>}
                            {q.cameraCount ? <span className="font-bold">• {q.cameraCount} Cameras</span> : null}
                          </div>

                          {q.siteAddress && (
                            <div className="flex items-start gap-1.5 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
                              <MapPin className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                              <span>{q.siteAddress}</span>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(q.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                            </span>
                            <span className="flex items-center gap-1 font-bold text-zinc-700 dark:text-zinc-300">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                              ₹{q.totalPayable?.toLocaleString("en-IN") || "—"}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded uppercase">Fully Paid</span>
                          </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex flex-wrap lg:flex-nowrap items-center gap-3 w-full lg:w-auto">
                          <Link href={`/quote/${q.leadId}/review/${q.quoteId}`} className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-black transition-all whitespace-nowrap">
                            <ExternalLink className="w-4 h-4" /> View Details
                          </Link>
                          <a href={`/api/invoice/${q.quoteId}/download`} target="_blank" rel="noreferrer" className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-black transition-all whitespace-nowrap">
                            <Download className="w-4 h-4" /> Tax Invoice
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {visibleInvoiced < invoicedQuotes.length && (
                <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 text-center">
                  <button onClick={() => setVisibleInvoiced(prev => prev + 5)} className="inline-flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 px-6 py-2.5 rounded-xl font-bold text-xs transition-colors">
                    Load More ({invoicedQuotes.length - visibleInvoiced} remaining)
                  </button>
                </div>
              )}
            </div>
          )}

        </div>"""

    content = re.sub(r'        </div>\s*\{\/\* VIP Support Banner \*\/\}', invoiced_section + '\n\n        {/* VIP Support Banner */}', content)

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    main()
