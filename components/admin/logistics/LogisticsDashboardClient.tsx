"use client";

import { useState } from "react";
import { 
  PackageSearch, Truck, ShoppingCart, Store, 
  Plus, Search, Building2, AlertTriangle, CheckCircle2 
} from "lucide-react";
import { toast } from "sonner";

export function LogisticsDashboardClient() {
  const [activeTab, setActiveTab] = useState<"inventory" | "po" | "vendors">("inventory");

  // Mock data for UI construction
  const hubs = ["Delhi NCR Hub", "Mumbai Central Hub", "Bangalore Hub"];
  const [selectedHub, setSelectedHub] = useState("Delhi NCR Hub");

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Truck className="w-8 h-8 text-blue-600" />
            Logistics & Procurement
          </h1>
          <p className="text-gray-500 mt-2">Manage Just-In-Time (JIT) Hub Inventory, Vendors, and Purchase Orders.</p>
        </div>
        
        {/* Hub Selector (Only show if on inventory tab) */}
        {activeTab === "inventory" && (
          <div className="flex items-center gap-2 bg-white p-2 rounded-xl shadow-sm border">
            <Building2 className="w-5 h-5 text-gray-400 ml-2" />
            <select 
              value={selectedHub}
              onChange={(e) => setSelectedHub(e.target.value)}
              className="border-none outline-none font-bold text-sm bg-transparent pr-4"
            >
              {hubs.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 border-b">
        <button 
          onClick={() => setActiveTab("inventory")}
          className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === "inventory" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"}`}
        >
          <PackageSearch className="w-4 h-4" /> Live Inventory
        </button>
        <button 
          onClick={() => setActiveTab("po")}
          className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === "po" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"}`}
        >
          <ShoppingCart className="w-4 h-4" /> Purchase Orders (PO)
        </button>
        <button 
          onClick={() => setActiveTab("vendors")}
          className={`px-6 py-3 font-bold text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === "vendors" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-900"}`}
        >
          <Store className="w-4 h-4" /> Vendors & Suppliers
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-[24px] border shadow-sm min-h-[500px]">
        
        {/* INVENTORY TAB */}
        {activeTab === "inventory" && (
          <div className="p-0">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-[24px]">
              <div className="relative w-72">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search SKU or Product..." className="w-full pl-9 pr-4 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button className="text-sm font-bold text-blue-600 hover:underline">Download Stock Report</button>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-bold border-b">
                <tr>
                  <th className="px-6 py-4">Product / SKU</th>
                  <th className="px-6 py-4">Brand</th>
                  <th className="px-6 py-4">Physical Stock</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {/* Mock Row 1 */}
                <tr className="hover:bg-blue-50/30">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">2MP ColorVu Bullet Camera</div>
                    <div className="text-gray-500 text-xs">SKU: HIK-2MP-BUL-CV</div>
                  </td>
                  <td className="px-6 py-4 font-medium">Hikvision</td>
                  <td className="px-6 py-4">
                    <span className="font-black text-lg">142</span> units
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Healthy
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setActiveTab("po")} className="text-blue-600 font-bold hover:underline">Generate PO</button>
                  </td>
                </tr>
                {/* Mock Row 2 */}
                <tr className="hover:bg-blue-50/30">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">4CH DVR (AcuSense)</div>
                    <div className="text-gray-500 text-xs">SKU: HIK-4CH-DVR-AS</div>
                  </td>
                  <td className="px-6 py-4 font-medium">Hikvision</td>
                  <td className="px-6 py-4">
                    <span className="font-black text-lg text-red-600">3</span> units
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
                      <AlertTriangle className="w-3.5 h-3.5" /> Critical Low
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => setActiveTab("po")} className="text-blue-600 font-bold hover:underline">Generate PO</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* PURCHASE ORDERS TAB */}
        {activeTab === "po" && (
          <div className="p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold">Purchase Order System</h3>
            <p className="text-gray-500 max-w-md mx-auto">Generate PDF Purchase Orders to send to your distributors. When stock arrives, mark it as received to automatically update Hub inventory and notify the Accountant.</p>
            <button className="mt-4 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-500/20 inline-flex items-center gap-2">
              <Plus className="w-5 h-5" /> Create New PO
            </button>
          </div>
        )}

        {/* VENDORS TAB */}
        {activeTab === "vendors" && (
          <div className="p-8 text-center space-y-4">
            <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold">Vendor Directory</h3>
            <p className="text-gray-500 max-w-md mx-auto">Manage your authorized distributors, their GST numbers, and contact details for automated PO generation.</p>
            <button className="mt-4 px-6 py-3 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 shadow-lg shadow-orange-500/20 inline-flex items-center gap-2">
              <Plus className="w-5 h-5" /> Add New Vendor
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
