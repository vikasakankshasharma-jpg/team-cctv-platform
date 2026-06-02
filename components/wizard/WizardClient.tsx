"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useWizardStore } from "@/store/wizard";
import { ProgressBar } from "@/components/wizard/ProgressBar";
import { OptionCard } from "@/components/wizard/OptionCard";
import { LeadGate } from "@/components/wizard/LeadGate";
import { ArrowLeft, ArrowRight, ShieldAlert, Loader2, ShieldCheck, Lock, CheckCircle2, Home } from "lucide-react";
import { trackEvent } from "@/components/shared/TrackingProvider";
import type { WizardQuestion, WizardOption } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export function WizardClient({ initialSteps, initialSettings }: { initialSteps?: any[], initialSettings?: any }) {
  const router = useRouter();
  const { steps, is_loaded, current_step_index, answers, products, setSteps, setProducts, setAnswer, nextStep, previousStep } = useWizardStore();
  const isFirstStep = current_step_index === 0;

  // Always start loading=true so we never render the error state before the
  // Zustand store has been hydrated from initialSteps (render-order race fix).
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showGate, setShowGate] = useState(false);
  const [settings, setSettings] = useState<any>(initialSettings || null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  // Initialize from SSR props — runs after first paint, sets store then clears loading
  useEffect(() => {
    if (is_loaded) {
      // Already hydrated from sessionStorage (returning visitor mid-wizard)
      setLoading(false);
    } else if (initialSteps && initialSteps.length > 0) {
      // Fresh visit: load the server-rendered steps into the store
      setSteps(initialSteps);
      setLoading(false);
    }
    // If neither, the fallback fetch effect below will handle it
  }, [is_loaded, initialSteps, setSteps]);

  // Fallback to fetch if props aren't available (e.g. client-side navigation)
  useEffect(() => {
    async function loadWizard() {
      if (is_loaded || (initialSteps && initialSteps.length > 0)) {
        return;
      }
      try {
        const [wizRes, setRes] = await Promise.all([
          fetch("/api/wizard"),
          fetch("/api/settings")
        ]);
        const wizData = await wizRes.json();
        const setData = await setRes.json();
        
        if (wizData.steps) setSteps(wizData.steps);
        if (setData) setSettings(setData);
      } catch (err) {
        console.error("Failed to fetch wizard config", err);
        setError("Unable to load the setup options. Please refresh.");
      } finally {
        setLoading(false);
      }
    }
    loadWizard();
  }, [is_loaded, initialSteps, setSteps]);

  // Fetch products for live filtering
  useEffect(() => {
    async function loadProducts() {
      if (products.length > 0) return;
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (data.products) setProducts(data.products);
      } catch (err) {
        console.error("Failed to fetch products for live counting", err);
      }
    }
    loadProducts();
  }, [products, setProducts]);

  // Debounce patching the partial lead
  useEffect(() => {
    const state = useWizardStore.getState();
    if (!state.partial_lead_id || current_step_index <= 1) return;

    const timer = setTimeout(() => {
      fetch(`/api/leads/${state.partial_lead_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wizard_answers: answers
        })
      }).catch(console.error);
    }, 1000);

    return () => clearTimeout(timer);
  }, [answers, current_step_index]);

  // Use store steps if loaded, otherwise fall back to SSR initialSteps while the
  // store hydrates — prevents the error flash before the useEffect runs.
  let effectiveSteps = steps.length > 0 ? steps : (initialSteps || []);

  // Filter steps and questions dynamically
  effectiveSteps = effectiveSteps.map(step => {
    let filteredQuestions = step.questions || [];

    // Hide "q_wiring_type" if cabling is already done
    if (step.id === "step_wiring" && answers["q_wiring"] === "true") {
      filteredQuestions = filteredQuestions.filter((q: any) => q.id !== "q_wiring_type");
    }

    return {
      ...step,
      questions: filteredQuestions
    };
  }).filter(s => {
    // Forcefully remove step_features as it's redundant
    if (s.id === "step_features") return false;
    // Filter out Wiring step if technology is Wireless
    if (s.id === "step_wiring" && answers["q_tech"] === "Wireless") return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] bg-white dark:bg-zinc-950">
        <div className="relative">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-6 drop-shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
          <div className="absolute inset-0 flex items-center justify-center">
             <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2">Preparing your plan...</h2>
        <p className="text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Just a few more seconds</p>
      </div>
    );
  }

  if (error || effectiveSteps.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-6 text-center bg-white dark:bg-zinc-950">
        <div className="p-5 bg-red-50 dark:bg-red-900/20 rounded-3xl mb-6">
          <ShieldAlert className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tighter mb-2">Something went wrong</h2>
        <p className="text-zinc-500 dark:text-zinc-400 font-medium max-w-xs text-sm">
          {error || "Could not load the configuration. Please check your internet and try again."}
        </p>
        <button onClick={() => window.location.reload()} className="mt-8 w-full max-w-xs py-4 bg-zinc-900 dark:bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-600 dark:hover:bg-blue-500 transition-colors">
          Try Again
        </button>
      </div>
    );
  }

  const safe_step_index = Math.min(current_step_index, effectiveSteps.length - 1);
  const currentStep = effectiveSteps[safe_step_index] || effectiveSteps[0];
  const isLastStep = safe_step_index === effectiveSteps.length - 1;

  // Handle Option Click
  const handleOptionSelect = (questionId: string, optionValue: string, isMulti: boolean) => {
    const newAnswers = { ...answers };
    
    if (isMulti) {
      let currentAns = (answers[questionId] as string[]) || [];
      
      if (optionValue === "none") {
        // If clicking "none", it replaces everything else. Or toggles off if already selected.
        if (currentAns.includes("none")) {
          newAnswers[questionId] = [];
        } else {
          newAnswers[questionId] = ["none"];
        }
      } else {
        // If clicking a normal option, make sure "none" is removed
        if (currentAns.includes(optionValue)) {
          newAnswers[questionId] = currentAns.filter(v => v !== optionValue);
        } else {
          newAnswers[questionId] = [...currentAns.filter(v => v !== "none"), optionValue];
        }
      }
      setAnswer(questionId, newAnswers[questionId] as string[]);
    } else {
      newAnswers[questionId] = optionValue;
      setAnswer(questionId, optionValue);
      
      // UX enhancement: Smart Auto-Navigate
      
      // Compute what the questions will look like AFTER this answer
      let futureQuestions = currentStep.questions || [];
      if (currentStep.id === "step_wiring" && newAnswers["q_wiring"] === "true") {
        futureQuestions = futureQuestions.filter((q: any) => q.id !== "q_wiring_type");
      }

      const qIndex = futureQuestions.findIndex((q: WizardQuestion) => q.id === questionId);
      const isLastQuestionInStep = qIndex === futureQuestions.length - 1;
      
      if (!isLastQuestionInStep && qIndex !== -1) {
        // Scroll to the next question on the same page
        const nextQId = futureQuestions[qIndex + 1].id;
        setTimeout(() => {
          document.getElementById(`question-${nextQId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      } else if (isLastQuestionInStep) {
        // Last question in the step: verify all required are answered before auto-advancing to next step
        let isValid = true;
        futureQuestions.forEach((q: WizardQuestion) => {
          if (q.is_required) {
            const ans = newAnswers[q.id!];
            if (!ans || (Array.isArray(ans) && ans.length === 0)) {
              isValid = false;
            }
          }
        });

        if (isValid && !isLastStep) {
          setTimeout(() => {
            trackEvent("wizard_step_complete", {
              step_index: safe_step_index,
              step_title: currentStep.title,
            });
            nextStep();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 400);
        }
      }
    }
  };


  const completePartialLead = async (leadId: string, finalAnswers: any) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wizard_answers: finalAnswers,
          status: "completed",
          property_type: finalAnswers["q_prop_type"] || "home",
          technology_choice: finalAnswers["q_tech"] || "HD",
          cabling_done: finalAnswers["q_wiring"] === "true",
          camera_count: parseInt(finalAnswers["q_cam_count"] || "0")
        })
      });
      if (!res.ok) throw new Error("Failed to complete quote");
      router.push(`/quote/${leadId}`);
    } catch (err) {
      showToast("Error generating quote. Please try again.");
      setLoading(false);
    }
  };

  // Validate step before advancing
  const handleContinue = () => {
    let isValid = true;
    currentStep.questions?.forEach((q: WizardQuestion) => {
      if (q.is_required) {
        const ans = answers[q.id!];
        if (!ans || (Array.isArray(ans) && ans.length === 0)) {
          isValid = false;
        }
      }
    });

    if (!isValid) {
      showToast("Please select an option to continue.");
      return;
    }

    const state = useWizardStore.getState();
    if (isLastStep) {
      if (state.partial_lead_id) {
        completePartialLead(state.partial_lead_id, state.answers);
      } else {
        setShowGate(true);
      }
    } else {
      trackEvent("wizard_step_complete", {
        step_index: safe_step_index,
        step_title: currentStep.title,
      });
      nextStep();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // FACETED COUNTING ENGINE
  const getProspectiveCount = (questionId: string, optionValue: string, isMulti: boolean) => {
    // Only show prospective counts for questions that actually filter the camera catalog
    const filterableQuestions = ["q_tech", "q_resolution", "q_brand", "q_special_features"];
    if (!filterableQuestions.includes(questionId)) return null;

    if (!products || products.length === 0) return null; // Loading or failed

    // 1. Create a hypothetical answer state
    const hypotheticalAnswers = { ...answers };
    if (isMulti) {
      const currentAns = (answers[questionId] as string[]) || [];
      if (currentAns.includes(optionValue)) {
        hypotheticalAnswers[questionId] = currentAns.filter(v => v !== optionValue);
      } else {
        hypotheticalAnswers[questionId] = [...currentAns, optionValue];
      }
    } else {
      hypotheticalAnswers[questionId] = optionValue;
    }

    // 2. Filter products based on hypothetical answers
    let pool = products.filter(p => p.category === "camera" && p.is_active);

    // Apply Technology Filter
    if (hypotheticalAnswers["q_tech"]) {
       const tech = hypotheticalAnswers["q_tech"] as string;
       if (tech) {
         pool = pool.filter(p => p.technologies?.some(t => t.toLowerCase() === tech.toLowerCase()));
       }
    }

    // Apply Resolution Filter
    if (hypotheticalAnswers["q_resolution"]) {
       const resVal = hypotheticalAnswers["q_resolution"] as string;
       const resNum = parseInt(resVal.replace("mp", ""));
       if (!isNaN(resNum)) {
         pool = pool.filter(p => p.resolution_mp === resNum);
       }
    }

    // Apply Night Vision Filter
    if (hypotheticalAnswers["q_night_vision"]) {
       const nv = hypotheticalAnswers["q_night_vision"] as string;
       if (nv === "color") {
         pool = pool.filter(p => p.night_vision_type === "color" || p.night_vision_type === "dual_light" || (p.features && p.features.some(f => f.toLowerCase().includes("color"))));
       } else if (nv === "ir") {
         pool = pool.filter(p => p.night_vision_type === "ir" || !p.night_vision_type);
       }
    }
    
    // Apply Brand Filter
    if (hypotheticalAnswers["q_brand"]) {
       const brand = hypotheticalAnswers["q_brand"] as string;
       if (brand && brand !== "recommend") {
         pool = pool.filter(p => p.brand?.toLowerCase() === brand.toLowerCase());
       }
    }

    // Apply Features/Priorities Filter (Wizard uses q_special_features now)
    if (hypotheticalAnswers["q_special_features"]) {
       const reqFeats = hypotheticalAnswers["q_special_features"] as string[];
       // If they picked 'none', we don't filter out cameras
       if (reqFeats.length > 0 && !reqFeats.includes("none")) {
          pool = pool.filter(cam => {
            const feats = (cam.features || []).map(f => f.toLowerCase().trim());
            let matchesAll = true;
            if (reqFeats.includes("color") && !feats.some(f => f.includes("color") || f.includes("night"))) matchesAll = false;
            if (reqFeats.includes("audio") && !feats.some(f => f.includes("mic") || f.includes("audio") || f.includes("speaker") || f.includes("talk"))) matchesAll = false;
            if (reqFeats.includes("ptz") && !feats.some(f => f.includes("ptz") || f.includes("pan") || f.includes("tilt") || f.includes("360"))) matchesAll = false;
            return matchesAll;
          });
       }
    }

    return pool.length;
  };

  return (
    <div className="flex-1 relative flex flex-col bg-[#FAFAFA] overflow-x-hidden transition-colors duration-500">
      
      {/* Background Decor (Light Mode Apple Style) */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] opacity-[0.02] [background-size:24px_24px] pointer-events-none -z-10" />

      {/* Toast notification */}
      {toast && (
        <div className="toast toast-error" role="alert" aria-live="polite">
          {toast}
        </div>
      )}

      {/* Blurred overlay if Gate is active */}
      <div className={`flex-1 transition-all duration-700 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6 pb-48 sm:pb-56 sm:pt-12 ${showGate ? "blur-3xl scale-[0.95] opacity-0 select-none pointer-events-none" : "opacity-100"}`}>
        
        <ProgressBar currentStepIndex={current_step_index} totalSteps={effectiveSteps.length} />

        <div className="mt-6 sm:mt-16 mb-6 sm:mb-12">
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.4em] bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
              Question {current_step_index + 1} of {effectiveSteps.length}
          </span>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter leading-tight mt-4 sm:mt-6 mb-2">{currentStep.title}</h1>
        {currentStep.description && (
          <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-xl mt-3 sm:mt-4 font-medium max-w-2xl">{currentStep.description}</p>
        )}

        <AnimatePresence mode="wait">
          <motion.div 
            key={current_step_index} 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-16 mb-12"
          >
            {currentStep.questions?.map((q: WizardQuestion) => {
            if (q.input_type === "number") {
              const buckets = (answers["mixed_camera_requirements"] as any[]) || [{ type: "Standard Indoor", count: 1, features: [] }];
              
              const updateBucket = (index: number, field: string, value: any) => {
                const newBuckets = [...buckets];
                newBuckets[index] = { ...newBuckets[index], [field]: value };
                setAnswer("mixed_camera_requirements", newBuckets);
                setAnswer(q.id!, String(newBuckets.reduce((sum, b) => sum + (parseInt(b.count) || 0), 0)));
              };

              const addBucket = () => {
                const newBuckets = [...buckets, { type: "Standard Outdoor", count: 1, features: [] }];
                setAnswer("mixed_camera_requirements", newBuckets);
                setAnswer(q.id!, String(newBuckets.reduce((sum, b) => sum + (parseInt(b.count) || 0), 0)));
              };

              const removeBucket = (index: number) => {
                const newBuckets = buckets.filter((_, i) => i !== index);
                setAnswer("mixed_camera_requirements", newBuckets);
                setAnswer(q.id!, String(newBuckets.reduce((sum, b) => sum + (parseInt(b.count) || 0), 0)));
              };
              
              const toggleFeature = (bucketIndex: number, feature: string) => {
                const bucket = buckets[bucketIndex];
                const features = bucket.features || [];
                const newFeatures = features.includes(feature) ? features.filter((f: string) => f !== feature) : [...features, feature];
                updateBucket(bucketIndex, "features", newFeatures);
              };

              const tech = answers["q_tech"] as string;
              const allFeatures = [
                { id: "color", label: "Color Night Vision", techs: ["HD", "IP", "Wireless"] },
                { id: "audio", label: "Speaker / Two-Way Talk", techs: ["HD", "IP", "Wireless"] },
                { id: "ptz", label: "PTZ (Pan-Tilt-Zoom)", techs: ["IP", "Wireless"] },
                { id: "solar", label: "Solar Powered", techs: ["Wireless"] },
                { id: "4g", label: "4G / SIM Support", techs: ["Wireless"] }
              ];
              const availableFeatures = tech ? allFeatures.filter(f => f.techs.includes(tech)) : allFeatures;

              return (
                <div key={q.id} id={`question-${q.id}`} className="scroll-mt-24 sm:scroll-mt-32">
                  <div className="flex items-center gap-3 mb-6 sm:mb-8">
                     <div className="w-10 h-10 rounded-[14px] bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-blue-600 font-black text-sm shrink-0">#</div>
                     <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">{q.question_text}</h2>
                  </div>

                  <div className="flex flex-col gap-6">
                    {buckets.map((bucket, idx) => (
                      <div key={idx} className="bg-white border-[2px] border-zinc-200 rounded-[24px] p-5 sm:p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] relative group">
                        {buckets.length > 1 && (
                          <button onClick={() => removeBucket(idx)} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                          </button>
                        )}
                        <div className="flex flex-col sm:flex-row gap-4 mb-5">
                          <div className="flex-1">
                            <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2">Environment</label>
                            <select
                              value={bucket.type}
                              onChange={(e) => updateBucket(idx, "type", e.target.value)}
                              className="w-full bg-zinc-50 border-[2px] border-zinc-200 rounded-[16px] px-4 py-3.5 text-[15px] font-bold text-zinc-900 outline-none focus:border-blue-500 focus:bg-white transition-colors cursor-pointer appearance-none"
                            >
                              <option value="Standard Indoor">Indoor Area</option>
                              <option value="Standard Outdoor">Outdoor Area</option>
                            </select>
                          </div>
                          <div className="w-full sm:w-32">
                            <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-2">Quantity</label>
                            <input
                              type="number"
                              min={1}
                              max={16}
                              value={bucket.count}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateBucket(idx, "count", val === "" ? "" : parseInt(val) || "");
                              }}
                              className="w-full bg-zinc-50 border-[2px] border-zinc-200 rounded-[16px] px-4 py-3.5 text-[15px] font-black text-zinc-900 outline-none focus:border-blue-500 focus:bg-white text-center transition-colors"
                            />
                          </div>
                        </div>

                        {availableFeatures.length > 0 && (
                          <div>
                            <label className="block text-[11px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                              <svg className="w-3.5 h-3.5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                              Special Features <span className="font-medium text-zinc-400">(Optional)</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {availableFeatures.map(feat => {
                                const isSelected = (bucket.features || []).includes(feat.id);
                                return (
                                  <button
                                    key={feat.id}
                                    onClick={() => toggleFeature(idx, feat.id)}
                                    className={`px-3 sm:px-4 py-2 rounded-full text-[13px] font-bold transition-all border ${
                                      isSelected 
                                        ? "bg-blue-50 border-blue-600 text-blue-700 shadow-[0_2px_10px_-4px_rgba(37,99,235,0.4)]" 
                                        : "bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50"
                                    }`}
                                  >
                                    {feat.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex justify-start">
                    <button
                      onClick={addBucket}
                      className="flex items-center gap-2 text-[13px] font-black text-zinc-700 hover:text-blue-700 transition-colors uppercase tracking-widest bg-white border-[2px] border-dashed border-zinc-300 hover:border-blue-500 px-6 py-4 rounded-[20px]"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      Add Another Camera Group
                    </button>
                  </div>
                  
                  <p className="text-xs font-bold text-zinc-500 mt-8 ml-2">
                    For <span className="font-black text-zinc-700">more than 16 cameras total</span>, our team will reach out with a custom corporate quote.
                  </p>
                </div>
              );
            }

            const isMulti = q.input_type === "multi";
            const currentAns = answers[q.id!] || (isMulti ? [] : "");

            return (
              <div key={q.id} id={`question-${q.id}`} className="scroll-mt-24 sm:scroll-mt-32">
                <div className="flex items-center gap-3 mb-6 sm:mb-8">
                   <div className="w-10 h-10 rounded-[14px] bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-blue-600 font-black text-sm shrink-0">?</div>
                   <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">{q.question_text}</h2>
                </div>

                {/* Multi-select indicator badge */}
                {isMulti && (
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex items-center gap-2 bg-white border border-blue-200 text-blue-700 px-4 py-2.5 rounded-xl shadow-sm">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-[11px] font-black uppercase tracking-widest">Select all that apply</span>
                    </div>
                    {(currentAns as string[]).length > 0 && (
                      <div className="flex items-center gap-1.5 bg-emerald-500 text-white px-3 py-2.5 rounded-xl shadow-sm shadow-emerald-500/20">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[11px] font-black uppercase tracking-widest">{(currentAns as string[]).length} Selected</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Hint ABOVE options — visible on mobile before scrolling */}
                {isMulti && (
                  <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400 mb-5 flex items-center gap-2">
                    <svg className="w-4 h-4 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    You can pick <span className="text-zinc-800 dark:text-zinc-200 font-black">more than one</span> option. Click Continue when done.
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-0">
                  {q.options?.map((opt: WizardOption) => {
                    const isSelected = isMulti 
                      ? (currentAns as string[]).includes(opt.value) 
                      : currentAns === opt.value;
                    
                    const prospectiveCount = getProspectiveCount(q.id!, opt.value, isMulti);

                    return (
                      <OptionCard
                        key={opt.id}
                        label={opt.label}
                        isSelected={isSelected}
                        isMulti={isMulti}
                        onClick={() => handleOptionSelect(q.id!, opt.value, isMulti)}
                        prospectiveCount={prospectiveCount}
                        isDisabled={prospectiveCount === 0}
                      />
                    );
                  })}
                </div>

              </div>
            );
          })}
          </motion.div>
        </AnimatePresence>
      </div>

      {showGate && (
        <LeadGate 
          isIndustrial={parseInt(answers["q_cam_count"] as string) > (settings?.max_supported_cameras || 16)} 
          mode={isLastStep ? "final" : "partial"}
          onSuccess={(leadId) => {
            setShowGate(false);
            if (!isLastStep) {
              nextStep();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        />
      )}

      {/* Sticky Navigation Bar */}
      {!showGate && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-5 pt-3 bg-gradient-to-t from-[#FAFAFA] to-transparent backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white border border-zinc-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] rounded-[28px] flex items-center justify-between p-3 md:p-4 transition-all" style={{paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))'}} >
            <button
              onClick={isFirstStep ? () => router.push('/') : previousStep}
              className="group h-12 md:h-14 px-8 md:px-6 text-zinc-500 hover:text-zinc-900 font-black uppercase text-[10px] tracking-widest transition-colors flex items-center gap-2 cursor-pointer touch-manipulation"
              aria-label={isFirstStep ? "Back to homepage" : "Previous question"}
            >
              {isFirstStep
                ? <><Home className="w-4 h-4 group-hover:scale-110 transition-transform" /> Home</>
                : <><ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back</>}
            </button>

            <div className="hidden lg:flex items-center gap-6 px-8 border-x border-zinc-100">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-zinc-300" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Your Data is Safe</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Smart System Design</span>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="h-12 md:h-14 px-8 md:px-12 bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/40 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-[18px] shadow-[0_8px_20px_-8px_rgba(37,99,235,0.5)] transition-all flex items-center gap-3 active:scale-95 cursor-pointer touch-manipulation"
            >
              {isLastStep ? "Generate Quote" : "Continue"}
              {isLastStep ? <ShieldCheck className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 translate-y-[1px]" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
