const fs = require('fs');
const path = 'components/MapplsBoundaryMap.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Add boundaryData to Props
code = code.replace(
  'boundaryQuery?: string;',
  'boundaryQuery?: string;\n  boundaryData?: any;'
);

// 2. Modify renderBoundary signature
code = code.replace(
  'async (map: any, type: string, query: string) => {',
  'async (map: any, type: string, query: string, dataObj?: any) => {'
);
code = code.replace(
  'if (!window.mappls || !map || !query) return;',
  'if (!window.mappls || !map || (!query && !dataObj)) return;'
);

// 3. Inject Zone rendering logic
const zoneLogic = `
        } else if (type === "zone" && Array.isArray(dataObj) && dataObj.length > 0) {
            try {
              const newLayers: any[] = [];
              const boundsList: any[] = [];
              const basePincodes = Array.from(new Set(dataObj.map(p => p.split(':')[0])));

              await Promise.all(basePincodes.map(async (pin) => {
                try {
                  const res = await fetch(\`/api/pincode/\${pin.trim()}\`);
                  if (res.ok) {
                    const data = await res.json();
                    let pLat = data.lat;
                    let pLng = data.lng;
                    const allAreas = data.areas || [];

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
                       const cached = localStorage.getItem(cacheKey);
                       if (cached) {
                          const c = JSON.parse(cached);
                          aLat = c.lat;
                          aLng = c.lng;
                       } else {
                          await new Promise(r => setTimeout(r, 800)); // prevent rate limit
                          try {
                            const geoRes = await fetch(\`https://nominatim.openstreetmap.org/search?q=\${encodeURIComponent(area + " " + pin + " India")}&format=json\`);
                            if (geoRes.ok) {
                               const geoData = await geoRes.json();
                               if (geoData && geoData.length > 0) {
                                  aLat = parseFloat(geoData[0].lat);
                                  aLng = parseFloat(geoData[0].lon);
                                  localStorage.setItem(cacheKey, JSON.stringify({lat: aLat, lng: aLng}));
                               }
                            }
                          } catch(e) {}
                       }

                       // Approximate if geocoding fails
                       if (!aLat || !aLng) {
                          if (pLat && pLng) {
                            const hash = area.split('').reduce((a, b) => { a = ((a << 5) - a) + b.charCodeAt(0); return a & a }, 0);
                            const angle = (Math.abs(hash) % 360) * (Math.PI / 180);
                            const r = ((Math.abs(hash) % 20) + 5) * 0.001; // offset by 0.005 to 0.025 degrees
                            aLat = pLat + (r * Math.cos(angle));
                            aLng = pLng + (r * Math.sin(angle));
                          } else {
                            continue;
                          }
                       }

                       const areaCircle = new window.mappls.Circle({
                         map: map,
                         center: { lat: aLat, lng: aLng },
                         radius: 1200, // 1.2km radius for sub-areas
                         fillColor: isSelected ? "#3b82f6" : "#ef4444",
                         fillOpacity: isSelected ? 0.4 : 0.2,
                         strokeColor: isSelected ? "#1d4ed8" : "#dc2626",
                         strokeWidth: 2,
                       });
                       newLayers.push(areaCircle);
                    }
                  }
                } catch(e) {}
              }));

              currentLayerRef.current = newLayers;
              // Only fit bounds if we have them and it's the first time drawing this set of pincodes
              // We can rely on the user zooming manually after the initial render.
              if (boundsList.length > 0 && map.fitBounds && !window._didInitialZoneFit) {
                 window._didInitialZoneFit = true;
                 map.fitBounds(boundsList[0]);
              }
            } catch (e) {
              console.warn("Failed to render zone multi-areas:", e);
            }
`;

code = code.replace(
  '} else if (type === "district" && query) {',
  zoneLogic + '\n        } else if (type === "district" && query) {'
);

// 4. Update the SDK ready callback to pass boundaryData
code = code.replace(
  'renderBoundary(map, boundaryType, boundaryQuery);',
  'renderBoundary(map, boundaryType, boundaryQuery || "", boundaryData);'
);

// 5. Update useEffect dependency array and invocation
code = code.replace(
  'useEffect(() => {\n    if (!mapInstanceRef.current || !boundaryQuery) return;\n    renderBoundary(mapInstanceRef.current, boundaryType, boundaryQuery);\n  }, [boundaryType, boundaryQuery, renderBoundary]);',
  'useEffect(() => {\n    if (!mapInstanceRef.current) return;\n    // Quick deep compare for boundaryData array to avoid flicker\n    const dataStr = JSON.stringify(boundaryData || []);\n    if (!boundaryQuery && dataStr === "[]") return;\n    renderBoundary(mapInstanceRef.current, boundaryType, boundaryQuery || "", boundaryData);\n  }, [boundaryType, boundaryQuery, JSON.stringify(boundaryData), renderBoundary]);'
);

fs.writeFileSync(path, code);
console.log("Updated MapplsBoundaryMap.tsx!");
