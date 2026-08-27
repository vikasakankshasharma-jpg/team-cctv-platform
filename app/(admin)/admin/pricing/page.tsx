"use client";

import { useEffect, useState } from "react";
import PriceSimulator from "@/components/admin/pricing/PriceSimulator";
import WaterfallVisualizer from "@/components/admin/pricing/WaterfallVisualizer";
import { IndianRupee } from "lucide-react";

export default function PricingControlCenter() {
  const [rules, setRules] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [previewData, setPreviewData] = useState<any[] | null>(null);

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    const res = await fetch("/api/catalog/pricing-rules");
    const data = await res.json();
    setRules(data);
    setLoading(false);
  };

  const handlePreview = async () => {
    setSaving(true);
    setMessage("Generating preview...");
    
    try {
      const res = await fetch("/api/catalog/pricing-rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules,
          preview: true
        })
      });
      const data = await res.json();
      if (data.success && data.isPreview) {
        setPreviewData(data.previewData);
        setMessage("");
      } else {
        setMessage("Failed to generate preview.");
      }
    } catch (err) {
      setMessage("Error generating preview.");
    }
    setSaving(false);
  };

  const saveRules = async () => {
    setSaving(true);
    setMessage("Saving rules and applying batch update...");
    
    try {
      const res = await fetch("/api/catalog/pricing-rules", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rules,
          applyBatchUpdate: true,
          auditLog: {
            targetType: "RULE",
            targetId: "GLOBAL_UPDATE",
            field: "various",
            oldValue: null,
            newValue: 0,
            reason: "Admin UI Batch Save"
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setPreviewData(null);
        setMessage(`Success! Updated ${data.updatedCount} products.`);
      } else {
        setMessage("Failed to save rules.");
      }
    } catch (err) {
      setMessage("Error saving.");
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8">Loading Pricing Rules...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <IndianRupee className="w-6 h-6" /> Pricing Control Center
          </h1>
          <p className="text-sm text-gray-500">Manage Waterfall Markups across the catalog.</p>
        </div>
        <button 
          onClick={handlePreview}
          disabled={saving}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {saving ? "Generating..." : "Preview & Sync"}
        </button>
      </div>
      
      {/* PREVIEW MODAL */}
      {previewData && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Review Catalog Changes</h2>
              <p className="text-sm text-gray-500">{previewData.length} products will be affected by these rule changes.</p>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              {previewData.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No products will be affected by this change. Their effective markups remain the same.</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="p-3">SKU</th>
                      <th className="p-3">Markup Change</th>
                      <th className="p-3">Price Change (₹)</th>
                      <th className="p-3">New Rule Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewData.map(p => (
                      <tr key={p.id}>
                        <td className="p-3 font-medium">{p.sku}</td>
                        <td className="p-3">
                          <span className="text-gray-500 line-through">{p.old_markup}%</span>
                          <span className="mx-2 text-gray-400">→</span>
                          <span className="text-blue-600 font-bold">{p.new_markup}%</span>
                        </td>
                        <td className="p-3">
                          <span className="text-gray-500 line-through">₹{p.old_price?.toLocaleString()}</span>
                          <span className="mx-2 text-gray-400">→</span>
                          <span className="text-green-600 font-bold">₹{p.new_price?.toLocaleString()}</span>
                        </td>
                        <td className="p-3 text-xs font-mono bg-gray-50 rounded px-2">{p.rule_ref}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end gap-4 rounded-b-lg">
              <button 
                onClick={() => setPreviewData(null)}
                className="px-4 py-2 border rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={saveRules}
                disabled={saving || previewData.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-bold"
              >
                {saving ? "Syncing..." : `Confirm Recalculate ${previewData.length} Products`}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {message && (
        <div className="mb-4 p-4 bg-green-50 text-green-700 rounded-md font-medium border border-green-200">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Editor */}
        <div className="space-y-6">
          {/* Global Rule */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="font-semibold text-lg mb-4 text-gray-800 border-b pb-2">1. Global Default Markup</h2>
            <div className="flex items-center gap-4">
              <input 
                type="number" 
                value={rules.GLOBAL_DEFAULT}
                onChange={e => setRules({...rules, GLOBAL_DEFAULT: Number(e.target.value)})}
                className="w-24 border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="text-gray-600 font-medium">%</span>
            </div>
            <p className="text-sm text-gray-500 mt-2">Fallback markup applied if no category or brand rule matches.</p>
          </div>

          {/* Category Rules */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="font-semibold text-lg mb-4 text-gray-800 border-b pb-2">2. Category Markups</h2>
            <div className="space-y-4">
              {Object.keys(rules.CATEGORY || {}).map(cat => (
                <div key={cat} className="flex justify-between items-center">
                  <span className="font-medium capitalize text-gray-700">{cat.replace("_", " ")}</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={rules.CATEGORY[cat]}
                      onChange={e => setRules({
                        ...rules, 
                        CATEGORY: { ...rules.CATEGORY, [cat]: Number(e.target.value) }
                      })}
                      className="w-24 border p-2 rounded text-right focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-600 font-medium">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Brand Rules */}
          <div className="bg-white p-6 rounded-lg border shadow-sm">
            <h2 className="font-semibold text-lg mb-4 text-gray-800 border-b pb-2">3. Brand Markups</h2>
            <div className="space-y-4">
              {Object.keys(rules.BRAND || {}).map(brand => (
                <div key={brand} className="flex justify-between items-center">
                  <span className="font-medium text-gray-700">{brand}</span>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={rules.BRAND[brand]}
                      onChange={e => setRules({
                        ...rules, 
                        BRAND: { ...rules.BRAND, [brand]: Number(e.target.value) }
                      })}
                      className="w-24 border p-2 rounded text-right focus:ring-blue-500 focus:border-blue-500"
                    />
                    <span className="text-gray-600 font-medium">%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Simulator & Visualizer */}
        <div className="space-y-6">
          <PriceSimulator currentRules={rules} />
          <WaterfallVisualizer currentRules={rules} />
        </div>
      </div>
    </div>
  );
}
