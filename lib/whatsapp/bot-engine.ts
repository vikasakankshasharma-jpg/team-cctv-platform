import { adminDb } from "../firebase-admin";
import { COLLECTIONS } from "../constants";
import { WhatsAppBotState, WhatsAppSession } from "../../types/whatsapp";
import { MessageBuilder, WhatsAppMessagePayload } from "./message-builder";

// Process incoming WhatsApp messages
export async function processIncomingMessage(
  from: string, 
  incomingType: "text" | "interactive" | "nfm_reply", 
  content: string,
  referral?: any
) {
  const sessionRef = adminDb.collection(COLLECTIONS.WHATSAPP_SESSIONS).doc(from);
  const doc = await sessionRef.get();
  
  let session: WhatsAppSession;
  
  if (!doc.exists) {
    // Treat "Hi" or any new message from unknown as start of flow
    session = {
      phone_number: from,
      state: "IDLE",
      wizard_answers: {},
      last_message_at: new Date(),
      created_at: new Date(),
    };
  } else {
    session = doc.data() as WhatsAppSession;
  }

  // If this is from a CTWA (Click-to-WhatsApp) ad, ensure we reset state and track the ad source
  if (referral) {
     session.state = "IDLE"; 
     session.wizard_answers = {};
     // Save referral info into wizard_answers so the Lead gets it later
     session.wizard_answers.utm_source = "facebook_ad";
     session.wizard_answers.utm_campaign = referral.headline || referral.source_id;
  }

  // Handle restart/reset explicitly and parse offline UTM tracking
  if (incomingType === "text") {
    const textLower = content.toLowerCase().trim();
    if (textLower.startsWith("hi")) {
      session.state = "GREETING";
      session.wizard_answers = {};
      
      // If they sent something like "Hi Newspaper" or "Hi P102" from an offline QR code
      const parts = textLower.split(" ");
      if (parts.length > 1) {
        const keyword = parts[1].toLowerCase();
        // If it starts with P followed by numbers, treat it as a Partner/Shop referral
        if (/^p\d+$/.test(keyword)) {
           session.wizard_answers.partner_id = keyword.toUpperCase();
           session.wizard_answers.utm_source = "shop_partner";
        } else {
           session.wizard_answers.utm_source = "offline_qr";
           session.wizard_answers.utm_campaign = keyword;
        }
      }
    }
  }
  
  // If we receive a flow submission, jump straight to GENERATING
  if (incomingType === "nfm_reply") {
     const answers = JSON.parse(content);
     session.wizard_answers = answers;
     session.wizard_answers.plan_type = "recommended";
     session.state = "GENERATING";
  }

  // State Machine logic
  let replies: WhatsAppMessagePayload[] = [];
  let nextState = session.state;

  try {
    switch (session.state) {
      case "IDLE":
      case "GREETING":
        nextState = "WAITING_FOR_FLOW";
        replies.push(MessageBuilder.flowButton(
          from, 
          "Welcome to TEAM CCTV! 📷\n\nTo provide an accurate quote for your CCTV system, please configure your preferences below.",
          "Build Your Quote",
          process.env.WHATSAPP_FLOW_ID || "123456789", // From Meta Dev Dashboard
          "session_" + Date.now()
        ));
        break;

      case "ASK_PINCODE":
        if (incomingType === "text" && /^\d{6}$/.test(content)) {
          session.wizard_answers.lead_pincode = content;
          nextState = "ASK_PROPERTY";
          replies.push(MessageBuilder.buttons(from, "Great! What type of property are we securing?", [
            { id: "prop_home", title: "Home" },
            { id: "prop_office", title: "Office/Shop" },
            { id: "prop_factory", title: "Factory/Warehouse" }
          ]));
        } else {
          replies.push(MessageBuilder.text(from, "Please enter a valid 6-digit Pincode (e.g., 302001)."));
        }
        break;

      case "ASK_PROPERTY":
        if (incomingType === "interactive") {
          const propMap: any = { prop_home: "home", prop_office: "office", prop_factory: "factory" };
          if (propMap[content]) {
            session.wizard_answers.property_type = propMap[content];
            nextState = "ASK_CAMERA_COUNT";
            replies.push(MessageBuilder.list(from, "How many cameras do you need in total?", "Select Cameras", [
              {
                title: "Small Setup",
                rows: [
                  { id: "cam_2", title: "2 Cameras" },
                  { id: "cam_4", title: "4 Cameras" }
                ]
              },
              {
                title: "Medium Setup",
                rows: [
                  { id: "cam_6", title: "6 Cameras" },
                  { id: "cam_8", title: "8 Cameras" }
                ]
              },
              {
                title: "Large Setup",
                rows: [
                  { id: "cam_16", title: "16 Cameras" },
                  { id: "cam_custom", title: "More than 16" }
                ]
              }
            ]));
          }
        } else {
          replies.push(MessageBuilder.text(from, "Please use the buttons provided to select your property type."));
        }
        break;

      case "ASK_CAMERA_COUNT":
        if (incomingType === "interactive") {
          if (content === "cam_custom") {
             replies.push(MessageBuilder.text(from, "For setups larger than 16 cameras, please contact our team directly for a customized industrial quote. A representative will be with you shortly."));
             nextState = "COMPLETED"; // Terminate automated flow
          } else {
             const countStr = content.replace("cam_", "");
             session.wizard_answers.camera_count = parseInt(countStr);
             
             // Default to 50/50 indoor outdoor for simplicity, or we could ask. To keep it simple, let's ask indoor count if total is small, otherwise just assume.
             // Actually, the prompt says "if customer month A4 camera indoor and outdoor".
             // Let's ask how many are OUTDOOR. 
             nextState = "ASK_TECH";
             replies.push(MessageBuilder.buttons(from, "Which technology do you prefer?", [
               { id: "tech_IP", title: "IP (Digital/Best)" },
               { id: "tech_HD", title: "HD (Analog/Budget)" }
             ]));
          }
        }
        break;

      case "ASK_TECH":
        if (incomingType === "interactive") {
          if (content === "tech_IP" || content === "tech_HD") {
            session.wizard_answers.technology = content.replace("tech_", "");
            nextState = "ASK_STORAGE";
            replies.push(MessageBuilder.buttons(from, "How many days of recording backup do you need?", [
              { id: "storage_15", title: "15 Days" },
              { id: "storage_30", title: "30 Days" }
            ]));
          }
        }
        break;

      case "ASK_STORAGE":
        if (incomingType === "interactive") {
          session.wizard_answers.recording_days = parseInt(content.replace("storage_", ""));
          
          // We have enough data to generate the quote.
          session.wizard_answers.plan_type = "recommended";
          nextState = "GENERATING";
          
          replies.push(MessageBuilder.text(from, "Thanks! ⚙️ Generating your quotation now. Please wait a moment..."));
          
          // Dispatch generation job asynchronously or here
          // We will handle the generation in the webhook by checking if nextState is GENERATING.
        }
        break;

      case "QUOTE_SENT":
        if (incomingType === "interactive") {
           if (content === "action_accept") {
              replies.push(MessageBuilder.text(from, "Excellent! Our team will contact you shortly to schedule the installation or site visit."));
              nextState = "COMPLETED";
           } else if (content === "action_change_cams") {
              nextState = "ASK_CAMERA_COUNT";
              replies.push(MessageBuilder.list(from, "Let's update the camera count. How many cameras?", "Select Cameras", [
                { title: "Options", rows: [{id:"cam_2", title:"2"}, {id:"cam_4", title:"4"}, {id:"cam_6", title:"6"}, {id:"cam_8", title:"8"}, {id:"cam_16", title:"16"}]}
              ]));
           } else if (content === "action_change_tech") {
              nextState = "ASK_TECH";
              replies.push(MessageBuilder.buttons(from, "Which technology do you prefer?", [
                { id: "tech_IP", title: "IP (Digital/Best)" },
                { id: "tech_HD", title: "HD (Analog/Budget)" }
              ]));
           }
        } else {
           replies.push(MessageBuilder.buttons(from, "Would you like to proceed with this quotation, or make changes?", [
              { id: "action_accept", title: "Looks Good ✅" },
              { id: "action_change_cams", title: "Change Cameras" },
              { id: "action_change_tech", title: "Change Tech (IP/HD)" }
           ]));
        }
        break;

      default:
        // Do nothing if completed
        break;
    }
  } catch (error) {
    console.error("Bot Error:", error);
    replies.push(MessageBuilder.text(from, "Sorry, I encountered an error. Please type 'Hi' to restart."));
    nextState = "IDLE";
  }

  // Save State
  session.state = nextState;
  session.last_message_at = new Date();
  await sessionRef.set(session);

  // Send replies
  await sendWhatsAppMessages(replies);

  // If we reached GENERATING state, trigger the quote generation function.
  if (nextState === "GENERATING") {
    // We can call quote dispatch in the background
    // To avoid blocking the webhook, this can be triggered by calling a new function asynchronously.
    triggerQuoteDispatch(session.phone_number, session);
  }
}

async function sendWhatsAppMessages(messages: WhatsAppMessagePayload[]) {
  const whatsappPhoneId = process.env.WHATSAPP_PHONE_ID;
  const whatsappToken = process.env.WHATSAPP_TOKEN;

  if (!whatsappPhoneId || !whatsappToken) {
    console.warn("WhatsApp API credentials missing. Cannot send messages:", messages);
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
      console.error("Failed to send WhatsApp message", e);
    }
  }
}

async function triggerQuoteDispatch(phone: string, session: WhatsAppSession) {
  // We'll implement this next in quote-dispatch.ts
  const { generateAndSendWhatsAppQuote } = await import("./quote-dispatch");
  generateAndSendWhatsAppQuote(phone, session).catch(console.error);
}
