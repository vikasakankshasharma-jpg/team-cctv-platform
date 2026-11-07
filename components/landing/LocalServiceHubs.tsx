"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MapPin, ArrowRight, ShieldCheck, CheckCircle2, Search } from "lucide-react";
import { cityDatabase } from "@/lib/city-data";

export function LocalServiceHubs() {
  const router = useRouter();
  const [pincode, setPincode] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const activeHubs = [
    {
      slug: "jaipur",
      name: "Jaipur",
      tagline: "Headquarters Hub",
      leadTime: "Same-Day / 24h Survey",
      areas: ["Vaishali Nagar", "Malviya Nagar", "Mansarovar", "Jagatpura", "C-Scheme", "Sitapura"]
    },
    {
      slug: "kota",
      name: "Kota",
      tagline: "Coaching & Industrial Hub",
      leadTime: "24h Doorstep Survey",
      areas: ["Talwandi", "Vigyan Nagar", "Indraprastha", "Kunadi", "Mahaveer Nagar"]
    },
    {
      slug: "jodhpur",
      name: "Jodhpur",
      tagline: "Sun City Hub",
      leadTime: "24h Doorstep Survey",
      areas: ["Sardarpura", "Shastri Nagar", "Basni", "Ratanada", "Pal Road"]
    },
    {
      slug: "ajmer",
      name: "Ajmer",
      tagline: "Central Hub",
      leadTime: "24h Doorstep Survey",
      areas: ["Vaishali Nagar", "Civil Lines", "Kishangarh", "Panchsheel", "Adarsh Nagar"]
    }
  ];

  const handlePincodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPincodeError("");

    const clean = pincode.trim().replace(/\D/g, "");
    if (clean.length !== 6) {
      setPincodeError("Please enter a valid 6-digit pincode.");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch(`/api/pincode/${clean}`);
      const data = await res.json();

      if (data && data.citySlug) {
        router.push(`/${data.citySlug}?pincode=${clean}&served=${data.served}`);
      } else {
        router.push(`/wizard?pincode=${clean}`);
      }
    } catch {
      router.push(`/wizard?pincode=${clean}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 bg-white dark:bg-[#050B14] transition-colors border-t border-slate-100 dark:border-zinc-800/80">
      <div className="max-w-7xl mx-auto">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-100 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>Local Presence • Verified Technicians</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            Doorstep CCTV Installation in Your City
          </h2>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-3 font-medium">
            Certified local engineers stationed across major hubs in Rajasthan. Free on-site survey & feasibility check within 24 hours.
          </p>
        </div>

        {/* 4 Active City Hubs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
          {activeHubs.map((hub) => (
            <Link
              key={hub.slug}
              href={`/${hub.slug}`}
              className="group p-6 rounded-3xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200/80 dark:border-white/5 hover:border-blue-500/50 hover:bg-white dark:hover:bg-zinc-900 transition-all duration-300 shadow-xs hover:shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                    {hub.tagline}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Active Hub
                  </span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {hub.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  {hub.leadTime}
                </p>

                {/* Popular Localities Chips */}
                <div className="mt-4 pt-4 border-t border-slate-200/60 dark:border-white/5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-2">
                    Key Service Areas:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {hub.areas.map((area, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-white dark:bg-zinc-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-zinc-700/60 font-medium"
                      >
                        {area}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 dark:border-white/5 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                <span>View {hub.name} Packages</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          ))}
        </div>

        {/* Pincode Quick-Check Bar */}
        <div className="max-w-2xl mx-auto p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-zinc-900/60 border border-slate-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Not in these cities?</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">Enter your 6-digit pincode to check doorstep technician availability.</p>
            </div>
          </div>

          <form onSubmit={handlePincodeSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <input
              type="text"
              value={pincode}
              onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="e.g. 302017"
              maxLength={6}
              className="w-full sm:w-32 px-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-slate-900 dark:text-white text-xs font-mono placeholder:text-slate-400 focus:outline-hidden focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={isVerifying}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold whitespace-nowrap transition-all shadow-xs disabled:opacity-50"
            >
              {isVerifying ? "Checking..." : "Check"}
            </button>
          </form>
        </div>
        {pincodeError && (
          <p className="text-xs text-red-500 text-center mt-2 font-medium">{pincodeError}</p>
        )}

      </div>
    </section>
  );
}