import { adminDb } from "../firebase-admin";
import { COLLECTIONS, SUBCOLLECTIONS } from "../constants";
import { WhatsAppSession } from "../../types/whatsapp";
import { ConfiguratorSelection } from "../../types";
import { calculatePricing } from "../pricing-engine";
import { MessageBuilder } from "./message-builder";

export async function generateAndSendWhatsAppQuote(phone: string, session: WhatsAppSession) {
  try {
    // 1. Fetch data required for pricing
    // We'll use the admin DB to fetch the products, addons, and settings
    const [productsSnap, addonsSnap, settingsSnap] = await Promise.all([
      adminDb.collection(COLLECTIONS.PRODUCTS).where("is_active", "==", true).get(),
      adminDb.collection(COLLECTIONS.ADDONS).where("is_active", "==", true).get(),
      adminDb.collection(COLLECTIONS.SETTINGS).doc("app_config").get()
    ]);

    const products = productsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const addons = addonsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const settings = settingsSnap.data() as any;

    if (!settings) throw new Error("Settings not found");

    // 2. Prepare ConfiguratorSelection
    const selection = session.wizard_answers as ConfiguratorSelection;
    // ensure fallback defaults
    if (!selection.picture_quality) selection.picture_quality = "very_clear";

    // 3. Calculate Pricing
    const quote = calculatePricing({
      selection,
      products,
      addons,
      settings,
      cablingDone: false // Ask this in the future if needed
    });

    if (quote.error) {
       console.error("Quote error:", quote.error_message);
       // Send error message
       await sendMsg(MessageBuilder.text(phone, `Sorry, we couldn't configure a system with those parameters: ${quote.error_message}. Please adjust your requirements.`));
       return;
    }

    // 4. Save to Leads & Quotes
    // Create a lead if it doesn't exist
    let leadId = session.lead_id;
    if (!leadId) {
      const newLead = {
        customer_name: "WhatsApp Customer",
        mobile_number: phone.replace("whatsapp:+", "").replace("+", ""),
        property_type: selection.property_type || "home",
        technology_choice: selection.technology || "IP",
        cabling_done: false,
        wizard_answers: selection,
        status: "quoted",
        created_at: new Date(),
        updated_at: new Date(),
      };
      const leadRef = await adminDb.collection(COLLECTIONS.LEADS).add(newLead);
      leadId = leadRef.id;
      session.lead_id = leadId;
      
      // Update session
      await adminDb.collection(COLLECTIONS.WHATSAPP_SESSIONS).doc(phone).update({ lead_id: leadId });
    }

    // Save Quote
    const quoteRef = adminDb.collection(COLLECTIONS.LEADS).doc(leadId).collection(SUBCOLLECTIONS.QUOTES).doc();
    const newQuote = {
       ...quote,
       id: quoteRef.id,
       created_at: new Date()
    };
    await quoteRef.set(newQuote);

    // Update session quote id & state
    session.quote_id = quoteRef.id;
    session.state = "QUOTE_SENT";
    await adminDb.collection(COLLECTIONS.WHATSAPP_SESSIONS).doc(phone).update({ 
       quote_id: quoteRef.id,
       state: "QUOTE_SENT"
    });

    // 5. Send PDF & Follow-up
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cctvquotation.com";
    const pdfLink = `${baseUrl}/api/quote/${quoteRef.id}/download`;

    await sendMsg(MessageBuilder.document(
       phone, 
       pdfLink, 
       `Here is your official PDF Quotation! \n\nTotal: ₹${quote.total_payable.toLocaleString('en-IN')} (Incl. GST)\n\nReview the document for a full breakdown.`,
       `TEAM_CCTV_Quotation_${quoteRef.id}.pdf`
    ));

    // Send interactive follow up
    await sendMsg(MessageBuilder.buttons(phone, "Would you like to proceed with this quotation, or make changes?", [
        { id: "action_accept", title: "Looks Good ✅" },
        { id: "action_change_cams", title: "Change Cameras" },
        { id: "action_change_tech", title: "Change Tech (IP/HD)" }
    ]));

  } catch (error) {
    console.error("Dispatch Error:", error);
    await sendMsg(MessageBuilder.text(phone, "Sorry, there was an issue generating your quotation. Please try again later."));
  }
}

async function sendMsg(msg: any) {
  const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID;
  const whatsappToken = process.env.WHATSAPP_TOKEN;
  if (!whatsappPhoneId || !whatsappToken) return;
  await fetch(`https://graph.facebook.com/v17.0/${whatsappPhoneId}/messages`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${whatsappToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(msg),
  });
}
