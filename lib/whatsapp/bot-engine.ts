/**
 * @file lib/whatsapp/bot-engine.ts
 * @description Master finite state machine for TEAM CCTV WhatsApp Omnichannel Engine.
 * Features: Zero-Loss Instant Lead Capture on Message 1, 100% Website Wizard Parity,
 * Multi-Brand Price Range Summary, In-Chat Competitor Quote OCR, and 4 Checkout Pathways.
 */

import { adminDb } from "../firebase-admin";
import { COLLECTIONS } from "../constants";
import { WhatsAppBotState, WhatsAppSession, WhatsAppIncomingType } from "../../types/whatsapp";
import { MessageBuilder, WhatsAppMessagePayload } from "./message-builder";
import { addLeadActivity } from "@/app/actions/leads";
import { normalizePhoneNumber } from "./deduplication";
import { resolveLanguageInput, languageNames, ALL_11_LANGUAGES } from "../i18n/mapping";
import { buildWelcomeLanguageMenu, getConversationalStrings } from "./conversational-i18n";
import { 
  generateAndSendPriceRanges, 
  sendBrandVariations, 
  finalizeAndSendQuote, 
  handleCheckoutAction, 
  handleSlotSelection 
} from "./quote-dispatch";

/**
 * Hybrid Quick-Tap Buttons Message for Camera Quantities.
 * Presents up to 3 quick-tap buttons (e.g. 2 Bullets, 4 Bullets, 0 None)
 * combined with a clear prompt to reply directly with any number (0 to 32).
 * Meta Cloud API strictly enforces maximum 3 buttons per interactive message.
 */
export function buildQuantityButtonsMessage(
  recipient: string,
  prefix: string, // "out" | "in" | "wfq"
  headerText: string,
  buttonLabels: { id: string; title: string }[],
  numberHintText?: string
) {
  const hint = numberHintText || "👉 *Reply with any number (0 to 32)*, or tap below:";
  const text = `${headerText}\n\n${hint}`;
  const buttons = buttonLabels.slice(0, 3).map(b => ({
    id: b.id,
    title: b.title.slice(0, 20)
  }));
  return MessageBuilder.buttons(recipient, text, buttons);
}

export function buildQuantityListMessage(
  recipient: string,
  prefix: string, // "out" | "in" | "wfq"
  itemLabel: string, // e.g. "Outdoor Bullet", "Indoor Dome", "Indoor 360° Pan-Tilt"
  pluralLabel: string, // e.g. "Outdoor Bullets", "Indoor Domes", "Cameras"
  page: number, // 1 to 4
  headerText: string,
  buttonText: string = "Select Quantity"
) {
  const safePage = Math.max(1, Math.min(4, page));
  const rows: Array<{ id: string; title: string; description: string }> = [];

  if (safePage === 1) {
    for (let i = 0; i <= 7; i++) {
      rows.push({
        id: `${prefix}_${i}`,
        title: `${i} ${i === 1 ? itemLabel : pluralLabel}`,
        description: i === 0 ? `0 Cameras (None)` : `${i}x ${itemLabel}`
      });
    }
    rows.push({
      id: `${prefix}_page_2`,
      title: `➡️ Next: 8 to 15`,
      description: `Tap to choose between 8 and 15 ${pluralLabel}`
    });
    rows.push({
      id: `${prefix}_custom`,
      title: `✏️ Type Any Number`,
      description: `Reply directly in chat with your exact count (0-32)`
    });
  } else if (safePage === 2) {
    for (let i = 8; i <= 15; i++) {
      rows.push({
        id: `${prefix}_${i}`,
        title: `${i} ${pluralLabel}`,
        description: `${i}x ${itemLabel}`
      });
    }
    rows.push({
      id: `${prefix}_page_1`,
      title: `⬅️ Prev: 0 to 7`,
      description: `Return to quantities 0 to 7`
    });
    rows.push({
      id: `${prefix}_page_3`,
      title: `➡️ Next: 16 to 23`,
      description: `Tap to choose between 16 and 23 ${pluralLabel}`
    });
  } else if (safePage === 3) {
    for (let i = 16; i <= 23; i++) {
      rows.push({
        id: `${prefix}_${i}`,
        title: `${i} ${pluralLabel}`,
        description: `${i}x ${itemLabel}`
      });
    }
    rows.push({
      id: `${prefix}_page_2`,
      title: `⬅️ Prev: 8 to 15`,
      description: `Return to quantities 8 to 15`
    });
    rows.push({
      id: `${prefix}_page_4`,
      title: `➡️ Next: 24 to 32`,
      description: `Tap to choose between 24 and 32 ${pluralLabel}`
    });
  } else if (safePage === 4) {
    for (let i = 24; i <= 32; i++) {
      rows.push({
        id: `${prefix}_${i}`,
        title: `${i} ${pluralLabel}`,
        description: `${i}x ${itemLabel}`
      });
    }
    rows.push({
      id: `${prefix}_page_3`,
      title: `⬅️ Prev: 16 to 23`,
      description: `Return to quantities 16 to 23`
    });
  }

  const rangeLabel = safePage === 1 ? "0 to 7" : safePage === 2 ? "8 to 15" : safePage === 3 ? "16 to 23" : "24 to 32";

  return MessageBuilder.list(
    recipient,
    `${headerText}\n\n_Page ${safePage} of 4 • Select exact quantity (${rangeLabel}) or type any number (0 to 32) in chat:_`,
    buttonText,
    [
      {
        title: `Quantity (${rangeLabel})`,
        rows
      }
    ]
  );
}

/**
 * Returns the exact interactive message payload(s) for the customer's current conversation state.
 * Used for seamless journey retention when off-topic messages or images/documents are received.
 */
export function getStepPrompt(
  session: WhatsAppSession, 
  state: WhatsAppBotState, 
  from: string
): WhatsAppMessagePayload[] {
  const replies: WhatsAppMessagePayload[] = [];
  const cleanPhone = from.replace(/\D/g, "");
  const partnerRef = session.partner_id ? `&ref=${session.partner_id}` : "";
  const nameParam = session.customer_name && session.customer_name !== "WhatsApp Customer" ? `&name=${encodeURIComponent(session.customer_name)}` : "";
  const propParam = session.wizard_answers?.property_type ? `&property=${session.wizard_answers.property_type}` : "";
  const pinParam = session.wizard_answers?.lead_pincode ? `&pincode=${session.wizard_answers.lead_pincode}` : "";
  const langParam = session.language ? `&lang=${session.language}` : "";
  const webWizardUrl = `https://cctvquotation.com/wizard?phone=${cleanPhone}${partnerRef}${nameParam}${propParam}${pinParam}${langParam}&source=wa_prompt_resume`;
  const conv = getConversationalStrings(session.language);

  switch (state) {
    case "IDLE":
    case "GREETING":
    case "ASK_PROP": {
      if (!session.language) {
        replies.push(MessageBuilder.buttons(
          from,
          buildWelcomeLanguageMenu(),
          [
            { id: "prop_home", title: "🏠 Home / घर" },
            { id: "prop_office", title: "🏢 Office / दुकान" },
            { id: "prop_factory", title: "🏭 Factory / गोदाम" }
          ]
        ));
      } else {
        replies.push(MessageBuilder.buttons(
          from,
          `*${conv.propHeader}*\n${conv.propQuestion}`,
          [
            { id: "prop_home", title: conv.propHomeTitle.slice(0, 20) },
            { id: "prop_office", title: conv.propOfficeTitle.slice(0, 20) },
            { id: "prop_factory", title: conv.propFactoryTitle.slice(0, 20) }
          ]
        ));
      }
      break;
    }

    case "ASK_INSTALL_TYPE": {
      const propTitle = session.wizard_answers?.property_type === "home" 
        ? conv.propHomeTitle.replace(/^[^\w\s\u0900-\u0D7F]+/, "").trim() 
        : session.wizard_answers?.property_type === "office" 
        ? conv.propOfficeTitle.replace(/^[^\w\s\u0900-\u0D7F]+/, "").trim() 
        : conv.propFactoryTitle.replace(/^[^\w\s\u0900-\u0D7F]+/, "").trim();
      replies.push(MessageBuilder.list(
        from,
        `✓ Property: *${propTitle}*\n\n*${conv.installHeader}*\n${session.language && session.language !== 'en' ? 'कृपया अपनी आवश्यकतानुसार इंस्टालेशन प्रकार चुनें:' : 'What kind of installation do you require? Please choose from the list below:'}`,
        "Choose Install Type",
        [
          {
            title: "Installation Types",
            rows: [
              { id: "ins_new_wired", title: conv.installWiredTitle.slice(0, 24), description: conv.installWiredDesc.slice(0, 72) },
              { id: "ins_wireless", title: conv.installWirelessTitle.slice(0, 24), description: conv.installWirelessDesc.slice(0, 72) },
              { id: "ins_4g_solar", title: conv.install4gTitle.slice(0, 24), description: conv.install4gDesc.slice(0, 72) },
              { id: "ins_addon", title: conv.installAddonTitle.slice(0, 24), description: conv.installAddonDesc.slice(0, 72) }
            ]
          }
        ]
      ));
      break;
    }

    case "ASK_CAMERA_OUTDOOR": {
      replies.push(buildQuantityButtonsMessage(
        from, "out",
        `*${conv.outdoorHeader}*\n\n${conv.outdoorQuestion}`,
        [
          { id: "out_2", title: `2 ${conv.quickBtnBullets || "Bullets"}` },
          { id: "out_4", title: `4 ${conv.quickBtnBullets || "Bullets"}` },
          { id: "out_0", title: conv.quickBtnNone || "0 (None)" }
        ],
        conv.numberReplyHint
      ));
      break;
    }

    case "ASK_CAMERA_INDOOR": {
      const outCount = session.wizard_answers?.outdoor_camera_count || 0;
      replies.push(buildQuantityButtonsMessage(
        from, "in",
        `✓ Outdoor Cameras: *${outCount}*\n\n*${conv.indoorHeader}*\n\n${conv.indoorQuestion}`,
        [
          { id: "in_2", title: `2 ${conv.quickBtnDomes || "Domes"}` },
          { id: "in_4", title: `4 ${conv.quickBtnDomes || "Domes"}` },
          { id: "in_0", title: conv.quickBtnNone || "0 (None)" }
        ],
        conv.numberReplyHint
      ));
      break;
    }

    case "ASK_HYBRID_WIRELESS": {
      const totalWired = (session.wizard_answers?.outdoor_camera_count || 0) + (session.wizard_answers?.indoor_camera_count || 0);
      replies.push(MessageBuilder.list(
        from,
        `✓ *Wired Cameras Configured:* ${totalWired} Cameras (${session.wizard_answers?.outdoor_camera_count || 0} Out + ${session.wizard_answers?.indoor_camera_count || 0} In)\n\n📡 *Step 2 of 6: Smart Wireless Add-ons (Wi-Fi / 4G SIM)*\n_Optional • Mix wired DVR + wireless cameras in one system_\n\nDo you want to add wireless cameras for remote gate, terrace, baby room, or farm corners without video cables?`,
        "Wireless Options",
        [
          {
            title: "Smart Wireless Add-on Options",
            rows: [
              { id: "wf_none", title: "❌ None (Proceed to Step 3)", description: "Proceed with standard wired DVR setup only" },
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
    }

    case "ASK_WIRELESS_QTY": {
      const variant = session.wizard_answers?.selected_wireless_variant || "wf_in_ptz";
      const variantTitles: Record<string, { single: string; plural: string }> = {
        wf_in_ptz: { single: "Indoor 360° Pan-Tilt (Wi-Fi)", plural: "Indoor 360° Pan-Tilt Cameras" },
        wf_in_fixed: { single: "Indoor Fixed Dome / Cube (Wi-Fi)", plural: "Indoor Fixed Cameras" },
        wf_out_bullet: { single: "Outdoor Fixed Weatherproof Bullet (Wi-Fi)", plural: "Outdoor Wi-Fi Bullets" },
        wf_out_ptz: { single: "Outdoor 360° Pan-Tilt PTZ (Wi-Fi)", plural: "Outdoor 360° PTZ Cameras" },
        wf_4g_solar: { single: "4G SIM / Solar Standalone Camera", plural: "4G SIM Cameras" }
      };
      const vInfo = variantTitles[variant] || { single: "Smart Wireless Camera", plural: "Smart Wireless Cameras" };
      replies.push(buildQuantityButtonsMessage(
        from, "wfq",
        `How many *${vInfo.single}* cameras do you need mounted at your site?`,
        [
          { id: "wfq_1", title: "1 Camera" },
          { id: "wfq_2", title: "2 Cameras" },
          { id: "wfq_0", title: conv.quickBtnNone || "0 (None)" }
        ],
        conv.numberReplyHint
      ));
      break;
    }

    case "ASK_TIMELINE": {
      replies.push(MessageBuilder.list(
        from,
        `⏱️ *WHEN DO YOU WANT WORK DONE ON YOUR SITE?*\nPriority Dispatch Scheduler (Step 2 of 6)\n\nHelps us schedule certified technician availability & prioritize your site survey:`,
        "Select Timeline",
        [
          {
            title: "Priority Dispatch Scheduler",
            rows: [
              { id: "time_asap", title: "⚡ ASAP (1-2 Days)", description: "Ready for instant site survey & work" },
              { id: "time_week", title: "📅 Within a Week", description: "Finalizing quotation & setup" },
              { id: "time_month", title: "🗓️ This Month", description: "Site currently under construction" },
              { id: "time_research", title: "🔍 Just Planning", description: "Comparing prices & options" }
            ]
          }
        ]
      ));
      break;
    }

    case "ASK_STORAGE_DAYS": {
      replies.push(MessageBuilder.list(
        from,
        `*${conv.storageHeader}*\n\n${conv.storageQuestion}`,
        "Select Storage Days",
        [
          {
            title: "Recording Retention",
            rows: [
              { id: "storage_7", title: "7 Days Backup", description: "Standard week buffer (Included)" },
              { id: "storage_15", title: "15 Days Backup", description: "Recommended (1TB surveillance drive)" },
              { id: "storage_30", title: "30 Days Backup", description: "Full month peace-of-mind (2TB drive)" },
              { id: "storage_60", title: "60 Days Backup", description: "Maximum commercial compliance" },
              { id: "storage_0", title: "0 Days (No Recording)", description: "Live mobile viewing only. Zero storage cost." }
            ]
          }
        ]
      ));
      break;
    }

    case "ASK_RECORDING_MODE": {
      const days = session.wizard_answers?.recording_days ?? 7;
      replies.push(MessageBuilder.buttons(
        from,
        `✓ Storage Retention: *${days} Days*\n\n🎥 *Step 3 of 6: Recording Mode*\n\nHow would you like your system to record?`,
        [
          { id: "mode_continuous", title: "⏺️ 24x7 Continuous" },
          { id: "mode_motion", title: "⚡ Smart Motion" }
        ]
      ));
      break;
    }

    case "ASK_MOUNTING_CONDITIONS": {
      replies.push(MessageBuilder.buttons(
        from,
        `🏗️ *Step 4 of 6: Approximate Mounting Height*\n\nWhat is the approximate ceiling / mounting height at your site?`,
        [
          { id: "mount_standard", title: "Standard (<10ft)" },
          { id: "mount_high", title: "High (10-15ft)" },
          { id: "mount_very_high", title: "Very High (15ft+)" }
        ]
      ));
      break;
    }

    case "ASK_SURFACE_TYPE": {
      replies.push(MessageBuilder.buttons(
        from,
        `🧱 *Step 4 of 6: Surface Type*\n\nWhat surface will the cameras be mounted on?`,
        [
          { id: "surf_brick", title: "🧱 Concrete / Brick" },
          { id: "surf_ceiling", title: "🏢 False Ceiling" }
        ]
      ));
      break;
    }

    case "ASK_CABLING_OR_POWER": {
      const isWireless = session.wizard_answers?.technology === "Wireless" || 
                         session.wizard_answers?.technology_preference === "Wireless";
      if (isWireless) {
        replies.push(MessageBuilder.buttons(
          from,
          `*Step 4 of 6: Camera Power Point Availability* 🔌\n\nCameras connect wirelessly, but each requires electrical power. Select site power condition:`,
          [
            { id: "pwr_socket", title: "🔌 Socket Nearby" },
            { id: "pwr_wire", title: "⚡ Need Power Wire" },
            { id: "pwr_survey", title: "📋 Decide on Visit" }
          ]
        ));
      } else {
        const wiredCams = Math.max(1, (session.wizard_answers?.outdoor_camera_count || 0) + (session.wizard_answers?.indoor_camera_count || 0));
        const freeAllowance = wiredCams * 15;
        replies.push(MessageBuilder.buttons(
          from,
          `*Step 4 of 6: Cabling & Wire Routing* 🔌\n\nIs your site pre-wired or do we need fresh cables routed?\n\n• *Complimentary:* ~15m wire/camera included free (*${freeAllowance}m total* for your ${wiredCams} cameras).`,
          [
            { id: "cab_new", title: "📦 Need New Cabling" },
            { id: "cab_prewired", title: "🔌 Site Pre-Wired" },
            { id: "cab_custom", title: "📏 Custom Cable Run" }
          ]
        ));
      }
      break;
    }

    case "ASK_CUSTOM_CABLE_METERS": {
      replies.push(MessageBuilder.text(
        from,
        `📏 *Custom Cable Length:*\n\nPlease reply with your estimated total cable run in meters (e.g. 70, 90, 120, 150):`
      ));
      break;
    }

    case "ASK_HYBRID_POWER": {
      const wifiCount = session.wizard_answers?.wifi_camera_count || 1;
      replies.push(MessageBuilder.buttons(
        from,
        `⚡ *Power for ${wifiCount} Smart Wi-Fi Camera${wifiCount > 1 ? 's' : ''}:*\nYour wired cameras connect to the DVR, but Wi-Fi cameras need electrical power. Select power setup:`,
        [
          { id: "pwr_socket", title: "🔌 Socket Nearby" },
          { id: "pwr_wire", title: "⚡ Need Power Wire" },
          { id: "pwr_survey", title: "📋 Decide on Visit" }
        ]
      ));
      break;
    }

    case "ASK_INTERNET": {
      replies.push(MessageBuilder.buttons(
        from,
        `📱 *Step 5 of 6: Remote Mobile Viewing & Internet*\n\nChoose how you want to watch live camera video on your smartphone:`,
        [
          { id: "net_wifi", title: "📶 Have Wi-Fi Router" },
          { id: "net_4g", title: "🌐 Add 4G SIM Router" },
          { id: "net_offline", title: "📺 Offline / TV Only" }
        ]
      ));
      break;
    }

    case "ASK_PINCODE": {
      replies.push(MessageBuilder.text(
        from,
        `*${conv.pincodeHeader}*\n\n${conv.pincodeQuestion}`
      ));
      break;
    }

    case "ASK_NAME": {
      const knownName = session.customer_name && session.customer_name !== "WhatsApp Customer" && !/^\+?\d+$/.test(session.customer_name)
        ? session.customer_name
        : "";
      const namePrompt = knownName
        ? `*${conv.nameHeader}*\n\n${conv.nameQuestion}\n\n_Or reply *1* or *Yes* to use *${knownName}*._`
        : `*${conv.nameHeader}*\n\n${conv.nameQuestion}`;
      replies.push(MessageBuilder.text(from, namePrompt));
      break;
    }

    case "SHOW_PRICE_RANGES": {
      replies.push(MessageBuilder.buttons(
        from,
        `📊 *Your Quotation Packages Are Ready!*\n\nTap below to inspect brand packages and locked trade prices:`,
        [
          { id: "back_to_brands", title: "📦 View Brand Packages" },
          { id: "open_web_studio", title: "🌐 Open 3D Web Studio" }
        ]
      ));
      break;
    }

    default: {
      replies.push(MessageBuilder.buttons(
        from,
        `*Step 1 of 6: Property Type*\nWhat type of property are you securing?`,
        [
          { id: "prop_home", title: "🏠 Home / Flat" },
          { id: "prop_office", title: "🏢 Office / Shop" },
          { id: "prop_factory", title: "🏭 Factory / Farm" }
        ]
      ));
      break;
    }
  }

  return replies;
}

export function cleanInboundText(content: any): string {
  if (typeof content !== "string") return "";
  const lines = content.split("\n");
  const unquoted = lines.filter(line => {
    const t = line.trim();
    if (t.startsWith(">")) return false;
    if (t.startsWith("✓")) return false;
    if (t.startsWith("•")) return false;
    if (t.startsWith("⚡")) return false;
    if (t.startsWith("Welcome to TEAM CCTV")) return false;
    if (t.startsWith("Step ")) return false;
    return true;
  });
  const cleaned = unquoted.join(" ").trim();
  return cleaned || content.trim();
}

// In-process mutex to prevent concurrent double-execution of the state machine for the same user
const currentlyExecutingPhones = new Set<string>();

export async function processIncomingMessage(
  from: string, 
  incomingType: WhatsAppIncomingType, 
  content: any,
  context?: {
    profileName?: string;
    referral?: any;
    locationCoords?: { latitude: number; longitude: number };
    mediaId?: string;
  }
) {
  const canonicalFrom = normalizePhoneNumber(from);
  if (currentlyExecutingPhones.has(canonicalFrom)) {
    console.warn(`[BotEngine] Mutex lock: ${canonicalFrom} is already processing an inbound webhook. Dropping concurrent request.`);
    return;
  }

  currentlyExecutingPhones.add(canonicalFrom);
  try {
    await processIncomingMessageInternal(canonicalFrom, incomingType, content, context);
  } finally {
    currentlyExecutingPhones.delete(canonicalFrom);
  }
}

async function processIncomingMessageInternal(
  from: string, 
  incomingType: WhatsAppIncomingType, 
  content: any,
  context?: {
    profileName?: string;
    referral?: any;
    locationCoords?: { latitude: number; longitude: number };
    mediaId?: string;
  }
) {
  // If content is string, clean out any WhatsApp quote replies or message echoes
  if (typeof content === "string") {
    content = cleanInboundText(content);
  }

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
  // 0. SESSION-LEVEL RAPID-FIRE & DUPLICATE DEBOUNCE
  // ──────────────────────────────────────────────────────────────────────────
  const nowMs = Date.now();
  const normalizedIncomingText = typeof content === "string" 
    ? content.trim().toLowerCase() 
    : (content?.id || content?.title || JSON.stringify(content || "")).slice(0, 100);

  const lastMsgTime = session.last_message_at 
    ? (typeof (session.last_message_at as any).toDate === "function" 
        ? (session.last_message_at as any).toDate().getTime() 
        : new Date(session.last_message_at as any).getTime())
    : 0;

  const isSameContent = Boolean(
    session.last_inbound_text && 
    session.last_inbound_text === normalizedIncomingText
  );

  // If the exact same message arrives within 15 seconds from the same user, suppress duplicate execution
  if (isSameContent && (nowMs - lastMsgTime < 15000)) {
    console.warn(`[BotEngine] Suppressing duplicate rapid-fire message for ${from}: "${normalizedIncomingText}" (${nowMs - lastMsgTime}ms ago)`);
    return;
  }

  // Update session tracking and persist timestamp immediately to prevent concurrent duplicate runs
  session.last_inbound_text = normalizedIncomingText;
  session.last_message_at = new Date();
  await sessionRef.set({
    last_inbound_text: normalizedIncomingText,
    last_message_at: session.last_message_at,
  }, { merge: true });

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
    if (
      textLower.startsWith("hi") || 
      textLower.startsWith("hello") || 
      textLower === "start" || 
      textLower === "restart" || 
      textLower === "reset" || 
      textLower === "menu"
    ) {
      session.state = "GREETING";
      session.wizard_answers = {}; // Reset for fresh customer journey with zero state leakage
      await sessionRef.update({
        state: "GREETING",
        wizard_answers: {},
        updated_at: new Date()
      }).catch(() => {});
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
  // 3. INBOUND MEDIA HANDLER (Site Photos, Blueprints & Competitor Quotations)
  // Preserves active customer journey, attaches media to CRM lead, and re-prompts the active step
  // ──────────────────────────────────────────────────────────────────────────
  if (incomingType === "image" || incomingType === "document") {
    if (leadId) {
      await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
        competitor_quote_received: true,
        competitor_quote_media_id: context?.mediaId || null,
        competitor_quote_received_at: new Date(),
        has_media_attachments: true,
        updated_at: new Date(),
      }).catch(console.error);

      await addLeadActivity(
        leadId,
        "customer_media_uploaded",
        `Received ${incomingType} from customer via WhatsApp. Preserved active step: ${session.state}`
      ).catch(console.error);
    }

    const ackText = 
      `📸 *Photo / Document Received & Saved to Your Project File!* 📁\n\n` +
      `• *Competitor Quotation:* If this is an offline quote, our desk will analyze it for our *5%–10% Price Match Guarantee*.\n` +
      `• *Site Photo:* If this is your gate, walls, ceiling, or DVR, our certified technician will review it for your *Free On-Site Survey*.\n\n` +
      `👇 *Let's continue customizing your CCTV setup:*`;

    const ackMsg = MessageBuilder.text(from, ackText);
    const stepPrompts = getStepPrompt(session, session.state, from);
    await sendWhatsAppMessages([ackMsg, ...stepPrompts]);
    return;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 3B. VOICE NOTE (AUDIO), SITE VIDEO & STICKER HANDLER
  // Captures non-text media into lead file and prompts user with active controls
  // ──────────────────────────────────────────────────────────────────────────
  if (incomingType === "audio") {
    if (leadId) {
      await addLeadActivity(
        leadId,
        "customer_voice_note_uploaded",
        `Received Voice Note from customer via WhatsApp. Preserved active step: ${session.state}`
      ).catch(console.error);
      await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
        has_media_attachments: true,
        updated_at: new Date(),
      }).catch(console.error);
    }

    const ackText = 
      `🎙️ *Voice Note Received & Attached to Your Project File!* 📁\n\n` +
      `Our technical desk will listen to your audio instructions for your installation layout.\n\n` +
      `👇 *To get your instant quotation right now, please select from the options below:*`;

    const ackMsg = MessageBuilder.text(from, ackText);
    const stepPrompts = getStepPrompt(session, session.state, from);
    await sendWhatsAppMessages([ackMsg, ...stepPrompts]);
    return;
  }

  if (incomingType === "video") {
    if (leadId) {
      await addLeadActivity(
        leadId,
        "customer_video_uploaded",
        `Received Site Video from customer via WhatsApp. Preserved active step: ${session.state}`
      ).catch(console.error);
      await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
        has_media_attachments: true,
        updated_at: new Date(),
      }).catch(console.error);
    }

    const ackText = 
      `🎥 *Site Video Received & Saved to Your Project File!* 📁\n\n` +
      `Our installation engineer will inspect your premises layout from your video for camera viewing angles and cable routing.\n\n` +
      `👇 *Let's continue customizing your CCTV setup:*`;

    const ackMsg = MessageBuilder.text(from, ackText);
    const stepPrompts = getStepPrompt(session, session.state, from);
    await sendWhatsAppMessages([ackMsg, ...stepPrompts]);
    return;
  }

  if (incomingType === "sticker") {
    const ackText = `👍 *Received! Let's continue building your CCTV quotation:*`;
    const ackMsg = MessageBuilder.text(from, ackText);
    const stepPrompts = getStepPrompt(session, session.state, from);
    await sendWhatsAppMessages([ackMsg, ...stepPrompts]);
    return;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 4. WHATSAPP FLOW (NFM_REPLY) SUBMISSION HANDLER
  // ──────────────────────────────────────────────────────────────────────────
  if (incomingType === "nfm_reply") {
    try {
      const raw = typeof content === "string" ? JSON.parse(content) : content;
      
      const outdoor = parseInt(raw.outdoor_camera_count || "0", 10);
      const indoor = parseInt(raw.indoor_camera_count || "0", 10);
      
      const wifiPtz = parseInt(raw.wifi_indoor_ptz || "0", 10);
      const wifiBullet = parseInt(raw.wifi_outdoor_bullet || "0", 10);
      const wifiOutPtz = parseInt(raw.wifi_outdoor_ptz || "0", 10);
      const wifi4gSolar = parseInt(raw.wifi_4g_solar || "0", 10);
      const wifiDome = parseInt(raw.wifi_indoor_dome || "0", 10);
      const wifiTotal = wifiPtz + wifiBullet + wifiOutPtz + wifi4gSolar + wifiDome;
      const totalCameras = Math.max(1, outdoor + indoor + wifiTotal);

      const timeline = raw.timeline || session.wizard_answers?.timeline || "asap";
      const storageDays = raw.storage_days !== undefined 
        ? parseInt(String(raw.storage_days), 10) 
        : (session.wizard_answers?.recording_days ?? 15);
      const techPref = raw.technology || (wifiTotal > 0 && outdoor + indoor === 0 ? "Wireless" : "HD");
      const pincode = raw.lead_pincode || raw.pincode || session.wizard_answers?.lead_pincode;

      session.wizard_answers = {
        ...session.wizard_answers,
        outdoor_camera_count: outdoor,
        indoor_camera_count: indoor,
        wifi_indoor_ptz_count: wifiPtz,
        wifi_outdoor_bullet_count: wifiBullet,
        wifi_outdoor_ptz_count: wifiOutPtz,
        wifi_4g_solar_count: wifi4gSolar,
        wifi_camera_count: wifiTotal,
        camera_count: totalCameras,
        timeline,
        recording_days: storageDays,
        technology: techPref,
        ...(pincode ? { lead_pincode: String(pincode).trim() } : {}),
      };

      if (session.wizard_answers.lead_pincode && /^\d{6}$/.test(session.wizard_answers.lead_pincode)) {
        session.state = "GENERATING";
        const replyMsg = MessageBuilder.text(
          from,
          `⚙️ *WhatsApp Flow Setup Received!*\n\n` +
          `• Wired Outdoor Bullets: *${outdoor}*\n` +
          `• Wired Indoor Domes: *${indoor}*\n` +
          `• Smart Wireless Cameras: *${wifiTotal}*\n` +
          `• Total Cameras: *${totalCameras}*\n` +
          `• Storage Backup: *${storageDays} Days*\n` +
          `• Timeline: *${String(timeline).toUpperCase()}*\n\n` +
          `Calculating 100% transparent brand price ranges now... Please wait 3 seconds.`
        );
        await sendWhatsAppMessages([replyMsg]);
        await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
          wizard_answers: session.wizard_answers,
          last_bot_state: "GENERATING",
          updated_at: new Date(),
        });
        await generateAndSendPriceRanges(from, session);
        return;
      } else {
        session.state = "ASK_PINCODE";
        const replyMsg = MessageBuilder.text(
          from,
          `⚙️ *WhatsApp Flow Setup Received!*\n\n` +
          `• Wired Outdoor Bullets: *${outdoor}*\n` +
          `• Wired Indoor Domes: *${indoor}*\n` +
          `• Smart Wireless Cameras: *${wifiTotal}*\n` +
          `• Total Cameras: *${totalCameras}*\n` +
          `• Storage Backup: *${storageDays} Days*\n` +
          `• Timeline: *${String(timeline).toUpperCase()}*\n\n` +
          `📍 To calculate exact local installation charges & brand price ranges, please reply with your *6-digit Indian Pincode* (e.g. 302012) or share your Location Pin.`
        );
        await sendWhatsAppMessages([replyMsg]);
        await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
          wizard_answers: session.wizard_answers,
          last_bot_state: "ASK_PINCODE",
          updated_at: new Date(),
        });
        return;
      }
    } catch (e) {
      console.error("🔥 Error parsing nfm_reply:", e);
    }
  }

  // Handle explicit request for website / web wizard at any point
  const rawInbound = typeof content === "string" ? cleanInboundText(content).toLowerCase().trim() : "";
  if (rawInbound === "website" || rawInbound === "web" || rawInbound === "link" || rawInbound === "web wizard" || rawInbound === "studio") {
    const cleanPhone = from.replace(/\D/g, "");
    const partnerRef = session.partner_id ? `&ref=${session.partner_id}` : "";
    const nameParam = session.customer_name && session.customer_name !== "WhatsApp Customer" ? `&name=${encodeURIComponent(session.customer_name)}` : "";
    const propParam = session.wizard_answers?.property_type ? `&property=${session.wizard_answers.property_type}` : "";
    const pinParam = session.wizard_answers?.lead_pincode || session.wizard_answers?.pincode ? `&pincode=${session.wizard_answers?.lead_pincode || session.wizard_answers?.pincode}` : "";
    const webWizardUrl = `https://cctvquotation.com/wizard?phone=${cleanPhone}${partnerRef}${nameParam}${propParam}${pinParam}&source=wa_chat_help`;
    await sendWhatsAppMessages([
      MessageBuilder.text(
        from,
        `🌐 *TEAM CCTV Interactive Web Studio*\n\nExplore 3D camera angles, compare hardware specs, and customize your quote in your browser:\n👉 ${webWizardUrl}\n\n_Your phone number and referral discount are pre-applied! You can return to WhatsApp anytime._`
      )
    ]);
    return;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // CONTEXTUAL OFF-TOPIC FAQ & ASSISTANCE INTENT CLASSIFIER
  // Intercepts general queries (callbacks, pricing, warranty, locations)
  // without breaking the customer journey or polluting form data.
  // ──────────────────────────────────────────────────────────────────────────
  if (incomingType === "text" && session.state !== "IDLE" && session.state !== "GREETING" && session.state !== "SHOW_PRICE_RANGES") {
    const textLower = rawInbound;

    // 0. On-The-Fly Language Switcher (supports all 11 Indian languages at any time)
    const isExplicitLangQuery = /\b(language|bhasha|boli|zuban|change language)\b/i.test(textLower);
    const resolvedLang = resolveLanguageInput(textLower.trim());
    if (resolvedLang && (isExplicitLangQuery || !/^\d+$/.test(textLower.trim()))) {
      session.language = resolvedLang;
      if (leadId) {
        await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
          preferred_language: resolvedLang,
          preferred_language_name: languageNames[resolvedLang],
          updated_at: new Date()
        }).catch(console.error);
      }
      const conv = getConversationalStrings(resolvedLang);
      const ackMsg = MessageBuilder.text(from, conv.langConfirmed);
      const stepPrompts = getStepPrompt(session, session.state, from);
      await sendWhatsAppMessages([ackMsg, ...stepPrompts]);
      return;
    }

    // 1. Human Specialist / Phone Callback Request
    const isCallRequest = 
      /\b(call|calling|phone|contact|baat|specialist|executive|agent|talk|dial|karo|batao|phone pe|call me)\b/i.test(textLower) &&
      !/^\d+$/.test(textLower) &&
      !textLower.startsWith("out_") &&
      !textLower.startsWith("in_") &&
      !textLower.startsWith("wf_") &&
      !textLower.startsWith("storage_");

    if (isCallRequest) {
      if (leadId) {
        await addLeadActivity(
          leadId,
          "urgent_callback_requested",
          `Customer requested human specialist call via WhatsApp during state: ${session.state}. Query: "${rawInbound}"`
        ).catch(console.error);
        await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
          priority: "URGENT",
          callback_requested: true,
          callback_requested_at: new Date(),
          updated_at: new Date()
        }).catch(console.error);
      }

      const callAck = MessageBuilder.text(
        from,
        `📞 *A certified CCTV specialist has been notified to call you on this number shortly!* 🤝\n\n` +
        `_In the meantime, please complete your equipment options below so we have your specifications and trade discounts ready:_`
      );
      const stepPrompts = getStepPrompt(session, session.state, from);
      await sendWhatsAppMessages([callAck, ...stepPrompts]);
      return;
    }

    // 2. Price / Discount / Negotiation Query (only if not an exact quantity/choice input)
    const isPriceQuery = 
      /\b(rate|price|cost|kitna|kitne|discount|offer|offers|sasta|cheapest|budget|kam|bhav|paisa|paise)\b/i.test(textLower) &&
      !/^\d+$/.test(textLower) &&
      !textLower.startsWith("out_") &&
      !textLower.startsWith("in_") &&
      !textLower.startsWith("wf_") &&
      !textLower.startsWith("storage_");

    if (isPriceQuery) {
      const priceAck = MessageBuilder.text(
        from,
        `💰 *Wholesale Direct Rates with 100% Price Match Guarantee!* 🏷️\n\n` +
        `• Bullet & Dome Cameras start from *₹1,409/camera + 18% GST* with 1-Year Doorstep On-Site Warranty.\n` +
        `• All packages include DVR/NVR, hard drive storage, wiring, connectors, and professional installation.\n\n` +
        `_Your exact package total depends on your camera count and cable length. Please answer below to see your instant multi-brand quote:_`
      );
      const stepPrompts = getStepPrompt(session, session.state, from);
      await sendWhatsAppMessages([priceAck, ...stepPrompts]);
      return;
    }

    // 3. Warranty / Guarantee / Repair Query
    const isWarrantyQuery = 
      /\b(warranty|guarantee|kharab|damage|repair|replace|replacement|service charge|complaint)\b/i.test(textLower) &&
      !/^\d+$/.test(textLower);

    if (isWarrantyQuery) {
      const warrantyAck = MessageBuilder.text(
        from,
        `🛡️ *1-Year Free Doorstep On-Site Warranty + Brand Replacement Guarantee!*\n\n` +
        `Every installation by TEAM CCTV includes 12 months of free on-site service. If any camera, cable, or power supply malfunctions, a certified technician visits your doorstep at *₹0 charge*.\n\n` +
        `_Please choose an option below to continue building your quote:_`
      );
      const stepPrompts = getStepPrompt(session, session.state, from);
      await sendWhatsAppMessages([warrantyAck, ...stepPrompts]);
      return;
    }

    // 4. Service Area / Availability Query (only if NOT in ASK_PINCODE where city names are pincode shortcuts)
    const isLocationQuery = 
      session.state !== "ASK_PINCODE" && 
      /\b(service area|locations|coverage|kahan|where|office address|head office)\b/i.test(textLower) &&
      !/^\d+$/.test(textLower);

    if (isLocationQuery) {
      const locationAck = MessageBuilder.text(
        from,
        `🚚 *Complete Doorstep Coverage across Rajasthan, NCR & Major Hubs!*\n\n` +
        `We dispatch certified local technicians directly from our nearest Sub-Post Office micro-hubs with same-day/next-day inventory.\n\n` +
        `_Please answer the question below to match your nearest local hub:_`
      );
      const stepPrompts = getStepPrompt(session, session.state, from);
      await sendWhatsAppMessages([locationAck, ...stepPrompts]);
      return;
    }

    // 5. Help / Stuck / Navigation Guidance & Reset Command
    const isResetCommand = 
      /^(reset|restart|start over|shuru se|clear)$/i.test(textLower);

    if (isResetCommand) {
      session.wizard_answers = {};
      session.state = "ASK_PROP";
      await sessionRef.set({ state: "ASK_PROP", wizard_answers: {} }, { merge: true });
      if (leadId) {
        await addLeadActivity(leadId, "journey_reset", `Customer requested reset: "${rawInbound}"`).catch(console.error);
      }
      const resetAck = MessageBuilder.text(
        from,
        `🔄 *Quotation Wizard Reset!*\n\nLet's start fresh to build your customized CCTV setup:`
      );
      const propPrompt = getStepPrompt(session, "ASK_PROP", from);
      await sendWhatsAppMessages([resetAck, ...propPrompt]);
      return;
    }

    const isHelpQuery = 
      /\b(help|madad|stuck|confused|samajh|kaise|options|menu)\b/i.test(textLower) &&
      !/^\d+$/.test(textLower);

    if (isHelpQuery) {
      const helpAck = MessageBuilder.text(
        from,
        `💡 *TEAM CCTV Assistant: Here to Help!* 🛡️\n\n` +
        `• *Current Step:* We are currently configuring your system specifications.\n` +
        `• *Easy Tap:* You can tap any button or list option below instead of typing.\n` +
        `• *Specialist Call:* Reply *CALL* anytime if you'd like a technician to call you directly.\n` +
        `• *Start Over:* Reply *RESET* to restart questions from Step 1.\n\n` +
        `👇 *Please continue your setup by choosing below:*`
      );
      const stepPrompts = getStepPrompt(session, session.state, from);
      await sendWhatsAppMessages([helpAck, ...stepPrompts]);
      return;
    }
  }

  let replies: WhatsAppMessagePayload[] = [];
  let nextState: WhatsAppBotState = session.state;
  let conv = getConversationalStrings(session.language || "en");

  try {
    switch (session.state) {
      case "IDLE":
      case "GREETING": {
        nextState = "ASK_PROP";
        const cleanPhone = from.replace(/\D/g, "");
        const partnerRef = session.partner_id ? `&ref=${session.partner_id}` : "";
        const nameParam = session.customer_name && session.customer_name !== "WhatsApp Customer" ? `&name=${encodeURIComponent(session.customer_name)}` : "";
        const propParam = session.wizard_answers?.property_type ? `&property=${session.wizard_answers.property_type}` : "";
        const pinParam = session.wizard_answers?.pincode ? `&pincode=${session.wizard_answers.pincode}` : "";
        const langParam = session.language ? `&lang=${session.language}` : "";
        const webWizardUrl = `https://cctvquotation.com/wizard?phone=${cleanPhone}${partnerRef}${nameParam}${propParam}${pinParam}${langParam}&source=wa_welcome`;

        if (!session.language) {
          replies.push(MessageBuilder.buttons(
            from,
            buildWelcomeLanguageMenu(),
            [
              { id: "prop_home", title: "🏠 Home / घर" },
              { id: "prop_office", title: "🏢 Office / दुकान" },
              { id: "prop_factory", title: "🏭 Factory / गोदाम" }
            ]
          ));
        } else {
          conv = getConversationalStrings(session.language);
          replies.push(MessageBuilder.buttons(
            from,
            `*${conv.propHeader}*\n${conv.propQuestion}`,
            [
              { id: "prop_home", title: conv.propHomeTitle.slice(0, 20) },
              { id: "prop_office", title: conv.propOfficeTitle.slice(0, 20) },
              { id: "prop_factory", title: conv.propFactoryTitle.slice(0, 20) }
            ]
          ));
        }
        break;
      }

      case "ASK_PROP": {
        const text = String(content || "").toLowerCase().trim();

        // 1. Language Selection check (replying 1 to 11 or language name before property)
        const langSelected = resolveLanguageInput(text);
        if (langSelected && !session.language) {
          session.language = langSelected;
          if (leadId) {
            await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
              preferred_language: langSelected,
              preferred_language_name: languageNames[langSelected],
              updated_at: new Date()
            }).catch(console.error);
          }
          conv = getConversationalStrings(langSelected);
          replies.push(MessageBuilder.text(from, conv.langConfirmed));
          replies.push(MessageBuilder.buttons(
            from,
            `*${conv.propHeader}*\n${conv.propQuestion}`,
            [
              { id: "prop_home", title: conv.propHomeTitle.slice(0, 20) },
              { id: "prop_office", title: conv.propOfficeTitle.slice(0, 20) },
              { id: "prop_factory", title: conv.propFactoryTitle.slice(0, 20) }
            ]
          ));
          nextState = "ASK_PROP";
          break;
        }

        // 2. Resolve Property Type
        let propType: "home" | "office" | "factory" | null = null;

        if (
          text === "prop_home" || 
          text.includes("home") || 
          text.includes("flat") || 
          text.includes("house") || 
          text.includes("ghar") ||
          text.includes("residence") || 
          text.includes("residential") || 
          text.includes("villa") || 
          text.includes("apartment") || 
          (session.language ? text === "1" : false)
        ) {
          propType = "home";
        } else if (
          text === "prop_office" || 
          text.includes("office") || 
          text.includes("shop") || 
          text.includes("store") || 
          text.includes("dukan") ||
          text.includes("commercial") || 
          text.includes("retail") || 
          text.includes("showroom") || 
          text.includes("business") || 
          (session.language ? text === "2" : false)
        ) {
          propType = "office";
        } else if (
          text === "prop_factory" || 
          text.includes("factory") || 
          text.includes("farm") || 
          text.includes("godown") || 
          text.includes("godam") ||
          text.includes("karkhana") ||
          text.includes("yard") || 
          text.includes("warehouse") || 
          text.includes("industrial") || 
          text.includes("shed") || 
          text.includes("plot") || 
          (session.language ? text === "3" : false)
        ) {
          propType = "factory";
        }

        if (propType) {
          if (!session.language) {
            session.language = "en"; // Default fallback
          }
          conv = getConversationalStrings(session.language);
          session.wizard_answers.property_type = propType;
          nextState = "ASK_INSTALL_TYPE";
          const propTitle = propType === "home" ? conv.propHomeTitle : propType === "office" ? conv.propOfficeTitle : conv.propFactoryTitle;

          replies.push(MessageBuilder.list(
            from,
            `✓ Property: *${propTitle}*\n\n*${conv.installHeader}*\n${session.language && session.language !== 'en' ? 'कृपया नीचे दिए विकल्पों में से चुनें:' : 'What kind of installation do you require?'}`,
            "Choose Install Type",
            [
              {
                title: "Installation Types",
                rows: [
                  { id: "ins_new_wired", title: conv.installWiredTitle.slice(0, 24), description: conv.installWiredDesc.slice(0, 72) },
                  { id: "ins_wireless", title: conv.installWirelessTitle.slice(0, 24), description: conv.installWirelessDesc.slice(0, 72) },
                  { id: "ins_4g_solar", title: conv.install4gTitle.slice(0, 24), description: conv.install4gDesc.slice(0, 72) },
                  { id: "ins_addon", title: conv.installAddonTitle.slice(0, 24), description: conv.installAddonDesc.slice(0, 72) }
                ]
              }
            ]
          ));
        } else {
          // If input is a duplicate/stale greeting, silently drop so customer never receives duplicate welcome menus
          if (text.startsWith("hi") || text.startsWith("hello") || text.startsWith("welcome")) {
            console.log(`[BotEngine] Suppressing duplicate greeting in ASK_PROP for ${from}`);
            return;
          }

          // Check cross-step intent: if user typed camera count in Step 1
          const mentionsCameras = /\b(\d+\s*cam|camera|cctv)\b/i.test(text);
          const errorMsg = mentionsCameras
            ? `👍 *Noted:* You need CCTV cameras! To suggest the right weatherproofing (bullet vs dome) and cabling design, please first choose your *Property Type* below:`
            : `⚠️ *We couldn't recognize "${text.slice(0, 30)}" for Property Type.*\n\nPlease tap one of the 3 buttons below to proceed:`;

          replies.push(MessageBuilder.buttons(
            from,
            errorMsg,
            [
              { id: "prop_home", title: "🏠 Home / Flat" },
              { id: "prop_office", title: "🏢 Office / Shop" },
              { id: "prop_factory", title: "🏭 Factory / Farm" }
            ]
          ));
        }
        break;
      }

      case "ASK_INSTALL_TYPE": {
        const text = String(content || "").toLowerCase().trim();
        // Stale duplicate guard from previous step
        if (text.startsWith("prop_") || text.startsWith("hi") || text.startsWith("hello")) {
          console.log(`[BotEngine] Suppressing stale Step 1 replay in ASK_INSTALL_TYPE for ${from}`);
          return;
        }
        let choice: "new" | "wireless" | "4g_solar" | "addon" | null = null;

        if (
          text.includes("ins_addon") || 
          text.includes("addon") || 
          text.includes("add on") || 
          text.includes("add to") || 
          text.includes("existing") || 
          text.includes("upgrade") || 
          text.includes("expansion") ||
          text === "4"
        ) {
          choice = "addon";
        } else if (
          text.includes("4g_solar") || 
          text.includes("4g") || 
          text.includes("solar") || 
          text.includes("sim") || 
          text.includes("standalone") ||
          text === "3"
        ) {
          choice = "4g_solar";
        } else if (
          text.includes("ins_wireless") || 
          text.includes("wireless") || 
          text.includes("wifi") || 
          text.includes("wi-fi") || 
          text.includes("smart") ||
          text === "2"
        ) {
          choice = "wireless";
        } else if (
          text.includes("ins_new_wired") || 
          text.includes("new") || 
          text.includes("wired") || 
          text.includes("copper") || 
          text.includes("dvr") || 
          text.includes("nvr") || 
          text.includes("cable") ||
          text === "1"
        ) {
          choice = "new";
        }

        if (choice === "addon") {
          session.wizard_answers.installation_type = "addon";
          nextState = "ASK_ADDON_COMPATIBILITY";
          replies.push(MessageBuilder.buttons(
            from,
            `*Add-on Compatibility Check:*\n\nDo you know the technical specifications of your existing DVR / NVR recorder?`,
            [
              { id: "addon_upload_photo", title: "📸 Send DVR Photo" },
              { id: "addon_know_specs", title: "✅ I Know My Specs" },
              { id: "addon_free_callback", title: "📞 Request Callback" }
            ]
          ));
        } else if (choice === "4g_solar") {
          session.wizard_answers.installation_type = "new";
          session.wizard_answers.technology = "Wireless";
          session.wizard_answers.technology_preference = "Wireless";
          session.wizard_answers.is_4g = true;
          session.wizard_answers.has_4g_sim = true;
          session.wizard_answers.broadband_status = "independent_4g";
          session.wizard_answers.cabling_done = true;
          session.wizard_answers.installation_preference = "pro";
          session.wizard_answers.selected_wireless_variant = "wf_4g_solar";
          nextState = "ASK_WIRELESS_QTY";

          replies.push(buildQuantityButtonsMessage(
            from, "wfq",
            `*4G SIM & Solar Standalone Cameras Selected:* 🛰️\n\nHow many standalone 4G SIM / Solar cameras do you need mounted at your site?`,
            [
              { id: "wfq_1", title: "1 4G Cam" },
              { id: "wfq_2", title: "2 4G Cams" },
              { id: "wfq_4", title: "4 4G Cams" }
            ],
            conv.numberReplyHint
          ));
        } else if (choice === "wireless") {
          session.wizard_answers.installation_type = "new";
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
        } else if (choice === "new") {
          // New Wired: Matches website WizardClientV2.tsx (Card 1: Outdoor Bullets, Card 2: Indoor Domes, Card 3: Optional Wireless)
          session.wizard_answers.installation_type = "new";
          session.wizard_answers.technology = "HD";
          session.wizard_answers.technology_preference = "HD";
          nextState = "ASK_CAMERA_OUTDOOR";

          replies.push(buildQuantityButtonsMessage(
            from, "out",
            `*${conv.outdoorHeader}*\n\n${conv.outdoorQuestion}`,
            [
              { id: "out_2", title: `2 ${conv.quickBtnBullets || "Bullets"}` },
              { id: "out_4", title: `4 ${conv.quickBtnBullets || "Bullets"}` },
              { id: "out_0", title: conv.quickBtnNone || "0 (None)" }
            ],
            conv.numberReplyHint
          ));
        } else {
          // Fallback: Re-send fresh clickable list options with helpful explanation
          replies.push(MessageBuilder.list(
            from,
            `⚠️ *We couldn't recognize "${text.slice(0, 30)}".*\n\n*Step 1 of 6: Installation Type*\nPlease choose your preferred setup from the options below:`,
            "Choose Install Type",
            [
              {
                title: "Installation Types",
                rows: [
                  { id: "ins_new_wired", title: "✨ New Wired Setup", description: "Central DVR/NVR with dedicated copper cabling. Zero signal drop." },
                  { id: "ins_wireless", title: "📶 Smart Wireless CCTV", description: "Zero video cabling. 360° Pan-Tilt & live mobile phone viewing." },
                  { id: "ins_4g_solar", title: "📡 4G SIM / Solar Cam", description: "No Wi-Fi needed. Ideal for farmhouses, empty plots & remote gates." },
                  { id: "ins_addon", title: "⬆️ Add Existing System", description: "Expansion / upgrade with compatibility guarantee." }
                ]
              }
            ]
          ));
        }
        break;
      }

      case "ASK_ADDON_COMPATIBILITY": {
        const text = String(content || "").toLowerCase().trim();
        if (text.includes("addon_upload_photo") || text.includes("photo") || text.includes("upload") || text.includes("pic") || text.includes("image") || text.includes("dvr") || text === "1") {
          replies.push(MessageBuilder.text(
            from,
            `📸 *Send DVR Photo:*\nPlease take a quick photo of your existing DVR/NVR's *back panel* (where camera cables connect) or the *model sticker* and send it right here.\n\nOur senior engineer will review it within 15 minutes and verify 100% compatibility!`
          ));
          nextState = "PAUSED_FOR_AGENT";
        } else if (text.includes("addon_free_callback") || text.includes("callback") || text.includes("call") || text.includes("phone") || text.includes("talk") || text === "3") {
          replies.push(MessageBuilder.text(
            from,
            `📞 *Callback Requested:*\nOur senior CCTV engineer will call you shortly on this WhatsApp number to confirm your DVR model and recommended camera upgrade.`
          ));
          nextState = "PAUSED_FOR_AGENT";
        } else if (text.includes("addon_know_specs") || text.includes("specs") || text.includes("know") || text.includes("spec") || text === "2") {
          nextState = "ASK_CAMERA_COUNT";
          replies.push(MessageBuilder.buttons(
            from,
            `*Existing System Tech:* What wire connects your current cameras to the recorder?`,
            [
              { id: "addon_tech_hd", title: "Analog HD (BNC Wire)" },
              { id: "addon_tech_ip", title: "🌐 IP (CAT6 Wire)" }
            ]
          ));
        } else {
          replies.push(MessageBuilder.buttons(
            from,
            `*Add-on Compatibility Check:*\n\nDo you know the technical specifications of your existing DVR / NVR recorder?`,
            [
              { id: "addon_upload_photo", title: "📸 Send DVR Photo" },
              { id: "addon_know_specs", title: "✅ I Know My Specs" },
              { id: "addon_free_callback", title: "📞 Request Callback" }
            ]
          ));
        }
        break;
      }

      case "ASK_CAMERA_COUNT": {
        const text = String(content || "").toLowerCase().trim();
        if (text.includes("addon_tech_hd") || text.includes("hd") || text.includes("analog") || text.includes("bnc") || text === "1") {
          session.wizard_answers.technology = "HD";
          nextState = "ASK_CAMERA_OUTDOOR";
          replies.push(buildQuantityButtonsMessage(
            from, "out",
            `*Step 3 (Outdoor Cameras to Add):* 🌧️\n\nHow many *Weatherproof Bullet Cameras* do you need added outside for your main gate, driveway, parking, or boundary walls?`,
            [
              { id: "out_2", title: `2 ${conv.quickBtnBullets || "Bullets"}` },
              { id: "out_4", title: `4 ${conv.quickBtnBullets || "Bullets"}` },
              { id: "out_0", title: conv.quickBtnNone || "0 (None)" }
            ],
            conv.numberReplyHint
          ));
        } else if (text.includes("addon_tech_ip") || text.includes("ip") || text.includes("cat6") || text.includes("network") || text === "2") {
          session.wizard_answers.technology = "IP";
          nextState = "ASK_CAMERA_OUTDOOR";
          replies.push(buildQuantityButtonsMessage(
            from, "out",
            `*Step 3 (Outdoor Cameras to Add):* 🌧️\n\nHow many *Weatherproof Bullet Cameras* do you need added outside for your main gate, driveway, parking, or boundary walls?`,
            [
              { id: "out_2", title: `2 ${conv.quickBtnBullets || "Bullets"}` },
              { id: "out_4", title: `4 ${conv.quickBtnBullets || "Bullets"}` },
              { id: "out_0", title: conv.quickBtnNone || "0 (None)" }
            ],
            conv.numberReplyHint
          ));
        } else {
          replies.push(MessageBuilder.buttons(
            from,
            `*Existing System Tech:* What wire connects your current cameras to the recorder?`,
            [
              { id: "addon_tech_hd", title: "Analog HD (BNC Wire)" },
              { id: "addon_tech_ip", title: "🌐 IP (CAT6 Wire)" }
            ]
          ));
        }
        break;
      }

      case "ASK_WIRELESS_VARIANT": {
        const text = String(content || "").toLowerCase().trim();
        if (text.includes("wf_combo_2x2") || text.includes("combo") || text.includes("4-cam") || text.includes("4 cam")) {
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
          let variant = "";
          if (text.includes("solar") || text.includes("4g") || text.includes("sim") || text === "5") variant = "wf_4g_solar";
          else if (text.includes("out_ptz") || (text.includes("outdoor") && text.includes("ptz")) || text === "4") variant = "wf_out_ptz";
          else if (text.includes("out_bullet") || (text.includes("outdoor") && text.includes("bullet")) || text === "3") variant = "wf_out_bullet";
          else if (text.includes("in_fixed") || (text.includes("indoor") && (text.includes("fixed") || text.includes("dome"))) || text === "2") variant = "wf_in_fixed";
          else if (text.includes("in_ptz") || text.includes("ptz") || text.includes("pan tilt") || text.includes("360") || text === "1") variant = "wf_in_ptz";

          if (!variant) {
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
            break;
          }

          session.wizard_answers.selected_wireless_variant = variant;
          nextState = "ASK_WIRELESS_QTY";

          const variantTitles: Record<string, { single: string; plural: string }> = {
            wf_in_ptz: { single: "Indoor 360° Pan-Tilt (Wi-Fi)", plural: "Indoor 360° Pan-Tilt Cameras" },
            wf_in_fixed: { single: "Indoor Fixed Dome / Cube (Wi-Fi)", plural: "Indoor Fixed Cameras" },
            wf_out_bullet: { single: "Outdoor Fixed Weatherproof Bullet (Wi-Fi)", plural: "Outdoor Wi-Fi Bullets" },
            wf_out_ptz: { single: "Outdoor 360° Pan-Tilt PTZ (Wi-Fi)", plural: "Outdoor 360° PTZ Cameras" },
            wf_4g_solar: { single: "4G SIM / Solar Standalone Camera", plural: "4G SIM Cameras" }
          };
          const vInfo = variantTitles[variant] || { single: "Smart Wireless Camera", plural: "Smart Wireless Cameras" };

          replies.push(buildQuantityButtonsMessage(
            from, "wfq",
            `How many *${vInfo.single}* cameras do you need mounted at your site?`,
            [
              { id: "wfq_1", title: "1 Camera" },
              { id: "wfq_2", title: "2 Cameras" },
              { id: "wfq_0", title: conv.quickBtnNone || "0 (None)" }
            ],
            conv.numberReplyHint
          ));
        }
        break;
      }

      case "ASK_CAMERA_OUTDOOR": {
        const text = String(content || "").toLowerCase().trim();
        // Stale duplicate guard from previous step (prevents re-sending Step 2 menu!)
        if (text.startsWith("ins_") || text.startsWith("prop_") || text.startsWith("hi")) {
          console.log(`[BotEngine] Suppressing stale Step 1 replay in ASK_CAMERA_OUTDOOR for ${from}`);
          return;
        }
        if (text === "out_page_1" || text.includes("0 to 7")) {
          replies.push(buildQuantityListMessage(
            from, "out", "Outdoor Bullet", "Outdoor Bullets", 1,
            `*Step 2 of 6: Outdoor Cameras* 🌧️\n\nHow many *Weatherproof Bullet Cameras* do you need mounted outside for your main gate, driveway, parking, or boundary walls?`,
            "Select Outdoor (0-7)"
          ));
          break;
        }
        if (text === "out_page_2" || text === "out_more" || text.includes("8 to 15")) {
          replies.push(buildQuantityListMessage(
            from, "out", "Outdoor Bullet", "Outdoor Bullets", 2,
            `*Commercial / Medium Setup (8 to 15 Outdoor Bullets):* 🏢\n\nSelect your exact camera count below, or reply directly with any number:`,
            "Select Outdoor (8-15)"
          ));
          break;
        }
        if (text === "out_page_3" || text.includes("16 to 23")) {
          replies.push(buildQuantityListMessage(
            from, "out", "Outdoor Bullet", "Outdoor Bullets", 3,
            `*Commercial / Large Setup (16 to 23 Outdoor Bullets):* 🏢\n\nSelect your exact camera count below, or reply directly with any number:`,
            "Select Outdoor (16-23)"
          ));
          break;
        }
        if (text === "out_page_4" || text.includes("24 to 32")) {
          replies.push(buildQuantityListMessage(
            from, "out", "Outdoor Bullet", "Outdoor Bullets", 4,
            `*Enterprise Setup (24 to 32 Outdoor Bullets):* 🏢\n\nSelect your exact camera count below, or reply directly with any number:`,
            "Select Outdoor (24-32)"
          ));
          break;
        }
        if (text === "out_custom") {
          replies.push(MessageBuilder.text(from, "Please reply directly in chat with your desired number of Outdoor Weatherproof Bullet cameras (0 to 32):"));
          break;
        }

        let outdoorCount: number | null = null;
        let isOutOfBounds = false;
        let requestedCount = 0;

        if (text.startsWith("out_") && !text.includes("page") && !text.includes("custom")) {
          outdoorCount = parseInt(text.replace("out_", ""), 10);
        } else {
          const match = text.match(/\b\d+\b/);
          if (match) {
            requestedCount = parseInt(match[0], 10);
            if (requestedCount > 32) {
              isOutOfBounds = true;
            } else {
              outdoorCount = Math.max(0, requestedCount);
            }
          } else if (text.includes("none") || text.includes("zero") || text.includes("no outdoor") || text.includes("nahi") || text.includes("ek bhi nahi")) {
            outdoorCount = 0;
          }
        }

        if (isOutOfBounds) {
          replies.push(MessageBuilder.buttons(
            from,
            `⚠️ *You entered ${requestedCount} Outdoor Cameras.*\n\nOur instant quotation engine automates systems up to *32 cameras*.\n• For sites requiring 32+ cameras, our commercial engineering team prepares custom multi-NVR architectural blueprints.\n\n👉 Please select a quantity (0 to 32) below, or request a specialist callback:`,
            [
              { id: "out_16", title: "16 Bullets" },
              { id: "out_32", title: "32 Bullets" },
              { id: "addon_free_callback", title: "📞 Call Specialist" }
            ]
          ));
          break;
        }

        if (outdoorCount === null || isNaN(outdoorCount)) {
          replies.push(buildQuantityButtonsMessage(
            from, "out",
            `⚠️ *We couldn't recognize "${text.slice(0, 30)}" as a camera quantity.*\n\n*${conv.outdoorHeader}*\n\n${conv.outdoorQuestion}`,
            [
              { id: "out_2", title: `2 ${conv.quickBtnBullets || "Bullets"}` },
              { id: "out_4", title: `4 ${conv.quickBtnBullets || "Bullets"}` },
              { id: "out_0", title: conv.quickBtnNone || "0 (None)" }
            ],
            conv.numberReplyHint
          ));
          break;
        }

        session.wizard_answers.outdoor_camera_count = outdoorCount;
        nextState = "ASK_CAMERA_INDOOR";

        replies.push(buildQuantityButtonsMessage(
          from, "in",
          `✓ Outdoor Cameras: *${outdoorCount} Weatherproof Bullets*\n\n*${conv.indoorHeader}*\n\n${conv.indoorQuestion}`,
          [
            { id: "in_2", title: `2 ${conv.quickBtnDomes || "Domes"}` },
            { id: "in_4", title: `4 ${conv.quickBtnDomes || "Domes"}` },
            { id: "in_0", title: conv.quickBtnNone || "0 (None)" }
          ],
          conv.numberReplyHint
        ));
        break;
      }

      case "ASK_CAMERA_INDOOR": {
        const text = String(content || "").toLowerCase().trim();
        // Stale duplicate guard from previous outdoor step
        if ((text.startsWith("out_") && !text.includes("in_")) || text.startsWith("ins_") || text.startsWith("prop_")) {
          console.log(`[BotEngine] Suppressing stale outdoor replay in ASK_CAMERA_INDOOR for ${from}`);
          return;
        }
        if (text === "in_page_1" || text.includes("0 to 7")) {
          replies.push(buildQuantityListMessage(
            from, "in", "Indoor Dome", "Indoor Domes", 1,
            `*Step 2 of 6: Indoor Cameras* 🏠\n\nHow many *Compact Ceiling Dome Cameras* do you need mounted inside for your living room, corridors, office, or cashier counters?`,
            "Select Indoor (0-7)"
          ));
          break;
        }
        if (text === "in_page_2" || text === "in_more" || text.includes("8 to 15")) {
          replies.push(buildQuantityListMessage(
            from, "in", "Indoor Dome", "Indoor Domes", 2,
            `*Commercial / Medium Setup (8 to 15 Indoor Domes):* 🏢\n\nSelect your exact camera count below, or reply directly with any number:`,
            "Select Indoor (8-15)"
          ));
          break;
        }
        if (text === "in_page_3" || text.includes("16 to 23")) {
          replies.push(buildQuantityListMessage(
            from, "in", "Indoor Dome", "Indoor Domes", 3,
            `*Commercial / Large Setup (16 to 23 Indoor Domes):* 🏢\n\nSelect your exact camera count below, or reply directly with any number:`,
            "Select Indoor (16-23)"
          ));
          break;
        }
        if (text === "in_page_4" || text.includes("24 to 32")) {
          replies.push(buildQuantityListMessage(
            from, "in", "Indoor Dome", "Indoor Domes", 4,
            `*Enterprise Setup (24 to 32 Indoor Domes):* 🏢\n\nSelect your exact camera count below, or reply directly with any number:`,
            "Select Indoor (24-32)"
          ));
          break;
        }
        if (text === "in_custom") {
          replies.push(MessageBuilder.text(from, "Please reply directly in chat with your desired number of Indoor Ceiling Dome cameras (0 to 32):"));
          break;
        }

        let indoorCount: number | null = null;
        let isOutOfBounds = false;
        let requestedCount = 0;

        if (text.startsWith("in_") && !text.includes("page") && !text.includes("custom")) {
          indoorCount = parseInt(text.replace("in_", ""), 10);
        } else {
          const match = text.match(/\b\d+\b/);
          if (match) {
            requestedCount = parseInt(match[0], 10);
            if (requestedCount > 32) {
              isOutOfBounds = true;
            } else {
              indoorCount = Math.max(0, requestedCount);
            }
          } else if (text.includes("none") || text.includes("zero") || text.includes("no indoor") || text.includes("nahi") || text.includes("ek bhi nahi")) {
            indoorCount = 0;
          }
        }

        if (isOutOfBounds) {
          replies.push(MessageBuilder.buttons(
            from,
            `⚠️ *You entered ${requestedCount} Indoor Cameras.*\n\nOur instant quotation engine automates systems up to *32 cameras*.\n• For sites requiring 32+ cameras, our commercial engineering team prepares custom multi-NVR architectural blueprints.\n\n👉 Please select a quantity (0 to 32) below, or request a specialist callback:`,
            [
              { id: "in_16", title: "16 Domes" },
              { id: "in_32", title: "32 Domes" },
              { id: "addon_free_callback", title: "📞 Call Specialist" }
            ]
          ));
          break;
        }

        if (indoorCount === null || isNaN(indoorCount)) {
          const outCountPrev = session.wizard_answers.outdoor_camera_count || 0;
          replies.push(buildQuantityButtonsMessage(
            from, "in",
            `⚠️ *We couldn't recognize "${text.slice(0, 30)}" as a camera quantity.*\n\n✓ Outdoor Cameras: *${outCountPrev}*\n\n*${conv.indoorHeader}*\n\n${conv.indoorQuestion}`,
            [
              { id: "in_2", title: `2 ${conv.quickBtnDomes || "Domes"}` },
              { id: "in_4", title: `4 ${conv.quickBtnDomes || "Domes"}` },
              { id: "in_0", title: conv.quickBtnNone || "0 (None)" }
            ],
            conv.numberReplyHint
          ));
          break;
        }

        const outCount = session.wizard_answers.outdoor_camera_count || 0;
        if (outCount === 0 && indoorCount === 0) {
          replies.push(MessageBuilder.buttons(
            from,
            `⚠️ *0 Cameras Selected.*\nA CCTV setup requires at least 1 camera to generate a quotation.\n\nWould you like to install Smart Wireless cameras or add cameras?`,
            [
              { id: "ins_wireless", title: "📶 Smart Wireless Setup" },
              { id: "out_2", title: "🌧️ Add 2 Outdoor Bullets" },
              { id: "in_2", title: "🏠 Add 2 Indoor Domes" }
            ]
          ));
          break;
        }

        session.wizard_answers.indoor_camera_count = indoorCount;
        const totalWired = (session.wizard_answers.outdoor_camera_count || 0) + indoorCount;
        session.wizard_answers.camera_count = totalWired;

        nextState = "ASK_HYBRID_WIRELESS";
        replies.push(MessageBuilder.list(
          from,
          `✓ *Wired Cameras Configured:* ${totalWired} Cameras (${session.wizard_answers.outdoor_camera_count || 0} Out + ${indoorCount} In)\n\n📡 *Step 2 of 6: Smart Wireless Add-ons (Wi-Fi / 4G SIM)*\n_Optional • Mix wired DVR + wireless cameras in one system_\n\nDo you want to add wireless cameras for remote gate, terrace, baby room, or farm corners without video cables?`,
          "Wireless Options",
          [
            {
              title: "Smart Wireless Add-on Options",
              rows: [
                { id: "wf_none", title: "❌ None (Proceed to Step 3)", description: "Proceed with standard wired DVR setup only" },
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
      }

      case "ASK_HYBRID_WIRELESS": {
        const text = String(content || "").toLowerCase().trim();
        // Stale duplicate guard from previous indoor step
        if (text.startsWith("in_") && !text.includes("wf_")) {
          console.log(`[BotEngine] Suppressing stale indoor replay in ASK_HYBRID_WIRELESS for ${from}`);
          return;
        }

        // 1. Check if user wants to add another wireless camera variant FIRST
        if (
          text.includes("wf_add_another") ||
          text.includes("add_another") ||
          text.includes("add another") ||
          text.includes("add more") ||
          text.includes("another wireless") ||
          text.includes("another camera") ||
          text === "add"
        ) {
          nextState = "ASK_HYBRID_WIRELESS";
          replies.push(MessageBuilder.list(
            from,
            `📡 *Step 2 of 6: Select Additional Smart Wireless Camera*\n\nWhich type of smart wireless camera would you like to add?`,
            "Select Camera Type",
            [
              {
                title: "Smart Wireless Variants",
                rows: [
                  { id: "wf_in_ptz", title: "🏠 Indoor 360° Pan-Tilt", description: "Living room, counter, baby room with 2-way talk" },
                  { id: "wf_in_fixed", title: "🏢 Indoor Fixed Dome", description: "Hallways, reception, cashier desk" },
                  { id: "wf_out_bullet", title: "🌧️ Outdoor Fixed Bullet", description: "Main gate, porch, driveway, perimeter" },
                  { id: "wf_out_ptz", title: "🔄 Outdoor 360° Pan-Tilt", description: "Open courtyard, terrace, front garden" },
                  { id: "wf_4g_solar", title: "🛰️ 4G SIM / Solar Cam", description: "Farmhouse, empty plot, remote gate (No Wi-Fi needed)" },
                  { id: "wf_done_proceed", title: "✅ Done (Proceed)", description: "Lock camera counts and proceed to Step 3" }
                ]
              }
            ]
          ));
          break;
        }

        // 2. Check if user selected a specific wireless camera variant
        let variant = "";
        if (text.includes("solar") || text.includes("4g") || text.includes("sim")) variant = "wf_4g_solar";
        else if (text.includes("out_ptz") || (text.includes("outdoor") && text.includes("ptz"))) variant = "wf_out_ptz";
        else if (text.includes("out_bullet") || (text.includes("outdoor") && text.includes("bullet"))) variant = "wf_out_bullet";
        else if (text.includes("in_fixed") || (text.includes("indoor") && (text.includes("fixed") || text.includes("dome")))) variant = "wf_in_fixed";
        else if (text.includes("in_ptz") || text.includes("ptz")) variant = "wf_in_ptz";

        if (variant) {
          session.wizard_answers.selected_wireless_variant = variant;
          nextState = "ASK_WIRELESS_QTY";

          const variantTitles: Record<string, { single: string; plural: string }> = {
            wf_in_ptz: { single: "Indoor 360° Pan-Tilt (Wi-Fi)", plural: "Indoor 360° Pan-Tilt Cameras" },
            wf_in_fixed: { single: "Indoor Fixed Dome / Cube (Wi-Fi)", plural: "Indoor Fixed Cameras" },
            wf_out_bullet: { single: "Outdoor Fixed Weatherproof Bullet (Wi-Fi)", plural: "Outdoor Wi-Fi Bullets" },
            wf_out_ptz: { single: "Outdoor 360° Pan-Tilt PTZ (Wi-Fi)", plural: "Outdoor 360° PTZ Cameras" },
            wf_4g_solar: { single: "4G SIM / Solar Standalone Camera", plural: "4G SIM Cameras" }
          };
          const vInfo = variantTitles[variant] || { single: "Smart Wireless Camera", plural: "Smart Wireless Cameras" };

          replies.push(buildQuantityButtonsMessage(
            from, "wfq",
            `How many *${vInfo.single}* cameras do you need mounted at your site?`,
            [
              { id: "wfq_1", title: "1 Camera" },
              { id: "wfq_2", title: "2 Cameras" },
              { id: "wfq_0", title: conv.quickBtnNone || "0 (None)" }
            ],
            conv.numberReplyHint
          ));
          break;
        }

        // 3. Check if user wants to finalize/proceed to Timeline
        const isDoneOrSkip = 
          text.includes("wf_done_proceed") || 
          text.includes("wf_none") || 
          text.includes("done") || 
          text.includes("proceed") || 
          text.includes("continue") || 
          text.includes("none") || 
          text.includes("skip") || 
          text.includes("zero") || 
          text.includes("wired only") || 
          /\bno\b/.test(text);

        if (isDoneOrSkip) {
          const outCount = session.wizard_answers.outdoor_camera_count || 0;
          const inCount = session.wizard_answers.indoor_camera_count || 0;
          const inPtzCount = session.wizard_answers.wifi_indoor_ptz_count || 0;
          const inFixedCount = session.wizard_answers.wifi_indoor_fixed_count || 0;
          const outBulletCount = session.wizard_answers.wifi_outdoor_bullet_count || 0;
          const outPtzCount = session.wizard_answers.wifi_outdoor_ptz_count || 0;
          const sim4gCount = session.wizard_answers.wifi_4g_count || 0;
          const wCount = inPtzCount + inFixedCount + outBulletCount + outPtzCount + sim4gCount;

          session.wizard_answers.wifi_camera_count = wCount;
          session.wizard_answers.camera_count = Math.max(1, outCount + inCount + wCount);

          const setupBadge = wCount > 0 
            ? `⚡ Hybrid Setup (${outCount + inCount} Wired + ${wCount} Smart Wireless = ${outCount + inCount + wCount} Cameras)`
            : `${outCount + inCount} Wired Cameras (${outCount} Outdoor Bullets + ${inCount} Indoor Domes)`;

          // Step 2 Completion: Advance straight to Priority Dispatch Scheduler (Timeline)
          nextState = "ASK_TIMELINE";
          replies.push(MessageBuilder.list(
            from,
            `✓ *Camera Setup Confirmed:* ${setupBadge}\n\n⏱️ *WHEN DO YOU WANT WORK DONE ON YOUR SITE?*\nPriority Dispatch Scheduler (Step 2 of 6)\n\nHelps us schedule certified technician availability & prioritize your site survey:`,
            "Select Timeline",
            [
              {
                title: "Priority Dispatch Scheduler",
                rows: [
                  { id: "time_asap", title: "⚡ ASAP (1-2 Days)", description: "Ready for instant site survey & work" },
                  { id: "time_week", title: "📅 Within a Week", description: "Finalizing quotation & setup" },
                  { id: "time_month", title: "🗓️ This Month", description: "Site currently under construction" },
                  { id: "time_research", title: "🔍 Just Planning", description: "Comparing prices & options" }
                ]
              }
            ]
          ));
          break;
        }

        // 4. Fallback: Re-send options so user is never stuck
        replies.push(MessageBuilder.list(
          from,
          `📡 *Add Smart Wireless Cameras (Wi-Fi / 4G SIM)*\nPlease select an option below:`,
          "Wireless Options",
          [
            {
              title: "Wireless Add-on Options",
              rows: [
                { id: "wf_none", title: "➡️ Skip (Wired Only)", description: "Proceed with standard wired DVR setup only" },
                { id: "wf_in_ptz", title: "🏠 Indoor 360° PTZ", description: "Living room, counter, baby room with 2-way talk" },
                { id: "wf_in_fixed", title: "🏢 Indoor Fixed Dome", description: "Hallways, reception, cashier desk" },
                { id: "wf_out_bullet", title: "🌧️ Outdoor Bullet", description: "Main gate, porch, driveway, perimeter" },
                { id: "wf_out_ptz", title: "🔄 Outdoor 360° PTZ", description: "Open courtyard, terrace, front garden" },
                { id: "wf_4g_solar", title: "🛰️ 4G SIM / Solar", description: "Farmhouse, empty plot, remote gate (No Wi-Fi needed)" }
              ]
            }
          ]
        ));
        break;
      }

      case "ASK_WIRELESS_QTY": {
        const currentVType = session.wizard_answers.selected_wireless_variant || "wf_in_ptz";
        const variantMeta: Record<string, { single: string; plural: string }> = {
          wf_in_ptz: { single: "Indoor 360° Pan-Tilt (Wi-Fi)", plural: "Indoor 360° Pan-Tilt Cameras" },
          wf_in_fixed: { single: "Indoor Fixed Dome / Cube (Wi-Fi)", plural: "Indoor Fixed Cameras" },
          wf_out_bullet: { single: "Outdoor Fixed Weatherproof Bullet (Wi-Fi)", plural: "Outdoor Wi-Fi Bullets" },
          wf_out_ptz: { single: "Outdoor 360° Pan-Tilt PTZ (Wi-Fi)", plural: "Outdoor 360° PTZ Cameras" },
          wf_4g_solar: { single: "4G SIM / Solar Standalone Camera", plural: "4G SIM Cameras" }
        };
        const curVInfo = variantMeta[currentVType] || { single: "Smart Wireless Camera", plural: "Smart Wireless Cameras" };

        const text = String(content || "").toLowerCase().trim();
        if (text === "wfq_page_1" || text.includes("0 to 7")) {
          replies.push(buildQuantityListMessage(
            from, "wfq", curVInfo.single, curVInfo.plural, 1,
            `How many *${curVInfo.single}* cameras do you need (0 to 32)?`,
            "Select Quantity (0-7)"
          ));
          break;
        }
        if (text === "wfq_page_2" || text === "wfq_more" || text.includes("8 to 15")) {
          replies.push(buildQuantityListMessage(
            from, "wfq", curVInfo.single, curVInfo.plural, 2,
            `*Commercial / Medium Setup (8 to 15 ${curVInfo.plural}):* 🏢\n\nSelect your exact camera count below, or reply directly with any number:`,
            "Select (8-15)"
          ));
          break;
        }
        if (text === "wfq_page_3" || text.includes("16 to 23")) {
          replies.push(buildQuantityListMessage(
            from, "wfq", curVInfo.single, curVInfo.plural, 3,
            `*Commercial / Large Setup (16 to 23 ${curVInfo.plural}):* 🏢\n\nSelect your exact camera count below, or reply directly with any number:`,
            "Select (16-23)"
          ));
          break;
        }
        if (text === "wfq_page_4" || text.includes("24 to 32")) {
          replies.push(buildQuantityListMessage(
            from, "wfq", curVInfo.single, curVInfo.plural, 4,
            `*Enterprise Setup (24 to 32 ${curVInfo.plural}):* 🏢\n\nSelect your exact camera count below, or reply directly with any number:`,
            "Select (24-32)"
          ));
          break;
        }
        if (text === "wfq_custom") {
          replies.push(MessageBuilder.text(from, `Please reply directly in chat with your desired quantity of ${curVInfo.single} (0 to 32):`));
          break;
        }

        let wCount = 1;
        if (text.startsWith("wfq_") && !text.includes("page") && !text.includes("custom")) {
          wCount = parseInt(text.replace("wfq_", ""), 10);
        } else if (text.includes("none") || text.includes("zero") || text.includes("nahi")) {
          wCount = 0;
        } else {
          const match = text.match(/\b\d+\b/);
          wCount = match ? Math.min(32, Math.max(0, parseInt(match[0], 10))) : 1;
        }

        if (currentVType === "wf_in_ptz") session.wizard_answers.wifi_indoor_ptz_count = wCount;
        else if (currentVType === "wf_in_fixed") session.wizard_answers.wifi_indoor_fixed_count = wCount;
        else if (currentVType === "wf_out_bullet") session.wizard_answers.wifi_outdoor_bullet_count = wCount;
        else if (currentVType === "wf_out_ptz") session.wizard_answers.wifi_outdoor_ptz_count = wCount;
        else if (currentVType === "wf_4g_solar") session.wizard_answers.wifi_4g_count = wCount;

        const inPtz = session.wizard_answers.wifi_indoor_ptz_count || 0;
        const inFixed = session.wizard_answers.wifi_indoor_fixed_count || 0;
        const outBullet = session.wizard_answers.wifi_outdoor_bullet_count || 0;
        const outPtz = session.wizard_answers.wifi_outdoor_ptz_count || 0;
        const sim4g = session.wizard_answers.wifi_4g_count || 0;
        const totalWireless = inPtz + inFixed + outBullet + outPtz + sim4g;
        session.wizard_answers.wifi_camera_count = totalWireless;

        const outWired = session.wizard_answers.outdoor_camera_count || 0;
        const inWired = session.wizard_answers.indoor_camera_count || 0;
        const grandTotal = Math.max(1, outWired + inWired + totalWireless);
        session.wizard_answers.camera_count = grandTotal;

        const isPureWireless = session.wizard_answers.technology === "Wireless" || 
                               session.wizard_answers.technology === "4G_Solar" ||
                               session.wizard_answers.installation_type === "wireless" ||
                               session.wizard_answers.installation_type === "solar_4g";

        // Build summary of configured wireless items
        const wifiItems: string[] = [];
        if (inPtz > 0) wifiItems.push(`• ${inPtz}x Indoor 360° Pan-Tilt (Wi-Fi)`);
        if (inFixed > 0) wifiItems.push(`• ${inFixed}x Indoor Fixed Dome / Cube (Wi-Fi)`);
        if (outBullet > 0) wifiItems.push(`• ${outBullet}x Outdoor Fixed Bullet (Wi-Fi)`);
        if (outPtz > 0) wifiItems.push(`• ${outPtz}x Outdoor 360° Pan-Tilt PTZ (Wi-Fi)`);
        if (sim4g > 0) wifiItems.push(`• ${sim4g}x 4G SIM / Solar Standalone Camera`);

        nextState = "ASK_HYBRID_WIRELESS";
        const statusHeader = wCount > 0 
          ? `✓ *Added to Setup:* ${wCount}x ${curVInfo.single}`
          : `✓ *Skipped:* ${curVInfo.single}`;
        const wifiSummary = wifiItems.length > 0 
          ? `\n\n📡 *Smart Wireless Cameras in Setup (${totalWireless} Added):*\n${wifiItems.join("\n")}`
          : "";
        const bodyText = `${statusHeader}${wifiSummary}\n\n⚡ *Total Cameras:* ${grandTotal} (${isPureWireless ? `${totalWireless} Smart Wireless` : `⚡ Hybrid Setup: ${outWired + inWired} Wired + ${totalWireless} Smart Wireless`})\n\nWould you like to add another wireless camera variant, or proceed to Step 3?`;

        replies.push(MessageBuilder.buttons(
          from,
          bodyText,
          [
            { id: "wf_done_proceed", title: "✅ Done (Proceed)" },
            { id: "wf_add_another", title: "➕ Add Wireless" }
          ]
        ));
        break;
      }

      case "ASK_TECH": {
        const text = String(content || "").toLowerCase().trim();
        let techChoice = "HD";
        if (text.includes("tech_ip") || text.includes("ip") || text.includes("digital") || text.includes("cat6") || text.includes("network") || text === "1") {
          techChoice = "IP";
        }
        session.wizard_answers.technology = techChoice;
        nextState = "ASK_STORAGE_DAYS";
        replies.push(MessageBuilder.list(
          from,
          `💾 *Step 3 of 6: Recording & Storage Backup*\n\nHow long do you want to keep recorded video stored?`,
          "Select Storage Days",
          [
            {
              title: "Recording Retention",
              rows: [
                { id: "storage_7", title: "7 Days Backup", description: "Standard week buffer" },
                { id: "storage_15", title: "15 Days Backup", description: "Recommended (1TB surveillance drive)" },
                { id: "storage_30", title: "30 Days Backup", description: "Full month peace-of-mind (2TB drive)" },
                { id: "storage_60", title: "60 Days Backup", description: "Maximum commercial compliance" },
                { id: "storage_0", title: "0 Days (No Recording)", description: "Live mobile viewing only. Zero storage cost." }
              ]
            }
          ]
        ));
        break;
      }

      case "ASK_TIMELINE": {
        const text = String(content || "").toLowerCase().trim();
        // Stale duplicate guard from previous camera steps
        if (text.startsWith("wf_") || text.startsWith("in_") || text.startsWith("out_") || text.startsWith("ins_")) {
          console.log(`[BotEngine] Suppressing stale camera replay in ASK_TIMELINE for ${from}`);
          return;
        }
        let timeChoice = "";
        let rawCode = "";

        if (text.includes("time_asap") || text.includes("asap") || text.includes("urgent") || text.includes("immediate") || text.includes("today") || text.includes("tomorrow") || text.includes("1-2") || text === "1") {
          timeChoice = "Immediately (1-2 Days)";
          rawCode = "asap";
        } else if (text.includes("time_week") || text.includes("week") || text.includes("7 days") || text === "2") {
          timeChoice = "Within a Week";
          rawCode = "week";
        } else if (text.includes("time_month") || text.includes("month") || text.includes("construction") || text === "3") {
          timeChoice = "This Month";
          rawCode = "month";
        } else if (text.includes("time_research") || text.includes("plan") || text.includes("research") || text.includes("compare") || text === "4") {
          timeChoice = "Just Planning";
          rawCode = "research";
        }

        if (!rawCode) {
          replies.push(MessageBuilder.list(
            from,
            `⏱️ *WHEN DO YOU WANT WORK DONE ON YOUR SITE?*\nPriority Dispatch Scheduler (Step 2 of 6)\n\nHelps us schedule certified technician availability & prioritize your site survey:`,
            "Select Timeline",
            [
              {
                title: "Priority Dispatch Scheduler",
                rows: [
                  { id: "time_asap", title: "⚡ ASAP (1-2 Days)", description: "Ready for instant site survey & work" },
                  { id: "time_week", title: "📅 Within a Week", description: "Finalizing quotation & setup" },
                  { id: "time_month", title: "🗓️ This Month", description: "Site currently under construction" },
                  { id: "time_research", title: "🔍 Just Planning", description: "Comparing prices & options" }
                ]
              }
            ]
          ));
          break;
        }

        session.wizard_answers.timeline = timeChoice;
        session.wizard_answers.q_timeline = rawCode;
        session.wizard_answers.installation_timeline = rawCode;
        
        const priority = (rawCode === "asap" || rawCode === "week") ? "HOT" : "WARM";
        if (leadId) {
          await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
            timeline: timeChoice,
            priority,
            is_hot_lead: priority === "HOT",
            "wizard_answers.timeline": timeChoice,
            "wizard_answers.q_timeline": rawCode,
            "wizard_answers.installation_timeline": rawCode,
            updated_at: new Date()
          }).catch(console.error);
        }

        nextState = "ASK_STORAGE_DAYS";
        replies.push(MessageBuilder.list(
          from,
          `✓ Priority Dispatch: *${timeChoice}*\n\n💾 *Step 3 of 6: Recording & Storage Backup*\n\nHow long do you want to keep recorded video stored?`,
          "Select Storage Days",
          [
            {
              title: "Recording Retention",
              rows: [
                { id: "storage_7", title: "7 Days Backup", description: "Standard week buffer" },
                { id: "storage_15", title: "15 Days Backup", description: "Recommended (1TB surveillance drive)" },
                { id: "storage_30", title: "30 Days Backup", description: "Full month peace-of-mind (2TB drive)" },
                { id: "storage_60", title: "60 Days Backup", description: "Maximum commercial compliance" },
                { id: "storage_0", title: "0 Days (No Recording)", description: "Live mobile viewing only. Zero storage cost." }
              ]
            }
          ]
        ));
        break;
      }

      case "ASK_STORAGE_DAYS": {
        const text = String(content || "").toLowerCase().trim();
        // Stale duplicate guard from previous timeline step
        if (text.startsWith("time_") || text.startsWith("wf_")) {
          console.log(`[BotEngine] Suppressing stale timeline replay in ASK_STORAGE_DAYS for ${from}`);
          return;
        }
        let days: number | null = null;

        if (text.includes("storage_0") || text.includes("no recording") || text.includes("live only") || text === "0") {
          days = 0;
        } else if (text.includes("storage_7") || text.includes("7 days") || text.includes("7 day") || text === "7") {
          days = 7;
        } else if (text.includes("storage_15") || text.includes("15 days") || text.includes("15 day") || text.includes("2 weeks") || text === "15") {
          days = 15;
        } else if (text.includes("storage_30") || text.includes("30 days") || text.includes("30 day") || text.includes("month") || text === "30") {
          days = 30;
        } else if (text.includes("storage_45") || text.includes("45 days") || text.includes("45 day") || text === "45") {
          days = 45;
        } else if (text.includes("storage_60") || text.includes("60 days") || text.includes("60 day") || text.includes("2 month") || text === "60") {
          days = 60;
        } else {
          const match = text.match(/\d+/);
          if (match) {
            const rawDays = parseInt(match[0], 10);
            const tiers = [0, 7, 15, 30, 45, 60];
            days = tiers.reduce((prev, curr) => Math.abs(curr - rawDays) < Math.abs(prev - rawDays) ? curr : prev);
          }
        }

        if (days === null) {
          replies.push(MessageBuilder.list(
            from,
            `⚠️ *We couldn't recognize "${text.slice(0, 30)}" for storage retention.*\n\n*Step 3 of 6: Recording & Storage Backup* 💾\nPlease choose one of the standardized surveillance drive tiers below:`,
            "Select Storage Days",
            [
              {
                title: "Recording Retention",
                rows: [
                  { id: "storage_7", title: "7 Days Backup", description: "Standard week buffer" },
                  { id: "storage_15", title: "15 Days Backup", description: "Recommended (1TB surveillance drive)" },
                  { id: "storage_30", title: "30 Days Backup", description: "Full month peace-of-mind (2TB drive)" },
                  { id: "storage_60", title: "60 Days Backup", description: "Maximum commercial compliance" },
                  { id: "storage_0", title: "0 Days (No Recording)", description: "Live mobile viewing only. Zero storage cost." }
                ]
              }
            ]
          ));
          break;
        }

        session.wizard_answers.recording_days = days;

        if (days === 0) {
          session.wizard_answers.recording_mode = "none";
          nextState = "ASK_MOUNTING_CONDITIONS";

          replies.push(MessageBuilder.buttons(
            from,
            `✓ Storage: *0 Days (Live Only)*\n\n🏗️ *Step 4 of 6: Approximate Mounting Height*\n\nWhat is the approximate ceiling / mounting height at your site?`,
            [
              { id: "mount_standard", title: "Standard (<10ft)" },
              { id: "mount_high", title: "High (10-15ft)" },
              { id: "mount_very_high", title: "Very High (15ft+)" }
            ]
          ));
        } else {
          nextState = "ASK_RECORDING_MODE";

          replies.push(MessageBuilder.buttons(
            from,
            `✓ Storage Retention: *${days} Days*\n\n🎥 *Step 3 of 6: Recording Mode*\n\nHow would you like your system to record?`,
            [
              { id: "mode_continuous", title: "⏺️ 24x7 Continuous" },
              { id: "mode_motion", title: "⚡ Smart Motion" }
            ]
          ));
        }
        break;
      }

      case "ASK_RECORDING_MODE": {
        const text = String(content || "").toLowerCase().trim();
        // Stale duplicate guard from previous storage step
        if (text.startsWith("storage_") || text.startsWith("time_")) {
          console.log(`[BotEngine] Suppressing stale storage replay in ASK_RECORDING_MODE for ${from}`);
          return;
        }
        let mode: "motion" | "continuous" = "continuous";
        if (text.includes("mode_motion") || text.includes("motion") || text.includes("smart") || text.includes("save") || text === "2") {
          mode = "motion";
        } else {
          mode = "continuous";
        }

        session.wizard_answers.recording_mode = mode;
        nextState = "ASK_MOUNTING_CONDITIONS";
        const recModeName = mode === "motion" ? "Smart Motion (50% Storage Save)" : "24x7 Continuous Recording";

        replies.push(MessageBuilder.buttons(
          from,
          `✓ Recording Mode: *${recModeName}*\n\n🏗️ *Step 4 of 6: Approximate Mounting Height*\n\nWhat is the approximate ceiling / mounting height at your site?`,
          [
            { id: "mount_standard", title: "Standard (<10ft)" },
            { id: "mount_high", title: "High (10-15ft)" },
            { id: "mount_very_high", title: "Very High (15ft+)" }
          ]
        ));
        break;
      }

      case "ASK_MOUNTING_CONDITIONS": {
        const text = String(content || "").toLowerCase().trim();
        // Stale duplicate guard from previous recording mode step
        if (text.startsWith("mode_") || text.startsWith("storage_")) {
          console.log(`[BotEngine] Suppressing stale mode replay in ASK_MOUNTING_CONDITIONS for ${from}`);
          return;
        }
        let height: "standard" | "high" | "very_high" = "standard";
        if (text.includes("very_high") || text.includes("15+") || text.includes("tall") || text === "3") {
          height = "very_high";
        } else if (text.includes("mount_high") || text.includes("10-15") || text.includes("12") || text.includes("high") || text === "2") {
          height = "high";
        } else {
          height = "standard";
        }

        session.wizard_answers.ceiling_height = height;
        nextState = "ASK_SURFACE_TYPE";
        const heightName = height === "very_high" ? "Very High (15ft+)" : height === "high" ? "High (10-15ft)" : "Standard (<10ft)";

        replies.push(MessageBuilder.buttons(
          from,
          `✓ Mounting Height: *${heightName}*\n\n🧱 *Step 4 of 6: Surface Type*\n\nWhat surface will the cameras be mounted on?`,
          [
            { id: "surf_brick", title: "🧱 Concrete / Brick" },
            { id: "surf_ceiling", title: "🏢 False Ceiling" }
          ]
        ));
        break;
      }

      case "ASK_SURFACE_TYPE": {
        const text = String(content || "").toLowerCase().trim();
        // Stale duplicate guard from previous mounting step
        if (text.startsWith("mount_") || text.startsWith("mode_")) {
          console.log(`[BotEngine] Suppressing stale mount replay in ASK_SURFACE_TYPE for ${from}`);
          return;
        }
        let surface: string[] = ["brick"];
        if (text.includes("ceiling") || text.includes("false") || text.includes("pop") || text.includes("gypsum") || text === "2") {
          surface = ["false_ceiling"];
        } else {
          surface = ["brick"];
        }

        session.wizard_answers.surface_types = surface;
        nextState = "ASK_CABLING_OR_POWER";

        const isWireless = session.wizard_answers.technology === "Wireless" || 
                           session.wizard_answers.technology_preference === "Wireless";

        if (isWireless) {
          replies.push(MessageBuilder.buttons(
            from,
            `*Step 4 of 6: Camera Power Point Availability* 🔌\n\nCameras connect wirelessly, but each requires electrical power. Select site power condition:`,
            [
              { id: "pwr_socket", title: "🔌 Socket Nearby" },
              { id: "pwr_wire", title: "⚡ Need Power Wire" },
              { id: "pwr_survey", title: "📋 Decide on Visit" }
            ]
          ));
        } else {
          const wiredCams = Math.max(1, (session.wizard_answers.outdoor_camera_count || 0) + (session.wizard_answers.indoor_camera_count || 0));
          const freeAllowance = wiredCams * 15;
          replies.push(MessageBuilder.buttons(
            from,
            `*Step 4 of 6: Cabling & Wire Routing* 🔌\n\nIs your site pre-wired or do we need fresh cables routed?\n\n• *Complimentary:* ~15m wire/camera included free (*${freeAllowance}m total* for your ${wiredCams} cameras).`,
            [
              { id: "cab_new", title: "📦 Need New Cabling" },
              { id: "cab_prewired", title: "🔌 Site Pre-Wired" },
              { id: "cab_custom", title: "📏 Custom Cable Run" }
            ]
          ));
        }
        break;
      }

      case "ASK_CUSTOM_CABLE_METERS": {
        const text = String(content || "").toLowerCase().trim();
        let customMeters = 60;
        const match = text.match(/\d+/);
        if (match) {
          customMeters = parseInt(match[0], 10);
        }
        session.wizard_answers.cabling_status = "needed";
        session.wizard_answers.cabling_done = false;
        session.wizard_answers.total_cable_length_meters = customMeters;
        session.wizard_answers.cable_length_meters = Math.ceil(customMeters / (session.wizard_answers.camera_count || 4));

        const isHybridWithWifi = (session.wizard_answers.wifi_camera_count || 0) > 0 && 
                                 session.wizard_answers.technology !== "Wireless" &&
                                 session.wizard_answers.technology_preference !== "Wireless";

        if (isHybridWithWifi) {
          nextState = "ASK_HYBRID_POWER";
          const wifiCount = session.wizard_answers.wifi_camera_count || 1;
          replies.push(MessageBuilder.buttons(
            from,
            `✓ *Custom Cable Length Saved:* ${customMeters}m total\n\n⚡ *Power for ${wifiCount} Smart Wi-Fi Camera${wifiCount > 1 ? 's' : ''}:*\nYour wired cameras connect to the DVR, but Wi-Fi cameras need electrical power. Select power setup:`,
            [
              { id: "pwr_socket", title: "🔌 Socket Nearby" },
              { id: "pwr_wire", title: "⚡ Need Power Wire" },
              { id: "pwr_survey", title: "📋 Decide on Visit" }
            ]
          ));
        } else {
          nextState = "ASK_INTERNET";
          replies.push(MessageBuilder.buttons(
            from,
            `✓ *Custom Cable Length Saved:* ${customMeters}m total\n\n📱 *Step 5 of 6: Remote Mobile Viewing & Internet*\n\nChoose how you want to watch live camera video on your smartphone:`,
            [
              { id: "net_wifi", title: "📶 Have Wi-Fi Router" },
              { id: "net_4g", title: "🌐 Add 4G SIM Router" },
              { id: "net_offline", title: "📺 Offline / TV Only" }
            ]
          ));
        }
        break;
      }

      case "ASK_CABLING_OR_POWER": {
        const text = String(content || "").toLowerCase().trim();
        // Stale duplicate guard from previous surface step
        if (text.startsWith("surf_") || text.startsWith("mount_")) {
          console.log(`[BotEngine] Suppressing stale surface replay in ASK_CABLING_OR_POWER for ${from}`);
          return;
        }
        if (text.includes("cab_custom") || text.includes("custom") || text.includes("meters")) {
          nextState = "ASK_CUSTOM_CABLE_METERS";
          replies.push(MessageBuilder.text(
            from,
            `📏 *Custom Cable Length:*\n\nPlease reply with your estimated total cable run in meters (e.g. 70, 90, 120, 150):`
          ));
          break;
        }

        let cablingChoice = "new";
        if (text.includes("cab_prewired") || text.includes("prewired") || text.includes("done") || text.includes("already") || text.includes("fitting only") || text === "2") {
          session.wizard_answers.cabling_status = "done";
          session.wizard_answers.cabling_done = true;
          session.wizard_answers.total_cable_length_meters = 0;
          cablingChoice = "prewired";
        } else if (text.includes("pwr_socket") || text.includes("socket")) {
          session.wizard_answers.power_wiring_option = "socket_available";
          session.wizard_answers.total_power_cable_meters = 0;
          cablingChoice = "power_socket";
        } else if (text.includes("pwr_wire") || text.includes("wire")) {
          session.wizard_answers.power_wiring_option = "wire_needed";
          session.wizard_answers.total_power_cable_meters = (session.wizard_answers.wifi_camera_count || 2) * 10;
          cablingChoice = "power_wire";
        } else if (text.includes("pwr_survey") || text.includes("survey") || text.includes("visit")) {
          session.wizard_answers.power_wiring_option = "site_survey";
          session.wizard_answers.total_power_cable_meters = 0;
          cablingChoice = "power_survey";
        } else {
          session.wizard_answers.cabling_status = "needed";
          session.wizard_answers.cabling_done = false;
          session.wizard_answers.total_cable_length_meters = (session.wizard_answers.camera_count || 4) * 15;
          cablingChoice = "new";
        }

        const isHybridWithWifi = (session.wizard_answers.wifi_camera_count || 0) > 0 && 
                                 session.wizard_answers.technology !== "Wireless" &&
                                 session.wizard_answers.technology_preference !== "Wireless";

        // IF HYBRID SETUP WITH WI-FI CAMERAS: ASK HYBRID POWER NEXT!
        if (isHybridWithWifi && (cablingChoice === "new" || cablingChoice === "prewired")) {
          nextState = "ASK_HYBRID_POWER";
          const wifiCount = session.wizard_answers.wifi_camera_count || 1;
          replies.push(MessageBuilder.buttons(
            from,
            `✓ Cabling: *${cablingChoice === "prewired" ? "Site Pre-Wired" : "New Cables Routed"}*\n\n⚡ *Power for ${wifiCount} Smart Wi-Fi Camera${wifiCount > 1 ? 's' : ''}:*\nYour wired cameras connect to the DVR, but Wi-Fi cameras need electrical power. Select power setup:`,
            [
              { id: "pwr_socket", title: "🔌 Socket Nearby" },
              { id: "pwr_wire", title: "⚡ Need Power Wire" },
              { id: "pwr_survey", title: "📋 Decide on Visit" }
            ]
          ));
          break;
        }

        // OTHERWISE PROCEED STRAIGHT TO STEP 5: INTERNET!
        nextState = "ASK_INTERNET";
        const hasWireless = session.wizard_answers.technology === "Wireless" || 
                            session.wizard_answers.technology_preference === "Wireless" || 
                            (session.wizard_answers.wifi_camera_count || 0) > 0;

        if (hasWireless) {
          replies.push(MessageBuilder.list(
            from,
            `📱 *Step 5 of 6: Mobile App & Internet Connection*\n\nAll packages include free lifetime mobile app setup (Android & iOS). Choose your site internet condition:`,
            "Choose Internet",
            [
              {
                title: "Internet & Wi-Fi Options",
                rows: [
                  { id: "net_wifi_full", title: "📶 Have Wi-Fi (Full)", description: "Wi-Fi reaches all camera spots clearly" },
                  { id: "net_wifi_extender", title: "📡 Wi-Fi, Far Spots", description: "Weak signal at gate; includes Wi-Fi Range Extender" },
                  { id: "net_4g_router", title: "🌐 No Wi-Fi (<20m Spots)", description: "Central 4G SIM Wi-Fi router included" },
                  { id: "net_independent_4g", title: "🛰️ No Wi-Fi (Farm/Dist)", description: "Independent 4G SIM per camera (50m+ apart)" }
                ]
              }
            ]
          ));
        } else {
          replies.push(MessageBuilder.buttons(
            from,
            `📱 *Step 5 of 6: Remote Mobile Viewing & Internet*\n\nChoose how you want to watch live camera video on your smartphone:`,
            [
              { id: "net_wifi", title: "📶 Have Wi-Fi Router" },
              { id: "net_4g", title: "🌐 Add 4G SIM Router" },
              { id: "net_offline", title: "📺 Offline / TV Only" }
            ]
          ));
        }
        break;
      }

      case "ASK_HYBRID_POWER": {
        const text = String(content || "").toLowerCase().trim();
        if (text.includes("pwr_wire") || text.includes("wire")) {
          session.wizard_answers.power_wiring_option = "wire_needed";
          session.wizard_answers.total_power_cable_meters = (session.wizard_answers.wifi_camera_count || 1) * 10;
        } else if (text.includes("pwr_survey") || text.includes("survey") || text.includes("visit")) {
          session.wizard_answers.power_wiring_option = "site_survey";
          session.wizard_answers.total_power_cable_meters = 0;
        } else {
          session.wizard_answers.power_wiring_option = "socket_available";
          session.wizard_answers.total_power_cable_meters = 0;
        }

        nextState = "ASK_INTERNET";
        replies.push(MessageBuilder.list(
          from,
          `✓ Power Setup Saved\n\n📱 *Step 5 of 6: Mobile App & Internet Connection*\n\nAll packages include free lifetime mobile app setup (Android & iOS). Choose your site internet condition:`,
          "Choose Internet",
          [
            {
              title: "Internet & Wi-Fi Options",
              rows: [
                { id: "net_wifi_full", title: "📶 Have Wi-Fi (Full)", description: "Wi-Fi reaches all camera spots clearly" },
                { id: "net_wifi_extender", title: "📡 Wi-Fi, Far Spots", description: "Weak signal at gate; includes Wi-Fi Range Extender" },
                { id: "net_4g_router", title: "🌐 No Wi-Fi (<20m Spots)", description: "Central 4G SIM Wi-Fi router included" },
                { id: "net_independent_4g", title: "🛰️ No Wi-Fi (Farm/Dist)", description: "Independent 4G SIM per camera (50m+ apart)" }
              ]
            }
          ]
        ));
        break;
      }

      case "ASK_INTERNET": {
        const text = String(content || "").toLowerCase().trim();
        // Stale duplicate guard from previous cable/power step
        if (text.startsWith("cab_") || text.startsWith("pwr_") || text.startsWith("surf_")) {
          console.log(`[BotEngine] Suppressing stale cable replay in ASK_INTERNET for ${from}`);
          return;
        }
        let netChoice = "Wi-Fi Connected";
        if (text.includes("extender")) {
          session.wizard_answers.broadband_status = "wifi_extender";
          session.wizard_answers.wants_remote_viewing = true;
          netChoice = "Wi-Fi + Extender Included";
        } else if (text.includes("independent") || text.includes("farm") || text.includes("distant")) {
          session.wizard_answers.broadband_status = "independent_4g";
          session.wizard_answers.wants_remote_viewing = true;
          netChoice = "Independent 4G SIM Cameras";
        } else if (text.includes("4g") || text.includes("sim") || text.includes("router")) {
          session.wizard_answers.broadband_status = "sim_router";
          session.wizard_answers.wants_remote_viewing = true;
          netChoice = "4G SIM Wi-Fi Router Included";
        } else if (text.includes("offline") || text.includes("tv")) {
          session.wizard_answers.broadband_status = "no";
          session.wizard_answers.wants_remote_viewing = false;
          netChoice = "Offline / TV Only";
        } else {
          session.wizard_answers.broadband_status = "yes";
          session.wizard_answers.wants_remote_viewing = true;
          netChoice = "Have Wi-Fi (Full Coverage)";
        }

        nextState = "ASK_PINCODE";
        replies.push(MessageBuilder.text(
          from,
          `✓ Internet: *${netChoice}*\n\n📍 *Step 6 of 6: Site Location & Pincode Dispatch*\n\nPlease enter your *6-digit Indian Pincode* (e.g. 302012) or tap the clip 📎 icon to share your *Location Pin*.\n\nThis matches our nearest Sub-Post Office micro-hub, inventory warehouse, and certified local installer.`
        ));
        break;
      }

      case "ASK_PINCODE": {
        // Stale duplicate guard from previous internet/cabling step
        if (typeof content === "string" && (content.toLowerCase().startsWith("net_") || content.toLowerCase().startsWith("cab_") || content.toLowerCase().startsWith("pwr_"))) {
          console.log(`[BotEngine] Suppressing stale internet/cable replay in ASK_PINCODE for ${from}`);
          return;
        }
        let pincode = "";
        let autoDetectedName = "";

        if (incomingType === "location" && context?.locationCoords) {
          pincode = "302012"; // Default Jaipur if reverse geocode pending
          session.wizard_answers.lead_pincode = pincode;
          session.wizard_answers.location_coords = context.locationCoords;
        } else if (typeof content === "string") {
          const text = content.trim();
          const pinMatch = text.match(/\b\d{6}\b/);
          if (pinMatch) {
            pincode = pinMatch[0];
            session.wizard_answers.lead_pincode = pincode;

            // Check if user also provided their name in the same message (e.g. "302012 Rahul Kumar" or "Rahul Kumar 302012")
            const remaining = text.replace(pinMatch[0], "").replace(/[^a-zA-Z\s]/g, " ").trim();
            const stopWords = ["pincode", "pin", "code", "jaipur", "delhi", "area", "my", "is", "location", "address", "near", "hi", "hello"];
            const words = remaining.split(/\s+/).filter(w => w.length > 1 && !stopWords.includes(w.toLowerCase()));
            if (words.length >= 1 && words.join(" ").length >= 3) {
              autoDetectedName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
            }
          } else {
            const lower = text.toLowerCase();
            if (lower.includes("jaipur")) pincode = "302012";
            else if (lower.includes("chirawa")) pincode = "333026";
            else if (lower.includes("jhunjhunu")) pincode = "333001";
            else if (lower.includes("sikar")) pincode = "332001";
            else if (lower.includes("delhi")) pincode = "110001";
            else if (lower.includes("gurgaon") || lower.includes("gurugram")) pincode = "122001";
            else if (lower.includes("noida")) pincode = "201301";
            if (pincode) {
              session.wizard_answers.lead_pincode = pincode;
            }
          }
        }

        if (pincode) {
          if (autoDetectedName) {
            session.customer_name = autoDetectedName;
            if (leadId) {
              await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
                customer_name: autoDetectedName,
                updated_at: new Date()
              }).catch(console.error);
            }
            nextState = "GENERATING";
            replies.push(MessageBuilder.text(
              from,
              `✓ Thank you, *${autoDetectedName}*! 🤝\n\n⚙️ *Calculating All Brand Quotations for ${autoDetectedName} (Pincode ${pincode})...*\nSizing recorders, checking power supplies, applying ₹0-markup labor rates, and computing 100% transparent market price ranges. Please wait 3 seconds...`
            ));
          } else {
            // Transition to ASK_NAME to collect Customer Name for personalized quotation & warranty certificate
            nextState = "ASK_NAME";
            const knownName = session.customer_name && session.customer_name !== "WhatsApp Customer" && !/^\+?\d+$/.test(session.customer_name)
              ? session.customer_name
              : "";
            
            const namePrompt = knownName
              ? `✓ Site Location Confirmed: *Pincode ${pincode}* 🚚\n\n👤 *Final Step: What is your full name?*\n\nPlease reply with your name (or type *1* or *Yes* to use *${knownName}*).\n\n_This will appear on your official GST quotation PDF, 7-day price lock, and 1-year on-site warranty certificate._`
              : `✓ Site Location Confirmed: *Pincode ${pincode}* 🚚\n\n👤 *Final Step: What is your full name?*\n\nPlease reply with your full name (e.g. *Rahul Kumar*).\n\n_This will appear on your official GST quotation PDF, 7-day price lock, and 1-year on-site warranty certificate._`;

            replies.push(MessageBuilder.text(from, namePrompt));
          }
        } else {
          const rawInput = typeof content === "string" ? content.trim() : "";
          const mobMatch = rawInput.match(/\b[6-9]\d{9}\b/);
          const digitMatch = rawInput.match(/\b\d+\b/);

          if (mobMatch) {
            replies.push(MessageBuilder.text(
              from,
              `⚠️ *You entered a 10-digit mobile number (${mobMatch[0]}).*\n\nYour WhatsApp number is already automatically verified for your quotation! 📱\n\n📍 *Please enter your 6-digit Indian Postal Pincode* (e.g. 302012) or tap 📎 to share Location Pin:`
            ));
          } else if (digitMatch && digitMatch[0].length !== 6) {
            replies.push(MessageBuilder.text(
              from,
              `⚠️ *Indian postal pincodes must be exactly 6 digits.* (You entered: "${digitMatch[0]}")\n\n📍 Please reply with your 6-digit Pincode (e.g. 302012) or tap 📎 to send Location Pin:`
            ));
          } else if (rawInput.length > 0) {
            replies.push(MessageBuilder.text(
              from,
              `📍 *Location landmark noted: "${rawInput.slice(0, 40)}"* 🚚\n\nTo match our nearest local Sub-Post Office warehouse and local technician rates, please also enter your *6-digit Pincode* (e.g. 302012) or tap 📎 to share Location Pin:`
            ));
          } else {
            replies.push(MessageBuilder.text(
              from,
              `📍 *Step 6 of 6: Site Location & Pincode Dispatch*\n\nPlease enter your *6-digit Indian Pincode* (e.g. 302012) or tap the clip 📎 icon to share your Location Pin so we can calculate exact local delivery and certified installation rates for your area.`
            ));
          }
        }
        break;
      }

      case "ASK_NAME": {
        const text = String(content || "").trim();
        // Stale duplicate guard from previous pincode/internet step
        if (/^\d{6}$/.test(text) || text.toLowerCase().startsWith("net_")) {
          console.log(`[BotEngine] Suppressing stale pincode/net replay in ASK_NAME for ${from}`);
          return;
        }
        const lower = text.toLowerCase();
        let finalName = "";

        // If user says "yes", "1", "ok", "same", "confirm" to use their WhatsApp profile name
        if (
          lower === "yes" || 
          lower === "1" || 
          lower === "y" || 
          lower === "same" || 
          lower === "ok" || 
          lower === "use" || 
          lower === "confirm"
        ) {
          if (session.customer_name && session.customer_name !== "WhatsApp Customer" && !/^\+?\d+$/.test(session.customer_name)) {
            finalName = session.customer_name;
          }
        }

        // Check if input is an off-topic phrase or question rather than a person's name
        const nameStopWords = [
          "price", "rate", "cost", "call", "phone", "karo", "discount", "offer", "cctv", 
          "camera", "wifi", "warranty", "help", "bhai", "sir", "ji", "hello", "hi", 
          "testing", "photo", "image", "quote", "quotation", "kya", "hai", "mujhe", 
          "chahiye", "nahi", "batana", "no", "yes", "ok", "pincode", "details", "bolo"
        ];
        const isOffTopicInName = nameStopWords.some(sw => lower.includes(sw));

        // Otherwise parse typed text as customer name if valid human name
        if (!finalName && !isOffTopicInName) {
          const cleaned = text.replace(/[^a-zA-Z\s\.]/g, "").trim();
          const words = cleaned.split(/\s+/).filter(w => w.length > 0);
          if (words.length >= 1 && cleaned.length >= 2 && words.length <= 4) {
            finalName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
          }
        }

        // If user typed skip or unable to parse, fallback gracefully
        if (!finalName && (lower.includes("skip") || lower.includes("no name") || lower.includes("later"))) {
          finalName = (session.customer_name && session.customer_name !== "WhatsApp Customer") 
            ? session.customer_name 
            : "Valued Customer";
        }

        if (!finalName) {
          const knownName = session.customer_name && session.customer_name !== "WhatsApp Customer" && !/^\+?\d+$/.test(session.customer_name)
            ? session.customer_name
            : "";
          replies.push(MessageBuilder.text(
            from,
            `👤 *Please enter your full name (e.g. Rahul Kumar):*\n\n` +
            `This personalizes your official CCTV quotation PDF and activates your 1-Year Free Doorstep Warranty Certificate.` +
            (knownName ? `\n\n_Or reply *1* or *Yes* to use *${knownName}*._` : "")
          ));
          break;
        }

        session.customer_name = finalName;
        if (leadId) {
          await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
            customer_name: finalName,
            updated_at: new Date()
          }).catch(console.error);
        }

        const pin = session.wizard_answers?.lead_pincode || session.wizard_answers?.pincode || "302012";
        nextState = "GENERATING";
        replies.push(MessageBuilder.text(
          from,
          `✓ Thank you, *${finalName}*! 🤝\n\n⚙️ *Calculating All Brand Quotations for ${finalName} (Pincode ${pin})...*\nSizing recorders, checking power supplies, applying ₹0-markup labor rates, and computing 100% transparent market price ranges. Please wait 3 seconds...`
        ));
        break;
      }

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
            const variantType = parts[2]; // "standard" | "color" | "economy"
            const cachedSummaries = (session as any).cached_brand_summaries || [];
            const summary = cachedSummaries.find((b: any) => b.brandKey === brandKey);
            let targetQuote = summary?.standardQuote;
            if (variantType === "color" && summary?.colorNightQuote) {
              targetQuote = summary.colorNightQuote;
            } else if (variantType === "economy" && summary?.economyQuote) {
              targetQuote = summary.economyQuote;
            }
            if (targetQuote) {
              await finalizeAndSendQuote(from, session, targetQuote);
              return;
            }
          } else if (content === "back_to_brands") {
            await generateAndSendPriceRanges(from, session);
            return;
          } else if (content === "toggle_tech_ip" || content === "view_pro_ip") {
            session.wizard_answers.technology = "IP";
            session.wizard_answers.technology_preference = "IP";
            await sessionRef.update({
              "wizard_answers.technology": "IP",
              "wizard_answers.technology_preference": "IP"
            });
            await generateAndSendPriceRanges(from, session);
            return;
          } else if (content === "toggle_tech_hd" || content === "view_value_hd") {
            session.wizard_answers.technology = "HD";
            session.wizard_answers.technology_preference = "HD";
            await sessionRef.update({
              "wizard_answers.technology": "HD",
              "wizard_answers.technology_preference": "HD"
            });
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

  // If reached GENERATING state, await price calculation and summary dispatch
  if (nextState === "GENERATING") {
    await generateAndSendPriceRanges(from, session);
  }
}

async function sendWhatsAppMessages(messages: WhatsAppMessagePayload[]) {
  const whatsappPhoneId = (process.env.WHATSAPP_PHONE_ID || process.env.WA_PHONE_NUMBER_ID || "").trim().replace(/^["']|["']$/g, '');
  const whatsappToken = (process.env.WHATSAPP_TOKEN || process.env.WA_ACCESS_TOKEN || "").trim().replace(/^["']|["']$/g, '');
  const msg91AuthKey = (process.env.MSG91_AUTH_KEY || "").trim().replace(/^["']|["']$/g, '');
  const msg91FromNumber = (process.env.MSG91_WHATSAPP_NUMBER || "").trim().replace(/^["']|["']$/g, '');
  const providerPref = (process.env.WHATSAPP_PROVIDER || "").toLowerCase().trim();

  const useMsg91 = providerPref === "msg91" || (!!msg91AuthKey && providerPref !== "meta");

  if (useMsg91 && msg91AuthKey && msg91FromNumber) {
    // Mode B (Active with MSG91): MSG91 WhatsApp Outbound API
    for (const msg of messages) {
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
        console.log(`[MSG91 Outbound Response]: HTTP ${res.status}`, resText);
      } catch (e) {
        console.error("🔥 Failed to send WhatsApp message via MSG91:", e);
      }
    }
  } else if (whatsappPhoneId && whatsappToken) {
    // Mode A (Future with Meta Cloud API): Direct Meta WhatsApp Cloud API
    for (const msg of messages) {
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
    }
  } else {
    console.warn("⚠️ [WhatsApp Simulated] Neither Meta Cloud API nor MSG91 credentials found. Payload:", JSON.stringify(messages, null, 2));
  }
}
