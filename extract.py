file_path = "lib/i18n/translations.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()
import re
matches = re.findall(r'("qrc_flat_advance"\s*:\s*".*?")', content)
with open("temp_trans.txt", "w", encoding="utf-8") as f:
    for m in matches:
        f.write(m + "\n")
