const fs = require('fs');
const path = 'components/MapplsBoundaryMap.tsx';
let code = fs.readFileSync(path, 'utf8');

const zoneLogicReplacement = `
                    const allAreas = data.areas || [];
                    const subAreasDb = data.sub_areas || {}; // Get DB cached areas

                    // Draw main pincode circle in light gray
                    if (pLat && pLng) {
                       const circle = new window.mappls.Circle({
                         map: map,
                         center: { lat: pLat, lng: pLng },
                         radius: data.radius || 4000,
                         fillColor: "#e2e8f0",
                         fillOpacity: 0.15,
                         strokeColor: "#cbd5e1",
                         strokeWidth: 1,
                       });
                       newLayers.push(circle);
                       if (circle.getBounds) {
                          boundsList.push(circle.getBounds());
                       }
                    }

                    const isEntirePinSelected = dataObj.includes(pin);

                    // Draw sub-areas
                    for (const area of allAreas) {
                       const areaId = \`\${pin}:\${area}\`;
                       const isSelected = isEntirePinSelected || dataObj.includes(areaId);
                       
                       let aLat, aLng;
                       const cacheKey = \`geo_\${pin}_\${area}\`;
                       
                       // 1. Check if Firebase DB knows it (Zero API hits)
                       if (subAreasDb[area] && subAreasDb[area].lat && subAreasDb[area].lng) {
                          aLat = subAreasDb[area].lat;
                          aLng = subAreasDb[area].lng;
                          // sync to local just in case
                          localStorage.setItem(cacheKey, JSON.stringify({lat: aLat, lng: aLng}));
                       } else {
                          // 2. Check local browser cache
                          const cached = localStorage.getItem(cacheKey);
                          if (cached) {
                             const c = JSON.parse(cached);
                             aLat = c.lat;
                             aLng = c.lng;
                          } else {
                             // 3. Fallback to OpenStreetMap + Save to Firebase forever!
                             await new Promise(r => setTimeout(r, 800)); // prevent rate limit
                             try {
                               const geoRes = await fetch(\`https://nominatim.openstreetmap.org/search?q=\${encodeURIComponent(area + " " + pin + " India")}&format=json\`);
                               if (geoRes.ok) {
                                  const geoData = await geoRes.json();
                                  if (geoData && geoData.length > 0) {
                                     aLat = parseFloat(geoData[0].lat);
                                     aLng = parseFloat(geoData[0].lon);
                                     
                                     // Cache locally
                                     localStorage.setItem(cacheKey, JSON.stringify({lat: aLat, lng: aLng}));
                                     
                                     // Save permanently to Firebase (Lazy Geocoding)
                                     fetch(\`/api/pincode/\${pin.trim()}\`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ area, lat: aLat, lng: aLng })
                                     }).catch(err => console.warn('Failed to save geo to db:', err));
                                  }
                               }
                             } catch(e) {}
                          }
                       }
`;

// we need to replace everything from `const allAreas = data.areas || [];`
// down to right before `// Approximate if geocoding fails`
const startStr = "const allAreas = data.areas || [];";
const endStr = "// Approximate if geocoding fails";

const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
  const newCode = code.substring(0, startIdx) + zoneLogicReplacement + "\n                       " + code.substring(endIdx);
  fs.writeFileSync(path, newCode);
  console.log("Updated Map component!");
} else {
  console.log("Failed to find replacement indices");
}
