import re

with open('app/(customer)/quote/[leadId]/review/[quoteId]/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the rawItems mapping block
pattern = r'(id: item\.product_id \|\| item\.id \|\| item\.sku \|\| Math\.random\(\)\.toString\(36\)\.substr\(2, 9\),\s*name: item\.display_name \|\| item\.name \|\| item\.title \|\| "CCTV Component",\s*)(description:)'
repl = r'\1brand: item.brand || "",\n            \2'

result, count = re.subn(pattern, repl, content)
if count > 0:
    with open('app/(customer)/quote/[leadId]/review/[quoteId]/page.tsx', 'w', encoding='utf-8') as f:
        f.write(result)
    print(f"page.tsx: Success, replaced {count} occurrence(s)")
else:
    print("page.tsx: Pattern not found")
