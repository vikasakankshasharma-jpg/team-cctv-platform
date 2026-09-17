import re

path = 'app/(customer)/quote/[leadId]/review/[quoteId]/QuoteReviewClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(',1500', '\u20B9500')
content = content.replace('Pay {formatINR(advance)}', 'Pay \u20B9500')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
