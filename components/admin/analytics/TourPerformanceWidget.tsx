"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Compass, AlertCircle, CheckCircle2, Eye, SkipForward, Ban, ArrowDownRight } from "lucide-react";
import type {
  TourFunnelDataset,
  TourFunnelSummary,
} from "@/lib/analytics/tour-funnel-types";

interface TourPerformanceWidgetProps {
  initialData?: TourFunnelDataset;
}

const PAGE_DISPLAY_NAMES: Record<string, string> = {
  "cctv-wizard": "Customer CCTV Wizard (/wizard)",
  "quote-catalog": "Quotation Catalog (/build)",
  "quote-review": "Quotation Review (/quote/review)",
  "track-booking": "Order Tracking (/track/[id])",
  "customer-dashboard": "Customer Dashboard (/customer/dashboard)",
  "admin-lead-deal": "Admin Deal Closer (/admin/leads/[id]/deal)",
  "installer-job": "Installer Mobile Card (/installer/jobs/[id])",
  "partner-leads": "Partner Pipeline (/partner/leads)",
  "partner-commissions": "Partner Earnings (/partner/commissions)",
};

function rateColorClass(rate: number): string {
  if (rate >= 70) return "text-emerald-500";
  if (rate >= 40) return "text-amber-500";
  return "text-red-500";
}

function ProgressBar({ value, color = "bg-primary" }: { value: number; color?: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
      <div
        className={`h-full rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
      />
    </div>
  );
}

function PageRow({ page }: { page: TourFunnelSummary }) {
  const highestDropOffStep = useMemo(() => {
    if (!page.steps || page.steps.length === 0) return null;
    return [...page.steps].sort((a, b) => b.dropOffRate - a.dropOffRate)[0];
  }, [page.steps]);

  const displayName = PAGE_DISPLAY_NAMES[page.pageId] || page.pageId;

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 transition-all hover:border-primary/30">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary shrink-0" />
            {displayName}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {page.starts.toLocaleString()} starts · {page.completions.toLocaleString()} completed · {page.skips.toLocaleString()} skipped
          </p>
        </div>

        <div className="text-left sm:text-right">
          <div className={`text-xl font-black ${rateColorClass(page.completionRate)}`}>
            {page.completionRate}%
          </div>
          <div className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
            Completion Rate
          </div>
        </div>
      </div>

      <div className="mt-3">
        <ProgressBar
          value={page.completionRate}
          color={page.completionRate >= 70 ? "bg-emerald-500" : page.completionRate >= 40 ? "bg-amber-500" : "bg-red-500"}
        />
      </div>

      {/* Step Drop-Off Breakup */}
      {page.steps && page.steps.length > 0 && (
        <div className="mt-4 border-t border-border/40 pt-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <ArrowDownRight className="w-3.5 h-3.5 text-muted-foreground" />
              Step-by-Step Funnel
            </h4>

            {highestDropOffStep && (
              <span className="text-[11px] font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                Highest Drop: {highestDropOffStep.label} ({highestDropOffStep.dropOffRate}%)
              </span>
            )}
          </div>

          <div className="space-y-3">
            {page.steps.map((step) => (
              <div key={step.stepId} className="group">
                <div className="mb-1 flex items-center justify-between gap-3">
                  <span className="min-w-0 truncate text-xs font-medium text-foreground/90">
                    {step.label}
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-muted-foreground">
                    {step.dropOffRate}% drop-off ({step.skipRate}% skipped)
                  </span>
                </div>

                <ProgressBar
                  value={100 - step.dropOffRate}
                  color={step.dropOffRate > 40 ? "bg-red-500/80" : "bg-primary/80"}
                />

                <div className="mt-1 flex justify-between text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {step.viewed} viewed
                  </span>
                  <span className="flex items-center gap-1">
                    <SkipForward className="w-3 h-3" />
                    {step.skipped} skipped
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <Card className="bg-card border-border/60 shadow-none">
      <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
        <Icon className={`w-4 h-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black text-foreground">{value.toLocaleString()}</div>
      </CardContent>
    </Card>
  );
}

export function TourPerformanceWidget({ initialData }: TourPerformanceWidgetProps) {
  const [data, setData] = useState<TourFunnelDataset | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) return;

    fetch("/api/admin/analytics/tour-funnel")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.error || "Failed to load tour funnel analytics");
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [initialData]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm">Loading guided tour funnel telemetry...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive text-sm flex items-center gap-2">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>Error loading tour telemetry: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Compass className="w-5 h-5 text-primary" />
            Tour Drop-off & Funnel Telemetry
          </h2>
          <p className="text-xs text-muted-foreground">
            Measures customer, installer, admin and partner engagement across all 9 guided tours with zero PII leakage.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-500 px-3 py-1.5 rounded-lg text-xs font-semibold">
          <Ban className="w-3.5 h-3.5" />
          <span>Global Skip All: {data.totals.skipAll.toLocaleString()} users</span>
        </div>
      </div>

      {/* Global Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          label="Tours Started"
          value={data.totals.started}
          icon={Compass}
          color="text-blue-500"
        />
        <MetricCard
          label="Tours Completed"
          value={data.totals.completed}
          icon={CheckCircle2}
          color="text-emerald-500"
        />
        <MetricCard
          label="Single Steps Skipped"
          value={data.totals.skipped}
          icon={SkipForward}
          color="text-purple-500"
        />
        <MetricCard
          label="Disabled Automatically"
          value={data.totals.skipAll}
          icon={Ban}
          color="text-amber-500"
        />
      </div>

      {/* Per Screen Breakdown */}
      <div className="space-y-4">
        {data.pages.map((page) => (
          <PageRow key={page.pageId} page={page} />
        ))}
      </div>
    </div>
  );
}
