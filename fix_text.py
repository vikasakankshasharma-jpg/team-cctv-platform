import re

file_path = "components/wizard/WizardClientV2.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'Your base package includes <strong className="font-bold">{freeLimitMeters}{t("wz_m")}</strong> of cabling. The extra <strong className="font-bold">{excessMeters}{t("wz_m")}</strong> will be charged at',
    'Your base package includes free installation for up to <strong className="font-bold">{freeLimitMeters}{t("wz_m")}</strong> of cabling. Laying extra cable will incur a labor charge of'
)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

file_path2 = "components/quotation/FullCustomizerPanel.tsx"
with open(file_path2, "r", encoding="utf-8") as f:
    content2 = f.read()

content2 = content2.replace(
    'Your base package includes <b>{freeLimitMeters}m</b> of free cabling installation. The extra <b>{excessMeters}m</b> will incur an excess labor surcharge of',
    'Your base package includes free installation for up to <b>{freeLimitMeters}m</b> of cabling. Laying extra cable will incur a labor charge of'
)

with open(file_path2, "w", encoding="utf-8") as f:
    f.write(content2)

print("Updated React components.")
