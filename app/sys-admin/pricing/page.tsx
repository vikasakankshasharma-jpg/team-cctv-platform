"use client";

import { useEffect, useState } from "react";

export default function AdminPricingPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  
  // Audits
  const [audits, setAudits] = useState<any[]>([]);
  const [showAudits, setShowAudits] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, confRes, auditRes] = await Promise.all([
        fetch("/api/admin/pricing/products"),
        fetch("/api/admin/pricing/config"),
        fetch("/api/admin/audit")
      ]);
      
      const prodJson = await prodRes.json();
      const confJson = await confRes.json();
      const auditJson = await auditRes.json();
      
      setProducts(prodJson.data || []);
      setConfig(confJson.data || {});
      setAudits(auditJson.data || []);
    } catch (err: any) {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleProductUpdate = async (productId: string, updates: any) => {
    if (updates.base_cost !== undefined && updates.base_cost <= 0) {
      alert("Base cost must be positive.");
      return;
    }

    if (!confirm(`Are you sure you want to update ${productId}? This will affect future quotes.`)) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pricing/products/${productId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfigUpdate = async () => {
    if (!confirm("Update global pricing config? This affects ALL future quotes.")) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/pricing/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-center py-10">Loading Admin Dashboard...</div>;

  return (
    <div className="space-y-8">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <span className="text-yellow-600 text-xl" title="Warning">⚠️</span>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-bold text-yellow-800">Critical Immutability Warning</h3>
            <div className="mt-1 text-sm text-yellow-700">
              <p>
                These pricing changes apply <strong>ONLY to future quotes</strong>. 
                Existing quotes and invoices are immutable and will remain unchanged.
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="text-red-500 bg-red-50 p-4 rounded">{error}</div>}

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Product Master</h2>
        <button onClick={() => setShowAudits(!showAudits)} className="text-sm text-indigo-600 font-medium bg-indigo-50 px-3 py-1 rounded">
          {showAudits ? "Hide Audits" : "View Audit Logs"}
        </button>
      </div>

      {showAudits && (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200">
          <h3 className="font-semibold text-gray-700 mb-3">Recent Pricing Mutations</h3>
          <div className="max-h-60 overflow-y-auto text-sm">
            {audits.map((a: any, i) => (
              <div key={i} className="py-2 border-b last:border-0 text-gray-600">
                <span className="font-mono text-xs bg-gray-100 px-1">{new Date(a.created_at).toLocaleString()}</span>
                <span className="mx-2 font-semibold">{a.actor}</span>
                performed <span className="font-semibold text-indigo-600">{a.action}</span> on 
                <span className="ml-1">{a.entity_id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Cost (₹)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <input 
                    type="number" 
                    defaultValue={p.base_cost}
                    id={`cost-${p.id}`}
                    className="border rounded p-1 w-24 text-right"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <select 
                    defaultValue={p.stock_status}
                    id={`status-${p.id}`}
                    className="border rounded p-1"
                  >
                    <option value="in_stock">In Stock</option>
                    <option value="ON_DEMAND">On Demand (Warning)</option>
                    <option value="OUT_OF_STOCK">Out of Stock (Block)</option>
                    <option value="discontinued">Discontinued (Block)</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button 
                    disabled={saving}
                    onClick={() => {
                      const costVal = Number((document.getElementById(`cost-${p.id}`) as HTMLInputElement).value);
                      const statusVal = (document.getElementById(`status-${p.id}`) as HTMLSelectElement).value;
                      handleProductUpdate(p.id, { base_cost: costVal, stock_status: statusVal });
                    }}
                    className="text-indigo-600 hover:text-indigo-900 font-bold bg-indigo-50 px-3 py-1 rounded"
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2">Global Config & Surcharges</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ladder/Scaffolding Fee (₹)</label>
            <input 
              type="number" 
              value={config?.site_preparation?.ladderArrangementFee || 0}
              onChange={e => setConfig({...config, site_preparation: {...config.site_preparation, ladderArrangementFee: Number(e.target.value)}})}
              className="w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Marble Labor Surcharge (₹)</label>
            <input 
              type="number" 
              value={config?.site_preparation?.marbleLaborSurcharge || 0}
              onChange={e => setConfig({...config, site_preparation: {...config.site_preparation, marbleLaborSurcharge: Number(e.target.value)}})}
              className="w-full border rounded p-2"
            />
          </div>
        </div>
        <button 
          disabled={saving}
          onClick={handleConfigUpdate}
          className="bg-indigo-600 text-white font-semibold py-2 px-6 rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Global Rules"}
        </button>
      </div>

    </div>
  );
}
