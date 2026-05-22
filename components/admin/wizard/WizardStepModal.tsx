"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import type { WizardStep } from "@/types";

interface WizardStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  step?: Partial<WizardStep> | null;
  onSave: (id: string | null, data: Partial<WizardStep>) => Promise<void>;
}

export function WizardStepModal({ isOpen, onClose, step, onSave }: WizardStepModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    position: 0,
    is_active: true,
  });

  useEffect(() => {
    if (step && isOpen) {
      setFormData({
        title: step.title || "",
        description: step.description || "",
        position: step.position ?? 0,
        is_active: step.is_active ?? true,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        position: 0,
        is_active: true,
      });
    }
  }, [step, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(step?.id || null, formData);
      onClose();
    } catch (error) {
      console.error("Failed to save step:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black dark:bg-black animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-md overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
            {step?.id ? "Edit Step" : "New Step"}
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
              Step Title <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3.5 text-zinc-900 dark:text-white placeholder-zinc-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold shadow-inner"
              placeholder="e.g. Property Type"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3.5 text-zinc-900 dark:text-white placeholder-zinc-300 dark:placeholder-zinc-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-medium shadow-inner"
              rows={3}
              placeholder="Explain what this stage is about..."
            />
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
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-12 h-6 bg-zinc-100 dark:bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              <span className="ml-4 text-xs font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                Node Activation
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
              {step?.id ? "Sync Changes" : "Create Node"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
