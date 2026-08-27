"use client";

import React, { useEffect, useState } from "react";

export default function AnalyticsClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("all");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/analytics?range=${range}`);
        const result = await res.json();
        if (result.success) {
          setData(result.data);
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };
    fetchAnalytics();
  }, [range]);

  if (loading) return <div className="p-12 text-center text-gray-500">Loading Intelligence...</div>;
  if (!data) return <div className="p-12 text-center text-red-500">Failed to load data</div>;

  const { overview, sources, plans, intelligence, whatsapp } = data;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Quotation Intelligence</h1>
          <p className="text-gray-500">Business performance & customer insights</p>
        </div>
        <select 
          value={range} 
          onChange={(e) => setRange(e.target.value)}
          className="border rounded-lg p-2"
        >
          <option value="all">All Time</option>
          <option value="30d">Last 30 Days</option>
          <option value="7d">Last 7 Days</option>
        </select>
      </div>

      {/* 1. Executive Overview */}
      <section>
        <h2 className="text-xl font-bold mb-4">Executive Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="text-gray-500 text-sm mb-1">Total Quotes</div>
            <div className="text-3xl font-bold">{overview.totalQuotes}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="text-gray-500 text-sm mb-1">WhatsApp Sent</div>
            <div className="text-3xl font-bold">{overview.whatsappSent}</div>
          </div>
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="text-gray-500 text-sm mb-1">Conversion Rate</div>
            <div className="text-3xl font-bold">{overview.conversionRate.toFixed(1)}%</div>
          </div>
          <div className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="text-gray-500 text-sm mb-1">Avg Quote Value</div>
            <div className="text-3xl font-bold text-green-600">₹{Math.round(overview.avgQuoteValue).toLocaleString()}</div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 2. Wizard vs Builder */}
        <section>
          <h2 className="text-xl font-bold mb-4">Wizard vs Direct Builder</h2>
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 text-gray-500 text-sm">
                <tr>
                  <th className="p-4 font-medium">Metric</th>
                  <th className="p-4 font-medium text-right">Smart Wizard</th>
                  <th className="p-4 font-medium text-right">Direct Builder</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-4">Total Quotes</td>
                  <td className="p-4 text-right font-bold">{sources.wizard.total}</td>
                  <td className="p-4 text-right font-bold">{sources.builder.total}</td>
                </tr>
                <tr>
                  <td className="p-4">Accepted Quotes</td>
                  <td className="p-4 text-right text-green-600">{sources.wizard.accepted}</td>
                  <td className="p-4 text-right text-green-600">{sources.builder.accepted}</td>
                </tr>
                <tr>
                  <td className="p-4">Conversion Rate</td>
                  <td className="p-4 text-right">{sources.wizard.conversion.toFixed(1)}%</td>
                  <td className="p-4 text-right">{sources.builder.conversion.toFixed(1)}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 3. Product Intelligence */}
        <section>
          <h2 className="text-xl font-bold mb-4">Customer Intent</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <h3 className="font-bold text-gray-500 text-sm mb-3 uppercase tracking-wider">Installation Type</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>New</span>
                  <span className="font-bold">{intelligence.installationType.new}</span>
                </div>
                <div className="flex justify-between">
                  <span>Upgrade</span>
                  <span className="font-bold">{intelligence.installationType.upgrade}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <h3 className="font-bold text-gray-500 text-sm mb-3 uppercase tracking-wider">Plan Selected</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Lowest</span>
                  <span className="font-bold">{plans.budget}</span>
                </div>
                <div className="flex justify-between">
                  <span>Recommended</span>
                  <span className="font-bold text-blue-600">{plans.recommended}</span>
                </div>
                <div className="flex justify-between">
                  <span>Premium</span>
                  <span className="font-bold text-purple-600">{plans.premium}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 4. WhatsApp Deliverability */}
        <section>
          <h2 className="text-xl font-bold mb-4">WhatsApp Delivery</h2>
          <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-center">
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500">Sent (Pending)</span>
              <span className="font-bold">{whatsapp.sent}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500">Delivered</span>
              <span className="font-bold text-blue-600">{whatsapp.delivered}</span>
            </div>
            <div className="flex justify-between items-center mb-4">
              <span className="text-gray-500">Read</span>
              <span className="font-bold text-green-600">{whatsapp.read}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t border-gray-100">
              <span className="text-red-500">Failed</span>
              <span className="font-bold text-red-500">{whatsapp.failed}</span>
            </div>
          </div>
        </section>

        {/* 5. Resolution & Recording */}
        <section>
          <h2 className="text-xl font-bold mb-4">Feature Requests</h2>
          <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
            <div>
              <h3 className="text-sm text-gray-500 mb-2">Picture Quality / Resolution</h3>
              {Object.entries(intelligence.resolutions).map(([key, val]) => (
                <div key={key} className="flex justify-between text-sm mb-1">
                  <span>{key}</span>
                  <span className="font-medium">{val as number}</span>
                </div>
              ))}
            </div>
            <div>
              <h3 className="text-sm text-gray-500 mb-2">Recording Requirement</h3>
              {Object.entries(intelligence.recordings).map(([key, val]) => (
                <div key={key} className="flex justify-between text-sm mb-1">
                  <span>{key}</span>
                  <span className="font-medium">{val as number}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
      
    </div>
  );
}
