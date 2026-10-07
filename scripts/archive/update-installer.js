const fs = require('fs');

const path = 'components/installer/RoutePlannerClient.tsx';
let code = fs.readFileSync(path, 'utf8');

// Replace isMapLoaded
code = code.replace(/\{isMapLoaded \? \([\s\S]*?Loading Google Maps\.\.\.[\s\S]*?<\/div>\s*\)\}/g, 
`<HybridMap
  center={defaultCenter}
  zoom={12}
  markers={[
    ...(technicianLocation ? [{
      id: "tech-loc",
      lat: technicianLocation.lat,
      lng: technicianLocation.lng,
      iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#0284C7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>')
    }] : []),
    ...scheduledStops.filter(s => s.coordinates?.lat && s.coordinates?.lng).map((stop, idx) => ({
      id: stop.id,
      lat: stop.coordinates!.lat,
      lng: stop.coordinates!.lng,
      onClick: () => setSelectedMarker(stop),
      iconUrl: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(\`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="\${stop.status === 'completed' || stop.status === 'WON' ? '#10b981' : '#f59e0b'}" stroke="white" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><text x="12" y="14" font-family="Arial" font-size="10" font-weight="bold" text-anchor="middle" fill="white">\${idx + 1}</text></svg>\`)
    }))
  ]}
  polylines={[{
    id: "route-line",
    path: [
      ...(technicianLocation ? [technicianLocation] : []),
      ...scheduledStops.filter(s => s.coordinates?.lat && s.coordinates?.lng).map(s => s.coordinates!)
    ],
    color: "#3b82f6",
    weight: 4,
    opacity: 0.8
  }]}
/>
{selectedMarker && (
  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur shadow-xl rounded-xl p-4 border border-zinc-200 z-10 min-w-[240px]">
    <button onClick={() => setSelectedMarker(null)} className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-700">
      <X className="w-4 h-4" />
    </button>
    <div className="font-bold text-sm mb-1 pr-6">{selectedMarker.customer_name || "Customer"}</div>
    <div className="text-xs text-zinc-600 mb-2 truncate max-w-[200px]">{selectedMarker.address?.street || "Address"}</div>
    <div className="text-[10px] text-zinc-500 font-mono">
      Stop #{scheduledStops.findIndex(s => s.id === selectedMarker.id) + 1} &bull; {selectedMarker.status}
    </div>
  </div>
)}`);

fs.writeFileSync(path, code);
console.log("Replaced successfully!");
