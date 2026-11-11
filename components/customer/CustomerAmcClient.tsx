"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Clock, AlertTriangle, CheckCircle2, ShieldAlert, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";

export function CustomerAmcClient() {
  const { t, locale } = useTranslation();
  const dateLocale = locale === "en" ? "en-IN" : `${locale}-IN`;
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/customer/amc")
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData(res.data);
        } else {
          toast.error(res.message || t("amc_err_load", "Failed to load AMC data"));
        }
      })
      .catch(e => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handlePurchase = async (planId: string, warrantyId: string) => {
    setPurchasing(planId);
    try {
      // In a real app, integrate Razorpay here. For MVP, we auto-activate.
      const res = await fetch("/api/customer/amc/purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, warrantyId, paymentId: "MOCK_PAY_ID" })
      });
      const result = await res.json();
      if (result.success) {
        toast.success(t("amc_ok", "AMC Activated Successfully!"));
        // Refresh data
        window.location.reload();
      } else {
        toast.error(result.message);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPurchasing(null);
    }
  };

  if (loading) return <div className="flex justify-center p-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!data) return <div className="text-center p-10 text-muted-foreground">{t("amc_no_data", "No data found.")}</div>;

  const { warranties, amcSubscriptions, availablePlans } = data;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* Active Subscriptions Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("amc_active_amcs", "Active AMCs")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">
              {amcSubscriptions.filter((s: any) => s.status === "ACTIVE").length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("amc_warranties", "Hardware Warranties")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-foreground">{warranties.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Warranties & AMC List */}
      <div className="space-y-6">
        <h3 className="text-lg font-bold">{t("amc_heading", "Your Systems & Coverage")}</h3>
        
        {warranties.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-10 text-muted-foreground">
              <ShieldCheck className="w-12 h-12 mb-4 opacity-20" />
              <p>{t("amc_none_found", "No active systems or warranties found.")}</p>
            </CardContent>
          </Card>
        ) : (
          warranties.map((warranty: any) => {
            const hasActiveAmc = amcSubscriptions.some((amc: any) => amc.warrantyId === warranty.id && amc.status === "ACTIVE");
            const isExpiringSoon = !warranty.isExpired && warranty.latestExpiry && new Date(warranty.latestExpiry).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

            return (
              <Card key={warranty.id} className={`overflow-hidden transition-all ${warranty.isExpired && !hasActiveAmc ? "border-red-500/50 bg-red-500/5" : "border-border"}`}>
                <div className="flex flex-col md:flex-row">
                  <div className="flex-1 p-6">
                    <div className="flex items-center gap-3 mb-4">
                      {hasActiveAmc ? (
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                      ) : warranty.isExpired ? (
                        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-lg">{t("amc_sys_cov", "System Coverage:")} {warranty.certNumber}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t("amc_installed_on", "Installed on")} {new Date(warranty.installationDate).toLocaleDateString(dateLocale, { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                      <div className="p-3 bg-background rounded-lg border border-border text-center">
                        <span className="block text-xs font-medium text-muted-foreground mb-1">{t("amc_status", "Status")}</span>
                        <span className={`font-semibold text-sm ${warranty.isExpired ? "text-red-500" : "text-emerald-500"}`}>
                          {warranty.isExpired ? t("amc_expired", "Expired") : t("amc_active_war", "Active Warranty")}
                        </span>
                      </div>
                      <div className="p-3 bg-background rounded-lg border border-border text-center">
                        <span className="block text-xs font-medium text-muted-foreground mb-1">{t("amc_expires", "Expires")}</span>
                        <span className="font-semibold text-sm">
                          {warranty.latestExpiry ? new Date(warranty.latestExpiry).toLocaleDateString(dateLocale, { day: "numeric", month: "short", year: "numeric" }) : "—"}
                        </span>
                      </div>
                      <div className="p-3 bg-background rounded-lg border border-border text-center">
                        <span className="block text-xs font-medium text-muted-foreground mb-1">{t("amc_amc_status", "AMC Status")}</span>
                        <span className={`font-semibold text-sm ${hasActiveAmc ? "text-emerald-500" : "text-muted-foreground"}`}>
                          {hasActiveAmc ? t("amc_protected", "Protected") : t("amc_none", "None")}
                        </span>
                      </div>
                      <div className="p-3 bg-background rounded-lg border border-border text-center">
                        <span className="block text-xs font-medium text-muted-foreground mb-1">{t("amc_assets", "Assets")}</span>
                        <span className="font-semibold text-sm">{warranty.assets.length} {t("amc_items", "items")}</span>
                      </div>
                    </div>
                  </div>

                  {/* Renew Section */}
                  {!hasActiveAmc && (
                    <div className="w-full md:w-80 bg-muted/30 p-6 border-t md:border-t-0 md:border-l border-border flex flex-col justify-center">
                      {(warranty.isExpired || isExpiringSoon) ? (
                        <>
                          <div className="flex items-center gap-2 text-amber-600 mb-3">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <span className="font-bold">{t("amc_unprot", "System Unprotected")}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-4">
                            {t("amc_extend_desc", "Extend your peace of mind. Get priority support and free maintenance visits with an AMC plan.")}
                          </p>
                          <div className="space-y-3">
                            {availablePlans.map((plan: any) => (
                              <Button 
                                key={plan.id} 
                                className="w-full justify-between h-auto py-2.5 gap-2 whitespace-normal text-left leading-snug"
                                onClick={() => handlePurchase(plan.id, warranty.id)}
                                disabled={purchasing !== null}
                              >
                                {purchasing === plan.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                                  <>
                                    <span>{plan.name}</span>
                                    <span className="font-bold shrink-0">₹{plan.price}</span>
                                  </>
                                )}
                              </Button>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="text-center text-muted-foreground flex flex-col items-center">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mb-2 opacity-50" />
                          <p className="text-sm font-medium">{t("amc_covered_war", "Your system is fully covered under the manufacturer warranty.")}</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {hasActiveAmc && (
                    <div className="w-full md:w-80 bg-emerald-500/10 p-6 border-t md:border-t-0 md:border-l border-emerald-500/20 flex flex-col justify-center text-center">
                       <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                       <h4 className="font-bold text-emerald-700 dark:text-emerald-400 mb-1">{t("amc_active_lbl", "AMC Active")}</h4>
                       <p className="text-xs text-emerald-600/70 font-medium">{t("amc_covered_amc", "Your system is fully protected with priority support.")}</p>
                    </div>
                  )}

                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
