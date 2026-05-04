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
  // Fetch Leads with status "won"
  const leadsSnapshot = await adminDb.collection("leads")
    .where("status", "==", "won")
    .limit(200) // Increase limit since we'll sort manually
    .get();

  // Sort by created_at DESC in-memory to bypass index requirements
  const sortedDocs = [...leadsSnapshot.docs].sort((a, b) => {
    const timeA = (a.data().created_at as any)?.seconds || 0;
    const timeB = (b.data().created_at as any)?.seconds || 0;
    return timeB - timeA;
  }).slice(0, 100); // Keep only the latest 100

  const reportEntries: { lead: Lead; quote: PricingResult }[] = [];

  // Parallel fetch the latest quote for each won lead
  const fetchPromises = sortedDocs.map(async (doc) => {
    const leadData = { id: doc.id, ...doc.data() } as Lead;
    
    // Fetch the most recent quote from the subcollection
    const quotesSnapshot = await doc.ref.collection("quotes")
      .orderBy("created_at", "desc")
      .limit(1)
      .get();
    
    if (!quotesSnapshot.empty) {
      const quoteData = quotesSnapshot.docs[0].data() as PricingResult;
      return { lead: leadData, quote: quoteData };
    }
    return null;
  });

  const results = await Promise.all(fetchPromises);
  
  // Fetch all active promoters to join data
  const promotersSnapshot = await adminDb.collection("promoters").get();
  const promoterMap: Record<string, { name: string, business_name?: string }> = {};
  promotersSnapshot.docs.forEach(doc => {
    const data = doc.data();
    promoterMap[doc.id] = { name: data.name, business_name: data.business_name };
  });

  results.forEach(res => {
    if (res) {
      const promoter = res.lead.promoter_id ? promoterMap[res.lead.promoter_id] : null;
      reportEntries.push({
        ...res,
        lead: {
          ...res.lead,
          promoter_name: promoter?.name || null,
          promoter_business: promoter?.business_name || null
        }
      });
    }
  });

  // Calculate Aggregates
  const totalQuoteValue = reportEntries.reduce((acc, curr) => acc + curr.quote.total_payable, 0);
  const avgQuoteValue = reportEntries.length > 0 ? Math.round(totalQuoteValue / reportEntries.length) : 0;
  
  const ipCount = reportEntries.filter(e => e.lead.technology_choice === 'IP').length;
  const hdCount = reportEntries.filter(e => e.lead.technology_choice === 'HD').length;

  // Find dominant add-on
  const addonFrequency: Record<string, number> = {};
  reportEntries.forEach(e => {
    e.quote.addons.forEach(addon => {
      addonFrequency[addon.display_name] = (addonFrequency[addon.display_name] || 0) + 1;
    });
  });

  let topAddonName = "N/A";
  let topAddonPercent = "0%";
  
  const sortedAddons = Object.entries(addonFrequency).sort((a, b) => b[1] - a[1]);
  if (sortedAddons.length > 0 && reportEntries.length > 0) {
    topAddonName = sortedAddons[0][0];
    topAddonPercent = `${Math.round((sortedAddons[0][1] / reportEntries.length) * 100)}%`;
  }

  // 3. Calculate Revenue Trend (Last 14 Days)
  const revenueTrend: Record<string, number> = {};
  const today = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    revenueTrend[d.toISOString().split('T')[0]] = 0;
  }

  reportEntries.forEach(e => {
    const dateStr = new Date((e.lead.created_at as any)?.seconds * 1000).toISOString().split('T')[0];
    if (revenueTrend[dateStr] !== undefined) {
      revenueTrend[dateStr] += e.quote.total_payable;
    }
  });

  const aggregates = {
    avgQuoteValue,
    ipCount,
    hdCount,
    topAddon: { name: topAddonName, percentage: topAddonPercent },
    revenueTrend: Object.entries(revenueTrend).map(([date, value]) => ({ date, value }))
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <PageHeader 
        icon={TrendingUp} 
        title="Sales Analytics" 
        description="Deep dive into revenue trends, technology saturation, and conversion metrics."
        badge={`${reportEntries.length} Transactions`}
      />
      <ReportsClient 
        data={reportEntries} 
        aggregates={aggregates} 
      />
    </div>
  );
}
