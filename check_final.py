import sys
sys.stdout.reconfigure(encoding="utf-8")
file_path = "app/(customer)/customer/dashboard/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()
    if "bestName" in content:
        print("YES! name fix is present")
    else:
        print("NO! name fix missing")
    if "booking_amount" in content:
        print("YES! booking_amount is present")
    else:
        print("NO! booking_amount is missing")
