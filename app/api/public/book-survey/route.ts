import { NextResponse } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { SiteSurveySchema } from "@/lib/validators";
import { Msg91WhatsAppProvider } from "@/lib/whatsapp/msg91-provider";
import { addLeadActivity } from "@/app/actions/leads";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    
    // 1. Validate Input
    const parsed = SiteSurveySchema.omit({ 
      id: true, status: true, created_at: true, updated_at: true 
    }).parse(payload);

    const cleanPhone = parsed.customer_phone.replace(/[^0-9]/g, "").slice(-10);
    
    // 2. See if a lead already exists for this phone number
    let leadId = parsed.lead_id;
    if (!leadId) {
      const existingLeadSnap = await adminDb.collection("leads").where("phone", "==", cleanPhone).limit(1).get();
      if (!existingLeadSnap.empty) {
        leadId = existingLeadSnap.docs[0].id;
      } else {
        // Create a brand new lead since they booked a survey!
        const newLeadRef = adminDb.collection("leads").doc();
        await newLeadRef.set({
          id: newLeadRef.id,
          name: parsed.customer_name,
          phone: cleanPhone,
          address: parsed.address,
          pincode: parsed.pincode,
          status: "new",
          source: "calendar_booking",
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        leadId = newLeadRef.id;
        
        await addLeadActivity(leadId, "system", "Customer organically booked a Site Survey via the calendar.");
      }
    }

    // 3. Save the Survey
    const surveyRef = adminDb.collection("site_surveys").doc();
    await surveyRef.set({
      ...parsed,
      id: surveyRef.id,
      lead_id: leadId,
      customer_phone: cleanPhone,
      status: "pending",
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    await addLeadActivity(leadId, "system", `Customer scheduled a Site Survey for ${parsed.date} (${parsed.time_slot}).`);

    // 4. Send the MSG91 Confirmation WhatsApp!
    try {
      const msg91 = new Msg91WhatsAppProvider();
      
      const timeSlotMap: Record<string, string> = {
        "morning_10_1": "10:00 AM - 1:00 PM",
        "afternoon_2_5": "2:00 PM - 5:00 PM",
        "evening_5_7": "5:00 PM - 7:00 PM"
      };

      await msg91.sendSurveyConfirm({
        phone: cleanPhone,
        customerName: parsed.customer_name,
        date: parsed.date, // e.g. "2024-11-25"
        timeSlot: timeSlotMap[parsed.time_slot] || "TBD"
      });
    } catch (msgErr) {
      console.error("Failed to send MSG91 confirmation:", msgErr);
      // We don't fail the whole booking if WhatsApp fails
    }

    return NextResponse.json({ 
      success: true, 
      surveyId: surveyRef.id,
      leadId: leadId
    });

  } catch (error: any) {
    console.error("Book Survey Error:", error);
    return NextResponse.json({ error: error.message || "Failed to book survey" }, { status: 500 });
  }
}
