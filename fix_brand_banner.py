import re

with open('components/quotation/InstantQuotationReview.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Add updateSelection to the store destructuring
content = re.sub(
    r'const \{ selection, toggleAddon \} = useConfiguratorStore\(\);',
    r'const { selection, toggleAddon, updateSelection } = useConfiguratorStore();',
    content
)

banner_html = """      {/* BRAND UNIFICATION BANNER */}
      <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-3 sm:p-4 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div>
          <div className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Match My Brand
          </div>
          <div className="text-[11px] text-indigo-700/80 dark:text-indigo-400/80 mt-0.5">
            Want maximum items from the same brand? Switch your setup.
          </div>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 pb-1 sm:pb-0">
          <button 
            onClick={() => updateSelection({ brand_preference: 'all' })}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all shrink-0 ${selection.brand_preference === 'all' || !selection.brand_preference ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white dark:bg-zinc-900 text-indigo-600 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400'}`}
          >
            Mixed (Best Price)
          </button>
          {Array.from(new Set(products.filter(p => p.category === "cctv_camera" && p.brand).map(p => p.brand as string))).sort().map(brand => (
            <button 
              key={brand}
              onClick={() => updateSelection({ brand_preference: brand })}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all shrink-0 ${selection.brand_preference?.toLowerCase() === brand.toLowerCase() ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : 'bg-white dark:bg-zinc-900 text-indigo-600 border-indigo-200 dark:border-indigo-800 hover:border-indigo-400'}`}
            >
              {brand}
            </button>
          ))}
        </div>
      </div>

      {/* 4. TAB TOGGLE: BREAKDOWN VS ADD-ONS */}"""

content = re.sub(
    r'\{\/\* 4\. TAB TOGGLE: BREAKDOWN VS ADD-ONS \*\/\}',
    banner_html.replace('\\', '\\\\'),
    content
)

with open('components/quotation/InstantQuotationReview.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Script finished")
