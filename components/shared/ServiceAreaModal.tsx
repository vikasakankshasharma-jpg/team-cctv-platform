"use client";

import { useState, useEffect } from "react";
import { MapPin, X, ChevronDown, CheckCircle2, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

type City = { name: string; slug: string; served: boolean };
type State = { name: string; slug: string; children: City[] };

export function ServiceAreaModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [locations, setLocations] = useState<State[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const router = useRouter();

  // Load locations when modal opens
  useEffect(() => {
    if (isOpen && locations.length === 0) {
      setIsLoading(true);
      fetch("/data/india-locations.json")
        .then(res => res.json())
        .then(data => {
          setLocations(data);
          // Default to Rajasthan to save a click since it's the home state
          setSelectedState("Rajasthan");
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [isOpen, locations.length]);

  const stateData = locations.find((s) => s.name === selectedState);
  const cityData = stateData?.children?.find((c) => c.name === selectedCity);

  const handleContinue = () => {
    if (cityData?.served && cityData?.slug) {
      setIsOpen(false);
      router.push(`/${cityData.slug}`); // e.g. /jaipur
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
          
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[32px] p-8 shadow-2xl border border-zinc-100 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Start Your Setup
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-1">Select your location in India.</p>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-full hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400 space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-xs font-bold uppercase tracking-widest">Loading Locations...</p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* State Selector */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">State</label>
                  <div className="relative">
                    <select 
                      value={selectedState}
                      onChange={(e) => {
                        setSelectedState(e.target.value);
                        setSelectedCity(""); // Reset city when state changes
                        setSearchQuery("");
                      }}
                      className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                    >
                      <option value="" disabled>Select your state...</option>
                      {locations.map(s => (
                        <option key={s.name} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
                  </div>
                </div>

                {/* City Selector */}
                {selectedState && stateData && (
                  <div className="space-y-1.5 animate-in slide-in-from-top-2 fade-in duration-300 relative">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">City / Town</label>
                    <div className="relative">
                      <input 
                        type="text"
                        value={isDropdownOpen ? searchQuery : selectedCity || ""}
                        placeholder="Search your city..."
                        onFocus={() => {
                          setIsDropdownOpen(true);
                          setSearchQuery("");
                        }}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-400 placeholder:font-medium"
                      />
                      <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                    </div>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-[110]" 
                          onClick={() => setIsDropdownOpen(false)}
                        />
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden z-[120] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
                          {stateData.children?.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                            <div className="px-4 py-3 text-sm text-zinc-500 text-center font-medium">No cities found.</div>
                          ) : (
                            stateData.children?.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())).map(c => (
                              <button
                                key={c.name}
                                onClick={() => {
                                  setSelectedCity(c.name);
                                  setIsDropdownOpen(false);
                                  setSearchQuery("");
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm font-bold text-zinc-700 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                {c.name}
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Action Button */}
                {selectedCity && (
                  <button
                    onClick={handleContinue}
                    className="w-full py-3.5 rounded-xl text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg bg-blue-600 hover:bg-blue-500 shadow-blue-600/20 mt-6"
                  >
                    Get Quotation Now
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
