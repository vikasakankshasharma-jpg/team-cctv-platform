import sys
sys.stdout.reconfigure(encoding="utf-8")
file_path = "app/(customer)/customer/dashboard/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    print("".join(f.readlines()[-30:]))
