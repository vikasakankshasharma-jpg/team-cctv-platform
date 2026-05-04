"use client";

import { useState } from "react";
import { Plus, Pencil, Trash, GripVertical, Check, X, FlaskConical, Zap } from "lucide-react";
import type { RecommendationRule, ConfiguratorSelection } from "@/types";
import { toast } from "sonner";
import { RuleModal } from "./RuleModal";
import { getRecommendedOption } from "@/lib/recommendation-engine";

interface RulesClientProps {
  initialRules: RecommendationRule[];
}

export default function RulesClient({ initialRules }: RulesClientProps) {
  const [rules, setRules] = useState<RecommendationRule[]>(initialRules);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RecommendationRule | null>(null);

  // ─── Test Rule State ──────────────────────────────────────────────────
  const [testMode, setTestMode] = useState(false);
  const [testParams, setTestParams] = useState({
    property_type: "home",
    technology: "IP" as const,
    camera_count: 4,
    recording_days: 15
  });

  const testResult = testMode ? getRecommendedOption(
    rules, 
    { 
      technology: testParams.technology, 
      camera_count: testParams.camera_count, 
      recording_days: testParams.recording_days,
      plan_type: "recommended",
      picture_quality: "good",
      selected_addons: []
    },
    testParams.property_type
  ) : null;

  // ─── Handlers ─────────────────────────────────────────────────────────

  const handleCreate = () => {
    setEditingRule(null);
    setIsModalOpen(true);
  };

  const handleEdit = (rule: RecommendationRule) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      try {
        const res = await fetch(`/api/admin/recommendation-rules/${id}`, { method: "DELETE" });
        if (res.ok) {
          setRules(prev => prev.filter(r => r.id !== id));
          toast.success("Rule deleted successfully");
        }
      } catch (err) {
        toast.error("Failed to delete rule");
      }
    }
  };

  const handleSave = async (rule: RecommendationRule) => {
    try {
      const method = rule.id ? "PUT" : "POST";
      const url = "/api/admin/recommendation-rules";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule)
      });
      
      if (res.ok) {
        const savedRule = await res.json();
        if (rule.id) {
          setRules(prev => prev.map(r => r.id === rule.id ? savedRule : r));
        } else {
          setRules(prev => [...prev, savedRule].sort((a, b) => a.priority - b.priority));
        }
        setIsModalOpen(false);
        toast.success("Rule saved successfully");
      }
    } catch (err) {
      toast.error("Failed to save rule");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ─── TOOLBAR & TESTER ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <button 
          onClick={handleCreate}
          className="flex items-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20 active:scale-95"
        >
          <Plus className="w-4 h-4" /> New Rule
        </button>

        <div className="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-900/40 p-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 backdrop-blur-md">
          <button 
            onClick={() => setTestMode(!testMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              testMode ? "bg-amber-600 text-white" : "text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-800"
            }`}
          >
            <FlaskConical className="w-4 h-4" /> {testMode ? "Close Tester" : "Test Rules"}
          </button>
        </div>
      </div>

      {/* ─── TEST PANEL ─────────────────────────────────────────────── */}
      {testMode && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-[24px] p-8 space-y-6 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400">
            <Zap className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-tight">Real-time Rule Evaluator</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Property</label>
              <select 
                value={testParams.property_type}
                onChange={(e) => setTestParams(p => ({ ...p, property_type: e.target.value }))}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none"
              >
                <option value="home">Home</option>
                <option value="office">Office</option>
                <option value="factory">Factory</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tech</label>
              <select 
                value={testParams.technology}
                onChange={(e) => setTestParams(p => ({ ...p, technology: e.target.value as any }))}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none"
              >
                <option value="HD">HD</option>
                <option value="IP">IP</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Cameras</label>
              <input 
                type="number"
                value={testParams.camera_count}
                onChange={(e) => setTestParams(p => ({ ...p, camera_count: parseInt(e.target.value) || 0 }))}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Days</label>
              <input 
                type="number"
                value={testParams.recording_days}
                onChange={(e) => setTestParams(p => ({ ...p, recording_days: parseInt(e.target.value) || 0 }))}
                className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-bold focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-950 rounded-2xl p-6 border border-amber-500/10 flex items-center justify-between">
            {testResult ? (
              <>
                <div className="flex items-center gap-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Check className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Matching Rule Found</div>
                    <div className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-tight">
                      Recommendation: {testResult.label} (Opt-{testResult.camera_option})
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Rule ID</div>
                  <div className="text-[10px] font-mono font-bold text-amber-600">{testResult.rule_id}</div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-6 w-full">
                <div className="w-12 h-12 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center">
                  <X className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                  <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">No Specific Match</div>
                  <div className="text-sm font-black text-zinc-400 uppercase tracking-tight">System will use default fallback recommendation</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── RULES LIST ─────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-zinc-900/40 rounded-[32px] border border-zinc-100 dark:border-zinc-800 shadow-xl overflow-hidden backdrop-blur-md">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800/60 text-zinc-400 dark:text-zinc-600 uppercase text-[10px] tracking-[0.2em] font-black">
            <tr>
              <th className="px-8 py-6 w-16">Prio</th>
              <th className="px-8 py-6">Conditions</th>
              <th className="px-8 py-6">Recommendation</th>
              <th className="px-8 py-6 text-center">Status</th>
              <th className="px-8 py-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 group transition-all">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-3">
                    <GripVertical className="w-4 h-4 text-zinc-300 dark:text-zinc-700 cursor-grab" />
                    <span className="font-black text-zinc-900 dark:text-white">{rule.priority}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="flex flex-wrap gap-2">
                    {rule.conditions.property_types?.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded text-[9px] font-black uppercase tracking-widest border border-blue-100 dark:border-blue-500/20">{t}</span>
                    ))}
                    {rule.conditions.technology && (
                      <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded text-[9px] font-black uppercase tracking-widest border border-zinc-200 dark:border-zinc-700">{rule.conditions.technology}</span>
                    )}
                    {(rule.conditions.camera_count_min != null || rule.conditions.camera_count_max != null) && (
                      <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded text-[9px] font-black uppercase tracking-widest border border-amber-100 dark:border-amber-500/20">
                        {rule.conditions.camera_count_min || 0}-{rule.conditions.camera_count_max || "∞"} Cams
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-8 py-6">
                  <div className="font-black text-zinc-900 dark:text-white uppercase tracking-tight">{rule.recommendation.label}</div>
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-600 font-bold mt-1 uppercase tracking-widest">Pre-select Opt-{rule.recommendation.camera_option}</div>
                </td>
                <td className="px-8 py-6 text-center">
                  {rule.is_active ? (
                    <span className="inline-flex items-center gap-1.5 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-zinc-400 font-black text-[10px] uppercase tracking-widest">
                      <div className="w-1.5 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-800" /> Disabled
                    </span>
                  )}
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(rule)}
                      className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-500 transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => rule.id && handleDelete(rule.id)}
                      className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-red-500 transition-all"
                    >
                      <Trash className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <RuleModal 
        key={editingRule?.id || 'new'}
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingRule}
      />
    </div>
  );
}
