"use client";

import { useState } from "react";
import { QuoteSnapshot } from "@/types";
import { useTranslation } from "@/hooks/useTranslation";

export default function LeadIntelligencePanel({ 
  lead, 
  onUpdate 
}: { 
  lead: QuoteSnapshot, 
  onUpdate: () => void 
}) {
  const { t } = useTranslation();
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
      <h3 className="font-semibold text-lg text-gray-800 mb-4 border-b pb-2 leading-snug">{t("adm_intel_title", "Lead Intelligence")}</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("adm_intel_intent", "Intent Score")}</label>
          <select 
            value={intentScore} 
            onChange={(e) => setIntentScore(e.target.value as any)}
            className="w-full p-2 border rounded-md text-sm"
          >
            <option value="Cold">{t("adm_intel_cold", "Cold")}</option>
            <option value="Warm">{t("adm_intel_warm", "Warm")}</option>
            <option value="Hot">{t("adm_intel_hot", "Hot")}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("adm_intel_prob", "Probability (%)")}</label>
          <input 
            type="number" 
            min="0" max="100"
            value={probabilityPercent} 
            onChange={(e) => setProbabilityPercent(Number(e.target.value))}
            className="w-full p-2 border rounded-md text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("adm_intel_inst_type", "Installation Type")}</label>
          <select 
            value={installationType} 
            onChange={(e) => setInstallationType(e.target.value as any)}
            className="w-full p-2 border rounded-md text-sm"
          >
            <option value="New">{t("adm_intel_new_inst", "New Installation")}</option>
            <option value="Upgrade">{t("adm_intel_upgrade", "Upgrade/Replacement")}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("adm_intel_exp_close", "Expected Closing")}</label>
          <input 
            type="date" 
            value={expectedClosingDate} 
            onChange={(e) => setExpectedClosingDate(e.target.value)}
            className="w-full p-2 border rounded-md text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("adm_intel_exp_amt", "Expected Pipeline Amount (₹)")}</label>
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
        className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 whitespace-normal leading-snug"
      >
        {saving ? t("adm_intel_saving", "Saving...") : t("adm_intel_save_btn", "Update Intelligence")}
      </button>
    </div>
  );
}
