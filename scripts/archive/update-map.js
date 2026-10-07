const fs = require('fs');
const path = 'components/MapplsBoundaryMap.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `
                    const isEntirePinSelected = dataObj.includes(pin);

                    const normalizeArea = (s: string) => {
                       if (!s) return '';
                       return s.replace(/\\s+(S\\.O|B\\.O|H\\.O|G\\.P\\.O\\.|S\\.O\\.|B\\.O\\.|H\\.O\\.)(\\s+|$)/gi, ' ').replace(/\\s*\\([^)]*\\)/g, '').trim().toLowerCase();
                    };

                    const drawItems = data.quadrants && data.quadrants.length > 0 ? data.quadrants.map((q: any) => ({
                      id: \`\${pin}:\${q.zone}\`,
                      name: q.zone,
                      searchQuery: \`\${q.anchor}, \${pin} India\`,
                      cacheKey: \`geo_\${pin}_\${q.zone.replace(/\\s+/g, '')}\`,
                      matchName: q.zone
                    })) : (data.areas || []).map((area: string) => ({
                      id: \`\${pin}:\${area}\`,
                      name: area,
                      searchQuery: \`\${area} \${pin} India\`,
                      cacheKey: \`geo_\${pin}_\${area}\`,
                      matchName: area
                    }));

                    // Draw sub-areas or quadrants
                    for (const item of drawItems) {
                       const isSelected = isEntirePinSelected || dataObj.some((selected: string) => {
                          if (selected === item.id) return true;
                          if (selected.startsWith(pin + ':')) {
                             const sName = normalizeArea(selected.split(':')[1]);
                             const aName = normalizeArea(item.matchName);
                             return sName === aName || sName.includes(aName) || aName.includes(sName);
                          }
                          return false;
                       });

                       let aLat, aLng;
                       
                       // 1. Check if Firebase DB knows it (Zero API hits)
                       if (subAreasDb[item.name] && subAreasDb[item.name].lat && subAreasDb[item.name].lng) {
                          aLat = subAreasDb[item.name].lat;
                          aLng = subAreasDb[item.name].lng;
                          localStorage.setItem(item.cacheKey, JSON.stringify({lat: aLat, lng: aLng}));
                       } else {
                          // 2. Check local browser cache
                          const cached = localStorage.getItem(item.cacheKey);
                          if (cached) {
                             const c = JSON.parse(cached);
                             aLat = c.lat;
                             aLng = c.lng;
                          } else {
                             // 3. Fallback to OpenStreetMap + Save to Firebase forever!
                             await new Promise(r => setTimeout(r, 800)); // prevent rate limit
                             try {
                               const geoRes = await fetch(\`https://nominatim.openstreetmap.org/search?q=\${encodeURIComponent(item.searchQuery)}&format=json\`);
                               if (geoRes.ok) {
                                  const geoData = await geoRes.json();
                                  if (geoData && geoData.length > 0) {
                                     aLat = parseFloat(geoData[0].lat);
                                     aLng = parseFloat(geoData[0].lon);
                                     
                                     // Cache locally
                                     localStorage.setItem(item.cacheKey, JSON.stringify({lat: aLat, lng: aLng}));
                                     
                                     // Save permanently to Firebase (Lazy Geocoding)
                                     fetch(\`/api/pincode/\${pin.trim()}\`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ area: item.name, lat: aLat, lng: aLng })
                                     }).catch(err => console.warn('Failed to save geo to db:', err));
                                  }
                               }
                             } catch(e) {}
                          }
                       }

                       // Approximate if geocoding fails
                       if (!aLat || !aLng) {
                          if (pLat && pLng) {
                            const hash = item.name.split('').reduce((a: number, b: string) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
`;

const startStr = 'const isEntirePinSelected = dataObj.includes(pin);';
const endStr = '// Approximate if geocoding fails\n                       if (!aLat || !aLng) {\n                          if (pLat && pLng) {\n                            const hash = area.split(\'\').reduce((a: number, b: string) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);';

// I need to use index mapping
const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf('// Approximate if geocoding fails');
const fullEndIdx = code.indexOf('const hash = ', endIdx);
const veryEnd = code.indexOf(';', fullEndIdx) + 1;

if (startIdx !== -1 && veryEnd !== -1) {
  code = code.substring(0, startIdx) + replacement + code.substring(veryEnd);
  // Also remove `const allAreas = data.areas || [];`
  code = code.replace('const allAreas = data.areas || [];', '');
  
  // replace the remaining instances of `area` with `item.name` inside the circle generation
  // specifically `area` inside the bindPopup
  
  fs.writeFileSync(path, code);
  console.log('Replaced map rendering logic');
} else {
  console.log('Could not find indices', startIdx, endIdx);
}
