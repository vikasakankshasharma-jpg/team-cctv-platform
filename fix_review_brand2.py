import re

with open('app/(customer)/quote/[leadId]/review/[quoteId]/QuoteReviewClient.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add brand to the LineItem interface
content = re.sub(
    r'(  id: string;\n  name: string;\n  description: string;)',
    r'\1\n  brand?: string;',
    content
)

# 2. Display brand badge below item name in the card
content = re.sub(
    r'(<h4 className="font-bold text-sm text-zinc-900 flex items-center gap-1\.5">.*?<span className="text-\[10px\] font-bold text-zinc-400 bg-zinc-50 px-1\.5 py-0\.5 rounded border border-zinc-100">\{#\{idx \+ 1\}\}</span>\s*\{item\.name\}\s*</h4>)',
    r'\1\n                          {item.brand && (\n                            <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200">\n                              {item.brand}\n                            </span>\n                          )}',
    content,
    flags=re.DOTALL
)

with open('app/(customer)/quote/[leadId]/review/[quoteId]/QuoteReviewClient.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("QuoteReviewClient.tsx: Done")
