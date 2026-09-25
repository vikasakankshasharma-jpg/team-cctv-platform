const fs = require('fs');

let content = fs.readFileSync('components/customer/CustomerDashboardClient.tsx', 'utf-8').replace(/\r\n/g, '\n');

// Add User icon if needed
if (!content.includes('User,')) {
  content = content.replace(
    'FileText,\n} from "lucide-react";',
    'FileText,\n  User,\n} from "lucide-react";'
  );
}

const oldButtons = `<Link
              href="/customer/documents"`;

const newButtons = `<Link
              href="/customer/profile"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 text-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all whitespace-nowrap hover:bg-zinc-200 dark:hover:bg-zinc-700"
            >
              <User className="w-4 h-4 shrink-0" />
              Profile
            </Link>
            <Link
              href="/customer/documents"`;

if (content.includes(oldButtons)) {
  content = content.replace(oldButtons, newButtons);
  console.log("✅ Added Profile link to dashboard header");
} else {
  console.log("❌ Failed to find Documents button to inject next to it");
}

fs.writeFileSync('components/customer/CustomerDashboardClient.tsx', content);
