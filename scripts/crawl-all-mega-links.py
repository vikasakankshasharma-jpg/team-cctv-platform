import urllib.request
import re
import json
import time
import sys

sys.stdout.reconfigure(encoding='utf-8')

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

categories_to_crawl = [
    # (Category Path, Max pages to check)
    ('/security/hd-camera-dvr', 3),
    ('/security/hd-dvr', 2),
    ('/security/ip-camera', 4),
    ('/security/ip-nvr', 3),
    ('/security/ptz-pt-4g-wifi-camera', 2),
    ('/security/power-supply-adapter', 5),
    ('/data-storage/surveillance-hard-disk', 2),
    ('/data-storage/sd--micro-sd-cards', 3),
    ('/networking/poe-switch', 4),
    ('/networking/networking-desktop-switch', 2),
    ('/networking/rack-and-accessories', 3),
    ('/networking/router-access-point-range-extender', 3),
    ('/accessories-cctv--networking', 4),
    ('/cables2/hdmi-cables', 4),
    ('/cables2/lan-cables-cat6', 5)
]

all_product_links = {}

def get_items_from_url(url):
    try:
        req = urllib.request.Request(url, headers=headers)
        html = urllib.request.urlopen(req, timeout=15).read().decode('utf-8', errors='ignore')
        items = []
        for script in re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.S):
            try:
                data = json.loads(script)
                if isinstance(data, dict) and data.get('@type') == 'ItemList':
                    for elem in data.get('itemListElement', []):
                        if elem.get('url') and elem.get('name'):
                            items.append({
                                'name': elem.get('name'),
                                'url': elem.get('url'),
                                'position': elem.get('position')
                            })
                    break
            except:
                pass
        return items
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return []

for cat_path, max_pages in categories_to_crawl:
    cat_items = []
    # page 1
    p1_items = get_items_from_url(f"https://megajaipur.com{cat_path}")
    cat_items.extend(p1_items)
    
    # subsequent pages
    for p in range(2, max_pages + 1):
        p_items = get_items_from_url(f"https://megajaipur.com{cat_path}?page={p}")
        if not p_items:
            break
        cat_items.extend(p_items)
        time.sleep(0.2)
        
    all_product_links[cat_path] = cat_items
    print(f"Cat {cat_path}: found {len(cat_items)} products")

total_count = sum(len(v) for v in all_product_links.values())
print(f"\nTOTAL PRODUCTS FOUND ACROSS ALL SURVEILLANCE CATEGORIES: {total_count}")

with open("scratch_all_mega_links.json", "w", encoding="utf-8") as f:
    json.dump(all_product_links, f, indent=2, ensure_ascii=False)

print("Saved product links to scratch_all_mega_links.json")
