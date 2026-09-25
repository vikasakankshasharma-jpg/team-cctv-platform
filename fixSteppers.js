const fs = require('fs');

// 1. UPDATE PaymentStagesWidget.tsx
let paymentContent = fs.readFileSync('components/shared/PaymentStagesWidget.tsx', 'utf-8').replace(/\r\n/g, '\n');

const oldJsxTop = `<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 mt-2">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            Payment Stages
            {progressPercent === 100 && (
              <span className="bg-emerald-100 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-semibold">Fully Paid</span>
            )}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Total Amount: <span className="font-semibold text-zinc-900 dark:text-zinc-300">{formatCurrency(totalAmount)}</span>
          </p>
        </div>
        
        {progressPercent > 0 && (
          <button 
            className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
            onClick={() => window.open(\`/api/quote/\${quoteId}/pdf\`, '_blank')}
          >
            <Download className="w-4 h-4" />
            Download Receipt
          </button>
        )}
      </div>

      <div className="space-y-4">`;

const newJsxTop = `<div 
        className="flex flex-col gap-4 mt-2 cursor-pointer select-none group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                Payment Status
                <span className={\`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-bold uppercase tracking-wider \${isStage3Paid ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}\`}>
                  {currentStatusText}
                </span>
              </h2>
              <div className="sm:hidden text-zinc-400 group-hover:text-zinc-600 transition-colors bg-zinc-50 dark:bg-zinc-800 p-1.5 rounded-full">
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Total Amount: <span className="font-semibold text-zinc-900 dark:text-zinc-300">{formatCurrency(totalAmount)}</span>
              <span className="mx-2">•</span>
              Paid: <span className="font-semibold text-emerald-600">{formatCurrency(totalPaid)}</span>
            </p>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end gap-3">
            {progressPercent > 0 && (
              <button 
                className="flex items-center justify-center w-full sm:w-auto gap-2 text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 px-4 py-2.5 rounded-xl transition-colors"
                onClick={(e) => { e.stopPropagation(); window.open(\`/api/quote/\${quoteId}/pdf\`, '_blank'); }}
              >
                <Download className="w-4 h-4" />
                Receipt
              </button>
            )}
            <div className="hidden sm:flex text-zinc-400 group-hover:text-zinc-600 transition-colors p-2 bg-zinc-50 dark:bg-zinc-800 rounded-full">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </div>

        {/* Horizontal Flowchart (Visible when collapsed OR expanded as a header) */}
        <div className="flex items-center gap-1 sm:gap-2 w-full mt-2 mb-2 overflow-x-auto pb-3 scrollbar-hide">
          {/* Step 1 */}
          <div className={\`flex flex-col items-center flex-1 min-w-[70px] opacity-100 \${isStage1Paid ? 'text-emerald-600' : 'text-blue-600'}\`}>
             <div className={\`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 \${isStage1Paid ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/30 text-emerald-500' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]'}\`}>
               {isStage1Paid ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 animate-pulse" />}
             </div>
             <span className="text-[9px] sm:text-[10px] font-black mt-2 uppercase tracking-widest text-center">Booking</span>
          </div>

          <div className={\`w-8 sm:w-12 h-0.5 shrink-0 rounded-full \${isStage1Paid ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}\`} />

          {/* Step 2 */}
          <div className={\`flex flex-col items-center flex-1 min-w-[70px] opacity-100 \${isStage2Paid ? 'text-emerald-600' : isStage1Paid ? 'text-blue-600' : 'text-zinc-400 dark:text-zinc-600'}\`}>
             <div className={\`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 \${isStage2Paid ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/30 text-emerald-500' : isStage1Paid ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700'}\`}>
               {isStage2Paid ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : isStage1Paid ? <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 animate-pulse" /> : <Lock className="w-3.5 h-3.5" />}
             </div>
             <span className="text-[9px] sm:text-[10px] font-black mt-2 uppercase tracking-widest text-center">Delivery</span>
          </div>

          <div className={\`w-8 sm:w-12 h-0.5 shrink-0 rounded-full \${isStage2Paid ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'}\`} />

          {/* Step 3 */}
          <div className={\`flex flex-col items-center flex-1 min-w-[70px] opacity-100 \${isStage3Paid ? 'text-emerald-600' : isStage2Paid ? 'text-blue-600' : 'text-zinc-400 dark:text-zinc-600'}\`}>
             <div className={\`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border-2 \${isStage3Paid ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/30 text-emerald-500' : isStage2Paid ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-500 text-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700'}\`}>
               {isStage3Paid ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : isStage2Paid ? <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-500 animate-pulse" /> : <Lock className="w-3.5 h-3.5" />}
             </div>
             <span className="text-[9px] sm:text-[10px] font-black mt-2 uppercase tracking-widest text-center">Install</span>
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-4 mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">`;

if (paymentContent.includes(oldJsxTop)) {
  paymentContent = paymentContent.replace(oldJsxTop, newJsxTop);
  console.log("Replaced top JSX");
} else {
  console.log("FAILED to find oldJsxTop");
}

const tailStr = `          )}
        </div>
      </div>
    </div>
  );
}`;
const newTailStr = `          )}
        </div>
      </div>
      )}
    </div>
  );
}`;

if (paymentContent.includes(tailStr)) {
  paymentContent = paymentContent.replace(tailStr, newTailStr);
  console.log("Replaced tailStr");
} else {
  console.log("FAILED to find tailStr");
}

fs.writeFileSync('components/shared/PaymentStagesWidget.tsx', paymentContent);


// 3. INTEGRATE SystemStatusWidget into CustomerDashboardClient.tsx
let dashboardContent = fs.readFileSync('components/customer/CustomerDashboardClient.tsx', 'utf-8').replace(/\r\n/g, '\n');

const oldIntegrationCode = `                    {/* Right Actions */}
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">`;

const newIntegrationCode = `                    {/* System Status Tracker */}
                    {q.isPaid && q.rawLead && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800/50 mt-4 pt-2 mb-4">
                        <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">Order Progress</p>
                        <SystemStatusWidget lead={q.rawLead} job={null} />
                      </div>
                    )}

                    {/* Right Actions */}
                    <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">`;

if (dashboardContent.includes(oldIntegrationCode)) {
  dashboardContent = dashboardContent.replace(oldIntegrationCode, newIntegrationCode);
  console.log("Replaced dashboard integration");
} else {
  console.log("FAILED to find dashboard integration point");
}
fs.writeFileSync('components/customer/CustomerDashboardClient.tsx', dashboardContent);
