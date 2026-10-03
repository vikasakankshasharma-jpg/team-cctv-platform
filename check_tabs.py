import sys
sys.stdout.reconfigure(encoding="utf-8")
file_path = "components/customer/CustomerDashboardClient.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "setActiveTab" in line or "({bookedQuotes" in line or "({unbookedQuotes" in line:
            print(f"{i+1}: {line.strip()}")
