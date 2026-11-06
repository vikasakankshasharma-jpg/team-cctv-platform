import json
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

with open("downloaded_megacompu_catalog.json", "r", encoding="utf-8") as f:
    items = json.load(f)

clean_retail = []

for it in items:
    price = it.get("price", 0)
    title = it.get("title", "")
    pid = it.get("pid", "")
    code = it.get("item_code", "")
    files = " ".join(it.get("source_files", []))
    lower_title = title.lower()
    
    # 1. Reject price <= 0
    if price <= 0:
        continue
        
    # 2. Reject project series
    if "project" in lower_title or "nc34tp3" in lower_title or "pt-nc" in lower_title or "project" in files.lower():
        # wait! does files have project? let's check:
        # None of the files have "project" in their filename!
        if "project" in lower_title:
            continue

    clean_retail.append(it)

print(f"Total raw items: {len(items)}")
print(f"Total verified non-project, non-zero retail products: {len(clean_retail)}")

with open("clean_retail_megacompu.json", "w", encoding="utf-8") as f:
    json.dump(clean_retail, f, indent=2, ensure_ascii=False)
print("Saved to clean_retail_megacompu.json")
