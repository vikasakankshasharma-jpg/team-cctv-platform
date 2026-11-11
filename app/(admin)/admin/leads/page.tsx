import React from "react";
import Link from "next/link";
import { format } from "date-fns";
import { safeFormatDate, toIsoStringSafe } from "@/lib/date-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { adminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth-server";
import { calculateInactivityAging } from "@/lib/inactivity-tracker";
import { CrmSubNav } from "@/components/admin/navigation/AdminSubNav";
import { TranslatedText } from "@/components/shared/TranslatedText";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

type LeadListRow = {
  id: string;
  leadId?: string;
  customer_name: string;
  customer_mobile: string;
  source: string;
  total_payable: number;
  selectedPlan: string;
  status: string;
  leadStatus: string;
  isPaid?: boolean;
  is_business?: boolean;
  company_name?: string | null;
  gstin?: string | null;
  site_visit_date?: string | null;
  site_visit_slot?: string | null;
  cash_approval_requested?: boolean;
  cash_collection_approved?: boolean;
  cash_requested_amount?: number;
  createdAt: string;
  quoteId?: string;
  channel?: string;
  partner_id?: string | null;
  competitor_quote_received?: boolean;
  timeline?: string | null;
  priority?: string | null;
  last_visited_at?: string | null;
  last_called_at?: string | null;
  last_whatsapp_at?: string | null;
  last_contacted_at?: string | null;
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams?: Promise<{ show_test?: string; filter?: string }>;
}) {
  await requireAdmin();
  const params = searchParams ? await searchParams : {};
  const showTest = params.show_test === "true";
  const filterParam = params.filter || "";

  let isQuotaFallback = false;
  let leadsDocs: any[] = [];
  let quotesDocs: any[] = [];

  // 1. Fetch quotes and leads with strict limit and quota-detection
  try {
    const snap = await adminDb.collection("leads").orderBy("created_at", "desc").limit(50).get();
    leadsDocs = snap.docs;
  } catch (err: any) {
    if (err?.code === 8 || err?.message?.includes("Quota exceeded") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
      isQuotaFallback = true;
    }
    try {
      const snap2 = await adminDb.collection("leads").limit(50).get();
      leadsDocs = snap2.docs;
    } catch (err2: any) {
      if (err2?.code === 8 || err2?.message?.includes("Quota exceeded") || err2?.message?.includes("RESOURCE_EXHAUSTED")) {
        isQuotaFallback = true;
      }
    }
  }

  try {
    const snapQ = await adminDb.collection("quotes").orderBy("created_at", "desc").limit(50).get();
    quotesDocs = snapQ.docs;
  } catch (err: any) {
    if (err?.code === 8 || err?.message?.includes("Quota exceeded") || err?.message?.includes("RESOURCE_EXHAUSTED")) {
      isQuotaFallback = true;
    }
    try {
      const snapQ2 = await adminDb.collection("quotes").limit(50).get();
      quotesDocs = snapQ2.docs;
    } catch (_) {}
  }

  // Index quotes by ID for fast lookup
  const quotesMap = new Map<string, FirebaseFirestore.DocumentData>();
  quotesDocs.forEach((d: any) => quotesMap.set(d.id, d.data()));

  const handledQuoteIds = new Set<string>();

  // Process leads and link their quotes
  let resolvedLeads: LeadListRow[] = [];

  if (leadsDocs.length > 0) {
    resolvedLeads = await Promise.all(leadsDocs.map(async (doc: any) => {
      const data = doc.data();
      const qId = data.last_quote_id || data.latest_quote_id || data.won_quote_id || data.quote_id || data.quoteId || doc.id;
      
      let quoteData: any = qId ? quotesMap.get(qId) : null;
      if (!quoteData) {
        quoteData = quotesMap.get(doc.id);
      }
      if (!quoteData && qId) {
        try {
          const sub = await adminDb.collection("leads").doc(doc.id).collection("quotes").doc(qId).get();
          if (sub.exists) quoteData = sub.data();
        } catch (_) {}
      }

      if (qId) handledQuoteIds.add(qId);
      handledQuoteIds.add(doc.id);

      const isPaid = quoteData?.status === "PAID" || quoteData?.status === "BOOKED" || quoteData?.payment_status === "advance_paid" || !!quoteData?.payment_id || !!data.payment_id || !!data.advance_paid;
      const isSiteVisit = data.status === "site_visit" || quoteData?.status === "site_visit" || !!data.site_visit_date;

      let computedLeadStatus = data.status || quoteData?.status || "NEW";
      if (isPaid) computedLeadStatus = "WON";
      else if (isSiteVisit && computedLeadStatus === "NEW") computedLeadStatus = "SITE_VISIT";
      if (typeof computedLeadStatus === "string") computedLeadStatus = computedLeadStatus.toUpperCase();

      let total_payable = quoteData?.total_payable ?? quoteData?.pricingSnapshot?.total_payable ?? quoteData?.finalPrice ?? data.total_payable ?? 0;
      if (total_payable <= 0) {
        try {
          const { getOrCreateLeadQuote } = await import("@/lib/baseline-quote");
          const synthesized = await getOrCreateLeadQuote(doc.id);
          if (synthesized.quoteData?.total_payable) {
            total_payable = synthesized.quoteData.total_payable;
            quoteData = synthesized.quoteData;
          }
        } catch (_) {}
      }
      const selectedPlan = quoteData?.plan_type || quoteData?.selectedPlan || data.selectedPlan || quoteData?.pricingSnapshot?.selectedPlan || "Standard";
      const customerMobile = data.mobile_number || data.customer_mobile || quoteData?.customer_mobile || quoteData?.billing_details?.phone || "";

      return {
        id: doc.id,
        leadId: doc.id,
        quoteId: qId,
        customer_name: data.customer_name || quoteData?.customer_name || data.billing_details?.contact_name || data.billing_details?.company_name || "Unknown",
        customer_mobile: customerMobile,
        source: data.source || quoteData?.source || "wizard",
        total_payable,
        selectedPlan,
        status: quoteData?.status || data.status || (isPaid ? "PAID" : "GENERATED"),
        leadStatus: computedLeadStatus,
        isPaid,
        is_business: !!(data.is_b2b || data.billing_details?.is_business || quoteData?.billing_details?.is_business),
        company_name: data.company_name || data.billing_details?.company_name || quoteData?.billing_details?.company_name || null,
        gstin: data.gst_number || data.billing_details?.gstin || quoteData?.billing_details?.gstin || null,
        site_visit_date: toIsoStringSafe(data.site_visit_date),
        site_visit_slot: data.site_visit_slot || null,
        cash_approval_requested: Boolean(data.cash_approval_requested || quoteData?.cash_approval_requested),
        cash_collection_approved: Boolean(data.cash_collection_approved || quoteData?.cash_collection_approved),
        cash_requested_amount: data.cash_requested_amount || quoteData?.cash_requested_amount || 0,
        createdAt: toIsoStringSafe(data.created_at || data.createdAt) || new Date().toISOString(),
        channel: data.channel || quoteData?.channel || "web",
        partner_id: data.partner_id || quoteData?.partner_id || null,
        competitor_quote_received: Boolean(data.competitor_quote_received || quoteData?.competitor_quote_received),
        timeline: data.timeline || data.wizard_answers?.q_timeline || data.wizard_answers?.timeline || quoteData?.timeline || null,
        priority: data.priority || quoteData?.priority || null,
        last_visited_at: data.last_visited_at || null,
        last_called_at: data.last_called_at || null,
        last_whatsapp_at: data.last_whatsapp_at || null,
        last_contacted_at: data.last_contacted_at || data.last_visited_at || data.last_called_at || data.last_whatsapp_at || null,
      };
    }));
  }

  // Append any standalone quotes (e.g. manual quotes) that were not already linked to a lead
  const standaloneQuotes: LeadListRow[] = [];
  quotesDocs.forEach((qDoc: any) => {
    if (handledQuoteIds.has(qDoc.id)) return;
    const qData = qDoc.data();
    if (qData.lead_id && leadsDocs.some((l: any) => l.id === qData.lead_id)) return;

    const isPaid = qData.status === "PAID" || qData.status === "BOOKED" || !!qData.payment_id || !!qData.advance_paid;
    let computedLeadStatus = qData.leadStatus || qData.status || "NEW";
    if (isPaid) computedLeadStatus = "WON";
    if (typeof computedLeadStatus === "string") computedLeadStatus = computedLeadStatus.toUpperCase();

    standaloneQuotes.push({
      id: qDoc.id,
      leadId: qData.lead_id || qData.leadId || qDoc.id,
      quoteId: qDoc.id,
      customer_name: qData.customer_name || qData.billing_details?.customer_name || qData.billing_details?.contact_name || "Direct Quotation",
      customer_mobile: qData.customer_mobile || qData.billing_details?.phone || "",
      source: qData.source || "manual",
      total_payable: qData.total_payable || qData.pricingSnapshot?.total_payable || 0,
      selectedPlan: qData.selectedPlan || qData.plan_type || "Standard",
      status: qData.status || (isPaid ? "PAID" : "GENERATED"),
      leadStatus: computedLeadStatus,
      isPaid,
      is_business: !!(qData.billing_details?.is_business),
      company_name: qData.billing_details?.company_name || null,
      gstin: qData.billing_details?.gstin || null,
      site_visit_date: toIsoStringSafe(qData.site_visit_date),
      site_visit_slot: qData.site_visit_slot || null,
      timeline: qData.timeline || qData.wizard_answers?.q_timeline || qData.wizard_answers?.timeline || null,
      priority: qData.priority || null,
      createdAt: toIsoStringSafe(qData.created_at || qData.createdAt) || new Date().toISOString(),
    });
  });

  let leads = [...resolvedLeads, ...standaloneQuotes];

  // If live leads returned empty (e.g. quota exhausted or clean database), load cached leads fallback
  if (leads.length === 0) {
    try {
      const cachePath = path.resolve(process.cwd(), "lib/leads-cache.json");
      if (fs.existsSync(cachePath)) {
        const cached = JSON.parse(fs.readFileSync(cachePath, "utf8"));
        if (Array.isArray(cached) && cached.length > 0) {
          leads = cached;
          isQuotaFallback = true;
        }
      }
    } catch (_) {}
  }

  leads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const isTestLead = (l: LeadListRow) => {
    const qId = (l.quoteId || l.id || "").toUpperCase();
    const name = (l.customer_name || "").toLowerCase();
    const phone = (l.customer_mobile || "").trim();
    return (
      qId.startsWith("QT-E2E-") ||
      qId.startsWith("QT-ADMIN-") ||
      qId.startsWith("QT-CRM-") ||
      qId.startsWith("TEST-") ||
      qId.startsWith("LEAD-CRM-") ||
      qId.startsWith("LEAD-TEST-") ||
      qId.includes("CAPSTONE") ||
      name.includes("test user") ||
      name.includes("e2e test") ||
      name.includes("e2e lifecycle") ||
      name.includes("crm test") ||
      name.includes("test wizard") ||
      name.includes("test payment") ||
      name.includes("prospective client") ||
      name.includes("manual walk-in") ||
      name.includes("dummy") ||
      phone === "9999999999" ||
      phone.startsWith("999999999") ||
      phone === "7777777777" ||
      phone === "0000000000" ||
      phone === "1234567890"
    );
  };

  const totalAllLeads = leads.length;
  const testLeads = leads.filter(isTestLead);
  const genuineLeads = leads.filter((l) => !isTestLead(l));
  const wonLeads = leads.filter((l) => l.isPaid || l.leadStatus === "WON");
  const surveyLeads = leads.filter((l) => !!l.site_visit_date || l.leadStatus === "SITE_VISIT");

  // Determine current active filter
  let currentFilter = filterParam;
  if (!currentFilter) {
    if (showTest) currentFilter = "all";
    else if (genuineLeads.length > 0) currentFilter = "genuine";
    else currentFilter = "all";
  }

  let displayLeads = leads;
  if (currentFilter === "genuine") {
    displayLeads = genuineLeads;
  } else if (currentFilter === "won") {
    displayLeads = wonLeads;
  } else if (currentFilter === "survey") {
    displayLeads = surveyLeads;
  } else if (currentFilter === "test") {
    displayLeads = testLeads;
  }
  displayLeads = displayLeads.filter((l) => l.leadStatus !== "ARCHIVED" && l.status !== "ARCHIVED");

  const getStatusBadge = (status: string, isPaid?: boolean) => {
    if (isPaid || status === "WON" || status === "PAID" || status === "BOOKED") {
      return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-white"><TranslatedText tKey="adm_leads_tab_won" defaultText="Won / Paid" /></Badge>;
    }
    switch (status?.toUpperCase()) {
      case "NEW": return <Badge variant="secondary"><TranslatedText tKey="adm_leads_st_new" defaultText="New" /></Badge>;
      case "CONTACTED": return <Badge variant="default" className="bg-blue-600 hover:bg-blue-700"><TranslatedText tKey="adm_leads_st_contacted" defaultText="Contacted" /></Badge>;
      case "SITE_VISIT": return <Badge variant="default" className="bg-purple-600 hover:bg-purple-700 text-white"><TranslatedText tKey="adm_leads_st_survey" defaultText="Site Survey" /></Badge>;
      case "QUOTATION_SENT": return <Badge variant="outline" className="border-blue-400 text-blue-700 bg-blue-50"><TranslatedText tKey="adm_leads_st_qsent" defaultText="Quote Sent" /></Badge>;
      case "NEGOTIATION": return <Badge variant="outline" className="border-amber-400 text-amber-700 bg-amber-50"><TranslatedText tKey="adm_leads_st_nego" defaultText="Negotiation" /></Badge>;
      case "LOST": return <Badge variant="destructive"><TranslatedText tKey="adm_leads_st_lost" defaultText="Lost" /></Badge>;
      case "ARCHIVED": return <Badge variant="outline" className="border-zinc-400 text-zinc-500 bg-zinc-100 dark:bg-zinc-800"><TranslatedText tKey="adm_leads_st_arch" defaultText="Archived" /></Badge>;
      default: return <Badge variant="outline">{status || <TranslatedText tKey="adm_leads_st_new" defaultText="New" />}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <CrmSubNav />
      
      {/* ── Quota Alert or Live Badge ── */}
      {isQuotaFallback ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-snug"><TranslatedText tKey="adm_dash_quota_t" defaultText="Firestore Free Spark Quota Active — Showing Cached Telemetry" /></p>
            <p className="text-xs text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
              <TranslatedText tKey="adm_dash_quota_d" defaultText="Google Cloud Firestore daily read quota has reached the 50k reads limit on the Spark Plan. Displaying cached operational metrics so you can navigate the system smoothly." />
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg w-fit">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span className="font-medium leading-snug"><TranslatedText tKey="adm_leads_live_sync" defaultText="Live Firestore Pipeline Synchronized" /></span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight leading-snug"><TranslatedText tKey="adm_leads_title" defaultText="Lead Management" /></h1>
          <p className="text-muted-foreground mt-1 leading-relaxed"><TranslatedText tKey="adm_leads_desc" defaultText="Track quotations, site survey bookings, and B2B GST tax invoices" /></p>
        </div>
        <Link href="/admin/wizard" className="shrink-0">
          <Button className="w-full sm:w-auto h-auto py-2.5 px-4 whitespace-normal leading-snug"><TranslatedText tKey="adm_leads_new_manual" defaultText="+ Create Manual Quote" /></Button>
        </Link>
      </div>

      {/* ── 1-Click Interactive Pipeline Tabs (Mobile Scrollable) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <Link href="/admin/leads?filter=genuine" className="shrink-0">
          <Button 
            variant={currentFilter === "genuine" ? "default" : "outline"} 
            size="sm" 
            className="h-9 px-3.5 text-xs font-semibold whitespace-nowrap leading-snug"
          >
            <TranslatedText tKey="adm_leads_tab_genuine" defaultText="Genuine Clients" /> ({genuineLeads.length})
          </Button>
        </Link>
        <Link href="/admin/leads?filter=all" className="shrink-0">
          <Button 
            variant={currentFilter === "all" ? "default" : "outline"} 
            size="sm" 
            className="h-9 px-3.5 text-xs font-semibold whitespace-nowrap leading-snug"
          >
            <TranslatedText tKey="adm_leads_tab_all" defaultText="All Pipeline" /> ({totalAllLeads})
          </Button>
        </Link>
        <Link href="/admin/leads?filter=won" className="shrink-0">
          <Button 
            variant={currentFilter === "won" ? "default" : "outline"} 
            size="sm" 
            className="h-9 px-3.5 text-xs font-semibold whitespace-nowrap leading-snug"
          >
            <TranslatedText tKey="adm_leads_tab_won" defaultText="Won / Paid" /> ({wonLeads.length})
          </Button>
        </Link>
        <Link href="/admin/leads?filter=survey" className="shrink-0">
          <Button 
            variant={currentFilter === "survey" ? "default" : "outline"} 
            size="sm" 
            className="h-9 px-3.5 text-xs font-semibold whitespace-nowrap leading-snug"
          >
            <TranslatedText tKey="adm_leads_tab_survey" defaultText="Site Surveys" /> ({surveyLeads.length})
          </Button>
        </Link>
        {testLeads.length > 0 && (
          <Link href="/admin/leads?filter=test" className="shrink-0">
            <Button 
              variant={currentFilter === "test" ? "default" : "outline"} 
              size="sm" 
              className="h-9 px-3.5 text-xs font-semibold whitespace-nowrap leading-snug border-dashed"
            >
              <TranslatedText tKey="adm_leads_tab_test" defaultText="Test Records" /> ({testLeads.length})
            </Button>
          </Link>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="min-w-0">
            <CardTitle className="leading-snug">
              {currentFilter === "genuine" ? <TranslatedText tKey="adm_leads_card_genuine" defaultText="Genuine Client Inquiries" /> : 
               currentFilter === "won" ? <TranslatedText tKey="adm_leads_card_won" defaultText="Won / Paid Deals" /> :
               currentFilter === "survey" ? <TranslatedText tKey="adm_leads_card_survey" defaultText="Site Survey Bookings" /> :
               currentFilter === "test" ? <TranslatedText tKey="adm_leads_card_test" defaultText="Test & Synthetic Records" /> : <TranslatedText tKey="adm_leads_card_all" defaultText="All Leads & Inquiries" />} 
              {" "}({displayLeads.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {currentFilter === "genuine" && testLeads.length > 0 ? (
                <TranslatedText tKey="adm_leads_sub_filter_test" defaultText="Hiding {count} test records. Open Test Records or All Pipeline tab to view them." params={{ count: String(testLeads.length) }} />
              ) : currentFilter === "test" ? (
                <TranslatedText tKey="adm_leads_sub_test_only" defaultText="Displaying synthetic and verification test records." />
              ) : (
                <TranslatedText tKey="adm_leads_sub_showing" defaultText="Showing {count} lead records." params={{ count: String(displayLeads.length) }} />
              )}
            </p>
          </div>
        </CardHeader>
        <CardContent>
          {displayLeads.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-muted-foreground text-sm"><TranslatedText tKey="adm_leads_empty_tab" defaultText="No leads found for this filter tab." /></p>
              <div className="mt-4">
                <Link href="/admin/leads?filter=all">
                  <Button variant="outline" size="sm"><TranslatedText tKey="adm_leads_show_all" defaultText="Show All Pipeline Leads" /></Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead><TranslatedText tKey="adm_leads_th_qid" defaultText="Quote ID" /></TableHead>
                    <TableHead><TranslatedText tKey="adm_leads_th_date" defaultText="Date" /></TableHead>
                    <TableHead><TranslatedText tKey="adm_leads_th_cust_firm" defaultText="Customer / Firm" /></TableHead>
                    <TableHead><TranslatedText tKey="adm_leads_th_mobile" defaultText="Mobile" /></TableHead>
                    <TableHead><TranslatedText tKey="adm_leads_th_type" defaultText="Type / Entity" /></TableHead>
                    <TableHead><TranslatedText tKey="adm_leads_th_value" defaultText="Value" /></TableHead>
                    <TableHead><TranslatedText tKey="adm_leads_th_status" defaultText="Status" /></TableHead>
                    <TableHead className="text-right"><TranslatedText tKey="adm_leads_th_actions" defaultText="Actions" /></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayLeads.map((lead) => {
                    const hasSurvey = !!lead.site_visit_date;
                    const isB2B = lead.is_business || !!lead.gstin || !!lead.company_name;

                    return (
                      <TableRow key={lead.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="font-mono text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                          {lead.id}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {safeFormatDate(lead.createdAt, "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium text-sm text-foreground">
                              {lead.customer_name}
                            </span>
                            {(() => {
                              const lastTouch = lead.last_contacted_at || lead.createdAt;
                              const aging = calculateInactivityAging(lastTouch, 10);
                              let ageNode: React.ReactNode = aging.badge_text;
                              if (aging.health === "never" && aging.days_inactive === null) {
                                ageNode = <TranslatedText tKey="adm_leads_age_never" defaultText="⚠️ Never Contacted" />;
                              } else if (aging.days_inactive === 0) {
                                ageNode = <TranslatedText tKey="adm_leads_age_today" defaultText="🟢 Today" />;
                              } else if (aging.days_inactive === 1) {
                                ageNode = <TranslatedText tKey="adm_leads_age_yest" defaultText="🟢 Yesterday" />;
                              } else if (aging.health === "overdue" && aging.days_inactive !== null) {
                                ageNode = <TranslatedText tKey="adm_leads_age_overdue" defaultText="🔴 {days}d Inactive" params={{ days: String(aging.days_inactive) }} />;
                              } else if (aging.health === "due" && aging.days_inactive !== null) {
                                ageNode = <TranslatedText tKey="adm_leads_age_due" defaultText="🟡 Due ({days}d)" params={{ days: String(aging.days_inactive) }} />;
                              } else if (aging.days_inactive !== null) {
                                ageNode = <TranslatedText tKey="adm_leads_age_days_ago" defaultText="🟢 {days}d ago" params={{ days: String(aging.days_inactive) }} />;
                              }
                              return (
                                <span className={`inline-block text-[9px] font-semibold px-2 py-0.5 rounded-md mt-1 border w-fit leading-snug ${aging.badge_color}`}>
                                  {ageNode}
                                </span>
                              );
                            })()}
                            {lead.company_name && lead.company_name !== lead.customer_name && (
                              <span className="text-xs text-muted-foreground font-semibold">
                                {lead.company_name}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {lead.customer_mobile || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            {lead.channel === "whatsapp" ? (
                              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-bold">
                                💬 WhatsApp
                              </Badge>
                            ) : (
                              <span className="text-[10px] text-zinc-400 font-semibold"><TranslatedText tKey="adm_leads_ch_web" defaultText="🌐 Web" /></span>
                            )}
                            {lead.competitor_quote_received && (
                              <Badge className="bg-amber-500 text-white text-[9px] font-black uppercase leading-snug">
                                <TranslatedText tKey="adm_leads_b_pm" defaultText="📸 Price Match" />
                              </Badge>
                            )}
                            {(() => {
                              const t = (lead.timeline || "").toLowerCase();
                              if (t === "asap" || t.includes("immediately") || lead.priority === "HOT") {
                                return (
                                  <Badge className="bg-red-500 hover:bg-red-600 text-white text-[9px] font-black uppercase whitespace-normal leading-snug">
                                    <TranslatedText tKey="adm_leads_tl_asap" defaultText="⚡ ASAP (1-2 Days)" />
                                  </Badge>
                                );
                              }
                              if (t === "week" || t.includes("week")) {
                                return (
                                  <Badge className="bg-orange-500 hover:bg-orange-600 text-white text-[9px] font-bold whitespace-normal leading-snug">
                                    <TranslatedText tKey="adm_leads_tl_week" defaultText="📅 Within a Week" />
                                  </Badge>
                                );
                              }
                              if (t === "month" || t.includes("month")) {
                                return (
                                  <Badge className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] font-bold whitespace-normal leading-snug">
                                    <TranslatedText tKey="adm_leads_tl_month" defaultText="🗓️ This Month" />
                                  </Badge>
                                );
                              }
                              if (t === "research" || t.includes("plan")) {
                                return (
                                  <Badge variant="outline" className="border-zinc-300 text-zinc-600 text-[9px] whitespace-normal leading-snug">
                                    <TranslatedText tKey="adm_leads_tl_plan" defaultText="🔍 Planning" />
                                  </Badge>
                                );
                              }
                              return null;
                            })()}
                            {lead.partner_id && (
                              <Badge variant="outline" className="border-purple-300 text-purple-700 bg-purple-50 text-[9px] font-bold">
                                🤝 {lead.partner_id}
                              </Badge>
                            )}
                            {isB2B ? (
                              <Badge variant="outline" className="border-blue-300 bg-blue-50 text-blue-800 text-[10px] font-bold">
                                🏢 B2B {lead.gstin ? `(${lead.gstin.slice(0, 2)}...)` : ""}
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground"><TranslatedText tKey="adm_leads_ent_personal" defaultText="👤 Personal" /></span>
                            )}
                            {hasSurvey && (
                              <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-800 text-[10px] font-bold leading-snug">
                                <TranslatedText tKey="adm_leads_survey_tag" defaultText="📅 Survey" />: {safeFormatDate(lead.site_visit_date, "dd MMM")}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-bold text-sm">
                          ₹{lead.total_payable.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            {getStatusBadge(lead.leadStatus, lead.isPaid)}
                            {lead.cash_approval_requested && !lead.cash_collection_approved && (
                              <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-bold whitespace-nowrap leading-snug">
                                <TranslatedText tKey="adm_leads_cash_req" defaultText="💵 Cash Req" />: ₹{lead.cash_requested_amount?.toLocaleString("en-IN")}
                              </Badge>
                            )}
                            {lead.cash_collection_approved && (
                              <Badge variant="outline" className="border-emerald-500 text-emerald-700 bg-emerald-50 text-[10px] font-bold whitespace-nowrap leading-snug">
                                <TranslatedText tKey="adm_leads_cash_ok" defaultText="✓ Cash Allowed" />
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/admin/leads/${lead.leadId}`}>
                              <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold leading-snug">
                                <TranslatedText tKey="adm_leads_btn_details" defaultText="Details" />
                              </Button>
                            </Link>
                            {lead.customer_mobile && (
                              <a
                                href={`https://wa.me/91${lead.customer_mobile.replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent(`Hi ${lead.customer_name},\n\nI am contacting you from TEAM CCTV regarding your quotation inquiry for a security system.\n\nAre you available for a quick discussion?`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 transition-colors"
                                aria-label="WhatsApp"
                              >
                                💬
                              </a>
                            )}
                            {lead.quoteId || lead.status === "GENERATED" || lead.status === "QUOTED" || lead.isPaid ? (
                              <a
                                href={`/api/quote/${lead.quoteId || lead.id}/download`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-medium border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap leading-snug"
                              >
                                <TranslatedText tKey="adm_leads_btn_quote" defaultText="Quote" />
                              </a>
                            ) : (
                              <Button disabled variant="outline" size="sm" className="h-8 px-2.5 text-xs font-medium opacity-50 whitespace-nowrap leading-snug">
                                <TranslatedText tKey="adm_leads_btn_quote" defaultText="Quote" />
                              </Button>
                            )}
                            {lead.isPaid && (
                              <a
                                href={`/api/invoice/${lead.quoteId || lead.id}/download`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap leading-snug"
                              >
                                {((lead as any).amount_due ?? 0) > 0 ? <TranslatedText tKey="adm_leads_btn_receipt" defaultText="Receipt" /> : <TranslatedText tKey="adm_leads_btn_invoice" defaultText="Invoice" />}
                              </a>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
