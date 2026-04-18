"use client";

import { useEffect, useState } from "react";
import { useWizardStore } from "@/store/wizard";
import { ProgressBar } from "@/components/wizard/ProgressBar";
import { OptionCard } from "@/components/wizard/OptionCard";
import { LeadGate } from "@/components/wizard/LeadGate";
import { ArrowLeft, ArrowRight, ShieldAlert, Loader2, ShieldCheck, Lock, CheckCircle2 } from "lucide-react";

export default function WizardPage() {
  const { steps, is_loaded, current_step_index, answers, setSteps, setAnswer, nextStep, previousStep } = useWizardStore();
  const [loading, setLoading] = useState(!is_loaded);
  const [error, setError] = useState("");
  const [showGate, setShowGate] = useState(false);

  // Fetch configuration on mount (if not already cached)
  useEffect(() => {
    async function loadWizard() {
      if (is_loaded && steps.length > 0) {
        setLoading(false);
        return;
      }
      try {
        const res = await fetch("/api/wizard");
        const data = await res.json();
        if (data.steps) {
          setSteps(data.steps);
        }
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
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] px-4 text-center bg-white">
        <div className="p-4 bg-red-50 rounded-3xl mb-6">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>
        <h2 className="text-3xl font-black text-zinc-900 tracking-tighter mb-2 italic underline decoration-red-500 underline-offset-8">Critical Alert</h2>
        <p className="text-zinc-500 font-medium max-w-sm">{error || "The configuration engine is currently unresponsive. Please check your connection."}</p>
        <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-zinc-900 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-zinc-800 transition-colors">
          Retry Connection
        </button>
      </div>
    );
  }

  const currentStep = steps[current_step_index];
  const isLastStep = current_step_index === steps.length - 1;

  // Handle Option Click
  const handleOptionSelect = (questionId: string, optionValue: string, isMulti: boolean) => {
    if (isMulti) {
      const currentAns = (answers[questionId] as string[]) || [];
      if (currentAns.includes(optionValue)) {
        setAnswer(questionId, currentAns.filter(v => v !== optionValue));
      } else {
        setAnswer(questionId, [...currentAns, optionValue]);
      }
    } else {
      setAnswer(questionId, optionValue);
      // UX enhancement: auto-advance on single-select if it's the only question in step
      if (currentStep.questions?.length === 1 && !isLastStep) {
        setTimeout(nextStep, 400);
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
      alert("Selection Required: Please address all fields to provide an accurate quote.");
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

      {/* Blurred overlay if Gate is active */}
      <div className={`flex-1 transition-all duration-700 flex flex-col max-w-4xl mx-auto w-full px-6 pt-12 pb-8 md:pt-16 ${showGate ? "blur-3xl scale-[0.95] opacity-0 select-none pointer-events-none" : "opacity-100"}`}>
        
        <ProgressBar currentStepIndex={current_step_index} totalSteps={steps.length} />

        <div className="mt-16 mb-12">
              Question {current_step_index + 1} of {steps.length}
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">{currentStep.title}</h1>
          {currentStep.description && (
            <p className="text-zinc-500 dark:text-zinc-400 text-xl mt-4 font-medium max-w-2xl">{currentStep.description}</p>
          )}

        <div className="flex-1 space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {currentStep.questions?.map((q) => {
            const isMulti = q.input_type === "multi";
            const currentAns = answers[q.id!] || (isMulti ? [] : "");

            return (
              <div key={q.id}>
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-xs">?</div>
                   <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{q.question_text}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 px-1">
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
              </div>
            );
          })}
        </div>
      </div>

      {/* Inline Navigation Bar — sits just below the options */}
      {!showGate && (
        <div className="max-w-4xl mx-auto w-full px-6 pb-16">
          <div className="w-full bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border border-zinc-100 dark:border-zinc-800 shadow-[0_8px_30px_rgba(0,0,0,0.08)] rounded-3xl flex items-center justify-between p-3 md:p-4 ring-1 ring-zinc-900/5 dark:ring-white/5 transition-all">
            <button
              onClick={previousStep}
              disabled={current_step_index === 0}
              className="group h-12 md:h-14 px-6 text-zinc-500 hover:text-zinc-900 dark:hover:text-white font-black uppercase text-[10px] tracking-widest transition-colors flex items-center gap-2 disabled:opacity-0 disabled:pointer-events-none"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back
            </button>

            {/* Trust Banner (Hidden on Mobile) */}
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
              className="h-12 md:h-14 px-8 md:px-12 bg-zinc-900 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500 text-white font-black uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl shadow-zinc-900/20 dark:shadow-blue-500/30 transition-all flex items-center gap-3 active:scale-95"
            >
              {isLastStep ? "Generate Quote" : "Continue"}
              {isLastStep ? <ShieldCheck className="w-4 h-4" /> : <ArrowRight className="w-4 h-4 translate-y-[1px]" />}
            </button>
          </div>
        </div>
      )}

      {showGate && <LeadGate />}
      
    </div>
  );
}
