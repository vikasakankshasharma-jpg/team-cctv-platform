/**
 * @file lib/whatsapp/quote-dispatch.ts
 * @description Server-authoritative quotation generation, price range summary, and checkout dispatch for WhatsApp.
 */

import { adminDb } from "../firebase-admin";
import { COLLECTIONS, SUBCOLLECTIONS } from "../constants";
import { WhatsAppSession } from "../../types/whatsapp";
import { ConfiguratorSelection, PricingResult } from "../../types";
import { generateAllCatalogVariations, BrandPriceSummary } from "../quotation/variant-generator";
import { MessageBuilder } from "./message-builder";
import { Msg91WhatsAppProvider } from "./msg91-provider";

export async function generateAndSendPriceRanges(phone: string, session: WhatsAppSession) {
  try {
    const [productsSnap, addonsSnap, settingsSnap] = await Promise.all([
      adminDb.collection(COLLECTIONS.PRODUCTS).where("is_active", "==", true).get(),
      adminDb.collection(COLLECTIONS.ADDONS).where("is_active", "==", true).get(),
      adminDb.collection(COLLECTIONS.SETTINGS).doc("app_config").get()
    ]);

    const products = productsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const addons = addonsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const settings = settingsSnap.data() as any;

    if (!settings) throw new Error("Settings not found");

    const selection = (session.wizard_answers || {}) as ConfiguratorSelection;
    const cablingDone = session.wizard_answers?.cabling_done === true || session.wizard_answers?.cabling_status === "done";
    const totalCams = selection.camera_count || 4;
    const tech = selection.technology || "IP";
    const storageDays = selection.recording_days !== undefined ? selection.recording_days : 15;

    // Evaluate site prep surcharge flags (ladder fee for high ceilings)
    if (!selection.site_surcharge_flags && (selection.ceiling_height === "high" || selection.ceiling_height === "very_high")) {
      selection.site_surcharge_flags = { requiresLadderFee: true };
    }

    // Check for partner referral discount
    let promoterDiscount: { percent: number; flat: number } | undefined = undefined;
    const partnerId = session.partner_id || session.wizard_answers?.partner_id;
    if (partnerId) {
      try {
        const promoterSnap = await adminDb.collection(COLLECTIONS.PROMOTERS)
          .where("referral_code", "==", String(partnerId).toUpperCase().trim())
          .limit(1)
          .get();
        if (!promoterSnap.empty) {
          const pData = promoterSnap.docs[0].data();
          if (pData.is_active && pData.discount_value && pData.discount_value > 0) {
            promoterDiscount = pData.discount_type === "percent"
              ? { percent: pData.discount_value, flat: 0 }
              : { percent: 0, flat: pData.discount_value };
          }
        }
      } catch (err) {
        console.warn("Could not fetch promoter discount:", err);
      }
    }

    // Generate All Catalog Variations & Price Ranges
    const catalogResult = generateAllCatalogVariations({
      selection,
      products,
      addons,
      settings,
      cablingDone,
      promoterDiscount,
    });

    const { brandSummaries, lowestOverallQuote, totalVariationsCount } = catalogResult;

    if (brandSummaries.length === 0 || !lowestOverallQuote) {
      await sendMsg(MessageBuilder.text(phone, "Sorry, we could not find matching hardware configurations for your requirements. Our engineer will contact you shortly."));
      return;
    }

    // Cache the generated quotes into the session document for rapid selection
    const sessionRef = adminDb.collection(COLLECTIONS.WHATSAPP_SESSIONS).doc(phone);
    await sessionRef.update({
      state: "SHOW_PRICE_RANGES",
      cached_brand_summaries: brandSummaries.map(b => ({
        brandKey: b.brandKey,
        brandName: b.brandName,
        minPrice: b.minPrice,
        maxPrice: b.maxPrice,
      })),
      cached_lowest_quote: lowestOverallQuote,
    });

    // 1. Text Summary Card: All-Inclusive Brand Price Range
    const customerDisplayName = (session.customer_name && session.customer_name !== "WhatsApp Customer")
      ? ` FOR ${session.customer_name.toUpperCase()}`
      : "";
    let summaryText = `📷 *COMPLETE CCTV PRICE SUMMARY${customerDisplayName}*\n`;
    summaryText += `━━━━━━━━━━━━━━━━━━━━━\n`;
    summaryText += `📍 *Site Setup:* ${totalCams} Cameras (${formatCameraBreakdown(selection)})\n`;
    summaryText += `⚡ *Technology:* ${tech === "IP" ? "Digital IP (Best Quality)" : tech === "HD" ? "HD Analog (Lowest Cost)" : "Smart Wireless"}\n`;
    summaryText += `💾 *Storage:* ${storageDays === 0 ? "Live Viewing Only (No HDD)" : `${storageDays} Days Retention (${selection.recording_mode === "motion" ? "Motion" : "24x7"})`}\n`;
    summaryText += `🔌 *Cabling:* ${cablingDone ? "Pre-Wired Site (Fitting only)" : "Need New Cabling (~15m wire/cam incl)"}\n`;
    if (selection.broadband_status === "sim_router") {
      summaryText += `🌐 *Connectivity:* 4G SIM Wi-Fi Router Included\n`;
    }
    if (promoterDiscount) {
      summaryText += `🎁 *Partner Discount Applied:* Code ${partnerId} (${promoterDiscount.percent ? `${promoterDiscount.percent}% Off` : `₹${promoterDiscount.flat} Flat Off`})\n`;
    }
    summaryText += `✅ *All prices include:* Cameras, DVR/NVR, Storage, Cables, Connectors, Installation Labor & 18% GST (Zero Hidden Costs!)\n\n`;
    summaryText += `🏆 *ALL-INCLUSIVE BRAND PRICE SPECTRUM:*\n\n`;

    brandSummaries.forEach((b, idx) => {
      summaryText += `${idx + 1}️⃣ *${b.brandName.toUpperCase()}*\n`;
      summaryText += `   💰 *₹${b.minPrice.toLocaleString('en-IN')} to ₹${b.maxPrice.toLocaleString('en-IN')}*\n`;
      if (b.economyQuote) {
        summaryText += `   • Economy 500GB: ₹${b.economyQuote.total_payable.toLocaleString('en-IN')} (Save ₹${((b.standardQuote.total_payable || 0) - b.economyQuote.total_payable).toLocaleString('en-IN')})\n`;
      }
      summaryText += `   • Standard ${storageDays} Days (1TB+): ₹${b.standardQuote.total_payable.toLocaleString('en-IN')}\n\n`;
    });

    const webStudioUrl = session.lead_id 
      ? `https://cctvquotation.com/quote/${session.lead_id}` 
      : `https://cctvquotation.com/wizard?phone=${phone}`;

    summaryText += `━━━━━━━━━━━━━━━━━━━━━\n`;
    summaryText += `🌐 *Interactive Web Studio & 3D Viewer:*\n`;
    summaryText += `Inspect camera models, toggle hard drives, and download your official PDF quote:\n👉 ${webStudioUrl}\n\n`;
    summaryText += `🛡️ *100% Price Match Guarantee:*\n`;
    summaryText += `Already have a quote from another vendor? Reply with a PHOTO or PDF right here to beat their price by 5%-10%!`;

    await sendMsg(MessageBuilder.text(phone, summaryText));

    // 2. Interactive List Menu: Explore Brand Options
    const brandRows = brandSummaries.slice(0, 7).map(b => ({
      id: `view_brand_${b.brandKey}`,
      title: `${b.brandName} (₹${Math.round(b.minPrice / 1000)}k-₹${Math.round(b.maxPrice / 1000)}k)`.slice(0, 24),
      description: `₹${b.minPrice.toLocaleString('en-IN')} - ₹${b.maxPrice.toLocaleString('en-IN')} (${b.variations.length} packages)`.slice(0, 72)
    }));

    // Add Special Quick Action Rows
    const specialRows = [
      {
        id: "select_lowest_quote",
        title: "⚡ Best Value Quote",
        description: `Lowest price package: ₹${lowestOverallQuote.total_payable.toLocaleString('en-IN')} (${lowestOverallQuote.camera_device?.brand || "Budget"})`.slice(0, 72)
      },
      {
        id: "upload_competitor_quote",
        title: "📸 Upload Offline Quote",
        description: "Send photo/PDF of offline quote for 5%-10% price match".slice(0, 72)
      },
      {
        id: "open_web_studio",
        title: "🎨 Open 3D Web Studio",
        description: "Inspect 3D camera angles and compare in browser".slice(0, 72)
      }
    ];

    await sendMsg(MessageBuilder.list(
      phone,
      "Choose a brand below to view specific packages and lock your quotation:",
      "View Brand Packages",
      [
        { title: "Brand Packages", rows: brandRows },
        { title: "Quick Actions", rows: specialRows }
      ]
    ));

  } catch (error) {
    console.error("🔥 Error in generateAndSendPriceRanges:", error);
    await sendMsg(MessageBuilder.text(phone, "Sorry, there was an issue computing your price summary. A representative will contact you shortly."));
  }
}

export async function sendBrandVariations(phone: string, session: WhatsAppSession, brandKey: string) {
  try {
    const [productsSnap, addonsSnap, settingsSnap] = await Promise.all([
      adminDb.collection(COLLECTIONS.PRODUCTS).where("is_active", "==", true).get(),
      adminDb.collection(COLLECTIONS.ADDONS).where("is_active", "==", true).get(),
      adminDb.collection(COLLECTIONS.SETTINGS).doc("app_config").get()
    ]);

    const products = productsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const addons = addonsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const settings = settingsSnap.data() as any;

    const selection = (session.wizard_answers || {}) as ConfiguratorSelection;
    const cablingDone = session.wizard_answers?.cabling_done === true || session.wizard_answers?.cabling_status === "done";
    const reqDays = selection.recording_days !== undefined ? selection.recording_days : 15;

    if (!selection.site_surcharge_flags && (selection.ceiling_height === "high" || selection.ceiling_height === "very_high")) {
      selection.site_surcharge_flags = { requiresLadderFee: true };
    }

    let promoterDiscount: { percent: number; flat: number } | undefined = undefined;
    const partnerId = session.partner_id || session.wizard_answers?.partner_id;
    if (partnerId) {
      try {
        const promoterSnap = await adminDb.collection(COLLECTIONS.PROMOTERS)
          .where("referral_code", "==", String(partnerId).toUpperCase().trim())
          .limit(1)
          .get();
        if (!promoterSnap.empty) {
          const pData = promoterSnap.docs[0].data();
          if (pData.is_active && pData.discount_value && pData.discount_value > 0) {
            promoterDiscount = pData.discount_type === "percent"
              ? { percent: pData.discount_value, flat: 0 }
              : { percent: 0, flat: pData.discount_value };
          }
        }
      } catch (err) {
        console.warn("Could not fetch promoter discount in brand variations:", err);
      }
    }

    const catalogResult = generateAllCatalogVariations({
      selection,
      products,
      addons,
      settings,
      cablingDone,
      promoterDiscount,
    });

    const targetBrandSummary = catalogResult.brandSummaries.find(b => b.brandKey === brandKey);
    if (!targetBrandSummary) {
      await sendMsg(MessageBuilder.text(phone, "Brand packages not found. Please select another option."));
      return;
    }

    const { standardQuote, economyQuote, colorNightQuote, brandName } = targetBrandSummary;
    const storageLabel = reqDays === 0 ? "Live Viewing Only (No HDD)" : `${reqDays} Days Storage`;

    let text = `📦 *${brandName.toUpperCase()} CCTV PACKAGES*\n\n`;
    text += `1️⃣ *Standard Package (2MP Full HD - ${storageLabel})*\n`;
    text += `• Total: ₹${standardQuote.total_payable.toLocaleString('en-IN')} (Incl. 18% GST & Professional Installation)\n`;
    text += `• Hardware: ${selection.camera_count || 4}x ${techResolution(standardQuote)} Cameras (${formatCameraBreakdown(selection)}) + Central DVR/NVR + ${reqDays === 0 ? "Zero Storage" : "Surveillance HDD"}\n\n`;

    if (colorNightQuote) {
      text += `2️⃣ *Enhanced 2K ColorVu / Color Night Vision Package (3MP/5MP)*\n`;
      text += `• Total: ₹${colorNightQuote.total_payable.toLocaleString('en-IN')} (Incl. 18% GST & Installation)\n`;
      text += `• Hardware: 24/7 Full Color Night Vision + Built-in Audio Microphone + Smart Motion Detection\n\n`;
    }

    if (economyQuote) {
      text += `3️⃣ *Economy Storage Match (500GB HDD)*\n`;
      text += `• Total: ₹${economyQuote.total_payable.toLocaleString('en-IN')} (Save ₹${((standardQuote.total_payable || 0) - economyQuote.total_payable).toLocaleString('en-IN')}!)\n`;
      text += `• Hardware: Same cameras with 3-5 days basic backup\n\n`;
    }

    text += `Select your preferred variation below to freeze your quotation and receive your official PDF quotation:`;

    const variationRows = [
      { 
        id: `lock_${brandKey}_standard`, 
        title: `1. Standard 2MP Quote`.slice(0, 24), 
        description: `₹${standardQuote.total_payable.toLocaleString('en-IN')} (${storageLabel})`.slice(0, 72) 
      }
    ];

    if (colorNightQuote) {
      variationRows.push({
        id: `lock_${brandKey}_color`,
        title: `2. ColorVu 2K + Mic`.slice(0, 24),
        description: `₹${colorNightQuote.total_payable.toLocaleString('en-IN')} (Full color night vision + mic)`.slice(0, 72)
      });
    }

    if (economyQuote) {
      variationRows.push({
        id: `lock_${brandKey}_economy`,
        title: `3. Economy 500GB`.slice(0, 24),
        description: `₹${economyQuote.total_payable.toLocaleString('en-IN')} (Save ₹${((standardQuote.total_payable || 0) - economyQuote.total_payable).toLocaleString('en-IN')} with basic backup)`.slice(0, 72)
      });
    }

    variationRows.push({
      id: "back_to_brands",
      title: "← Back to All Brands".slice(0, 24),
      description: "Compare price spectrum across all brands".slice(0, 72)
    });

    await sendMsg(MessageBuilder.list(
      phone,
      text,
      "Select Package Variation",
      [
        {
          title: `${brandName} Variations`,
          rows: variationRows
        }
      ]
    ));

    // Update state & cache summaries on session for instant locking
    (session as any).cached_brand_summaries = catalogResult.brandSummaries;
    await adminDb.collection(COLLECTIONS.WHATSAPP_SESSIONS).doc(phone).update({
      state: "SHOW_BRAND_VARIATIONS",
      selected_brand: brandKey,
    });

  } catch (err) {
    console.error("🔥 Error in sendBrandVariations:", err);
  }
}

export async function finalizeAndSendQuote(phone: string, session: WhatsAppSession, chosenQuote: PricingResult) {
  try {
    let leadId = session.lead_id;
    if (!leadId) {
      const newLead = {
        customer_name: session.customer_name || "WhatsApp Customer",
        mobile_number: phone.replace(/\D/g, ""),
        channel: "whatsapp",
        status: "quoted",
        wizard_answers: session.wizard_answers,
        created_at: new Date(),
        updated_at: new Date(),
        partner_id: session.partner_id || null,
        utm_source: session.utm_source || "whatsapp",
        utm_campaign: session.utm_campaign || null,
      };
      const leadRef = await adminDb.collection(COLLECTIONS.LEADS).add(newLead);
      leadId = leadRef.id;
    } else {
      await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
        status: "quoted",
        updated_at: new Date(),
      });
    }

    // Create quote record in Firestore subcollection
    const quoteRef = adminDb.collection(COLLECTIONS.LEADS).doc(leadId).collection(SUBCOLLECTIONS.QUOTES).doc();
    const newQuote = {
      ...chosenQuote,
      id: quoteRef.id,
      lead_id: leadId,
      status: "DRAFT",
      created_at: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days validity
    };
    await quoteRef.set(newQuote);

    // Update session
    await adminDb.collection(COLLECTIONS.WHATSAPP_SESSIONS).doc(phone).update({
      lead_id: leadId,
      quote_id: quoteRef.id,
      state: "QUOTE_FROZEN",
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cctvquotation.com";
    const pdfUrl = `${baseUrl}/api/v1/leads/${leadId}/quotes/${quoteRef.id}/pdf`;

    // Send PDF document via WhatsApp
    await sendMsg(MessageBuilder.document(
      phone,
      pdfUrl,
      `📄 Here is your official GST Quotation (Quote ID: ${quoteRef.id})!\n\nTotal Payable: ₹${chosenQuote.total_payable.toLocaleString('en-IN')} (All Inclusive)\n\nReview the attached PDF for the full Bill of Materials (BOM) & warranty terms.`,
      `TEAM_CCTV_Quotation_${quoteRef.id}.pdf`
    ));

    // Send the 4 Checkout Pathways Menu
    const checkoutButtons = [
      { id: "action_pay_full", title: "💳 Pay Full (2% Off)" },
      { id: "action_book_token", title: "🔒 Book with ₹500" },
      { id: "action_book_survey", title: "📅 Free Site Visit" },
    ];

    await sendMsg(MessageBuilder.buttons(
      phone,
      "How would you like to proceed with your installation slot?",
      checkoutButtons
    ));

  } catch (err) {
    console.error("🔥 Error in finalizeAndSendQuote:", err);
  }
}

export async function handleCheckoutAction(phone: string, session: WhatsAppSession, actionId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cctvquotation.com";
    const leadId = session.lead_id;
    const quoteId = session.quote_id;

    if (!leadId || !quoteId) {
      await sendMsg(MessageBuilder.text(phone, "Please configure your quotation first before booking. Type 'Hi' to start."));
      return;
    }

    if (actionId === "action_pay_full") {
      // Create Razorpay payment link with 2% discount
      const res = await fetch(`${baseUrl}/api/payment/razorpay-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, quoteId, applyUpfrontDiscount: true })
      });
      const data = await res.json();
      if (data.short_url) {
        await sendMsg(MessageBuilder.text(
          phone,
          `🎉 *2% Upfront Discount Applied!*\n\nClick the link below to complete your payment securely via UPI (Google Pay / PhonePe / Paytm) or Cards:\n\n👉 ${data.short_url}\n\nOnce paid, your installation kit will be dispatched immediately.`
        ));
      } else {
        await sendMsg(MessageBuilder.text(phone, `Click here to complete payment: ${baseUrl}/quote/${leadId}/review/${quoteId}`));
      }

    } else if (actionId === "action_book_token") {
      // Create Razorpay ₹500 advance slot reservation token link
      const res = await fetch(`${baseUrl}/api/payment/razorpay-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, quoteId, isTokenBooking: true, amount: 500 })
      });
      const data = await res.json();
      if (data.short_url) {
        await sendMsg(MessageBuilder.text(
          phone,
          `🔒 *Reserve Your Installation Slot with ₹500 Token*\n\nPay ₹500 now to lock your technician and delivery slot. Balance 90% payable upon hardware delivery.\n\n👉 ${data.short_url}`
        ));
      } else {
        await sendMsg(MessageBuilder.text(phone, `Click here to reserve your slot: ${baseUrl}/quote/${leadId}/review/${quoteId}`));
      }

    } else if (actionId === "action_book_survey") {
      // Provide free site visit slot picker
      await sendMsg(MessageBuilder.list(
        phone,
        "Select your preferred date & time for a free on-site consultation:",
        "Select Slot",
        [
          {
            title: "Available Site Visit Slots",
            rows: [
              { id: "slot_tmw_morning", title: "Tomorrow Morning (10 AM - 1 PM)", description: "Certified engineer visits for site inspection" },
              { id: "slot_tmw_afternoon", title: "Tomorrow Afternoon (2 PM - 5 PM)", description: "Certified engineer visits for site inspection" },
              { id: "slot_day2_morning", title: "Day After Tomorrow (10 AM - 1 PM)", description: "Certified engineer visits for site inspection" },
              { id: "slot_day2_afternoon", title: "Day After Tomorrow (2 PM - 5 PM)", description: "Certified engineer visits for site inspection" },
            ]
          }
        ]
      ));
      await adminDb.collection(COLLECTIONS.WHATSAPP_SESSIONS).doc(phone).update({
        state: "BOOKING_SLOT"
      });
    }

  } catch (err) {
    console.error("🔥 Error in handleCheckoutAction:", err);
  }
}

export async function handleSlotSelection(phone: string, session: WhatsAppSession, slotId: string) {
  try {
    const leadId = session.lead_id;
    const slotMap: Record<string, { date: string; timeSlot: string }> = {
      slot_tmw_morning: { date: "Tomorrow", timeSlot: "10:00 AM - 01:00 PM" },
      slot_tmw_afternoon: { date: "Tomorrow", timeSlot: "02:00 PM - 05:00 PM" },
      slot_day2_morning: { date: "Day After Tomorrow", timeSlot: "10:00 AM - 01:00 PM" },
      slot_day2_afternoon: { date: "Day After Tomorrow", timeSlot: "02:00 PM - 05:00 PM" },
    };

    const slot = slotMap[slotId] || { date: "Upcoming", timeSlot: "10:00 AM - 01:00 PM" };

    if (leadId) {
      await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
        status: "site_visit",
        site_visit_date: slot.date,
        site_visit_time_slot: slot.timeSlot,
        updated_at: new Date(),
      });

      // Dispatch confirmation using Msg91WhatsAppProvider
      const provider = new Msg91WhatsAppProvider();
      await provider.sendSurveyConfirm({
        phone,
        customerName: session.customer_name || "Customer",
        date: slot.date,
        timeSlot: slot.timeSlot,
      });
    }

    await sendMsg(MessageBuilder.text(
      phone,
      `✅ *Free Site Visit Confirmed!*\n\n📅 Date: *${slot.date}*\n⏰ Time: *${slot.timeSlot}*\n\nA certified CCTV engineer from our nearest micro-hub has been assigned to inspect your location and verify camera mounting angles. See you then!`
    ));

    await adminDb.collection(COLLECTIONS.WHATSAPP_SESSIONS).doc(phone).update({
      state: "COMPLETED"
    });

  } catch (err) {
    console.error("🔥 Error in handleSlotSelection:", err);
  }
}

function formatCameraBreakdown(selection: any): string {
  const isPureWireless = selection.technology === "Wireless" || selection.technology === "wifi";
  const outCount = Number(selection.outdoor_camera_count) || 0;
  const inCount = Number(selection.indoor_camera_count) || 0;
  const wifiCount = Number(selection.wifi_camera_count) || 0;
  const total = Number(selection.camera_count) || (isPureWireless ? (wifiCount || (outCount + inCount) || 4) : (outCount + inCount + wifiCount || 4));

  if (isPureWireless) {
    if (outCount > 0 && inCount > 0) return `${outCount} Out + ${inCount} In Wireless`;
    return `${total} Smart Wireless`;
  }
  const parts: string[] = [];
  if (outCount > 0) parts.push(`${outCount} Out`);
  else if (inCount > 0 && wifiCount === 0) parts.push("0 Out");

  if (inCount > 0) parts.push(`${inCount} In`);
  else if (outCount > 0 && wifiCount === 0) parts.push("0 In");

  if (wifiCount > 0) parts.push(`${wifiCount} Wireless`);

  return parts.length > 0 ? parts.join(" + ") : `${total} Wired`;
}

function techResolution(quote: PricingResult): string {
  return quote.camera_device?.derivedResolution || "3MP High-Clarity";
}

async function sendMsg(msg: any) {
  const whatsappPhoneId = (process.env.WHATSAPP_PHONE_ID || process.env.WA_PHONE_NUMBER_ID || "").trim().replace(/^["']|["']$/g, '');
  const whatsappToken = (process.env.WHATSAPP_TOKEN || process.env.WA_ACCESS_TOKEN || "").trim().replace(/^["']|["']$/g, '');
  const msg91AuthKey = (process.env.MSG91_AUTH_KEY || "").trim().replace(/^["']|["']$/g, '');
  const msg91FromNumber = (process.env.MSG91_WHATSAPP_NUMBER || "").trim().replace(/^["']|["']$/g, '');
  const providerPref = (process.env.WHATSAPP_PROVIDER || "").toLowerCase().trim();

  const useMsg91 = providerPref === "msg91" || (!!msg91AuthKey && providerPref !== "meta");

  if (useMsg91 && msg91AuthKey && msg91FromNumber) {
    // Mode B (Active with MSG91): MSG91 WhatsApp Outbound API
    try {
      const msg91Payload: any = {
        integrated_number: msg91FromNumber,
        recipient_number: msg.to,
        content_type: msg.type || "text",
        payload: msg,
      };

      if (msg.type === "text" && msg.text?.body) {
        msg91Payload.text = msg.text.body;
      } else if (msg.type === "interactive" && msg.interactive) {
        msg91Payload.interactive = msg.interactive;
      } else if (msg.type === "document" && msg.document) {
        msg91Payload.document = msg.document;
      }

      const res = await fetch("https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authkey": msg91AuthKey,
        },
        body: JSON.stringify(msg91Payload),
      });
      const resText = await res.text();
      console.log(`[MSG91 quote-dispatch Outbound Response]: HTTP ${res.status}`, resText);
    } catch (e) {
      console.error("🔥 Failed to send WhatsApp message via MSG91 in quote-dispatch:", e);
    }
  } else if (whatsappPhoneId && whatsappToken) {
    // Mode A (Future with Meta Cloud API): Direct Meta WhatsApp Cloud API
    try {
      await fetch(`https://graph.facebook.com/v20.0/${whatsappPhoneId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(msg),
      });
    } catch (e) {
      console.error("🔥 Failed to send WhatsApp message via Meta Cloud API:", e);
    }
  } else {
    console.warn("⚠️ [WhatsApp Dispatch Simulated] Neither Meta Cloud API nor MSG91 credentials found. Payload:", JSON.stringify(msg, null, 2));
  }
}
