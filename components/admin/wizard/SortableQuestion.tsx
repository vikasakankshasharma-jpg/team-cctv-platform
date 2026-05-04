"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Settings2, Trash2 } from "lucide-react";
import type { WizardQuestion } from "@/types";

interface SortableQuestionProps {
  stepId: string;
  question: WizardQuestion;
  onEdit: (stepId: string, q: WizardQuestion) => void;
  onDelete: (stepId: string, qId: string, text: string) => void;
}

export function SortableQuestion({ 
  stepId, 
  question, 
  onEdit, 
  onDelete 
}: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: question.id! });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style}
      className="relative pl-10 border-l-2 border-zinc-100 dark:border-zinc-800/60 group/q"
    >
      <div 
        {...attributes} 
        {...listeners}
        className="absolute -left-[13px] top-1 w-6 h-6 bg-white dark:bg-zinc-950 text-zinc-400 dark:text-zinc-600 text-[10px] font-black rounded-lg flex items-center justify-center border border-zinc-200 dark:border-zinc-800 group-hover/q:text-blue-600 dark:group-hover/q:text-blue-500 group-hover/q:border-blue-500/30 transition-all shadow-sm cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-3 h-3" />
      </div>
      
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight leading-none">
              {question.question_text}
            </h3>
            <div className="flex items-center gap-2 opacity-0 group-hover/q:opacity-100 transition-all">
               <button 
                onClick={() => onEdit(stepId, question)}
                className="p-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 hover:text-blue-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-all border border-zinc-100 dark:border-zinc-800 shadow-sm"
               >
                 <Settings2 className="w-4 h-4" />
               </button>
               <button 
                onClick={() => question.id && onDelete(stepId, question.id, question.question_text)}
                className="p-1.5 bg-zinc-50 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all border border-zinc-100 dark:border-zinc-800 shadow-sm"
               >
                 <Trash2 className="w-4 h-4" />
               </button>
            </div>
          </div>
          <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 mt-2 flex items-center gap-3 uppercase tracking-widest">
            <span className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-100 dark:border-zinc-800/40 shadow-inner">
               {question.input_type === 'single' ? "Exclusive Choice" : question.input_type === 'multi' ? "Collated Choice" : "Numeric Input"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {question.options?.map(opt => (
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
          </div>
        ))}
      </div>
    </div>
  );
}
