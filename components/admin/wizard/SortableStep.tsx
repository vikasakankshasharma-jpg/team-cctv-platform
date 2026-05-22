"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Settings2, Trash2, Plus } from "lucide-react";
import type { WizardStep, WizardQuestion } from "@/types";
import { SortableQuestion } from "./SortableQuestion";

interface SortableStepProps {
  step: WizardStep;
  index: number;
  onEdit: (step: WizardStep) => void;
  onDelete: (id: string, title: string) => void;
  onCreateQuestion: (stepId: string) => void;
  onEditQuestion: (stepId: string, q: WizardQuestion) => void;
  onDeleteQuestion: (stepId: string, qId: string, text: string) => void;
}

export function SortableStep({ 
  step, 
  index, 
  onEdit, 
  onDelete, 
  onCreateQuestion,
  onEditQuestion,
  onDeleteQuestion
}: SortableStepProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: step.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : "auto",
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="group/step bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-md dark:shadow-md transition-all hover:border-blue-500/20"
    >
      {/* Step Header */}
      <div className="bg-zinc-50 dark:bg-zinc-900 p-8 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div 
            {...attributes} 
            {...listeners} 
            className="cursor-grab active:cursor-grabbing p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
          >
            <GripVertical className="w-5 h-5 text-zinc-300 dark:text-zinc-700" />
          </div>
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-600 group-hover/step:text-blue-600 dark:group-hover/step:text-blue-500 transition-colors shadow-inner font-black text-sm">
              {index + 1}
            </div>
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
            onClick={() => onEdit(step)}
            className="p-3 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-white rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-all active:scale-90 shadow-sm"
           >
             <Settings2 className="w-5 h-5" />
           </button>
           <button 
            onClick={() => step.id && onDelete(step.id, step.title)}
            className="p-3 bg-white dark:bg-zinc-900 hover:bg-red-50 dark:hover:bg-red-500/10 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-all active:scale-90 shadow-sm"
           >
             <Trash2 className="w-5 h-5" />
           </button>
        </div>
      </div>

      {/* Questions Area */}
      <div className="p-8 space-y-10">
        {step.questions?.map((q) => (
          <SortableQuestion 
            key={q.id} 
            stepId={step.id!} 
            question={q} 
            onEdit={onEditQuestion}
            onDelete={onDeleteQuestion}
          />
        ))}
        
        <button 
          onClick={() => step.id && onCreateQuestion(step.id)}
          className="w-full py-8 border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 hover:text-zinc-950 dark:hover:text-white hover:border-zinc-400 dark:hover:border-zinc-600 rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-900 flex items-center justify-center gap-3 group/addq shadow-lg"
        >
          <Plus className="w-5 h-5 group-hover/addq:rotate-90 transition-all" />
          Orchestrate New Query
        </button>
      </div>
    </div>
  );
}
