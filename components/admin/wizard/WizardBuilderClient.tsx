"use client";

import { useState } from "react";
import { Workflow, Plus, GripVertical, Settings2, Trash2, ChevronRight, CornerDownRight } from "lucide-react";
import type { WizardStep, WizardQuestion, WizardOption } from "@/types";
import { WizardStepModal } from "./WizardStepModal";
import { WizardQuestionModal } from "./WizardQuestionModal";
import { WizardOptionModal } from "./WizardOptionModal";
import { 
  upsertStep, deleteStep, 
  upsertQuestion, deleteQuestion, 
  upsertOption, deleteOption 
} from "@/app/actions/wizard";
import { PageHeader } from "@/components/admin/PageHeader";

interface WizardBuilderClientProps {
  initialSteps: WizardStep[];
}

export function WizardBuilderClient({ initialSteps }: WizardBuilderClientProps) {
  // Modal states
  const [activeStep, setActiveStep] = useState<Partial<WizardStep> | null>(null);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);

  const [activeQuestion, setActiveQuestion] = useState<{ stepId: string; question?: Partial<WizardQuestion> } | null>(null);
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);

  const [activeOption, setActiveOption] = useState<{ stepId: string; questionId: string; option?: Partial<WizardOption> } | null>(null);
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);

  // Step Handlers
  const handleEditStep = (step: WizardStep) => {
    setActiveStep(step);
    setIsStepModalOpen(true);
  };

  const handleCreateStep = () => {
    setActiveStep(null);
    setIsStepModalOpen(true);
  };

  const onSaveStep = async (id: string | null, data: Partial<WizardStep>) => {
    await upsertStep(id, data);
  };

  const handleDeleteStep = async (id: string, title: string) => {
    if (confirm(`Delete step "${title}" and all its questions?`)) {
      await deleteStep(id);
    }
  };

  // Question Handlers
  const handleEditQuestion = (stepId: string, question: WizardQuestion) => {
    setActiveQuestion({ stepId, question });
    setIsQuestionModalOpen(true);
  };

  const handleCreateQuestion = (stepId: string) => {
    setActiveQuestion({ stepId });
    setIsQuestionModalOpen(true);
  };

  const onSaveQuestion = async (stepId: string, questionId: string | null, data: Partial<WizardQuestion>) => {
    await upsertQuestion(stepId, questionId, data);
  };

  const handleDeleteQuestion = async (stepId: string, questionId: string, text: string) => {
    if (confirm(`Delete question "${text}"?`)) {
      await deleteQuestion(stepId, questionId);
    }
  };

  // Option Handlers
  const handleEditOption = (stepId: string, questionId: string, option: WizardOption) => {
    setActiveOption({ stepId, questionId, option });
    setIsOptionModalOpen(true);
  };

  const handleCreateOption = (stepId: string, questionId: string) => {
    setActiveOption({ stepId, questionId });
    setIsOptionModalOpen(true);
  };

  const onSaveOption = async (stepId: string, questionId: string, optionId: string | null, data: Partial<WizardOption>) => {
    await upsertOption(stepId, questionId, optionId, data);
  };

  const handleDeleteOption = async (stepId: string, questionId: string, optionId: string, label: string) => {
    if (confirm(`Delete option "${label}"?`)) {
      await deleteOption(stepId, questionId, optionId);
    }
  };

  return (
    <>
      <PageHeader
        icon={Workflow}
        title="Intelligent Wizard Orchestrator"
        description="Design and sequence the customer decision nodes that power the Catalyst quotation engine."
        action={
          <button
            onClick={handleCreateStep}
            className="group relative flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-[20px] font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            Initialize Step
          </button>
        }
      />

      <div className="space-y-12 max-w-5xl pb-32">
        {initialSteps.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800/60 rounded-[40px] p-20 text-center backdrop-blur-sm shadow-xl dark:shadow-2xl">
            <div className="w-20 h-20 rounded-[32px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mx-auto mb-8 shadow-inner">
              <Workflow className="w-10 h-10 text-zinc-300 dark:text-zinc-700" />
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3">No Nodes Orchestrated</h2>
            <p className="text-zinc-400 dark:text-zinc-500 mb-10 max-w-sm mx-auto font-bold text-sm">
              The customer wizard is currently dormant. Initialize your first node to begin mapping the decision tree.
            </p>
            <button 
              onClick={handleCreateStep}
              className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-[20px] font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20 active:scale-95"
            >
              Initialize Node Alpha
            </button>
          </div>
        ) : (
          initialSteps.map((step, sIdx) => (
            <div key={step.id} className="group/step bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800/60 rounded-[40px] overflow-hidden shadow-xl dark:shadow-2xl backdrop-blur-md transition-all hover:border-blue-500/20">
              {/* Step Header */}
              <div className="bg-zinc-50 dark:bg-zinc-950/40 p-8 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-600 group-hover/step:text-blue-600 dark:group-hover/step:text-blue-500 transition-colors shadow-inner font-black text-sm">
                      {sIdx + 1}
                    </div>
                    <div className="w-px h-8 bg-gradient-to-b from-zinc-200 dark:from-zinc-800 to-transparent mt-2" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase tracking-widest">Decision Node</span>
                      {!step.is_active && <span className="text-[9px] font-black bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 px-2 py-0.5 rounded-full uppercase tracking-widest border border-zinc-200 dark:border-zinc-700">Deactivated</span>}
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{step.title}</h2>
                    <p className="text-zinc-400 dark:text-zinc-500 text-xs font-bold mt-1 tracking-tight">{step.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <button 
                    onClick={() => handleEditStep(step)}
                    className="p-3 bg-white dark:bg-zinc-900/80 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-white rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-all active:scale-90 shadow-sm"
                   >
                     <Settings2 className="w-5 h-5" />
                   </button>
                   <button 
                    onClick={() => step.id && handleDeleteStep(step.id, step.title)}
                    className="p-3 bg-white dark:bg-zinc-900/80 hover:bg-red-50 dark:hover:bg-red-500/10 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-all active:scale-90 shadow-sm"
                   >
                     <Trash2 className="w-5 h-5" />
                   </button>
                </div>
              </div>

              {/* Questions Area */}
              <div className="p-8 space-y-10">
                {step.questions?.map((q, qIdx) => (
                  <div key={q.id} className="relative pl-10 border-l-2 border-zinc-100 dark:border-zinc-800/60 group/q">
                    <div className="absolute -left-[13px] top-1 w-6 h-6 bg-white dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600 text-[10px] font-black rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800 group-hover/q:text-blue-600 dark:group-hover/q:text-blue-500 group-hover/q:border-blue-500/30 transition-all shadow-sm">
                      Q
                    </div>
                    
                    <div className="flex items-start justify-between mb-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-4">
                          <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
                            {q.question_text}
                          </h3>
                          <div className="flex items-center gap-2 opacity-0 group-hover/q:opacity-100 transition-all">
                             <button 
                              onClick={() => step.id && handleEditQuestion(step.id, q)}
                              className="p-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all border border-zinc-100 dark:border-zinc-800 shadow-sm"
                             >
                               <Settings2 className="w-4 h-4" />
                             </button>
                             <button 
                              onClick={() => step.id && q.id && handleDeleteQuestion(step.id, q.id, q.question_text)}
                              className="p-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all border border-zinc-100 dark:border-zinc-800 shadow-sm"
                             >
                               <Trash2 className="w-4 h-4" />
                             </button>
                          </div>
                        </div>
                        <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 mt-2 flex items-center gap-3 uppercase tracking-widest">
                          <span className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-100 dark:border-zinc-800/40 shadow-inner">
                             {q.input_type === 'single' ? "Exclusive Choice" : "Collated Choice"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                      {q.options?.map(opt => (
                        <div key={opt.id} className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800/60 rounded-3xl p-5 relative group/opt hover:border-blue-500/30 transition-all shadow-inner">
                          <p className="text-[10px] font-black text-zinc-300 dark:text-zinc-600 uppercase tracking-widest mb-2 opacity-50">Response Option</p>
                          <div className="font-black text-zinc-900 dark:text-white pr-8 text-sm">{opt.label}</div>
                          <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 font-mono mt-1 opacity-60">ID: {opt.value}</div>
                          
                          {opt.pricing_tags && opt.pricing_tags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {opt.pricing_tags.map(tag => (
                                <span key={tag} className="text-[8px] font-black bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-500/10 uppercase tracking-tighter cursor-default hover:bg-blue-500 hover:text-white transition-all">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}
                          
                          <div className="absolute top-4 right-4 opacity-0 group-hover/opt:opacity-100 transition-all flex items-center gap-1">
                             <button 
                              onClick={() => step.id && q.id && handleEditOption(step.id, q.id, opt)}
                              className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl transition-all shadow-sm"
                             >
                               <Settings2 className="w-3.5 h-3.5" />
                             </button>
                             <button 
                              onClick={() => step.id && q.id && opt.id && handleDeleteOption(step.id, q.id, opt.id, opt.label)}
                              className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 rounded-xl transition-all shadow-sm"
                             >
                               <Trash2 className="w-3.5 h-3.5" />
                             </button>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => step.id && q.id && handleCreateOption(step.id, q.id)}
                        className="group/addopt border-2 border-dashed border-zinc-200 dark:border-zinc-800/40 hover:border-blue-500/50 rounded-3xl p-5 flex items-center justify-center flex-col gap-2 transition-all bg-zinc-50 dark:bg-zinc-950/20 hover:bg-blue-50 dark:hover:bg-blue-500/5"
                      >
                        <Plus className="w-6 h-6 text-zinc-300 dark:text-zinc-600 group-hover/addopt:text-blue-600 dark:group-hover/addopt:text-blue-500 group-hover/addopt:rotate-90 transition-all" />
                        <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest group-hover/addopt:text-blue-600 dark:group-hover/addopt:text-blue-500">Append Choice</span>
                      </button>
                    </div>
                  </div>
                ))}
                
                <button 
                  onClick={() => step.id && handleCreateQuestion(step.id)}
                  className="w-full py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800/60 text-zinc-400 dark:text-zinc-600 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600 rounded-[32px] text-xs font-black uppercase tracking-[0.2em] transition-all bg-zinc-50 dark:bg-zinc-950/20 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 flex items-center justify-center gap-3 group/addq shadow-lg"
                >
                  <Plus className="w-5 h-5 group-hover/addq:rotate-90 transition-all" />
                  Orchestrate New Query
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modals */}
      <WizardStepModal 
        isOpen={isStepModalOpen}
        onClose={() => setIsStepModalOpen(false)}
        step={activeStep}
        onSave={onSaveStep}
      />

      {activeQuestion && (
        <WizardQuestionModal 
          isOpen={isQuestionModalOpen}
          onClose={() => setIsQuestionModalOpen(false)}
          stepId={activeQuestion.stepId}
          question={activeQuestion.question}
          onSave={onSaveQuestion}
        />
      )}

      {activeOption && (
        <WizardOptionModal 
          isOpen={isOptionModalOpen}
          onClose={() => setIsOptionModalOpen(false)}
          stepId={activeOption.stepId}
          questionId={activeOption.questionId}
          option={activeOption.option}
          onSave={onSaveOption}
        />
      )}
    </>
  );
}
