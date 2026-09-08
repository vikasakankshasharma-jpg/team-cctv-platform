"use client";

import React, { useState, useMemo } from "react";
import { PricingResult, CCTVRequirement } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings2, ArrowLeftRight } from "lucide-react";

interface QuoteComparisonProps {
  plans: Record<string, PricingResult>;
  requirement: CCTVRequirement;
  onSelectPlan: (planId: string) => void;
  onEditConfiguration: () => void;
}

export function QuoteComparison({ plans, requirement, onSelectPlan, onEditConfiguration }: QuoteComparisonProps) {
  const lockedTech = requirement.installation_type === "addon" && requirement.existing_technology ? requirement.existing_technology as "HD" | "IP" : null;
  const [activeTech, setActiveTech] = useState<"HD" | "IP">(lockedTech || "HD");
  const [activeBrand, setActiveBrand] = useState<string>("All");
  
  // State for side-by-side comparison mode
  const [showComparison, setShowComparison] = useState(false);
  const [selectedToCompare, setSelectedToCompare] = useState<string[]>([]);

  const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const brands = useMemo(() => {
     const bSet = new Set<string>();
     Object.keys(plans).forEach(key => {
        if (key.includes("_" + activeTech + "_")) {
           const parts = key.split("_");
           if (parts.length >= 3) {
              bSet.add(parts[0]);
           }
        }
     });
     const list = Array.from(bSet);
     return list.includes("Budget") ? ["Budget", ...list.filter(b => b !== "Budget")] : list;
  }, [plans, activeTech]);

  React.useEffect(() => {
     if (brands.length > 0 && activeBrand !== "All" && !brands.includes(activeBrand)) {
      setActiveBrand("All");
   }
  }, [brands, activeBrand]);

  const uniqueMps = useMemo(() => {
    const mps = new Set<string>();
    Object.keys(plans).forEach(key => {
      if (key.includes("_" + activeTech + "_")) {
        if (activeBrand === "All" || key.startsWith(activeBrand + "_")) {
           mps.add(key.split("_")[2]);
        }
      }
    });
    return Array.from(mps).filter(Boolean).sort((a,b) => parseInt(a) - parseInt(b));
  }, [plans, activeTech, activeBrand]);

  const [activeResolution, setActiveResolution] = useState<string>("");

  React.useEffect(() => {
    if (activeBrand === "All" && activeResolution === "All") {
       if (uniqueMps.length > 0) setActiveResolution(uniqueMps[Math.floor(uniqueMps.length / 2)] || uniqueMps[0]);
    } else if (activeResolution !== "All" && activeResolution !== "" && !uniqueMps.includes(activeResolution)) {
       if (uniqueMps.length > 0) setActiveResolution(uniqueMps[Math.floor(uniqueMps.length / 2)] || uniqueMps[0]);
    } else if (activeResolution === "" && uniqueMps.length > 0) {
       setActiveResolution(uniqueMps[Math.floor(uniqueMps.length / 2)] || uniqueMps[0]);
    }
  }, [activeBrand, activeResolution, uniqueMps]);

  const plansToRender = useMemo(() => {
    if (activeBrand === "All" && activeResolution !== "All") {
      return brands.map(b => {
        const key = `${b}_${activeTech}_${activeResolution}`;
        return { key, plan: plans[key] };
      }).filter(p => p.plan);
    }
    if (activeBrand !== "All" && activeResolution === "All") {
      return uniqueMps.map(mp => {
        const key = `${activeBrand}_${activeTech}_${mp}`;
        return { key, plan: plans[key] };
      }).filter(p => p.plan);
    }
    if (activeBrand !== "All" && activeResolution !== "All") {
      const key = `${activeBrand}_${activeTech}_${activeResolution}`;
      return plans[key] ? [{ key, plan: plans[key] }] : [];
    }
    return [];
  }, [activeBrand, activeTech, activeResolution, brands, uniqueMps, plans]);

  const totalCams = requirement.installation_type === "addon" ? (requirement.indoor_camera_count || 0) + (requirement.outdoor_camera_count || 0) : requirement.camera_count || 0;

  const renderCard = (planKey: string, plan: PricingResult, isMain: boolean = false) => {
    const keyParts = planKey.split("_");
    const brandName = keyParts[0];
    const tech = keyParts[1];
    const mp = keyParts.length > 2 ? keyParts[2] : "";
    
    const storageItem = plan.items.find((i: any) => i.category === "storage");
    const storageDisplay = storageItem ? storageItem.display_name.match(/\d+TB|\d+GB/)?.[0] || "Included" : "None";
    
    const recorderItem = plan.items.find((i: any) => i.category === "recorder");
    const recorderDisplay = recorderItem ? (recorderItem.display_name.includes("8 Ch") ? "8-Channel" : recorderItem.display_name.includes("16 Ch") ? "16-Channel" : recorderItem.display_name.includes("32 Ch") ? "32-Channel" : "4-Channel") : "Existing";

    return (
      <Card key={planKey} className={`flex flex-col transition-all duration-200 ${isMain ? 'border-primary shadow-xl ring-2 ring-primary/20' : 'hover:shadow-md'}`}>
        <CardHeader className={isMain ? "bg-primary/5 pb-6" : ""}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {brandName}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-zinc-100 text-zinc-700 border border-zinc-200">
              {mp}
            </span>
          </div>
          <CardTitle className={`text-center text-gray-700 uppercase tracking-wider font-semibold ${isMain ? 'text-xl' : 'text-sm'}`}>
            {totalCams}x {tech} Cameras
          </CardTitle>
          <div className={`text-center font-black mt-3 ${isMain ? 'text-4xl text-primary' : 'text-3xl text-gray-900'}`}>{formatPrice(plan.total_payable)}</div>
        </CardHeader>
        <CardContent className="flex-grow pt-4">
          <ul className={`space-y-3 ${isMain ? 'text-base' : 'text-sm'}`}>
            <li className="flex justify-between border-b pb-2">
              <span className="text-gray-500">Brand</span> 
              <span className="font-semibold text-gray-900">{brandName}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Clarity</span> 
              <span className="font-medium text-primary font-bold">{mp}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Storage</span> 
              <span className="font-medium">{storageDisplay} ({requirement.recording_days || 0} Days)</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Recorder</span> 
              <span className="font-medium">{recorderDisplay}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-500">Installation</span> 
              <span className="font-medium">Included</span>
            </li>
          </ul>
        </CardContent>
        <CardFooter className="pt-4 flex flex-col gap-2">
          <Button className="w-full font-bold" size={isMain ? "lg" : "default"} onClick={() => onSelectPlan(planKey)}>
            {isMain ? "Select & Continue" : "Select"}
          </Button>
          {!isMain && (
            <Button variant="outline" className="w-full" onClick={() => {
              setSelectedToCompare(prev => prev.includes(planKey) ? prev.filter(p => p !== planKey) : [...prev, planKey].slice(0, 3));
            }}>
              {selectedToCompare.includes(planKey) ? "Remove from Compare" : "Compare"}
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  if (showComparison) {
    const comparePlans = Object.entries(plans).filter(([key]) => selectedToCompare.includes(key));
    return (
      <div className="flex flex-col space-y-6 w-full animate-in fade-in">
        <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-lg border border-zinc-200">
          <h3 className="text-lg font-bold">Side-by-Side Comparison</h3>
          <Button variant="outline" onClick={() => setShowComparison(false)}>
            Back to Options
          </Button>
        </div>
        {comparePlans.length === 0 ? (
          <div className="text-center py-10 text-gray-500">No quotes selected for comparison. Select options from the main card to compare.</div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-${Math.min(comparePlans.length, 3)} gap-6`}>
            {comparePlans.map(([key, plan]) => renderCard(key, plan, false))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6 w-full animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-blue-50 p-4 rounded-lg border border-blue-100 gap-4">
        <div>
          <h3 className="text-lg font-semibold text-blue-900">Your Quotation Variants</h3>
          <p className="text-sm text-blue-700">
            Select Brand and Quality to instantly see your tailored quote.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setShowComparison(true)}>
            <ArrowLeftRight className="w-4 h-4 mr-2" />
            Compare Side-by-Side ({selectedToCompare.length})
          </Button>
          <Button variant="outline" size="sm" onClick={onEditConfiguration}>
            <Settings2 className="w-4 h-4 mr-2" />
            Edit Requirement
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Left: Options panel */}
        <div className="col-span-1 md:col-span-5 space-y-6">
          <div className="bg-white p-5 rounded-2xl border shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4">1. Technology</h4>
            <div className="flex flex-col space-y-2">
              <button onClick={() => !lockedTech && setActiveTech("HD")} disabled={!!lockedTech && lockedTech !== "HD"} className={`px-4 py-3 rounded-lg text-sm font-bold text-left transition-all border ${activeTech === "HD" ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                Standard HD (Analog)
              </button>
              <button onClick={() => !lockedTech && setActiveTech("IP")} disabled={!!lockedTech && lockedTech !== "IP"} className={`px-4 py-3 rounded-lg text-sm font-bold text-left transition-all border ${activeTech === "IP" ? 'bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                Premium IP (Network)
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4">2. Brand</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant={activeBrand === "All" ? "default" : "outline"} className={`cursor-pointer px-4 py-2 text-sm transition-all ${activeBrand === "All" ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600 border-gray-300'}`} onClick={() => setActiveBrand("All")}>All Brands</Badge>
              {brands.map(b => (
                <Badge key={b} variant={activeBrand === b ? "default" : "outline"} className={`cursor-pointer px-4 py-2 text-sm transition-all ${activeBrand === b ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600 border-gray-300'}`} onClick={() => setActiveBrand(b)}>
                  {b}
                </Badge>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border shadow-sm">
            <h4 className="font-bold text-gray-900 mb-4">3. Camera Quality</h4>
            <div className="flex flex-wrap gap-2">
              {activeBrand !== "All" && (
                  <Badge variant={activeResolution === "All" ? "default" : "outline"} className={`cursor-pointer px-4 py-2 text-sm transition-all ${activeResolution === "All" ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600 border-gray-300'}`} onClick={() => setActiveResolution("All")}>
                    All Qualities
                  </Badge>
                )}
                {uniqueMps.map((mp) => (
                  <Badge key={mp} variant={activeResolution === mp ? "default" : "outline"} className={`cursor-pointer px-4 py-2 text-sm transition-all ${activeResolution === mp ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-600 border-gray-300'}`} onClick={() => setActiveResolution(mp)}>
                    {mp}
                  </Badge>
                ))}
            </div>
          </div>
        </div>

        {/* Right: Main Card */}
        <div className="col-span-1 md:col-span-7 flex flex-col justify-start items-center pt-4">
          <div className="w-full">
            {plansToRender.length > 0 ? (
              <div className="relative w-full">
                {plansToRender.length === 1 ? (
                  <div className="max-w-md mx-auto">
                    {renderCard(plansToRender[0].key, plansToRender[0].plan, true)}
                    <div className="mt-4 flex justify-center">
                      <Button variant="outline" className="text-sm font-medium" onClick={() => {
                        setSelectedToCompare(prev => prev.includes(plansToRender[0].key) ? prev.filter(p => p !== plansToRender[0].key) : [...prev, plansToRender[0].key].slice(0, 3));
                      }}>
                        {selectedToCompare.includes(plansToRender[0].key) ? "Added to Compare" : "+ Add to Side-by-Side Compare"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {plansToRender.map(p => (
                      <div key={p.key}>
                        {renderCard(p.key, p.plan, true)}
                        <div className="mt-4 flex justify-center">
                          <Button variant="outline" className="text-sm font-medium" onClick={() => {
                            setSelectedToCompare(prev => prev.includes(p.key) ? prev.filter(item => item !== p.key) : [...prev, p.key].slice(0, 3));
                          }}>
                            {selectedToCompare.includes(p.key) ? "Added to Compare" : "+ Add to Compare"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-10 text-center text-gray-500">
                No matching configuration found for selected options.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
