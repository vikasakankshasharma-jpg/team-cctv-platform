import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    if (!quoteId) {
      return NextResponse.json({ success: false, error: "Quote ID required" }, { status: 400 });
    }

    let quoteDoc = await adminDb.collection("quotes").doc(quoteId).get();
    let leadData: any = null;

    if (!quoteDoc.exists) {
      // Look in subcollection
      const quotesSnap = await adminDb.collectionGroup("quotes").get();
      const found = quotesSnap.docs.find((d: any) => d.id === quoteId);
      if (found) {
        quoteDoc = found as any;
      }
    }

    if (!quoteDoc.exists) {
      return NextResponse.json({ success: false, error: "Quote not found" }, { status: 404 });
    }

    const quoteData = quoteDoc.data() as any;

    if (quoteDoc.ref?.parent?.parent) {
      try {
        const leadSnap = await quoteDoc.ref.parent.parent.get();
        if (leadSnap.exists) {
          leadData = leadSnap.data();
        }
      } catch (e) {
        console.warn("Lead fetch error in billing GET:", e);
      }
    } else if (quoteData.leadId || quoteData.lead_id) {
      try {
        const leadSnap = await adminDb.collection("leads").doc(quoteData.leadId || quoteData.lead_id).get();
        if (leadSnap.exists) {
          leadData = leadSnap.data();
        }
      } catch (e) {
        console.warn("Lead fetch error in billing GET:", e);
      }
    }

    const billingDetails = quoteData.billing_details || leadData?.billing_details || {
      is_business: !!(leadData?.is_b2b || quoteData.is_b2b || quoteData.gst_number || leadData?.gst_number),
      company_name: quoteData.company_name || leadData?.company_name || "",
      gstin: quoteData.gstin || quoteData.gst_number || leadData?.gst_number || "",
      customer_name: quoteData.customer_name || leadData?.customer_name || "",
      phone: quoteData.customer_mobile || leadData?.mobile_number || "",
      email: quoteData.customer_email || leadData?.email || "",
      address_line1: leadData?.address?.street || leadData?.address?.full_address || quoteData.installationAddress || "",
      address_line2: leadData?.address?.landmark1 || "",
      city: leadData?.address?.city || quoteData.requirementSnapshot?.city || "",
      state: leadData?.address?.state || "Rajasthan",
      state_code: "08",
      pincode: leadData?.address?.pincode || quoteData.requirementSnapshot?.lead_pincode || "",
    };

    return NextResponse.json({
      success: true,
      billingDetails,
    });
  } catch (error: any) {
    console.error("Error fetching billing details:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const body = await request.json();
    const { billingDetails } = body;

    if (!quoteId || !billingDetails) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    // Format & Validate GSTIN if provided
    let formattedGstin = billingDetails.gstin ? billingDetails.gstin.trim().toUpperCase() : "";
    if (billingDetails.is_business && formattedGstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstinRegex.test(formattedGstin)) {
        return NextResponse.json({
          success: false,
          error: "Invalid 15-digit GSTIN format. Example: 08AABCT1234A1ZS",
        }, { status: 400 });
      }
    }

    const stateCode = formattedGstin ? formattedGstin.substring(0, 2) : (billingDetails.state_code || "08");

    const sanitizedBilling = {
      is_business: Boolean(billingDetails.is_business),
      company_name: billingDetails.company_name?.trim() || "",
      gstin: formattedGstin,
      pan: formattedGstin ? formattedGstin.substring(2, 12) : (billingDetails.pan?.trim().toUpperCase() || ""),
      customer_name: billingDetails.customer_name?.trim() || "",
      phone: billingDetails.phone?.trim() || "",
      email: billingDetails.email?.trim() || "",
      address_line1: billingDetails.address_line1?.trim() || "",
      address_line2: billingDetails.address_line2?.trim() || "",
      city: billingDetails.city?.trim() || "",
      state: billingDetails.state?.trim() || "Rajasthan",
      state_code: stateCode,
      pincode: billingDetails.pincode?.trim() || "",
      coordinates: billingDetails.coordinates || null,
      google_maps_link: billingDetails.google_maps_link || (billingDetails.coordinates ? `https://maps.google.com/?q=${billingDetails.coordinates.lat},${billingDetails.coordinates.lng}` : ""),
      updated_at: new Date().toISOString(),
    };

    let quoteRef = adminDb.collection("quotes").doc(quoteId);
    let quoteSnap = await quoteRef.get();

    if (!quoteSnap.exists) {
      const quotesSnap = await adminDb.collectionGroup("quotes").get();
      const found = quotesSnap.docs.find((d: any) => d.id === quoteId);
      if (found) {
        quoteRef = found.ref as any;
        quoteSnap = found as any;
      }
    }

    if (quoteSnap.exists) {
      await quoteRef.set({
        billing_details: sanitizedBilling,
        customer_name: sanitizedBilling.customer_name || quoteSnap.data()?.customer_name,
        company_name: sanitizedBilling.company_name,
        gstin: sanitizedBilling.gstin,
        installationAddress: sanitizedBilling.address_line1 ? `${sanitizedBilling.address_line1}, ${sanitizedBilling.city} ${sanitizedBilling.pincode}` : quoteSnap.data()?.installationAddress,
        coordinates: sanitizedBilling.coordinates || null,
        google_maps_link: sanitizedBilling.google_maps_link || "",
        updated_at: serverTimestamp(),
      }, { merge: true });

      // If parent lead exists, update it too
      const leadId = quoteSnap.data()?.leadId || quoteSnap.data()?.lead_id;
      if (leadId) {
        try {
          await adminDb.collection("leads").doc(leadId).set({
            billing_details: sanitizedBilling,
            company_name: sanitizedBilling.company_name,
            gst_number: sanitizedBilling.gstin,
            address: {
              building_no: sanitizedBilling.address_line1,
              street: sanitizedBilling.address_line1,
              landmark1: sanitizedBilling.address_line2,
              city: sanitizedBilling.city,
              state: sanitizedBilling.state,
              pincode: sanitizedBilling.pincode,
              coordinates: sanitizedBilling.coordinates,
              map_url: sanitizedBilling.google_maps_link
            },
            updated_at: serverTimestamp(),
          }, { merge: true });
        } catch (leadErr) {
          console.warn("Could not update parent lead billing details:", leadErr);
        }
      }
    }

    // Also update invoice doc if already created
    const invoiceRef = adminDb.collection("invoices").doc(quoteId);
    const invoiceSnap = await invoiceRef.get();
    if (invoiceSnap.exists) {
      await invoiceRef.set({
        billing_details: sanitizedBilling,
        customer_name: sanitizedBilling.customer_name,
        company_name: sanitizedBilling.company_name,
        gstin: sanitizedBilling.gstin,
        updated_at: serverTimestamp(),
      }, { merge: true });
    }

    return NextResponse.json({
      success: true,
      message: "Billing details saved successfully",
      billingDetails: sanitizedBilling,
    });
  } catch (error: any) {
    console.error("Error saving billing details:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
