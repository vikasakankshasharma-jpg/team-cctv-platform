file_path = "lib/i18n/translations.ts"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "Free On-site" in line or "Free Onsite" in line or "Free On-Site" in line or "??-???? ??????????" in line or "???? ??-????" in line:
        print(f"Line {i}: {repr(line)}")
