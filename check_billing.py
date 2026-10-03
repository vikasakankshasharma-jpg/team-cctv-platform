import sys
sys.stdout.reconfigure(encoding="utf-8")
file_path = "app/api/quote/[quoteId]/billing/route.ts"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()
    start = -1
    for i, line in enumerate(lines):
        if "export async function POST" in line:
            start = i
            break
    if start != -1:
        print("".join(lines[start:start+70]))
