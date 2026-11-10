"use client";

import React, { useState, useEffect } from "react";
import {
  CreditCard,
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  AlertTriangle,
  BellRing,
  RefreshCw,
  Save,
  CheckCircle2,
  Sparkles,
  Zap,
  Mail,
  MessageSquare,
  MapPin,
  Cpu,
  Lock,
  Unlock,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { ServiceCostBudget, ServiceUsageSummary } from "@/lib/billing/budget-tracker";

export function BillingDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingNotification, setTestingNotification] = useState(false);
  const [evaluatingThresholds, setEvaluatingThresholds] = useState(false);

  const [summary, setSummary] = useState<ServiceUsageSummary | null>(null);
  const [budgetSettings, setBudgetSettings] = useState<ServiceCostBudget | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/finance/billing");
      if (!res.ok) throw new Error("Failed to fetch billing data");
      const data = await res.json();
      setSummary(data.summary);
      setBudgetSettings(data.budgetSettings);
    } catch (err: any) {
      toast.error(err.message || "Failed to load cost monitoring data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async () => {
    if (!budgetSettings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/finance/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_BUDGETS",
          settings: budgetSettings,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      toast.success(data.message || "Budget limits updated successfully");
      setSummary(data.summary);
      setBudgetSettings(data.budgetSettings);
    } catch (err: any) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleZeroCost = async () => {
    if (!budgetSettings) return;
    const nextVal = !budgetSettings.strict_zero_cost_mode;
    setBudgetSettings({ ...budgetSettings, strict_zero_cost_mode: nextVal });

    try {
      const res = await fetch("/api/admin/finance/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "UPDATE_BUDGETS",
          settings: { strict_zero_cost_mode: nextVal },
        }),
      });
      if (res.ok) {
        toast.success(
          nextVal
            ? "🛡️ Strict ₹0 Free Mode ACTIVATED. All uncredited external APIs are blocked."
            : "⚠️ Strict ₹0 Free Mode DEACTIVATED. External APIs allowed under set limits."
        );
        fetchData();
      }
    } catch (err) {
      toast.error("Failed to update safety mode");
    }
  };

  const handleTestAlert = async () => {
    setTestingNotification(true);
    try {
      const res = await fetch("/api/admin/finance/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TEST_NOTIFICATION" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(data.message || "Test alert sent to admin WhatsApp!");
    } catch (err: any) {
      toast.error(err.message || "Failed to dispatch test alert");
    } finally {
      setTestingNotification(false);
    }
  };

  const handleTriggerCheck = async () => {
    setEvaluatingThresholds(true);
    try {
      const res = await fetch("/api/admin/finance/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "TRIGGER_CHECK" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.info(data.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to evaluate thresholds");
    } finally {
      setEvaluatingThresholds(false);
    }
  };

  if (loading || !summary || !budgetSettings) {
    return (
      <div className="flex flex-col items-center justify-center p-16 space-y-4">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading Cost Observatory & Billing Records...</p>
      </div>
    );
  }

  const { services } = summary;

  return (
    <div className="space-y-8 pb-12">
      {/* ─── HEADER ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card border border-border/80 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Cloud Costs & Budget Observatory</h1>
              <p className="text-xs text-muted-foreground">
                Period: <span className="font-semibold text-foreground">{summary.period}</span> • Real-Time Spend Guard & Credit Burn Monitor
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-secondary hover:bg-secondary/80 text-foreground transition-all flex items-center gap-1.5"
            title="Refresh Usage"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>

          <button
            onClick={handleTestAlert}
            disabled={testingNotification}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary transition-all flex items-center gap-1.5"
          >
            <BellRing className="w-3.5 h-3.5" />
            {testingNotification ? "Sending..." : "Test Admin Alert"}
          </button>

          <button
            onClick={handleToggleZeroCost}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs ${
              budgetSettings.strict_zero_cost_mode
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "bg-amber-600 hover:bg-amber-700 text-white"
            }`}
          >
            {budgetSettings.strict_zero_cost_mode ? (
              <>
                <Lock className="w-4 h-4" />
                Strict ₹0 Mode: ACTIVE
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                Strict ₹0 Mode: OFF
              </>
            )}
          </button>
        </div>
      </div>

      {/* ─── BANNER: ZERO COST MODE EXPLANATION ─── */}
      <div
        className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
          budgetSettings.strict_zero_cost_mode
            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
            : "bg-amber-500/10 border-amber-500/30 text-amber-950 dark:text-amber-100"
        }`}
      >
        {budgetSettings.strict_zero_cost_mode ? (
          <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        )}
        <div className="text-xs space-y-1">
          <p className="font-bold">
            {budgetSettings.strict_zero_cost_mode
              ? "Zero-Cost Safeguard is Active (₹0 Bill Guarantee)"
              : "Pay-As-You-Go External API Access is Enabled"}
          </p>
          <p className="opacity-90 leading-relaxed">
            {budgetSettings.strict_zero_cost_mode
              ? "All customer chat inquiries are answered using the Local Autonomous CCTV Brain (pre-loaded with TEAM manuals). Uncredited calls to paid Google APIs are completely blocked, ensuring your card is never charged."
              : "The system is allowed to make paid calls to Google APIs up to your configured service limits. If any service crosses its threshold, an instant WhatsApp and Email alert will be dispatched to the admin."}
          </p>
        </div>
      </div>

      {/* ─── ROW 1: PROMOTIONAL CREDIT WALLET ─── */}
      <div className="bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10 border border-blue-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white uppercase tracking-wider">
                Enterprise Promotional Pool
              </span>
              <span className="text-xs text-muted-foreground font-medium">Valid until Dec 31, 2026</span>
            </div>
            <h2 className="text-2xl font-black text-foreground">
              ₹{services.gcp_genai_credits.total_allocated_inr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </h2>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              <strong>Trial credit for GenAI App Builder:</strong> Dedicated exclusively to Vertex AI Search and Conversation (Agent Builder). Covers document indexing, manual grounding, and grounded generation queries.
            </p>
          </div>

          <div className="bg-card/80 backdrop-blur-md border border-border/80 rounded-xl p-4 min-w-[240px] space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-medium">Credit Status:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">GCP Billing Suspended</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground font-medium">Available Balance:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                ₹{services.gcp_genai_credits.remaining_inr.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/50">
              Re-activate by opening your billing account in Google Cloud Console.
            </p>
          </div>
        </div>
      </div>

      {/* ─── ROW 2: SERVICE-BY-SERVICE USAGE METERS ─── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
            Chargeable Services — Month-to-Date Meter
          </h3>
          <button
            onClick={handleTriggerCheck}
            disabled={evaluatingThresholds}
            className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Evaluate Thresholds Now
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. GCP Uncredited Spend */}
          <div className={`bg-card border rounded-2xl p-5 space-y-3 ${services.gcp_uncredited_spend.is_breached ? "border-red-500 shadow-xs shadow-red-500/10" : "border-border/80"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-600">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Google Cloud Spend</span>
              </div>
              {services.gcp_uncredited_spend.is_breached ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">LIMIT REACHED</span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">SAFE</span>
              )}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black">₹{services.gcp_uncredited_spend.current_month_inr.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground font-medium">Limit: ₹{services.gcp_uncredited_spend.limit_inr}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all ${services.gcp_uncredited_spend.is_breached ? "bg-red-500" : "bg-primary"}`}
                style={{ width: `${Math.min(100, (services.gcp_uncredited_spend.current_month_inr / (services.gcp_uncredited_spend.limit_inr || 1)) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Uncredited Pay-As-You-Go cloud resources.</p>
          </div>

          {/* 2. Google Maps API */}
          <div className={`bg-card border rounded-2xl p-5 space-y-3 ${services.google_maps_api.is_breached ? "border-red-500 shadow-xs shadow-red-500/10" : "border-border/80"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Google Maps API</span>
              </div>
              {services.google_maps_api.is_breached ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">LIMIT REACHED</span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">FREE TIER</span>
              )}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black">{services.google_maps_api.requests_count}</span>
              <span className="text-xs text-muted-foreground font-medium">Limit: {services.google_maps_api.limit_requests} reqs</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all ${services.google_maps_api.is_breached ? "bg-red-500" : "bg-emerald-500"}`}
                style={{ width: `${Math.min(100, (services.google_maps_api.requests_count / (services.google_maps_api.limit_requests || 1)) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Geocoding & routing for lead dispatch.</p>
          </div>

          {/* 3. Resend Emails */}
          <div className={`bg-card border rounded-2xl p-5 space-y-3 ${services.resend_email.is_breached ? "border-red-500 shadow-xs shadow-red-500/10" : "border-border/80"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Resend Quotation Emails</span>
              </div>
              {services.resend_email.is_breached ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">LIMIT REACHED</span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">SAFE</span>
              )}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black">{services.resend_email.sent_count}</span>
              <span className="text-xs text-muted-foreground font-medium">Limit: {services.resend_email.limit_emails} / 3000 free</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all ${services.resend_email.is_breached ? "bg-red-500" : "bg-blue-500"}`}
                style={{ width: `${Math.min(100, (services.resend_email.sent_count / (services.resend_email.limit_emails || 1)) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Automated customer quote PDFs & email alerts.</p>
          </div>

          {/* 4. MSG91 & Fast2SMS */}
          <div className={`bg-card border rounded-2xl p-5 space-y-3 ${services.msg91_sms.is_low ? "border-amber-500 shadow-xs shadow-amber-500/10" : "border-border/80"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">MSG91 / WhatsApp Wallet</span>
              </div>
              {services.msg91_sms.is_low ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white">RELOAD SOON</span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">HEALTHY</span>
              )}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black">₹{services.msg91_sms.estimated_balance_inr.toFixed(2)}</span>
              <span className="text-xs text-muted-foreground font-medium">Min Floor: ₹{services.msg91_sms.min_threshold_inr}</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all ${services.msg91_sms.is_low ? "bg-amber-500" : "bg-purple-500"}`}
                style={{ width: `${Math.min(100, (services.msg91_sms.estimated_balance_inr / 500) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Customer OTPs & WhatsApp quotation dispatches.</p>
          </div>

          {/* 5. Gemini Direct API Calls */}
          <div className={`bg-card border rounded-2xl p-5 space-y-3 ${services.gemini_ai_calls.is_breached ? "border-red-500 shadow-xs shadow-red-500/10" : "border-border/80"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-500/10 flex items-center justify-center text-teal-600">
                  <Cpu className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Gemini Direct Calls</span>
              </div>
              {services.gemini_ai_calls.is_breached ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500 text-white">BLOCKED</span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">SAFE</span>
              )}
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-black">{services.gemini_ai_calls.calls_count}</span>
              <span className="text-xs text-muted-foreground font-medium">Limit: {services.gemini_ai_calls.limit_calls} calls</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full transition-all ${services.gemini_ai_calls.is_breached ? "bg-red-500" : "bg-teal-500"}`}
                style={{ width: `${Math.min(100, (services.gemini_ai_calls.calls_count / (services.gemini_ai_calls.limit_calls || 1)) * 100)}%` }}
              />
            </div>
            <p className="text-[11px] text-muted-foreground">Pay-As-You-Go calls outside the App Builder credit.</p>
          </div>
        </div>
      </div>

      {/* ─── ROW 3: BUDGET LIMITS & NOTIFICATION CONFIGURATION ─── */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-border/70">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <BellRing className="w-4 h-4 text-primary" />
              Service Thresholds & Admin Notification Rules
            </h3>
            <p className="text-xs text-muted-foreground">
              When usage crosses any set limit, an alert is instantly dispatched to your Admin WhatsApp and Email.
            </p>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all flex items-center gap-2 shadow-xs shrink-0"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Budget Settings"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* GCP Monthly Spend Limit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">GCP Spend Alert Threshold (₹)</label>
            <input
              type="number"
              value={budgetSettings.gcp_monthly_limit_inr}
              onChange={(e) =>
                setBudgetSettings({ ...budgetSettings, gcp_monthly_limit_inr: Number(e.target.value) })
              }
              className="w-full p-2.5 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-[11px] text-muted-foreground">Alert when uncredited GCP bill exceeds this amount.</p>
          </div>

          {/* Maps API Request Limit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Google Maps Monthly Request Limit</label>
            <input
              type="number"
              value={budgetSettings.maps_monthly_requests_limit}
              onChange={(e) =>
                setBudgetSettings({ ...budgetSettings, maps_monthly_requests_limit: Number(e.target.value) })
              }
              className="w-full p-2.5 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-[11px] text-muted-foreground">Alert before reaching Google's free $200 tier limit.</p>
          </div>

          {/* Resend Email Limit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Resend Email Alert Limit (out of 3,000)</label>
            <input
              type="number"
              value={budgetSettings.resend_monthly_emails_limit}
              onChange={(e) =>
                setBudgetSettings({ ...budgetSettings, resend_monthly_emails_limit: Number(e.target.value) })
              }
              className="w-full p-2.5 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-[11px] text-muted-foreground">Alert at 80% free tier capacity to avoid email drops.</p>
          </div>

          {/* MSG91 Wallet Floor */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">MSG91 / WhatsApp Min Floor (₹)</label>
            <input
              type="number"
              value={budgetSettings.msg91_wallet_min_inr}
              onChange={(e) =>
                setBudgetSettings({ ...budgetSettings, msg91_wallet_min_inr: Number(e.target.value) })
              }
              className="w-full p-2.5 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-[11px] text-muted-foreground">Alert when SMS balance drops below this amount.</p>
          </div>

          {/* Gemini Direct Calls Limit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Gemini Direct Calls Max Limit</label>
            <input
              type="number"
              value={budgetSettings.gemini_monthly_uncredited_calls_limit}
              onChange={(e) =>
                setBudgetSettings({ ...budgetSettings, gemini_monthly_uncredited_calls_limit: Number(e.target.value) })
              }
              className="w-full p-2.5 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-[11px] text-muted-foreground">Max paid fallback calls before locking strictly to local brain.</p>
          </div>

          {/* Admin WhatsApp Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground">Admin WhatsApp Number for Alerts</label>
            <input
              type="text"
              value={budgetSettings.admin_alert_whatsapp}
              onChange={(e) =>
                setBudgetSettings({ ...budgetSettings, admin_alert_whatsapp: e.target.value })
              }
              className="w-full p-2.5 rounded-xl border border-border bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-[11px] text-muted-foreground">Receives instant budget threshold alerts with 24h deduplication.</p>
          </div>
        </div>
      </div>

      {/* ─── ROW 4: AUTONOMOUS LOCAL BRAIN VERIFICATION ─── */}
      <div className="bg-card border border-border/80 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold">Autonomous Local CCTV Brain Status</h3>
            <p className="text-xs text-muted-foreground">
              Direct in-memory knowledge engine extracted from TEAM CCTV User Guides and Catalogs.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Zero-Cost Serving
            </div>
            <p className="text-xs text-muted-foreground">
              Answers DVR beeping, offline apps, and warranty policies in <strong>&lt;10ms</strong> with <strong>₹0.00</strong> cloud charges.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Zero Hallucinations
            </div>
            <p className="text-xs text-muted-foreground">
              Strictly grounded in your actual 4.6MB <code>TEAM_CCTV_User_Guide.pdf</code> and product master catalogs.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Self-Learning Loop
            </div>
            <p className="text-xs text-muted-foreground">
              When master credits are re-enabled, new answers are permanently absorbed into the local brain for future visitors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
