const fs = require('fs');
let code = fs.readFileSync('components/landing/PincodeWidget.tsx', 'utf8');

const badgeHtml = `
      {isHero && (
        <div className="mb-3 flex items-center justify-center lg:justify-start gap-2 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-[10px] sm:text-xs font-black uppercase tracking-wider border border-blue-100 dark:border-blue-800/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            {t('step_1_pincode', 'Step 1: Enter Pincode to view pricing')}
          </span>
        </div>
      )}
      <form`;
code = code.replace('<form', badgeHtml.trimStart());

code = code.replace('disabled={loading || pincode.length !== 6}', 'disabled={loading}');

const oldBtnClass = 'className={`flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest text-white rounded-2xl transition-all shadow-xl disabled:opacity-50 touch-manipulation shrink-0 ${';
const newBtnClass = 'className={`flex items-center justify-center gap-2 font-black uppercase text-xs tracking-widest text-white rounded-2xl transition-all shadow-xl touch-manipulation shrink-0 ${loading ? "opacity-70 cursor-wait" : "active:scale-95"} ${';
code = code.replace(oldBtnClass, newBtnClass);

const oldHeroClass = 'isHero\n              ? "px-4 md:px-8 py-4 sm:py-5.5 bg-zinc-900 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 shadow-zinc-900/10 dark:shadow-blue-500/20 hover:shadow-blue-500/30"\n              : "px-6 py-3.5 bg-zinc-900 dark:bg-indigo-600 hover:bg-zinc-800 dark:hover:bg-indigo-500 shadow-zinc-900/10 dark:shadow-indigo-500/20 hover:shadow-indigo-500/30"';
const newHeroClass = 'isHero\n              ? "px-4 md:px-8 py-4 sm:py-5.5 bg-blue-600 hover:bg-blue-500 shadow-blue-500/30 hover:shadow-blue-500/50"\n              : "px-6 py-3.5 bg-blue-600 hover:bg-blue-500 shadow-blue-500/30 hover:shadow-blue-500/50"';
code = code.replace(oldHeroClass, newHeroClass);

code = code.replace('{t("check_area", "Check Area")}', '{t("get_instant_price", "Get Instant Price")}');

fs.writeFileSync('components/landing/PincodeWidget.tsx', code);
console.log('Updated PincodeWidget.tsx');
