"use client";

import { useState, useEffect } from "react";
import { Store, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Vendor } from "@/types";

export function VendorsTab() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    prefix: "",
    contact_person: "",
    phone: "",
    email: "",
    gstin: ""
  });

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await fetch("/api/admin/logistics/vendors");
      if (res.ok) {
        const data = await res.json();
        setVendors(data);
      }
    } catch (err) {
      toast.error("Failed to load vendors");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/logistics/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to add vendor");
      
      toast.success("Vendor added successfully");
      setShowModal(false);
      setFormData({ name: "", prefix: "", contact_person: "", phone: "", email: "", gstin: "" });
      fetchVendors();
    } catch (err) {
      toast.error("Error adding vendor");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-0 relative">
      <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-[24px]">
        <h3 className="font-bold text-gray-700 flex items-center gap-2">
          <Store className="w-5 h-5 text-orange-500" /> Authorized Distributors & Vendors
        </h3>
        <button 
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 inline-flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      {isLoading ? (
        <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
      ) : (
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500 font-bold border-b">
            <tr>
              <th className="px-6 py-4">Vendor Name</th>
              <th className="px-6 py-4">Prefix</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">GSTIN</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {vendors.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-10 text-center text-gray-500">No vendors found. Add your first supplier.</td>
              </tr>
            ) : (
              vendors.map(v => (
                <tr key={v.id} className="hover:bg-orange-50/30">
                  <td className="px-6 py-4 font-bold text-gray-900">{v.name}</td>
                  <td className="px-6 py-4"><span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">{v.prefix}</span></td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{v.contact_person || "-"}</div>
                    <div className="text-gray-500 text-xs">{v.phone || v.email || ""}</div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{v.gstin || "-"}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${v.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {/* Add Vendor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Add New Vendor</h2>
              <p className="text-gray-500 text-sm mt-1">Register a new distributor or OEM supplier.</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Company / Store Name *</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500" placeholder="e.g. Aditya Infotech Ltd" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">SKU/PO Prefix *</label>
                  <input required maxLength={10} value={formData.prefix} onChange={e => setFormData({...formData, prefix: e.target.value.toUpperCase()})} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 uppercase" placeholder="e.g. ADITYA" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">GSTIN</label>
                  <input value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value.toUpperCase()})} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500 uppercase" placeholder="22AAAAA0000A1Z5" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Contact Person</label>
                  <input value={formData.contact_person} onChange={e => setFormData({...formData, contact_person: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500" placeholder="Rahul Sharma" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number</label>
                  <input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-orange-500" placeholder="+91..." />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-5 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="px-5 py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 disabled:opacity-50">
                  {isSubmitting ? "Saving..." : "Save Vendor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
