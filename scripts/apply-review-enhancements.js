const fs = require('fs');
const path = require('path');

const reviewPath = path.join(__dirname, '../components/quotation/InstantQuotationReview.tsx');
let review = fs.readFileSync(reviewPath, 'utf8');

// 1. Add state for preferred survey date and slot
const stateAnchor = `  const [showEmiModal, setShowEmiModal] = useState(false);`;
const stateCode = `  const [showEmiModal, setShowEmiModal] = useState(false);
  const [preferredSurveyDate, setPreferredSurveyDate] = useState<string>("Tomorrow");
  const [preferredSurveySlot, setPreferredSurveySlot] = useState<string>("Morning (10 AM - 1 PM)");`;

if (review.includes(stateAnchor) && !review.includes('preferredSurveyDate')) {
  review = review.replace(stateAnchor, stateCode);
  console.log('✓ Added preferredSurveyDate state to InstantQuotationReview');
}

// 2. Insert the Guarantee Checklist, Night Vision Preview, and 2-Tap Survey Slot
const targetCardEnd = `          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />\r\n        </div>\r\n      </div>\r\n\r\n            {/* BRAND UNIFICATION BANNER */}`;
const targetCardEndLF = `          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />\n        </div>\n      </div>\n\n            {/* BRAND UNIFICATION BANNER */}`;

const isCRLF = review.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

const newSections = `          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
        </div>
      </div>

      {/* Guaranteed All-Inclusive Fixed Price Inclusions Checklist */}
      <div className="bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-3.5 sm:p-4 my-3 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
            <span>✅</span> Guaranteed Fixed Price — Zero Hidden Extras
          </span>
          <span className="text-[10px] bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-extrabold px-2 py-0.5 rounded-full">
            100% Inclusions
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
          <span className="flex items-center gap-1">✓ Genuine WD/Seagate HDD</span>
          <span className="flex items-center gap-1">✓ 100% Pure Copper Cable</span>
          <span className="flex items-center gap-1">✓ Heavy-Duty Metal SMPS</span>
          <span className="flex items-center gap-1">✓ Waterproof Junction Boxes</span>
          <span className="flex items-center gap-1">✓ High-Shield BNC/DC Jacks</span>
          <span className="flex items-center gap-1">✓ 1-Yr Free Onsite Warranty</span>
        </div>
      </div>

      {/* Visual Night Vision Preview Simulation */}
      <details className="group bg-slate-900 text-white rounded-2xl border border-slate-800 p-3.5 my-3 shadow-sm">
        <summary className="flex items-center justify-between cursor-pointer list-none select-none text-xs font-bold text-slate-200">
          <div className="flex items-center gap-2">
            <span className="text-base">👁️</span>
            <span>Night Vision Quality Comparison: See 2:00 AM Simulation</span>
          </div>
          <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-bold group-open:hidden">
            Compare IR vs ColorVu ▼
          </span>
        </summary>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700">
            <span className="font-bold text-slate-400 block mb-1">Standard IR (Black & White)</span>
            <div className="h-24 bg-slate-950 rounded-lg flex items-center justify-center text-slate-400 border border-slate-800 text-center p-2 text-[11px] leading-relaxed">
              Grainy monochrome view. Number plates unreadable, car color and intruder clothing appear identical grey.
            </div>
          </div>
          <div className="p-3 rounded-xl bg-blue-950/80 border border-blue-500/50">
            <span className="font-bold text-amber-300 block mb-1">24/7 ColorVu Full Color</span>
            <div className="h-24 bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-200 border border-blue-500/30 text-center p-2 text-[11px] leading-relaxed">
              Vivid daylight-like color. Clear red t-shirt, blue vehicle, and crisp high-contrast license plate identification.
            </div>
          </div>
        </div>
      </details>

      {/* 2-Tap Preferred Survey Appointment Slot */}
      <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-3.5 sm:p-4 my-3 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
            <span>🗓️</span> Schedule Certified Engineer Site Visit (₹0 Free)
          </span>
          <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-full">
            Certified Technician
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">Tap 1: Preferred Day</span>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              {["Tomorrow", "Sunday", "Monday"].map(day => (
                <button
                  key={day}
                  type="button"
                  onClick={() => setPreferredSurveyDate(day)}
                  className={\`p-2 rounded-xl border text-center transition-all \${
                    preferredSurveyDate === day
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black shadow-xs ring-1 ring-blue-500"
                      : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-slate-700 dark:text-zinc-300 hover:border-slate-300"
                  }\`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400 block mb-1.5">Tap 2: Time Window</span>
            <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
              {[
                { id: "Morning (10 AM - 1 PM)", label: "Morning", time: "10am-1pm" },
                { id: "Afternoon (2 PM - 5 PM)", label: "Afternoon", time: "2pm-5pm" },
                { id: "Evening (5 PM - 8 PM)", label: "Evening", time: "5pm-8pm" },
              ].map(slot => (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setPreferredSurveySlot(slot.id)}
                  className={\`p-1.5 rounded-xl border text-center transition-all \${
                    preferredSurveySlot === slot.id
                      ? "border-blue-600 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-black shadow-xs ring-1 ring-blue-500"
                      : "border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-850 text-slate-700 dark:text-zinc-300 hover:border-slate-300"
                  }\`}
                >
                  <span className="block text-[11px]">{slot.label}</span>
                  <span className="block text-[9px] font-normal opacity-80">{slot.time}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BRAND UNIFICATION BANNER */}`.replace(/\n/g, eol);

if (review.includes(targetCardEnd)) {
  review = review.replace(targetCardEnd, newSections);
  console.log('✓ Successfully inserted Checklist, Night Vision, and 2-Tap Survey into InstantQuotationReview.tsx (CRLF)');
} else if (review.includes(targetCardEndLF)) {
  review = review.replace(targetCardEndLF, newSections);
  console.log('✓ Successfully inserted Checklist, Night Vision, and 2-Tap Survey into InstantQuotationReview.tsx (LF)');
} else {
  console.error('✗ Failed to find targetCardEnd in InstantQuotationReview.tsx');
}

fs.writeFileSync(reviewPath, review, 'utf8');
console.log('✓ InstantQuotationReview.tsx written');
