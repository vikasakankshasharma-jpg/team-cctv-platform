/**
 * @file lib/whatsapp/bot-engine.ts
 * @description Master finite state machine for TEAM CCTV WhatsApp Omnichannel Engine.
 * Features: Zero-Loss Instant Lead Capture on Message 1, 100% Website Wizard Parity,
 * Multi-Brand Price Range Summary, In-Chat Competitor Quote OCR, and 4 Checkout Pathways.
 */

import { adminDb } from "../firebase-admin";
import { COLLECTIONS } from "../constants";
import { WhatsAppBotState, WhatsAppSession } from "../../types/whatsapp";
import { MessageBuilder, WhatsAppMessagePayload } from "./message-builder";
import { 
  generateAndSendPriceRanges, 
  sendBrandVariations, 
  finalizeAndSendQuote, 
  handleCheckoutAction, 
  handleSlotSelection 
} from "./quote-dispatch";

export async function processIncomingMessage(
  from: string, 
  incomingType: "text" | "interactive" | "nfm_reply" | "location" | "image" | "document", 
  content: any,
  context?: {
    profileName?: string;
    referral?: any;
    locationCoords?: { latitude: number; longitude: number };
    mediaId?: string;
  }
) {
  const sessionRef = adminDb.collection(COLLECTIONS.WHATSAPP_SESSIONS).doc(from);
  const doc = await sessionRef.get();
  
  let session: WhatsAppSession;
  
  if (!doc.exists) {
    session = {
      phone_number: from,
      customer_name: context?.profileName || "WhatsApp Customer",
      state: "IDLE",
      wizard_answers: {},
      last_message_at: new Date(),
      created_at: new Date(),
    };
  } else {
    session = doc.data() as WhatsAppSession;
    if (context?.profileName && (!session.customer_name || session.customer_name === "WhatsApp Customer")) {
      session.customer_name = context.profileName;
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. ZERO-LOSS INSTANT LEAD CAPTURE ON MESSAGE #1
  // ──────────────────────────────────────────────────────────────────────────
  let leadId = session.lead_id;
  if (!leadId) {
    // Check if a lead already exists for this mobile number in CRM
    const cleanMobile = from.replace(/\D/g, "").slice(-10); // Last 10 digits
    const existingLeadSnap = await adminDb.collection(COLLECTIONS.LEADS)
      .where("mobile_number", "in", [cleanMobile, `91${cleanMobile}`, `+91${cleanMobile}`])
      .limit(1)
      .get();

    if (!existingLeadSnap.empty) {
      leadId = existingLeadSnap.docs[0].id;
    } else {
      // Create new Lead instantly in Firestore!
      const newLeadData: any = {
        customer_name: session.customer_name || "WhatsApp Customer",
        mobile_number: cleanMobile,
        channel: "whatsapp",
        status: "whatsapp_in_progress", // Appears immediately in Admin CRM!
        created_at: new Date(),
        updated_at: new Date(),
        wizard_answers: session.wizard_answers || {},
        utm_source: "whatsapp_inbound",
        partner_id: null,
      };

      // Check CTWA Ad referral
      if (context?.referral) {
        newLeadData.source = "click_to_whatsapp_ad";
        newLeadData.utm_source = "facebook_ad";
        newLeadData.utm_campaign = context.referral.headline || context.referral.source_id;
      }

      const newLeadRef = await adminDb.collection(COLLECTIONS.LEADS).add(newLeadData);
      leadId = newLeadRef.id;
    }

    session.lead_id = leadId;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 2. PARSE REFERRAL CODES & MARKETING CAMPAIGN KEYWORDS (e.g. "Hi P102", "Hi NEWS1")
  // ──────────────────────────────────────────────────────────────────────────
  if (incomingType === "text" && typeof content === "string") {
    const textLower = content.toLowerCase().trim();
    if (textLower.startsWith("hi") || textLower.startsWith("hello")) {
      session.state = "GREETING";
      const parts = textLower.split(" ");
      if (parts.length > 1) {
        const keyword = parts[1].toUpperCase();
        // Check if keyword matches a Partner code (starts with P, REF, or PARTNER)
        if (/^P\d+$/.test(keyword) || keyword.startsWith("REF-") || keyword.startsWith("PARTNER-")) {
          session.partner_id = keyword;
          session.utm_source = "partner_referral";
          await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
            partner_id: keyword,
            utm_source: "partner_referral",
            updated_at: new Date(),
          });
        } else {
          session.utm_source = "marketing_qr";
          session.utm_campaign = keyword;
          await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
            utm_source: "marketing_qr",
            utm_campaign: keyword,
            updated_at: new Date(),
          });
        }
      }
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3. IN-CHAT COMPETITOR QUOTE UPLOADER (Images & PDF Documents)
  // ──────────────────────────────────────────────────────────────────────────
  if (incomingType === "image" || incomingType === "document") {
    await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
      competitor_quote_received: true,
      competitor_quote_media_id: context?.mediaId || null,
      competitor_quote_received_at: new Date(),
      status: "price_match_requested",
      updated_at: new Date(),
    });

    const replyMsg = MessageBuilder.text(
      from,
      `✅ *We received your competitor's quote!*\n\nOur pricing team is analyzing it to guarantee a 5%–10% lower price match. We will send you your customized discounted quote shortly.\n\nIn the meantime, feel free to continue configuring your options below.`
    );
    await sendWhatsAppMessages([replyMsg]);
    return;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. WHATSAPP FLOW (NFM_REPLY) SHORTCUT
  // ──────────────────────────────────────────────────────────────────────────
  if (incomingType === "nfm_reply") {
    try {
      const answers = typeof content === "string" ? JSON.parse(content) : content;
      session.wizard_answers = { ...session.wizard_answers, ...answers };
      session.state = "GENERATING";
      await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
        wizard_answers: session.wizard_answers,
        updated_at: new Date(),
      });
    } catch (e) {
      console.error("NFM Parse error:", e);
    }
  }

  let replies: WhatsAppMessagePayload[] = [];
  let nextState: WhatsAppBotState = session.state;

  try {
    switch (session.state) {
      case "IDLE":
      case "GREETING":
        nextState = "ASK_PROP";
        replies.push(MessageBuilder.buttons(
          from,
          `Welcome to *TEAM CCTV*! 📷\n\nLet's build your exact, transparent CCTV quotation in under 60 seconds.\n\n*Question 1 of 9:* What type of property are you securing?`,
          [
            { id: "prop_home", title: "🏠 Home / Flat" },
            { id: "prop_office", title: "🏢 Office / Shop" },
            { id: "prop_factory", title: "🏭 Factory / Yard" }
          ]
        ));
        break;

      case "ASK_PROP":
        if (incomingType === "interactive") {
          const propMap: Record<string, string> = { prop_home: "home", prop_office: "office", prop_factory: "factory" };
          session.wizard_answers.property_type = propMap[content] || "home";
          nextState = "ASK_INSTALL_TYPE";

          replies.push(MessageBuilder.buttons(
            from,
            `*Question 2 of 9:* Is this a brand new installation or an expansion?`,
            [
              { id: "ins_new_wired", title: "✨ New Wired Setup" },
              { id: "ins_wireless", title: "📶 Smart Wireless" },
              { id: "ins_upgrade", title: "⬆️ Add to Existing" }
            ]
          ));
        } else {
          replies.push(MessageBuilder.text(from, "Please select an option using the buttons above."));
        }
        break;

      case "ASK_INSTALL_TYPE":
        if (incomingType === "interactive") {
          session.wizard_answers.installation_type = content.replace("ins_", "");
          if (content === "ins_wireless") {
            session.wizard_answers.technology = "Wireless";
            session.wizard_answers.cabling_status = "done";
          }
          nextState = "ASK_CAMERA_COUNT";

          replies.push(MessageBuilder.list(
            from,
            `*Question 3 of 9:* How many total cameras do you require?`,
            "Select Cameras",
            [
              {
                title: "Small Setup",
                rows: [
                  { id: "cam_2", title: "2 Cameras", description: "Entry & main hall/gate" },
                  { id: "cam_4", title: "4 Cameras", description: "Comprehensive coverage" }
                ]
              },
              {
                title: "Medium Setup",
                rows: [
                  { id: "cam_6", title: "6 Cameras", description: "Multi-point security" },
                  { id: "cam_8", title: "8 Cameras", description: "Full perimeter & interior" }
                ]
              },
              {
                title: "Commercial & Large",
                rows: [
                  { id: "cam_16", title: "16 Cameras", description: "Complete commercial system" },
                  { id: "cam_custom", title: "More than 16", description: "Industrial custom design" }
                ]
              }
            ]
          ));
        }
        break;

      case "ASK_CAMERA_COUNT":
        if (incomingType === "interactive") {
          if (content === "cam_custom") {
            replies.push(MessageBuilder.text(
              from,
              "For systems larger than 16 cameras, our enterprise engineering desk will design a custom network topology for you. A senior engineer will call you shortly."
            ));
            nextState = "PAUSED_FOR_AGENT";
          } else {
            const count = parseInt(content.replace("cam_", ""), 10);
            session.wizard_answers.camera_count = count;
            nextState = "ASK_CAMERA_SPLIT";

            replies.push(MessageBuilder.buttons(
              from,
              `*Question 4 of 9:* How would you like your ${count} cameras distributed between Outdoor & Indoor?`,
              [
                { id: "split_equal", title: "50/50 Equal Split" },
                { id: "split_all_outdoor", title: "All Outdoor (Bullet)" },
                { id: "split_all_indoor", title: "All Indoor (Dome)" }
              ]
            ));
          }
        }
        break;

      case "ASK_CAMERA_SPLIT":
        if (incomingType === "interactive") {
          const total = session.wizard_answers.camera_count || 4;
          if (content === "split_all_outdoor") {
            session.wizard_answers.outdoor_camera_count = total;
            session.wizard_answers.indoor_camera_count = 0;
          } else if (content === "split_all_indoor") {
            session.wizard_answers.outdoor_camera_count = 0;
            session.wizard_answers.indoor_camera_count = total;
          } else {
            session.wizard_answers.outdoor_camera_count = Math.ceil(total / 2);
            session.wizard_answers.indoor_camera_count = Math.floor(total / 2);
          }

          if (session.wizard_answers.technology === "Wireless") {
            nextState = "ASK_STORAGE";
            replies.push(MessageBuilder.buttons(
              from,
              `*Question 5 of 9:* How many days of recording retention do you require?`,
              [
                { id: "storage_7", title: "7 Days (Basic)" },
                { id: "storage_15", title: "15 Days (Standard)" },
                { id: "storage_30", title: "30 Days (Extended)" }
              ]
            ));
          } else {
            nextState = "ASK_TECH";
            replies.push(MessageBuilder.buttons(
              from,
              `*Question 5 of 9:* Which camera technology level do you prefer?`,
              [
                { id: "tech_IP", title: "Digital IP (Best Quality)" },
                { id: "tech_HD", title: "HD Analog (Lowest Cost)" },
                { id: "tech_Wireless", title: "Smart Wireless (Wi-Fi)" }
              ]
            ));
          }
        }
        break;

      case "ASK_TECH":
        if (incomingType === "interactive") {
          session.wizard_answers.technology = content.replace("tech_", "");
          nextState = "ASK_STORAGE";

          replies.push(MessageBuilder.buttons(
            from,
            `*Question 6 of 9:* How many days of recording storage do you need?`,
            [
              { id: "storage_7", title: "7 Days (Basic)" },
              { id: "storage_15", title: "15 Days (Standard)" },
              { id: "storage_30", title: "30 Days (Commercial)" }
            ]
          ));
        }
        break;

      case "ASK_STORAGE":
        if (incomingType === "interactive") {
          session.wizard_answers.recording_days = parseInt(content.replace("storage_", ""), 10);
          nextState = "ASK_CABLING";

          replies.push(MessageBuilder.buttons(
            from,
            `*Question 7 of 9:* What is the current cabling status at your site?`,
            [
              { id: "cabling_new", title: "New Wiring Needed" },
              { id: "cabling_done", title: "Cabling Already Done" }
            ]
          ));
        }
        break;

      case "ASK_CABLING":
        if (incomingType === "interactive") {
          session.wizard_answers.cabling_status = content === "cabling_done" ? "done" : "needed";
          nextState = "ASK_INTERNET";

          replies.push(MessageBuilder.buttons(
            from,
            `*Question 8 of 9:* Is broadband/Wi-Fi available at the location for remote mobile viewing?`,
            [
              { id: "net_yes", title: "Yes, Wi-Fi Available" },
              { id: "net_no", title: "No, Need 4G SIM Router" }
            ]
          ));
        }
        break;

      case "ASK_INTERNET":
        if (incomingType === "interactive") {
          session.wizard_answers.broadband_status = content === "net_yes" ? "broadband_available" : "need_4g_router";
          nextState = "ASK_TIMELINE";

          replies.push(MessageBuilder.buttons(
            from,
            `*Question 9 of 9:* ⏱️ When do you plan to get work / installation done at your site?`,
            [
              { id: "time_asap", title: "⚡ ASAP (1-2 Days)" },
              { id: "time_week", title: "📅 Within a Week" },
              { id: "time_month", title: "🗓️ This Month / Later" }
            ]
          ));
        }
        break;

      case "ASK_TIMELINE":
        if (incomingType === "interactive") {
          const timeChoice = content === "time_asap" ? "Immediately" : content === "time_week" ? "This week" : "This month";
          const rawCode = content.replace("time_", "");
          session.wizard_answers.timeline = timeChoice;
          session.wizard_answers.q_timeline = rawCode;
          session.wizard_answers.installation_timeline = rawCode;
          
          const priority = timeChoice === "Immediately" ? "HOT" : timeChoice === "This week" ? "HOT" : "WARM";
          await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
            timeline: timeChoice,
            priority,
            is_hot_lead: priority === "HOT",
            "wizard_answers.timeline": timeChoice,
            "wizard_answers.q_timeline": rawCode,
            "wizard_answers.installation_timeline": rawCode,
            updated_at: new Date()
          }).catch(console.error);

          nextState = "ASK_PINCODE";

          replies.push(MessageBuilder.text(
            from,
            `📍 *Final Step:* Please enter your 6-digit Pincode (or tap the clip icon to share your *Location Pin*).\n\nThis allows us to match our nearest Sub-Post Office micro-hub and certified local installer.`
          ));
        } else {
          replies.push(MessageBuilder.text(from, "Please select an installation timeframe using the buttons above."));
        }
        break;

      case "ASK_PINCODE":
        let pincode = "";
        if (incomingType === "location" && context?.locationCoords) {
          pincode = "302012"; // Default Jaipur if reverse geocode pending
          session.wizard_answers.lead_pincode = pincode;
          session.wizard_answers.location_coords = context.locationCoords;
        } else if (incomingType === "text" && /^\d{6}$/.test(content.trim())) {
          pincode = content.trim();
          session.wizard_answers.lead_pincode = pincode;
        }

        if (pincode) {
          nextState = "GENERATING";
          replies.push(MessageBuilder.text(
            from,
            `⚙️ *Calculating All Brand Quotations...*\nSizing recorders, checking power supplies, applying ₹0-markup labor rates, and computing 100% transparent market price ranges. Please wait 3 seconds...`
          ));
        } else {
          replies.push(MessageBuilder.text(from, "Please enter a valid 6-digit Indian Pincode (e.g. 302012) or share your Location Pin."));
        }
        break;

      case "SHOW_PRICE_RANGES":
      case "SHOW_BRAND_VARIATIONS":
      case "QUOTE_FROZEN":
      case "BOOKING_SLOT":
        if (incomingType === "interactive") {
          if (content.startsWith("view_brand_")) {
            const brandKey = content.replace("view_brand_", "");
            await sendBrandVariations(from, session, brandKey);
            return;
          } else if (content === "select_lowest_quote") {
            const cachedLowest = (session as any).cached_lowest_quote;
            if (cachedLowest) {
              await finalizeAndSendQuote(from, session, cachedLowest);
              return;
            }
          } else if (content.startsWith("lock_")) {
            const parts = content.split("_");
            const brandKey = parts[1];
            const isEconomy = parts[2] === "economy";
            const cachedSummaries = (session as any).cached_brand_summaries || [];
            const summary = cachedSummaries.find((b: any) => b.brandKey === brandKey);
            // Recompute target quote
            const targetQuote = isEconomy ? summary?.economyQuote || summary?.standardQuote : summary?.standardQuote;
            if (targetQuote) {
              await finalizeAndSendQuote(from, session, targetQuote);
              return;
            }
          } else if (content === "back_to_brands") {
            await generateAndSendPriceRanges(from, session);
            return;
          } else if (content.startsWith("action_")) {
            await handleCheckoutAction(from, session, content);
            return;
          } else if (content.startsWith("slot_")) {
            await handleSlotSelection(from, session, content);
            return;
          } else if (content === "upload_competitor_quote") {
            replies.push(MessageBuilder.text(
              from,
              `📸 *Send Competitor Quote:*\nPlease send a clear PHOTO or PDF of your offline quotation here. Our engineering desk will review it to beat their price with our 5%–10% Price Match Guarantee!`
            ));
          } else if (content === "open_web_studio") {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cctvquotation.com";
            replies.push(MessageBuilder.text(
              from,
              `🎨 *Open Live Web Studio:*\n\nExplore 3D camera angles, compare specs side-by-side, and customize hardware with our Apple-style configurator:\n\n👉 ${baseUrl}/quote/${leadId}`
            ));
          }
        }
        break;

      default:
        break;
    }
  } catch (error) {
    console.error("🔥 Error in Bot State Machine:", error);
    replies.push(MessageBuilder.text(from, "Sorry, I encountered an error. Type 'Hi' anytime to restart."));
    nextState = "IDLE";
  }

  // Persist State & Real-Time Sync to Leads Document
  session.state = nextState;
  session.last_message_at = new Date();
  await sessionRef.set(session);

  if (leadId) {
    await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
      wizard_answers: session.wizard_answers,
      last_bot_state: nextState,
      updated_at: new Date(),
    });
  }

  // Send replies
  await sendWhatsAppMessages(replies);

  // If reached GENERATING state, trigger parallel price calculation
  if (nextState === "GENERATING") {
    generateAndSendPriceRanges(from, session).catch(console.error);
  }
}

async function sendWhatsAppMessages(messages: WhatsAppMessagePayload[]) {
  const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID;
  const whatsappToken = process.env.WHATSAPP_TOKEN;

  if (!whatsappPhoneId || !whatsappToken) {
    console.warn("⚠️ [WhatsApp Simulated] Keys missing. Payload:", JSON.stringify(messages, null, 2));
    return;
  }

  for (const msg of messages) {
    try {
      await fetch(`https://graph.facebook.com/v17.0/${whatsappPhoneId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${whatsappToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(msg),
      });
    } catch (e) {
      console.error("🔥 Failed to send WhatsApp message:", e);
    }
  }
}
