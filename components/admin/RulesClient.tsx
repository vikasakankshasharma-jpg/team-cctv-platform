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
    if (!window.confirm("Delete this rule? Leads may fall back to the default recommendation.")) return;
    try {
      const res = await fetch(`/api/admin/recommendation-rules/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRules(prev => prev.filter(r => r.id !== id));
        toast.success("Rule deleted");
      } else {
        toast.error("Failed to delete rule");
      }
    } catch (err) {
      toast.error("Failed to delete rule");
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
          className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-full text-xs font-semibold hover:bg-primary/90 transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" /> New Rule
        </button>

        <div className="flex items-center gap-3 bg-secondary/50 p-1.5 rounded-full border border-border">
          <button 
            onClick={() => setTestMode(!testMode)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-semibold transition-all ${
              testMode ? "bg-warning text-warning-foreground shadow-sm" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" /> {testMode ? "Close Tester" : "Test Rules"}
          </button>
        </div>
      </div>

      {/* ─── TEST PANEL ─────────────────────────────────────────────── */}
      {testMode && (
        <div className="bg-warning/5 border border-warning/20 rounded-2xl p-6 space-y-6 animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2 text-warning">
            <Zap className="w-4 h-4" />
            <h3 className="font-semibold text-sm tracking-tight">Real-time Rule Evaluator</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Property</label>
              <select 
                value={testParams.property_type}
                onChange={(e) => setTestParams(p => ({ ...p, property_type: e.target.value }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option value="home">Home</option>
                <option value="office">Office</option>
                <option value="factory">Factory</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tech</label>
              <select 
                value={testParams.technology}
                onChange={(e) => setTestParams(p => ({ ...p, technology: e.target.value as any }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none"
              >
                <option value="HD">HD</option>
                <option value="IP">IP</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Cameras</label>
              <input 
                type="number"
                value={testParams.camera_count}
                onChange={(e) => setTestParams(p => ({ ...p, camera_count: parseInt(e.target.value) || 0 }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Days</label>
              <input 
                type="number"
                value={testParams.recording_days}
                onChange={(e) => setTestParams(p => ({ ...p, recording_days: parseInt(e.target.value) || 0 }))}
                className="w-full bg-background border border-border rounded-xl px-4 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="bg-background rounded-2xl p-5 border border-warning/10 flex items-center justify-between shadow-sm">
            {testResult ? (
              <>
                <div className="flex items-center gap-5">
                  <div className="w-10 h-10 rounded-xl bg-success/10 border border-success/20 flex items-center justify-center">
                    <Check className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Matching Rule Found</div>
                    <div className="text-sm font-semibold text-foreground tracking-tight">
                      Recommendation: {testResult.label} (Opt-{testResult.camera_option})
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">Rule ID</div>
                  <div className="text-[11px] font-mono font-medium text-warning">{testResult.rule_id}</div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-5 w-full">
                <div className="w-10 h-10 rounded-xl bg-secondary border border-border flex items-center justify-center">
                  <X className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">No Specific Match</div>
                  <div className="text-sm font-medium text-muted-foreground tracking-tight">System will use default fallback recommendation</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── RULES LIST ─────────────────────────────────────────────── */}
      <div className="bg-card rounded-2xl border border-border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-secondary/30 border-b border-border text-muted-foreground uppercase text-[11px] tracking-wider font-semibold">
            <tr>
              <th className="px-6 py-4 w-16">Prio</th>
              <th className="px-6 py-4">Conditions</th>
              <th className="px-6 py-4">Recommendation</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-secondary/30 group transition-all">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab hover:text-foreground" />
                    <span className="font-semibold text-foreground">{rule.priority}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1.5">
                    {rule.conditions.property_types?.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-primary/10 text-primary rounded-md text-[10px] font-semibold uppercase tracking-wider border border-primary/20">{t}</span>
                    ))}
                    {rule.conditions.technology && (
                      <span className="px-2 py-0.5 bg-secondary text-muted-foreground rounded-md text-[10px] font-semibold uppercase tracking-wider border border-border">{rule.conditions.technology}</span>
                    )}
                    {(rule.conditions.camera_count_min != null || rule.conditions.camera_count_max != null) && (
                      <span className="px-2 py-0.5 bg-warning/10 text-warning-foreground rounded-md text-[10px] font-semibold uppercase tracking-wider border border-warning/20">
                        {rule.conditions.camera_count_min || 0}-{rule.conditions.camera_count_max || "∞"} Cams
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="font-semibold text-foreground tracking-tight">{rule.recommendation.label}</div>
                  <div className="text-[11px] text-muted-foreground font-medium mt-0.5 uppercase tracking-wider">Pre-select Opt-{rule.recommendation.camera_option}</div>
                </td>
                <td className="px-6 py-4 text-center">
                  {rule.is_active ? (
                    <span className="inline-flex items-center gap-1.5 text-success font-semibold text-[11px] uppercase tracking-wider">
                      <div className="w-1.5 h-1.5 rounded-full bg-success" /> Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-muted-foreground font-semibold text-[11px] uppercase tracking-wider">
                      <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground" /> Disabled
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(rule)}
                      className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-primary transition-all"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => rule.id && handleDelete(rule.id)}
                      className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-destructive transition-all"
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
