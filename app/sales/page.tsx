"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FollowUpTask } from "@/types";

export default function SalesDashboard() {
  const [tasks, setTasks] = useState<FollowUpTask[]>([]);
  const [filter, setFilter] = useState("hot");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchTasks(filter);
  }, [filter]);

  const fetchTasks = async (statusFilter: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/crm/tasks?filter=${statusFilter}`);
      if (!res.ok) {
        if (res.status === 403) throw new Error("Unauthorized access to CRM");
        throw new Error("Failed to load tasks");
      }
      const json = await res.json();
      setTasks(json.data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (dueAt: string) => new Date(dueAt).getTime() < Date.now();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-semibold">Follow-up Queues</h2>
        <div className="flex bg-white rounded-lg shadow-sm p-1 border">
          <button 
            onClick={() => setFilter("hot")} 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === "hot" ? "bg-red-100 text-red-700" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Hot & Warm
          </button>
          <button 
            onClick={() => setFilter("nurture")} 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === "nurture" ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Nurture
          </button>
          <button 
            onClick={() => setFilter("manual")} 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${filter === "manual" ? "bg-orange-100 text-orange-700" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Needs Manual Call
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-lg shadow-sm border border-gray-200 text-gray-500">
          No active tasks in this queue. You're all caught up!
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due At</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => {
                  const overdue = isOverdue(task.due_at);
                  return (
                    <tr key={task.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${task.priority === "HOT" ? "bg-red-100 text-red-800" : 
                            task.priority === "WARM" ? "bg-orange-100 text-orange-800" : 
                            "bg-blue-100 text-blue-800"}`}>
                          {task.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {task.lead_id.substring(0,8)}...
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={overdue ? "text-red-600 font-medium flex items-center gap-1" : "text-gray-500"}>
                          {overdue && <span className="text-xl leading-none" title="Overdue">⚠️</span>}
                          {new Date(task.due_at).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link 
                          href={`/sales/lead/${task.lead_id}`} 
                          className="text-blue-600 hover:text-blue-900"
                        >
                          View 360 &rarr;
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
