file_path = "app/(customer)/quote/[leadId]/review/[quoteId]/QuoteReviewClient.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "handler: async function (response: any)" in line or "handler: async" in line or "options =" in line:
            print("".join(open(file_path, encoding="utf-8").readlines()[max(0, i-5):i+30]))
            break
