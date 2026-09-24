"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Users, DollarSign, Star, AlertCircle, Wrench } from "lucide-react";
import { toast } from "sonner";

export function AnalyticsClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(res => res.json())
      .then(json => {
        if (json.success) setData(json.data);
        else toast.error("Failed to load analytics");
        setLoading(false);
      })
      .catch(() => {
        toast.error("Network error");
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading God-Mode Analytics...</div>;
  if (!data) return <div className="p-8 text-center text-rose-500 font-bold">Failed to load data.</div>;

  const cards = [
    { title: "Total Revenue", value: `₹${data.totalRevenue.toLocaleString()}`, icon: DollarSign, color: "bg-green-100 text-green-600" },
    { title: "Conversion Rate", value: `${data.conversionRate}%`, icon: TrendingUp, color: "bg-blue-100 text-blue-600" },
    { title: "Avg. Customer Rating", value: `${data.averageRating} / 5.0`, icon: Star, color: "bg-amber-100 text-amber-500" },
    { title: "Active Installations", value: data.openTickets.toString(), icon: Wrench, color: "bg-purple-100 text-purple-600" },
    { title: "Total Leads", value: data.totalLeads.toString(), icon: Users, color: "bg-gray-100 text-gray-600" },
    { title: "Pending Negative Feedback", value: data.pendingIssues.toString(), icon: AlertCircle, color: data.pendingIssues > 0 ? "bg-rose-100 text-rose-600" : "bg-gray-100 text-gray-400" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={`p-4 rounded-xl ${card.color}`}>
                <Icon className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{card.title}</p>
                <p className="text-2xl font-black text-gray-900">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-xl font-black text-gray-900 mb-2">Executive Summary</h3>
        <p className="text-gray-500 font-medium">
          Out of <strong className="text-gray-900">{data.totalLeads}</strong> total leads, you have successfully closed <strong className="text-gray-900">{data.completedLeads}</strong> deals, resulting in a conversion rate of <strong className="text-blue-600">{data.conversionRate}%</strong>. 
          Your customers rate their installation experience at an average of <strong className="text-amber-500">{data.averageRating} Stars</strong>.
          {data.pendingIssues > 0 && (
            <span className="block mt-4 p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl font-bold">
              ⚠️ Attention: You have {data.pendingIssues} unresolved negative customer feedback reports. Please check the CRM timeline to resolve them.
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
