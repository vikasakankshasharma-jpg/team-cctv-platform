file_path = "lib/i18n/translations.ts"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('"wz_free_onsite_install": "Free On-Site Install"', '"wz_free_onsite_install": "Free On-Site Survey"')
content = content.replace('???? ??-???? ??????????', '???? ??-???? ?????')
content = content.replace('Free On-Site Install', 'Free On-Site Survey')

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Updated translations.")
