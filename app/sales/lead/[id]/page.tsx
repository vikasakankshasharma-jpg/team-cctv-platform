"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Lead360Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const leadId = resolvedParams.id;
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Action state
  const [isActionModalOpen, setActionModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string>("");
  const [actionType, setActionType] = useState("MARK_CONTACTED");
  const [actionNote, setActionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchLead360();
  }, [leadId]);

  const fetchLead360 = async () => {
    try {
      const res = await fetch(`/api/crm/leads/${leadId}`);
      if (!res.ok) throw new Error("Failed to load Lead 360 data");
      const json = await res.json();
      setData(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    setActionLoading(true);
    
    try {
      const res = await fetch(`/api/crm/tasks/${selectedTask}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: actionType, note: actionNote })
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.message || "Action failed");
      }
      // Reload lead data
      await fetchLead360();
      setActionModalOpen(false);
      setActionNote("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-12 text-center animate-pulse">Loading Lead 360...</div>;
  if (error) return <div className="p-8 text-red-600 bg-red-50 rounded-lg">{error}</div>;
  if (!data) return <div className="p-8">Lead not found</div>;

  const { lead, tasks, quotes, invoices, jobs } = data;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Link href="/sales" className="text-gray-500 hover:text-gray-900">&larr; Back to Queue</Link>
        <h2 className="text-2xl font-bold">Lead Details</h2>
        <span className="bg-gray-200 text-gray-800 text-xs px-2 py-1 rounded-md font-mono">{leadId}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Customer Context & Jobs */}
        <div className="space-y-6 lg:col-span-1">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Wizard Snapshot</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500 font-medium">Timeline</dt>
                <dd className="font-semibold text-gray-900">{lead?.timeline || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Mounting</dt>
                <dd>{lead?.wizard_data?.mounting_height || 'N/A'}</dd>
              </div>
              <div>
                <dt className="text-gray-500 font-medium">Contacted Mobile</dt>
                <dd>{lead?.mobile || 'Hidden (Secure)'}</dd>
              </div>
            </dl>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Active Tasks</h3>
            {tasks?.length === 0 ? <p className="text-sm text-gray-500">No active tasks.</p> : (
              <ul className="space-y-3">
                {tasks?.map((t: any) => (
                  <li key={t.id} className="p-3 bg-gray-50 rounded-md border text-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-semibold text-blue-700">{t.status}</span>
                      <span className="text-xs bg-gray-200 px-1 rounded">{t.priority}</span>
                    </div>
                    <p className="text-gray-600 mb-3 text-xs">Due: {new Date(t.due_at).toLocaleString()}</p>
                    <button 
                      onClick={() => { setSelectedTask(t.id); setActionModalOpen(true); }}
                      className="w-full bg-blue-600 text-white py-1.5 rounded-md text-xs font-semibold hover:bg-blue-700"
                    >
                      Log Manual Action
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Right Col: Financials & Jobs */}
        <div className="space-y-6 lg:col-span-2">
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Quotations & Invoices</h3>
            <div className="space-y-4">
              {quotes?.map((q: any) => (
                <div key={q.id} className="p-4 border rounded-lg hover:shadow-sm">
                  <div className="flex justify-between mb-2">
                    <h4 className="font-medium text-gray-900">Quote {q.id}</h4>
                    <span className="font-bold text-green-700">₹{q.total_payable}</span>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Status: {q.status || 'draft'}</p>
                    <p>Items: {q.items?.length || 0}</p>
                  </div>
                </div>
              ))}
              {quotes?.length === 0 && <p className="text-sm text-gray-500">No quotes generated yet.</p>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 border-b pb-2">Operations / Jobs</h3>
            <div className="space-y-4">
              {jobs?.map((j: any) => (
                <div key={j.id} className="flex justify-between items-center p-4 border rounded-lg bg-gray-50">
                  <div>
                    <p className="font-medium">Job {j.id}</p>
                    <p className="text-xs text-gray-500 mt-1">Installer: {j.installer_id || 'Unassigned'}</p>
                  </div>
                  <span className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded font-semibold uppercase">
                    {j.status}
                  </span>
                </div>
              ))}
              {jobs?.length === 0 && <p className="text-sm text-gray-500">No jobs dispatched yet.</p>}
            </div>
          </div>

        </div>
      </div>

      {/* Action Modal */}
      {isActionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Log Sales Action</h3>
            <form onSubmit={handleActionSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Action Type</label>
                <select 
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  <option value="MARK_CONTACTED">Mark Contacted (Successful)</option>
                  <option value="RESCHEDULE">Reschedule (Call Later)</option>
                  <option value="CLOSE">Close (Lost / Unresponsive)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Interaction Notes</label>
                <textarea 
                  required
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  className="w-full border rounded-md p-2 h-24"
                  placeholder="e.g. Spoke to customer, they want..."
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button 
                  type="button" 
                  onClick={() => setActionModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={actionLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  {actionLoading ? "Saving..." : "Save Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
