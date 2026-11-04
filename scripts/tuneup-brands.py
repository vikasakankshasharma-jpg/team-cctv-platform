#!/usr/bin/env python3
"""
scripts/tuneup-brands.py
Adds new brands and manufacturers discovered from Mega Compu World to lib/brand-utils.ts
and components/quotation/DynamicVariantGenerator.tsx
"""

import os

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
brand_utils_path = os.path.join(base_dir, "lib", "brand-utils.ts")
dynamic_gen_path = os.path.join(base_dir, "components", "quotation", "DynamicVariantGenerator.tsx")

with open(brand_utils_path, "r", encoding="utf-8") as f:
    bu_content = f.read().replace("\r\n", "\n")

# 1. Update CANONICAL_BRAND_NAMES
old_dict = '  "unv": "Uniview",\n};'
new_dict = """  "unv": "Uniview",
  "hifocus": "Hi-Focus",
  "hi-focus": "Hi-Focus",
  "hi focus": "Hi-Focus",
  "securelink": "Securelink",
  "secure link": "Securelink",
  "evm": "EVM",
  "toshiba": "Toshiba",
  "multybyte": "Multybyte",
  "jascom": "Jascom",
  "bungees": "Bungees",
  "ranz": "Ranz",
  "cofe": "Cofe",
  "comrack": "Comrack",
};"""

if old_dict in bu_content:
    bu_content = bu_content.replace(old_dict, new_dict)
    print("[+] Added new brands to CANONICAL_BRAND_NAMES")

# 2. Update getCanonicalBrandKey
old_key = '  if (cleaned.includes("imou")) {\n    return "imou";\n  }'
new_key = """  if (cleaned.includes("imou")) {
    return "imou";
  }
  if (cleaned.includes("hi-focus") || cleaned.includes("hifocus") || cleaned === "hi focus") {
    return "hifocus";
  }
  if (cleaned.includes("securelink") || cleaned.includes("secure link")) {
    return "securelink";
  }
  if (cleaned.includes("evm")) {
    return "evm";
  }
  if (cleaned.includes("toshiba")) {
    return "toshiba";
  }
  if (cleaned.includes("multybyte")) {
    return "multybyte";
  }
  if (cleaned.includes("jascom")) {
    return "jascom";
  }
  if (cleaned.includes("bungees")) {
    return "bungees";
  }
  if (cleaned.includes("ranz")) {
    return "ranz";
  }"""

if old_key in bu_content:
    bu_content = bu_content.replace(old_key, new_key)
    print("[+] Added new brand keys to getCanonicalBrandKey")

# 3. Update inferBrandFromName
old_infer = '  if (lower.includes("tp-link") || lower.includes("tplink")) return "TP-Link";\n  return null;'
new_infer = """  if (lower.includes("tp-link") || lower.includes("tplink")) return "TP-Link";
  if (lower.includes("hi-focus") || lower.includes("hifocus")) return "Hi-Focus";
  if (lower.includes("securelink")) return "Securelink";
  if (lower.includes("evm")) return "EVM";
  if (lower.includes("toshiba")) return "Toshiba";
  if (lower.includes("multybyte")) return "Multybyte";
  if (lower.includes("jascom")) return "Jascom";
  if (lower.includes("bungees")) return "Bungees";
  if (lower.includes("ranz")) return "Ranz";
  return null;"""

if old_infer in bu_content:
    bu_content = bu_content.replace(old_infer, new_infer)
    print("[+] Added new brand inferences to inferBrandFromName")

with open(brand_utils_path, "w", encoding="utf-8", newline="\n") as f:
    f.write(bu_content)

# 4. Update DynamicVariantGenerator.tsx brand tab sequence
with open(dynamic_gen_path, "r", encoding="utf-8") as f:
    dg_content = f.read().replace("\r\n", "\n")

old_brand_order = ': ["all", "aproducts", "cpplus", "hikvision", "prama", "secureye", "trueview", "budget", "dahua"];'
new_brand_order = ': ["all", "aproducts", "cpplus", "hikvision", "prama", "secureye", "trueview", "hifocus", "budget", "dahua"];'

if old_brand_order in dg_content:
    dg_content = dg_content.replace(old_brand_order, new_brand_order)
    with open(dynamic_gen_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(dg_content)
    print("[+] Added hifocus to DynamicVariantGenerator brand sequence")

print("\nTune-up complete!")
