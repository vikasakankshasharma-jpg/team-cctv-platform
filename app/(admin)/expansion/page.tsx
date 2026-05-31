"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase-client";
import { Loader2, TrendingUp, Eye, FileText, CheckCircle2 } from "lucide-react";

type ServiceArea = {
  id: string;
  city: string;
  state: string;
  waitlist_count: number;
  confirmed_count: number;
  priority_score: number;
};

type CityImpression = {
  id: string;
  city: string;
  state: string;
  total_lookups: number;
};

export default function ExpansionDashboard() {
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [impressions, setImpressions] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 1. Listen to service_areas
    const q = query(collection(db, "service_areas"), orderBy("priority_score", "desc"));
    const unsubAreas = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceArea[];
      setAreas(data);
    });

    // 2. Listen to city_impressions to get the "Looks"
    const unsubImpressions = onSnapshot(collection(db, "city_impressions"), (snapshot) => {
      const lookupMap: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        lookupMap[doc.id] = doc.data().total_lookups || 0;
      });
      setImpressions(lookupMap);
      setIsLoading(false);
    });

    return () => {
      unsubAreas();
      unsubImpressions();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-blue-500" />
            Expansion Intelligence
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl">
            Real-time City Demand Ranking. The Priority Score intelligently combines total impressions (20%), 
            uncaptured leads (50%), and confirmed waitlist requests (30%) to highlight where to expand next.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">City</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">State</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-500" />
                    Looks
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-orange-500" />
                    Leads
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Confirmed
                  </div>
                </th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Priority Score</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {areas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500 text-sm font-medium">
                    No expansion data available yet.
                  </td>
                </tr>
              ) : (
                areas.map((area, index) => {
                  const looks = impressions[area.id] || 0;
                  
                  return (
                    <tr key={area.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-zinc-400 w-4">{index + 1}.</span>
                          <span className="font-bold text-zinc-900 dark:text-white">{area.city || area.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                        {area.state || "Unknown"}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-white">
                        {looks}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-white">
                        {area.waitlist_count || 0}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-zinc-900 dark:text-white">
                        {area.confirmed_count || 0}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 font-black text-sm">
                          {area.priority_score?.toFixed(1) || "0.0"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="px-4 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform shadow-lg">
                          Appoint Installer
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">
            Formula: (Looks × 0.2) + (Leads × 0.5) + (Confirmed × 0.8)
          </p>
        </div>
      </div>
    </div>
  );
}
