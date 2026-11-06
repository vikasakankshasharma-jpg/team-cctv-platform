import os
import glob
import re
import json
import sys
from bs4 import BeautifulSoup

sys.stdout.reconfigure(encoding='utf-8')

folder = r"C:\Users\hp\Downloads\Megacompuworld"
html_files = glob.glob(os.path.join(folder, "*.html"))
print(f"Scanning {len(html_files)} HTML files in {folder}...")

extracted = {}

for fpath in html_files:
    fname = os.path.basename(fpath)
    with open(fpath, "r", encoding="utf-8", errors="ignore") as f:
        soup = BeautifulSoup(f.read(), "html.parser")
    
    cards = soup.select(".pcard")
    for card in cards:
        card_text = card.get_text(separator=" ", strip=True)
        
        # 1. Price check - must be > 0
        price = 0
        m_price = re.search(r'₹\s*([0-9,]+)', card_text)
        if m_price:
            price = int(m_price.group(1).replace(",", ""))
        if price <= 0:
            continue  # Strictly skip ₹0 / unpriced products

        # 2. Project check - must NOT be a project series product
        a_tag = card.select_one("a.pcard-img") or card.select_one("a[href*='/product/']") or card.select_one("a[href*='/security/']") or card.select_one("a")
        title = ""
        url = ""
        if a_tag:
            title = a_tag.get("aria-label", "") or a_tag.get("title", "")
            url = a_tag.get("href", "")
        if not title:
            title_tag = card.select_one(".pcard-title") or card.select_one("h3") or card.select_one("h2") or card.select_one("a.pcard-name")
            if title_tag:
                title = title_tag.get_text(strip=True)

        img = card.select_one("img[data-nimg]")
        img_src = img.get("srcset", "") if img else ""
        
        # Check if project brand in image path or title
        is_project = "project" in img_src.lower() or "prama-project" in img_src.lower() or "cp-plus-project" in img_src.lower() or "project" in title.lower()
        if is_project:
            continue  # Strictly skip project models

        # 3. PID & Item Code
        pid = ""
        m_pid = re.search(r'PID:\s*([A-Za-z0-9]+)', card_text)
        if m_pid:
            pid = m_pid.group(1)
            
        item_code = ""
        m_item = re.search(r'(?:Item\s*CD|Item\s*Code):\s*([A-Za-z0-9]+)', card_text, re.IGNORECASE)
        if m_item:
            item_code = m_item.group(1)
            
        stock = "In Stock"
        if "Out of Stock" in card_text:
            stock = "Out of Stock"
        elif "Low Stock" in card_text:
            stock = "Low Stock"
        elif "On Order" in card_text:
            stock = "On Order"

        key = pid or item_code or title
        if not key:
            continue

        if key not in extracted:
            extracted[key] = {
                "pid": pid,
                "item_code": item_code,
                "title": title,
                "price": price,
                "stock": stock,
                "url": url,
                "source_files": [fname]
            }
        else:
            if fname not in extracted[key]["source_files"]:
                extracted[key]["source_files"].append(fname)
            if extracted[key]["price"] == 0 and price > 0:
                extracted[key]["price"] = price

print(f"\nTotal Non-Project, Non-Zero Retail Products Extracted: {len(extracted)}")

# Category breakdown
by_cat = {}
for it in extracted.values():
    f = it["source_files"][0]
    cname = f.replace(" _ Mega Compu World.html", "").replace(" _ Mega Jaipur.html", "").replace(".html", "")
    base_cat = re.sub(r'\d+$', '', cname).strip()
    by_cat[base_cat] = by_cat.get(base_cat, 0) + 1

for c, count in sorted(by_cat.items(), key=lambda x: x[1], reverse=True):
    print(f"  {c}: {count} products")
