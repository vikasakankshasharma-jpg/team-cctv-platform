"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { MapPin, X, ChevronDown, CheckCircle2, AlertCircle, ArrowRight, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUiStore } from "@/lib/ui-store";

type City = { name: string; slug: string; served: boolean };
type State = { name: string; slug: string; children: City[] };

export function ServiceAreaModal() {
  const { isServiceAreaModalOpen, closeServiceAreaModal, openServiceAreaModal } = useUiStore();
  const [locations, setLocations] = useState<State[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedState, setSelectedState] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  const [pincode, setPincode] = useState("");
  const [pincodeError, setPincodeError] = useState("");
  const [isVerifyingPincode, setIsVerifyingPincode] = useState(false);
  const [mode, setMode] = useState<"pincode" | "manual">("pincode");

  const router = useRouter();

  // Load locations when modal opens
  useEffect(() => {
    if (isServiceAreaModalOpen && locations.length === 0) {
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
  }, [isServiceAreaModalOpen, locations.length]);

  const stateData = locations.find((s) => s.name === selectedState);
  const cityData = stateData?.children?.find((c) => c.name === selectedCity);

  const handleContinue = () => {
    if (cityData?.slug) {
      closeServiceAreaModal();
      router.push(`/${cityData.slug}`); // e.g. /jaipur, /abu
    } else if (selectedCity) {
      closeServiceAreaModal();
      router.push(`/wizard?city=${encodeURIComponent(selectedCity)}${pincode ? `&pincode=${pincode}` : ''}`);
    }
  };

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(val);
    if (val.length === 6) {
      verifyPincode(val);
    }
  };

  const verifyPincode = async (code: string) => {
    setIsVerifyingPincode(true);
    setPincodeError("");
    
    try {
      const { verifyPincodeAction } = await import("@/app/actions/pincode");
      const result = await verifyPincodeAction(code);

      if (result.success) {
        const state = result.state!;
        const district = result.district!;
        
        setSelectedState(state);
        setSelectedCity(district);
        
        const foundState = locations.find(s => s.name.toLowerCase() === state.toLowerCase());
        const foundCity = foundState?.children?.find(c => c.name.toLowerCase() === district.toLowerCase() || c.slug === district.toLowerCase());
        
        closeServiceAreaModal();
        if (foundCity?.slug) {
          router.push(`/${foundCity.slug}`);
        } else {
          router.push(`/wizard?city=${encodeURIComponent(district)}&pincode=${code}`);
        }
      } else {
        setPincodeError("Invalid Pincode or service unavailable. Please try 'Select City'.");
      }
    } catch (err) {
      console.error("Pincode verification failed:", err);
      setPincodeError("An error occurred. Please try 'Select City'.");
    } finally {
      setIsVerifyingPincode(false);
    }
  };

  return (
    <>
      <button 
        onClick={openServiceAreaModal}
        className="flex items-center gap-1 sm:gap-1.5 px-2 py-1.5 sm:px-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100/50 dark:border-zinc-800/50 text-[10px] font-black uppercase tracking-widest text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-sm cursor-pointer shrink-0"
      >
        <MapPin className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
        <span className="hidden min-[400px]:inline">Service Areas</span>
      </button>

      {isServiceAreaModalOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-zinc-950/60 backdrop-blur-sm transition-opacity"
            onClick={closeServiceAreaModal}
          />
          
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[32px] p-8 shadow-2xl border border-zinc-100 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-6 shrink-0">
              <div>
                <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
                  Where do you need installation?
                </h3>
                <p className="text-xs text-zinc-500 font-medium mt-1">Enter your Pincode or select City.</p>
              </div>
              <button 
                onClick={closeServiceAreaModal}
                className="p-2 rounded-full hover:bg-zinc-100 dark:bg-zinc-800 text-zinc-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-400 space-y-4 shrink-0">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-xs font-bold uppercase tracking-widest">Loading...</p>
              </div>
            ) : (
              <div className="flex flex-col flex-1 min-h-0 space-y-6">
                
                {/* Mode Toggle */}
                <div className="relative z-[120] flex bg-zinc-100 dark:bg-zinc-950 p-1 rounded-xl shrink-0">
                  <button 
                    onClick={() => { setMode("pincode"); setIsDropdownOpen(false); }}
                    className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${mode === "pincode" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                  >
                    Use Pincode
                  </button>
                  <button 
                    onClick={() => setMode("manual")}
                    className={`flex-1 text-xs font-bold py-2 rounded-lg transition-all ${mode === "manual" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"}`}
                  >
                    Select City
                  </button>
                </div>

                {/* Scrollable Form Content */}
                <div className="flex-1 overflow-y-auto pr-1 -mr-1 custom-scrollbar py-1 space-y-6">
                  {mode === "pincode" && (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="space-y-1.5 relative">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Pincode</label>
                        <div className="relative">
                          <input 
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={pincode}
                            onChange={handlePincodeChange}
                            placeholder="e.g. 302001"
                            className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3.5 text-lg font-bold text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-zinc-300"
                          />
                          {isVerifyingPincode && (
                            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-blue-500" />
                          )}
                          {pincode.length === 6 && !isVerifyingPincode && !pincodeError && (
                            <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-500" />
                          )}
                        </div>
                        {pincodeError && (
                          <p className="text-xs text-red-500 font-bold mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {pincodeError}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {mode === "manual" && (
                    <div className="space-y-5 animate-in fade-in pb-2">
                      {/* State Selector */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">State</label>
                        <div className="relative">
                          <select 
                            value={selectedState}
                            onChange={(e) => {
                              setSelectedState(e.target.value);
                              setSelectedCity("");
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
                              placeholder="Type to search your city..."
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
                              <div className="relative mt-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden z-[120] max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
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
                        <div className="space-y-3 mt-6">
                          <button
                            onClick={handleContinue}
                            className="w-full py-3.5 rounded-xl text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg bg-blue-600 hover:bg-blue-500 shadow-blue-600/20"
                          >
                            Get Quotation Now
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      
                      <div className="mt-4 pb-2">
                        <button
                          onClick={() => {
                            setMode("pincode");
                            setSelectedState("");
                            setSelectedCity("");
                          }}
                          className="w-full py-3 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                        >
                          Use Pincode Instead
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
