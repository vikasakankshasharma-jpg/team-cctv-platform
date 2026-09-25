const fs = require('fs');
let content = fs.readFileSync('components/shared/PaymentStagesWidget.tsx', 'utf-8');

// Add imports
content = content.replace(
  'import { CheckCircle2, Lock, ArrowRight, ExternalLink, RefreshCw, Send, Download } from "lucide-react";',
  'import { CheckCircle2, Lock, ArrowRight, ExternalLink, RefreshCw, Send, Download, ChevronDown, ChevronUp } from "lucide-react";'
);

// Add isExpanded state
content = content.replace(
  'const [loadingType, setLoadingType] = useState<string | null>(null);',
  'const [loadingType, setLoadingType] = useState<string | null>(null);\n  const [isExpanded, setIsExpanded] = useState(false);'
);

// Calculate current status text
const statusLogic = `
  const totalPaid = (isStage1Paid ? stage1Amount : 0) + (isStage2Paid ? stage2Amount : 0) + (isStage3Paid ? stage3Amount : 0);
  const progressPercent = Math.min(100, Math.round((totalPaid / totalAmount) * 100));

  let currentStatusText = "Pending Booking Amount (Stage 1)";
  if (isStage3Paid) {
    currentStatusText = "Fully Paid";
  } else if (isStage2Paid) {
    currentStatusText = "Pending Installation (Stage 3)";
  } else if (isStage1Paid) {
    currentStatusText = "Pending Material Delivery (Stage 2)";
  }
`;

content = content.replace(
  '  const totalPaid = (isStage1Paid ? stage1Amount : 0) + (isStage2Paid ? stage2Amount : 0) + (isStage3Paid ? stage3Amount : 0);\n  const progressPercent = Math.min(100, Math.round((totalPaid / totalAmount) * 100));',
  statusLogic
);

// Replace JSX top part
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
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 cursor-pointer select-none group"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              Payment Status
              <span className={\`text-xs px-2 py-0.5 rounded-full font-semibold \${isStage3Paid ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}\`}>
                {currentStatusText}
              </span>
            </h2>
            <div className="sm:hidden text-zinc-400 group-hover:text-zinc-600 transition-colors">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Total Amount: <span className="font-semibold text-zinc-900 dark:text-zinc-300">{formatCurrency(totalAmount)}</span>
            <span className="mx-2">•</span>
            Paid: <span className="font-semibold text-emerald-600">{formatCurrency(totalPaid)}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {progressPercent > 0 && (
            <button 
              className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-xl transition-colors"
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

      {isExpanded && (
        <div className="space-y-4 mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">`;

content = content.replace(oldJsxTop, newJsxTop);

// Fix the tail to properly close {isExpanded && (
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
content = content.replace(tailStr, newTailStr);

fs.writeFileSync('components/shared/PaymentStagesWidget.tsx', content);
