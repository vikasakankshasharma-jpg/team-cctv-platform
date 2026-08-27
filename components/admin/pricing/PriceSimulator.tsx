"use client";

import { useState } from "react";
import { resolveWaterfallMargin, calculateSellingPrice } from "@/lib/waterfall-pricing";

export default function PriceSimulator({ currentRules }: { currentRules: any }) {
  const [cost, setCost] = useState<number>(2100);
  const [category, setCategory] = useState<string>("cctv_camera");
  const [brand, setBrand] = useState<string>("CP Plus");
  const [sku, setSku] = useState<string>("");

  // Create a mock product
  const mockProduct = {
    base_cost: cost,
    category,
    brand,
    sku
  };

  // Resolve
  const { marginPercent, ruleRef } = resolveWaterfallMargin(mockProduct as any, currentRules);
  const sellingPrice = calculateSellingPrice(cost, marginPercent);
  const grossProfit = sellingPrice - cost;
  // Margin is (Profit / Selling Price)
  const grossMargin = sellingPrice > 0 ? (grossProfit / sellingPrice) * 100 : 0;

  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <h2 className="font-semibold text-lg mb-4 text-gray-800 border-b pb-2">Price Simulator</h2>
      <p className="text-sm text-gray-500 mb-4">Preview how waterfall rules apply to a specific item.</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₹)</label>
          <input 
            type="number" 
            value={cost} 
            onChange={(e) => setCost(Number(e.target.value))}
            className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Optional)</label>
          <input 
            type="text" 
            value={sku} 
            onChange={(e) => setSku(e.target.value)}
            className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
            placeholder="e.g. ITEM_123"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)}
            className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="cctv_camera">Camera</option>
            <option value="recorder">Recorder</option>
            <option value="storage">Storage</option>
            <option value="cable">Cable</option>
            <option value="accessories">Accessories</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
          <select 
            value={brand} 
            onChange={(e) => setBrand(e.target.value)}
            className="w-full border p-2 rounded focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="CP Plus">CP Plus</option>
            <option value="Budget Brand">Budget Brand</option>
            <option value="Seagate">Seagate</option>
            <option value="D-Link">D-Link</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div className="bg-gray-50 p-4 rounded-md border">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Effective Markup Rule:</span>
          <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded text-sm">{ruleRef} ({marginPercent}%)</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Selling Price:</span>
          <span className="font-bold text-gray-900 text-lg">₹{sellingPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-600">Gross Profit (₹):</span>
          <span className="font-medium text-green-600">₹{grossProfit.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Gross Margin (%):</span>
          <span className="font-medium text-gray-900">{grossMargin.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
}

