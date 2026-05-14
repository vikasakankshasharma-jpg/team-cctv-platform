import { requireAdmin } from "@/lib/auth-server";
import { adminDb } from "@/lib/firebase-admin";
import { TrendingUp } from "lucide-react";
import type { Lead, PricingResult } from "@/types";
import { ReportsClient } from "@/components/admin/ReportsClient";
import { PageHeader } from "@/components/admin/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics & Transactions | Intelligence Hub",
  description: "Deep dive into sales trends, conversion metrics, and transaction ledgers.",
};

export const dynamic = "force-dynamic";

export default async function ReportsAdminPage() {
  await requireAdmin();

  // 1. Fetch recent Leads (up to 500 to cover pipeline metrics)
  const leadsSnapshot = await adminDb.collection("leads")
    .orderBy("created_at", "desc")
    .limit(500)
    .get();

  const allLeads = leadsSnapshot.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      ...d,
      created_at: (d.created_at as any)?.toDate?.()?.toISOString() || d.created_at || null,
      updated_at: (d.updated_at as any)?.toDate?.()?.toISOString() || d.updated_at || null,
    } as Lead;
  });

  // 2. Fetch active products
  const productsSnapshot = await adminDb.collection("products").where("is_active", "==", true).get();
  const allProducts = productsSnapshot.docs.map(doc => {
    const d = doc.data();
    return {
      id: doc.id,
      ...d,
      created_at: (d.created_at as any)?.toDate?.()?.toISOString() || d.created_at || null,
      updated_at: (d.updated_at as any)?.toDate?.()?.toISOString() || d.updated_at || null,
    };
  });

  // 3. Fetch promoters
  const promotersSnapshot = await adminDb.collection("promoters").get();
  const promoterMap: Record<string, { name: string, business_name?: string }> = {};
  promotersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    promoterMap[doc.id] = { name: data.name, business_name: data.business_name };
  });

  // 4. Parallel fetch the latest quote for all leads that have a quotation generated
  const reportEntries: { lead: Lead; quote: PricingResult | null }[] = [];
  
  const fetchPromises = allLeads.map(async (leadData) => {
    let quoteData: PricingResult | null = null;
    
    // If the lead has advanced beyond 'new' or 'contacted', they likely have quotes
    if (leadData.status !== "new" && leadData.status !== "contacted") {
      const quotesSnapshot = await adminDb.collection("leads").doc(leadData.id!).collection("quotes")
        .orderBy("created_at", "desc")
        .limit(1)
        .get();
      
      if (!quotesSnapshot.empty) {
        quoteData = quotesSnapshot.docs[0].data() as PricingResult;
      }
    }
    
    return { lead: leadData, quote: quoteData };
  });

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
    <div className="space-y-10 animate-in fade-in duration-700">
      <ReportsClient 
        data={reportEntries} 
        products={allProducts as any[]}
        promoters={Object.entries(promoterMap).map(([id, p]) => ({ id, ...p }))}
      />
    </div>
  );
}
