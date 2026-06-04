"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

export function AIPerformanceChart({ dashboardItems }: { dashboardItems: any[] }) {
  // Process the raw brain items into chart data
  // We want to see User Ratings (Thumbs Up vs Thumbs Down) and Auto-Corrections
  let thumbsUp = 0;
  let thumbsDown = 0;
  let autoCorrected = 0;

  dashboardItems.forEach(item => {
    if (item.userRating === 1) thumbsUp++;
    if (item.userRating === -1) thumbsDown++;
    if (item.autoCorrected) autoCorrected++;
  });

  const data = [
    {
      name: "User Feedback",
      "Thumbs Up (Helpful)": thumbsUp,
      "Thumbs Down (Needs Work)": thumbsDown,
    },
    {
      name: "Night School",
      "Auto-Corrected": autoCorrected,
    }
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow border border-gray-200 mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Performance Metrics</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280' }} allowDecimals={false} />
            <Tooltip 
              cursor={{ fill: '#F3F4F6' }}
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="Thumbs Up (Helpful)" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
            <Bar dataKey="Thumbs Down (Needs Work)" stackId="a" fill="#EF4444" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Auto-Corrected" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
