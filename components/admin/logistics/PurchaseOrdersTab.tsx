"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { PurchaseOrder } from "@/types";
import { CreatePOModal } from "./CreatePOModal";

export function PurchaseOrdersTab() {
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPOs();
  }, []);

  const fetchPOs = async () => {
    try {
      const res = await fetch("/api/admin/logistics/po");
      if (res.ok) {
        const data = await res.json();
        setPos(data);
      }
    } catch (err) {
      toast.error("Failed to load Purchase Orders");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-0 relative">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-[24px]">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-blue-500" /> Active Purchase Orders
        </h3>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 inline-flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Create PO
        </button>
      </div>

      {isLoading ? (
        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-bold border-b">
            <tr>
              <th className="px-6 py-4">PO Number</th>
              <th className="px-6 py-4">Vendor</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Delivery Mode</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pos.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-500">No Purchase Orders found.</td>
              </tr>
            ) : (
              pos.map(po => (
                <tr key={po.id} className="hover:bg-blue-50/30">
                  <td className="px-6 py-4 font-bold text-gray-900">{po.po_number}</td>
                  <td className="px-6 py-4 font-medium">{po.vendor_name}</td>
                  <td className="px-6 py-4 font-bold">₹{po.total_amount?.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">{po.delivery_mode.replace(/_/g, ' ')}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                      po.status === 'issued' ? 'bg-blue-100 text-blue-700' :
                      po.status === 'completed' ? 'bg-green-100 text-green-700' :
                      po.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {po.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
      
      {showModal && (
        <CreatePOModal 
          onClose={() => setShowModal(false)} 
          onCreated={() => { setShowModal(false); fetchPOs(); }} 
        />
      )}
    </div>
  );
}
