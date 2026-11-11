/**
 * @file lib/whatsapp/quote-dispatch.ts
 * @description Server-authoritative quotation generation, price range summary, and checkout dispatch for WhatsApp.
 */

import { adminDb } from "../firebase-admin";
import { COLLECTIONS, SUBCOLLECTIONS } from "../constants";
import { cleanEnvVar, cleanPhoneEnvVar } from "../env-utils";
import { WhatsAppSession } from "../../types/whatsapp";
import { ConfiguratorSelection, PricingResult } from "../../types";
import { generateAllCatalogVariations, BrandPriceSummary } from "../quotation/variant-generator";
import { buildMixedCameraRequirements } from "../camera-requirements";
import { MessageBuilder } from "./message-builder";
import { Msg91WhatsAppProvider } from "./msg91-provider";
import { getConversationalStrings, ConversationalStrings } from "./conversational-i18n";

export function resolveDispatchTech(rawSelection: any): {
  isPureWireless: boolean;
  isHybrid: boolean;
  tech: "Wireless" | "IP" | "HD";
  hydratedSelection: ConfiguratorSelection;
} {
  const selection = { ...(rawSelection || {}) } as any;
  const rawTechUpper = String(selection.technology || "").toUpperCase();
  const isPureWireless =
    (rawTechUpper === "WIRELESS" ||
      rawTechUpper === "4G_SOLAR" ||
      rawTechUpper === "WIFI" ||
      selection.installation_type === "wireless" ||
      selection.installation_type === "solar_4g") &&
    !selection.is_hybrid;

  const wifiCount = Number(selection.wifi_camera_count) || 0;
  const wiredCount = isPureWireless
    ? 0
    : (Number(selection.outdoor_camera_count) || 0) + (Number(selection.indoor_camera_count) || 0);
  const existingMixed: any[] = Array.isArray(selection.mixed_camera_requirements)
    ? selection.mixed_camera_requirements
    : [];
  const hasMixedHybrid =
    existingMixed.some((m) => String(m?.technology || "").toLowerCase() === "wireless") &&
    existingMixed.some((m) => m?.technology && String(m.technology).toLowerCase() !== "wireless");

  const isHybrid =
    !isPureWireless &&
    ((wifiCount > 0 && wiredCount > 0) ||
      Boolean(selection.is_hybrid) ||
      hasMixedHybrid ||
      rawTechUpper === "HYBRID" ||
      selection.installation_type === "hybrid");

  const hybridWiredPref = String(selection.hybrid_wired_technology || "").toUpperCase();
  const wiredTech: "HD" | "IP" =
    rawTechUpper === "IP" || (isHybrid && hybridWiredPref === "IP") ? "IP" : "HD";
  const tech: "Wireless" | "IP" | "HD" = isPureWireless ? "Wireless" : wiredTech;

  const mixedReqs =
    existingMixed.length > 0
      ? existingMixed.map((m) => {
          const isWItem =
            String(m?.technology || "").toLowerCase() === "wireless" ||
            String(m?.type || "").toLowerCase().includes("wi-fi") ||
            String(m?.type || "").toLowerCase().includes("wifi") ||
            String(m?.type || "").toLowerCase().includes("4g");
          return {
            ...m,
            technology: isWItem ? "Wireless" : isPureWireless ? "Wireless" : wiredTech,
          };
        })
      : isHybrid || isPureWireless
      ? buildMixedCameraRequirements({
          ...selection,
          technology_preference: tech,
        })
      : undefined;

  const hydratedSelection: ConfiguratorSelection = {
    ...selection,
    technology: tech as any,
    is_hybrid: isHybrid,
    hybrid_wired_technology: wiredTech,
    ...(mixedReqs ? { mixed_camera_requirements: mixedReqs } : {}),
  };

  return { isPureWireless, isHybrid, tech, hydratedSelection };
}

export async function generateAndSendPriceRanges(phone: string, session: WhatsAppSession) {
  const conv = getConversationalStrings(session.language);
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

    const rawSelection = (session.wizard_answers || {}) as ConfiguratorSelection;
    const cablingDone = session.wizard_answers?.cabling_done === true || session.wizard_answers?.cabling_status === "done";
    const totalCams = rawSelection.camera_count || 4;
    
    // Explicit technology resolution (supports Pure Wireless, HD, IP, and Hybrid HD/IP backbones)
    const { isHybrid, tech, hydratedSelection: selection } = resolveDispatchTech(rawSelection);
    const storageDays = selection.recording_days !== undefined ? selection.recording_days : 7;

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
      await sendMsg(MessageBuilder.text(phone, conv.qdNoConfig));
      return;
    }

    // Also calculate alternative wired technology (IP if currently HD, HD if currently IP)
    let proIpLowestPrice: number | null = null;
    let valueHdLowestPrice: number | null = null;

    if (tech === "HD") {
      try {
        const ipCatalogResult = generateAllCatalogVariations({
          selection: {
            ...selection,
            technology: "IP",
            hybrid_wired_technology: "IP",
          },
          products,
          addons,
          settings,
          cablingDone,
          promoterDiscount,
        });
        if (ipCatalogResult.lowestOverallQuote) {
          proIpLowestPrice = ipCatalogResult.lowestOverallQuote.total_payable;
        }
      } catch (err) {
        console.warn("Could not compute IP alternative pricing:", err);
      }
    } else if (tech === "IP") {
      try {
        const hdCatalogResult = generateAllCatalogVariations({
          selection: {
            ...selection,
            technology: "HD",
            hybrid_wired_technology: "HD",
          },
          products,
          addons,
          settings,
          cablingDone,
          promoterDiscount,
        });
        if (hdCatalogResult.lowestOverallQuote) {
          valueHdLowestPrice = hdCatalogResult.lowestOverallQuote.total_payable;
        }
      } catch (err) {
        console.warn("Could not compute HD alternative pricing:", err);
      }
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

    if (session.lead_id) {
      try {
        await adminDb.collection(COLLECTIONS.LEADS).doc(session.lead_id).update({
          technology_choice: isHybrid ? "Hybrid" : tech,
          wizard_answers: {
            ...(session.wizard_answers || {}),
            technology: tech,
            technology_preference: tech,
            is_hybrid: isHybrid,
            hybrid_wired_technology: tech === "IP" ? "IP" : "HD",
            technology_choice: isHybrid ? "Hybrid" : tech,
            ...(selection.mixed_camera_requirements ? { mixed_camera_requirements: selection.mixed_camera_requirements } : {}),
          },
          updated_at: new Date(),
        });
      } catch (err) {
        console.warn("Could not sync Hybrid/Tech state to Lead:", err);
      }
    }

    // 1. Text Summary Card: All-Inclusive Brand Price Range
    const customerDisplayName = (session.customer_name && session.customer_name !== "WhatsApp Customer")
      ? ` — ${session.customer_name}`
      : "";
    let summaryText = `${conv.qdSummaryTitle.replace("{namePart}", customerDisplayName)}\n`;
    summaryText += `━━━━━━━━━━━━━━━━━━━━━\n`;
    summaryText += `${conv.qdLabelSetup.replace("{total}", String(totalCams)).replace("{breakdown}", formatCameraBreakdown(selection, conv))}\n`;
    const techDisplay = isHybrid
      ? (tech === "IP" ? conv.qdSetupTechHybridIp : conv.qdSetupTechHybridHd)
      : (tech === "IP" ? conv.setupDigitalIp : tech === "HD" ? conv.setupAnalogHd : conv.qdSetupTechWireless);
    summaryText += `${conv.qdLabelTech.replace("{tech}", techDisplay)}\n`;
    const storageText = storageDays === 0
      ? conv.qdStorageNone
      : conv.qdStorageDays
          .replace("{days}", String(storageDays))
          .replace("{mode}", selection.recording_mode === "motion" ? conv.qdModeMotion : conv.qdMode247);
    summaryText += `${conv.qdLabelStorage.replace("{storage}", storageText)}\n`;
    summaryText += `${conv.qdLabelCabling.replace("{cabling}", cablingDone ? conv.qdCablingPrewired : conv.qdCablingNew)}\n`;
    if (selection.broadband_status === "sim_router") {
      summaryText += `${conv.qdLabelConnectivity}\n`;
    }
    if (promoterDiscount) {
      const offLabel = promoterDiscount.percent ? `-${promoterDiscount.percent}%` : `-₹${promoterDiscount.flat}`;
      summaryText += `${conv.qdLabelPartnerDiscount.replace("{code}", String(partnerId)).replace("{off}", offLabel)}\n`;
    }
    summaryText += `✅ ${conv.allInclusiveTag}\n\n`;

    if (tech === "HD" && proIpLowestPrice) {
      summaryText += `${conv.qdDualSetupTitle}\n`;
      summaryText += isHybrid
        ? `🏷️ *${conv.qdSetupTechHybridHd}:* ₹${lowestOverallQuote.total_payable.toLocaleString("en-IN")}+\n💎 *${conv.qdSetupTechHybridIp}:* ₹${proIpLowestPrice.toLocaleString("en-IN")}+\n\n`
        : `🏷️ *${conv.setupAnalogHd}:* ₹${lowestOverallQuote.total_payable.toLocaleString("en-IN")}+\n💎 *${conv.setupDigitalIp}:* ₹${proIpLowestPrice.toLocaleString("en-IN")}+\n\n`;
    } else if (tech === "IP" && valueHdLowestPrice) {
      summaryText += `${conv.qdDualSetupTitle}\n`;
      summaryText += isHybrid
        ? `💎 *${conv.qdSetupTechHybridIp}:* ₹${lowestOverallQuote.total_payable.toLocaleString("en-IN")}+\n🏷️ *${conv.qdSetupTechHybridHd}:* ₹${valueHdLowestPrice.toLocaleString("en-IN")}+\n\n`
        : `💎 *${conv.setupDigitalIp}:* ₹${lowestOverallQuote.total_payable.toLocaleString("en-IN")}+\n🏷️ *${conv.setupAnalogHd}:* ₹${valueHdLowestPrice.toLocaleString("en-IN")}+\n\n`;
    }

    summaryText += `${conv.qdBrandSpectrumTitle}\n\n`;

    brandSummaries.forEach((b, idx) => {
      const isLowest = b.minPrice === lowestOverallQuote.total_payable;
      summaryText += `${idx + 1}️⃣ *${b.brandName.toUpperCase()}*${isLowest ? conv.qdLowestBadge : ""}\n`;
      summaryText += `   💰 *₹${b.minPrice.toLocaleString("en-IN")} – ₹${b.maxPrice.toLocaleString("en-IN")}*\n`;
      if (b.economyQuote && b.economyQuote.total_payable < (b.standardQuote.total_payable || Infinity)) {
        const saveAmt = ((b.standardQuote.total_payable || 0) - b.economyQuote.total_payable).toLocaleString("en-IN");
        summaryText += `${conv.qdEconomyLine.replace("{price}", b.economyQuote.total_payable.toLocaleString("en-IN")).replace("{save}", saveAmt)}\n`;
      }
      summaryText += `${conv.qdStandardLine.replace("{days}", String(storageDays)).replace("{price}", b.standardQuote.total_payable.toLocaleString("en-IN"))}\n\n`;
    });

    const langParam = session.language ? `?lang=${session.language}` : "";
    const nameParam = session.customer_name && session.customer_name !== "WhatsApp Customer" ? `&name=${encodeURIComponent(session.customer_name)}` : "";
    const webStudioUrl = session.lead_id
      ? `https://cctvquotation.com/quote/${session.lead_id}${langParam}${nameParam ? (langParam ? nameParam : `?${nameParam.slice(1)}`) : ""}`
      : `https://cctvquotation.com/wizard?phone=${phone}${session.language ? `&lang=${session.language}` : ""}${nameParam}`;

    summaryText += `━━━━━━━━━━━━━━━━━━━━━\n`;
    summaryText += `${conv.qdStudioTitle}\n`;
    summaryText += `${conv.qdStudioBody.replace("{url}", webStudioUrl)}\n\n`;
    summaryText += `${conv.qdPriceMatchTitle}\n`;
    summaryText += conv.qdPriceMatchBody;

    await sendMsg(MessageBuilder.text(phone, summaryText));

    // Add Special Quick Action Rows
    const specialRows: any[] = [
      {
        id: "select_lowest_quote",
        title: conv.qdLowestTitle,
        description: conv.qdLowestDesc
          .replace("{price}", lowestOverallQuote.total_payable.toLocaleString("en-IN"))
          .replace("{brand}", lowestOverallQuote.camera_device?.brand || "TEAM CCTV")
      }
    ];

    if (tech === "HD" && proIpLowestPrice) {
      specialRows.push({
        id: "toggle_tech_ip",
        title: isHybrid ? conv.qdViewIpHybridTitle : conv.qdViewIpTitle,
        description: conv.qdViewIpDesc.replace("{price}", proIpLowestPrice.toLocaleString("en-IN"))
      });
    } else if (tech === "IP") {
      specialRows.push({
        id: "toggle_tech_hd",
        title: isHybrid ? conv.qdViewHdHybridTitle : conv.qdViewHdTitle,
        description: conv.qdViewHdDesc.replace(
          "{price}",
          (valueHdLowestPrice || lowestOverallQuote.total_payable).toLocaleString("en-IN")
        )
      });
    }

    specialRows.push(
      {
        id: "upload_competitor_quote",
        title: conv.qdUploadTitle,
        description: conv.qdUploadDesc
      },
      {
        id: "open_web_studio",
        title: conv.qdStudioBtnTitle,
        description: conv.qdStudioBtnDesc
      }
    );

    // Limit brandRows so total rows (brandRows + specialRows) <= 10 (WhatsApp Cloud API maximum)
    const maxBrandRows = Math.max(1, 10 - specialRows.length);
    const brandRows = brandSummaries.slice(0, maxBrandRows).map(b => ({
      id: `view_brand_${b.brandKey}`,
      title: `${b.brandName} (₹${Math.round(b.minPrice / 1000)}k-₹${Math.round(b.maxPrice / 1000)}k)`,
      description: `₹${b.minPrice.toLocaleString("en-IN")} – ₹${b.maxPrice.toLocaleString("en-IN")} (${b.variations.length})`
    }));

    await sendMsg(MessageBuilder.list(
      phone,
      conv.qdPickBrandPrompt,
      conv.btnChooseBrand,
      [
        { title: conv.secBrands, rows: brandRows },
        { title: conv.secQuickActions, rows: specialRows }
      ]
    ));

  } catch (error) {
    console.error("🔥 Error in generateAndSendPriceRanges:", error);
    await sendMsg(MessageBuilder.text(phone, conv.errGeneric));
  }
}

export async function sendBrandVariations(phone: string, session: WhatsAppSession, brandKey: string) {
  const conv = getConversationalStrings(session.language);
  try {
    const [productsSnap, addonsSnap, settingsSnap] = await Promise.all([
      adminDb.collection(COLLECTIONS.PRODUCTS).where("is_active", "==", true).get(),
      adminDb.collection(COLLECTIONS.ADDONS).where("is_active", "==", true).get(),
      adminDb.collection(COLLECTIONS.SETTINGS).doc("app_config").get()
    ]);

    const products = productsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const addons = addonsSnap.docs.map((d: any) => ({ id: d.id, ...d.data() }));
    const settings = settingsSnap.data() as any;

    const rawSelection = (session.wizard_answers || {}) as ConfiguratorSelection;
    const cablingDone = session.wizard_answers?.cabling_done === true || session.wizard_answers?.cabling_status === "done";
    const { hydratedSelection: selection } = resolveDispatchTech(rawSelection);
    const reqDays = selection.recording_days !== undefined ? selection.recording_days : 7;

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
      await sendMsg(MessageBuilder.text(phone, conv.qdVarNotFound));
      return;
    }

    const { standardQuote, economyQuote, colorNightQuote, brandName } = targetBrandSummary;
    const storageLabel = reqDays === 0
      ? conv.qdStorageNone
      : conv.qdStorageDays.replace("{days}", String(reqDays)).replace("{mode}", conv.qdMode247);

    let text = `${conv.qdVarHeader.replace("{brand}", brandName.toUpperCase())}\n\n`;
    text += `${conv.qdVarStdTitle.replace("{storage}", storageLabel)}\n`;
    text += `${conv.qdVarTotalLine.replace("{price}", standardQuote.total_payable.toLocaleString("en-IN"))}\n`;
    text += `${conv.qdVarHwStd
      .replace("{cams}", String(selection.camera_count || 4))
      .replace("{res}", techResolution(standardQuote))
      .replace("{breakdown}", formatCameraBreakdown(selection, conv))
      .replace("{storageType}", storageLabel)}\n\n`;

    if (colorNightQuote) {
      text += `${conv.qdVarColorTitle}\n`;
      text += `${conv.qdVarTotalLine.replace("{price}", colorNightQuote.total_payable.toLocaleString("en-IN"))}\n`;
      text += `${conv.qdVarHwColor}\n\n`;
    }

    if (economyQuote) {
      const saveAmt = ((standardQuote.total_payable || 0) - economyQuote.total_payable).toLocaleString("en-IN");
      text += `${conv.qdVarEcoTitle}\n`;
      text += `${conv.qdVarSaveLine.replace("{price}", economyQuote.total_payable.toLocaleString("en-IN")).replace("{save}", saveAmt)}\n`;
      text += `${conv.qdVarHwEco}\n\n`;
    }

    text += conv.qdVarSelectPrompt;

    const variationRows = [
      {
        id: `lock_${brandKey}_standard`,
        title: conv.qdVarStdRow,
        description: `₹${standardQuote.total_payable.toLocaleString("en-IN")} (${storageLabel})`
      }
    ];

    if (colorNightQuote) {
      variationRows.push({
        id: `lock_${brandKey}_color`,
        title: conv.qdVarColorRow,
        description: `₹${colorNightQuote.total_payable.toLocaleString("en-IN")}`
      });
    }

    if (economyQuote) {
      const saveAmt = ((standardQuote.total_payable || 0) - economyQuote.total_payable).toLocaleString("en-IN");
      variationRows.push({
        id: `lock_${brandKey}_economy`,
        title: conv.qdVarEcoRow,
        description: `₹${economyQuote.total_payable.toLocaleString("en-IN")} (-₹${saveAmt})`
      });
    }

    variationRows.push({
      id: "back_to_brands",
      title: conv.qdVarBackTitle,
      description: conv.qdVarBackDesc
    });

    await sendMsg(MessageBuilder.list(
      phone,
      text,
      conv.btnChooseVariation,
      [
        {
          title: conv.secVariations.replace("{brand}", brandName),
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
    await sendMsg(MessageBuilder.text(phone, conv.errGeneric));
  }
}

export async function finalizeAndSendQuote(phone: string, session: WhatsAppSession, chosenQuote: PricingResult) {
  const conv = getConversationalStrings(session.language);
  try {
    const { isHybrid, tech, hydratedSelection } = resolveDispatchTech(session.wizard_answers || {});
    const mergedWizardAnswers = {
      ...(session.wizard_answers || {}),
      technology: tech,
      technology_preference: tech,
      is_hybrid: isHybrid,
      hybrid_wired_technology: tech === "IP" ? "IP" : "HD",
      technology_choice: isHybrid ? "Hybrid" : tech,
      ...(hydratedSelection.mixed_camera_requirements ? { mixed_camera_requirements: hydratedSelection.mixed_camera_requirements } : {}),
    };

    let leadId = session.lead_id;
    if (!leadId) {
      const newLead = {
        customer_name: session.customer_name || "WhatsApp Customer",
        mobile_number: phone.replace(/\D/g, ""),
        channel: "whatsapp",
        status: "quoted",
        technology_choice: isHybrid ? "Hybrid" : tech,
        wizard_answers: mergedWizardAnswers,
        created_at: new Date(),
        updated_at: new Date(),
        partner_id: session.partner_id || null,
        utm_source: session.utm_source || "whatsapp",
        utm_campaign: session.utm_campaign || null,
      };
      const leadRef = await adminDb.collection(COLLECTIONS.LEADS).add(newLead);
      leadId = leadRef.id;
    } else {
      const updatePayload: any = {
        status: "quoted",
        technology_choice: isHybrid ? "Hybrid" : tech,
        wizard_answers: mergedWizardAnswers,
        updated_at: new Date(),
      };
      if (session.customer_name && session.customer_name !== "WhatsApp Customer") {
        updatePayload.customer_name = session.customer_name;
      }
      if (session.language) {
        updatePayload.preferred_language = session.language;
      }
      await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update(updatePayload);
    }

    // Create quote record in Firestore subcollection
    const quoteRef = adminDb.collection(COLLECTIONS.LEADS).doc(leadId).collection(SUBCOLLECTIONS.QUOTES).doc();
    const customerLang = session.language || "en";
    const newQuote = {
      ...chosenQuote,
      id: quoteRef.id,
      lead_id: leadId,
      preferred_language: customerLang,
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
    const pdfUrl = `${baseUrl}/api/v1/leads/${leadId}/quotes/${quoteRef.id}/pdf?lang=${encodeURIComponent(customerLang)}`;

    // Send PDF document via WhatsApp
    await sendMsg(MessageBuilder.document(
      phone,
      pdfUrl,
      conv.qdPdfCaption
        .replace("{quoteId}", quoteRef.id)
        .replace("{price}", chosenQuote.total_payable.toLocaleString("en-IN")),
      `TEAM_CCTV_Quotation_${quoteRef.id}.pdf`
    ));

    // Send Checkout Pathways Menu
    const checkoutButtons = [
      { id: "action_pay_full", title: conv.btnPayFull },
      { id: "action_book_token", title: conv.btnBookToken },
      { id: "action_book_survey", title: conv.btnFreeVisit },
    ];

    await sendMsg(MessageBuilder.buttons(
      phone,
      conv.qdCheckoutPrompt,
      checkoutButtons
    ));

  } catch (err) {
    console.error("🔥 Error in finalizeAndSendQuote:", err);
    await sendMsg(MessageBuilder.text(phone, conv.qdErrFinalize));
  }
}

export async function handleCheckoutAction(phone: string, session: WhatsAppSession, actionId: string) {
  const conv = getConversationalStrings(session.language);
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cctvquotation.com";
    const leadId = session.lead_id;
    const quoteId = session.quote_id;

    if (!leadId || !quoteId) {
      await sendMsg(MessageBuilder.text(phone, conv.qdErrQuoteFirst));
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
      const payUrl = data.short_url || `${baseUrl}/quote/${leadId}/review/${quoteId}`;
      await sendMsg(MessageBuilder.text(
        phone,
        conv.qdPayFullMsg.replace("{url}", payUrl)
      ));

    } else if (actionId === "action_book_token") {
      // Create Razorpay ₹500 advance slot reservation token link
      const res = await fetch(`${baseUrl}/api/payment/razorpay-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId, quoteId, isTokenBooking: true, amount: 500 })
      });
      const data = await res.json();
      const tokenUrl = data.short_url || `${baseUrl}/quote/${leadId}/review/${quoteId}`;
      await sendMsg(MessageBuilder.text(
        phone,
        conv.qdBookTokenMsg.replace("{url}", tokenUrl)
      ));

    } else if (actionId === "action_book_survey") {
      // Provide free site visit slot picker
      await sendMsg(MessageBuilder.list(
        phone,
        conv.qdVisitPrompt,
        conv.btnChooseSlot,
        [
          {
            title: conv.secVisitSlots,
            rows: [
              { id: "slot_tmw_morning", title: conv.slotTmwMornTitle, description: conv.slotDesc },
              { id: "slot_tmw_afternoon", title: conv.slotTmwAftTitle, description: conv.slotDesc },
              { id: "slot_day2_morning", title: conv.slotDay2MornTitle, description: conv.slotDesc },
              { id: "slot_day2_afternoon", title: conv.slotDay2AftTitle, description: conv.slotDesc },
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
    await sendMsg(MessageBuilder.text(phone, conv.qdErrCheckout));
  }
}

export async function handleSlotSelection(phone: string, session: WhatsAppSession, slotId: string) {
  const conv = getConversationalStrings(session.language);
  try {
    const leadId = session.lead_id;
    const slotMap: Record<string, { date: string; timeSlot: string }> = {
      slot_tmw_morning: { date: "Tomorrow", timeSlot: "10:00 AM - 01:00 PM" },
      slot_tmw_afternoon: { date: "Tomorrow", timeSlot: "02:00 PM - 05:00 PM" },
      slot_day2_morning: { date: "Day After Tomorrow", timeSlot: "10:00 AM - 01:00 PM" },
      slot_day2_afternoon: { date: "Day After Tomorrow", timeSlot: "02:00 PM - 05:00 PM" },
    };

    const slot = slotMap[slotId] || { date: "Upcoming", timeSlot: "10:00 AM - 01:00 PM" };

    const localizedDate = slotId.includes("tmw") ? conv.qdSlotTomorrow : conv.qdSlotDayAfter;

    if (leadId) {
      await adminDb.collection(COLLECTIONS.LEADS).doc(leadId).update({
        status: "site_visit",
        site_visit_date: slot.date,
        site_visit_date_localized: localizedDate,
        site_visit_time_slot: slot.timeSlot,
        preferred_language: session.language || "en",
        updated_at: new Date(),
      });

      // Dispatch confirmation using Msg91WhatsAppProvider
      const provider = new Msg91WhatsAppProvider();
      await provider.sendSurveyConfirm({
        phone,
        customerName: session.customer_name || conv.valuedCustomer,
        date: localizedDate,
        timeSlot: slot.timeSlot,
        preferredLanguage: session.language || "en",
      });
    }

    await sendMsg(MessageBuilder.text(
      phone,
      conv.qdSlotConfirmed.replace("{date}", localizedDate).replace("{time}", slot.timeSlot)
    ));

    await adminDb.collection(COLLECTIONS.WHATSAPP_SESSIONS).doc(phone).update({
      state: "COMPLETED"
    });

  } catch (err) {
    console.error("🔥 Error in handleSlotSelection:", err);
  }
}

function formatCameraBreakdown(selection: any, conv: ConversationalStrings): string {
  const techLower = String(selection?.technology || "").toLowerCase();
  const isPureWireless =
    (techLower === "wireless" ||
      techLower === "wifi" ||
      techLower === "4g_solar" ||
      selection?.installation_type === "wireless" ||
      selection?.installation_type === "solar_4g") &&
    !selection?.is_hybrid;
  const outCount = Number(selection.outdoor_camera_count) || 0;
  const inCount = Number(selection.indoor_camera_count) || 0;
  const wifiCount = Number(selection.wifi_camera_count) || 0;
  const total = Number(selection.camera_count) || (isPureWireless ? (wifiCount || (outCount + inCount) || 4) : (outCount + inCount + wifiCount || 4));

  if (isPureWireless) {
    if (outCount > 0 && inCount > 0) {
      return `${conv.qdBreakdownOut.replace("{n}", String(outCount))} + ${conv.qdBreakdownIn.replace("{n}", String(inCount))} (${conv.qdSetupTechWireless})`;
    }
    return `${total} ${conv.qdSetupTechWireless}`;
  }
  const parts: string[] = [];
  if (outCount > 0) parts.push(conv.qdBreakdownOut.replace("{n}", String(outCount)));
  else if (inCount > 0 && wifiCount === 0) parts.push(conv.qdBreakdownOut.replace("{n}", "0"));

  if (inCount > 0) parts.push(conv.qdBreakdownIn.replace("{n}", String(inCount)));
  else if (outCount > 0 && wifiCount === 0) parts.push(conv.qdBreakdownIn.replace("{n}", "0"));

  if (wifiCount > 0) parts.push(conv.qdBreakdownWifi.replace("{n}", String(wifiCount)));

  return parts.length > 0 ? parts.join(" + ") : conv.qdBreakdownWired.replace("{n}", String(total));
}

function techResolution(quote: PricingResult): string {
  return quote.camera_device?.derivedResolution || "3MP High-Clarity";
}

async function sendMsg(msg: any) {
  const whatsappPhoneId = cleanPhoneEnvVar(process.env.WHATSAPP_PHONE_ID || process.env.WA_PHONE_NUMBER_ID);
  const whatsappToken = cleanEnvVar(process.env.WHATSAPP_TOKEN || process.env.WA_ACCESS_TOKEN);
  const msg91AuthKey = cleanEnvVar(process.env.MSG91_AUTH_KEY);
  const msg91FromNumber = cleanPhoneEnvVar(process.env.MSG91_WHATSAPP_NUMBER);
  const providerPref = cleanEnvVar(process.env.WHATSAPP_PROVIDER).toLowerCase();

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
