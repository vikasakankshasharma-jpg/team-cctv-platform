"use client";

import { useState, useEffect, useMemo } from "react";
import { CoverageZone, Salesperson } from "@/types";
import { Search, Loader2, MapPin, Check, AlertTriangle, ShieldCheck, Map as MapIcon, LayoutGrid } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePincodeCoverage, PincodeData } from "@/hooks/usePincodeCoverage";
import { GoogleMap, Marker, Circle, InfoWindow } from "@react-google-maps/api";
import { computeDistrictPincodes } from "@/lib/geo-utils";

interface Props {
  zones: CoverageZone[];
  salespersons: Salesperson[];
  isLoaded: boolean;
}

export function TerritoryMatrix({ zones, salespersons, isLoaded }: Props) {
  const [viewMode, setViewMode] = useState<"grid" | "map">("grid");
  const [selectedPincodeForInfo, setSelectedPincodeForInfo] = useState<string | null>(null);

  const [geoStates, setGeoStates] = useState<{ label: string; value: string }[]>([]);
  const [selectedState, setSelectedState] = useState<{ name: string; slug: string } | null>(null);
  
  const [geoDistricts, setGeoDistricts] = useState<{ label: string; value: string }[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<{ name: string; slug: string } | null>(null);
  
  const [districtOffices, setDistrictOffices] = useState<any[]>([]);

  const rawPincodesForMap = useMemo<PincodeData[]>(() => {
    return computeDistrictPincodes(districtOffices);
  }, [districtOffices]);

  const { enrichedPincodes } = usePincodeCoverage(isLoaded, rawPincodesForMap);

  const [mapCenter, setMapCenter] = useState({ lat: 26.9124, lng: 75.7873 });
  useEffect(() => {
    const valid = enrichedPincodes.filter(p => p.lat && p.lng);
    if (valid.length > 0 && valid.length === enrichedPincodes.length) {
      const avgLat = valid.reduce((s, p) => s + p.lat!, 0) / valid.length;
      const avgLng = valid.reduce((s, p) => s + p.lng!, 0) / valid.length;
      setMapCenter({ lat: avgLat, lng: avgLng });
    }
  }, [enrichedPincodes]);
  
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingOffices, setLoadingOffices] = useState(false);

  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [pincodeFilter, setPincodeFilter] = useState("");

  // Load States
  useEffect(() => {
    setLoadingStates(true);
    fetch(`/api/admin/geo?type=states&_t=${Date.now()}`)
      .then(async r => {
        if (!r.ok) throw new Error("Proxy error");
        const data = await r.json();
        if (data.error || !Array.isArray(data)) throw new Error(data.error || "Invalid format");
        return data;
      })
      .catch(() => fetch("https://aniket-thapa.github.io/india-pincode-api/states.json").then(r => r.json()))
      .then(data => {
        if (Array.isArray(data)) {
          const sorted = data
            .map((s: any) => ({ label: s.name, value: s.slug }))
            .sort((a, b) => a.label.localeCompare(b.label));
          setGeoStates(sorted);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingStates(false));
  }, []);

  // Load Districts
  useEffect(() => {
    if (!selectedState) {
      setGeoDistricts([]);
      setSelectedDistrict(null);
      return;
    }
    setLoadingDistricts(true);
    fetch(`/api/admin/geo?type=districts&state=${selectedState.slug}&_t=${Date.now()}`)
      .then(async r => {
        if (!r.ok) throw new Error("Proxy error");
        const data = await r.json();
        if (data.error || !data.districts || !Array.isArray(data.districts)) throw new Error(data.error || "Invalid format");
        return data;
      })
      .catch(() => fetch(`https://aniket-thapa.github.io/india-pincode-api/states/${selectedState.slug}.json`).then(r => r.json()))
      .then(data => {
        if (data?.districts && Array.isArray(data.districts)) {
          const sorted = data.districts
            .map((d: any) => ({ label: d.name, value: d.slug }))
            .sort((a: any, b: any) => a.label.localeCompare(b.label));
          setGeoDistricts(sorted);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingDistricts(false));
  }, [selectedState]);

  // Load Offices (Pincodes)
  useEffect(() => {
    if (!selectedState || !selectedDistrict) {
      setDistrictOffices([]);
      return;
    }
    setLoadingOffices(true);
    fetch(`/api/admin/geo?type=offices&state=${selectedState.slug}&district=${selectedDistrict.slug}&_t=${Date.now()}`)
      .then(async r => {
        if (!r.ok) throw new Error("Proxy error");
        const data = await r.json();
        if (data.error || !data.offices || !Array.isArray(data.offices)) throw new Error(data.error || "Invalid format");
        return data;
      })
      .catch(() => fetch(`https://aniket-thapa.github.io/india-pincode-api/districts/${selectedState.slug}/${selectedDistrict.slug}.json`).then(r => r.json()))
      .then(data => {
        const offices = data?.offices || [];
        setDistrictOffices(offices);
      })
      .catch(console.error)
      .finally(() => setLoadingOffices(false));
  }, [selectedState, selectedDistrict]);

  // Aggregate current coverage
  const coveredPincodesSet = useMemo(() => {
    const set = new Set<string>();
    zones.forEach(z => {
      (z.pincodes || []).forEach(p => set.add(p));
    });
    return set;
  }, [zones]);

  const pincodesInDistrict = useMemo(() => {
    const map = new Map<string, { pincode: string; areas: string[]; totalAreas: number; coveredAreas: number; status: 'covered' | 'partial' | 'uncovered' }>();
    districtOffices.forEach(o => {
      if (!map.has(o.pincode)) {
        map.set(o.pincode, { pincode: o.pincode, areas: [], totalAreas: 0, coveredAreas: 0, status: 'uncovered' });
      }
      const entry = map.get(o.pincode)!;
      entry.areas.push(o.office);
      entry.totalAreas += 1;
      
      const isFullyCovered = coveredPincodesSet.has(o.pincode);
      const isAreaCovered = coveredPincodesSet.has(`${o.pincode}:${o.office}`);
      
      if (isFullyCovered || isAreaCovered) {
        entry.coveredAreas += 1;
      }
    });
    
    // Determine status
    Array.from(map.values()).forEach(entry => {
      if (coveredPincodesSet.has(entry.pincode) || entry.coveredAreas === entry.totalAreas) {
        entry.status = 'covered';
      } else if (entry.coveredAreas > 0) {
        entry.status = 'partial';
      } else {
        entry.status = 'uncovered';
      }
    });

    return Array.from(map.values()).sort((a, b) => a.pincode.localeCompare(b.pincode));
  }, [districtOffices, coveredPincodesSet]);

  const filteredPincodes = pincodesInDistrict.filter(p => {
    if (!pincodeFilter.trim()) return true;
    const q = pincodeFilter.toLowerCase();
    if (p.pincode.includes(q)) return true;
    if (p.areas.some(a => a.toLowerCase().includes(q))) return true;
    return false;
  });

  const totalInDistrict = pincodesInDistrict.length;
  const fullyCoveredInDistrict = pincodesInDistrict.filter(p => p.status === 'covered').length;
  const partiallyCoveredInDistrict = pincodesInDistrict.filter(p => p.status === 'partial').length;
  
  // Calculate coverage based on areas for more accuracy
  const totalAreasInDistrict = pincodesInDistrict.reduce((acc, p) => acc + p.totalAreas, 0);
  const coveredAreasInDistrict = pincodesInDistrict.reduce((acc, p) => acc + p.coveredAreas, 0);
  const coveragePercentage = totalAreasInDistrict === 0 ? 0 : Math.round((coveredAreasInDistrict / totalAreasInDistrict) * 100);

  return (
    <div className="space-y-6 mt-6 animate-in fade-in duration-500">
      
      {/* Filters Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* State Filter */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">1. Select State</label>
          <div className="relative mb-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              className="pl-9 bg-secondary/50 h-9 text-sm" 
              placeholder="Search states..." 
              value={stateFilter} 
              onChange={e => setStateFilter(e.target.value)} 
            />
          </div>
          <div className="h-[200px] overflow-y-auto border border-border rounded-lg bg-background/50 divide-y divide-border/50">
            {loadingStates ? (
               <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              geoStates.filter(s => s.label.toLowerCase().includes(stateFilter.toLowerCase())).map(s => (
                <button
                  key={s.value}
                  onClick={() => setSelectedState({ name: s.label, slug: s.value })}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${selectedState?.slug === s.value ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary text-foreground'}`}
                >
                  {s.label}
                  {selectedState?.slug === s.value && <Check className="w-4 h-4" />}
                </button>
              ))
            )}
          </div>
        </div>

        {/* District Filter */}
        <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">2. Select District</label>
          <div className="relative mb-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input 
              className="pl-9 bg-secondary/50 h-9 text-sm" 
              placeholder={!selectedState ? "Select state first..." : "Search districts..."} 
              value={districtFilter} 
              onChange={e => setDistrictFilter(e.target.value)}
              disabled={!selectedState} 
            />
          </div>
          <div className="h-[200px] overflow-y-auto border border-border rounded-lg bg-background/50 divide-y divide-border/50">
            {!selectedState ? (
               <div className="p-8 text-center text-xs text-muted-foreground italic">Awaiting state selection...</div>
            ) : loadingDistricts ? (
               <div className="p-4 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : (
              geoDistricts.filter(d => d.label.toLowerCase().includes(districtFilter.toLowerCase())).map(d => (
                <button
                  key={d.value}
                  onClick={() => setSelectedDistrict({ name: d.label, slug: d.value })}
                  className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${selectedDistrict?.slug === d.value ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-secondary text-foreground'}`}
                >
                  {d.label}
                  {selectedDistrict?.slug === d.value && <Check className="w-4 h-4" />}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Analytics Matrix */}
      {selectedDistrict && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in">
          <div className="p-4 md:p-6 border-b border-border bg-secondary/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-foreground tracking-tight">Coverage in {selectedDistrict.name}, {selectedState?.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {fullyCoveredInDistrict + partiallyCoveredInDistrict} of {totalInDistrict} PINCODEs covered (Active)
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-full bg-secondary rounded-full h-2.5 min-w-[100px]">
                  <div className="bg-primary h-2.5 rounded-full" style={{ width: `${coveragePercentage}%` }}></div>
                </div>
                <span className="text-sm font-bold text-foreground">{coveragePercentage}%</span>
              </div>

              <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg">
                <button 
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode("map")}
                  className={`p-1.5 rounded-md transition-all ${viewMode === "map" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                  title="Map View"
                >
                  <MapIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="relative w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  className="pl-9 h-9 text-xs bg-background" 
                  placeholder="Filter PIN or Area..." 
                  value={pincodeFilter} 
                  onChange={e => setPincodeFilter(e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="p-4">
            {loadingOffices ? (
               <div className="p-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
                 <Loader2 className="w-8 h-8 animate-spin" />
                 <span>Scanning territory data...</span>
               </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPincodes.map(p => {
                  
                  // Find which agents are assigned to this pincode via zones
                  const assignedAgents = salespersons.filter(s => {
                    const agentZones = zones.filter(z => (s.assigned_zone_ids || []).includes(z.id!));
                    return agentZones.some(z => (z.pincodes || []).includes(p.pincode) || (z.pincodes || []).some(code => code.startsWith(p.pincode + ":")));
                  });

                  return (
                    <div key={p.pincode} className={`p-4 rounded-xl border flex flex-col transition-all ${
                      p.status === 'covered' ? 'bg-success/5 border-success/20 hover:border-success/40' : 
                      p.status === 'partial' ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40' : 
                      'bg-destructive/5 border-destructive/20 hover:border-destructive/40'
                    }`}>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className={`w-4 h-4 ${
                            p.status === 'covered' ? 'text-success' : 
                            p.status === 'partial' ? 'text-amber-500' : 
                            'text-destructive'
                          }`} />
                          <h4 className="font-mono font-bold text-foreground">{p.pincode}</h4>
                        </div>
                        {p.status === 'covered' ? (
                          <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px] uppercase font-semibold">Covered</Badge>
                        ) : p.status === 'partial' ? (
                          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[10px] uppercase font-semibold">Partial ({p.coveredAreas}/{p.totalAreas})</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] uppercase font-semibold">Uncovered</Badge>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3 flex-1" title={p.areas.join(", ")}>
                        {p.areas.join(", ")}
                      </p>

                      <div className="mt-auto pt-3 border-t border-border/50">
                        {p.status !== 'uncovered' ? (
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-primary" />
                            <span className="text-[11px] font-medium text-foreground">
                              {assignedAgents.length} Agent{assignedAgents.length !== 1 ? 's' : ''} Active
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                            <span className="text-[11px] font-medium text-muted-foreground italic">Requires Deployment</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredPincodes.length === 0 && (
                  <div className="col-span-full p-8 text-center text-muted-foreground">
                    No matching PINCODEs found in this district.
                  </div>
                )}
              </div>
            ) : (
              <div className="h-[600px] rounded-xl overflow-hidden border border-border relative bg-secondary/10">
                {!isLoaded ? (
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                     <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-4" />
                     <span className="text-sm font-medium text-muted-foreground">Initializing Google Maps...</span>
                   </div>
                ) : (
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    zoom={10}
                    center={mapCenter}
                    options={{ disableDefaultUI: false, zoomControl: true, streetViewControl: false, mapTypeControl: false }}
                  >
                    {enrichedPincodes.filter(p => p.lat && p.lng).map(p => {
                      const statusObj = pincodesInDistrict.find(dp => dp.pincode === p.pincode);
                      const status = statusObj?.status || 'uncovered';
                      const color = status === 'covered' ? '#10b981' : status === 'partial' ? '#f59e0b' : '#ef4444';
                      
                      return (
                        <Circle
                          key={p.pincode}
                          center={{ lat: p.lat!, lng: p.lng! }}
                          radius={p.radius || 4000}
                          options={{
                            fillColor: color,
                            fillOpacity: 0.2,
                            strokeColor: color,
                            strokeOpacity: 0.8,
                            strokeWeight: 2,
                          }}
                          onClick={() => setSelectedPincodeForInfo(p.pincode)}
                        />
                      );
                    })}

                    {selectedPincodeForInfo && enrichedPincodes.find(p => p.pincode === selectedPincodeForInfo)?.lat && (
                      <InfoWindow
                        position={{ 
                          lat: enrichedPincodes.find(p => p.pincode === selectedPincodeForInfo)!.lat!, 
                          lng: enrichedPincodes.find(p => p.pincode === selectedPincodeForInfo)!.lng! 
                        }}
                        onCloseClick={() => setSelectedPincodeForInfo(null)}
                      >
                        <div className="p-2 min-w-[200px]">
                          <h4 className="font-bold text-base mb-1">{selectedPincodeForInfo}</h4>
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-3">
                            {pincodesInDistrict.find(p => p.pincode === selectedPincodeForInfo)?.areas.join(", ")}
                          </p>
                          
                          {(() => {
                            const pStatus = pincodesInDistrict.find(dp => dp.pincode === selectedPincodeForInfo)?.status || 'uncovered';
                            const assignedAgents = salespersons.filter(s => {
                              const agentZones = zones.filter(z => (s.assigned_zone_ids || []).includes(z.id!));
                              return agentZones.some(z => (z.pincodes || []).includes(selectedPincodeForInfo) || (z.pincodes || []).some(code => code.startsWith(selectedPincodeForInfo + ":")));
                            });

                            return (
                              <div className="pt-2 border-t border-border mt-2">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`w-2 h-2 rounded-full ${pStatus === 'covered' ? 'bg-success' : pStatus === 'partial' ? 'bg-amber-500' : 'bg-destructive'}`}></span>
                                  <span className="text-xs font-semibold uppercase">{pStatus}</span>
                                </div>
                                {assignedAgents.length > 0 ? (
                                  <div className="space-y-1">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase block mb-1">Active Agents:</span>
                                    {assignedAgents.map(a => (
                                      <div key={a.id} className="text-sm font-medium flex items-center gap-2">
                                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] text-primary">{a.name.charAt(0)}</div>
                                        {a.name}
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-xs text-muted-foreground italic">No agents deployed here.</div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </InfoWindow>
                    )}
                  </GoogleMap>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
