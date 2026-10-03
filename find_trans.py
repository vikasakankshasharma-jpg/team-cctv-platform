file_path = "lib/i18n/translations.ts"
with open(file_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        if "qrc_flat_advance" in line:
            print(f"{i+1}: {line.strip()}")
