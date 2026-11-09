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
          `Welcome to *TEAM CCTV*! 📷\n\nLet's build your exact, transparent CCTV quotation matching our website customer journey.\n\n*Step 1:* What type of property are you securing?`,
          [
            { id: "prop_home", title: "🏠 Home / Flat" },
            { id: "prop_office", title: "🏢 Office / Shop" },
            { id: "prop_factory", title: "🏭 Factory / Farm / Yard" }
          ]
        ));
        break;

      case "ASK_PROP":
        if (incomingType === "interactive") {
          const propMap: Record<string, string> = { 
            prop_home: "home", 
            prop_office: "office", 
            prop_factory: "factory" 
          };
          session.wizard_answers.property_type = propMap[content] || "home";
          nextState = "ASK_INSTALL_TYPE";

          replies.push(MessageBuilder.list(
            from,
            `*Step 2:* What kind of installation do you require?`,
            "Select Installation Type",
            [
              {
                title: "Choose Installation Type",
                rows: [
                  { id: "ins_new_wired", title: "✨ Completely New Wired Setup", description: "Central DVR/NVR with dedicated copper cabling. Zero signal drop." },
                  { id: "ins_wireless", title: "📶 Smart Wireless CCTV", description: "Zero video cabling. 360° Pan-Tilt & live mobile phone viewing." },
                  { id: "ins_4g_solar", title: "📡 4G SIM / Solar Standalone", description: "No Wi-Fi needed. Ideal for farmhouses, empty plots & remote gates." },
                  { id: "ins_addon", title: "⬆️ Add to Existing System", description: "Expansion / upgrade with compatibility guarantee." }
                ]
              }
            ]
          ));
        } else {
          replies.push(MessageBuilder.text(from, "Please select an option using the buttons above."));
        }
        break;

      case "ASK_INSTALL_TYPE":
        if (incomingType === "interactive") {
          const choice = content.replace("ins_", "");
          session.wizard_answers.installation_type = choice === "addon" ? "addon" : "new";

          if (choice === "addon") {
            nextState = "ASK_ADDON_COMPATIBILITY";
            replies.push(MessageBuilder.buttons(
              from,
              `*Add-on Compatibility Check:*\n\nDo you know the technical specifications of your existing DVR / NVR recorder?`,
              [
                { id: "addon_upload_photo", title: "📸 Send DVR Photo" },
                { id: "addon_know_specs", title: "✅ I Know My Specs" },
                { id: "addon_free_callback", title: "📞 Free Callback (15m)" }
              ]
            ));
          } else if (choice === "4g_solar") {
            session.wizard_answers.technology = "Wireless";
            session.wizard_answers.technology_preference = "Wireless";
            session.wizard_answers.is_4g = true;
            session.wizard_answers.has_4g_sim = true;
            session.wizard_answers.broadband_status = "independent_4g";
            session.wizard_answers.cabling_done = true;
            session.wizard_answers.installation_preference = "pro";
            session.wizard_answers.selected_wireless_variant = "wf_4g_solar";
            nextState = "ASK_WIRELESS_QTY";

            replies.push(MessageBuilder.list(
              from,
              `*4G SIM & Solar Standalone Cameras Selected:* 🛰️\n\nHow many standalone 4G SIM / Solar cameras do you need mounted at your site?\n\n_Select quantity (1 to 32) from the menu below or reply directly with any number:_`,
              "Select 4G Solar Qty",
              [
                {
                  title: "Standard Quantities (1 to 4)",
                  rows: [
                    { id: "wfq_1", title: "1 Camera (Single Gate)", description: "Farmhouse entrance or remote gate" },
                    { id: "wfq_2", title: "2 Cameras (Gate + Yard)", description: "Gate + front yard or barn" },
                    { id: "wfq_3", title: "3 Cameras", description: "Perimeter and yard surveillance" },
                    { id: "wfq_4", title: "4 Cameras (Full Perimeter)", description: "4-corner coverage without Wi-Fi" },
                  ]
                },
                {
                  title: "Commercial & Large (6 to 32)",
                  rows: [
                    { id: "wfq_6", title: "6 Cameras", description: "Agricultural field / farm boundaries" },
                    { id: "wfq_8", title: "8 Cameras", description: "Large estate / resort / remote warehouse" },
                    { id: "wfq_16", title: "16 Cameras", description: "Highway / solar park / infrastructure" },
                    { id: "wfq_32", title: "32 Cameras", description: "Extensive perimeter monitoring" },
                    { id: "wfq_custom", title: "✏️ Custom Quantity (1-32)", description: "Reply with any number 1 to 32" }
                  ]
                }
              ]
            ));
          } else if (choice === "wireless") {
            session.wizard_answers.technology = "Wireless";
            session.wizard_answers.technology_preference = "Wireless";
            session.wizard_answers.cabling_done = true;
            nextState = "ASK_WIRELESS_VARIANT";

            replies.push(MessageBuilder.list(
              from,
              `*Smart Wireless Purpose Variants:*\n\nSelect the type of smart wireless camera you need for your site:`,
              "Select Camera Type",
              [
                {
                  title: "Smart Wireless Variants",
                  rows: [
                    { id: "wf_in_ptz", title: "🏠 Indoor 360° Pan-Tilt", description: "Living room, cashier, 2-way talk" },
                    { id: "wf_in_fixed", title: "🏢 Indoor Fixed Dome / Cube", description: "Hallways, reception, cashier desk" },
                    { id: "wf_out_bullet", title: "🌧️ Outdoor Fixed Weatherproof", description: "IP66 waterproof bullet for gates & porch" },
                    { id: "wf_out_ptz", title: "🔄 Outdoor 360° Motorized PTZ", description: "360° remote sweep via phone app" },
                    { id: "wf_4g_solar", title: "🛰️ 4G SIM / Solar Standalone", description: "Farmhouse, empty plot, remote gate" },
                    { id: "wf_combo_2x2", title: "✨ 4-Cam Combo (2 In + 2 Out)", description: "Complete home / office wireless coverage" }
                  ]
                }
              ]
            ));
          } else {
            // New Wired: Matches website WizardClientV2.tsx (Card 1: Outdoor Bullets, Card 2: Indoor Domes, Card 3: Optional Wireless)
            session.wizard_answers.technology_preference = "HD";
            nextState = "ASK_CAMERA_OUTDOOR";

            replies.push(MessageBuilder.list(
              from,
              `*Step 3 (Outdoor Cameras):* 🌧️\n\nHow many *Weatherproof Bullet Cameras* do you need mounted outside for your main gate, driveway, parking, or boundary walls?\n\n_Select quantity (0 to 32) from the menu below or reply directly with any number:_`,
              "Select Outdoor Cameras",
              [
                {
                  title: "Standard Quantities (0 to 4)",
                  rows: [
                    { id: "out_0", title: "0 Cameras (None Outside)", description: "All cameras will be mounted indoors" },
                    { id: "out_1", title: "1 Outdoor Bullet", description: "Main gate / single entrance coverage" },
                    { id: "out_2", title: "2 Outdoor Bullets", description: "Front gate + driveway / parking" },
                    { id: "out_3", title: "3 Outdoor Bullets", description: "Front gate, side lane & backyard" },
                    { id: "out_4", title: "4 Outdoor Bullets", description: "4-corner full perimeter coverage" },
                  ]
                },
                {
                  title: "Commercial & Large (6 to 32)",
                  rows: [
                    { id: "out_6", title: "6 Outdoor Bullets", description: "Multi-point perimeter security" },
                    { id: "out_8", title: "8 Outdoor Bullets", description: "Comprehensive perimeter coverage" },
                    { id: "out_16", title: "16 Outdoor Bullets", description: "Commercial enterprise perimeter" },
                    { id: "out_32", title: "32 Outdoor Bullets", description: "Large factory / campus perimeter" },
                    { id: "out_custom", title: "✏️ Custom Quantity (0-32)", description: "Reply with any exact number 0 to 32" }
                  ]
                }
              ]
            ));
          }
        }
        break;

      case "ASK_ADDON_COMPATIBILITY":
        if (incomingType === "interactive") {
          if (content === "addon_upload_photo") {
            replies.push(MessageBuilder.text(
              from,
              `📸 *Send DVR Photo:*\nPlease take a quick photo of your existing DVR/NVR's *back panel* (where camera cables connect) or the *model sticker* and send it right here.\n\nOur senior engineer will review it within 15 minutes and verify 100% compatibility!`
            ));
            nextState = "PAUSED_FOR_AGENT";
          } else if (content === "addon_free_callback") {
            replies.push(MessageBuilder.text(
              from,
              `📞 *Callback Requested:*\nOur senior CCTV engineer will call you shortly on this WhatsApp number to confirm your DVR model and recommended camera upgrade.`
            ));
            nextState = "PAUSED_FOR_AGENT";
          } else {
            // User knows specs
            nextState = "ASK_CAMERA_COUNT";
            replies.push(MessageBuilder.buttons(
              from,
              `*Existing System Tech:* What wire connects your current cameras to the recorder?`,
              [
                { id: "addon_tech_hd", title: "Analog HD (BNC Wire)" },
                { id: "addon_tech_ip", title: "IP Network (CAT6 Wire)" }
              ]
            ));
          }
        }
        break;

      case "ASK_WIRELESS_VARIANT":
        if (incomingType === "interactive") {
          if (content === "wf_combo_2x2") {
            session.wizard_answers.camera_count = 4;
            session.wizard_answers.indoor_camera_count = 2;
            session.wizard_answers.outdoor_camera_count = 2;
            session.wizard_answers.wifi_indoor_ptz_count = 2;
            session.wizard_answers.wifi_outdoor_bullet_count = 2;
            session.wizard_answers.wifi_camera_count = 4;

            nextState = "ASK_STORAGE_DAYS";
            replies.push(MessageBuilder.list(
              from,
              `✓ *4-Camera Wireless Combo Selected (2 Indoor PTZ + 2 Outdoor Bullet)*\n\n*Step 4 (Storage):* How many days of recording retention do you require?`,
              "Select Storage Days",
              [
                {
                  title: "Recording Retention",
                  rows: [
                    { id: "storage_0", title: "0 Days (No Recording)", description: "Live mobile viewing only. Zero storage cost." },
                    { id: "storage_7", title: "7 Days (Basic)", description: "Standard week buffer (32GB MicroSD)" },
                    { id: "storage_15", title: "15 Days (Recommended)", description: "Optimal commercial/home standard (64GB MicroSD)" },
                    { id: "storage_30", title: "30 Days (Extended)", description: "Full month peace-of-mind (128GB MicroSD)" },
                    { id: "storage_45", title: "45 Days (High Security)", description: "Extended commercial compliance" },
                    { id: "storage_60", title: "60 Days (Maximum)", description: "Highest statutory retention (256GB MicroSD)" }
                  ]
                }
              ]
            ));
          } else {
            session.wizard_answers.selected_wireless_variant = content;
            nextState = "ASK_WIRELESS_QTY";

            const variantTitles: Record<string, string> = {
              wf_in_ptz: "Indoor 360° Pan-Tilt (Wi-Fi)",
              wf_in_fixed: "Indoor Fixed Dome / Cube (Wi-Fi)",
              wf_out_bullet: "Outdoor Fixed Weatherproof Bullet (Wi-Fi)",
              wf_out_ptz: "Outdoor 360° Pan-Tilt PTZ (Wi-Fi)",
              wf_4g_solar: "4G SIM / Solar Standalone Camera"
            };
            const chosenName = variantTitles[content] || "Smart Wireless Camera";

            replies.push(MessageBuilder.list(
              from,
              `How many *${chosenName}* cameras do you need (1 to 32)?\n\n_Select quantity below or reply directly with any number:_`,
              "Select Quantity (1-32)",
              [
                {
                  title: "Standard Quantities (1 to 4)",
                  rows: [
                    { id: "wfq_1", title: "1 Camera", description: `Add 1x ${chosenName}` },
                    { id: "wfq_2", title: "2 Cameras", description: `Add 2x ${chosenName}` },
                    { id: "wfq_3", title: "3 Cameras", description: `Add 3x ${chosenName}` },
                    { id: "wfq_4", title: "4 Cameras", description: `Add 4x ${chosenName}` },
                  ]
                },
                {
                  title: "Larger Quantities (6 to 32)",
                  rows: [
                    { id: "wfq_6", title: "6 Cameras", description: `Add 6x ${chosenName}` },
                    { id: "wfq_8", title: "8 Cameras", description: `Add 8x ${chosenName}` },
                    { id: "wfq_16", title: "16 Cameras", description: `Add 16x ${chosenName}` },
                    { id: "wfq_32", title: "32 Cameras", description: `Add 32x ${chosenName}` },
                    { id: "wfq_custom", title: "✏️ Custom Quantity (1-32)", description: "Reply with any number between 1 and 32" }
                  ]
                }
              ]
            ));
          }
        }
        break;

      case "ASK_CAMERA_OUTDOOR":
        let outdoorCount = 0;
        if (incomingType === "interactive") {
          if (content === "out_custom") {
            replies.push(MessageBuilder.text(from, "Please reply with your desired number of Outdoor Weatherproof Bullet cameras (0 to 32):"));
            return;
          } else if (content.startsWith("out_")) {
            outdoorCount = parseInt(content.replace("out_", ""), 10);
          } else {
            outdoorCount = parseInt(content, 10) || 0;
          }
        } else if (incomingType === "text") {
          const match = content.match(/\d+/);
          outdoorCount = match ? Math.min(32, Math.max(0, parseInt(match[0], 10))) : 2;
        }
        session.wizard_answers.outdoor_camera_count = outdoorCount;
        nextState = "ASK_CAMERA_INDOOR";

        replies.push(MessageBuilder.list(
          from,
          `*Step 4 (Indoor Cameras):* 🏠\n\nHow many *Compact Ceiling Dome Cameras* do you need mounted inside for your living room, corridors, office, or cashier counters?\n\n_Select quantity (0 to 32) from the menu below or reply directly with any number:_`,
          "Select Indoor Cameras",
          [
            {
              title: "Standard Quantities (0 to 4)",
              rows: [
                { id: "in_0", title: "0 Cameras (None Inside)", description: "All cameras will be outdoor bullets" },
                { id: "in_1", title: "1 Indoor Dome", description: "Living hall / main reception" },
                { id: "in_2", title: "2 Indoor Domes", description: "Hall + cashier desk / master bedroom" },
                { id: "in_3", title: "3 Indoor Domes", description: "Hall + 2 rooms / cabins" },
                { id: "in_4", title: "4 Indoor Domes", description: "4 separate indoor zones" },
              ]
            },
            {
              title: "Commercial & Large (6 to 32)",
              rows: [
                { id: "in_6", title: "6 Indoor Domes", description: "Medium commercial interior / 6 rooms" },
                { id: "in_8", title: "8 Indoor Domes", description: "Comprehensive commercial interior" },
                { id: "in_16", title: "16 Indoor Domes", description: "Departmental store / corporate floor" },
                { id: "in_32", title: "32 Indoor Domes", description: "Hotel, school, hospital campus" },
                { id: "in_custom", title: "✏️ Custom Quantity (0-32)", description: "Reply with any exact number 0 to 32" }
              ]
            }
          ]
        ));
        break;

      case "ASK_CAMERA_INDOOR":
        let indoorCount = 0;
        if (incomingType === "interactive") {
          if (content === "in_custom") {
            replies.push(MessageBuilder.text(from, "Please reply with your desired number of Indoor Ceiling Dome cameras (0 to 32):"));
            return;
          } else if (content.startsWith("in_")) {
            indoorCount = parseInt(content.replace("in_", ""), 10);
          } else {
            indoorCount = parseInt(content, 10) || 0;
          }
        } else if (incomingType === "text") {
          const match = content.match(/\d+/);
          indoorCount = match ? Math.min(32, Math.max(0, parseInt(match[0], 10))) : 2;
        }
        session.wizard_answers.indoor_camera_count = indoorCount;

        const totalWired = (session.wizard_answers.outdoor_camera_count || 0) + indoorCount;
        session.wizard_answers.camera_count = totalWired;

        nextState = "ASK_HYBRID_WIRELESS";
        replies.push(MessageBuilder.list(
          from,
          `✓ *Wired Cameras Configured:* ${totalWired} Cameras (${session.wizard_answers.outdoor_camera_count || 0} Out + ${indoorCount} In)\n\n📡 *Add Smart Wireless Cameras (Wi-Fi / 4G SIM)*\n_Optional • Hybrid Setup (as per website Card 3)_\n\nDo you want to add any wireless cameras for areas where running video cables is difficult (e.g. remote gate, terrace, farm corner, baby room)?`,
          "Smart Wireless Options",
          [
            {
              title: "Smart Wireless Add-on Options",
              rows: [
                { id: "wf_none", title: "❌ None (Pure Wired DVR Setup)", description: "Proceed with standard wired DVR setup only" },
                { id: "wf_in_ptz", title: "🏠 Indoor 360° Pan-Tilt (Wi-Fi)", description: "Living room, counter, baby room with 2-way talk" },
                { id: "wf_in_fixed", title: "🏢 Indoor Fixed Dome / Cube (Wi-Fi)", description: "Hallways, reception, cashier desk" },
                { id: "wf_out_bullet", title: "🌧️ Outdoor Fixed Weatherproof (Wi-Fi)", description: "Main gate, porch, driveway, perimeter" },
                { id: "wf_out_ptz", title: "🔄 Outdoor 360° Pan-Tilt PTZ (Wi-Fi)", description: "Open courtyard, terrace, front garden" },
                { id: "wf_4g_solar", title: "🛰️ 4G SIM / Solar Standalone Camera", description: "Farmhouse, empty plot, remote gate (No Wi-Fi needed)" },
              ]
            }
          ]
        ));
        break;

      case "ASK_HYBRID_WIRELESS":
        if (incomingType === "interactive") {
          if (content === "wf_none") {
            session.wizard_answers.wifi_camera_count = 0;
            session.wizard_answers.wifi_indoor_ptz_count = 0;
            session.wizard_answers.wifi_indoor_fixed_count = 0;
            session.wizard_answers.wifi_outdoor_bullet_count = 0;
            session.wizard_answers.wifi_outdoor_ptz_count = 0;
            session.wizard_answers.wifi_4g_count = 0;

            const outCount = session.wizard_answers.outdoor_camera_count || 0;
            const inCount = session.wizard_answers.indoor_camera_count || 0;
            session.wizard_answers.camera_count = Math.max(1, outCount + inCount);

            nextState = "ASK_TECH";
            replies.push(MessageBuilder.buttons(
              from,
              `✓ *Camera Setup Confirmed:* ${outCount + inCount} Total (${outCount} Outdoor Bullet${outCount === 1 ? '' : 's'} + ${inCount} Indoor Dome${inCount === 1 ? '' : 's'})\n\n*Step 5 (Technology):* Which camera technology level do you prefer?`,
              [
                { id: "tech_IP", title: "Digital IP (Best Quality)" },
                { id: "tech_HD", title: "HD Analog (Lowest Cost)" }
              ]
            ));
          } else {
            session.wizard_answers.selected_wireless_variant = content;
            nextState = "ASK_WIRELESS_QTY";

            const variantTitles: Record<string, string> = {
              wf_in_ptz: "Indoor 360° Pan-Tilt (Wi-Fi)",
              wf_in_fixed: "Indoor Fixed Dome / Cube (Wi-Fi)",
              wf_out_bullet: "Outdoor Fixed Weatherproof Bullet (Wi-Fi)",
              wf_out_ptz: "Outdoor 360° Pan-Tilt PTZ (Wi-Fi)",
              wf_4g_solar: "4G SIM / Solar Standalone Camera"
            };
            const chosenName = variantTitles[content] || "Smart Wireless Camera";

            replies.push(MessageBuilder.list(
              from,
              `How many *${chosenName}* do you want to add to your setup (0 to 32)?\n\n_Select quantity below or reply directly with any number:_`,
              "Select Quantity (0-32)",
              [
                {
                  title: "Standard Quantities (1 to 4)",
                  rows: [
                    { id: "wfq_1", title: "1 Camera", description: `Add 1x ${chosenName}` },
                    { id: "wfq_2", title: "2 Cameras", description: `Add 2x ${chosenName}` },
                    { id: "wfq_3", title: "3 Cameras", description: `Add 3x ${chosenName}` },
                    { id: "wfq_4", title: "4 Cameras", description: `Add 4x ${chosenName}` },
                  ]
                },
                {
                  title: "Larger Quantities (6 to 32)",
                  rows: [
                    { id: "wfq_6", title: "6 Cameras", description: `Add 6x ${chosenName}` },
                    { id: "wfq_8", title: "8 Cameras", description: `Add 8x ${chosenName}` },
                    { id: "wfq_16", title: "16 Cameras", description: `Add 16x ${chosenName}` },
                    { id: "wfq_32", title: "32 Cameras", description: `Add 32x ${chosenName}` },
                    { id: "wfq_custom", title: "✏️ Custom Quantity (0-32)", description: "Reply with any number between 0 and 32" }
                  ]
                }
              ]
            ));
          }
        }
        break;

      case "ASK_WIRELESS_QTY":
        let wCount = 1;
        if (incomingType === "interactive") {
          if (content === "wfq_custom") {
            replies.push(MessageBuilder.text(from, "Please reply with your desired quantity of Smart Wireless cameras (0 to 32):"));
            return;
          } else if (content.startsWith("wfq_")) {
            wCount = parseInt(content.replace("wfq_", ""), 10);
          } else {
            wCount = parseInt(content, 10) || 1;
          }
        } else if (incomingType === "text") {
          const match = content.match(/\d+/);
          wCount = match ? Math.min(32, Math.max(0, parseInt(match[0], 10))) : 1;
        }

        const vType = session.wizard_answers.selected_wireless_variant;
        if (vType === "wf_in_ptz") session.wizard_answers.wifi_indoor_ptz_count = wCount;
        else if (vType === "wf_in_fixed") session.wizard_answers.wifi_indoor_fixed_count = wCount;
        else if (vType === "wf_out_bullet") session.wizard_answers.wifi_outdoor_bullet_count = wCount;
        else if (vType === "wf_out_ptz") session.wizard_answers.wifi_outdoor_ptz_count = wCount;
        else if (vType === "wf_4g_solar") session.wizard_answers.wifi_4g_count = wCount;

        session.wizard_answers.wifi_camera_count = wCount;
        const outWired = session.wizard_answers.outdoor_camera_count || 0;
        const inWired = session.wizard_answers.indoor_camera_count || 0;
        const grandTotal = Math.max(1, outWired + inWired + wCount);
        session.wizard_answers.camera_count = grandTotal;

        const isPureWireless = session.wizard_answers.technology === "Wireless" || 
                               session.wizard_answers.technology === "4G_Solar" ||
                               session.wizard_answers.installation_type === "wireless" ||
                               session.wizard_answers.installation_type === "solar_4g";

        if (isPureWireless) {
          nextState = "ASK_STORAGE_DAYS";
          replies.push(MessageBuilder.list(
            from,
            `✓ *Smart Wireless Setup Confirmed:* ${wCount} Camera${wCount === 1 ? '' : 's'}\n\n*Step 4 (Storage):* How many days of recording retention do you require?`,
            "Select Storage Days",
            [
              {
                title: "Recording Retention",
                rows: [
                  { id: "storage_0", title: "0 Days (No Recording)", description: "Live mobile viewing only. Zero storage cost." },
                  { id: "storage_7", title: "7 Days (Basic)", description: "Standard week buffer (32GB MicroSD)" },
                  { id: "storage_15", title: "15 Days (Recommended)", description: "Optimal commercial/home standard (64GB MicroSD)" },
                  { id: "storage_30", title: "30 Days (Extended)", description: "Full month peace-of-mind (128GB MicroSD)" },
                  { id: "storage_45", title: "45 Days (High Security)", description: "Extended commercial compliance" },
                  { id: "storage_60", title: "60 Days (Maximum)", description: "Highest statutory retention (256GB MicroSD)" }
                ]
              }
            ]
          ));
        } else {
          nextState = "ASK_TECH";
          replies.push(MessageBuilder.buttons(
            from,
            `✓ *Hybrid Setup Confirmed:* ${grandTotal} Total Cameras (${outWired} Out + ${inWired} In + ${wCount} Wireless)\n\n*Step 5 (Technology):* Which camera technology level do you prefer?`,
            [
              { id: "tech_IP", title: "Digital IP (Best Quality)" },
              { id: "tech_HD", title: "HD Analog (Lowest Cost)" }
            ]
          ));
        }
        break;

      case "ASK_CAMERA_COUNT":
        if (incomingType === "interactive") {
          if (content.startsWith("addon_tech_")) {
            session.wizard_answers.technology = content.replace("addon_tech_", "").toUpperCase();
            nextState = "ASK_CAMERA_OUTDOOR";
            replies.push(MessageBuilder.list(
              from,
              `*Step 3 (Outdoor Cameras to Add):* 🌧️\n\nHow many *Weatherproof Bullet Cameras* do you need added outside for your main gate, driveway, parking, or boundary walls?\n\n_Select quantity (0 to 32) from the menu below or reply directly with any number:_`,
              "Select Outdoor Cameras",
              [
                {
                  title: "Standard Quantities (0 to 4)",
                  rows: [
                    { id: "out_0", title: "0 Cameras (None Outside)", description: "All add-on cameras will be mounted indoors" },
                    { id: "out_1", title: "1 Outdoor Bullet", description: "Main gate / single entrance coverage" },
                    { id: "out_2", title: "2 Outdoor Bullets", description: "Front gate + driveway / parking" },
                    { id: "out_3", title: "3 Outdoor Bullets", description: "Front gate, side lane & backyard" },
                    { id: "out_4", title: "4 Outdoor Bullets", description: "4-corner full perimeter coverage" },
                  ]
                },
                {
                  title: "Commercial & Large (6 to 32)",
                  rows: [
                    { id: "out_6", title: "6 Outdoor Bullets", description: "Multi-point perimeter security" },
                    { id: "out_8", title: "8 Outdoor Bullets", description: "Comprehensive perimeter coverage" },
                    { id: "out_16", title: "16 Outdoor Bullets", description: "Commercial enterprise perimeter" },
                    { id: "out_32", title: "32 Outdoor Bullets", description: "Large factory / campus perimeter" },
                    { id: "out_custom", title: "✏️ Custom Quantity (0-32)", description: "Reply with any exact number 0 to 32" }
                  ]
                }
              ]
            ));
            return;
          }

          if (content === "cam_custom") {
            replies.push(MessageBuilder.text(
              from,
              "For systems larger than 32 cameras, our enterprise engineering desk will design a custom network topology for you. A senior engineer will call you shortly."
            ));
            nextState = "PAUSED_FOR_AGENT";
          } else {
            // Forward directly to Outdoor & Indoor 0-32 selectors to ensure 100% website parity
            nextState = "ASK_CAMERA_OUTDOOR";
            replies.push(MessageBuilder.list(
              from,
              `*Step 3 (Outdoor Cameras):* 🌧️\n\nHow many *Weatherproof Bullet Cameras* do you need mounted outside for your main gate, driveway, parking, or boundary walls?\n\n_Select quantity (0 to 32) from the menu below or reply directly with any number:_`,
              "Select Outdoor Cameras",
              [
                {
                  title: "Standard Quantities (0 to 4)",
                  rows: [
                    { id: "out_0", title: "0 Cameras (None Outside)", description: "All cameras will be mounted indoors" },
                    { id: "out_1", title: "1 Outdoor Bullet", description: "Main gate / single entrance coverage" },
                    { id: "out_2", title: "2 Outdoor Bullets", description: "Front gate + driveway / parking" },
                    { id: "out_3", title: "3 Outdoor Bullets", description: "Front gate, side lane & backyard" },
                    { id: "out_4", title: "4 Outdoor Bullets", description: "4-corner full perimeter coverage" },
                  ]
                },
                {
                  title: "Commercial & Large (6 to 32)",
                  rows: [
                    { id: "out_6", title: "6 Outdoor Bullets", description: "Multi-point perimeter security" },
                    { id: "out_8", title: "8 Outdoor Bullets", description: "Comprehensive perimeter coverage" },
                    { id: "out_16", title: "16 Outdoor Bullets", description: "Commercial enterprise perimeter" },
                    { id: "out_32", title: "32 Outdoor Bullets", description: "Large factory / campus perimeter" },
                    { id: "out_custom", title: "✏️ Custom Quantity (0-32)", description: "Reply with any exact number 0 to 32" }
                  ]
                }
              ]
            ));
          }
        }
        break;

      case "ASK_CAMERA_SPLIT":
        // Fallback / legacy handler: forward directly to Indoor Dome selection with 0-32 quantities
        nextState = "ASK_CAMERA_INDOOR";
        replies.push(MessageBuilder.list(
          from,
          `*Step 4 (Indoor Cameras):* 🏠\n\nHow many *Compact Ceiling Dome Cameras* do you need mounted inside for your living room, corridors, office, or cashier counters?\n\n_Select quantity (0 to 32) from the menu below or reply directly with any number:_`,
          "Select Indoor Cameras",
          [
            {
              title: "Standard Quantities (0 to 4)",
              rows: [
                { id: "in_0", title: "0 Cameras (None Inside)", description: "All cameras will be outdoor bullets" },
                { id: "in_1", title: "1 Indoor Dome", description: "Living hall / main reception" },
                { id: "in_2", title: "2 Indoor Domes", description: "Hall + cashier desk / master bedroom" },
                { id: "in_3", title: "3 Indoor Domes", description: "Hall + 2 rooms / cabins" },
                { id: "in_4", title: "4 Indoor Domes", description: "4 separate indoor zones" },
              ]
            },
            {
              title: "Commercial & Large (6 to 32)",
              rows: [
                { id: "in_6", title: "6 Indoor Domes", description: "Medium commercial interior / 6 rooms" },
                { id: "in_8", title: "8 Indoor Domes", description: "Comprehensive commercial interior" },
                { id: "in_16", title: "16 Indoor Domes", description: "Departmental store / corporate floor" },
                { id: "in_32", title: "32 Indoor Domes", description: "Hotel, school, hospital campus" },
                { id: "in_custom", title: "✏️ Custom Quantity (0-32)", description: "Reply with any exact number 0 to 32" }
              ]
            }
          ]
        ));
        break;

      case "ASK_TECH":
        if (incomingType === "interactive") {
          session.wizard_answers.technology = content.replace("tech_", "");
          nextState = "ASK_STORAGE_DAYS";

          replies.push(MessageBuilder.list(
            from,
            `*Step 6 (Storage):* How many days of recording retention do you require?`,
            "Select Storage Days",
            [
              {
                title: "Recording Retention",
                rows: [
                  { id: "storage_0", title: "0 Days (No Recording)", description: "Live mobile viewing only. Zero storage cost." },
                  { id: "storage_7", title: "7 Days (Basic)", description: "Standard week buffer" },
                  { id: "storage_15", title: "15 Days (Recommended)", description: "Optimal commercial/home standard" },
                  { id: "storage_30", title: "30 Days (Extended)", description: "Full month peace-of-mind" },
                  { id: "storage_45", title: "45 Days (High Security)", description: "Extended commercial compliance" },
                  { id: "storage_60", title: "60 Days (Maximum)", description: "Highest statutory retention" }
                ]
              }
            ]
          ));
        }
        break;

      case "ASK_STORAGE_DAYS":
        if (incomingType === "interactive") {
          const days = parseInt(content.replace("storage_", ""), 10);
          session.wizard_answers.recording_days = days;

          if (days === 0) {
            session.wizard_answers.recording_mode = "none";
            nextState = "ASK_MOUNTING_CONDITIONS";

            replies.push(MessageBuilder.buttons(
              from,
              `*Mounting Height:* What is the approximate ceiling / mounting height at your site?`,
              [
                { id: "mount_standard", title: "Standard (< 10 ft)" },
                { id: "mount_high", title: "High (10-15 ft)" },
                { id: "mount_very_high", title: "Very High (15 ft+)" }
              ]
            ));
          } else {
            nextState = "ASK_RECORDING_MODE";

            replies.push(MessageBuilder.buttons(
              from,
              `*Recording Mode:* How would you like your system to record?`,
              [
                { id: "mode_continuous", title: "⏺️ 24x7 Continuous" },
                { id: "mode_motion", title: "🏃 Smart Motion (Save 50%)" }
              ]
            ));
          }
        }
        break;

      case "ASK_RECORDING_MODE":
        if (incomingType === "interactive") {
          session.wizard_answers.recording_mode = content === "mode_motion" ? "motion" : "continuous";
          nextState = "ASK_MOUNTING_CONDITIONS";

          replies.push(MessageBuilder.buttons(
            from,
            `*Mounting Height:* What is the approximate ceiling / mounting height at your site?`,
            [
              { id: "mount_standard", title: "Standard (< 10 ft)" },
              { id: "mount_high", title: "High (10-15 ft)" },
              { id: "mount_very_high", title: "Very High (15 ft+)" }
            ]
          ));
        }
        break;

      case "ASK_MOUNTING_CONDITIONS":
        if (incomingType === "interactive") {
          const heightMap: Record<string, string> = {
            mount_standard: "standard",
            mount_high: "high",
            mount_very_high: "very_high"
          };
          session.wizard_answers.ceiling_height = heightMap[content] || "standard";
          nextState = "ASK_CABLING_OR_POWER";

          if (session.wizard_answers.technology === "Wireless") {
            replies.push(MessageBuilder.buttons(
              from,
              `*Camera Power Point Availability:* Cameras communicate wirelessly, but need electrical power. Select site power condition:`,
              [
                { id: "pwr_socket", title: "🔌 Socket Nearby (<1.5m)" },
                { id: "pwr_wire", title: "⚡ Need 2-Core Wire" },
                { id: "pwr_survey", title: "📋 Decide on Site Visit" }
              ]
            ));
          } else {
            replies.push(MessageBuilder.buttons(
              from,
              `*Cabling Status:* Is your property already pre-wired with CCTV cables, or do we need to lay new cables?`,
              [
                { id: "cab_new", title: "🆕 Need New Cabling" },
                { id: "cab_prewired", title: "🔌 Pre-Wired Site" }
              ]
            ));
          }
        }
        break;

      case "ASK_CABLING_OR_POWER":
        if (incomingType === "interactive") {
          if (content === "cab_prewired") {
            session.wizard_answers.cabling_status = "done";
            session.wizard_answers.cabling_done = true;
          } else if (content === "cab_new") {
            session.wizard_answers.cabling_status = "needed";
            session.wizard_answers.cabling_done = false;
          } else if (content === "pwr_socket") {
            session.wizard_answers.power_wiring_option = "socket_available";
          } else if (content === "pwr_wire") {
            session.wizard_answers.power_wiring_option = "wire_needed";
          } else if (content === "pwr_survey") {
            session.wizard_answers.power_wiring_option = "site_survey";
          }

          // If 4G SIM camera already chosen, broadband is already solved!
          if (session.wizard_answers.is_4g || session.wizard_answers.broadband_status === "independent_4g") {
            nextState = "ASK_TIMELINE";
            replies.push(MessageBuilder.buttons(
              from,
              `⏱️ *When do you plan to get work / installation done at your site?*`,
              [
                { id: "time_asap", title: "⚡ ASAP (1-2 Days)" },
                { id: "time_week", title: "📅 Within a Week" },
                { id: "time_month", title: "🗓️ This Month / Later" }
              ]
            ));
          } else if (session.wizard_answers.technology === "Wireless") {
            nextState = "ASK_INTERNET";
            replies.push(MessageBuilder.buttons(
              from,
              `*Wi-Fi / Internet at Site:* Select Wi-Fi condition for live mobile app viewing:`,
              [
                { id: "net_wifi_full", title: "📶 Have Wi-Fi (Full Reach)" },
                { id: "net_wifi_extender", title: "📡 Have Wi-Fi, Need Extender" },
                { id: "net_4g_router", title: "🌐 Need 4G SIM Router" }
              ]
            ));
          } else {
            nextState = "ASK_INTERNET";
            replies.push(MessageBuilder.buttons(
              from,
              `*Mobile Viewing & Internet:* Choose how you want to watch live camera video on your smartphone:`,
              [
                { id: "net_wifi", title: "📶 Have Wi-Fi Router" },
                { id: "net_4g", title: "🌐 Add 4G SIM Router" },
                { id: "net_offline", title: "📺 Offline / TV Only" }
              ]
            ));
          }
        }
        break;

      case "ASK_INTERNET":
        if (incomingType === "interactive") {
          if (content === "net_offline") {
            session.wizard_answers.broadband_status = "no";
            session.wizard_answers.wants_remote_viewing = false;
          } else if (content === "net_4g" || content === "net_4g_router") {
            session.wizard_answers.broadband_status = "sim_router";
            session.wizard_answers.wants_remote_viewing = true;
          } else if (content === "net_wifi_extender") {
            session.wizard_answers.broadband_status = "wifi_extender";
            session.wizard_answers.wants_remote_viewing = true;
          } else {
            session.wizard_answers.broadband_status = "yes";
            session.wizard_answers.wants_remote_viewing = true;
          }

          nextState = "ASK_TIMELINE";
          replies.push(MessageBuilder.buttons(
            from,
            `⏱️ *When do you plan to get work / installation done at your site?*`,
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
