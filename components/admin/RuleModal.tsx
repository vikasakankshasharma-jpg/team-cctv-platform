"use client";

import { useState, useEffect } from "react";
import { X, Save, Shield } from "lucide-react";
import type { RecommendationRule } from "@/types";

interface RuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: RecommendationRule) => void;
  initialData: RecommendationRule | null;
}

export function RuleModal({ isOpen, onClose, onSave, initialData }: RuleModalProps) {
  const [formData, setFormData] = useState<Partial<RecommendationRule>>(initialData || {
    priority: 10,
    is_active: true,
    conditions: {
      property_types: [],
      technology: "IP",
      camera_count_min: 1,
      camera_count_max: 16
    },
    recommendation: {
      camera_option: 4,
      label: "",
      reason: "",
      is_featured: true
    }
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData as RecommendationRule);
  };

  const togglePropertyType = (type: string) => {
    const current = formData.conditions?.property_types || [];
    const next = current.includes(type) 
      ? current.filter(t => t !== type) 
      : [...current, type];
    setFormData(prev => ({
      ...prev,
      conditions: { ...prev.conditions!, property_types: next }
    }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-hidden relative shadow-2xl animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          
          {/* Header */}
          <div className="px-8 py-6 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                  {initialData ? "Refine Rule" : "Forge New Rule"}
                </h3>
                <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Logic Tier Configuration</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
              <X className="w-5 h-5 text-zinc-400" />
            </button>
          </div>

          {/* Body */}
          <div className="p-8 overflow-y-auto space-y-8">
            
            {/* Basic Config */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Execution Priority</label>
                <input 
                  type="number"
                  required
                  value={formData.priority}
                  onChange={e => setFormData(p => ({ ...p, priority: parseInt(e.target.value) }))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  placeholder="e.g. 10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Status</label>
                <div className="flex items-center gap-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3 h-[46px]">
                  <input 
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-600"
                  />
                  <span className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-widest">Active Rule</span>
                </div>
              </div>
            </div>

            {/* Conditions Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <h4 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.15em]">Activation Conditions</h4>
              </div>
              
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Property Types</label>
                <div className="flex flex-wrap gap-2">
                  {["home", "office", "factory"].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => togglePropertyType(type)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                        formData.conditions?.property_types?.includes(type)
                          ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-600/20"
                          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-400"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Technology</label>
                  <select 
                    value={formData.conditions?.technology || ""}
                    onChange={e => setFormData(p => ({ ...p, conditions: { ...p.conditions!, technology: (e.target.value as any) || undefined } }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  >
                    <option value="">Any Technology</option>
                    <option value="IP">IP Only</option>
                    <option value="HD">HD Only</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Camera Range</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      placeholder="Min"
                      value={formData.conditions?.camera_count_min || ""}
                      onChange={e => setFormData(p => ({ ...p, conditions: { ...p.conditions!, camera_count_min: parseInt(e.target.value) || 0 } }))}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs font-bold outline-none"
                    />
                    <span className="text-zinc-400 font-bold">-</span>
                    <input 
                      type="number"
                      placeholder="Max"
                      value={formData.conditions?.camera_count_max || ""}
                      onChange={e => setFormData(p => ({ ...p, conditions: { ...p.conditions!, camera_count_max: parseInt(e.target.value) || 0 } }))}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-4 py-3 text-xs font-bold outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation Output Section */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <h4 className="text-[11px] font-black text-zinc-900 dark:text-white uppercase tracking-[0.15em]">Recommended Output</h4>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Camera Option (1-5)</label>
                  <select 
                    value={formData.recommendation?.camera_option}
                    onChange={e => setFormData(p => ({ ...p, recommendation: { ...p.recommendation!, camera_option: parseInt(e.target.value) } }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  >
                    {[1, 2, 3, 4, 5].map(opt => <option key={opt} value={opt}>Option {opt}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Recommendation Tag</label>
                  <input 
                    type="text"
                    required
                    value={formData.recommendation?.label}
                    onChange={e => setFormData(p => ({ ...p, recommendation: { ...p.recommendation!, label: e.target.value } }))}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3 text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    placeholder="e.g. Best for Homes"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-1">Reasoning (Visible to User)</label>
                <textarea 
                  required
                  rows={3}
                  value={formData.recommendation?.reason}
                  onChange={e => setFormData(p => ({ ...p, recommendation: { ...p.recommendation!, reason: e.target.value } }))}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                  placeholder="Explain why this setup is recommended..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            >
              Discard
            </button>
            <button 
              type="submit"
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              <Save className="w-4 h-4" /> Save Logic Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
