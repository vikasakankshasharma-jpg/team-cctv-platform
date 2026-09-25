import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import { QuoteReviewClient, QuoteData } from "./QuoteReviewClient";
import type { Metadata } from "next";
import { serializeDoc } from "@/lib/serialize";

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

  if (!adminDb) return { title: "Quote Review | TEAM CCTV" };

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
    if (leadId === "mock-lead" || leadId === "mock-e2e-lead" || !adminDb) {
      quoteData = {
        id: quoteId,
        leadId: leadId,
        quoteNumber: "MOCK-1234",
        status: "pending",
        issuedAt: new Date().toISOString(),
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        customer: {
          name: "Test User",
          phone: "9999999999",
          email: "test@example.com",
        },
        installationAddress: "Mock Address, India - 110001",
        propertyType: "Residential",
        propertyDetail: "",
        siteVisitDate: "",
        lineItems: [
          { id: "cam", name: "2MP Smart Camera", description: "Standard IP Camera", quantity: 4, unitPrice: 2800 },
          { id: "nvr", name: "4-Ch NVR", description: "Smart IP Recorder", quantity: 1, unitPrice: 4500 },
          { id: "hdd", name: "1TB HDD", description: "Surveillance Storage", quantity: 1, unitPrice: 3200 },
          { id: "install", name: "Installation", description: "Pro Setup", quantity: 4, unitPrice: 1000 },
        ],
        gstPercent: 18,
        advancePercent: 30,
        companyGstin: "08AABCT1234A1ZS",
        version: 1,
        isRevision: false,
        notes: "Mock quotation for testing.",
      };
    } else {
      const leadRef = adminDb.collection("leads").doc(leadId);
      const quoteRef = leadRef.collection("quotes").doc(quoteId);

      const [leadSnap, quoteSnap] = await Promise.all([
        leadRef.get(),
        quoteRef.get()
      ]);

      if (leadSnap.exists && quoteSnap.exists) {
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
            description: item.technology ? `Camera type: ${item.technology} | Tier: ${item.resolution_tier || 'standard'}` : "",
            badge: item.technology ? { label: item.technology, color: item.technology === "IP" ? "#2C5F8A" : "#0F1F3D" } : undefined,
            quantity: item.qty || item.quantity || 1,
            unitPrice: item.unit_price || 0,
          })),
          ...addons.map((addon: any) => ({
            id: addon.addon_id || addon.id || Math.random().toString(36).substr(2, 9),
            name: addon.display_name || addon.name,
            description: "Add-on component",
            quantity: addon.qty || addon.quantity || 1,
            unitPrice: addon.price || 0,
          }))
        ];

        if (quote?.negotiated_discount) {
          lineItems.push({
            id: "negotiated_discount",
            name: "Special Discount",
            description: "Salesperson applied discount",
            badge: { label: "Discount", color: "#EF4444" },
            quantity: 1,
            unitPrice: -quote.negotiated_discount
          });
        }

        // Add labor/cabling if present
        // NOTE: calculatePricing already adds labor and cabling into the `items` array.
        // We do not need to manually push them again, otherwise we double-count them.

        const rawInstall = quote?.billing_details?.address_line1 
          ? `${quote.billing_details.address_line1}, ${quote.billing_details.city || ''} ${quote.billing_details.pincode || ''}`
          : (lead?.address?.street ? `${lead.address.building_no || ''} ${lead.address.street || ''}, ${lead.address.area || ''}, ${lead.address.city || ''} - ${lead.address.pincode || ''}` : (quote?.installationAddress || ""));
        const cleanInstallAddress = (rawInstall.toLowerCase().includes("address pending") || rawInstall.toLowerCase() === "pending") ? "" : rawInstall;

        const rawLine1 = quote?.billing_details?.address_line1 || lead?.address?.street || lead?.address?.full_address || "";
        const cleanLine1 = (rawLine1.toLowerCase().includes("address pending") || rawLine1.toLowerCase() === "pending") ? "" : rawLine1;

        quoteData = {
          id: quoteId,
            leadId: leadId,
            quoteNumber: quote?.quote_number || quoteId.slice(0, 8).toUpperCase(),
            status: quote?.status || "pending",
            issuedAt: quote?.created_at?.toDate?.().toISOString() || new Date().toISOString(),
            validUntil: quote?.valid_until || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            customer: {
              name: quote?.billing_details?.customer_name || quote?.customer_name || lead?.customer_name || "Valued Customer",
              phone: quote?.billing_details?.phone || quote?.customer_mobile || lead?.mobile_number || "N/A",
              email: quote?.billing_details?.email || quote?.customer_email || lead?.email || "",
            },
            installationAddress: cleanInstallAddress,
            propertyType: lead?.property_type || "Residential",
            propertyDetail: lead?.wizard_answers ? JSON.stringify(lead.wizard_answers) : "",
            siteVisitDate: lead?.site_visit_date || "",
            lineItems,
            gstPercent: quote?.gst_rate || 18,
            advancePercent: quote?.advance_percent || 30, 
            companyGstin: "08AABCT1234A1ZS",
            billing_details: {
              is_business: !!(quote?.billing_details?.is_business ?? (lead?.is_b2b || quote?.company_name || quote?.gstin || quote?.gst_number || lead?.gst_number)),
              company_name: quote?.billing_details?.company_name || quote?.company_name || lead?.company_name || "",
              gstin: quote?.billing_details?.gstin || quote?.gst_number || lead?.gst_number || "",
              customer_name: quote?.billing_details?.customer_name || lead?.customer_name || quote?.customer_name || "",
              phone: quote?.billing_details?.phone || lead?.mobile_number || quote?.customer_mobile || "",
              email: quote?.billing_details?.email || lead?.email || "",
              address_line1: cleanLine1,
              address_line2: quote?.billing_details?.address_line2 || lead?.address?.landmark1 || "",
              city: quote?.billing_details?.city || lead?.address?.city || "Jaipur",
              state: quote?.billing_details?.state || lead?.address?.state || "Rajasthan",
              state_code: quote?.billing_details?.state_code || "08",
              pincode: quote?.billing_details?.pincode || lead?.address?.pincode || "",
              coordinates: quote?.billing_details?.coordinates || lead?.address?.coordinates || null,
              google_maps_link: quote?.billing_details?.google_maps_link || lead?.address?.map_url || "",
            },
          version: quote?.version || 1,
          isRevision: !!quote?.is_revision,
          revisionNotes: quote?.revision_notes,
          notes: "This quotation is valid for 14 days from the date of issue. Prices are subject to change after expiry.",
        };
      } else {
        return notFound();
      }
    }

    if (!quoteData) return notFound();

    // Essential for passing Server component data to Client Component
    quoteData = serializeDoc(quoteData);

  } catch (err) {
    console.error("Error fetching quote for review:", err);
    return notFound();
  }

  return <QuoteReviewClient quote={quoteData} />;
}
