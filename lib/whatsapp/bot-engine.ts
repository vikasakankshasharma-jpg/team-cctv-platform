/**
 * @file lib/whatsapp/bot-engine.ts
 * @description Master finite state machine for TEAM CCTV WhatsApp Omnichannel Engine.
 * Features: Zero-Loss Instant Lead Capture on Message 1, 100% Website Wizard Parity,
 * Multi-Brand Price Range Summary, In-Chat Competitor Quote OCR, and 4 Checkout Pathways.
 */

import { adminDb } from "../firebase-admin";
import { COLLECTIONS } from "../constants";
import { cleanEnvVar, cleanPhoneEnvVar } from "../env-utils";
import { WhatsAppBotState, WhatsAppSession, WhatsAppIncomingType } from "../../types/whatsapp";
import { MessageBuilder, WhatsAppMessagePayload } from "./message-builder";
import { addLeadActivity } from "@/app/actions/leads";
import { normalizePhoneNumber } from "./deduplication";
import { resolveLanguageInput, languageNames, ALL_11_LANGUAGES } from "../i18n/mapping";
import { buildWelcomeLanguageMenu, getConversationalStrings, ConversationalStrings } from "./conversational-i18n";
import {
  normalizeIndicDigits,
  matchesKeywords,
  hasIndicOrPhrase,
  isGreetingOrRestartText,
  LANG_CHANGE_ASCII,
  LANG_CHANGE_INDIC,
  CALL_ASCII,
  CALL_INDIC,
  PRICE_ASCII,
  PRICE_INDIC,
  WARRANTY_ASCII,
  WARRANTY_INDIC,
  LOCATION_ASCII,
  LOCATION_INDIC,
  RESET_PHRASES,
  HELP_ASCII,
  HELP_INDIC,
  ZERO_NONE_ASCII,
  ZERO_NONE_INDIC,
  DONE_PROCEED_ASCII,
  DONE_PROCEED_INDIC,
  CHANGE_QTY_ASCII,
  CHANGE_QTY_INDIC,
  ADD_MORE_INDIC,
  INDIC_NAME_STOPWORDS,
  INSTALL_HYBRID_ASCII,
  INSTALL_HYBRID_INDIC,
  INSTALL_ADDON_INDIC,
  INSTALL_4G_INDIC,
  INSTALL_WIRELESS_INDIC,
  INSTALL_WIRED_INDIC,
  TIMELINE_ASAP_INDIC,
  TIMELINE_WEEK_INDIC,
  TIMELINE_MONTH_INDIC,
  TIMELINE_RESEARCH_INDIC,
  MODE_MOTION_INDIC,
  HEIGHT_HIGH_INDIC,
  SURFACE_CEILING_INDIC,
  CABLING_PREWIRED_INDIC,
  CABLING_CUSTOM_INDIC,
  NET_OFFLINE_INDIC,
  NET_EXTENDER_INDIC,
  NET_4G_FAR_INDIC,
} from "./indic-keywords";
import { 
  generateAndSendPriceRanges, 
  sendBrandVariations, 
  finalizeAndSendQuote, 
  handleCheckoutAction, 
  handleSlotSelection,
  resolveDispatchTech
} from "./quote-dispatch";

function syncWizardHybridState(answers: Record<string, any>) {
  if (!answers) return;
  const { isHybrid, tech, hydratedSelection } = resolveDispatchTech(answers);
  answers.is_hybrid = isHybrid;
  answers.hybrid_wired_technology = tech === "IP" ? "IP" : "HD";
  answers.technology_choice = isHybrid ? "Hybrid" : tech;
  if (hydratedSelection.mixed_camera_requirements) {
    answers.mixed_camera_requirements = hydratedSelection.mixed_camera_requirements;
  }
}

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
  itemLabel: string,
  pluralLabel: string,
  page: number, // 1 to 4
  headerText: string,
  buttonText?: string,
  convArg?: ConversationalStrings
) {
  const conv = convArg || getConversationalStrings("en");
  const safePage = Math.max(1, Math.min(4, page));
  const resolvedBtn = buttonText || conv.btnSelectQty;
  const rows: Array<{ id: string; title: string; description: string }> = [];

  if (safePage === 1) {
    for (let i = 0; i <= 7; i++) {
      rows.push({
        id: `${prefix}_${i}`,
        title: `${i} ${i === 1 ? itemLabel : pluralLabel}`,
        description: i === 0
          ? conv.qtyRowNoneDesc
          : conv.qtyRowItemDesc.replace("{n}", String(i)).replace("{item}", itemLabel)
      });
    }
    rows.push({
      id: `${prefix}_page_2`,
      title: conv.qtyNextTitle.replace("{range}", "8–15"),
      description: conv.qtyRangeTapDesc.replace("{range}", "8–15")
    });
    rows.push({
      id: `${prefix}_custom`,
      title: conv.qtyTypeAnyTitle,
      description: conv.qtyTypeAnyDesc
    });
  } else if (safePage === 2) {
    for (let i = 8; i <= 15; i++) {
      rows.push({
        id: `${prefix}_${i}`,
        title: `${i} ${pluralLabel}`,
        description: conv.qtyRowItemDesc.replace("{n}", String(i)).replace("{item}", itemLabel)
      });
    }
    rows.push({
      id: `${prefix}_page_1`,
      title: conv.qtyPrevTitle.replace("{range}", "0–7"),
      description: conv.qtyBackDesc.replace("{range}", "0–7")
    });
    rows.push({
      id: `${prefix}_page_3`,
      title: conv.qtyNextTitle.replace("{range}", "16–23"),
      description: conv.qtyRangeTapDesc.replace("{range}", "16–23")
    });
  } else if (safePage === 3) {
    for (let i = 16; i <= 23; i++) {
      rows.push({
        id: `${prefix}_${i}`,
        title: `${i} ${pluralLabel}`,
        description: conv.qtyRowItemDesc.replace("{n}", String(i)).replace("{item}", itemLabel)
      });
    }
    rows.push({
      id: `${prefix}_page_2`,
      title: conv.qtyPrevTitle.replace("{range}", "8–15"),
      description: conv.qtyBackDesc.replace("{range}", "8–15")
    });
    rows.push({
      id: `${prefix}_page_4`,
      title: conv.qtyNextTitle.replace("{range}", "24–32"),
      description: conv.qtyRangeTapDesc.replace("{range}", "24–32")
    });
  } else {
    for (let i = 24; i <= 32; i++) {
      rows.push({
        id: `${prefix}_${i}`,
        title: `${i} ${pluralLabel}`,
        description: conv.qtyRowItemDesc.replace("{n}", String(i)).replace("{item}", itemLabel)
      });
    }
    rows.push({
      id: `${prefix}_page_3`,
      title: conv.qtyPrevTitle.replace("{range}", "16–23"),
      description: conv.qtyBackDesc.replace("{range}", "16–23")
    });
  }

  const rangeLabel = safePage === 1 ? "0–7" : safePage === 2 ? "8–15" : safePage === 3 ? "16–23" : "24–32";
  const foot = conv.qtyPageFoot.replace("{page}", String(safePage)).replace("{range}", rangeLabel);

  return MessageBuilder.list(
    recipient,
    `${headerText}\n\n${foot}`,
    resolvedBtn,
    [
      {
        title: conv.qtyRangeSection.replace("{range}", rangeLabel),
        rows
      }
    ]
  );
}

const WELCOME_LANGUAGE_BUTTONS: { id: string; title: string }[] = [
  { id: "lang_en", title: "English" },
  { id: "lang_hi", title: "हिन्दी (Hindi)" },
  { id: "lang_other_help", title: "🌐 3–11 More" }
];

function buildWelcomeLanguagePayload(recipient: string): WhatsAppMessagePayload {
  return MessageBuilder.buttons(recipient, buildWelcomeLanguageMenu(), WELCOME_LANGUAGE_BUTTONS);
}

// ── Shared localized interactive UI builders ──
function stripLeadingEmoji(str: string): string {
  return str.replace(/^[^\w\s\u0900-\u0D7F]+/, "").trim();
}

function getWirelessVariantLabel(conv: ConversationalStrings, variant: string): { single: string; plural: string } {
  const map: Record<string, string> = {
    wf_in_ptz: stripLeadingEmoji(conv.wfInPtzTitle),
    wf_in_fixed: stripLeadingEmoji(conv.wfInFixedTitle),
    wf_out_bullet: stripLeadingEmoji(conv.wfOutBulletTitle),
    wf_out_ptz: stripLeadingEmoji(conv.wfOutPtzTitle),
    wf_4g_solar: stripLeadingEmoji(conv.wf4gTitle),
  };
  const label = map[variant] || conv.wfCamSingle;
  return { single: label, plural: conv.wfCamPlural };
}

function buildInstallTypeList(recipient: string, conv: ConversationalStrings, bodyText: string): WhatsAppMessagePayload {
  return MessageBuilder.list(recipient, bodyText, conv.btnChooseInstall, [
    {
      title: conv.secInstallTypes,
      rows: [
        { id: "ins_new_wired", title: conv.installWiredTitle, description: conv.installWiredDesc },
        { id: "ins_wireless", title: conv.installWirelessTitle, description: conv.installWirelessDesc },
        { id: "ins_4g_solar", title: conv.install4gTitle, description: conv.install4gDesc },
        { id: "ins_hybrid", title: conv.installHybridTitle, description: conv.installHybridDesc },
        { id: "ins_addon", title: conv.installAddonTitle, description: conv.installAddonDesc }
      ]
    }
  ]);
}

function buildWirelessOptionsList(
  recipient: string,
  conv: ConversationalStrings,
  bodyText: string,
  mode: "hybrid_first" | "hybrid_required" | "add_more" | "standalone"
): WhatsAppMessagePayload {
  const rows: Array<{ id: string; title: string; description: string }> = [];
  if (mode === "hybrid_first") {
    rows.push({ id: "wf_none", title: conv.wfNoneTitle, description: conv.wfNoneDesc });
  }
  rows.push(
    { id: "wf_in_ptz", title: conv.wfInPtzTitle, description: conv.wfInPtzDesc },
    { id: "wf_in_fixed", title: conv.wfInFixedTitle, description: conv.wfInFixedDesc },
    { id: "wf_out_bullet", title: conv.wfOutBulletTitle, description: conv.wfOutBulletDesc },
    { id: "wf_out_ptz", title: conv.wfOutPtzTitle, description: conv.wfOutPtzDesc },
    { id: "wf_4g_solar", title: conv.wf4gTitle, description: conv.wf4gDesc }
  );
  if (mode === "standalone") {
    rows.push({ id: "wf_combo_2x2", title: conv.wfComboTitle, description: conv.wfComboDesc });
  } else if (mode === "add_more") {
    rows.push({ id: "wf_done_proceed", title: conv.quickBtnDoneProceed, description: conv.wfNoneDesc });
  } else if (mode === "hybrid_required") {
    rows.push({ id: "wf_none", title: conv.wfNoneTitle, description: conv.wfNoneDesc });
  }
  return MessageBuilder.list(
    recipient,
    bodyText,
    mode === "standalone" ? conv.btnChooseCamType : conv.btnWirelessOptions,
    [{ title: mode === "standalone" ? conv.secWirelessVariants : conv.secWirelessAddon, rows }]
  );
}

function buildTimelineList(recipient: string, conv: ConversationalStrings, bodyText: string): WhatsAppMessagePayload {
  return MessageBuilder.list(recipient, bodyText, conv.btnChooseTimeline, [
    {
      title: conv.secTimeline,
      rows: [
        { id: "time_asap", title: conv.timeAsapTitle, description: conv.timeAsapDesc },
        { id: "time_week", title: conv.timeWeekTitle, description: conv.timeWeekDesc },
        { id: "time_month", title: conv.timeMonthTitle, description: conv.timeMonthDesc },
        { id: "time_research", title: conv.timeResearchTitle, description: conv.timeResearchDesc }
      ]
    }
  ]);
}

function buildStorageList(recipient: string, conv: ConversationalStrings, bodyText: string, include45Days = false): WhatsAppMessagePayload {
  const rows = [
    { id: "storage_7", title: conv.storage7Title, description: conv.storage7Desc },
    { id: "storage_15", title: conv.storage15Title, description: conv.storage15Desc },
    { id: "storage_30", title: conv.storage30Title, description: conv.storage30Desc },
    ...(include45Days ? [{ id: "storage_45", title: conv.storage45Title, description: conv.storage45Desc }] : []),
    { id: "storage_60", title: conv.storage60Title, description: conv.storage60Desc },
    { id: "storage_0", title: conv.storage0Title, description: conv.storage0Desc }
  ];
  return MessageBuilder.list(recipient, bodyText, conv.btnChooseStorage, [{ title: conv.secStorage, rows }]);
}

function buildMountingButtons(recipient: string, conv: ConversationalStrings, bodyText: string): WhatsAppMessagePayload {
  return MessageBuilder.buttons(recipient, bodyText, [
    { id: "mount_standard", title: conv.btnMountStd },
    { id: "mount_high", title: conv.btnMountHigh },
    { id: "mount_very_high", title: conv.btnMountVeryHigh }
  ]);
}

function buildPowerButtons(recipient: string, conv: ConversationalStrings, bodyText: string): WhatsAppMessagePayload {
  return MessageBuilder.buttons(recipient, bodyText, [
    { id: "pwr_socket", title: conv.btnPwrSocket },
    { id: "pwr_wire", title: conv.btnPwrWire },
    { id: "pwr_survey", title: conv.btnPwrSurvey }
  ]);
}

function buildInternetButtons(recipient: string, conv: ConversationalStrings, bodyText: string): WhatsAppMessagePayload {
  return MessageBuilder.buttons(recipient, bodyText, [
    { id: "net_wifi", title: conv.btnNetWifi },
    { id: "net_4g", title: conv.btnNet4g },
    { id: "net_offline", title: conv.btnNetOffline }
  ]);
}

function buildWirelessInternetList(recipient: string, conv: ConversationalStrings, bodyText: string): WhatsAppMessagePayload {
  return MessageBuilder.list(recipient, bodyText, conv.btnChooseInternet, [
    {
      title: conv.secInternet,
      rows: [
        { id: "net_wifi_full", title: conv.netFullTitle, description: conv.netFullDesc },
        { id: "net_wifi_extender", title: conv.netExtTitle, description: conv.netExtDesc },
        { id: "net_4g_router", title: conv.net4gNearTitle, description: conv.net4gNearDesc },
        { id: "net_independent_4g", title: conv.net4gFarTitle, description: conv.net4gFarDesc }
      ]
    }
  ]);
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
        replies.push(buildWelcomeLanguagePayload(from));
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
        ? stripLeadingEmoji(conv.propHomeTitle)
        : session.wizard_answers?.property_type === "office"
        ? stripLeadingEmoji(conv.propOfficeTitle)
        : stripLeadingEmoji(conv.propFactoryTitle);
      replies.push(buildInstallTypeList(
        from,
        conv,
        `${conv.askPropSaved.replace("{prop}", propTitle)}\n\n*${conv.installHeader}*\n${conv.installQuestion}`
      ));
      break;
    }

    case "ASK_CAMERA_OUTDOOR": {
      replies.push(buildQuantityButtonsMessage(
        from, "out",
        `*${conv.outdoorHeader}*\n\n${conv.outdoorQuestion}`,
        [
          { id: "out_2", title: `2 ${conv.quickBtnBullets}` },
          { id: "out_4", title: `4 ${conv.quickBtnBullets}` },
          { id: "out_0", title: conv.quickBtnNone }
        ],
        conv.numberReplyHint
      ));
      break;
    }

    case "ASK_CAMERA_INDOOR": {
      const outCount = session.wizard_answers?.outdoor_camera_count || 0;
      replies.push(buildQuantityButtonsMessage(
        from, "in",
        `${conv.askOutSaved.replace("{n}", String(outCount))}\n\n*${conv.indoorHeader}*\n\n${conv.indoorQuestion}`,
        [
          { id: "in_2", title: `2 ${conv.quickBtnDomes}` },
          { id: "in_4", title: `4 ${conv.quickBtnDomes}` },
          { id: "in_0", title: conv.quickBtnNone }
        ],
        conv.numberReplyHint
      ));
      break;
    }

    case "ASK_HYBRID_WIRELESS": {
      const outWired = session.wizard_answers?.outdoor_camera_count || 0;
      const inWired = session.wizard_answers?.indoor_camera_count || 0;
      const totalWired = outWired + inWired;
      const existingWifi = session.wizard_answers?.wifi_camera_count || 0;
      const isHybridIntent = session.wizard_answers?.installation_type === "hybrid" || session.wizard_answers?.is_hybrid === true;
      if (existingWifi > 0) {
        replies.push(buildWirelessOptionsList(from, conv, conv.wirelessMorePrompt, "add_more"));
      } else {
        const promptTpl = isHybridIntent ? conv.hybridRequiredPrompt : conv.hybridPrompt;
        replies.push(buildWirelessOptionsList(
          from,
          conv,
          promptTpl
            .replace("{total}", String(totalWired))
            .replace("{out}", String(outWired))
            .replace("{in}", String(inWired)),
          isHybridIntent ? "hybrid_required" : "hybrid_first"
        ));
      }
      break;
    }

    case "ASK_WIRELESS_QTY": {
      const variant = session.wizard_answers?.selected_wireless_variant || "wf_in_ptz";
      const vInfo = getWirelessVariantLabel(conv, variant);
      replies.push(buildQuantityButtonsMessage(
        from, "wfq",
        conv.wirelessQtyQuestion.replace("{item}", vInfo.single),
        [
          { id: "wfq_1", title: conv.btn1Cam },
          { id: "wfq_2", title: conv.btn2Cam },
          { id: "wfq_0", title: conv.quickBtnNone }
        ],
        conv.numberReplyHint
      ));
      break;
    }

    case "ASK_CAMERA_EDIT_CHOICE": {
      const outCount = session.wizard_answers?.outdoor_camera_count || 0;
      const inCount = session.wizard_answers?.indoor_camera_count || 0;
      const wifiCount = session.wizard_answers?.wifi_camera_count || 0;
      const wifiLine = wifiCount > 0 ? `\n• ${conv.wfCamPlural}: *${wifiCount}*` : "";
      replies.push(MessageBuilder.buttons(
        from,
        conv.editChoiceBody
          .replace("{out}", String(outCount))
          .replace("{in}", String(inCount))
          .replace("{wifiLine}", wifiLine),
        [
          { id: "edit_qty_outdoor", title: conv.btnEditOutdoor },
          { id: "edit_qty_indoor", title: conv.btnEditIndoor },
          ...(wifiCount > 0
            ? [{ id: "edit_qty_wireless", title: conv.btnEditWireless }]
            : [{ id: "edit_qty_all", title: conv.btnEditAll }])
        ]
      ));
      break;
    }

    case "ASK_TIMELINE": {
      replies.push(buildTimelineList(from, conv, conv.timelinePrompt));
      break;
    }

    case "ASK_STORAGE_DAYS": {
      replies.push(buildStorageList(from, conv, `*${conv.storageHeader}*\n\n${conv.storageQuestion}`));
      break;
    }

    case "ASK_RECORDING_MODE": {
      const days = session.wizard_answers?.recording_days ?? 7;
      replies.push(MessageBuilder.buttons(
        from,
        conv.recModePrompt.replace("{days}", String(days)),
        [
          { id: "mode_continuous", title: conv.btnMode247 },
          { id: "mode_motion", title: conv.btnModeMotion }
        ]
      ));
      break;
    }

    case "ASK_MOUNTING_CONDITIONS": {
      replies.push(buildMountingButtons(from, conv, conv.mountPrompt));
      break;
    }

    case "ASK_SURFACE_TYPE": {
      replies.push(MessageBuilder.buttons(
        from,
        conv.surfacePrompt,
        [
          { id: "surf_brick", title: conv.btnSurfBrick },
          { id: "surf_ceiling", title: conv.btnSurfCeiling }
        ]
      ));
      break;
    }

    case "ASK_CABLING_OR_POWER": {
      const isWireless = session.wizard_answers?.technology === "Wireless" ||
                         session.wizard_answers?.technology_preference === "Wireless";
      if (isWireless) {
        replies.push(buildPowerButtons(from, conv, conv.powerPrompt));
      } else {
        const wiredCams = Math.max(1, (session.wizard_answers?.outdoor_camera_count || 0) + (session.wizard_answers?.indoor_camera_count || 0));
        const freeAllowance = wiredCams * 15;
        replies.push(MessageBuilder.buttons(
          from,
          conv.cablingPrompt
            .replace("{free}", String(freeAllowance))
            .replace("{cams}", String(wiredCams)),
          [
            { id: "cab_new", title: conv.btnCabNew },
            { id: "cab_prewired", title: conv.btnCabPrewired },
            { id: "cab_custom", title: conv.btnCabCustom }
          ]
        ));
      }
      break;
    }

    case "ASK_CUSTOM_CABLE_METERS": {
      replies.push(MessageBuilder.text(from, conv.customCablePrompt));
      break;
    }

    case "ASK_HYBRID_POWER": {
      const wifiCount = session.wizard_answers?.wifi_camera_count || 1;
      replies.push(buildPowerButtons(
        from,
        conv,
        conv.hybridPowerPrompt.replace("{wifi}", String(wifiCount))
      ));
      break;
    }

    case "ASK_INTERNET": {
      const hasWireless = session.wizard_answers?.technology === "Wireless" ||
                          session.wizard_answers?.technology_preference === "Wireless" ||
                          (session.wizard_answers?.wifi_camera_count || 0) > 0;
      if (hasWireless) {
        replies.push(buildWirelessInternetList(from, conv, conv.askNetWireless));
      } else {
        replies.push(buildInternetButtons(from, conv, conv.internetPrompt));
      }
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
        ? `*${conv.nameHeader}*\n\n${conv.nameQuestion}${conv.nameHintKnown.replace("{name}", knownName)}`
        : `*${conv.nameHeader}*\n\n${conv.nameQuestion}`;
      replies.push(MessageBuilder.text(from, namePrompt));
      break;
    }

    case "SHOW_PRICE_RANGES": {
      replies.push(MessageBuilder.buttons(
        from,
        conv.quoteReadyPrompt,
        [
          { id: "back_to_brands", title: conv.btnViewBrands },
          { id: "open_web_studio", title: conv.btnOpenStudio }
        ]
      ));
      break;
    }

    default: {
      replies.push(MessageBuilder.buttons(
        from,
        `*${conv.propHeader}*\n${conv.propQuestion}`,
        [
          { id: "prop_home", title: conv.propHomeTitle },
          { id: "prop_office", title: conv.propOfficeTitle },
          { id: "prop_factory", title: conv.propFactoryTitle }
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
    if (isGreetingOrRestartText(textLower)) {
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

  let conv = getConversationalStrings(session.language || "en");

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

    const ackMsg = MessageBuilder.text(from, conv.mediaPhotoAck);
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

    const ackMsg = MessageBuilder.text(from, conv.mediaVoiceAck);
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

    const ackMsg = MessageBuilder.text(from, conv.mediaVideoAck);
    const stepPrompts = getStepPrompt(session, session.state, from);
    await sendWhatsAppMessages([ackMsg, ...stepPrompts]);
    return;
  }

  if (incomingType === "sticker") {
    const ackMsg = MessageBuilder.text(from, conv.mediaGenericAck);
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
        const nfmSummary = conv.nfmReceived
          .replace("{out}", String(outdoor))
          .replace("{in}", String(indoor))
          .replace("{wifi}", String(wifiTotal))
          .replace("{total}", String(totalCameras))
          .replace("{days}", String(storageDays));
        const replyMsg = MessageBuilder.text(
          from,
          `${nfmSummary}\n\n${conv.calculatingQuote.replace("{name}", session.customer_name || "Customer").replace("{pin}", session.wizard_answers.lead_pincode)}`
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
        const nfmSummary = conv.nfmReceived
          .replace("{out}", String(outdoor))
          .replace("{in}", String(indoor))
          .replace("{wifi}", String(wifiTotal))
          .replace("{total}", String(totalCameras))
          .replace("{days}", String(storageDays));
        const replyMsg = MessageBuilder.text(
          from,
          `${nfmSummary}\n\n*${conv.pincodeHeader}*\n${conv.pincodeQuestion}`
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
  const rawInbound = typeof content === "string" ? normalizeIndicDigits(cleanInboundText(content)).toLowerCase().trim() : "";
  if (rawInbound === "website" || rawInbound === "web" || rawInbound === "link" || rawInbound === "web wizard" || rawInbound === "studio") {
    const cleanPhone = from.replace(/\D/g, "");
    const partnerRef = session.partner_id ? `&ref=${session.partner_id}` : "";
    const nameParam = session.customer_name && session.customer_name !== "WhatsApp Customer" ? `&name=${encodeURIComponent(session.customer_name)}` : "";
    const propParam = session.wizard_answers?.property_type ? `&property=${session.wizard_answers.property_type}` : "";
    const pinParam = session.wizard_answers?.lead_pincode || session.wizard_answers?.pincode ? `&pincode=${session.wizard_answers?.lead_pincode || session.wizard_answers?.pincode}` : "";
    const langParam = session.language ? `&lang=${session.language}` : "";
    const webWizardUrl = `https://cctvquotation.com/wizard?phone=${cleanPhone}${partnerRef}${nameParam}${propParam}${pinParam}${langParam}&source=wa_chat_help`;
    await sendWhatsAppMessages([
      MessageBuilder.text(from, conv.intentWebStudio.replace("{url}", webWizardUrl))
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
    const isExplicitLangQuery = matchesKeywords(textLower, LANG_CHANGE_ASCII, LANG_CHANGE_INDIC);
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
      conv = getConversationalStrings(resolvedLang);
      const ackMsg = MessageBuilder.text(from, conv.langConfirmed);
      const stepPrompts = getStepPrompt(session, session.state, from);
      await sendWhatsAppMessages([ackMsg, ...stepPrompts]);
      return;
    }

    // 1. Human Specialist / Phone Callback Request
    const isCallRequest = 
      matchesKeywords(textLower, CALL_ASCII, CALL_INDIC) &&
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

      const callAck = MessageBuilder.text(from, conv.intentCallback);
      const stepPrompts = getStepPrompt(session, session.state, from);
      await sendWhatsAppMessages([callAck, ...stepPrompts]);
      return;
    }

    // 2. Price / Discount / Negotiation Query (only if not an exact quantity/choice input)
    const isPriceQuery = 
      matchesKeywords(textLower, PRICE_ASCII, PRICE_INDIC) &&
      !/^\d+$/.test(textLower) &&
      !textLower.startsWith("out_") &&
      !textLower.startsWith("in_") &&
      !textLower.startsWith("wf_") &&
      !textLower.startsWith("storage_");

    if (isPriceQuery) {
      const priceAck = MessageBuilder.text(from, conv.intentPrice);
      const stepPrompts = getStepPrompt(session, session.state, from);
      await sendWhatsAppMessages([priceAck, ...stepPrompts]);
      return;
    }

    // 3. Warranty / Guarantee / Repair Query
    const isWarrantyQuery = 
      matchesKeywords(textLower, WARRANTY_ASCII, WARRANTY_INDIC) &&
      !/^\d+$/.test(textLower);

    if (isWarrantyQuery) {
      const warrantyAck = MessageBuilder.text(from, conv.intentWarranty);
      const stepPrompts = getStepPrompt(session, session.state, from);
      await sendWhatsAppMessages([warrantyAck, ...stepPrompts]);
      return;
    }

    // 4. Service Area / Availability Query (only if NOT in ASK_PINCODE where city names are pincode shortcuts)
    const isLocationQuery = 
      session.state !== "ASK_PINCODE" && 
      matchesKeywords(textLower, LOCATION_ASCII, LOCATION_INDIC) &&
      !/^\d+$/.test(textLower);

    if (isLocationQuery) {
      const locationAck = MessageBuilder.text(from, conv.intentLocation);
      const stepPrompts = getStepPrompt(session, session.state, from);
      await sendWhatsAppMessages([locationAck, ...stepPrompts]);
      return;
    }

    // 5. Help / Stuck / Navigation Guidance & Reset Command
    const isResetCommand = RESET_PHRASES.some(p => textLower === p);

    if (isResetCommand) {
      session.wizard_answers = {};
      session.state = "ASK_PROP";
      await sessionRef.set({ state: "ASK_PROP", wizard_answers: {} }, { merge: true });
      if (leadId) {
        await addLeadActivity(leadId, "journey_reset", `Customer requested reset: "${rawInbound}"`).catch(console.error);
      }
      const resetAck = MessageBuilder.text(from, conv.intentReset);
      const propPrompt = getStepPrompt(session, "ASK_PROP", from);
      await sendWhatsAppMessages([resetAck, ...propPrompt]);
      return;
    }

    const isHelpQuery = 
      matchesKeywords(textLower, HELP_ASCII, HELP_INDIC) &&
      !/^\d+$/.test(textLower);

    if (isHelpQuery) {
      const helpAck = MessageBuilder.text(from, conv.intentHelp);
      const stepPrompts = getStepPrompt(session, session.state, from);
      await sendWhatsAppMessages([helpAck, ...stepPrompts]);
      return;
    }
  }

  let replies: WhatsAppMessagePayload[] = [];
  let nextState: WhatsAppBotState = session.state;

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
          replies.push(buildWelcomeLanguagePayload(from));
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
        const text = normalizeIndicDigits(String(content || "")).toLowerCase().trim();

        // 1. Language Selection check (replying 1 to 11, language name, or quick-tap language button)
        if (text === "lang_other_help" && !session.language) {
          replies.push(MessageBuilder.text(
            from,
            "🌐 Please reply with a number *3 to 11* or type your language name (e.g. *Marathi*, *Gujarati*, *Tamil*, *Telugu*, *Kannada*, *Bengali*, *Malayalam*, *Punjabi*, *Odia*):"
          ));
          nextState = "ASK_PROP";
          break;
        }

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

        // 2. Resolve Property Type (supports English, Hinglish & common Indic-script keywords)
        let propType: "home" | "office" | "factory" | null = null;
        const looksHindiProp =
          text.includes("ghar") || text.includes("dukan") || text.includes("godam") || text.includes("karkhana") ||
          text.includes("घर") || text.includes("मकान") || text.includes("दुकान") || text.includes("गोदाम") || text.includes("फैक्ट्री");

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
          text.includes("घर") || text.includes("मकान") || text.includes("வீடு") || text.includes("ಮನೆ") || text.includes("বাড়ি") || text.includes("വീട്") || text.includes("ਘਰ") || text.includes("ଘର") ||
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
          text.includes("दुकान") || text.includes("ऑफिस") || text.includes("कंपनी") || text.includes("கடை") || text.includes("అంగడి") || text.includes("ಅಂಗಡಿ") || text.includes("দোকান") || text.includes("കട") || text.includes("ਦੁਕਾਨ") || text.includes("ଦୋକାନ") ||
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
          text.includes("गोदाम") || text.includes("फैक्ट्री") || text.includes("कारखाना") || text.includes("தொழிற்சாலை") || text.includes("గోదాము") || text.includes("ಗೋದಾಮು") || text.includes("গোদাম") || text.includes("ഗോഡൗൺ") || text.includes("ਫੈਕਟਰੀ") || text.includes("ଗୋଦାମ") ||
          (session.language ? text === "3" : false)
        ) {
          propType = "factory";
        }

        if (propType) {
          if (!session.language) {
            session.language = looksHindiProp ? "hi" : "en";
          }
          conv = getConversationalStrings(session.language);
          session.wizard_answers.property_type = propType;
          nextState = "ASK_INSTALL_TYPE";
          const propTitle = stripLeadingEmoji(propType === "home" ? conv.propHomeTitle : propType === "office" ? conv.propOfficeTitle : conv.propFactoryTitle);

          replies.push(buildInstallTypeList(
            from,
            conv,
            `${conv.askPropSaved.replace("{prop}", propTitle)}\n\n*${conv.installHeader}*\n${conv.installQuestion}`
          ));
        } else {
          // If input is a duplicate/stale greeting, silently drop so customer never receives duplicate welcome menus
          if (text.startsWith("hi") || text.startsWith("hello") || text.startsWith("welcome")) {
            console.log(`[BotEngine] Suppressing duplicate greeting in ASK_PROP for ${from}`);
            return;
          }

          if (!session.language) {
            replies.push(buildWelcomeLanguagePayload(from));
          } else {
            replies.push(MessageBuilder.buttons(
              from,
              `${conv.errUnrecognized.replace("{input}", text.slice(0, 30))}\n\n*${conv.propHeader}*\n${conv.propQuestion}`,
              [
                { id: "prop_home", title: conv.propHomeTitle.slice(0, 20) },
                { id: "prop_office", title: conv.propOfficeTitle.slice(0, 20) },
                { id: "prop_factory", title: conv.propFactoryTitle.slice(0, 20) }
              ]
            ));
          }
        }
        break;
      }

      case "ASK_INSTALL_TYPE": {
        const text = normalizeIndicDigits(String(content || "")).toLowerCase().trim();
        // Stale duplicate guard from previous step
        if (text.startsWith("prop_") || text.startsWith("hi") || text.startsWith("hello")) {
          console.log(`[BotEngine] Suppressing stale Step 1 replay in ASK_INSTALL_TYPE for ${from}`);
          return;
        }
        let choice: "new" | "hybrid" | "wireless" | "4g_solar" | "addon" | null = null;

        const isExplicitHybridPhrase =
          matchesKeywords(text, INSTALL_HYBRID_ASCII, INSTALL_HYBRID_INDIC) ||
          ((text === "both" || text.includes("dono")) && !text.includes("indoor") && !text.includes("outdoor")) ||
          ((text.includes("wired") || text.includes("dvr") || text.includes("nvr")) &&
            (text.includes("wireless") || text.includes("wifi") || text.includes("wi-fi") || text.includes("4g")));

        if (
          text.includes("ins_hybrid") ||
          isExplicitHybridPhrase ||
          text === "4"
        ) {
          choice = "hybrid";
        } else if (
          text.includes("ins_addon") || 
          text.includes("addon") || 
          text.includes("add on") || 
          text.includes("add to") || 
          text.includes("existing") || 
          text.includes("upgrade") || 
          text.includes("expansion") ||
          hasIndicOrPhrase(text, INSTALL_ADDON_INDIC) ||
          text === "5"
        ) {
          choice = "addon";
        } else if (
          text.includes("4g_solar") || 
          text.includes("4g") || 
          text.includes("solar") || 
          text.includes("sim") || 
          text.includes("standalone") ||
          hasIndicOrPhrase(text, INSTALL_4G_INDIC) ||
          text === "3"
        ) {
          choice = "4g_solar";
        } else if (
          text.includes("ins_wireless") || 
          text.includes("wireless") || 
          text.includes("wifi") || 
          text.includes("wi-fi") || 
          text.includes("smart") ||
          hasIndicOrPhrase(text, INSTALL_WIRELESS_INDIC) ||
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
          hasIndicOrPhrase(text, INSTALL_WIRED_INDIC) ||
          text === "1"
        ) {
          choice = "new";
        }

        if (choice === "addon") {
          session.wizard_answers.installation_type = "addon";
          nextState = "ASK_ADDON_COMPATIBILITY";
          replies.push(MessageBuilder.buttons(
            from,
            conv.addonCheckBody,
            [
              { id: "addon_upload_photo", title: conv.btnSendDvrPhoto },
              { id: "addon_know_specs", title: conv.btnKnowSpecs },
              { id: "addon_free_callback", title: conv.btnCallMe }
            ]
          ));
        } else if (choice === "4g_solar") {
          session.wizard_answers.installation_type = "new";
          session.wizard_answers.technology = "Wireless";
          session.wizard_answers.technology_preference = "Wireless";
          session.wizard_answers.is_hybrid = false;
          session.wizard_answers.is_4g = true;
          session.wizard_answers.has_4g_sim = true;
          session.wizard_answers.broadband_status = "independent_4g";
          session.wizard_answers.cabling_done = true;
          session.wizard_answers.installation_preference = "pro";
          session.wizard_answers.selected_wireless_variant = "wf_4g_solar";
          nextState = "ASK_WIRELESS_QTY";

          replies.push(buildQuantityButtonsMessage(
            from, "wfq",
            conv.wireless4gAsk,
            [
              { id: "wfq_1", title: conv.btn14g },
              { id: "wfq_2", title: conv.btn24g },
              { id: "wfq_4", title: conv.btn44g }
            ],
            conv.numberReplyHint
          ));
        } else if (choice === "wireless") {
          session.wizard_answers.installation_type = "new";
          session.wizard_answers.technology = "Wireless";
          session.wizard_answers.technology_preference = "Wireless";
          session.wizard_answers.is_hybrid = false;
          session.wizard_answers.cabling_done = true;
          nextState = "ASK_WIRELESS_VARIANT";

          replies.push(buildWirelessOptionsList(from, conv, conv.wirelessVariantPrompt, "standalone"));
        } else if (choice === "hybrid") {
          // Explicit Hybrid: Collect wired Outdoor + Indoor first, then guide straight into Wireless cameras
          session.wizard_answers.installation_type = "hybrid";
          session.wizard_answers.is_hybrid = true;
          session.wizard_answers.technology = "HD";
          session.wizard_answers.technology_preference = "HD";
          session.wizard_answers.hybrid_wired_technology = "HD";
          session.wizard_answers.technology_choice = "Hybrid";
          nextState = "ASK_CAMERA_OUTDOOR";

          replies.push(buildQuantityButtonsMessage(
            from, "out",
            `*${conv.outdoorHeader}*\n\n${conv.outdoorQuestion}`,
            [
              { id: "out_2", title: `2 ${conv.quickBtnBullets}` },
              { id: "out_4", title: `4 ${conv.quickBtnBullets}` },
              { id: "out_0", title: conv.quickBtnNone }
            ],
            conv.numberReplyHint
          ));
        } else if (choice === "new") {
          // New Wired: Matches website WizardClientV2.tsx (Card 1: Outdoor Bullets, Card 2: Indoor Domes, Card 3: Optional Wireless)
          session.wizard_answers.installation_type = "new";
          session.wizard_answers.is_hybrid = false;
          session.wizard_answers.technology = "HD";
          session.wizard_answers.technology_preference = "HD";
          nextState = "ASK_CAMERA_OUTDOOR";

          replies.push(buildQuantityButtonsMessage(
            from, "out",
            `*${conv.outdoorHeader}*\n\n${conv.outdoorQuestion}`,
            [
              { id: "out_2", title: `2 ${conv.quickBtnBullets}` },
              { id: "out_4", title: `4 ${conv.quickBtnBullets}` },
              { id: "out_0", title: conv.quickBtnNone }
            ],
            conv.numberReplyHint
          ));
        } else {
          replies.push(buildInstallTypeList(
            from,
            conv,
            `${conv.errUnrecognized.replace("{input}", text.slice(0, 30))}\n\n*${conv.installHeader}*\n${conv.installQuestion}`
          ));
        }
        break;
      }

      case "ASK_ADDON_COMPATIBILITY": {
        const text = String(content || "").toLowerCase().trim();
        if (text.includes("addon_upload_photo") || text.includes("photo") || text.includes("upload") || text.includes("pic") || text.includes("image") || text.includes("dvr") || text === "1") {
          replies.push(MessageBuilder.text(from, conv.addonPhotoReply));
          nextState = "PAUSED_FOR_AGENT";
        } else if (text.includes("addon_free_callback") || text.includes("callback") || text.includes("call") || text.includes("phone") || text.includes("talk") || text === "3") {
          replies.push(MessageBuilder.text(from, conv.addonCallbackReply));
          nextState = "PAUSED_FOR_AGENT";
        } else if (text.includes("addon_know_specs") || text.includes("specs") || text.includes("know") || text.includes("spec") || text === "2") {
          nextState = "ASK_CAMERA_COUNT";
          replies.push(MessageBuilder.buttons(
            from,
            conv.addonTechPrompt,
            [
              { id: "addon_tech_hd", title: conv.btnTechHd },
              { id: "addon_tech_ip", title: conv.btnTechIp }
            ]
          ));
        } else {
          replies.push(MessageBuilder.buttons(
            from,
            conv.addonCheckBody,
            [
              { id: "addon_upload_photo", title: conv.btnSendDvrPhoto },
              { id: "addon_know_specs", title: conv.btnKnowSpecs },
              { id: "addon_free_callback", title: conv.btnCallMe }
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
            `*${conv.outdoorHeader}*\n\n${conv.outdoorQuestion}`,
            [
              { id: "out_2", title: `2 ${conv.quickBtnBullets}` },
              { id: "out_4", title: `4 ${conv.quickBtnBullets}` },
              { id: "out_0", title: conv.quickBtnNone }
            ],
            conv.numberReplyHint
          ));
        } else if (text.includes("addon_tech_ip") || text.includes("ip") || text.includes("cat6") || text.includes("network") || text === "2") {
          session.wizard_answers.technology = "IP";
          nextState = "ASK_CAMERA_OUTDOOR";
          replies.push(buildQuantityButtonsMessage(
            from, "out",
            `*${conv.outdoorHeader}*\n\n${conv.outdoorQuestion}`,
            [
              { id: "out_2", title: `2 ${conv.quickBtnBullets}` },
              { id: "out_4", title: `4 ${conv.quickBtnBullets}` },
              { id: "out_0", title: conv.quickBtnNone }
            ],
            conv.numberReplyHint
          ));
        } else {
          replies.push(MessageBuilder.buttons(
            from,
            conv.addonTechPrompt,
            [
              { id: "addon_tech_hd", title: conv.btnTechHd },
              { id: "addon_tech_ip", title: conv.btnTechIp }
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
          replies.push(buildStorageList(
            from,
            conv,
            `✓ *${stripLeadingEmoji(conv.wfComboTitle)}*\n\n*${conv.storageHeader}*\n\n${conv.storageQuestion}`,
            true
          ));
        } else {
          let variant = "";
          if (text.includes("solar") || text.includes("4g") || text.includes("sim") || text === "5") variant = "wf_4g_solar";
          else if (text.includes("out_ptz") || (text.includes("outdoor") && text.includes("ptz")) || text === "4") variant = "wf_out_ptz";
          else if (text.includes("out_bullet") || (text.includes("outdoor") && text.includes("bullet")) || text === "3") variant = "wf_out_bullet";
          else if (text.includes("in_fixed") || (text.includes("indoor") && (text.includes("fixed") || text.includes("dome"))) || text === "2") variant = "wf_in_fixed";
          else if (text.includes("in_ptz") || text.includes("ptz") || text.includes("pan tilt") || text.includes("360") || text === "1") variant = "wf_in_ptz";

          if (!variant) {
            replies.push(buildWirelessOptionsList(from, conv, conv.wirelessVariantPrompt, "standalone"));
            break;
          }

          session.wizard_answers.selected_wireless_variant = variant;
          nextState = "ASK_WIRELESS_QTY";

          const vInfo = getWirelessVariantLabel(conv, variant);
          replies.push(buildQuantityButtonsMessage(
            from, "wfq",
            conv.wirelessQtyQuestion.replace("{item}", vInfo.single),
            [
              { id: "wfq_1", title: conv.btn1Cam },
              { id: "wfq_2", title: conv.btn2Cam },
              { id: "wfq_0", title: conv.quickBtnNone }
            ],
            conv.numberReplyHint
          ));
        }
        break;
      }

      case "ASK_CAMERA_OUTDOOR": {
        const text = normalizeIndicDigits(String(content || "")).toLowerCase().trim();
        // Stale duplicate guard from previous step (prevents re-sending Step 2 menu!)
        if (text.startsWith("ins_") || text.startsWith("prop_") || text.startsWith("hi")) {
          console.log(`[BotEngine] Suppressing stale Step 1 replay in ASK_CAMERA_OUTDOOR for ${from}`);
          return;
        }
        if (text === "out_page_1" || text.includes("0 to 7")) {
          replies.push(buildQuantityListMessage(
            from, "out", conv.outBulletSingle, conv.outBulletPlural, 1,
            `*${conv.outdoorHeader}*\n\n${conv.outdoorQuestion}`,
            undefined, conv
          ));
          break;
        }
        if (text === "out_page_2" || text === "out_more" || text.includes("8 to 15")) {
          replies.push(buildQuantityListMessage(
            from, "out", conv.outBulletSingle, conv.outBulletPlural, 2,
            conv.qtyMediumHeader.replace("{range}", "8–15").replace("{label}", conv.outBulletPlural),
            undefined, conv
          ));
          break;
        }
        if (text === "out_page_3" || text.includes("16 to 23")) {
          replies.push(buildQuantityListMessage(
            from, "out", conv.outBulletSingle, conv.outBulletPlural, 3,
            conv.qtyMediumHeader.replace("{range}", "16–23").replace("{label}", conv.outBulletPlural),
            undefined, conv
          ));
          break;
        }
        if (text === "out_page_4" || text.includes("24 to 32")) {
          replies.push(buildQuantityListMessage(
            from, "out", conv.outBulletSingle, conv.outBulletPlural, 4,
            conv.qtyMediumHeader.replace("{range}", "24–32").replace("{label}", conv.outBulletPlural),
            undefined, conv
          ));
          break;
        }
        if (text === "out_custom") {
          replies.push(MessageBuilder.text(from, conv.qtyDirectReplyBullet));
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
          } else if (matchesKeywords(text, ZERO_NONE_ASCII, ZERO_NONE_INDIC)) {
            outdoorCount = 0;
          }
        }

        if (isOutOfBounds) {
          replies.push(MessageBuilder.buttons(
            from,
            conv.errMax32.replace("{n}", String(requestedCount)),
            [
              { id: "out_16", title: conv.btn16Bullets },
              { id: "out_32", title: conv.btn32Bullets },
              { id: "addon_free_callback", title: conv.btnCallSpecialist }
            ]
          ));
          break;
        }

        if (outdoorCount === null || isNaN(outdoorCount)) {
          replies.push(buildQuantityButtonsMessage(
            from, "out",
            `${conv.errUnrecognized.replace("{input}", text.slice(0, 30))}\n\n*${conv.outdoorHeader}*\n\n${conv.outdoorQuestion}`,
            [
              { id: "out_2", title: `2 ${conv.quickBtnBullets}` },
              { id: "out_4", title: `4 ${conv.quickBtnBullets}` },
              { id: "out_0", title: conv.quickBtnNone }
            ],
            conv.numberReplyHint
          ));
          break;
        }

        session.wizard_answers.outdoor_camera_count = outdoorCount;
        nextState = "ASK_CAMERA_INDOOR";

        replies.push(buildQuantityButtonsMessage(
          from, "in",
          `${conv.askOutSaved.replace("{n}", String(outdoorCount))}\n\n*${conv.indoorHeader}*\n\n${conv.indoorQuestion}`,
          [
            { id: "in_2", title: `2 ${conv.quickBtnDomes}` },
            { id: "in_4", title: `4 ${conv.quickBtnDomes}` },
            { id: "in_0", title: conv.quickBtnNone }
          ],
          conv.numberReplyHint
        ));
        break;
      }

      case "ASK_CAMERA_INDOOR": {
        const text = normalizeIndicDigits(String(content || "")).toLowerCase().trim();
        // Stale duplicate guard from previous outdoor step
        if ((text.startsWith("out_") && !text.includes("in_")) || text.startsWith("ins_") || text.startsWith("prop_")) {
          console.log(`[BotEngine] Suppressing stale outdoor replay in ASK_CAMERA_INDOOR for ${from}`);
          return;
        }
        if (text === "in_page_1" || text.includes("0 to 7")) {
          replies.push(buildQuantityListMessage(
            from, "in", conv.inDomeSingle, conv.inDomePlural, 1,
            `*${conv.indoorHeader}*\n\n${conv.indoorQuestion}`,
            undefined, conv
          ));
          break;
        }
        if (text === "in_page_2" || text === "in_more" || text.includes("8 to 15")) {
          replies.push(buildQuantityListMessage(
            from, "in", conv.inDomeSingle, conv.inDomePlural, 2,
            conv.qtyMediumHeader.replace("{range}", "8–15").replace("{label}", conv.inDomePlural),
            undefined, conv
          ));
          break;
        }
        if (text === "in_page_3" || text.includes("16 to 23")) {
          replies.push(buildQuantityListMessage(
            from, "in", conv.inDomeSingle, conv.inDomePlural, 3,
            conv.qtyMediumHeader.replace("{range}", "16–23").replace("{label}", conv.inDomePlural),
            undefined, conv
          ));
          break;
        }
        if (text === "in_page_4" || text.includes("24 to 32")) {
          replies.push(buildQuantityListMessage(
            from, "in", conv.inDomeSingle, conv.inDomePlural, 4,
            conv.qtyMediumHeader.replace("{range}", "24–32").replace("{label}", conv.inDomePlural),
            undefined, conv
          ));
          break;
        }
        if (text === "in_custom") {
          replies.push(MessageBuilder.text(from, conv.qtyDirectReplyDome));
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
          } else if (matchesKeywords(text, ZERO_NONE_ASCII, ZERO_NONE_INDIC)) {
            indoorCount = 0;
          }
        }

        if (isOutOfBounds) {
          replies.push(MessageBuilder.buttons(
            from,
            conv.errMax32.replace("{n}", String(requestedCount)),
            [
              { id: "in_16", title: conv.btn16Domes },
              { id: "in_32", title: conv.btn32Domes },
              { id: "addon_free_callback", title: conv.btnCallSpecialist }
            ]
          ));
          break;
        }

        if (indoorCount === null || isNaN(indoorCount)) {
          const outCountPrev = session.wizard_answers.outdoor_camera_count || 0;
          replies.push(buildQuantityButtonsMessage(
            from, "in",
            `${conv.errUnrecognized.replace("{input}", text.slice(0, 30))}\n\n${conv.askOutSaved.replace("{n}", String(outCountPrev))}\n\n*${conv.indoorHeader}*\n\n${conv.indoorQuestion}`,
            [
              { id: "in_2", title: `2 ${conv.quickBtnDomes}` },
              { id: "in_4", title: `4 ${conv.quickBtnDomes}` },
              { id: "in_0", title: conv.quickBtnNone }
            ],
            conv.numberReplyHint
          ));
          break;
        }

        const outCount = session.wizard_answers.outdoor_camera_count || 0;
        if (outCount === 0 && indoorCount === 0) {
          replies.push(MessageBuilder.buttons(
            from,
            conv.errZeroCameras,
            [
              { id: "ins_wireless", title: conv.btnWirelessSetup },
              { id: "out_2", title: conv.btnAdd2Out },
              { id: "in_2", title: conv.btnAdd2In }
            ]
          ));
          break;
        }

        session.wizard_answers.indoor_camera_count = indoorCount;
        const totalWired = outCount + indoorCount;
        const existingWifi = session.wizard_answers.wifi_camera_count || 0;
        session.wizard_answers.camera_count = totalWired + existingWifi;
        syncWizardHybridState(session.wizard_answers);

        const isHybridIntent =
          session.wizard_answers.installation_type === "hybrid" ||
          session.wizard_answers.is_hybrid === true;

        nextState = "ASK_HYBRID_WIRELESS";
        if (existingWifi > 0) {
          replies.push(buildWirelessOptionsList(
            from,
            conv,
            conv.wirelessMorePrompt,
            "add_more"
          ));
        } else {
          const promptTpl = isHybridIntent ? conv.hybridRequiredPrompt : conv.hybridPrompt;
          replies.push(buildWirelessOptionsList(
            from,
            conv,
            promptTpl
              .replace("{total}", String(totalWired))
              .replace("{out}", String(outCount))
              .replace("{in}", String(indoorCount)),
            isHybridIntent ? "hybrid_required" : "hybrid_first"
          ));
        }
        break;
      }

      case "ASK_HYBRID_WIRELESS": {
        const text = normalizeIndicDigits(String(content || "")).toLowerCase().trim();
        // Stale duplicate guard from previous indoor step
        if (text.startsWith("in_") && !text.includes("wf_")) {
          console.log(`[BotEngine] Suppressing stale indoor replay in ASK_HYBRID_WIRELESS for ${from}`);
          return;
        }

        // 0. Check if user clicked "Change Qty"
        if (
          text.includes("wf_change_qty") ||
          text.includes("change_qty") ||
          matchesKeywords(text, CHANGE_QTY_ASCII, CHANGE_QTY_INDIC)
        ) {
          const outWired = session.wizard_answers.outdoor_camera_count || 0;
          const inWired = session.wizard_answers.indoor_camera_count || 0;
          const wifiCount = session.wizard_answers.wifi_camera_count || 0;

          if (outWired > 0 || inWired > 0) {
            nextState = "ASK_CAMERA_EDIT_CHOICE";
            const wifiLine = wifiCount > 0 ? `\n• ${conv.wfCamPlural}: *${wifiCount}*` : "";
            replies.push(MessageBuilder.buttons(
              from,
              conv.editChoiceBody
                .replace("{out}", String(outWired))
                .replace("{in}", String(inWired))
                .replace("{wifiLine}", wifiLine),
              [
                { id: "edit_qty_outdoor", title: conv.btnEditOutdoor },
                { id: "edit_qty_indoor", title: conv.btnEditIndoor },
                ...(wifiCount > 0
                  ? [{ id: "edit_qty_wireless", title: conv.btnEditWireless }]
                  : [{ id: "edit_qty_all", title: conv.btnEditAll }])
              ]
            ));
            break;
          } else {
            nextState = "ASK_WIRELESS_QTY";
            replies.push(buildQuantityButtonsMessage(
              from, "wfq",
              conv.wirelessQtyQuestion.replace("{item}", conv.wfCamSingle),
              [
                { id: "wfq_1", title: conv.btn1Cam },
                { id: "wfq_2", title: conv.btn2Cam },
                { id: "wfq_4", title: conv.btn4Cam }
              ],
              conv.numberReplyHint
            ));
            break;
          }
        }

        // 1. Check if user wants to add another wireless camera variant FIRST
        if (
          text.includes("wf_add_another") ||
          text.includes("add_another") ||
          text.includes("add another") ||
          text.includes("add more") ||
          text.includes("another wireless") ||
          text.includes("another camera") ||
          hasIndicOrPhrase(text, ADD_MORE_INDIC) ||
          text === "add"
        ) {
          nextState = "ASK_HYBRID_WIRELESS";
          replies.push(buildWirelessOptionsList(from, conv, conv.wirelessMorePrompt, "add_more"));
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
          const vInfo = getWirelessVariantLabel(conv, variant);

          replies.push(buildQuantityButtonsMessage(
            from, "wfq",
            conv.wirelessQtyQuestion.replace("{item}", vInfo.single),
            [
              { id: "wfq_1", title: conv.btn1Cam },
              { id: "wfq_2", title: conv.btn2Cam },
              { id: "wfq_0", title: conv.quickBtnNone }
            ],
            conv.numberReplyHint
          ));
          break;
        }

        // 3. Check if user wants to finalize/proceed to Timeline
        const isExplicitNone =
          text.includes("wf_none") ||
          matchesKeywords(text, ZERO_NONE_ASCII, ZERO_NONE_INDIC);
        const isDoneClick =
          text.includes("wf_done_proceed") ||
          matchesKeywords(text, DONE_PROCEED_ASCII, DONE_PROCEED_INDIC);

        if (isDoneClick || isExplicitNone) {
          const outCount = session.wizard_answers.outdoor_camera_count || 0;
          const inCount = session.wizard_answers.indoor_camera_count || 0;
          const inPtzCount = session.wizard_answers.wifi_indoor_ptz_count || 0;
          const inFixedCount = session.wizard_answers.wifi_indoor_fixed_count || 0;
          const outBulletCount = session.wizard_answers.wifi_outdoor_bullet_count || 0;
          const outPtzCount = session.wizard_answers.wifi_outdoor_ptz_count || 0;
          const sim4gCount = session.wizard_answers.wifi_4g_count || 0;
          const wCount = inPtzCount + inFixedCount + outBulletCount + outPtzCount + sim4gCount;

          const isHybridIntent =
            session.wizard_answers.installation_type === "hybrid" ||
            session.wizard_answers.is_hybrid === true;

          // If user chose Hybrid explicitly and tapped Done without adding any wireless camera, nudge cleanly
          if (wCount === 0 && isHybridIntent && !isExplicitNone) {
            replies.push(buildWirelessOptionsList(
              from,
              conv,
              conv.hybridNeedWifiWarn,
              "hybrid_required"
            ));
            break;
          }

          if (wCount === 0 && isExplicitNone && session.wizard_answers.installation_type === "hybrid") {
            session.wizard_answers.installation_type = "new";
            session.wizard_answers.is_hybrid = false;
          }

          session.wizard_answers.wifi_camera_count = wCount;
          session.wizard_answers.camera_count = Math.max(1, outCount + inCount + wCount);
          syncWizardHybridState(session.wizard_answers);

          const setupBadge = wCount > 0 && (outCount + inCount) > 0
            ? conv.wfSetupHybridTag
                .replace("{wired}", String(outCount + inCount))
                .replace("{wifi}", String(wCount))
            : wCount > 0
            ? conv.wfSetupWifiTag.replace("{wifi}", String(wCount))
            : `${conv.qdBreakdownWired.replace("{n}", String(outCount + inCount))} (${conv.qdBreakdownOut.replace("{n}", String(outCount))} + ${conv.qdBreakdownIn.replace("{n}", String(inCount))})`;

          // Step 2 Completion: Advance straight to Priority Dispatch Scheduler (Timeline)
          nextState = "ASK_TIMELINE";
          replies.push(buildTimelineList(from, conv, `✓ ${setupBadge}\n\n${conv.timelinePrompt}`));
          break;
        }

        // 4. Fallback: Re-send localized wireless options so user is never stuck
        const outWired = session.wizard_answers.outdoor_camera_count || 0;
        const inWired = session.wizard_answers.indoor_camera_count || 0;
        const existingWifiFallback = session.wizard_answers.wifi_camera_count || 0;
        const isHybridFallback =
          session.wizard_answers.installation_type === "hybrid" ||
          session.wizard_answers.is_hybrid === true;
        if (existingWifiFallback > 0) {
          replies.push(buildWirelessOptionsList(from, conv, conv.wirelessMorePrompt, "add_more"));
        } else {
          const promptTpl = isHybridFallback ? conv.hybridRequiredPrompt : conv.hybridPrompt;
          replies.push(buildWirelessOptionsList(
            from,
            conv,
            promptTpl
              .replace("{total}", String(outWired + inWired))
              .replace("{out}", String(outWired))
              .replace("{in}", String(inWired)),
            isHybridFallback ? "hybrid_required" : "hybrid_first"
          ));
        }
        break;
      }

      case "ASK_WIRELESS_QTY": {
        const currentVType = session.wizard_answers.selected_wireless_variant || "wf_in_ptz";
        const curVInfo = getWirelessVariantLabel(conv, currentVType);

        const text = normalizeIndicDigits(String(content || "")).toLowerCase().trim();
        if (text === "wfq_page_1" || text.includes("0 to 7")) {
          replies.push(buildQuantityListMessage(
            from, "wfq", curVInfo.single, curVInfo.plural, 1,
            conv.wirelessQtyQuestion.replace("{item}", curVInfo.single),
            undefined, conv
          ));
          break;
        }
        if (text === "wfq_page_2" || text === "wfq_more" || text.includes("8 to 15")) {
          replies.push(buildQuantityListMessage(
            from, "wfq", curVInfo.single, curVInfo.plural, 2,
            conv.qtyMediumHeader.replace("{range}", "8–15").replace("{label}", curVInfo.plural),
            undefined, conv
          ));
          break;
        }
        if (text === "wfq_page_3" || text.includes("16 to 23")) {
          replies.push(buildQuantityListMessage(
            from, "wfq", curVInfo.single, curVInfo.plural, 3,
            conv.qtyMediumHeader.replace("{range}", "16–23").replace("{label}", curVInfo.plural),
            undefined, conv
          ));
          break;
        }
        if (text === "wfq_page_4" || text.includes("24 to 32")) {
          replies.push(buildQuantityListMessage(
            from, "wfq", curVInfo.single, curVInfo.plural, 4,
            conv.qtyMediumHeader.replace("{range}", "24–32").replace("{label}", curVInfo.plural),
            undefined, conv
          ));
          break;
        }
        if (text === "wfq_custom") {
          replies.push(MessageBuilder.text(from, conv.qtyDirectReplyGeneric.replace("{item}", curVInfo.single)));
          break;
        }

        let wCount = 1;
        if (text.startsWith("wfq_") && !text.includes("page") && !text.includes("custom")) {
          wCount = parseInt(text.replace("wfq_", ""), 10);
        } else if (matchesKeywords(text, ZERO_NONE_ASCII, ZERO_NONE_INDIC)) {
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
        syncWizardHybridState(session.wizard_answers);

        const isPureWireless = (session.wizard_answers.technology === "Wireless" ||
                               session.wizard_answers.technology === "4G_Solar" ||
                               session.wizard_answers.installation_type === "wireless" ||
                               session.wizard_answers.installation_type === "solar_4g") &&
                               !session.wizard_answers.is_hybrid;

        // Build localized summary of configured wireless items
        const wifiItems: string[] = [];
        if (inPtz > 0) wifiItems.push(`• ${inPtz}x ${getWirelessVariantLabel(conv, "wf_in_ptz").single}`);
        if (inFixed > 0) wifiItems.push(`• ${inFixed}x ${getWirelessVariantLabel(conv, "wf_in_fixed").single}`);
        if (outBullet > 0) wifiItems.push(`• ${outBullet}x ${getWirelessVariantLabel(conv, "wf_out_bullet").single}`);
        if (outPtz > 0) wifiItems.push(`• ${outPtz}x ${getWirelessVariantLabel(conv, "wf_out_ptz").single}`);
        if (sim4g > 0) wifiItems.push(`• ${sim4g}x ${getWirelessVariantLabel(conv, "wf_4g_solar").single}`);

        nextState = "ASK_HYBRID_WIRELESS";
        const statusHeader = wCount > 0
          ? conv.wfStatusAdded.replace("{n}", String(wCount)).replace("{item}", curVInfo.single)
          : conv.wfStatusSkipped.replace("{item}", curVInfo.single);
        const wifiSummary = wifiItems.length > 0
          ? `\n\n${wifiItems.join("\n")}`
          : "";
        const summaryTag = isPureWireless
          ? conv.wfSetupWifiTag.replace("{wifi}", String(totalWireless))
          : conv.wfSetupHybridTag
              .replace("{wired}", String(outWired + inWired))
              .replace("{wifi}", String(totalWireless));
        const bodyText = conv.confirmSetupBody
          .replace("{status}", statusHeader)
          .replace("{items}", wifiSummary)
          .replace("{total}", String(grandTotal))
          .replace("{summary}", summaryTag);

        replies.push(MessageBuilder.buttons(
          from,
          bodyText,
          [
            { id: "wf_done_proceed", title: conv.quickBtnDoneProceed },
            { id: "wf_change_qty", title: conv.quickBtnChangeQty }
          ]
        ));
        break;
      }

      case "ASK_CAMERA_EDIT_CHOICE": {
        const text = normalizeIndicDigits(String(content || "")).toLowerCase().trim();
        if (text.includes("outdoor") || text.includes("bullet") || text.includes("out_") || text.includes("बाहर") || text === "1") {
          nextState = "ASK_CAMERA_OUTDOOR";
          const currentOut = session.wizard_answers?.outdoor_camera_count || 0;
          replies.push(buildQuantityButtonsMessage(
            from, "out",
            `*${conv.outdoorHeader}*\n${conv.askOutSaved.replace("{n}", String(currentOut))}\n\n${conv.outdoorQuestion}`,
            [
              { id: "out_2", title: `2 ${conv.quickBtnBullets}` },
              { id: "out_4", title: `4 ${conv.quickBtnBullets}` },
              { id: "out_0", title: conv.quickBtnNone }
            ],
            conv.numberReplyHint
          ));
        } else if (text.includes("indoor") || text.includes("dome") || text.includes("in_") || text === "2") {
          nextState = "ASK_CAMERA_INDOOR";
          const currentIn = session.wizard_answers?.indoor_camera_count || 0;
          replies.push(buildQuantityButtonsMessage(
            from, "in",
            `*${conv.indoorHeader}* (${currentIn} ${conv.inDomePlural})\n\n${conv.indoorQuestion}`,
            [
              { id: "in_2", title: `2 ${conv.quickBtnDomes}` },
              { id: "in_4", title: `4 ${conv.quickBtnDomes}` },
              { id: "in_0", title: conv.quickBtnNone }
            ],
            conv.numberReplyHint
          ));
        } else if (text.includes("wireless") || text.includes("wifi") || text.includes("wfq_") || text === "3") {
          nextState = "ASK_HYBRID_WIRELESS";
          const existingWifiEdit = session.wizard_answers?.wifi_camera_count || 0;
          const isHybridEdit =
            session.wizard_answers?.installation_type === "hybrid" ||
            session.wizard_answers?.is_hybrid === true;
          replies.push(buildWirelessOptionsList(
            from,
            conv,
            existingWifiEdit > 0 ? conv.wirelessMorePrompt : (isHybridEdit ? conv.hybridRequiredPrompt : conv.wirelessVariantPrompt),
            existingWifiEdit > 0 ? "add_more" : (isHybridEdit ? "hybrid_required" : "hybrid_first")
          ));
        } else {
          nextState = "ASK_CAMERA_OUTDOOR";
          replies.push(buildQuantityButtonsMessage(
            from, "out",
            `*${conv.outdoorHeader}*\n\n${conv.outdoorQuestion}`,
            [
              { id: "out_2", title: `2 ${conv.quickBtnBullets}` },
              { id: "out_4", title: `4 ${conv.quickBtnBullets}` },
              { id: "out_0", title: conv.quickBtnNone }
            ],
            conv.numberReplyHint
          ));
        }
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
        replies.push(buildStorageList(from, conv, `*${conv.storageHeader}*\n\n${conv.storageQuestion}`));
        break;
      }

      case "ASK_TIMELINE": {
        const text = normalizeIndicDigits(String(content || "")).toLowerCase().trim();
        // Stale duplicate guard from previous camera steps
        if (text.startsWith("wf_") || text.startsWith("in_") || text.startsWith("out_") || text.startsWith("ins_")) {
          console.log(`[BotEngine] Suppressing stale camera replay in ASK_TIMELINE for ${from}`);
          return;
        }
        let timeChoice = "";
        let localizedTime = "";
        let rawCode = "";

        if (text.includes("time_asap") || text.includes("asap") || text.includes("urgent") || text.includes("immediate") || text.includes("today") || text.includes("tomorrow") || text.includes("1-2") || hasIndicOrPhrase(text, TIMELINE_ASAP_INDIC) || text === "1") {
          timeChoice = "Immediately (1-2 Days)";
          localizedTime = stripLeadingEmoji(conv.timeAsapTitle);
          rawCode = "asap";
        } else if (text.includes("time_week") || text.includes("week") || text.includes("7 days") || hasIndicOrPhrase(text, TIMELINE_WEEK_INDIC) || text === "2") {
          timeChoice = "Within a Week";
          localizedTime = stripLeadingEmoji(conv.timeWeekTitle);
          rawCode = "week";
        } else if (text.includes("time_month") || text.includes("month") || text.includes("construction") || hasIndicOrPhrase(text, TIMELINE_MONTH_INDIC) || text === "3") {
          timeChoice = "This Month";
          localizedTime = stripLeadingEmoji(conv.timeMonthTitle);
          rawCode = "month";
        } else if (text.includes("time_research") || text.includes("plan") || text.includes("research") || text.includes("compare") || hasIndicOrPhrase(text, TIMELINE_RESEARCH_INDIC) || text === "4") {
          timeChoice = "Just Planning";
          localizedTime = stripLeadingEmoji(conv.timeResearchTitle);
          rawCode = "research";
        }

        if (!rawCode) {
          replies.push(buildTimelineList(from, conv, conv.timelinePrompt));
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
        replies.push(buildStorageList(
          from,
          conv,
          `${conv.askTimeSaved.replace("{time}", localizedTime)}\n\n*${conv.storageHeader}*\n\n${conv.storageQuestion}`
        ));
        break;
      }

      case "ASK_STORAGE_DAYS": {
        const text = normalizeIndicDigits(String(content || "")).toLowerCase().trim();
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
          replies.push(buildStorageList(
            from,
            conv,
            `${conv.errUnrecognized.replace("{input}", text.slice(0, 30))}\n\n*${conv.storageHeader}*\n\n${conv.storageQuestion}`
          ));
          break;
        }

        session.wizard_answers.recording_days = days;

        if (days === 0) {
          session.wizard_answers.recording_mode = "none";
          nextState = "ASK_MOUNTING_CONDITIONS";
          replies.push(buildMountingButtons(
            from,
            conv,
            `✓ ${conv.storage0Title}\n\n${conv.mountPrompt}`
          ));
        } else {
          nextState = "ASK_RECORDING_MODE";
          replies.push(MessageBuilder.buttons(
            from,
            conv.recModePrompt.replace("{days}", String(days)),
            [
              { id: "mode_continuous", title: conv.btnMode247 },
              { id: "mode_motion", title: conv.btnModeMotion }
            ]
          ));
        }
        break;
      }

      case "ASK_RECORDING_MODE": {
        const text = normalizeIndicDigits(String(content || "")).toLowerCase().trim();
        // Stale duplicate guard from previous storage step
        if (text.startsWith("storage_") || text.startsWith("time_")) {
          console.log(`[BotEngine] Suppressing stale storage replay in ASK_RECORDING_MODE for ${from}`);
          return;
        }
        let mode: "motion" | "continuous" = "continuous";
        if (text.includes("mode_motion") || text.includes("motion") || text.includes("smart") || text.includes("save") || hasIndicOrPhrase(text, MODE_MOTION_INDIC) || text === "2") {
          mode = "motion";
        } else {
          mode = "continuous";
        }

        session.wizard_answers.recording_mode = mode;
        nextState = "ASK_MOUNTING_CONDITIONS";
        const recModeName = mode === "motion" ? stripLeadingEmoji(conv.btnModeMotion) : stripLeadingEmoji(conv.btnMode247);

        replies.push(buildMountingButtons(
          from,
          conv,
          `${conv.askModeSaved.replace("{mode}", recModeName)}\n\n${conv.mountPrompt}`
        ));
        break;
      }

      case "ASK_MOUNTING_CONDITIONS": {
        const text = normalizeIndicDigits(String(content || "")).toLowerCase().trim();
        // Stale duplicate guard from previous recording mode step
        if (text.startsWith("mode_") || text.startsWith("storage_")) {
          console.log(`[BotEngine] Suppressing stale mode replay in ASK_MOUNTING_CONDITIONS for ${from}`);
          return;
        }
        let height: "standard" | "high" | "very_high" = "standard";
        if (text.includes("very_high") || text.includes("15+") || text.includes("tall") || text === "3") {
          height = "very_high";
        } else if (text.includes("mount_high") || text.includes("10-15") || text.includes("12") || text.includes("high") || hasIndicOrPhrase(text, HEIGHT_HIGH_INDIC) || text === "2") {
          height = "high";
        } else {
          height = "standard";
        }

        session.wizard_answers.ceiling_height = height;
        nextState = "ASK_SURFACE_TYPE";
        const heightName = height === "very_high" ? conv.btnMountVeryHigh : height === "high" ? conv.btnMountHigh : conv.btnMountStd;

        replies.push(MessageBuilder.buttons(
          from,
          `${conv.askHeightSaved.replace("{height}", heightName)}\n\n${conv.surfacePrompt}`,
          [
            { id: "surf_brick", title: conv.btnSurfBrick },
            { id: "surf_ceiling", title: conv.btnSurfCeiling }
          ]
        ));
        break;
      }

      case "ASK_SURFACE_TYPE": {
        const text = normalizeIndicDigits(String(content || "")).toLowerCase().trim();
        // Stale duplicate guard from previous mounting step
        if (text.startsWith("mount_") || text.startsWith("mode_")) {
          console.log(`[BotEngine] Suppressing stale mount replay in ASK_SURFACE_TYPE for ${from}`);
          return;
        }
        let surface: string[] = ["brick"];
        if (text.includes("ceiling") || text.includes("false") || text.includes("pop") || text.includes("gypsum") || hasIndicOrPhrase(text, SURFACE_CEILING_INDIC) || text === "2") {
          surface = ["false_ceiling"];
        } else {
          surface = ["brick"];
        }

        session.wizard_answers.surface_types = surface;
        nextState = "ASK_CABLING_OR_POWER";

        const isWireless = session.wizard_answers.technology === "Wireless" ||
                           session.wizard_answers.technology_preference === "Wireless";

        if (isWireless) {
          replies.push(buildPowerButtons(from, conv, conv.powerPrompt));
        } else {
          const wiredCams = Math.max(1, (session.wizard_answers.outdoor_camera_count || 0) + (session.wizard_answers.indoor_camera_count || 0));
          const freeAllowance = wiredCams * 15;
          replies.push(MessageBuilder.buttons(
            from,
            conv.cablingPrompt
              .replace("{free}", String(freeAllowance))
              .replace("{cams}", String(wiredCams)),
            [
              { id: "cab_new", title: conv.btnCabNew },
              { id: "cab_prewired", title: conv.btnCabPrewired },
              { id: "cab_custom", title: conv.btnCabCustom }
            ]
          ));
        }
        break;
      }

      case "ASK_CUSTOM_CABLE_METERS": {
        const text = normalizeIndicDigits(String(content || "")).toLowerCase().trim();
        let customMeters = 60;
        const match = text.match(/\d+/);
        if (match) {
          customMeters = parseInt(match[0], 10);
        }
        const wiredOnlyForCustom = (session.wizard_answers.outdoor_camera_count || 0) + (session.wizard_answers.indoor_camera_count || 0);
        const effectiveWiredCustom = wiredOnlyForCustom > 0 ? wiredOnlyForCustom : (session.wizard_answers.camera_count || 4);
        session.wizard_answers.cabling_status = "needed";
        session.wizard_answers.cabling_done = false;
        session.wizard_answers.total_cable_length_meters = customMeters;
        session.wizard_answers.cable_length_meters = Math.ceil(customMeters / effectiveWiredCustom);

        const isHybridWithWifi = (session.wizard_answers.wifi_camera_count || 0) > 0 && 
                                 session.wizard_answers.technology !== "Wireless" &&
                                 session.wizard_answers.technology_preference !== "Wireless";

        if (isHybridWithWifi) {
          nextState = "ASK_HYBRID_POWER";
          const wifiCount = session.wizard_answers.wifi_camera_count || 1;
          replies.push(buildPowerButtons(
            from,
            conv,
            `${conv.askCableSaved.replace("{meters}", String(customMeters))}\n\n${conv.hybridPowerPrompt.replace("{wifi}", String(wifiCount))}`
          ));
        } else {
          nextState = "ASK_INTERNET";
          replies.push(buildInternetButtons(
            from,
            conv,
            `${conv.askCableSaved.replace("{meters}", String(customMeters))}\n\n${conv.internetPrompt}`
          ));
        }
        break;
      }

      case "ASK_CABLING_OR_POWER": {
        const text = normalizeIndicDigits(String(content || "")).toLowerCase().trim();
        // Stale duplicate guard from previous surface step
        if (text.startsWith("surf_") || text.startsWith("mount_")) {
          console.log(`[BotEngine] Suppressing stale surface replay in ASK_CABLING_OR_POWER for ${from}`);
          return;
        }
        if (text.includes("cab_custom") || text.includes("custom") || text.includes("meters") || hasIndicOrPhrase(text, CABLING_CUSTOM_INDIC)) {
          nextState = "ASK_CUSTOM_CABLE_METERS";
          replies.push(MessageBuilder.text(from, conv.customCablePrompt));
          break;
        }

        let cablingChoice = "new";
        if (text.includes("cab_prewired") || text.includes("prewired") || text.includes("done") || text.includes("already") || text.includes("fitting only") || hasIndicOrPhrase(text, CABLING_PREWIRED_INDIC) || text === "2") {
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
          const wiredOnlyForCable = (session.wizard_answers.outdoor_camera_count || 0) + (session.wizard_answers.indoor_camera_count || 0);
          const effectiveWiredForCable = wiredOnlyForCable > 0 ? wiredOnlyForCable : (session.wizard_answers.camera_count || 4);
          session.wizard_answers.cabling_status = "needed";
          session.wizard_answers.cabling_done = false;
          session.wizard_answers.total_cable_length_meters = effectiveWiredForCable * 15;
          cablingChoice = "new";
        }

        const isHybridWithWifi = (session.wizard_answers.wifi_camera_count || 0) > 0 &&
                                 session.wizard_answers.technology !== "Wireless" &&
                                 session.wizard_answers.technology_preference !== "Wireless";

        // IF HYBRID SETUP WITH WI-FI CAMERAS: ASK HYBRID POWER NEXT!
        if (isHybridWithWifi && (cablingChoice === "new" || cablingChoice === "prewired")) {
          nextState = "ASK_HYBRID_POWER";
          const wifiCount = session.wizard_answers.wifi_camera_count || 1;
          const cabLabel = cablingChoice === "prewired" ? stripLeadingEmoji(conv.btnCabPrewired) : stripLeadingEmoji(conv.btnCabNew);
          replies.push(buildPowerButtons(
            from,
            conv,
            `✓ ${cabLabel}\n\n${conv.hybridPowerPrompt.replace("{wifi}", String(wifiCount))}`
          ));
          break;
        }

        // OTHERWISE PROCEED STRAIGHT TO STEP 5: INTERNET!
        nextState = "ASK_INTERNET";
        const hasWireless = session.wizard_answers.technology === "Wireless" ||
                            session.wizard_answers.technology_preference === "Wireless" ||
                            (session.wizard_answers.wifi_camera_count || 0) > 0;

        if (hasWireless) {
          replies.push(buildWirelessInternetList(from, conv, conv.askNetWireless));
        } else {
          replies.push(buildInternetButtons(from, conv, conv.internetPrompt));
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
        replies.push(buildWirelessInternetList(
          from,
          conv,
          `${conv.askPowerSaved}\n\n${conv.askNetWireless}`
        ));
        break;
      }

      case "ASK_INTERNET": {
        const text = normalizeIndicDigits(String(content || "")).toLowerCase().trim();
        // Stale duplicate guard from previous cable/power step
        if (text.startsWith("cab_") || text.startsWith("pwr_") || text.startsWith("surf_")) {
          console.log(`[BotEngine] Suppressing stale cable replay in ASK_INTERNET for ${from}`);
          return;
        }
        let netChoice = stripLeadingEmoji(conv.btnNetWifi);
        if (text.includes("extender") || hasIndicOrPhrase(text, NET_EXTENDER_INDIC)) {
          session.wizard_answers.broadband_status = "wifi_extender";
          session.wizard_answers.wants_remote_viewing = true;
          netChoice = stripLeadingEmoji(conv.netExtTitle);
        } else if (text.includes("independent") || text.includes("farm") || text.includes("distant") || hasIndicOrPhrase(text, NET_4G_FAR_INDIC)) {
          session.wizard_answers.broadband_status = "independent_4g";
          session.wizard_answers.wants_remote_viewing = true;
          netChoice = stripLeadingEmoji(conv.net4gFarTitle);
        } else if (text.includes("4g") || text.includes("sim") || text.includes("router")) {
          session.wizard_answers.broadband_status = "sim_router";
          session.wizard_answers.wants_remote_viewing = true;
          netChoice = stripLeadingEmoji(conv.btnNet4g);
        } else if (text.includes("offline") || text.includes("tv") || hasIndicOrPhrase(text, NET_OFFLINE_INDIC)) {
          session.wizard_answers.broadband_status = "no";
          session.wizard_answers.wants_remote_viewing = false;
          netChoice = stripLeadingEmoji(conv.btnNetOffline);
        } else {
          session.wizard_answers.broadband_status = "yes";
          session.wizard_answers.wants_remote_viewing = true;
          netChoice = stripLeadingEmoji(conv.btnNetWifi);
        }

        nextState = "ASK_PINCODE";
        replies.push(MessageBuilder.text(
          from,
          `${conv.askNetSaved.replace("{net}", netChoice)}\n\n*${conv.pincodeHeader}*\n\n${conv.pincodeQuestion}`
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
          const text = normalizeIndicDigits(content.trim());
          const pinMatch = text.match(/\b\d{6}\b/);
          if (pinMatch) {
            pincode = pinMatch[0];
            session.wizard_answers.lead_pincode = pincode;

            const remaining = text.replace(pinMatch[0], "").replace(/[^\p{L}\p{M}\s]/gu, " ").trim();
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
              conv.calculatingQuote.replace("{name}", autoDetectedName).replace("{pin}", pincode)
            ));
          } else {
            nextState = "ASK_NAME";
            const knownName = session.customer_name && session.customer_name !== "WhatsApp Customer" && !/^\+?\d+$/.test(session.customer_name)
              ? session.customer_name
              : "";

            const namePrompt = `${conv.askPinSaved.replace("{pin}", pincode)}\n\n*${conv.nameHeader}*\n\n${conv.nameQuestion}` +
              (knownName ? conv.nameHintKnown.replace("{name}", knownName) : "");

            replies.push(MessageBuilder.text(from, namePrompt));
          }
        } else {
          const rawInput = typeof content === "string" ? normalizeIndicDigits(content.trim()) : "";
          const mobMatch = rawInput.match(/\b[6-9]\d{9}\b/);
          const digitMatch = rawInput.match(/\b\d+\b/);

          if (mobMatch) {
            replies.push(MessageBuilder.text(from, conv.pincodePhoneWarn.replace("{num}", mobMatch[0])));
          } else if (digitMatch && digitMatch[0].length !== 6) {
            replies.push(MessageBuilder.text(from, conv.pincodeDigitWarn.replace("{num}", digitMatch[0])));
          } else if (rawInput.length > 0) {
            replies.push(MessageBuilder.text(from, conv.pincodeTextWarn.replace("{place}", rawInput.slice(0, 40))));
          } else {
            replies.push(MessageBuilder.text(from, `*${conv.pincodeHeader}*\n\n${conv.pincodeQuestion}`));
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

        if (
          matchesKeywords(lower, ["yes", "1", "y", "same", "ok", "use", "confirm", "haan", "ha", "ji", "sahi"], DONE_PROCEED_INDIC)
        ) {
          if (session.customer_name && session.customer_name !== "WhatsApp Customer" && !/^\+?\d+$/.test(session.customer_name)) {
            finalName = session.customer_name;
          }
        }

        const nameStopWords = [
          "price", "rate", "cost", "call", "phone", "karo", "discount", "offer", "cctv",
          "camera", "wifi", "warranty", "help", "bhai", "sir", "ji", "hello", "hi",
          "testing", "photo", "image", "quote", "quotation", "kya", "hai", "mujhe",
          "chahiye", "nahi", "batana", "no", "yes", "ok", "pincode", "details", "bolo",
          ...INDIC_NAME_STOPWORDS
        ];
        const isOffTopicInName = nameStopWords.some(sw => lower.includes(sw));

        // Accept English & all Indic script customer names
        if (!finalName && !isOffTopicInName) {
          const cleaned = text.replace(/[^\p{L}\p{M}\s\.]/gu, "").trim();
          const words = cleaned.split(/\s+/).filter(w => w.length > 0);
          if (words.length >= 1 && cleaned.length >= 2 && words.length <= 4) {
            finalName = words.map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
          }
        }

        if (!finalName && (lower.includes("skip") || lower.includes("no name") || lower.includes("later") || matchesKeywords(lower, ZERO_NONE_ASCII, ZERO_NONE_INDIC))) {
          finalName = (session.customer_name && session.customer_name !== "WhatsApp Customer")
            ? session.customer_name
            : conv.valuedCustomer;
        }

        if (!finalName) {
          const knownName = session.customer_name && session.customer_name !== "WhatsApp Customer" && !/^\+?\d+$/.test(session.customer_name)
            ? session.customer_name
            : "";
          replies.push(MessageBuilder.text(
            from,
            conv.nameInvalidWarn + (knownName ? conv.nameHintKnown.replace("{name}", knownName) : "")
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
          conv.calculatingQuote.replace("{name}", finalName).replace("{pin}", pin)
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
            session.wizard_answers.hybrid_wired_technology = "IP";
            syncWizardHybridState(session.wizard_answers);
            await sessionRef.update({
              "wizard_answers.technology": "IP",
              "wizard_answers.technology_preference": "IP",
              "wizard_answers.hybrid_wired_technology": "IP",
              "wizard_answers.is_hybrid": Boolean(session.wizard_answers.is_hybrid),
              "wizard_answers.technology_choice": session.wizard_answers.technology_choice || "IP",
              ...(session.wizard_answers.mixed_camera_requirements ? { "wizard_answers.mixed_camera_requirements": session.wizard_answers.mixed_camera_requirements } : {})
            });
            await generateAndSendPriceRanges(from, session);
            return;
          } else if (content === "toggle_tech_hd" || content === "view_value_hd") {
            session.wizard_answers.technology = "HD";
            session.wizard_answers.technology_preference = "HD";
            session.wizard_answers.hybrid_wired_technology = "HD";
            syncWizardHybridState(session.wizard_answers);
            await sessionRef.update({
              "wizard_answers.technology": "HD",
              "wizard_answers.technology_preference": "HD",
              "wizard_answers.hybrid_wired_technology": "HD",
              "wizard_answers.is_hybrid": Boolean(session.wizard_answers.is_hybrid),
              "wizard_answers.technology_choice": session.wizard_answers.technology_choice || "HD",
              ...(session.wizard_answers.mixed_camera_requirements ? { "wizard_answers.mixed_camera_requirements": session.wizard_answers.mixed_camera_requirements } : {})
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
            replies.push(MessageBuilder.text(from, conv.uploadQuoteReply));
          } else if (content === "open_web_studio") {
            const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cctvquotation.com";
            const langSuffix = session.language ? `?lang=${session.language}` : "";
            replies.push(MessageBuilder.text(
              from,
              conv.openStudioReply.replace("{url}", `${baseUrl}/quote/${leadId}${langSuffix}`)
            ));
          }
        }
        break;

      default:
        break;
    }
  } catch (error) {
    console.error("🔥 Error in Bot State Machine:", error);
    replies.push(MessageBuilder.text(from, conv.errGeneric));
    nextState = "IDLE";
  }

  // Persist State & Real-Time Sync to Leads Document
  session.state = nextState;
  session.last_message_at = new Date();
  await sessionRef.set(session);

  if (leadId) {
    await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
      wizard_answers: session.wizard_answers,
      ...(session.wizard_answers?.technology_choice ? { technology_choice: session.wizard_answers.technology_choice } : {}),
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
  const whatsappPhoneId = cleanPhoneEnvVar(process.env.WHATSAPP_PHONE_ID || process.env.WA_PHONE_NUMBER_ID);
  const whatsappToken = cleanEnvVar(process.env.WHATSAPP_TOKEN || process.env.WA_ACCESS_TOKEN);
  const msg91AuthKey = cleanEnvVar(process.env.MSG91_AUTH_KEY);
  const msg91FromNumber = cleanPhoneEnvVar(process.env.MSG91_WHATSAPP_NUMBER);
  const providerPref = cleanEnvVar(process.env.WHATSAPP_PROVIDER).toLowerCase();

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
