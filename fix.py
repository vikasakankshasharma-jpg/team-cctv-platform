import re

path = 'app/(customer)/quote/[leadId]/review/[quoteId]/QuoteReviewClient.tsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# Replace first 'openBillingModal("full")' with 'full_discount'
# Replace second 'openBillingModal("full")' with 'emi'
# Let's just find them by context.

content = content.replace(
    'onClick={() => openBillingModal("full")}',
    'onClick={() => openBillingModal("full_discount")}',
    1
)

content = content.replace(
    'onClick={() => openBillingModal("full")}',
    'onClick={() => openBillingModal("emi")}',
    1
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
