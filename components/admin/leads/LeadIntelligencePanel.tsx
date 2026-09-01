"use client";

import { useState } from "react";
import { QuoteSnapshot } from "@/types";

export default function LeadIntelligencePanel({ 
  lead, 
  onUpdate 
}: { 
  lead: QuoteSnapshot, 
  onUpdate: () => void 
}) {
  const [saving, setSaving] = useState(false);
  
  // Local state
  const [intentScore, setIntentScore] = useState(lead.intentScore || "Cold");
  const [installationType, setInstallationType] = useState(lead.installationType || "New");
  const [expectedClosingDate, setExpectedClosingDate] = useState(lead.expectedClosingDate || "");
  const [probabilityPercent, setProbabilityPercent] = useState(lead.probabilityPercent || 0);
  const [expectedValue, setExpectedValue] = useState(
    lead.expectedValue || lead.pricingSnapshot?.finalPrice || lead.pricingSnapshot?.total_payable || 0
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch(`/api/crm/quotes/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          intentScore,
          installationType,
          expectedClosingDate,
          probabilityPercent,
          expectedValue
        })
      });
      onUpdate();
    } catch (err) {
      console.error(err);
    }
    setSaving(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-5">
      <h3 className="font-semibold text-lg text-gray-800 mb-4 border-b pb-2">Lead Intelligence</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Intent Score</label>
          <select 
            value={intentScore} 
            onChange={(e) => setIntentScore(e.target.value as any)}
            className="w-full p-2 border rounded-md text-sm"
          >
            <option value="Cold">Cold</option>
            <option value="Warm">Warm</option>
            <option value="Hot">Hot</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Probability (%)</label>
          <input 
            type="number" 
            min="0" max="100"
            value={probabilityPercent} 
            onChange={(e) => setProbabilityPercent(Number(e.target.value))}
            className="w-full p-2 border rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Installation Type</label>
          <select 
            value={installationType} 
            onChange={(e) => setInstallationType(e.target.value as any)}
            className="w-full p-2 border rounded-md text-sm"
          >
            <option value="New">New Installation</option>
            <option value="Upgrade">Upgrade/Replacement</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Expected Closing</label>
          <input 
            type="date" 
            value={expectedClosingDate} 
            onChange={(e) => setExpectedClosingDate(e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">Expected Pipeline Value (₹)</label>
          <input 
            type="number" 
            value={expectedValue} 
            onChange={(e) => setExpectedValue(Number(e.target.value))}
            className="w-full p-2 border rounded-md font-bold text-gray-900"
          />
        </div>
      </div>
      
      <button 
        onClick={handleSave} 
        disabled={saving}
        className="w-full py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Update Intelligence"}
      </button>
    </div>
  );
}
