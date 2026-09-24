"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Calendar, MapPin, Phone, User, Clock, CheckCircle2, Navigation2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function SurveyManagerClient({ initialSurveys, availableInstallers }: { initialSurveys: any[], availableInstallers: any[] }) {
  const [surveys, setSurveys] = useState(initialSurveys);
  const [selectedSurvey, setSelectedSurvey] = useState<any>(undefined);
  const [assigneeId, setAssigneeId] = useState("");
  const [isThirdParty, setIsThirdParty] = useState(false);
  const [tpName, setTpName] = useState("");
  const [tpPhone, setTpPhone] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (surveyId: string, newStatus: string, assignId?: string) => {
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/surveys/${surveyId}`, {
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
        toast.success("Survey updated!");
        setSurveys(surveys.map(s => s.id === surveyId ? { ...s, status: newStatus, assigned_installer_id: assignId || s.assigned_installer_id } : s));
        setSelectedSurvey(undefined);
      } else {
        toast.error(data.error);
      }
    } catch (e) {
      toast.error("An error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  const getSlotLabel = (slot: string) => {
    switch(slot) {
      case 'morning_10_1': return 'Morning (10 AM - 1 PM)';
      case 'afternoon_2_5': return 'Afternoon (2 PM - 5 PM)';
      case 'evening_5_7': return 'Evening (5 PM - 7 PM)';
      default: return slot;
    }
  };

  const columns = [
    { id: "pending", title: "Pending Assignment" },
    { id: "assigned", title: "Assigned to Engineer" },
    { id: "completed", title: "Completed" },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {columns.map(col => (
          <div key={col.id} className="bg-gray-50/50 rounded-3xl p-4 border border-gray-100 min-h-[500px]">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">{col.title}</h3>
              <span className="bg-white border-2 border-gray-100 text-gray-700 text-xs font-black px-2 py-1 rounded-full">
                {surveys.filter(s => s.status === col.id).length}
              </span>
            </div>

            <div className="space-y-3">
              {surveys.filter(s => s.status === col.id).map(survey => (
                <div 
                  key={survey.id} 
                  onClick={() => setSelectedSurvey(survey)}
                  className="bg-white border-2 border-gray-100 p-4 rounded-2xl shadow-sm hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-2 text-blue-600 font-bold text-sm bg-blue-50 w-fit px-2 py-1 rounded-lg">
                    <Calendar className="w-4 h-4" />
                    {survey.date}
                  </div>
                  
                  <h4 className="font-black text-gray-900 text-lg">{survey.customer_name}</h4>
                  <p className="text-xs text-gray-500 font-medium truncate flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {survey.address}, {survey.pincode}
                  </p>
                  
                  <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{getSlotLabel(survey.time_slot)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!selectedSurvey} onOpenChange={(open) => !open && setSelectedSurvey(undefined)}>
        <DialogContent className="sm:max-w-md">
          {selectedSurvey && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-black flex items-center gap-2">
                  <Navigation2 className="w-5 h-5 text-blue-500" />
                  Site Survey Details
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-bold text-gray-900">{selectedSurvey.customer_name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <a href={`tel:${selectedSurvey.customer_phone}`} className="font-bold text-blue-600">
                      {selectedSurvey.customer_phone}
                    </a>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                    <span className="font-bold text-gray-900 leading-snug">{selectedSurvey.address}<br/>{selectedSurvey.pincode}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm pt-2 border-t border-gray-200">
                    <Calendar className="w-4 h-4 text-blue-500" />
                    <span className="font-black text-blue-900">{selectedSurvey.date} • {getSlotLabel(selectedSurvey.time_slot)}</span>
                  </div>
                </div>

                {/* Dispatch Controls */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Assign Engineer</h4>
                  
                  {selectedSurvey.status === "pending" && (
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
                            className="w-full text-sm p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-medium bg-white"
                          >
                            <option value="">Select Internal Engineer...</option>
                            {availableInstallers.map(inst => (
                              <option key={inst.id} value={inst.id}>{inst.name} ({inst.phone})</option>
                            ))}
                          </select>
                          <button 
                            disabled={!assigneeId || isUpdating}
                            onClick={() => handleUpdate(selectedSurvey.id, "assigned", assigneeId)}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            Dispatch Internal Engineer
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
                            onClick={() => handleUpdate(selectedSurvey.id, "assigned", undefined)}
                            className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50"
                          >
                            Assign to Freelancer
                          </button>
                        </div>
                      )}

                    </div>
                  )}

                  {selectedSurvey.status === "assigned" && (
                    <div className="flex gap-2">
                      <button 
                        disabled={isUpdating}
                        onClick={() => handleUpdate(selectedSurvey.id, "completed", selectedSurvey.assigned_installer_id)}
                        className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-5 h-5" /> Mark Survey Completed
                      </button>
                      <button 
                        disabled={isUpdating}
                        onClick={() => handleUpdate(selectedSurvey.id, "pending", undefined)}
                        className="px-4 bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
                      >
                        Cancel Dispatch
                      </button>
                    </div>
                  )}

                  {selectedSurvey.status === "completed" && (
                    <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-center gap-2 font-bold justify-center">
                      <CheckCircle2 className="w-5 h-5" /> Survey Completed Successfully
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
