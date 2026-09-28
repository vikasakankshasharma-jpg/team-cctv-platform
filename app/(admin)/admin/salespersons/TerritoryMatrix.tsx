"use client";

import { useState, useEffect, useMemo } from "react";
import { CoverageZone, Salesperson } from "@/types";
import { Search, Loader2, MapPin, Check, AlertTriangle, ShieldCheck, Map as MapIcon, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import MapplsBoundaryMap from "@/components/MapplsBoundaryMap";

interface Props {
  zones: CoverageZone[];
  salespersons: Salesperson[];
  isLoaded: boolean;
}

export function TerritoryMatrix({ zones, salespersons, isLoaded }: Props) {
  const [geoStates, setGeoStates] = useState<{ label: string; value: string }[]>([]);
  const [selectedState, setSelectedState] = useState<{ name: string; slug: string } | null>(null);
  
  const [geoDistricts, setGeoDistricts] = useState<{ label: string; value: string }[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<{ name: string; slug: string } | null>(null);
  
  const [districtOffices, setDistrictOffices] = useState<any[]>([]);


  
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [loadingOffices, setLoadingOffices] = useState(false);

  const [stateFilter, setStateFilter] = useState("");
  const [districtFilter, setDistrictFilter] = useState("");
  const [pincodeFilter, setPincodeFilter] = useState("");

  const [activeMapQuery, setActiveMapQuery] = useState<{ type: 'district' | 'pincode'; query: string; label: string } | null>(null);
  const [showMap, setShowMap] = useState<boolean>(true);

  // Sync active map query with selected district
  useEffect(() => {
    if (selectedDistrict) {
      setActiveMapQuery({ type: 'district', query: selectedDistrict.name, label: selectedDistrict.name });
    } else {
      setActiveMapQuery(null);
    }
  }, [selectedDistrict]);

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

          {/* MapmyIndia Territory Boundary Map */}
          {showMap && activeMapQuery && (
            <div className="p-4 border-b border-border bg-secondary/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                    <MapIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">MapmyIndia Territory Boundary:</span>
                      <Badge variant="secondary" className="font-mono text-xs text-primary bg-primary/10 border-primary/20">
                        {activeMapQuery.type === 'district' ? `District: ${activeMapQuery.label}` : `Pincode: ${activeMapQuery.label}`}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Click any PIN card below to isolate that specific pincode polygon boundary.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {activeMapQuery.type === 'pincode' && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs flex items-center gap-1.5"
                      onClick={() => setActiveMapQuery({ type: 'district', query: selectedDistrict.name, label: selectedDistrict.name })}
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset to District
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowMap(false)}
                  >
                    Hide Map
                  </Button>
                </div>
              </div>

              <MapplsBoundaryMap 
                apiKey={process.env.NEXT_PUBLIC_MAPPLS_API_KEY || ''}
                boundaryType={activeMapQuery.type}
                boundaryQuery={activeMapQuery.query}
                height="360px"
              />
            </div>
          )}

          {!showMap && (
            <div className="px-4 py-2 bg-secondary/10 border-b border-border flex items-center justify-between">
              <span className="text-xs text-muted-foreground">MapmyIndia Boundary Map is collapsed.</span>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 text-xs flex items-center gap-1.5"
                onClick={() => setShowMap(true)}
              >
                <MapIcon className="w-3.5 h-3.5" />
                Show Boundary Map
              </Button>
            </div>
          )}

          <div className="p-4">
            {loadingOffices ? (
               <div className="p-12 flex flex-col items-center justify-center text-muted-foreground gap-3">
                 <Loader2 className="w-8 h-8 animate-spin" />
                 <span>Scanning territory data...</span>
               </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredPincodes.map(p => {
                  
                  // Find which agents are assigned to this pincode via zones
                  const assignedAgents = salespersons.filter(s => {
                    const agentZones = zones.filter(z => (s.assigned_zone_ids || []).includes(z.id!));
                    return agentZones.some(z => (z.pincodes || []).includes(p.pincode) || (z.pincodes || []).some(code => code.startsWith(p.pincode + ":")));
                  });

                  const isSelectedForMap = activeMapQuery?.type === 'pincode' && activeMapQuery.query === p.pincode;

                  return (
                    <div 
                      key={p.pincode} 
                      onClick={() => {
                        setShowMap(true);
                        setActiveMapQuery({ type: 'pincode', query: p.pincode, label: p.pincode });
                      }}
                      className={`p-4 rounded-xl border flex flex-col transition-all cursor-pointer hover:shadow-md ${
                        isSelectedForMap ? 'ring-2 ring-primary shadow-sm ' : ''
                      }${
                        p.status === 'covered' ? 'bg-success/5 border-success/20 hover:border-success/40' : 
                        p.status === 'partial' ? 'bg-amber-500/5 border-amber-500/20 hover:border-amber-500/40' : 
                        'bg-destructive/5 border-destructive/20 hover:border-destructive/40'
                      }`}
                    >
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
            )}
          </div>
        </div>
      )}
    </div>
  );
}
