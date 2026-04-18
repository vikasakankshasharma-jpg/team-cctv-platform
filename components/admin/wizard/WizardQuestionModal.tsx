"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import type { WizardQuestion } from "@/types";

interface WizardQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stepId: string;
  question?: Partial<WizardQuestion> | null;
  onSave: (stepId: string, questionId: string | null, data: Partial<WizardQuestion>) => Promise<void>;
}

export function WizardQuestionModal({ isOpen, onClose, stepId, question, onSave }: WizardQuestionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    question_text: "",
    input_type: "single" as "single" | "multi",
    is_required: true,
    position: 0,
  });

  useEffect(() => {
    if (question && isOpen) {
      setFormData({
        question_text: question.question_text || "",
        input_type: question.input_type || "single",
        is_required: question.is_required ?? true,
        position: question.position ?? 0,
      });
    } else {
      setFormData({
        question_text: "",
        input_type: "single",
        is_required: true,
        position: 0,
      });
    }
  }, [question, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(stepId, question?.id || null, formData);
      onClose();
    } catch (error) {
      console.error("Failed to save question:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
            {question?.id ? "Edit Query" : "New Query"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Query Text <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={formData.question_text}
              onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold shadow-inner"
              placeholder="e.g. How many cameras do you need?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Interaction Logic
            </label>
            <select
              value={formData.input_type}
              onChange={(e) => setFormData({ ...formData, input_type: e.target.value as 'single' | 'multi' })}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold appearance-none cursor-pointer shadow-inner"
            >
              <option value="single">Exclusive Choice (Single)</option>
              <option value="multi">Collated Choice (Multiple)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Sequence Position
            </label>
            <input
              type="number"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: Number(e.target.value) })}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3.5 text-zinc-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-black shadow-inner"
            />
          </div>

          <div className="flex items-center gap-3 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-zinc-100 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-4 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                Mandatory Entry
              </span>
            </label>
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 text-[10px] font-black text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-white uppercase tracking-widest transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {question?.id ? "Synchronize Query" : "Append Query"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
