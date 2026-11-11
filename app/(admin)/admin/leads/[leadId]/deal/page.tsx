"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { calculateQuotationProfitBreakup } from "@/lib/quotation-profit";
import { QuotationProfitBreakupCard } from "@/components/admin/leads/QuotationProfitBreakupCard";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";

export default function DealConversionPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const quoteId = params.leadId as string;
  
  const [lead, setLead] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Negotiation state
  const [discountAmount, setDiscountAmount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [approvalLink, setApprovalLink] = useState("");
  
  // Admin defined minimum margin (could be fetched from settings, hardcoded to 15% for now)
  const MIN_MARGIN_PERCENT = 15;

  useEffect(() => {
    fetchLead();
  }, [quoteId]);

  const fetchLead = async () => {
    try {
      const res = await fetch(`/api/crm/quotes/${quoteId}`);
      const data = await res.json();
      if (data.success) {
        setLead(data.data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 md:p-8">{t("adm_deal_loading", "Loading quote details...")}</div>;
  if (!lead) return <div className="p-4 md:p-8">{t("adm_deal_not_found", "Quote not found.")}</div>;

  // Dynamic financial derivation using rigorous profit breakup (with live settings, Paid AMC & referral commission context)
  const dynamicPricing = {
    ...(lead.pricingSnapshot || {}),
    discount_amount: discountAmount,
    total_payable: Math.max(0, (lead.pricingSnapshot?.total_payable || 0) - discountAmount),
    promoter_id: lead.promoter_id || lead.pricingSnapshot?.promoter_id,
    referral_code: lead.referral_code || lead.pricingSnapshot?.referral_code,
  };
  const breakup = calculateQuotationProfitBreakup(dynamicPricing, lead.profit_settings, lead.profit_context);

  const baseCost = breakup.overall.cost;
  const listPrice = lead.pricingSnapshot?.total_payable || 0;
  const finalPrice = Math.max(0, listPrice - discountAmount);
  const grossProfit = breakup.overall.profit;
  const marginPercent = breakup.overall.margin_percent;
  const productMarginPercent = breakup.products.margin_percent;
  
  const requiresApproval = marginPercent < MIN_MARGIN_PERCENT || productMarginPercent < 10;

  const handleSendToCustomer = async () => {
    setSaving(true);
    setApprovalLink("");
    try {
      const res = await fetch(`/api/crm/request-customer-approval`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: lead.id,
          discountAmount,
          finalPrice,
          grossProfit
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.approvalLink) {
            setApprovalLink(data.approvalLink);
        } else {
            toast.success(t("adm_deal_sent_ok", "Quote sent to customer for approval!"));
            router.push(`/admin/leads/${data.leadId}`);
        }
      } else {
        toast.error(data.message || t("adm_deal_send_err", "Failed to send to customer."));
      }
    } catch (err) {
      console.error(err);
      toast.error(t("adm_deal_err_send", "Error sending to customer."));
    } finally {
      setSaving(false);
    }
  };

  if (approvalLink) {
      return (
          <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
              <Card>
                  <CardContent className="p-4 md:p-8 text-center space-y-4">
                      <h2 className="text-2xl font-bold text-green-700 leading-snug">{t("adm_deal_app_req", "Approval Requested")}</h2>
                      <p className="leading-relaxed">{t("adm_deal_app_desc", "The revised quote has been saved and the lead status is updated.")}</p>
                      <div className="bg-gray-100 p-4 rounded-md">
                          <p className="font-mono text-sm break-all">{approvalLink}</p>
                      </div>
                      <div className="flex flex-wrap justify-center gap-4 mt-6">
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(approvalLink);
                                toast.success(t("adm_deal_link_copied", "Link copied!"));
                            }} 
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-md font-bold whitespace-normal leading-snug"
                        >
                            {t("adm_deal_copy_link", "Copy Link")}
                        </button>
                        <button 
                            onClick={() => router.push(`/admin/leads/${lead.leadId}`)} 
                            className="px-6 py-2.5 border rounded-md whitespace-normal leading-snug"
                        >
                            {t("adm_qb_back_lead", "Back to Lead")}
                        </button>
                      </div>
                  </CardContent>
              </Card>
          </div>
      );
  }

  const custName = lead.customer_name || t("adm_ld_unk_cust", "Unknown Customer");

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 leading-snug">{t("adm_deal_title", "Prepare Quote for Customer")}</h1>
        <p className="text-gray-500 mt-1 leading-relaxed">{t("adm_deal_sub", "Review quote financials, apply any necessary discount, and send it to {name} for approval.", { name: custName })}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="leading-snug">{t("adm_deal_fin_sum", "Financial Summary")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <div className="flex justify-between gap-2 border-b pb-2">
              <span className="text-gray-500">{t("adm_deal_base_cost", "Base Cost (Hardware + Installation):")}</span>
              <span className="font-medium text-gray-900 shrink-0">₹{baseCost.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between gap-2 border-b pb-2">
              <span className="text-gray-500">{t("adm_deal_list_price", "Quoted List Price:")}</span>
              <span className="font-medium text-gray-900 shrink-0">₹{listPrice.toLocaleString("en-IN")}</span>
            </div>
            
            <div className="sm:col-span-2 flex flex-wrap justify-between items-center gap-3 bg-gray-50 p-4 rounded-md border mt-2">
              <span className="font-semibold">{t("adm_deal_apply_disc", "Apply Discount (₹):")}</span>
              <Input 
                type="number" 
                value={discountAmount} 
                onChange={e => setDiscountAmount(Number(e.target.value))}
                className="w-48 text-right font-bold text-red-600"
              />
            </div>

            <div className="sm:col-span-2 bg-blue-50 p-4 rounded-md border border-blue-100 flex flex-wrap justify-between items-center gap-3 mt-2">
              <span className="font-bold text-lg text-blue-900">{t("adm_deal_final_price", "Final Target Price:")}</span>
              <span className="font-bold text-2xl text-blue-700">₹{finalPrice.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="leading-snug">{t("adm_deal_mgn_stat", "Margin Status")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className={`p-4 border rounded-xl text-center ${productMarginPercent < 10 ? "bg-amber-50 border-amber-200" : "bg-blue-50/50 border-blue-200"}`}>
              <div className="text-xs text-muted-foreground font-bold mb-1 uppercase tracking-wider leading-snug">{t("adm_deal_mgn_prod", "Product Margin (No Services)")}</div>
              <div className="text-2xl font-black text-blue-700">{productMarginPercent.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t("adm_deal_prof_suffix", "{amt} Profit", { amt: `₹${Math.round(breakup.products.profit).toLocaleString("en-IN")}` })}</div>
            </div>

            <div className="p-4 border rounded-xl text-center bg-amber-50/50 border-amber-200">
              <div className="text-xs text-muted-foreground font-bold mb-1 uppercase tracking-wider leading-snug">{t("adm_qvh_serv_margin", "Services Margin")}</div>
              <div className="text-2xl font-black text-amber-700">{breakup.services.margin_percent.toFixed(1)}%</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t("adm_deal_prof_suffix", "{amt} Profit", { amt: `₹${Math.round(breakup.services.profit).toLocaleString("en-IN")}` })}</div>
            </div>

            <div className={`p-4 border rounded-xl text-center ${requiresApproval ? "bg-red-50 border-red-200" : "bg-emerald-50/60 border-emerald-300"}`}>
              <div className="text-xs text-muted-foreground font-bold mb-1 uppercase tracking-wider leading-snug">{t("adm_deal_mgn_tot", "Total Deal (With Services)")}</div>
              <div className={`text-2xl font-black ${requiresApproval ? "text-red-600" : "text-emerald-700"}`}>
                {marginPercent.toFixed(1)}%
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">{t("adm_deal_netp_suffix", "{amt} Net Profit", { amt: `₹${Math.round(grossProfit).toLocaleString("en-IN")}` })}</div>
            </div>
          </div>
          
          {requiresApproval && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md flex items-start gap-3">
              <span className="text-yellow-600 text-xl shrink-0">⚠️</span>
              <div>
                <h4 className="font-bold text-yellow-800 leading-snug">{t("adm_deal_low_t", "Margin Below Target")}</h4>
                <p className="text-sm text-yellow-700 mt-1 leading-relaxed">
                  {t("adm_deal_low_d", "The requested discount drops the gross margin below the target threshold of {min}%. Make sure you have management clearance for this pricing.", { min: String(MIN_MARGIN_PERCENT) })}
                </p>
              </div>
            </div>
          )}

          <div className="mt-6">
            <QuotationProfitBreakupCard
              quote={{ pricingSnapshot: dynamicPricing, profit_settings: lead.profit_settings, profit_context: lead.profit_context }}
              settings={lead.profit_settings}
              defaultExpanded={false}
            />
          </div>
        </CardContent>
      </Card>
      
      <div className="flex flex-wrap justify-end gap-4 mt-8">
        <button 
          onClick={() => router.back()} 
          className="px-6 py-2.5 border rounded-md text-gray-700 hover:bg-gray-50 whitespace-normal leading-snug"
        >
          {t("adm_qm_del_cancel", "Cancel")}
        </button>
        <button 
          onClick={handleSendToCustomer}
          disabled={saving}
          className="px-6 py-2.5 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 disabled:opacity-50 whitespace-normal leading-snug"
        >
          {saving ? t("adm_deal_sending", "Sending...") : t("adm_deal_send_btn", "Send Revised Quote to Customer")}
        </button>
      </div>
    </div>
  );
}

