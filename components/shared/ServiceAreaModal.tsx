"use client";

import { useState } from "react";
import { MapPin, X, ChevronDown, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { RAJASTHAN_LOCATIONS } from "@/lib/locations";

export function ServiceAreaModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedState, setSelectedState] = useState("Rajasthan");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const router = useRouter();

  const districtData = RAJASTHAN_LOCATIONS.find((d) => d.name === selectedDistrict);
  const cityData = districtData?.children?.find((c) => c.name === selectedCity);

  const handleContinue = () => {
    if (cityData?.served && cityData?.slug) {
      setIsOpen(false);
      router.push(`/${cityData.slug}`);
    } else {
      setIsOpen(false);
      router.push(`/wizard?city=${encodeURIComponent(selectedCity)}`);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100/50 dark:border-zinc-800/50 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm cursor-pointer"
      >
        <MapPin className="w-3.5 h-3.5" />
        <span>Service Areas</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[32px] p-8 shadow-2xl border border-zinc-100 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Check Availability
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-1">Select your location to verify service coverage.</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              {/* State Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">State</label>
                <div className="relative">
                  <select 
                    disabled
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-zinc-300 appearance-none opacity-70"
                  >
                    <option>Rajasthan</option>
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* District Selector */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">District</label>
                <div className="relative">
                  <select 
                    value={selectedDistrict}
                    onChange={(e) => {
                      setSelectedDistrict(e.target.value);
                      setSelectedCity(""); // Reset city when district changes
                    }}
                    className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="" disabled>Select your district...</option>
                    {RAJASTHAN_LOCATIONS.map(d => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              {/* City Selector */}
              {selectedDistrict && districtData && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 fade-in duration-300">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">City / Town</label>
                  <div className="relative">
                    <select 
                      value={selectedCity}
                      onChange={(e) => setSelectedCity(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="" disabled>Select your city...</option>
                      {districtData.children?.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>
              )}

              {/* Status Feedback */}
              {selectedCity && cityData && (
                <div className={`p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in zoom-in-95 duration-300 ${
                  cityData.served 
                    ? "bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20" 
                    : "bg-amber-50/50 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20"
                }`}>
                  {cityData.served ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className={`font-bold text-sm ${cityData.served ? "text-emerald-900 dark:text-emerald-400" : "text-amber-900 dark:text-amber-400"}`}>
                      {cityData.served ? "Great news! We serve your area." : "We're expanding to your area soon!"}
                    </p>
                    <p className={`text-xs mt-1 ${cityData.served ? "text-emerald-700 dark:text-emerald-500/80" : "text-amber-700 dark:text-amber-500/80"}`}>
                      {cityData.served 
                        ? "Proceed to get your instant quotation and book a site visit." 
                        : "Join our priority waitlist to get notified and receive an exclusive early-bird discount when we launch."}
                    </p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              {selectedCity && cityData && (
                <button
                  onClick={handleContinue}
                  className={`w-full py-3.5 rounded-xl text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
                    cityData.served 
                      ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20" 
                      : "bg-zinc-900 hover:bg-zinc-800 dark:bg-blue-600 dark:hover:bg-blue-500 shadow-blue-600/20"
                  }`}
                >
                  {cityData.served ? "Get Quotation Now" : "Join Waitlist"}
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
