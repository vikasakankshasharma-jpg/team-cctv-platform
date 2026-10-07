import fs from "fs";

let content = fs.readFileSync("lib/product-resolver.ts", "utf8");

content = content.replace(
  /const getCameraBySpec = \(formFactor: string, targetTier: string\) => \{[\s\S]*?if \(filtered\.length === 0\) return cams\[0\]; \/\/ Desperate fallback\n\s*return filtered\.sort\(\(a, b\) => \(a\.unit_price \|\| 0\) - \(b\.unit_price \|\| 0\)\)\[0\];\n\s*\};/,
  `const getCameraBySpec = (formFactor: string, targetTier: string) => {
    let targetResolution = req.camera_resolution;
    // Default to 2MP for HD, 5MP for IP if missing (safe fallback)
    if (!targetResolution) {
       targetResolution = config.technology === "IP" ? "5MP" : "2MP";
    }

    let filtered = cams.filter(p => {
      const pForm = (p.specifications as any)?.formFactor || p.type;
      const matchForm = pForm === formFactor || pForm?.toLowerCase() === formFactor.toLowerCase();
      const matchTier = targetTier === "BUDGET" ? p.brand === "Budget Brand" : p.brand !== "Budget Brand";
      
      const pRes = (p.specifications as any)?.resolution || p.resolution;
      let matchRes = false;
      if (!pRes) {
         // Check display_name if resolution field is missing
         matchRes = p.display_name?.toLowerCase().includes(targetResolution.toLowerCase()) || false;
      } else {
         matchRes = pRes === targetResolution || pRes.includes(targetResolution);
      }

      return matchForm && matchTier && matchRes;
    });

    if (filtered.length === 0) {
      // Fallback 1: Drop Brand filter, keep Resolution & Form
      filtered = cams.filter(p => {
        const pForm = (p.specifications as any)?.formFactor || p.type;
        const matchForm = pForm === formFactor || pForm?.toLowerCase() === formFactor.toLowerCase();
        
        const pRes = (p.specifications as any)?.resolution || p.resolution;
        let matchRes = false;
        if (!pRes) {
           matchRes = p.display_name?.toLowerCase().includes(targetResolution.toLowerCase()) || false;
        } else {
           matchRes = pRes === targetResolution || pRes.includes(targetResolution);
        }
        return matchForm && matchRes;
      });
    }

    if (filtered.length === 0) {
      // Fallback 2: Drop Resolution filter, keep Form & Brand
      filtered = cams.filter(p => {
        const pForm = (p.specifications as any)?.formFactor || p.type;
        const matchForm = pForm === formFactor || pForm?.toLowerCase() === formFactor.toLowerCase();
        const matchTier = targetTier === "BUDGET" ? p.brand === "Budget Brand" : p.brand !== "Budget Brand";
        return matchForm && matchTier;
      });
    }

    if (filtered.length === 0) {
      // Fallback 3: Drop Resolution & Brand filter, keep Form
      filtered = cams.filter(p => {
        const pForm = (p.specifications as any)?.formFactor || p.type;
        return pForm === formFactor || pForm?.toLowerCase() === formFactor.toLowerCase();
      });
    }

    if (filtered.length === 0) return cams[0]; // Desperate fallback
    return filtered.sort((a, b) => (a.unit_price || 0) - (b.unit_price || 0))[0];
  };`
);

fs.writeFileSync("lib/product-resolver.ts", content);
console.log("Updated product-resolver.ts with resolution mapping");
