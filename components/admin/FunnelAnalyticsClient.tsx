"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowDownRight, Target, Users, Zap, CheckCircle2 } from "lucide-react";

interface FunnelData {
  totalStarted: number;
  propertySelected: number;
  cameraCount: number;
  recording: number;
  quoteGenerated: number;
  completionRate: number;
  drops: {
    property: number;
    cameraCount: number;
    recording: number;
    generation: number;
  };
}

export function FunnelAnalyticsClient() {
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics/funnel")
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData(res.data);
        } else {
          setError(res.message || "Failed to load funnel data");
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>;
  if (error || !data) return <div className="p-10 text-center text-red-500">Error: {error}</div>;

  const funnelSteps = [
    { title: "Started Wizard", value: data.totalStarted, drop: 0, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Selected Property", value: data.propertySelected, drop: data.drops.property, icon: Target, color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { title: "Selected Cameras", value: data.cameraCount, drop: data.drops.cameraCount, icon: Zap, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Selected Recording", value: data.recording, drop: data.drops.recording, icon: Target, color: "text-fuchsia-500", bg: "bg-fuchsia-500/10" },
    { title: "Quote Generated", value: data.quoteGenerated, drop: data.drops.generation, icon: CheckCircle2, color: "text-green-500", bg: "bg-green-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-black/5 border-border/50 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-black text-foreground">{data.completionRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">Of users who start, finish the wizard.</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <CardDescription>Analyze where users are dropping off during the quotation wizard.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {funnelSteps.map((step, index) => (
              <div key={index} className="flex flex-col gap-2 relative">
                
                {/* Drop-off Indicator (Don't show for first step) */}
                {index > 0 && (
                  <div className="flex items-center gap-2 ml-8 mb-2 mt-2 opacity-60">
                    <ArrowDownRight className="w-4 h-4 text-red-500" />
                    <span className="text-xs font-semibold text-red-500">-{step.drop}% drop-off</span>
                  </div>
                )}
                
                {/* Step Bar */}
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${step.bg}`}>
                    <step.icon className={`w-6 h-6 ${step.color}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="font-bold text-foreground">{step.title}</h3>
                      <span className="font-black text-lg">{step.value}</span>
                    </div>
                    {/* Progress Bar visualization relative to totalStarted */}
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${step.bg.replace('/10', '')} transition-all duration-1000`} 
                        style={{ width: `${data.totalStarted > 0 ? (step.value / data.totalStarted) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
