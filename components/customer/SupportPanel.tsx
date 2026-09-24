"use client";

import { useState } from "react";
import { ShieldCheck, ShieldAlert, Wrench, FileText, CheckCircle2, ChevronRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SupportPanel({ customerInfo, warranties, activeTickets }: { customerInfo: any, warranties: any[], activeTickets: any[] }) {
  const [isRaising, setIsRaising] = useState(false);
  const [selectedWarranty, setSelectedWarranty] = useState<any>(warranties[0] || null);
  const [issueCategory, setIssueCategory] = useState("camera_offline");
  const [issueDesc, setIssueDesc] = useState("");

  const handleSubmit = async () => {
    if (!issueDesc || issueDesc.length < 10) {
      toast.error("Please provide a detailed description (at least 10 characters)");
      return;
    }

    setIsRaising(true);
    try {
      const res = await fetch("/api/customer/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          warranty_id: selectedWarranty?.id,
          quote_id: selectedWarranty?.quote_id || "direct_support",
          lead_id: selectedWarranty?.lead_id || customerInfo.id,
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          issue_category: issueCategory,
          issue_description: issueDesc,
        })
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Ticket Created! ID: ${data.ticketNumber}`);
        setIssueDesc("");
        // In a real app, you'd trigger a router refresh or local state update here
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsRaising(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
          <Wrench className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-gray-900">Support & AMC</h2>
          <p className="text-sm font-medium text-gray-500">Manage your warranties and request repairs</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Side: Warranties */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-gray-900">My Active Systems</h3>
          {warranties.length === 0 ? (
            <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center">
              <ShieldAlert className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-gray-500">No active warranties found.</p>
            </div>
          ) : (
            warranties.map(w => {
              const isExpired = new Date(w.expires_at) < new Date();
              const amcUsed = w.amc_visits_used || 0;
              const amcTotal = w.total_amc_visits_allowed || 2;
              const amcLeft = amcTotal - amcUsed;

              return (
                <div 
                  key={w.id} 
                  onClick={() => setSelectedWarranty(w)}
                  className={`border-2 rounded-2xl p-5 cursor-pointer transition-all ${selectedWarranty?.id === w.id ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 hover:border-gray-200 bg-white'}`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 flex items-center gap-2">
                        {isExpired ? <ShieldAlert className="w-4 h-4 text-red-500"/> : <ShieldCheck className="w-4 h-4 text-emerald-500"/>}
                        System Cover (Quote #{w.quote_id.slice(-6)})
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">Expires: {new Date(w.expires_at).toLocaleDateString()}</p>
                    </div>
                    {isExpired ? (
                       <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Expired</span>
                    ) : (
                       <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Active</span>
                    )}
                  </div>

                  {/* AMC Progress Bar */}
                  <div className="space-y-2 pt-4 border-t border-gray-200/60">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-gray-600">Free AMC Visits</span>
                      <span className={amcLeft > 0 ? "text-emerald-600" : "text-amber-600"}>{amcLeft} Remaining</span>
                    </div>
                    <div className="flex gap-1 h-2">
                      {Array.from({ length: amcTotal }).map((_, i) => (
                        <div key={i} className={`flex-1 rounded-full ${i < amcUsed ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                      ))}
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {amcLeft === 0 ? "Hardware covered. Visit labor is chargeable." : "Hardware and labor are fully covered."}
                    </p>
                  </div>
                </div>
              );
            })
          )}

          {/* Active Tickets Mini-View */}
          {activeTickets.length > 0 && (
             <div className="pt-6">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Recent Requests</h3>
                <div className="space-y-2">
                  {activeTickets.map(tkt => (
                     <div key={tkt.id} className="bg-white border border-gray-100 p-3 rounded-xl flex justify-between items-center">
                        <div>
                           <div className="text-xs font-bold text-gray-900">{tkt.ticket_number}</div>
                           <div className="text-[10px] text-gray-500 truncate max-w-[200px]">{tkt.issue_description}</div>
                        </div>
                        <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-700 px-2 py-1 rounded">
                           {tkt.status}
                        </span>
                     </div>
                  ))}
                </div>
             </div>
          )}
        </div>

        {/* Right Side: Raise Ticket Form */}
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-sm h-fit sticky top-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Request Service</h3>
          
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Issue Category</label>
              <select 
                value={issueCategory} 
                onChange={e => setIssueCategory(e.target.value)}
                className="w-full text-sm p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 bg-gray-50 font-medium"
              >
                <option value="camera_offline">Camera Offline / No Signal</option>
                <option value="dvr_beeping">DVR/NVR Beeping continuously</option>
                <option value="app_not_working">Mobile App not working</option>
                <option value="wiring_issue">Wiring damaged / cut</option>
                <option value="other">Other issue</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Description of Issue</label>
              <textarea 
                value={issueDesc}
                onChange={e => setIssueDesc(e.target.value)}
                placeholder="Please describe exactly what's wrong..."
                className="w-full text-sm p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 bg-gray-50 font-medium h-32 resize-none"
              />
            </div>

            {selectedWarranty && (
               <div className="p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs">
                 <strong className="text-blue-900 block mb-1">Billing Estimate:</strong>
                 {new Date(selectedWarranty.expires_at) < new Date() 
                   ? <span className="text-amber-700">Your system is out of warranty. Inspection & repair charges will apply.</span>
                   : (selectedWarranty.total_amc_visits_allowed - selectedWarranty.amc_visits_used) > 0
                     ? <span className="text-emerald-700">You have a free AMC visit remaining. No visit charges will apply.</span>
                     : <span className="text-amber-700">Your hardware is covered, but you have used all free visits. A standard visit charge (,1500) will apply.</span>
                 }
               </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isRaising}
              className="w-full mt-4 bg-zinc-900 text-white font-bold py-3.5 rounded-xl shadow-md hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group"
            >
              {isRaising ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  Submit Request
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
