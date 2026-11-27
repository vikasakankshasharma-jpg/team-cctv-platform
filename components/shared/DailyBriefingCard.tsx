"use client";

import { useState, useEffect } from "react";
import {
  Sun, Moon, Target, CheckSquare, Sparkles, Send,
  TrendingUp, Award, Calendar, Clock, ChevronRight,
  ListTodo, FileCheck, Share2, RefreshCw, ThumbsUp
} from "lucide-react";
import { toast } from "sonner";
import { soundAlerts } from "@/lib/sound-alerts";

export type DailyRole = "admin" | "salesperson" | "installer" | "partner" | "delivery";

export interface BriefingMetric {
  label: string;
  value: string | number;
  subtext?: string;
  highlight?: boolean;
}

export interface BriefingChecklistItem {
  id: string;
  title: string;
  completed: boolean;
}

interface DailyBriefingCardProps {
  role: DailyRole;
  userName?: string;
  metrics?: BriefingMetric[];
  initialChecklist?: string[];
  className?: string;
}

const DEFAULT_GOALS: Record<DailyRole, { morningQuote: string; eveningQuote: string; defaultTasks: string[] }> = {
  admin: {
    morningQuote: "Focus on pipeline velocity and field dispatch readiness. Every site surveyed today is revenue won tomorrow.",
    eveningQuote: "Great work steering the operations today. Review team metrics and celebrate today's milestones.",
    defaultTasks: [
      "Review new unassigned incoming leads",
      "Check warehouse dispatch & installer allocations",
      "Audit high-value quotations pending closing",
      "Confirm GST reconciliation and vendor drift alerts",
    ],
  },
  salesperson: {
    morningQuote: "Connect early with high-intent leads. Clarify genuine surveillance storage and 100% pure copper cable value.",
    eveningQuote: "Every follow-up today laid groundwork for future bookings. Log today's notes and plan tomorrow's first calls.",
    defaultTasks: [
      "Call top 5 high-intent leads before 11:30 AM",
      "Share 18% GST-inclusive quote links on WhatsApp",
      "Follow up on pending competitor price matches",
      "Schedule site surveys for tomorrow morning",
    ],
  },
  installer: {
    morningQuote: "Safe travels to customer sites! Double-check your BOM toolkit, cable rolls, and camera mountings before leaving.",
    eveningQuote: "Another home and business secured! Ensure completion photos are uploaded for instant wallet credit.",
    defaultTasks: [
      "Inspect required hardware BOM (DVR, cameras, SMPS, connectors)",
      "Call first customer 30 minutes before arrival",
      "Verify camera angles and mobile live view on customer phone",
      "Collect customer digital sign-off and completion photos",
    ],
  },
  partner: {
    morningQuote: "Share today's fresh CCTV festival poster on your WhatsApp Status. 1 booking today unlocks instant commission!",
    eveningQuote: "Thank you for empowering property owners with genuine surveillance. Review your earned wallet commissions below.",
    defaultTasks: [
      "Post today's CCTV promo poster on WhatsApp Status",
      "Share your referral quote link with 3 local shopkeepers",
      "Check pending referral leads status",
      "Review available commission balance for payout",
    ],
  },
  delivery: {
    morningQuote: "Pick up dispatches early. Ensure boxes are safely packed and check destination coordinates on the map.",
    eveningQuote: "All drop-offs accounted for. Zero-cash verified and customer OTP handovers recorded successfully.",
    defaultTasks: [
      "Verify consignment package serial numbers at hub",
      "Check route map for optimal travel order",
      "Ensure online payment is confirmed before handing over equipment",
      "Validate 4-digit customer delivery OTP on the mobile screen",
    ],
  },
};

export function DailyBriefingCard({
  role,
  userName = "Team Member",
  metrics = [],
  initialChecklist,
  className = "",
}: DailyBriefingCardProps) {
  // Determine IST time (Asia/Kolkata)
  const [mode, setMode] = useState<"morning" | "evening">("morning");
  const [personalGoal, setPersonalGoal] = useState("");
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tasks, setTasks] = useState<BriefingChecklistItem[]>([]);
  const [summaryFeedback, setSummaryFeedback] = useState<string | null>(null);

  const roleConfig = DEFAULT_GOALS[role] || DEFAULT_GOALS.admin;

  useEffect(() => {
    // 1. Detect current hour in IST
    const now = new Date();
    // Offset for IST (+5:30)
    const istTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const currentHour = istTime.getHours();

    const isMorning = currentHour >= 4 && currentHour < 14;
    setMode(isMorning ? "morning" : "evening");

    // 2. Load stored personal goal / notes for today
    const dateKey = istTime.toISOString().slice(0, 10);
    const storageKey = `team_daily_briefing_${role}_${dateKey}`;
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.personalGoal) setPersonalGoal(parsed.personalGoal);
        if (parsed.tasks) setTasks(parsed.tasks);
        if (parsed.summaryFeedback) setSummaryFeedback(parsed.summaryFeedback);
      } catch (e) {
        console.warn("Could not parse saved briefing", e);
      }
    } else {
      // Initialize default tasks
      const defaultList = (initialChecklist || roleConfig.defaultTasks).map((title, i) => ({
        id: `task-${i}`,
        title,
        completed: false,
      }));
      setTasks(defaultList);
    }
  }, [role, initialChecklist, roleConfig.defaultTasks]);

  const saveToStorage = (updatedGoal: string, updatedTasks: BriefingChecklistItem[], feedback?: string | null) => {
    const istTime = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
    const dateKey = istTime.toISOString().slice(0, 10);
    const storageKey = `team_daily_briefing_${role}_${dateKey}`;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        personalGoal: updatedGoal,
        tasks: updatedTasks,
        summaryFeedback: feedback !== undefined ? feedback : summaryFeedback,
        updatedAt: new Date().toISOString(),
      })
    );
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    const isNowCompleted = updated.find((t) => t.id === id)?.completed;
    if (isNowCompleted) {
      soundAlerts.playChecklistChime();
    }
    setTasks(updated);
    saveToStorage(personalGoal, updated);
  };

  const handleSaveGoal = () => {
    setIsEditingGoal(false);
    saveToStorage(personalGoal, tasks);
    toast.success("Goal saved for today!");
  };

  const handleFeedback = (rating: "productive" | "average" | "challenging") => {
    setSummaryFeedback(rating);
    saveToStorage(personalGoal, tasks, rating);
    toast.success("Thank you for submitting your daily check-in!");
  };

  const handleShareToWhatsApp = () => {
    const completedCount = tasks.filter((t) => t.completed).length;
    const isMorning = mode === "morning";

    let message = isMorning
      ? `*🌅 Morning Briefing & Plan (${userName} - ${role.toUpperCase()})*\n`
      : `*🌇 End-of-Day Summary & Report (${userName} - ${role.toUpperCase()})*\n`;

    if (personalGoal) {
      message += `🎯 *Focus:* ${personalGoal}\n\n`;
    }

    message += `📋 *Today's Execution (${completedCount}/${tasks.length} Completed):*\n`;
    tasks.forEach((t) => {
      message += `${t.completed ? "✅" : "◻️"} ${t.title}\n`;
    });

    if (metrics.length > 0) {
      message += `\n📊 *Key Indicators:*\n`;
      metrics.forEach((m) => {
        message += `• ${m.label}: *${m.value}* ${m.subtext ? `(${m.subtext})` : ""}\n`;
      });
    }

    if (!isMorning && summaryFeedback) {
      message += `\n⭐ *Day Rating:* ${summaryFeedback.toUpperCase()}\n`;
    }

    message += `\n_Generated via TEAM CCTV Mobile Command App_`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encoded}`, "_blank");
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className={`relative overflow-hidden rounded-2xl sm:rounded-3xl border border-zinc-200/80 dark:border-white/10 bg-white/95 dark:bg-zinc-900/90 backdrop-blur-xl shadow-lg transition-all ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 sm:p-6 pb-4 border-b border-zinc-100 dark:border-white/5 gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
            mode === "morning"
              ? "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
              : "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
          }`}>
            {mode === "morning" ? <Sun className="w-5 h-5 animate-spin-slow" /> : <Moon className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {mode === "morning" ? "Morning Kickoff & Plan" : "Evening Debrief & Summary"}
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white leading-tight">
              Hello, {userName}!
            </h2>
          </div>
        </div>

        {/* Mode Toggle & WhatsApp Share */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs">
            <button
              onClick={() => setMode("morning")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                mode === "morning"
                  ? "bg-white dark:bg-zinc-800 text-amber-600 dark:text-amber-400 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Sun className="w-3.5 h-3.5" /> Plan
            </button>
            <button
              onClick={() => setMode("evening")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-semibold transition-all ${
                mode === "evening"
                  ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              }`}
            >
              <Moon className="w-3.5 h-3.5" /> Summary
            </button>
          </div>

          <button
            onClick={handleShareToWhatsApp}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors shadow-xs"
            title="Share summary to WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WhatsApp</span>
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-6 space-y-5">
        {/* Quote / Strategic Directive */}
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-white/5 border border-zinc-200/60 dark:border-white/5 flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium italic">
            &ldquo;{mode === "morning" ? roleConfig.morningQuote : roleConfig.eveningQuote}&rdquo;
          </p>
        </div>

        {/* Dynamic Metrics Row */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {metrics.map((m, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-xl border ${
                  m.highlight
                    ? "bg-blue-50/50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20 text-blue-900 dark:text-blue-100"
                    : "bg-zinc-50 dark:bg-white/5 border-zinc-200/60 dark:border-white/5 text-zinc-900 dark:text-white"
                }`}
              >
                <div className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{m.label}</div>
                <div className="text-base sm:text-lg font-black tracking-tight mt-0.5">{m.value}</div>
                {m.subtext && (
                  <div className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{m.subtext}</div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Personal Day Focus / Note */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-blue-500" />
              {mode === "morning" ? "My Focus for Today" : "Today's Takeaway Note"}
            </span>
            {!isEditingGoal && (
              <button
                onClick={() => setIsEditingGoal(true)}
                className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                {personalGoal ? "Edit" : "+ Set Focus"}
              </button>
            )}
          </div>

          {isEditingGoal ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={personalGoal}
                onChange={(e) => setPersonalGoal(e.target.value)}
                placeholder="e.g. Call all 4 pending quotes before noon, verify 1TB storage"
                className="flex-1 text-xs px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
              <button
                onClick={handleSaveGoal}
                className="px-3 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setIsEditingGoal(false)}
                className="px-2 py-2 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-white"
              >
                Cancel
              </button>
            </div>
          ) : personalGoal ? (
            <div className="p-3 rounded-xl bg-blue-50/40 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10 text-xs text-zinc-800 dark:text-zinc-200">
              {personalGoal}
            </div>
          ) : (
            <div
              onClick={() => setIsEditingGoal(true)}
              className="p-3 rounded-xl border border-dashed border-zinc-200 dark:border-white/10 text-xs text-zinc-400 dark:text-zinc-500 text-center cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-600 transition-colors"
            >
              Click here to write your personal goal or target for today...
            </div>
          )}
        </div>

        {/* Daily Checklist with Progress */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5 text-emerald-500" />
              {mode === "morning" ? "Today's Action Items" : "Completed Deliverables"}
            </span>
            <span className="text-[11px] font-semibold text-zinc-500">
              {completedCount} of {tasks.length} ({progressPercent}%)
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-zinc-100 dark:bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Checklist items */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {tasks.map((task) => (
              <div
                key={task.id}
                onClick={() => toggleTask(task.id)}
                className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer select-none transition-all ${
                  task.completed
                    ? "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20 text-zinc-500 dark:text-zinc-400 line-through"
                    : "bg-zinc-50/60 dark:bg-white/5 border-zinc-200/60 dark:border-white/5 text-zinc-800 dark:text-zinc-200 hover:border-zinc-300 dark:hover:border-white/10"
                }`}
              >
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => {}} // handled by parent div click
                  className="mt-0.5 rounded-md border-zinc-300 text-emerald-600 focus:ring-emerald-500 shrink-0 cursor-pointer"
                />
                <span className="leading-snug">{task.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Evening 60-Second Self Check-in (Displayed in Evening Mode) */}
        {mode === "evening" && (
          <div className="p-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                End-of-Day Check-in: How was your day?
              </p>
              <p className="text-[11px] text-indigo-800/80 dark:text-indigo-300/80">
                Logging your reflection helps maintain daily momentum.
              </p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => handleFeedback("productive")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  summaryFeedback === "productive"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-emerald-50"
                }`}
              >
                🚀 Productive
              </button>
              <button
                onClick={() => handleFeedback("average")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  summaryFeedback === "average"
                    ? "bg-amber-600 text-white shadow-xs"
                    : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-amber-50"
                }`}
              >
                ⚖️ Average
              </button>
              <button
                onClick={() => handleFeedback("challenging")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  summaryFeedback === "challenging"
                    ? "bg-purple-600 text-white shadow-xs"
                    : "bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-purple-50"
                }`}
              >
                💪 Learning
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
