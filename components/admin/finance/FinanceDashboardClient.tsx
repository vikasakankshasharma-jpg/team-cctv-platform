"use client";

import { useState, useEffect } from "react";
import { IndianRupee, Clock, CheckCircle2, AlertTriangle, Building2, Landmark, Link, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function FinanceDashboardClient() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedPayout, setSelectedPayout] = useState<any | null>(null);
  const [utrNumber, setUtrNumber] = useState("");
  const [isSettling, setIsSettling] = useState(false);

  const fetchPayouts = async () => {
    try {
      const res = await fetch("/api/admin/finance/payouts");
      const json = await res.json();
      if (json.success) setPayouts(json.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load payouts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, []);

  const handleSettle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber || !selectedPayout) return;

    setIsSettling(true);
    try {
      const res = await fetch("/api/admin/finance/payouts/settle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedPayout.id,
          type: selectedPayout.type,
          source_collection: selectedPayout.source_collection,
          amount: selectedPayout.amount,
          recipient_id: selectedPayout.recipient_id,
          utr_number: utrNumber
        })
      });

      const json = await res.json();
      if (json.success) {
        toast.success("Payout settled successfully!");
        setUtrNumber("");
        setSelectedPayout(null);
        fetchPayouts();
      } else {
        throw new Error(json.error);
      }
    } catch (error: any) {
      toast.error(error.message || "Settlement failed");
    } finally {
      setIsSettling(false);
    }
  };

  const totalPendingAmount = payouts.reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <IndianRupee className="w-6 h-6 text-emerald-600" /> Accounts Payable
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage overdue commissions and installer payouts.</p>
        </div>
        
        <div className="bg-white border border-slate-200 px-6 py-3 rounded-2xl shadow-sm flex items-center gap-4">
          <div className="p-2 bg-rose-50 rounded-lg text-rose-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500">Total Pending Outflow</p>
            <p className="text-xl font-black text-slate-900">₹{totalPendingAmount.toLocaleString('en-IN')}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Recipient</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Type / Lead</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Amount</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Maturity</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-500 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="p-10 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-400" /></td></tr>
              ) : payouts.length === 0 ? (
                <tr><td colSpan={5} className="p-10 text-center text-slate-500 font-medium">No pending payouts!</td></tr>
              ) : (
                payouts.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${p.type === 'installer' ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-700'}`}>
                          {p.type === 'installer' ? <Building2 className="w-4 h-4" /> : <Link className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 text-sm">{p.recipient_name}</p>
                          <div className="flex items-center gap-1 mt-0.5 text-xs">
                            {p.bank_details ? (
                              <span className="flex items-center gap-1 text-emerald-600 font-medium"><Landmark className="w-3 h-3" /> Bank Added</span>
                            ) : (
                              <span className="flex items-center gap-1 text-slate-400"><Landmark className="w-3 h-3" /> No Bank Details</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider mb-1 ${p.type === 'installer' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                        {p.type}
                      </span>
                      <p className="text-xs text-slate-500 font-mono">Lead: {p.lead_id?.substring(0,8)}</p>
                    </td>
                    <td className="px-6 py-4 font-black text-slate-900">
                      ₹{p.amount?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="px-6 py-4">
                      {p.overdue_days > 0 ? (
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${p.overdue_days > 7 ? 'bg-rose-50 text-rose-600 border border-rose-200' : 'bg-amber-50 text-amber-600'}`}>
                          <AlertTriangle className="w-3.5 h-3.5" />
                          {p.overdue_days} Days Pending
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-slate-400">Today</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => setSelectedPayout(p)}
                        className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors shadow-sm"
                      >
                        Settle Now
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SETTLEMENT MODAL */}
      {selectedPayout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="font-black text-lg text-slate-900">Settle Payout</h2>
              <button onClick={() => setSelectedPayout(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
            </div>

            <div className="p-6 space-y-6">
              {/* Bank Details Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5"><Landmark className="w-3.5 h-3.5" /> Recipient Bank Details</h3>
                
                {selectedPayout.bank_details ? (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Beneficiary:</span> <span className="font-bold text-slate-900">{selectedPayout.bank_details.account_name || selectedPayout.recipient_name}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Account No:</span> <span className="font-mono font-bold text-slate-900">{selectedPayout.bank_details.account_number}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">IFSC Code:</span> <span className="font-mono font-bold text-slate-900">{selectedPayout.bank_details.ifsc_code}</span></div>
                    {selectedPayout.bank_details.bank_name && <div className="flex justify-between text-sm"><span className="text-slate-500">Bank Name:</span> <span className="font-bold text-slate-900">{selectedPayout.bank_details.bank_name}</span></div>}
                  </div>
                ) : (
                  <div className="text-center py-4 space-y-2">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto opacity-50" />
                    <p className="text-sm font-bold text-slate-700">No Bank Details Provided</p>
                    <p className="text-xs text-slate-500">You must ask the {selectedPayout.type} for their UPI or Account details.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100">
                <span className="font-bold">Total to Pay:</span>
                <span className="text-2xl font-black tracking-tight">₹{selectedPayout.amount?.toLocaleString('en-IN')}</span>
              </div>

              <form onSubmit={handleSettle} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Bank UTR / Transaction ID *</label>
                  <input 
                    type="text" 
                    required 
                    value={utrNumber}
                    onChange={e => setUtrNumber(e.target.value)}
                    placeholder="e.g. UTR123456789" 
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setSelectedPayout(null)} className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSettling} className="flex-1 py-3 rounded-xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors flex justify-center items-center gap-2">
                    {isSettling ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Mark as Paid</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
