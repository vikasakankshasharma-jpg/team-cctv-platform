
"use client";

import React, { useState, useMemo } from "react";
import { PricingResult, CCTVRequirement, Addon, Product } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CameraCustomizerProps {
  basePlanId: string;
  basePlan: PricingResult;
  requirement: CCTVRequirement;
  availableAddons: Addon[];
  storageDrives?: Product[];
  onBack: () => void;
  onConfirm: (modifiedPlan: PricingResult) => void;
  isSaving: boolean;
}

export function CameraCustomizer({ basePlanId, basePlan, requirement, availableAddons, storageDrives, onBack, onConfirm, isSaving }: CameraCustomizerProps) {
  
  const [wantsPremiumStorage, setWantsPremiumStorage] = useState(false);

  // State: Record of AddonID -> Qty
  const [upgrades, setUpgrades] = useState<Record<string, number>>({});

  const storageUpgrade = useMemo(() => {
     if (!storageDrives) return null;
     const currentStorageItem = basePlan.items.find(i => i.product_id.includes("storage") || i.display_name.toLowerCase().includes("hdd") || i.display_name.toLowerCase().includes("hard disk"));
     if (!currentStorageItem) return null;
     
     const tbMatch = currentStorageItem.display_name.match(/(\d+)\s*TB/i);
     const gbMatch = currentStorageItem.display_name.match(/(\d+)\s*GB/i);
     let tb = 0;
     if (tbMatch) tb = parseInt(tbMatch[1]);
     else if (gbMatch) tb = parseInt(gbMatch[1]) / 1024;
     
     if (tb === 0) return null;
     
     const currentName = currentStorageItem.display_name.toLowerCase();
     if (currentName.includes("seagate") || currentName.includes("wd") || currentName.includes("western") || currentName.includes("purple") || currentName.includes("skyhawk") || currentName.includes("toshiba")) {
         return null; // Already premium
     }
     
     const premiumDrives = storageDrives.filter(p => {
         const pTb = p.storage_capacity_tb || (typeof p.capacity === 'string' ? parseInt(p.capacity.replace('TB', '')) || 0 : 0);
         if (pTb !== tb) return false;
         
         const l = (p.brand || p.display_name).toLowerCase();
         return l.includes("seagate") || l.includes("wd") || l.includes("western") || l.includes("purple") || l.includes("skyhawk") || l.includes("toshiba");
     }).sort((a, b) => (a.price || 0) - (b.price || 0));
     
     if (premiumDrives.length === 0) return null;
     
     const premiumDrive = premiumDrives[0];
     
     // Calculate price diff (Assuming item unit_price is exTax and product price is exTax)
     const diffExTax = (premiumDrive.price || 0) - currentStorageItem.unit_price;
     if (diffExTax <= 0) return null;
     
     return {
         id: premiumDrive.id!,
         name: `Premium Storage Upgrade: ${premiumDrive.display_name}`,
         desc: `Upgrade from standard HDD to ${premiumDrive.brand || 'Premium'} Surveillance-grade Drive (${tb}TB)`,
         priceExTax: diffExTax,
         priceIncGst: diffExTax * 1.18,
         currentTb: tb
     };
  }, [basePlan, storageDrives]);


  const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const maxUpgradable = requirement.camera_count || 0;
  const totalUpgradesCount = Object.values(upgrades).reduce((a, b) => a + b, 0);

  // Dynamically pull upgrades from availableAddons that are 'upgrade_camera' and in stock
  const UPGRADES = useMemo(() => {
    return availableAddons
      .filter(a => a.category === "upgrade_camera" && a.stock_quantity !== 0 && a.stock_quantity !== -1)
        .filter(a => {
          const tech = basePlanId.split("_")[1];
          return !a.technology || a.technology === "BOTH" || a.technology === tech || a.technology.includes(tech);
        })
      .map(a => ({
        id: a.id!,
        name: a.display_name,
        desc: a.brand ? `${a.brand} - Upgrade feature` : "Upgrade feature",
        priceExTax: (a.unit_price || a.price || 0) / 1.18,
          priceIncGst: a.unit_price || a.price || 0,
        stock: typeof a.stock_quantity === "number" ? a.stock_quantity : Infinity
      }));
  }, [availableAddons]);

  const handleAdd = (id: string, stock: number) => {
    if (totalUpgradesCount >= maxUpgradable) return;
    const currentQty = upgrades[id] || 0;
    if (currentQty >= stock) {
      alert(`Only ${stock} available in stock.`);
      return;
    }
    setUpgrades(prev => ({ ...prev, [id]: currentQty + 1 }));
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
    let plan = JSON.parse(JSON.stringify(basePlan)) as PricingResult;
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
        line_total: lineTotalEx,
      });
    });

    if (wantsPremiumStorage && storageUpgrade) {
      addedExTax += storageUpgrade.priceExTax;
      
      // Update the existing item display name to reflect upgrade
      const idx = plan.items.findIndex(i => i.display_name.toLowerCase().includes("hdd") || i.display_name.toLowerCase().includes("hard disk"));
      if (idx !== -1) {
          plan.items[idx].display_name = `[UPGRADED] ${storageUpgrade.name}`;
          plan.items[idx].unit_price += storageUpgrade.priceExTax;
          plan.items[idx].line_total += storageUpgrade.priceExTax;
      } else {
          plan.items.push({
            product_id: storageUpgrade.id,
            display_name: storageUpgrade.name,
            qty: 1,
            unit_price: storageUpgrade.priceExTax,
            line_total: storageUpgrade.priceExTax,
          });
      }
    }

    if (addedExTax !== 0) {
      plan.base_hardware_cost += addedExTax;
      plan.finalExTax += addedExTax;
      
      const addedGst = addedExTax * 0.18;
      plan.gstAmount += addedGst;
      plan.total_payable = Math.round(plan.finalExTax + plan.gstAmount);
    }

    return plan;
  }, [basePlan, upgrades, wantsPremiumStorage, storageUpgrade, UPGRADES]);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center space-x-4 mb-4">
        <h2 className="text-2xl font-bold">Customize Your Cameras</h2>
        <Badge variant="outline" className="bg-blue-50">{basePlanId.replace("_", " ")}</Badge>
      </div>
      <p className="text-gray-600">You selected {requirement.camera_count} cameras. You can optionally upgrade them before generating your final quote.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {UPGRADES.length === 0 && (
             <div className="p-8 text-center border-2 border-dashed rounded-xl text-gray-500">
               No camera upgrades are currently in stock.
             </div>
          )}

          {UPGRADES.map(upg => {
             const qty = upgrades[upg.id] || 0;
             return (
               <Card key={upg.id} className={`transition-all ${qty > 0 ? 'border-blue-500 bg-blue-50/20' : ''}`}>
                 <CardContent className="p-4 flex items-center justify-between">
                   <div>
                     <h4 className="font-bold text-gray-900">{upg.name}</h4>
                     <p className="text-xs text-gray-500">{upg.desc}</p>
                     <div className={`text-sm font-semibold mt-1 ${upg.priceIncGst < 0 ? 'text-green-600' : 'text-gray-700'}`}>
                        {upg.priceIncGst < 0 ? 'Save ' : '+ '}{formatPrice(Math.abs(upg.priceIncGst))} per camera
                        
                     </div>
                   </div>
                   <div className="flex items-center space-x-3 bg-gray-100 p-1 rounded-lg">
                     <button onClick={() => handleSub(upg.id)} disabled={qty === 0} className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center font-bold text-gray-600 disabled:opacity-50">-</button>
                     <span className="w-4 text-center font-bold">{qty}</span>
                     <button onClick={() => handleAdd(upg.id, upg.stock)} disabled={totalUpgradesCount >= maxUpgradable || qty >= upg.stock} className="w-8 h-8 rounded bg-white shadow-sm flex items-center justify-center font-bold text-gray-600 disabled:opacity-50">+</button>
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
                const amount = upg.priceIncGst * qty;
                return (
                  <div key={id} className="flex justify-between items-center text-sm text-blue-700 font-medium">
                    <span>{qty}x {upg.name}</span>
                    <span>{amount > 0 ? '+' : ''}{formatPrice(amount)}</span>
                  </div>
                );
              })}
              
              {wantsPremiumStorage && storageUpgrade && (
                  <div className="flex justify-between items-center text-sm text-blue-700 font-medium">
                    <span>1x Storage Upgrade (Seagate/WD)</span>
                    <span>+{formatPrice(storageUpgrade.priceIncGst)}</span>
                  </div>
              )}
              
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
