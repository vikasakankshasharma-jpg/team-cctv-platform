file_path = "lib/i18n/translations.ts"
with open(file_path, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "wz_free_included_text" in line:
        print(repr(line))
