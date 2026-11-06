import os

target_ids = [
    "HDMI-1.5M", "HDMI-3M", "HDMI-5M", "HDMI-10M", "HDMI-15M", "HDMI-20M",
    "ACC-2U-RACK-RECORDER", "ACC-4U-RACK-RECORDER", "ACC-PVC-RACK-POE",
    "DISP-19-INCH", "ACC-4G-ROUTER", "ACC-WIFI-EXTENDER", "CAB-ELEC-2CORE-PU"
]

found = {t: [] for t in target_ids}
scan_dirs = ['app', 'components', 'lib']

for sdir in scan_dirs:
    for root, dirs, files in os.walk(sdir):
        for f in files:
            if f.endswith(('.ts', '.tsx')):
                path = os.path.join(root, f)
                with open(path, 'r', encoding='utf-8', errors='ignore') as fp:
                    content = fp.read()
                    for tid in target_ids:
                        if tid in content:
                            found[tid].append(path)

for tid, file_list in found.items():
    print(f"{tid.padEnd(25)}: {len(file_list)} files -> {file_list}")
