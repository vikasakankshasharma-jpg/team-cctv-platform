
"use client";

import React, { useState, useMemo } from "react";
import { PricingResult, CCTVRequirement } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CameraCustomizerProps {
  basePlanId: string;
  basePlan: PricingResult;
  requirement: CCTVRequirement;
  onBack: () => void;
  onConfirm: (modifiedPlan: PricingResult) => void;
  isSaving: boolean;
}

const UPGRADES = [
  { id: "upg_twoway", name: "Two-Way Audio (Mic + Speaker)", desc: "Talk back through the camera via app", priceExTax: 500 },
  { id: "upg_ptz", name: "PTZ 360� Rotating", desc: "Pan, Tilt, Zoom via mobile app", priceExTax: 1500 },
  { id: "upg_colorvu", name: "Full-Time ColorVu", desc: "Color night vision 24/7", priceExTax: 800 },
  { id: "upg_bw", name: "Basic B&W Night Vision", desc: "Standard IR (Save money)", priceExTax: -300 },
];

export function CameraCustomizer({ basePlanId, basePlan, requirement, onBack, onConfirm, isSaving }: CameraCustomizerProps) {
  // State: Record of UpgradeID -> Qty
  const [upgrades, setUpgrades] = useState<Record<string, number>>({});

  const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const maxUpgradable = requirement.camera_count || 0;

  const totalUpgradesCount = Object.values(upgrades).reduce((a, b) => a + b, 0);

  const handleAdd = (id: string) => {
    if (totalUpgradesCount >= maxUpgradable) return;
    setUpgrades(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const handleSub = (id: string) => {
    setUpgrades(prev => {
      const next = { ...prev };
      if (next[id] > 0) next[id]--;
      if (next[id] === 0) delete next[id];
      return next;
    });
  };

  // Recalculate totals locally
  const modifiedPlan = useMemo(() => {
    const plan = JSON.parse(JSON.stringify(basePlan)) as PricingResult; // Deep copy
    
    let addedExTax = 0;
    
    Object.entries(upgrades).forEach(([upgId, qty]) => {
      const upgDef = UPGRADES.find(u => u.id === upgId);
      if (!upgDef || qty <= 0) return;
      
      const lineTotalEx = upgDef.priceExTax * qty;
      addedExTax += lineTotalEx;
      
      plan.items.push({
        product_id: upgId,
        display_name: `${qty}x Upgrade: ${upgDef.name}`,
        qty: qty,
        unit_price: upgDef.priceExTax,
        line_total: lineTotalEx
      });
    });

    if (addedExTax !== 0) {
      plan.base_hardware_cost += addedExTax;
      plan.finalExTax += addedExTax;
      
      const addedGst = addedExTax * 0.18;
      plan.gstAmount += addedGst;
      
      plan.total_payable = Math.round(plan.total_payable + addedExTax + addedGst);
    }
    
    return plan;
  }, [basePlan, upgrades]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center space-x-4 mb-4">
        <h2 className="text-2xl font-bold">Customize Your Cameras</h2>
        <Badge variant="outline" className="bg-blue-50">{basePlanId.replace("_", " ")}</Badge>
      </div>
      <p className="text-gray-600">You selected {requirement.camera_count} cameras. You can optionally upgrade them before generating your final quote.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {UPGRADES.map(upg => {
             const qty = upgrades[upg.id] || 0;
             return (
               <Card key={upg.id} className={`transition-all ${qty > 0 ? 'border-blue-500 bg-blue-50/20' : ''}`}>
                 <CardContent className="p-4 flex items-center justify-between">
                   <div>
                     <h4 className="font-bold text-gray-900">{upg.name}</h4>
                     <p className="text-xs text-gray-500">{upg.desc}</p>
                     <div className={`text-sm font-semibold mt-1 ${upg.priceExTax < 0 ? 'text-green-600' : 'text-gray-700'}`}>
                        {upg.priceExTax < 0 ? 'Save ' : '+ '}{formatPrice(Math.abs(upg.priceExTax))} per camera
                     </div>
                   </div>
                   <div className="flex items-center space-x-3 bg-gray-100 p-1 rounded-lg">
                     <button onClick={() => handleSub(upg.id)} disabled={qty === 0} className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center font-bold text-gray-600 disabled:opacity-50">-</button>
                     <span className="w-4 text-center font-bold">{qty}</span>
                     <button onClick={() => handleAdd(upg.id)} disabled={totalUpgradesCount >= maxUpgradable} className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center font-bold text-gray-600 disabled:opacity-50">+</button>
                   </div>
                 </CardContent>
               </Card>
             );
          })}
          
          {totalUpgradesCount > 0 && (
            <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded-lg flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              You are upgrading {totalUpgradesCount} out of {maxUpgradable} cameras.
            </div>
          )}
        </div>
        
        <div className="md:col-span-1">
          <Card className="sticky top-6 border-primary shadow-lg">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-lg">Final Quotation</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between items-center text-gray-600 text-sm">
                <span>Base Total</span>
                <span>{formatPrice(basePlan.total_payable)}</span>
              </div>
              
              {Object.entries(upgrades).map(([id, qty]) => {
                if (qty === 0) return null;
                const upg = UPGRADES.find(u => u.id === id);
                if (!upg) return null;
                const amount = upg.priceExTax * qty * 1.18; // Inc GST
                return (
                  <div key={id} className="flex justify-between items-center text-sm text-blue-700 font-medium">
                    <span>{qty}x {upg.name}</span>
                    <span>{amount > 0 ? '+' : ''}{formatPrice(amount)}</span>
                  </div>
                );
              })}
              
              <div className="border-t pt-4 flex justify-between items-center font-bold text-xl">
                <span>Total</span>
                <span className="text-primary">{formatPrice(modifiedPlan.total_payable)}</span>
              </div>
              
              <Button 
                className="w-full h-12 text-lg mt-4" 
                onClick={() => onConfirm(modifiedPlan)}
                disabled={isSaving}
              >
                {isSaving ? "Generating PDF..." : "Confirm & Generate"}
              </Button>
              <Button variant="ghost" className="w-full text-gray-500" onClick={onBack} disabled={isSaving}>
                Change Base Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
