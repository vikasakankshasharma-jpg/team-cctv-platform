const fs = require('fs');
const path = 'app/api/pincode/[pin]/route.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /await cacheRef\.set\(\{\s*sub_areas:\s*\{\s*\[area\]:\s*\{\s*lat,\s*lng\s*\}\s*\},\s*updated_at:\s*serverTimestamp\(\)\s*\},\s*\{\s*merge:\s*true\s*\}\);/g,
  `await cacheRef.set({
      [\`sub_areas.\${area}\`]: { lat, lng },
      updated_at: serverTimestamp()
    }, { merge: true });`
);

fs.writeFileSync(path, code);
console.log("Fixed!");
