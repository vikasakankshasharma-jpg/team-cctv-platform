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
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden relative shadow-xl animate-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          
          {/* Header */}
          <div className="px-6 py-5 border-b border-border flex items-center justify-between bg-secondary/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground tracking-tight">
                  {initialData ? "Refine Rule" : "Forge New Rule"}
                </h3>
                <p className="text-[11px] font-medium text-muted-foreground mt-0.5">Logic Tier Configuration</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-8 custom-scrollbar">
            
            {/* Basic Config */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Execution Priority</label>
                <input 
                  type="number"
                  required
                  value={formData.priority}
                  onChange={e => setFormData(p => ({ ...p, priority: parseInt(e.target.value) }))}
                  className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  placeholder="e.g. 10"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Status</label>
                <div className="flex items-center gap-3 bg-background border border-border rounded-xl px-4 py-2.5 h-[42px]">
                  <input 
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={e => setFormData(p => ({ ...p, is_active: e.target.checked }))}
                    className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-foreground">Active Rule</span>
                </div>
              </div>
            </div>

            {/* Conditions Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <h4 className="text-[12px] font-semibold text-foreground tracking-wider uppercase">Activation Conditions</h4>
              </div>
              
              <div className="space-y-3">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Property Types</label>
                <div className="flex flex-wrap gap-2">
                  {["home", "office", "warehouse", "bungalow"].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => togglePropertyType(type)}
                      className={`px-4 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider border transition-all ${
                        formData.conditions?.property_types?.includes(type)
                          ? "bg-primary border-primary text-primary-foreground shadow-sm"
                          : "bg-background border-border text-muted-foreground hover:bg-secondary"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Technology</label>
                  <select 
                    value={formData.conditions?.technology || ""}
                    onChange={e => setFormData(p => ({ ...p, conditions: { ...p.conditions!, technology: (e.target.value as any) || undefined } }))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                  >
                    <option value="">Any Technology</option>
                    <option value="IP">IP Only</option>
                    <option value="HD">HD Only</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Camera Range</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number"
                      placeholder="Min"
                      value={formData.conditions?.camera_count_min || ""}
                      onChange={e => setFormData(p => ({ ...p, conditions: { ...p.conditions!, camera_count_min: parseInt(e.target.value) || 0 } }))}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <span className="text-muted-foreground font-medium">-</span>
                    <input 
                      type="number"
                      placeholder="Max"
                      value={formData.conditions?.camera_count_max || ""}
                      onChange={e => setFormData(p => ({ ...p, conditions: { ...p.conditions!, camera_count_max: parseInt(e.target.value) || 0 } }))}
                      className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendation Output Section */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-success" />
                <h4 className="text-[12px] font-semibold text-foreground tracking-wider uppercase">Recommended Output</h4>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Camera Option (1-5)</label>
                  <select 
                    value={formData.recommendation?.camera_option}
                    onChange={e => setFormData(p => ({ ...p, recommendation: { ...p.recommendation!, camera_option: parseInt(e.target.value) } }))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                  >
                    {[1, 2, 3, 4, 5].map(opt => <option key={opt} value={opt}>Option {opt}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Recommendation Tag</label>
                  <input 
                    type="text"
                    required
                    value={formData.recommendation?.label}
                    onChange={e => setFormData(p => ({ ...p, recommendation: { ...p.recommendation!, label: e.target.value } }))}
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="e.g. Best for Homes"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-1">Reasoning (Visible to User)</label>
                <textarea 
                  required
                  rows={3}
                  value={formData.recommendation?.reason}
                  onChange={e => setFormData(p => ({ ...p, recommendation: { ...p.recommendation!, reason: e.target.value } }))}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none"
                  placeholder="Explain why this setup is recommended..."
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-secondary/30 border-t border-border flex justify-end gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              Discard
            </button>
            <button 
              type="submit"
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-xl font-semibold text-xs transition-all shadow-sm active:scale-95"
            >
              <Save className="w-4 h-4" /> Save Logic Rule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
