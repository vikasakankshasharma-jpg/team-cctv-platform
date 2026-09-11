import re

with open("lib/product-resolver.ts", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Add `isBrandMatch` function and remove strict filtering in `resolveProducts` pool
is_brand_match_func = """function isBrandMatch(p: Product, brandFilter: string): boolean {
  if (!brandFilter || brandFilter === "Budget" || brandFilter === "All Brands") return true;
  const filterLower = brandFilter.toLowerCase().replace(/\\s+/g, "");
  
  let pBrand = p.brand;
  if (!pBrand) {
     if (p.display_name.toLowerCase().includes("cp plus")) pBrand = "CP Plus";
     else if (p.display_name.toLowerCase().includes("hikvision")) pBrand = "Hikvision";
     else if (p.display_name.toLowerCase().includes("prama")) pBrand = "Prama";
     else if (p.display_name.toLowerCase().includes("dahua")) pBrand = "Dahua";
  }
  if (pBrand) {
     const lower = pBrand.toLowerCase().replace(/\\s+/g, "");
     if (lower === "cpplus" && filterLower === "cpplus") return true;
     if (lower === filterLower) return true;
  }
  
  if (p.brand?.toLowerCase().includes(brandFilter.toLowerCase())) return true;
  if (p.display_name?.toLowerCase().includes(brandFilter.toLowerCase())) return true;
  
  return false;
}
"""

content = re.sub(
    r'if \(brandFilter && brandFilter !== "Budget"\) \{.*?\n\s+if \(!p\.is_active',
    r'if (!p.is_active',
    content,
    flags=re.DOTALL
)

content += "\n" + is_brand_match_func

# 2. Update resolveCamerasForPermutation
def replace_camera_sort(m):
    return """
    if (isBudget) {
      const budgetItems = filtered.filter(p => p.brand?.toLowerCase().includes("budget") || p.display_name?.toLowerCase().includes("budget"));
      if (budgetItems.length > 0) return budgetItems.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
      return filtered.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
    }

    if (brandFilter) {
      const brandItems = filtered.filter(p => isBrandMatch(p, brandFilter));
      if (brandItems.length > 0) return brandItems.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
    }

    return filtered.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
  };"""

content = re.sub(
    r'if \(isBudget\) \{.*?return filtered\.sort\(\(a, b\) => \(a\.unit_price \|\| 0\) - \(b\.unit_price \|\| 0\)\)\[0\];\s*\n\s*\};\s*',
    replace_camera_sort,
    content,
    flags=re.DOTALL
)

# 3. Update resolveRecorderForPermutation
def replace_recorder_sort(m):
    return """
  if (isBudget) {
    const budgetRecs = recs.filter(p => p.brand?.toLowerCase().includes("budget") || p.display_name?.toLowerCase().includes("budget"));
    if (budgetRecs.length > 0) return budgetRecs.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
    return recs.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
  }

  if (brandFilter) {
    const brandRecs = recs.filter(p => isBrandMatch(p, brandFilter));
    if (brandRecs.length > 0) return brandRecs.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
  }

  return recs.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
}"""

content = re.sub(
    r'if \(isBudget\) \{.*?return recs\.sort\(\(a, b\) => \(a\.unit_price \|\| 0\) - \(b\.unit_price \|\| 0\)\)\[0\];\s*\n\}',
    replace_recorder_sort,
    content,
    flags=re.DOTALL
)

# 4. Update resolveStorageForPermutation
def replace_storage_sort(m):
    return """
  if (valid.length === 0) return undefined;
  
  if (brandFilter && brandFilter !== "Budget" && brandFilter !== "All Brands") {
    const brandStorage = valid.filter(p => isBrandMatch(p, brandFilter));
    if (brandStorage.length > 0) {
      return brandStorage.sort((a, b) => {
        const tbDiff = getTb(a) - getTb(b);
        if (tbDiff !== 0) return tbDiff;
        return (a.unit_price || 0) - (b.unit_price || 0);
      })[0];
    }
  }
  
  return valid.sort((a, b) => {
    const tbDiff = getTb(a) - getTb(b);
    if (tbDiff !== 0) return tbDiff;
    return (a.unit_price || 0) - (b.unit_price || 0);
  })[0];
}"""

content = re.sub(
    r'if \(valid\.length === 0\) return undefined;\s*\n\s*return valid\.sort\(\(a, b\) => \{.*?\}\)\[0\];\s*\n\}',
    replace_storage_sort,
    content,
    flags=re.DOTALL
)

# 5. Update resolvePowerForPermutation
def replace_power_sort(m):
    return """
  if (isBudget) {
    const budgetPsu = valid.filter(p => p.brand?.toLowerCase().includes("budget") || p.display_name?.toLowerCase().includes("budget"));
    if (budgetPsu.length > 0) return budgetPsu.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
    return valid.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
  }

  if (brandFilter) {
    const brandPsu = valid.filter(p => isBrandMatch(p, brandFilter));
    if (brandPsu.length > 0) return brandPsu.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
  }

  return valid.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
}"""

content = re.sub(
    r'if \(isBudget\) \{.*?return valid\.sort\(\(a, b\) => \(a\.unit_price \|\| 0\) - \(b\.unit_price \|\| 0\)\)\[0\];\s*\n\}',
    replace_power_sort,
    content,
    flags=re.DOTALL
)

with open("lib/product-resolver.ts", "w", encoding="utf-8") as f:
    f.write(content)
