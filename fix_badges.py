import re

with open('components/quotation/InstantQuotationReview.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(
    r'(<div className="text-xs font-bold text-zinc-900 dark:text-white truncate">\{translateProductName\(item\.display_name\)\}<\/div>)\s*(<div className="text-\[11px\] text-zinc-500 dark:text-zinc-400">)',
    r'\1\n                    {item.brand && (\n                      <div className="inline-block mt-0.5 mb-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">\n                        {item.brand}\n                      </div>\n                    )}\n                    \2',
    content,
    flags=re.MULTILINE
)

content = re.sub(
    r'(<td className="py-2.5 px-4 font-medium text-zinc-900 dark:text-white">\{translateProductName\(item\.display_name\)\}<\/td>)',
    r'<td className="py-2.5 px-4 font-medium text-zinc-900 dark:text-white">\n                          <div className="truncate">{translateProductName(item.display_name)}</div>\n                          {item.brand && (\n                            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">\n                              {item.brand}\n                            </span>\n                          )}\n                        </td>',
    content
)

with open('components/quotation/InstantQuotationReview.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Script finished")
