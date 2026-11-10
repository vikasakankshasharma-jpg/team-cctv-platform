import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { ApiResponse } from "@/lib/api-response";
import { checkRole } from "@/lib/rbac";
import { requireAdminApi } from "@/lib/auth-server";
import { toIsoStringSafe } from "@/lib/date-utils";
import { calculateQuotationProfitBreakup } from "@/lib/quotation-profit";
import { getOrCreateLeadQuote } from "@/lib/baseline-quote";

export async function GET(request: NextRequest) {
  try {
    try {
      await requireAdminApi();
    } catch {
      const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN"]);
      if (!isAllowed) {
        return ApiResponse.forbidden("Insufficient permissions for Profitability metrics.");
      }
    }

    const { searchParams } = new URL(request.url);
    const filterStatus = searchParams.get("status") || "all"; // "all" | "won" | "quoted"
    const filterHealth = searchParams.get("health") || "all"; // "all" | "healthy" | "subsidized" | "low_margin" | "critical"
    const filterTech = searchParams.get("technology") || "all"; // "all" | "HD" | "IP" | "Wireless"
    const searchQuery = (searchParams.get("search") || "").trim().toLowerCase();

    // 1. Fetch leads and quotes concurrently
    const [leadsSnap, quotesSnap] = await Promise.all([
      adminDb.collection("leads").orderBy("created_at", "desc").limit(100).get().catch(() => ({ docs: [] })),
      adminDb.collection("quotes").limit(100).get().catch(() => ({ docs: [] }))
    ]);

    const quotesMap = new Map<string, any>();
    quotesSnap.docs.forEach((d: any) => {
      quotesMap.set(d.id, { id: d.id, ...d.data() });
    });

    const handledIds = new Set<string>();
    const results: any[] = [];

    // 2. Process leads and resolve their authoritative quotation financials
    for (const doc of leadsSnap.docs) {
      const data = doc.data() as any;
      const leadId = doc.id;
      handledIds.add(leadId);

      const qId = data.last_quote_id || data.latest_quote_id || data.won_quote_id || data.quote_id || data.quoteId || leadId;
      if (qId) handledIds.add(qId);

      let quoteData: any = qId ? quotesMap.get(qId) : null;
      if (!quoteData) {
        quoteData = quotesMap.get(leadId);
      }

      // Check subcollection if quote wasn't in memory
      if (!quoteData && qId) {
        try {
          const subDoc = await adminDb.collection("leads").doc(leadId).collection("quotes").doc(qId).get();
          if (subDoc.exists) quoteData = { id: subDoc.id, ...subDoc.data() };
        } catch (_) {}
      }

      // Synthesize baseline if still missing
      if (!quoteData) {
        try {
          const baseline = await getOrCreateLeadQuote(leadId);
          quoteData = baseline.quoteData;
        } catch (_) {}
      }

      const isPaid = quoteData?.status === "PAID" || quoteData?.status === "BOOKED" || 
                     quoteData?.payment_status === "advance_paid" || 
                     data.payment_status === "advance_paid" ||
                     data.status === "won" || data.status === "PAID" || data.status === "BOOKED" ||
                     !!data.payment_id || !!quoteData?.payment_id || !!data.advance_paid;

      const isSiteVisit = data.status === "site_visit" || quoteData?.status === "site_visit" || !!data.site_visit_date;

      let computedStatus = isPaid ? "WON" : isSiteVisit ? "SITE_VISIT" : (data.status || quoteData?.status || "QUOTED").toUpperCase();

      const pricing = quoteData?.pricingSnapshot || data.pricingSnapshot || {
        total_payable: quoteData?.total_payable || data.total_payable || 0,
        gross_subtotal: quoteData?.gross_subtotal || data.total_payable || 0,
        items: quoteData?.items || data.items || [],
        addons: quoteData?.addons || data.addons || []
      };

      const breakup = calculateQuotationProfitBreakup(pricing);

      // Skip entries with 0 revenue unless requested
      if (breakup.overall.revenue <= 0 && breakup.overall.total_payable <= 0) {
        continue;
      }

      const customerName = data.customer_name || quoteData?.customer_name || "Walk-in Customer";
      const customerMobile = data.mobile_number || quoteData?.customer_mobile || "";
      const city = data.address?.city || data.city || quoteData?.city || "Jaipur";
      const tech = (quoteData?.technology || data.technology_choice || "HD").toUpperCase();
      const planType = quoteData?.plan_type || data.plan_type || "recommended";
      const createdAt = toIsoStringSafe(data.created_at || quoteData?.created_at) || new Date().toISOString();

      results.push({
        dealId: leadId,
        leadId,
        quoteId: quoteData?.id || qId || leadId,
        customerName,
        customerMobile,
        city,
        status: computedStatus,
        isPaid,
        technology: tech,
        planType,
        createdAt,
        period: createdAt.slice(0, 7),

        // Overall Turnkey Financials
        revenue: breakup.overall.revenue,
        totalPayable: breakup.overall.total_payable,
        grossProfit: breakup.overall.profit,
        margin: breakup.overall.margin_percent,
        costs: {
          purchase: breakup.products.cost,
          freight: 0,
          installation: breakup.services.cost,
          warrantyParts: 0,
          warrantyLabour: 0,
          amcParts: 0,
          amcLabour: 0,
          rmaOperational: 0
        },

        // Product Margin (Without Services)
        productRevenue: breakup.products.revenue,
        productCost: breakup.products.cost,
        productProfit: breakup.products.profit,
        productMarginPercent: breakup.products.margin_percent,
        productItemCount: breakup.products.item_count,

        // Services Margin (Labor & Surcharges)
        serviceRevenue: breakup.services.revenue,
        serviceCost: breakup.services.cost,
        serviceProfit: breakup.services.profit,
        serviceMarginPercent: breakup.services.margin_percent,
        serviceItemCount: breakup.services.item_count,

        // Overall Blended
        overallMarginPercent: breakup.overall.margin_percent,

        // Health Diagnosis
        healthStatus: breakup.health.status,
        healthBadge: breakup.health.badge_text,
        warnings: breakup.health.warnings,

        // Category breakdown
        categories: breakup.categories
      });
    }

    // 3. Check standalone root quotes not tied to an already handled lead
    for (const q of quotesSnap.docs) {
      const qData = q.data() as any;
      if (!handledIds.has(q.id) && !handledIds.has(qData.lead_id) && !handledIds.has(qData.leadId)) {
        handledIds.add(q.id);

        const pricing = qData.pricingSnapshot || {
          total_payable: qData.total_payable || 0,
          gross_subtotal: qData.gross_subtotal || qData.total_payable || 0,
          items: qData.items || [],
          addons: qData.addons || []
        };

        const breakup = calculateQuotationProfitBreakup(pricing);
        if (breakup.overall.revenue <= 0 && breakup.overall.total_payable <= 0) continue;

        const isPaid = qData.status === "PAID" || qData.status === "BOOKED";
        const createdAt = toIsoStringSafe(qData.createdAt || qData.created_at) || new Date().toISOString();

        results.push({
          dealId: q.id,
          leadId: qData.lead_id || qData.leadId || q.id,
          quoteId: q.id,
          customerName: qData.customer_name || "Direct Quotation",
          customerMobile: qData.customer_mobile || "",
          city: qData.city || "Jaipur",
          status: isPaid ? "WON" : (qData.status || "QUOTED").toUpperCase(),
          isPaid,
          technology: (qData.technology || "HD").toUpperCase(),
          planType: qData.plan_type || "recommended",
          createdAt,
          period: createdAt.slice(0, 7),

          revenue: breakup.overall.revenue,
          totalPayable: breakup.overall.total_payable,
          grossProfit: breakup.overall.profit,
          margin: breakup.overall.margin_percent,
          costs: {
            purchase: breakup.products.cost,
            freight: 0,
            installation: breakup.services.cost,
            warrantyParts: 0,
            warrantyLabour: 0,
            amcParts: 0,
            amcLabour: 0,
            rmaOperational: 0
          },

          productRevenue: breakup.products.revenue,
          productCost: breakup.products.cost,
          productProfit: breakup.products.profit,
          productMarginPercent: breakup.products.margin_percent,
          productItemCount: breakup.products.item_count,

          serviceRevenue: breakup.services.revenue,
          serviceCost: breakup.services.cost,
          serviceProfit: breakup.services.profit,
          serviceMarginPercent: breakup.services.margin_percent,
          serviceItemCount: breakup.services.item_count,

          overallMarginPercent: breakup.overall.margin_percent,
          healthStatus: breakup.health.status,
          healthBadge: breakup.health.badge_text,
          warnings: breakup.health.warnings,
          categories: breakup.categories
        });
      }
    }

    // 4. Sort results by createdAt descending
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // 5. Apply in-memory filtering based on user criteria
    let filtered = results;

    if (filterStatus === "won") {
      filtered = filtered.filter(d => d.isPaid || d.status === "WON");
    } else if (filterStatus === "quoted") {
      filtered = filtered.filter(d => !d.isPaid && d.status !== "WON");
    }

    if (filterHealth !== "all") {
      filtered = filtered.filter(d => d.healthStatus === filterHealth);
    }

    if (filterTech !== "all") {
      filtered = filtered.filter(d => d.technology.includes(filterTech.toUpperCase()));
    }

    if (searchQuery) {
      filtered = filtered.filter(d => 
        d.customerName.toLowerCase().includes(searchQuery) ||
        d.customerMobile.includes(searchQuery) ||
        d.dealId.toLowerCase().includes(searchQuery) ||
        d.quoteId.toLowerCase().includes(searchQuery) ||
        d.city.toLowerCase().includes(searchQuery)
      );
    }

    // 6. Compute Portfolio Aggregates across the filtered set
    let totalRevenue = 0;
    let totalPayableWithGst = 0;
    let totalGrossProfit = 0;

    let totalProductRevenue = 0;
    let totalProductCost = 0;
    let totalProductProfit = 0;

    let totalServiceRevenue = 0;
    let totalServiceCost = 0;
    let totalServiceProfit = 0;

    const healthCounts = {
      healthy: 0,
      subsidized: 0,
      low_margin: 0,
      critical: 0
    };

    for (const d of filtered) {
      totalRevenue += d.revenue;
      totalPayableWithGst += d.totalPayable;
      totalGrossProfit += d.grossProfit;

      totalProductRevenue += d.productRevenue;
      totalProductCost += d.productCost;
      totalProductProfit += d.productProfit;

      totalServiceRevenue += d.serviceRevenue;
      totalServiceCost += d.serviceCost;
      totalServiceProfit += d.serviceProfit;

      const hKey = d.healthStatus as keyof typeof healthCounts;
      if (healthCounts[hKey] !== undefined) {
        healthCounts[hKey]++;
      }
    }

    const avgProductMargin = totalProductRevenue > 0 ? Number(((totalProductProfit / totalProductRevenue) * 100).toFixed(1)) : 0;
    const avgServiceMargin = totalServiceRevenue > 0 ? Number(((totalServiceProfit / totalServiceRevenue) * 100).toFixed(1)) : 0;
    const averageMargin = totalRevenue > 0 ? Number(((totalGrossProfit / totalRevenue) * 100).toFixed(1)) : 0;

    return ApiResponse.success({
      summary: {
        totalDeals: filtered.length,
        totalRevenue: Math.round(totalRevenue),
        totalPayableWithGst: Math.round(totalPayableWithGst),
        totalGrossProfit: Math.round(totalGrossProfit),
        averageMargin,

        // Product material aggregates
        totalProductRevenue: Math.round(totalProductRevenue),
        totalProductCost: Math.round(totalProductCost),
        totalProductProfit: Math.round(totalProductProfit),
        avgProductMargin,

        // Service labor aggregates
        totalServiceRevenue: Math.round(totalServiceRevenue),
        totalServiceCost: Math.round(totalServiceCost),
        totalServiceProfit: Math.round(totalServiceProfit),
        avgServiceMargin,

        healthCounts
      },
      deals: filtered
    });

  } catch (error: any) {
    console.error("Critical error in profitability analytics API:", error);
    return ApiResponse.error(error.message || "Failed to load profitability metrics", "INTERNAL_ERROR", 500);
  }
}
