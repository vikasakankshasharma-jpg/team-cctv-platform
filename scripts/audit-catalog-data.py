import json

with open("scratch_dump_99.json", "r", encoding="utf-8") as f:
    products = json.load(f)

print(f"Loaded {len(products)} products from Firestore dump.")

anomalies = []

for p in products:
    pid = p['id']
    cat = p.get('category')
    tech = p.get('technology')
    name = p.get('display_name', '')
    tech_name = p.get('technical_name', '')
    full_name = f"{name} {tech_name}".lower()

    # 1. Category checks
    if not cat:
        anomalies.append((pid, "MISSING_CATEGORY", p))
    
    # 2. Camera checks
    if cat == "cctv_camera":
        # Form factor check
        if "dome" in full_name and p.get('form_factor') != "dome" and "ptz" not in full_name and "pt" not in full_name:
            anomalies.append((pid, f"FORM_FACTOR_MISMATCH: name has dome but form_factor={p.get('form_factor')}", p))
        elif "bullet" in full_name and p.get('form_factor') != "bullet" and "ptz" not in full_name:
            anomalies.append((pid, f"FORM_FACTOR_MISMATCH: name has bullet but form_factor={p.get('form_factor')}", p))
            
        # Audio check: Analog HD cannot have 2-way talk / speaker
        if tech == "HD":
            if p.get('has_two_way') is True or p.get('has_speaker') is True:
                anomalies.append((pid, "HD_AUDIO_ANOMALY: Analog HD camera has two_way/speaker true!", p))
        
        # Resolution check
        if not p.get('resolution_mp'):
            anomalies.append((pid, "MISSING_RESOLUTION_MP", p))

    # 3. Recorder checks
    elif cat == "recorder":
        if not p.get('channels') or p.get('channels') <= 0:
            anomalies.append((pid, "RECORDER_MISSING_CHANNELS", p))
        if tech == "HD" and "nvr" in full_name:
            anomalies.append((pid, "RECORDER_TECH_MISMATCH: marked HD but name has nvr", p))
        if tech == "IP" and "dvr" in full_name and "xvr" not in full_name:
            anomalies.append((pid, "RECORDER_TECH_MISMATCH: marked IP but name has dvr", p))

    # 4. Storage checks
    elif cat == "storage":
        if not p.get('storage_capacity_tb') and not p.get('storage_capacity_gb'):
            anomalies.append((pid, "STORAGE_MISSING_CAPACITY", p))

    # 5. Power device checks
    elif cat == "power_device":
        if not p.get('channels') and not p.get('max_cameras'):
            anomalies.append((pid, "POWER_MISSING_CHANNELS_CAPACITY", p))

print(f"\n--- ANOMALIES FOUND: {len(anomalies)} ---")
for pid, reason, p in anomalies:
    print(f"[{pid}] {reason} -> {p.get('display_name')}")
