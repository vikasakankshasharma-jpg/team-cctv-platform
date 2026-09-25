const fs = require('fs');
let c = fs.readFileSync('app/(customer)/track/[id]/TrackingClient.tsx', 'utf-8').replace(/\r\n/g, '\n');

const oldHelp = `<div className="text-center pt-4">
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {t("track_need_help", "Need help? Contact support at")} <a href="tel:18001234567" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold hover:underline transition-all">1800-123-4567</a>
          </p>
        </div>`;

const newHelp = `<div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <a href="https://wa.me/918001234567?text=Hi!%20I%20need%20help%20with%20my%20installation%20or%20need%20to%20reschedule." target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-sm hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all">
            <Phone className="w-4 h-4" />
            Reschedule / Cancel Booking
          </a>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
            {t("track_need_help", "Need help? Contact support at")} <a href="tel:18001234567" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 font-bold hover:underline transition-all">1800-123-4567</a>
          </p>
        </div>`;

c = c.replace(oldHelp, newHelp);
fs.writeFileSync('app/(customer)/track/[id]/TrackingClient.tsx', c);
console.log('✅ Added Reschedule button');
