const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\components\\admin\\LeadDetailsDrawer.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Inject the import
const importInjection = `import { PaymentStagesWidget } from "@/components/shared/PaymentStagesWidget";\n`;
if (!content.includes('PaymentStagesWidget')) {
  content = content.replace(/import \{ Button \} from "@\/components\/ui\/button";/, `import { Button } from "@/components/ui/button";\n${importInjection}`);
}

// 2. Find the Location box to inject it below
const locationRegex = /\{\s*lead\.address\s*&&\s*\([\s\S]*?\}\s*\)/;

// Wait, the quoteId is required for PaymentStagesWidget. Where does `lead` store `quoteId`?
// The accepted quote ID is usually stored in `lead.accepted_quote_id` or we can find it in the lead object if it's WON/BOOKED.
// Let's pass `quoteId={lead.accepted_quote_id || lead.quote_id || ""}`
const widgetInjection = `

              {/* Payment Stages Visibility & Nudge */}
              {lead.status !== "new" && lead.status !== "contacted" && lead.status !== "lost" && (
                <div className="p-4 rounded-xl bg-card border border-border">
                  <span className="block text-xs font-bold text-muted-foreground mb-3 uppercase tracking-widest">Payment Ledger & Nudges</span>
                  <PaymentStagesWidget 
                    quoteId={lead.accepted_quote_id || lead.quote_id || lead.id} 
                    lead={lead} 
                    isAdmin={true} 
                  />
                </div>
              )}
`;

content = content.replace(locationRegex, (match) => {
  return match + widgetInjection;
});

fs.writeFileSync(filePath, content);
console.log("Updated LeadDetailsDrawer with PaymentStagesWidget");
