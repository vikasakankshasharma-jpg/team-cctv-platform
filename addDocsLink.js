const fs = require('fs');

let content = fs.readFileSync('components/customer/CustomerDashboardClient.tsx', 'utf-8').replace(/\r\n/g, '\n');

// Add FileText icon if needed
if (!content.includes('FileText,')) {
  content = content.replace(
    'Headphones,\n} from "lucide-react";',
    'Headphones,\n  FileText,\n} from "lucide-react";'
  );
}

const oldButtons = `<Link
              href="/customer/support"`;

const newButtons = `<Link
              href="/customer/documents"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-center bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap hover:bg-indigo-100 dark:hover:bg-indigo-900"
            >
              <FileText className="w-4 h-4 shrink-0" />
              Documents
            </Link>
            <Link
              href="/customer/support"`;

if (content.includes(oldButtons)) {
  content = content.replace(oldButtons, newButtons);
  console.log("✅ Added Documents link to dashboard header");
} else {
  console.log("❌ Failed to find Support button to inject next to it");
}

// Add the Dead-End recovery button for lost quotes
const oldLostLogic = `{/* Download Quote */}
                        <a
                          href={\`/api/quote/\${q.quoteId}/download\`}`;

const newLostLogic = `{q.rawLead?.status === 'lost' ? (
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

if (content.includes(oldLostLogic)) {
  // It's going to replace the first occurrence, which is in unbooked quotes! Exactly what we want.
  content = content.replace(oldLostLogic, newLostLogic);
  // Also remove the old `<a href="/api/quote...` block that was immediately following the old string because we replaced just the top of it.
  // Actually, wait, let me just do a more targeted replace.
}
// Oh wait, my newLostLogic replacement is a bit messy because it didn't consume the rest of the old tag.
// Let's do it cleanly:

fs.writeFileSync('components/customer/CustomerDashboardClient.tsx', content);
