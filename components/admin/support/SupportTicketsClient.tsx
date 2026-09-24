"use client";

import { useState } from "react";
import { ShieldAlert, ShieldCheck, Wrench, Clock, CheckCircle2, MoreVertical, Phone, HardHat } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function SupportTicketsClient({ initialTickets, availableInstallers }: { initialTickets: any[], availableInstallers: any[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [selectedTicket, setSelectedTicket] = useState<any>(undefined);
  const [isUpdating, setIsUpdating] = useState(false);
  const [assigneeId, setAssigneeId] = useState("");
  const [isThirdParty, setIsThirdParty] = useState(false);
  const [tpName, setTpName] = useState("");
  const [tpPhone, setTpPhone] = useState("");

  const handleStatusUpdate = async (ticketId: string, newStatus: string, assignId?: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: newStatus, 
          assigned_installer_id: assignId || undefined,
          is_third_party: isThirdParty,
          third_party_name: tpName,
          third_party_phone: tpPhone
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Ticket Updated successfully!");
        setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus, assigned_installer_id: assignId || t.assigned_installer_id } : t));
        setSelectedTicket(undefined);
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("Failed to update ticket.");
    } finally {
      setIsUpdating(false);
    }
  };

  const PaymentBadge = ({ status }: { status: string }) => {
    switch(status) {
      case 'free_amc':
        return <span className="bg-emerald-100 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Free AMC</span>;
      case 'chargeable_labor':
        return <span className="bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Free Parts / Paid Visit</span>;
      case 'fully_chargeable':
        return <span className="bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">Out of Warranty</span>;
      default:
        return undefined;
    }
  };

  const columns = [
    { id: "open", title: "New Requests", icon: <ShieldAlert className="w-4 h-4 text-rose-500" /> },
    { id: "assigned", title: "Assigned / In Progress", icon: <Wrench className="w-4 h-4 text-blue-500" /> },
    { id: "resolved", title: "Resolved", icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" /> },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {columns.map(col => (
          <div key={col.id} className="bg-gray-50/50 rounded-3xl p-4 border border-gray-100 min-h-[500px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm uppercase tracking-wider">
                {col.icon} {col.title}
              </h3>
              <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-1 rounded-full">
                {tickets.filter(t => t.status === col.id).length}
              </span>
            </div>

            <div className="space-y-3">
              {tickets.filter(t => t.status === col.id).map(ticket => (
                <div 
                  key={ticket.id} 
                  onClick={() => setSelectedTicket(ticket)}
                  className="bg-white border border-gray-100 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-black text-gray-400 group-hover:text-blue-500 transition-colors">
                      {ticket.ticket_number}
                    </span>
                    <PaymentBadge status={ticket.payment_status} />
                  </div>
                  
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{ticket.customer_name}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{ticket.issue_description}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </div>
                    {ticket.assigned_installer_id && (
                       <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-bold">
                         <HardHat className="w-3 h-3" /> Assigned
                       </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Ticket Management Modal */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(undefined)}>
        <DialogContent className="sm:max-w-md">
          {selectedTicket && (
            <>
              <DialogHeader>
                <div className="flex justify-between items-start pr-6">
                  <div>
                    <DialogTitle className="text-xl font-black">{selectedTicket.ticket_number}</DialogTitle>
                    <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">{selectedTicket.issue_category.replace(/_/g, ' ')}</p>
                  </div>
                  <PaymentBadge status={selectedTicket.payment_status} />
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Customer:</span>
                    <span className="font-bold text-gray-900">{selectedTicket.customer_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Phone:</span>
                    <a href={`tel:${selectedTicket.customer_phone}`} className="font-bold text-blue-600 flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {selectedTicket.customer_phone}
                    </a>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 font-medium">Quote ID:</span>
                    <a href={`/admin/leads/${selectedTicket.lead_id}/quote-builder`} target="_blank" className="font-bold text-blue-600">
                      {selectedTicket.quote_id.slice(-6)}
                    </a>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-2">Issue Description</h4>
                  <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl leading-relaxed whitespace-pre-wrap border border-gray-100">
                    {selectedTicket.issue_description}
                  </p>
                </div>

                {/* Dispatch Controls */}
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Dispatch & Resolution</h4>
                  
                  {selectedTicket.status === "open" && (
                    <div className="space-y-4">
                      
                      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                        <button 
                          onClick={() => setIsThirdParty(false)}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isThirdParty ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          Internal Staff
                        </button>
                        <button 
                          onClick={() => setIsThirdParty(true)}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isThirdParty ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          3rd Party / Freelancer
                        </button>
                      </div>

                      {!isThirdParty ? (
                        <div className="space-y-2">
                          <select 
                            value={assigneeId}
                            onChange={e => setAssigneeId(e.target.value)}
                            className="w-full text-sm p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 bg-white font-medium"
                          >
                            <option value="">Select Internal Installer...</option>
                            {availableInstallers.map(inst => (
                              <option key={inst.id} value={inst.id}>{inst.name} ({inst.phone})</option>
                            ))}
                          </select>
                          <button 
                            disabled={!assigneeId || isUpdating}
                            onClick={() => handleStatusUpdate(selectedTicket.id, "assigned", assigneeId)}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            Assign Installer & Move to Progress
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            placeholder="Freelancer Name" 
                            value={tpName}
                            onChange={e => setTpName(e.target.value)}
                            className="w-full text-sm p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-medium"
                          />
                          <input 
                            type="text" 
                            placeholder="Freelancer Phone (10 digits)" 
                            value={tpPhone}
                            onChange={e => setTpPhone(e.target.value)}
                            className="w-full text-sm p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-medium"
                          />
                          <button 
                            disabled={!tpName || !tpPhone || isUpdating}
                            onClick={() => handleStatusUpdate(selectedTicket.id, "assigned", undefined)}
                            className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50"
                          >
                            Assign to Freelancer
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedTicket.status === "assigned" && (
                    <div className="flex gap-2">
                      <button 
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate(selectedTicket.id, "resolved", selectedTicket.assigned_installer_id)}
                        className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" /> Mark Resolved
                      </button>
                      <button 
                        disabled={isUpdating}
                        onClick={() => handleStatusUpdate(selectedTicket.id, "open", undefined)}
                        className="px-4 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        Cancel Dispatch
                      </button>
                    </div>
                  )}

                  {selectedTicket.status === "resolved" && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-center gap-2 font-bold justify-center">
                      <CheckCircle2 className="w-5 h-5" /> Ticket Resolved Successfully
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
