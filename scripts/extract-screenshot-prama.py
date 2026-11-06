import json
import sys

sys.stdout.reconfigure(encoding='utf-8')

# The 3 screenshots show Prama IP cameras:
# Image 1 (4MP): 8 products
# Image 2 (2MP): 7 products
# Image 3 (6MP): 4 products

prama_screenshot_products = [
    # 4MP (Image 1)
    {"pid": "A2477", "model": "143D3-N", "type": "Dome", "res": "4MP", "price": 4255},
    {"pid": "A2424", "model": "140D3-N", "type": "Bullet", "res": "4MP", "price": 4313},
    {"pid": "A2036", "model": "143D3-WNM", "type": "Dome with Mic 2.8mm", "res": "4MP", "price": 4658},
    {"pid": "A3915", "model": "143D3-WNM", "type": "Dome with Mic 4mm", "res": "4MP", "price": 4658},
    {"pid": "A2038", "model": "140D3-WNM", "type": "Bullet with Mic 4mm", "res": "4MP", "price": 4830},
    {"pid": "P6599", "model": "143D7-WNMS", "type": "Dome SD Slot 2-Way Audio 2.8mm", "res": "4MP", "price": 6099},
    {"pid": "P6566", "model": "140D7-WNMS", "type": "Bullet SD Slot 2-Way Audio 4mm", "res": "4MP", "price": 6153},
    {"pid": "A3061", "model": "NC146D3-WNRAM(D2)", "type": "Bullet Varifocal with Mic", "res": "4MP", "price": 9890},

    # 2MP (Image 2)
    {"pid": "A2305", "model": "123D3-N", "type": "Dome", "res": "2MP", "price": 3335},
    {"pid": "A2040", "model": "120D3-N", "type": "Bullet", "res": "2MP", "price": 3393},
    {"pid": "A2196", "model": "123D3-WNM", "type": "Dome with Mic 2.8mm", "res": "2MP", "price": 3508},
    {"pid": "A2235", "model": "120D3-WNM", "type": "Bullet with Mic 4mm", "res": "2MP", "price": 3577},
    {"pid": "P6590", "model": "123D7-WNMS", "type": "Dome SD Slot 2-Way Audio 2.8mm", "res": "2MP", "price": 4600},
    {"pid": "P2406", "model": "120D7-WNMS", "type": "Bullet SD Slot 2-Way Audio 4mm", "res": "2MP", "price": 4752},
    {"pid": "A3541", "model": "NC126D3-WNRAM(D2)", "type": "Bullet Varifocal with Mic", "res": "2MP", "price": 7820},

    # 6MP (Image 3)
    {"pid": "A2039", "model": "163D3-WNM", "type": "Dome with Mic 2.8mm", "res": "6MP", "price": 6498},
    {"pid": "A2724", "model": "160D3-WNM", "type": "Bullet with Mic 4mm", "res": "6MP", "price": 6559},
    {"pid": "P6558", "model": "163D3-WNMS", "type": "Dome SD Slot 2-Way Audio 2.8mm", "res": "6MP", "price": 6900},
    {"pid": "P6555", "model": "160D3-WNMS", "type": "Bullet SD Slot 2-Way Audio 4mm", "res": "6MP", "price": 7475}
]

print(f"Total Prama IP products extracted directly from user screenshots: {len(prama_screenshot_products)}")
for p in prama_screenshot_products:
    print(f"  [{p['pid']}] Prama {p['res']} {p['type']} ({p['model']}) @ ₹{p['price']}")
