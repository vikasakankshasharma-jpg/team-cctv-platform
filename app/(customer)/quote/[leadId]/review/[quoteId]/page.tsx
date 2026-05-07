import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { QuoteReviewClient, QuoteData } from "./QuoteReviewClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ leadId: string; quoteId: string }>
}): Promise<Metadata> {
  const { leadId, quoteId } = await params;
  
  if (leadId === "mock-e2e-lead" || leadId === "mock-lead") {
    return { title: "Quote Review | TEAM CCTV" };
  }

  const docSnap = await adminDb.collection("leads").doc(leadId).get();
  const data = docSnap.data();

  return {
    title: `Quotation for ${data?.customer_name || "Client"} | TEAM CCTV`,
    description: `Review your personalized security system quotation from TEAM CCTV.`,
  };
}

export default async function QuoteReviewPage({
  params
}: {
  params: Promise<{ leadId: string; quoteId: string }>
}) {
  const { leadId, quoteId } = await params;

  let quoteData: QuoteData | null = null;

  try {
    const leadRef = adminDb.collection("leads").doc(leadId);
    const quoteRef = leadRef.collection("quotes").doc(quoteId);

    const [leadSnap, quoteSnap] = await Promise.all([
      leadRef.get(),
      quoteRef.get()
    ]);

    if (!leadSnap.exists || !quoteSnap.exists) {
      return notFound();
    }

    const lead = leadSnap.data();
    const quote = quoteSnap.data();

    // Map Firestore schema to QuoteData
    const items = quote?.items || [];
    const addons = quote?.addons || [];
    
    // Combine items and addons into lineItems
    const lineItems = [
      ...items.map((item: any) => ({
        id: item.product_id || item.id || Math.random().toString(36).substr(2, 9),
        name: item.display_name || item.name,
        description: `Camera type: ${item.technology} | Tier: ${item.resolution_tier || 'standard'}`,
        badge: item.technology ? { label: item.technology, color: item.technology === "IP" ? "#2C5F8A" : "#0F1F3D" } : undefined,
        quantity: item.quantity || 1,
        unitPrice: item.unit_price || 0,
      })),
      ...addons.map((addon: any) => ({
        id: addon.addon_id || addon.id || Math.random().toString(36).substr(2, 9),
        name: addon.display_name || addon.name,
        description: "Add-on component",
        quantity: addon.quantity || 1,
        unitPrice: addon.price || 0,
      }))
    ];

    // Add labor/cabling if present
    if (quote && quote.labor_cost > 0) {
      lineItems.push({
        id: "install",
        name: "Professional Installation & Configuration",
        description: "Full wiring · System setup · Remote viewing app config",
        quantity: 1,
        unitPrice: quote.labor_cost,
      });
    }

    if (quote && quote.cabling_cost > 0) {
      lineItems.push({
        id: "cable",
        name: "Cabling & Conduit (Estimated)",
        description: "PVC conduit · Junction boxes · Cable ties",
        quantity: 1,
        unitPrice: quote.cabling_cost,
      });
    }

    quoteData = {
      id: quoteId,
      leadId: leadId,
      quoteNumber: quote?.quote_number || quoteId.slice(0, 8).toUpperCase(),
      status: quote?.status || "pending",
      issuedAt: quote?.created_at?.toDate?.().toISOString() || new Date().toISOString(),
      validUntil: quote?.valid_until || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      customer: {
        name: lead?.customer_name || "Valued Customer",
        phone: lead?.mobile_number || "N/A",
        email: lead?.email || "",
      },
      installationAddress: lead?.address ? `${lead.address.building_no || ''} ${lead.address.street || ''}, ${lead.address.area || ''}, ${lead.address.city || ''} - ${lead.address.pincode || ''}` : "Address pending",
      propertyType: lead?.property_type || "Residential",
      propertyDetail: lead?.wizard_answers ? JSON.stringify(lead.wizard_answers) : "",
      siteVisitDate: lead?.site_visit_date || "",
      lineItems,
      gstPercent: quote?.gst_rate || 18,
      advancePercent: 30, // Example static default
      companyGstin: "08AABCT1234A1ZS",
      notes: "This quotation is valid for 14 days from the date of issue. Prices are subject to change after expiry. Payment by bank transfer, UPI, or cheque accepted.",
    };

    // Essential for passing Server component data to Client Component
    const { serializeDoc } = await import("@/lib/serialize");
    quoteData = serializeDoc(quoteData);

  } catch (err) {
    console.error("Error fetching quote for review:", err);
    return notFound();
  }

  if (!quoteData) return notFound();

  return <QuoteReviewClient quote={quoteData} />;
}
