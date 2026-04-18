"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Plus, Trash2 } from "lucide-react";
import type { WizardOption } from "@/types";

interface WizardOptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  stepId: string;
  questionId: string;
  option?: Partial<WizardOption> | null;
  onSave: (stepId: string, questionId: string, optionId: string | null, data: Partial<WizardOption>) => Promise<void>;
}

export function WizardOptionModal({ isOpen, onClose, stepId, questionId, option, onSave }: WizardOptionModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    label: "",
    value: "",
    position: 0,
    pricing_tags: [] as string[],
  });
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (option && isOpen) {
      setFormData({
        label: option.label || "",
        value: option.value || "",
        position: option.position ?? 0,
        pricing_tags: option.pricing_tags || [],
      });
    } else {
      setFormData({
        label: "",
        value: "",
        position: 0,
        pricing_tags: [],
      });
    }
  }, [option, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave(stepId, questionId, option?.id || null, formData);
      onClose();
    } catch (error) {
      console.error("Failed to save option:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (newTag && !formData.pricing_tags.includes(newTag)) {
      setFormData({ ...formData, pricing_tags: [...formData.pricing_tags, newTag] });
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, pricing_tags: formData.pricing_tags.filter((t) => t !== tag) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50">
          <h2 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">
            {option?.id ? "Edit Option" : "New Option"}
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
              Option Label <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-bold shadow-inner"
              placeholder="e.g. Residential Villa"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Internal Value Identifier
            </label>
            <input
              required
              type="text"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono text-sm shadow-inner"
              placeholder="e.g. villa"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-400 uppercase tracking-[0.2em] ml-1">
              Pricing Engine Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {formData.pricing_tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-2 py-1 rounded-md text-xs font-bold border border-blue-500/20">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                placeholder="Add tag (e.g. high_quality)..."
              />
              <button
                type="button"
                onClick={addTag}
                className="bg-zinc-800 hover:bg-zinc-700 text-white p-1.5 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {option?.id ? "Save Changes" : "Create Option"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
