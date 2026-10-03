file_path = "app/(customer)/customer/dashboard/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "const isPaid" in line:
            print("".join(open(file_path, encoding="utf-8").readlines()[i:i+15]))
            break
