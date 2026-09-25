const fs = require('fs');
let content = fs.readFileSync('components/shared/PaymentStagesWidget.tsx', 'utf-8');
content = content.replace(
  'import { CheckCircle2, Lock, ArrowRight, ExternalLink, RefreshCw, Send, Download } from "lucide-react";',
  'import { CheckCircle2, Lock, ArrowRight, ExternalLink, RefreshCw, Send, Download, ChevronDown, ChevronUp } from "lucide-react";'
);
content = content.replace(
  'const [loadingType, setLoadingType] = useState<string | null>(null);',
  'const [loadingType, setLoadingType] = useState<string | null>(null);\n  const [isExpanded, setIsExpanded] = useState(false);'
);
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
// Need to account for \r\n in the replace
const oldStatusLogic = `  const totalPaid = (isStage1Paid ? stage1Amount : 0) + (isStage2Paid ? stage2Amount : 0) + (isStage3Paid ? stage3Amount : 0);\r\n  const progressPercent = Math.min(100, Math.round((totalPaid / totalAmount) * 100));`;
const oldStatusLogic2 = `  const totalPaid = (isStage1Paid ? stage1Amount : 0) + (isStage2Paid ? stage2Amount : 0) + (isStage3Paid ? stage3Amount : 0);\n  const progressPercent = Math.min(100, Math.round((totalPaid / totalAmount) * 100));`;

if (content.includes(oldStatusLogic)) {
  content = content.replace(oldStatusLogic, statusLogic);
} else if (content.includes(oldStatusLogic2)) {
  content = content.replace(oldStatusLogic2, statusLogic);
} else {
  console.log("Could not replace status logic!");
}

fs.writeFileSync('components/shared/PaymentStagesWidget.tsx', content);
