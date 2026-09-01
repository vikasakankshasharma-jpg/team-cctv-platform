
"use client";

import React, { useState, useMemo } from "react";
import { PricingResult, CCTVRequirement } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface QuoteComparisonProps {
  plans: Record<string, PricingResult>;
  requirement: CCTVRequirement;
  onSelectPlan: (planId: string) => void;
  onEditConfiguration: () => void;
}

export function QuoteComparison({ plans, requirement, onSelectPlan, onEditConfiguration }: QuoteComparisonProps) {
  const lockedTech = requirement.installation_type === "addon" && requirement.existing_technology ? requirement.existing_technology as "HD" | "IP" : null;
  const [activeTech, setActiveTech] = useState<"HD" | "IP">(lockedTech || "HD");
  const [activeBrand, setActiveBrand] = useState<string>("Budget");

  const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  // Extract available brands
  const brands = useMemo(() => {
     const bSet = new Set<string>();
     Object.keys(plans).forEach(key => {
        const parts = key.split("_");
        if (parts.length >= 3) {
           bSet.add(parts[0]);
        }
     });
     return ["Budget", ...Array.from(bSet).filter(b => b !== "Budget")];
  }, [plans]);

  // Filter plans based on Toggle & Brand
  const filteredPlans = useMemo(() => {
     let result = Object.entries(plans).filter(([key, plan]) => key.includes("_" + activeTech + "_"));
     
     result = result.filter(([key, plan]) => key.startsWith(activeBrand + "_"));
     
     // Sort by MP resolution (e.g. Budget_HD_2MP -> index 2)
     return result.sort((a, b) => {
        const mpA = parseInt(a[0].split("_")[2]?.replace("MP", "") || "0");
        const mpB = parseInt(b[0].split("_")[2]?.replace("MP", "") || "0");
        return mpA - mpB;
     });
  }, [plans, activeTech, activeBrand]);

  return (
    <div className="flex flex-col space-y-6 w-full">
      <div className="flex justify-between items-center bg-blue-50 p-4 rounded-lg border border-blue-100">
        <div>
          <h3 className="text-lg font-semibold text-blue-900">Your CCTV Requirement</h3>
          <p className="text-sm text-blue-700">
            {requirement.camera_count} Cameras � {requirement.recording_days || 15} Days Recording 
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={onEditConfiguration}>
          Edit Requirement
        </Button>
      </div>
      
      {/* Smart Toggle */}
      {lockedTech ? (
        <div className="flex justify-center mb-4">
          <div className="bg-blue-50 border border-blue-200 px-5 py-2.5 rounded-xl text-sm font-semibold text-blue-700">
            {lockedTech === "HD" ? "🔒 Standard HD (Analog) — Matching Your Existing System" : "🔒 Premium IP (Network) — Matching Your Existing System"}
          </div>
        </div>
      ) : (
      <div className="flex justify-center mb-4">
        <div className="bg-gray-100 p-1 rounded-xl flex space-x-1 shadow-inner">
           <button 
             onClick={() => setActiveTech("HD")}
             className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTech === "HD" ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-800'}`}
           >
             Standard HD (Analog)
           </button>
           <button 
             onClick={() => setActiveTech("IP")}
             className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTech === "IP" ? 'bg-white text-blue-600 shadow' : 'text-gray-500 hover:text-gray-800'}`}
           >
             Premium IP (Network)
           </button>
        </div>
      </div>
      )}

      {/* Brand Filter */}
      {brands.length > 2 && (
        <div className="flex justify-center space-x-2 mb-2">
          <span className="text-sm text-gray-500 flex items-center mr-2">Brand:</span>
          {brands.map(b => (
            <Badge 
              key={b} 
              variant={activeBrand === b ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setActiveBrand(b)}
            >
              {b}
            </Badge>
          ))}
        </div>
      )}

      {/* Dynamic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {filteredPlans.length === 0 ? (
           <div className="col-span-3 text-center text-gray-500 py-8">No configurations available for the selected filters.</div>
        ) : (
           filteredPlans.map(([key, plan], idx) => {
             const keyParts = key.split("_");
             const mp = keyParts.length > 2 ? keyParts[2] : keyParts[1];
             const totalCams = requirement.installation_type === "addon" ? (requirement.indoor_camera_count || 0) + (requirement.outdoor_camera_count || 0) : requirement.camera_count || 0;
             
             // Extract storage string
             const storageItem = plan.items.find((i: any) => i.category === "storage");
             const storageDisplay = storageItem ? storageItem.display_name.match(/\d+TB|\d+GB/)?.[0] || "Included" : "None";
             
             // Extract recorder string
             const recorderItem = plan.items.find((i: any) => i.category === "recorder");
             const recorderDisplay = recorderItem ? (recorderItem.display_name.includes("8 Ch") ? "8-Channel" : recorderItem.display_name.includes("16 Ch") ? "16-Channel" : recorderItem.display_name.includes("32 Ch") ? "32-Channel" : "4-Channel") : "Existing";
             const isRecommended = idx === Math.floor(filteredPlans.length / 2) && filteredPlans.length >= 2;
             
             return (
                <Card key={key} className={`flex flex-col ${isRecommended ? 'border-primary shadow-lg relative transform md:-translate-y-2' : ''}`}>
                  {isRecommended && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1 uppercase tracking-wide">? Recommended</Badge>
                    </div>
                  )}
                  <CardHeader className={isRecommended ? "pt-8" : ""}>
                    <CardTitle className="text-center text-gray-500 uppercase text-sm tracking-wider">{mp} Resolution</CardTitle>
                    <div className={`text-center text-3xl font-bold mt-2 ${isRecommended ? 'text-primary' : ''}`}>{formatPrice(plan.total_payable)}</div>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <ul className="space-y-3 text-sm">
                      <li className="flex justify-between"><span>Cameras</span> <span className="font-medium">{totalCams}x {activeTech}</span></li>
                      <li className="flex justify-between"><span>Clarity</span> <span className={`font-medium ${isRecommended ? 'text-primary font-bold' : ''}`}>{mp}</span></li>
                      <li className="flex justify-between"><span>Storage</span> <span className="font-medium">{storageDisplay} ({requirement.recording_days || 0} Days)</span></li>
                        <li className="flex justify-between"><span>Recorder</span> <span className="font-medium">{recorderDisplay}</span></li>
                      <li className="flex justify-between"><span>Installation</span> <span className="font-medium">Included</span></li>
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button variant={isRecommended ? "default" : "outline"} className="w-full" onClick={() => onSelectPlan(key)}>
                       {isRecommended ? "Select Plan" : "View Details"}
                    </Button>
                  </CardFooter>
                </Card>
             );
           })
        )}
      </div>
      
      <div className="mt-8 bg-gray-50 p-6 rounded-xl border">
        <h4 className="font-bold text-gray-800 mb-4">Want to customize your cameras?</h4>
        <p className="text-sm text-gray-600 mb-4">You can upgrade specific cameras to PTZ (360� Rotating), add Two-Way Audio, or choose Color Night Vision on the next screen after selecting a base plan.</p>
      </div>
    </div>
  );
}
