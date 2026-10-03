file_path = "components/customer/CustomerDashboardClient.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "paidQuotesCount" in line and "const " not in line:
            print("".join(open(file_path, encoding="utf-8").readlines()[i-10:i+10]))
            break
