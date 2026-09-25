import { adminDb } from "@/lib/firebase-admin";
import { notFound } from "next/navigation";
import TrackingClient from "./TrackingClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Track Installation & Quotation | TEAM CCTV",
  description: "Track your CCTV quotation, installation progress, and download invoices securely.",
};

export const dynamic = "force-dynamic";

export default async function CustomerTrackingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) notFound();

  let lead: any = null;
  let quote: any = null;
  let job: any = null;
  let invoice: any = null;

  // 1. Try finding lead by ID in "leads" collection
  const leadDoc = await adminDb.collection("leads").doc(id).get();

  if (leadDoc.exists) {
    lead = { id: leadDoc.id, ...leadDoc.data() };
  } else {
    // 2. Fallback: Check if the ID provided is actually a Quote ID in root "quotes"
    let qDoc = await adminDb.collection("quotes").doc(id).get();
    if (!qDoc.exists) {
      // Try case-insensitive / uppercase
      qDoc = await adminDb.collection("quotes").doc(id.toUpperCase()).get();
    }

    if (qDoc.exists) {
      quote = { id: qDoc.id, ...qDoc.data() };
      const associatedLeadId = quote.lead_id || quote.leadId;

      if (associatedLeadId) {
        const associatedLeadDoc = await adminDb.collection("leads").doc(associatedLeadId).get();
        if (associatedLeadDoc.exists) {
          lead = { id: associatedLeadDoc.id, ...associatedLeadDoc.data() };
        }
      }

      // If still no lead, synthesize lead metadata from quote
      if (!lead) {
        lead = {
          id: quote.id,
          customer_name: quote.customer_name || quote.billing_details?.customer_name || "Valued Customer",
          mobile_number: quote.customer_mobile || quote.billing_details?.phone || "",
          status: quote.status === "BOOKED" || quote.status === "PAID" ? "booked" : (quote.status?.toLowerCase() || "quoted"),
          payment_status: quote.payment_status || (quote.status === "BOOKED" ? "advance_paid" : quote.status === "PAID" ? "paid" : "pending"),
          booking_amount: quote.booking_amount || (quote.status === "BOOKED" ? 500 : 0),
          amount_paid: quote.amount_paid || (quote.status === "BOOKED" ? 500 : 0),
          amount_due: quote.amount_due || (quote.total_payable ? quote.total_payable - (quote.amount_paid || 0) : 0),
          total_payable: quote.total_payable || quote.pricingSnapshot?.total_payable || 0,
          address: quote.address || {
            street: quote.billing_details?.address_line1 || "",
            city: quote.billing_details?.city || "Jaipur",
            pincode: quote.billing_details?.pincode || "",
            full_address: quote.billing_details?.address_line1 ? `${quote.billing_details.address_line1}, ${quote.billing_details.city || ''}` : "",
          },
          latest_quote_id: quote.id,
        };
      }
    } else {
      // 3. Check if ID is an Invoice ID
      const invDoc = await adminDb.collection("invoices").doc(id).get();
      if (invDoc.exists) {
        invoice = { id: invDoc.id, ...invDoc.data() };
        const qId = invoice.quote_id || invDoc.id;
        const qSnap = await adminDb.collection("quotes").doc(qId).get();
        if (qSnap.exists) {
          quote = { id: qSnap.id, ...qSnap.data() };
        }
        const lId = invoice.lead_id || quote?.lead_id;
        if (lId) {
          const lSnap = await adminDb.collection("leads").doc(lId).get();
          if (lSnap.exists) {
            lead = { id: lSnap.id, ...lSnap.data() };
          }
        }
      }
    }
  }

  if (!lead && !quote) {
    notFound();
  }

  // 4. Resolve Associated Quote if not already loaded
  if (!quote && lead) {
    const candidateQuoteId = lead.won_quote_id || lead.latest_quote_id || lead.last_quote_id;

    if (candidateQuoteId) {
      // Check root quotes collection first
      const rootQDoc = await adminDb.collection("quotes").doc(candidateQuoteId).get();
      if (rootQDoc.exists) {
        quote = { id: rootQDoc.id, ...rootQDoc.data() };
      } else {
        // Check subcollection
        const subQDoc = await adminDb.collection("leads").doc(lead.id).collection("quotes").doc(candidateQuoteId).get();
        if (subQDoc.exists) {
          quote = { id: subQDoc.id, ...subQDoc.data() };
        }
      }
    }

    // If still null, query root quotes collection by lead_id or customer_mobile
    if (!quote) {
      const qByLeadSnap = await adminDb
        .collection("quotes")
        .where("lead_id", "==", lead.id)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get()
        .catch(async () => {
          return adminDb.collection("quotes").where("lead_id", "==", lead.id).limit(1).get();
        });

      if (!qByLeadSnap.empty) {
        quote = { id: qByLeadSnap.docs[0].id, ...qByLeadSnap.docs[0].data() };
      } else if (lead.mobile_number) {
        const qByMobileSnap = await adminDb
          .collection("quotes")
          .where("customer_mobile", "in", [lead.mobile_number, `+91${lead.mobile_number}`])
          .limit(1)
          .get();
        if (!qByMobileSnap.empty) {
          quote = { id: qByMobileSnap.docs[0].id, ...qByMobileSnap.docs[0].data() };
        }
      }
    }
  }

  // 5. Find Associated Job to get live dispatch / installer status
  const leadLookupId = lead?.id || id;
  const quoteLookupId = quote?.id || id;

  const [jobByLead, jobByQuote] = await Promise.all([
    adminDb.collection("jobs").where("lead_id", "==", leadLookupId).limit(1).get(),
    adminDb.collection("jobs").where("quote_id", "==", quoteLookupId).limit(1).get(),
  ]);

  if (!jobByLead.empty) {
    job = { id: jobByLead.docs[0].id, ...jobByLead.docs[0].data() };
  } else if (!jobByQuote.empty) {
    job = { id: jobByQuote.docs[0].id, ...jobByQuote.docs[0].data() };
  }

  // 6. Find Invoice Document if not already loaded
  if (!invoice && quoteLookupId) {
    const invDoc = await adminDb.collection("invoices").doc(quoteLookupId).get();
    if (invDoc.exists) {
      invoice = { id: invDoc.id, ...invDoc.data() };
    }
  }

  return (
    <TrackingClient 
      lead={JSON.parse(JSON.stringify(lead))} 
      job={job ? JSON.parse(JSON.stringify(job)) : null}
      quote={quote ? JSON.parse(JSON.stringify(quote)) : null}
      invoice={invoice ? JSON.parse(JSON.stringify(invoice)) : null}
    />
  );
}
