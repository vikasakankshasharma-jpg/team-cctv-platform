"use client";

import { useState } from "react";
import { 
  PackageSearch, Truck, ShoppingCart, Store, 
  Plus, Search, Building2, AlertTriangle, CheckCircle2 
} from "lucide-react";
import { toast } from "sonner";
import { VendorsTab } from "./VendorsTab";
import { PurchaseOrdersTab } from "./PurchaseOrdersTab";
import { LiveInventoryTab } from "./LiveInventoryTab";

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
          <LiveInventoryTab />
        )}

        {/* PURCHASE ORDERS TAB */}
        {activeTab === "po" && (
          <PurchaseOrdersTab />
        )}

        {/* VENDORS TAB */}
        {activeTab === "vendors" && (
          <VendorsTab />
        )}

      </div>

    </div>
  );
}
