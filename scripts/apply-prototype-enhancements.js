const fs = require('fs');
const path = require('path');

// 1. Update DynamicVariantGenerator.tsx
const dvgPath = path.join(__dirname, '../components/quotation/DynamicVariantGenerator.tsx');
let dvg = fs.readFileSync(dvgPath, 'utf8');

// Target the end of sticky filter bar
const brandButtonsEnd = `{BRAND_DISPLAY[b] || getCanonicalBrandName(b) || b}\r\n              </button>\r\n            ))}\r\n          </div>\r\n        </div>\r\n      </div>\r\n\r\n      <div className="flex flex-col gap-4 items-center">`;

const brandButtonsEndLF = `{BRAND_DISPLAY[b] || getCanonicalBrandName(b) || b}\n              </button>\n            ))}\n          </div>\n        </div>\n      </div>\n\n      <div className="flex flex-col gap-4 items-center">`;

const isCRLF = dvg.includes('\r\n');
const eol = isCRLF ? '\r\n' : '\n';

const storageAndBannerCode = `${eol}        {/* Live Storage Retention Days Selector */}
        <div className="w-full pt-1.5 border-t border-zinc-200/70 dark:border-zinc-800/70 flex flex-wrap items-center justify-between gap-1.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              💾 Recording Retention:
            </span>
          </div>
          <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-xl text-xs font-semibold overflow-x-auto">
            {[
              { days: 7, label: "7 Days (500GB)" },
              { days: 15, label: "15 Days (1TB) Rec." },
              { days: 30, label: "30 Days (2TB)" },
              { days: 60, label: "60 Days (4TB)" }
            ].map(opt => (
              <button
                key={opt.days}
                type="button"
                onClick={() => setSelectedStorageDays(opt.days)}
                className={\`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg transition-all text-[10px] sm:text-[11px] whitespace-nowrap cursor-pointer \${
                  selectedStorageDays === opt.days 
                    ? "bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 font-extrabold shadow-2xs border border-zinc-200 dark:border-zinc-700" 
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                }\`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 items-center">
        {/* Unified Mobile App Guarantee Banner for Hybrid Setup */}
        {(activeTech === "hybrid" || isHybridInitial) && (
          <div className="w-full max-w-2xl mx-auto p-2.5 sm:p-3 rounded-2xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200/80 dark:border-indigo-800/80 shadow-xs flex items-center gap-2.5 animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-base shrink-0 shadow-xs">
              📱
            </div>
            <div className="text-[11px] sm:text-xs text-indigo-950 dark:text-indigo-200 leading-snug">
              <span className="font-bold text-indigo-700 dark:text-indigo-300">Unified Mobile App Guarantee:</span> All your Wired DVR cameras and Smart Wi-Fi cameras will stream together inside a <strong>single mobile app (Hik-Connect / CP PLUS gCMOB)</strong>. Zero multiple apps!
            </div>
          </div>
        )}`;

if (dvg.includes(brandButtonsEnd)) {
  dvg = dvg.replace(brandButtonsEnd, `{BRAND_DISPLAY[b] || getCanonicalBrandName(b) || b}\r\n              </button>\r\n            ))}\r\n          </div>\r\n        </div>` + storageAndBannerCode);
  console.log('✓ Successfully inserted storage selector and hybrid banner into DynamicVariantGenerator.tsx (CRLF)');
} else if (dvg.includes(brandButtonsEndLF)) {
  dvg = dvg.replace(brandButtonsEndLF, `{BRAND_DISPLAY[b] || getCanonicalBrandName(b) || b}\n              </button>\n            ))}\n          </div>\n        </div>` + storageAndBannerCode);
  console.log('✓ Successfully inserted storage selector and hybrid banner into DynamicVariantGenerator.tsx (LF)');
} else {
  console.error('✗ Failed to find brandButtonsEnd in DynamicVariantGenerator.tsx');
}

// Also add brand badge in card header
const brandHeaderTarget = `<span>{variant.camera_device?.brand || "Budget"}</span>`;
const brandHeaderReplacement = `<span>{variant.camera_device?.brand || "Budget"}</span>
                    {(() => {
                      const b = (variant.camera_device?.brand || "").toLowerCase();
                      if (b.includes("hikvision")) return <span className="text-[9px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 px-2 py-0.5 rounded-full">Global Leader • ColorVu Sensor</span>;
                      if (b.includes("cp") || b.includes("plus")) return <span className="text-[9px] font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-200 px-2 py-0.5 rounded-full">India's #1 • 1500+ Service Centers</span>;
                      if (b.includes("trueview")) return <span className="text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-200 px-2 py-0.5 rounded-full">Specialist in 4G & Smart PTZ</span>;
                      if (b.includes("prama")) return <span className="text-[9px] font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-200 px-2 py-0.5 rounded-full">Make-in-India Enterprise Grade</span>;
                      return null;
                    })()}`;

if (dvg.includes(brandHeaderTarget)) {
  dvg = dvg.replace(brandHeaderTarget, brandHeaderReplacement);
  console.log('✓ Successfully added brand advantage micro-badge to card header');
}

fs.writeFileSync(dvgPath, dvg, 'utf8');
console.log('✓ DynamicVariantGenerator.tsx updated successfully');
