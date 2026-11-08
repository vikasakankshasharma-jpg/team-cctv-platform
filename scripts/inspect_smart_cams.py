import json

with open("secure-easy/scripts/pricing-master-seed.json", encoding="utf-8") as f:
    seed = json.load(f)

smart = [
    p for p in seed 
    if p.get("category") == "camera" and any(
        term in (p.get("display_name", "") + " " + " ".join(p.get("technologies", []))).lower() 
        for term in ["4g", "wifi", "wi-fi", "wireless", "ptz", "pt "]
    )
]

print(f"Total Smart/4G/Wi-Fi/PT/PTZ cameras found: {len(smart)}\n")
for p in smart:
    techs = ",".join(p.get("technologies", []))
    name = p.get("display_name")
    pid = p.get("id")
    cost = p.get("base_cost")
    price = p.get("unit_price")
    brand = p.get("brand") or "Generic"
    print(f"[{pid}] {name} (Brand: {brand}, Tech: {techs}, Cost: {cost}, Price: {price})")
