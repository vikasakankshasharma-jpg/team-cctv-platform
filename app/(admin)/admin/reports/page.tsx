import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { TrendingUp } from "lucide-react";
import type { Lead, PricingResult } from "@/types";
import { ReportsClient } from "@/components/admin/ReportsClient";
import { PageHeader } from "@/components/admin/PageHeader";
import { FinanceSubNav } from "@/components/admin/navigation/AdminSubNav";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics & Transactions | Intelligence Hub",
  description: "Deep dive into sales trends, conversion metrics, and transaction ledgers.",
};

export const dynamic = "force-dynamic";

export default async function ReportsAdminPage() {
  await requireAdmin();

  let allLeads: Lead[] = [];
  let allProducts: any[] = [];
  const promoterMap: Record<string, { name: string, business_name?: string }> = {};

  try {
    // 1. Fetch recent Leads with limit to preserve quota
    const leadsSnapshot = await adminDb.collection("leads")
      .orderBy("created_at", "desc")
      .limit(60)
      .get();

    allLeads = leadsSnapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        created_at: (d.created_at as any)?.toDate?.()?.toISOString() || d.created_at || null,
        updated_at: (d.updated_at as any)?.toDate?.()?.toISOString() || d.updated_at || null,
        site_visit_date: (d.site_visit_date as any)?.toDate?.()?.toISOString() || d.site_visit_date || null,
        sla_breach_at: (d.sla_breach_at as any)?.toDate?.()?.toISOString() || d.sla_breach_at || null,
      } as Lead;
    });

    // 2. Fetch active products
    const productsSnapshot = await adminDb.collection("products").where("is_active", "==", true).limit(50).get();
    allProducts = productsSnapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        created_at: (d.created_at as any)?.toDate?.()?.toISOString() || d.created_at || null,
        updated_at: (d.updated_at as any)?.toDate?.()?.toISOString() || d.updated_at || null,
      };
    });

    // 3. Fetch promoters
    const promotersSnapshot = await adminDb.collection("promoters").limit(50).get();
    promotersSnapshot.docs.forEach(doc => {
      const data = doc.data();
      promoterMap[doc.id] = { name: data.name, business_name: data.business_name };
    });
  } catch (err) {
    console.warn("⚠️ Failed to load reports data from Firestore, loading local fallback snapshot:", err);
    try {
      const fs = await import("fs");
      const path = await import("path");
      const cachePath = path.resolve(process.cwd(), "lib", "leads-cache.json");
      if (fs.existsSync(cachePath)) {
        allLeads = JSON.parse(fs.readFileSync(cachePath, "utf8"));
      }
    } catch (_) {}
  }

  // 4. Batch fetch quotes only for top leads
  const fetchPromises = allLeads.slice(0, 30).map(async (leadData) => {
    let quoteData: PricingResult | null = null;
    
    if (leadData.status !== "new" && leadData.status !== "contacted" && leadData.id) {
      try {
        const quotesSnapshot = await adminDb.collection("leads").doc(leadData.id).collection("quotes")
          .orderBy("created_at", "desc")
          .limit(1)
          .get();
        
        if (!quotesSnapshot.empty) {
          const qData = quotesSnapshot.docs[0].data();
          quoteData = {
            ...qData,
            created_at: (qData.created_at as any)?.toDate?.()?.toISOString() || qData.created_at || null,
            updated_at: (qData.updated_at as any)?.toDate?.()?.toISOString() || qData.updated_at || null,
            accepted_at: (qData.accepted_at as any)?.toDate?.()?.toISOString() || qData.accepted_at || null,
            expires_at: (qData.expires_at as any)?.toDate?.()?.toISOString() || qData.expires_at || null,
          } as any;
        }
      } catch (_) {}
    }
    
    return { lead: leadData, quote: quoteData };
  });

  const reportEntries = await Promise.all(fetchPromises);

  const results = await Promise.all(fetchPromises);

  results.forEach(res => {
    const promoter = res.lead.promoter_id ? promoterMap[res.lead.promoter_id] : null;
    reportEntries.push({
      ...res,
      lead: {
        ...res.lead,
        promoter_name: promoter?.name || null,
        promoter_business: promoter?.business_name || null
      } as any
    });
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <FinanceSubNav />
      <ReportsClient 
        data={reportEntries} 
        products={allProducts as any[]}
        promoters={Object.entries(promoterMap).map(([id, p]) => ({ id, ...p }))}
      />
    </div>
  );
}
