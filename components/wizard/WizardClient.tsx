"use client";

import { useEffect, useRef, useState } from "react";
import { useWizardStore } from "@/store/wizard";
import { ProgressBar } from "@/components/wizard/ProgressBar";
import { OptionCard } from "@/components/wizard/OptionCard";
import { LeadGate } from "@/components/wizard/LeadGate";
import { ArrowLeft, ArrowRight, ShieldAlert, Loader2, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";

export function WizardClient() {
  const { steps, is_loaded, current_step_index, answers, setSteps, setAnswer, nextStep, previousStep } = useWizardStore();
  const [loading, setLoading] = useState(!is_loaded);
  const [error, setError] = useState("");
  const [showGate, setShowGate] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  };

  // Fetch configuration on mount (if not already cached)
  useEffect(() => {
    async function loadWizard() {
      if (is_loaded && steps.length > 0) {
        setLoading(false);
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
  }, [is_loaded, steps.length, setSteps]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] bg-white">
        <div className="relative">
          <Loader2 className="w-16 h-16 animate-spin text-blue-600 mb-6 drop-shadow-[0_0_15px_rgba(37,99,235,0.4)]" />
          <div className="absolute inset-0 flex items-center justify-center">
             <ShieldCheck className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-black text-zinc-900 tracking-tighter mb-2">Preparing your plan...</h2>
        <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Just a few more seconds</p>
      </div>
    );
  }

  if (error || steps.length === 0) {
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

  const currentStep = steps[current_step_index];
  const isLastStep = current_step_index === steps.length - 1;

  // Handle Option Click
  const handleOptionSelect = (questionId: string, optionValue: string, isMulti: boolean) => {
    let newAnswers = { ...answers };
    
    if (isMulti) {
      const currentAns = (answers[questionId] as string[]) || [];
      if (currentAns.includes(optionValue)) {
        newAnswers[questionId] = currentAns.filter(v => v !== optionValue);
      } else {
        newAnswers[questionId] = [...currentAns, optionValue];
      }
      setAnswer(questionId, newAnswers[questionId] as string[]);
    } else {
      newAnswers[questionId] = optionValue;
      setAnswer(questionId, optionValue);
      
      // UX enhancement: Smart Auto-Navigate
      const qIndex = currentStep.questions?.findIndex(q => q.id === questionId) ?? -1;
      const isLastQuestionInStep = qIndex === (currentStep.questions?.length || 0) - 1;
      
      if (!isLastQuestionInStep) {
        // Scroll to the next question on the same page
        const nextQId = currentStep.questions![qIndex + 1].id;
        setTimeout(() => {
          document.getElementById(`question-${nextQId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      } else {
        // Last question in the step: verify all required are answered before auto-advancing to next step
        let isValid = true;
        currentStep.questions?.forEach((q) => {
          if (q.is_required) {
            const ans = newAnswers[q.id!];
            if (!ans || (Array.isArray(ans) && ans.length === 0)) {
              isValid = false;
            }
          }
        });

        if (isValid && !isLastStep) {
          setTimeout(() => {
            nextStep();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }, 400);
        }
      }
    }
  };

  // Validate step before advancing
  const handleContinue = () => {
    let isValid = true;
    currentStep.questions?.forEach((q) => {
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

    if (isLastStep) {
      setShowGate(true);
    } else {
      nextStep();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex-1 relative flex flex-col bg-white dark:bg-zinc-950 overflow-x-hidden transition-colors duration-500">
      
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-50/50 dark:bg-blue-600/5 blur-[120px] rounded-full -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-50/50 dark:bg-indigo-600/5 blur-[120px] rounded-full -z-10 pointer-events-none" />

      {/* Toast notification */}
      {toast && (
        <div className="toast toast-error" role="alert" aria-live="polite">
          {toast}
        </div>
      )}

      {/* Blurred overlay if Gate is active */}
      <div className={`flex-1 transition-all duration-700 flex flex-col max-w-4xl mx-auto w-full px-4 sm:px-6 pt-6 pb-32 sm:pt-12 ${showGate ? "blur-3xl scale-[0.95] opacity-0 select-none pointer-events-none" : "opacity-100"}`}>
        
        <ProgressBar currentStepIndex={current_step_index} totalSteps={steps.length} />

        <div className="mt-16 mb-12">
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-[0.4em] bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
              Question {current_step_index + 1} of {steps.length}
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter leading-tight mt-6 mb-2">{currentStep.title}</h1>
        {currentStep.description && (
          <p className="text-zinc-500 dark:text-zinc-400 text-xl mt-4 font-medium max-w-2xl">{currentStep.description}</p>
        )}

        <div key={current_step_index} className="space-y-16 wizard-step-enter mb-12">
          {currentStep.questions?.map((q) => {
            if (q.input_type === "number") {
              const currentVal = (answers[q.id!] as string) || "";
              return (
                <div key={q.id} id={`question-${q.id}`}>
                  <div className="flex items-center gap-3 mb-6">
                     <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs">#</div>
                     <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{q.question_text}</h3>
                  </div>
                  <div className="relative group max-w-sm">
                    <input 
                      type="number"
                      value={currentVal}
                      onChange={(e) => {
                        const val = Math.max(1, Math.min(16, parseInt(e.target.value) || 1));
                        setAnswer(q.id!, String(val));
                      }}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-[32px] px-10 py-6 text-2xl font-black text-zinc-900 dark:text-white outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner"
                      placeholder="1 – 16"
                      min={1}
                      max={16}
                    />
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-700 font-black uppercase text-xs tracking-widest">Cams</div>
                  </div>
                  <p className="text-xs font-bold text-zinc-400 dark:text-zinc-600 mt-3 ml-2">
                    For <span className="font-black text-zinc-700 dark:text-zinc-400">more than 16 cameras</span>, our team will reach out with a custom corporate quote.
                  </p>
                </div>
              );
            }

            const isMulti = q.input_type === "multi";
            const currentAns = answers[q.id!] || (isMulti ? [] : "");

            return (
              <div key={q.id} id={`question-${q.id}`}>
                <div className="flex items-center gap-3 mb-4">
                   <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs">?</div>
                   <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{q.question_text}</h3>
                </div>

                {/* Multi-select indicator badge */}
                {isMulti && (
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700/40 text-blue-700 dark:text-blue-400 px-4 py-2 rounded-full">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-[11px] font-black uppercase tracking-widest">Select all that apply</span>
                    </div>
                    {(currentAns as string[]).length > 0 && (
                      <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700/40 text-emerald-700 dark:text-emerald-400 px-3 py-2 rounded-full">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[11px] font-black uppercase tracking-widest">{(currentAns as string[]).length} Selected</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-0">
                  {q.options?.map((opt) => {
                    const isSelected = isMulti 
                      ? (currentAns as string[]).includes(opt.value) 
                      : currentAns === opt.value;
                    
                    return (
                      <OptionCard
                        key={opt.id}
                        label={opt.label}
                        isSelected={isSelected}
                        isMulti={isMulti}
                        onClick={() => handleOptionSelect(q.id!, opt.value, isMulti)}
                      />
                    );
                  })}
                </div>

                {/* Bottom hint for multi-select when nothing selected yet */}
                {isMulti && (currentAns as string[]).length === 0 && (
                  <p className="text-xs font-bold text-zinc-400 dark:text-zinc-500 mt-4 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    You can pick <span className="text-zinc-700 dark:text-zinc-300 font-black">more than one</span> option. Click Continue when done.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {showGate && <LeadGate isIndustrial={parseInt(answers["q_cam_count"] as string) > (settings?.max_supported_cameras || 16)} />}

      {/* Sticky Navigation Bar */}
      {!showGate && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 pb-5 pt-3 bg-gradient-to-t from-white/95 dark:from-zinc-950/95 to-transparent backdrop-blur-sm">
          <div className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-[0_-4px_40px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_40px_rgba(0,0,0,0.3)] rounded-3xl flex items-center justify-between p-3 md:p-4 ring-1 ring-zinc-900/5 dark:ring-white/5 transition-all">
            <button
              onClick={previousStep}
              disabled={current_step_index === 0}
              className="group h-12 md:h-14 px-6 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-black uppercase text-[10px] tracking-widest transition-colors flex items-center gap-2 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
            </button>

            <div className="hidden lg:flex items-center gap-6 px-8 border-x border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tight">Your Data is Safe</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-tight">Smart System Design</span>
              </div>
            </div>

            <button
              onClick={handleContinue}
              className="h-12 md:h-14 px-8 md:px-12 bg-zinc-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl shadow-zinc-900/20 dark:shadow-blue-500/30 transition-all flex items-center gap-3 active:scale-95 cursor-pointer"
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
