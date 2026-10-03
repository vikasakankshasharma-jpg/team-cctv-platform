import sys
sys.stdout.reconfigure(encoding="utf-8")
file_path = "components/customer/CustomerDashboardClient.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "amountPaid" in line or " 0 " in line or ">0<" in line or "===" in line:
            print(f"{i+1}: {line.strip()}")
