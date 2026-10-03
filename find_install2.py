file_path = "lib/i18n/translations.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

import re
matches = re.finditer(r'"wz_free_onsite_install": "(.*?)"', content)
for m in matches:
    print(m.group(1))
