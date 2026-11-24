"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Camera,
  HardDrive,
  Cable,
  Wifi,
  Clock,
  Sparkles,
  Zap,
  CheckCircle2,
  Copy,
  Check,
  MessageSquare,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Flame,
  Volume2,
  SunMedium,
  RotateCw,
  Eye,
  CheckCheck,
  PhoneCall,
  ExternalLink,
  ChevronRight,
  Radio,
  Layers,
  ArrowRightLeft,
  Compass,
  Navigation,
  Cpu,
  PackageCheck,
  SlidersHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/useTranslation";
import { openWhatsAppChat } from "@/lib/whatsapp";

interface CustomerJourneyBlueprintProps {
  lead: any;
  onEditRequirements?: () => void;
  isPaid?: boolean;
}

export function CustomerJourneyBlueprint({
  lead,
  onEditRequirements,
  isPaid = false
}: CustomerJourneyBlueprintProps) {
  const { t } = useTranslation();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showBehavioralComparison, setShowBehavioralComparison] = useState(true);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  // Normalize snapshots and raw answers
  const req = lead?.requirementSnapshot || {};
  const wz = lead?.wizard_answers || {};
  const sel = lead?.selection || {};
  const items: any[] = lead?.configuration_snapshot || lead?.pricingSnapshot?.items || lead?.items || [];

  // 1. Source and Journey Origin
  const rawSource = String(lead?.source || req?.source || wz?.source || lead?.channel || "wizard").toLowerCase();
  const isWhatsApp = rawSource.includes("whatsapp") || lead?.channel === "whatsapp";
  const isProBuilder = rawSource.includes("pro_builder") || req?.is_pro_builder || wz?.is_pro_builder;
  const isPriceMatch = rawSource.includes("price_match") || !!lead?.competitor_quote_url;
  
  const sourceLabel = isWhatsApp
    ? t("adm_jb_src_wa", "💬 WhatsApp AI Assistant")
    : isProBuilder
    ? t("adm_jb_src_pb", "🛠️ Pro Custom Builder")
    : isPriceMatch
    ? t("adm_jb_src_pm", "📸 Competitor Price Match")
    : t("adm_jb_src_wz", "🌐 Website Guided Wizard");

  // 2. Customer & Basic Info
  const customerName = lead?.customer_name || lead?.billing_details?.contact_name || t("adm_ld_unk_cust", "Customer");
  const customerPhone = lead?.customer_mobile || lead?.mobile_number || "";

  // 3. Complete Location & Site Geocoding
  const pincode = String(
    lead?.address?.pincode ||
    req?.customer_pincode ||
    req?.lead_pincode ||
    wz?.customer_pincode ||
    wz?.lead_pincode ||
    lead?.pincode ||
    req?.pincode ||
    wz?.pincode ||
    ""
  ).trim();

  const city = String(
    lead?.address?.city ||
    req?.city ||
    wz?.city ||
    lead?.city ||
    "Jaipur"
  ).trim();

  const state = String(
    lead?.address?.state ||
    req?.state ||
    wz?.state ||
    lead?.state ||
    "Rajasthan"
  ).trim();

  const area = String(
    lead?.address?.area ||
    lead?.address?.landmark1 ||
    req?.locality ||
    req?.quadrant ||
    req?.anchor ||
    wz?.locality ||
    wz?.quadrant ||
    wz?.anchor ||
    req?.area ||
    wz?.area ||
    lead?.area ||
    ""
  ).trim();

  const fullAddress = String(
    lead?.address?.full_address ||
    lead?.address?.address_line1 ||
    lead?.full_address ||
    req?.full_address ||
    wz?.full_address ||
    ""
  ).trim();

  const coordinates = lead?.address?.coordinates ||
    (req?.lat && req?.lng ? { lat: req.lat, lng: req.lng } : null) ||
    (wz?.lat && wz?.lng ? { lat: wz.lat, lng: wz.lng } : null) ||
    null;

  const mapUrl = lead?.address?.map_url || (coordinates ? `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}` : (pincode ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(pincode + " " + (area ? area + " " : "") + city)}` : ""));

  const locationSummary = [area, city, pincode].filter(Boolean).join(", ") || city;

  // 4. Property Context
  const rawProperty = String(
    lead?.property_type || req?.property_type || wz?.property_type || wz?.q_property_type || "home"
  ).toLowerCase();

  const getPropertyInfo = (type: string) => {
    if (type.includes("ware") || type.includes("godown")) {
      return { title: t("adm_jb_prop_wh", "गोदाम / वेयरहाउस (Warehouse)"), icon: Building2, tag: "Industrial / Commercial" };
    }
    if (type.includes("fact") || type.includes("plant") || type.includes("indust")) {
      return { title: t("adm_jb_prop_fact", "फैक्ट्री / प्लांट (Factory)"), icon: Building2, tag: "Industrial" };
    }
    if (type.includes("shop") || type.includes("retail") || type.includes("store")) {
      return { title: t("adm_jb_prop_shop", "दुकान / शोरूम (Shop / Commercial)"), icon: Building2, tag: "Commercial" };
    }
    if (type.includes("off") || type.includes("corp")) {
      return { title: t("adm_jb_prop_office", "ऑफिस / कॉर्पोरेट (Office)"), icon: Building2, tag: "Corporate" };
    }
    if (type.includes("farm") || type.includes("plot")) {
      return { title: t("adm_jb_prop_farm", "फार्महाउस / प्लॉट (Farmhouse / Plot)"), icon: Sparkles, tag: "Remote / Open" };
    }
    if (type.includes("school") || type.includes("inst")) {
      return { title: t("adm_jb_prop_school", "स्कूल / संस्थान (Institute)"), icon: Building2, tag: "Institutional" };
    }
    return { title: t("adm_jb_prop_home", "घर / फ्लैट (Residential Home)"), icon: Building2, tag: "Residential" };
  };

  const propertyInfo = getPropertyInfo(rawProperty);

  // Ceiling and Surfaces
  const rawCeiling = String(req?.ceiling_height || wz?.ceiling_height || "standard").toLowerCase();
  const ceilingLabel = rawCeiling === "very_high"
    ? t("adm_jb_ceil_vh", "इंडस्ट्रियल शेड (16+ फीट)")
    : rawCeiling === "high"
    ? t("adm_jb_ceil_h", "ऊंची सीलिंग (11-15 फीट)")
    : t("adm_jb_ceil_std", "मानक ऊंचाई (8-10 फीट)");

  const surfaceTypes: string[] = req?.surface_types || wz?.surface_types || [];
  const surfaceLabel = surfaceTypes.length > 0
    ? surfaceTypes.map(s => {
        if (s === "brick") return "ईंट / प्लास्टर";
        if (s === "false_ceiling") return "फॉल्स सीलिंग";
        if (s === "tin_shed") return "टिन / मेटल शेड";
        if (s === "concrete") return "कंक्रीट बीम";
        return s;
      }).join(", ")
    : t("adm_jb_surf_std", "ईंट / प्लास्टर की दीवार");

  // 5. Installation Type
  const rawInstType = String(
    lead?.installationType || req?.installation_type || wz?.installation_type || "new"
  ).toLowerCase();

  const isAddon = rawInstType.includes("addon") || rawInstType.includes("expansion") || rawInstType.includes("जोड़ना");
  const isRepair = rawInstType.includes("repair") || rawInstType.includes("service");
  const isCabling = rawInstType.includes("cabling");

  const instTypeLabel = isAddon
    ? t("adm_jb_inst_addon", "मौजूदा सिस्टम में जोड़ना (System Expansion)")
    : isRepair
    ? t("adm_jb_inst_repair", "सर्विस व मेंटेनेंस (Service & Repair)")
    : isCabling
    ? t("adm_jb_inst_cabling", "केवल केबलिंग व फिटिंग (Wiring & Termination)")
    : t("adm_jb_inst_new", "पूरी तरह नया सिस्टम (Complete Fresh Setup)");

  // Existing System (Add-on / System Expansion) Intelligence
  const existingSystemKnown = req?.existing_system_known ?? wz?.existing_system_known ?? lead?.existing_system_known;
  const isCallbackScenario = Boolean(req?.callback_requested || wz?.callback_requested || lead?.callback_requested || existingSystemKnown === false);

  const rawExistingTech = String(
    req?.existing_technology ||
    wz?.existing_technology ||
    req?.existing_tech ||
    wz?.existing_tech ||
    lead?.existing_technology ||
    lead?.existing_tech ||
    "HD"
  ).toUpperCase();
  const existingTech = rawExistingTech.includes("IP") ? "IP" : "HD";
  const existingTechLabel = existingTech === "IP"
    ? t("wz_ip__network_cat6_wire", "डिजिटल IP (CAT6 तार)")
    : t("wz_analog_hd_bnc_wire", "एनालॉग HD (BNC वायर)");

  const existingChannels = Number(
    req?.existing_recorder_channels ||
    wz?.existing_recorder_channels ||
    req?.existing_channels ||
    wz?.existing_channels ||
    lead?.existing_recorder_channels ||
    lead?.existing_channels ||
    0
  );

  const existingWorkingCameras = Number(
    req?.existing_working_cameras ||
    wz?.existing_working_cameras ||
    req?.working_cameras ||
    wz?.working_cameras ||
    lead?.existing_working_cameras ||
    lead?.working_cameras ||
    0
  );

  // 6. Cameras Breakdown (Total, Outdoor, Indoor, Wireless)
  const totalCameras = Number(req?.camera_count || wz?.camera_count || lead?.camera_count || 4);

  const spareChannels = existingChannels > 0 ? Math.max(0, existingChannels - existingWorkingCameras) : 0;
  const totalCombinedCameras = totalCameras + existingWorkingCameras;
  const isUpgradeNeeded = existingChannels > 0 ? (totalCombinedCameras > existingChannels) : false;
  const retainStorage = Boolean(req?.retain_existing_storage ?? wz?.retain_existing_storage ?? lead?.retain_existing_storage ?? false);

  const recorderItem = items.find((i) => {
    const cat = (i.category || "").toLowerCase();
    const nm = (i.name || i.display_name || "").toLowerCase();
    return cat.includes("recorder") || nm.includes("dvr") || nm.includes("nvr");
  });

  // Check hardware BOM items for real camera items (excluding cables, junction boxes & accessories with "camera" in name)
  const cameraItems = items.filter((i) => {
    const nm = (i.name || i.display_name || "").toLowerCase();
    const cat = (i.category || "").toLowerCase();
    if (
      nm.includes("cable") || nm.includes("wire") || nm.includes("3+1") || nm.includes("cat6") ||
      nm.includes("junction") || nm.includes("box") || nm.includes("bnc") || nm.includes("connector") || nm.includes("pin") ||
      nm.includes("hdd") || nm.includes("storage") || nm.includes("hard disk") ||
      nm.includes("smps") || nm.includes("power") || nm.includes("dvr") || nm.includes("nvr") ||
      nm.includes("installation") || nm.includes("fitting") || nm.includes("fee")
    ) {
      return false;
    }
    return cat.includes("camera") || nm.includes("camera") || nm.includes("bullet") || nm.includes("dome");
  });

  let outdoorBullets = Number(req?.outdoor_camera_count || req?.bullet_count || wz?.outdoor_camera_count || wz?.bullet_count || 0);
  let indoorDomes = Number(req?.indoor_camera_count || req?.dome_count || wz?.indoor_camera_count || wz?.dome_count || 0);
  let wirelessCameras = Number(req?.wifi_camera_count || wz?.wifi_camera_count || 0);

  // If not explicitly set in wizard answers, deduce from BOM
  if (outdoorBullets === 0 && indoorDomes === 0 && wirelessCameras === 0) {
    cameraItems.forEach((it) => {
      const nm = (it.name || it.display_name || "").toLowerCase();
      const qty = Number(it.qty || it.quantity || 1);
      if (nm.includes("bullet")) {
        outdoorBullets += qty;
      } else if (nm.includes("dome")) {
        indoorDomes += qty;
      } else if (nm.includes("wifi") || nm.includes("wireless") || nm.includes("4g")) {
        wirelessCameras += qty;
      }
    });
    // Fallback: If still 0, treat wired cameras as outdoor bullets
    if (outdoorBullets === 0 && indoorDomes === 0) {
      outdoorBullets = totalCameras;
    }
  }

  // 7. Technology, Brand & Resolution Identification
  const rawTech = String(
    req?.technology_preference ||
    lead?.technology_choice ||
    sel?.technology ||
    wz?.technology ||
    wz?.technology_preference ||
    "HD"
  ).toUpperCase();

  const isWireless = rawTech === "WIRELESS" || rawTech.includes("WIFI");
  const isIP = rawTech === "IP" || rawTech.includes("POE");
  const isHybrid = rawTech === "HYBRID" || req?.is_hybrid || wz?.is_hybrid;
  const is4G = req?.is_4g || wz?.is_4g || req?.has_4g_sim || wz?.has_4g_sim;

  const techLabel = is4G
    ? t("adm_jb_tech_4g", "4G SIM स्टैंडअलोन (Cellular)")
    : isWireless
    ? t("adm_jb_tech_wifi", "स्मार्ट वायरलेस (Wi-Fi Wireless)")
    : isIP
    ? t("adm_jb_tech_ip", "डिजिटल IP नेटवर्क (PoE Network)")
    : isHybrid
    ? t("adm_jb_tech_hybrid", "हाइब्रिड प्रो (HD + Wi-Fi)")
    : t("adm_jb_tech_hd", "टर्बो HD एनालॉग (Turbo HD Copper)");

  // Deduce Brand
  const detectBrand = () => {
    if (req?.brand_preference) return req.brand_preference;
    if (sel?.brand_preference) return sel.brand_preference;
    if (wz?.brand_preference) return wz.brand_preference;
    for (const it of cameraItems) {
      const txt = `${it.brand || ""} ${it.name || ""} ${it.display_name || ""}`.toUpperCase();
      if (txt.includes("PRAMA")) return "PRAMA";
      if (txt.includes("HIKVISION")) return "HIKVISION";
      if (txt.includes("CP PLUS")) return "CP PLUS";
      if (txt.includes("DAHUA")) return "DAHUA";
      if (txt.includes("TRUEVIEW")) return "TRUEVIEW";
      if (txt.includes("HI-FOCUS") || txt.includes("HIFOCUS")) return "HI-FOCUS";
      if (txt.includes("SECUREYE")) return "SECUREYE";
    }
    return "CP PLUS"; // Standard trusted baseline
  };
  const activeBrand = detectBrand();

  // Deduce Resolution
  const detectResolution = () => {
    if (req?.resolution_preference) return req.resolution_preference;
    if (sel?.resolution_preference) return sel.resolution_preference;
    if (wz?.resolution_preference) return wz.resolution_preference;
    for (const it of cameraItems) {
      const txt = `${it.name || ""} ${it.display_name || ""}`.toUpperCase();
      if (txt.includes("8MP") || txt.includes("4K")) return "8MP 4K Ultra";
      if (txt.includes("5MP") || txt.includes("3K")) return "5MP Ultra HD";
      if (txt.includes("4MP")) return "4MP Quad HD";
      if (txt.includes("3MP")) return "3MP Super HD";
      if (txt.includes("2MP") || txt.includes("1080P")) return "2MP Full HD";
    }
    return "2MP Full HD";
  };
  const activeResolution = detectResolution();

  // Detect Hardware Features (Audio Mic, Color Night Vision, PTZ, 2-Way)
  const hasAudio = cameraItems.some(i => (i.name || i.display_name || "").toLowerCase().includes("audio")) ||
    Boolean(req?.features?.audio || wz?.features?.audio || req?.has_audio);

  const hasColorNight = cameraItems.some(i => {
    const s = (i.name || i.display_name || "").toLowerCase();
    return s.includes("color") || s.includes("colorvu") || s.includes("full color");
  }) || Boolean(req?.features?.color_night || wz?.features?.color_night || req?.sensor_preference === "colorvu");

  const hasPTZ = cameraItems.some(i => (i.name || i.display_name || "").toLowerCase().includes("ptz")) ||
    Boolean(req?.features?.ptz || wz?.features?.ptz || (Number(req?.wifi_indoor_ptz_count) || 0) > 0);

  const hasTwoWay = cameraItems.some(i => {
    const s = (i.name || i.display_name || "").toLowerCase();
    return s.includes("2-way") || s.includes("two-way") || s.includes("talk");
  }) || Boolean(req?.features?.two_way || wz?.features?.two_way);

  // 8. Storage Breakdown
  const storageDays = Number(req?.recording_days || sel?.storage_days || wz?.recording_days || 15);
  const storageItem = items.find(i => {
    const cat = (i.category || "").toLowerCase();
    const nm = (i.name || i.display_name || "").toLowerCase();
    return cat.includes("storage") || cat.includes("hdd") || cat.includes("disk") || nm.includes("hdd") || nm.includes("s300") || nm.includes("purple") || nm.includes("skyhawk") || nm.includes("microsd");
  });

  const storageHardwareTitle = storageItem
    ? (storageItem.display_name || storageItem.name)
    : t("adm_jb_stor_est", "{days} Days Surveillance Storage", { days: String(storageDays) });

  // 9. Exact Cabling Meters Selected vs Packaging
  const cablingDone = Boolean(
    lead?.cabling_done ?? req?.cabling_done ?? wz?.cabling_done ?? false
  );

  // Parse BOM cable packaging & compute total physical meters in BOM
  const cableBundleItems = items.filter(i => {
    const nm = (i.name || i.display_name || "").toLowerCase();
    return nm.includes("cable") || nm.includes("bundle") || nm.includes("3+1") || nm.includes("cat6");
  });

  let bomTotalMeters = 0;
  let bundleCount90m = 0;
  let openMeters = 0;

  cableBundleItems.forEach(i => {
    const nm = (i.name || i.display_name || "").toLowerCase();
    const qty = Number(i.qty || i.quantity || 0);
    if (nm.includes("90") || nm.includes("bundle")) {
      bundleCount90m += qty;
      bomTotalMeters += qty * 90;
    } else if (nm.includes("open") || nm.includes("meter") || nm.includes("/m") || nm.includes("mtr")) {
      openMeters += qty;
      bomTotalMeters += qty;
    } else if (nm.includes("305")) {
      bomTotalMeters += qty * 305;
    } else {
      bomTotalMeters += qty;
    }
  });

  const explicitMetersSelected = Number(
    lead?.total_cable_meters ??
    req?.total_cable_length_meters ??
    wz?.total_cable_length_meters ??
    req?.cabling_meters ??
    sel?.cablingMeters ??
    0
  );

  // If customer typed/selected explicit meters, use it; otherwise use the exact BOM meters!
  const actualCableMeters = explicitMetersSelected > 0
    ? explicitMetersSelected
    : (bomTotalMeters > 0 ? bomTotalMeters : (totalCameras * 15));

  const avgMetersPerCam = Math.round(actualCableMeters / Math.max(1, totalCameras));
  const standardLimitMeters = totalCameras * 15;
  const isCustomCableMeters = actualCableMeters !== standardLimitMeters;

  const powerWiringOption = String(req?.power_wiring_option || wz?.power_wiring_option || "socket_available");
  const powerWiringLabel = powerWiringOption === "extension_needed"
    ? t("adm_jb_pwr_ext", "पावर एक्सटेंशन वायरिंग की जरूरत (Extension Required)")
    : powerWiringOption === "site_survey"
    ? t("adm_jb_pwr_survey", "साइट सर्वे के दौरान तय होगा (Decide on Survey)")
    : t("adm_jb_pwr_ok", "कैमरों के पास पावर सॉकेट उपलब्ध (Sockets Available)");

  // 10. Network & Remote Viewing
  const rawBroadband = String(req?.broadband_status || wz?.broadband_status || "yes").toLowerCase();
  const broadbandLabel = rawBroadband === "no"
    ? t("adm_jb_bb_no", "इंटरनेट मौजूद नहीं है (Offline / No Wi-Fi)")
    : rawBroadband === "sim_router"
    ? t("adm_jb_bb_sim", "4G SIM वाई-फाई राउटर की जरूरत (SIM Router)")
    : rawBroadband === "independent_4g"
    ? t("adm_jb_bb_4g", "कैमरे में इन-बिल्ट 4G SIM स्लॉट (Direct 4G)")
    : t("adm_jb_bb_yes", "हाई-स्पीड ब्रॉडबैंड / वाई-फाई उपलब्ध (Wi-Fi Ready)");

  const remoteViewingRequested = Boolean(
    req?.wants_remote_viewing ?? wz?.wants_remote_viewing ?? (rawBroadband !== "no")
  );

  // 11. Installation Mode & Urgency Timeline
  const rawTimeline = String(
    lead?.timeline || req?.installation_timeline || wz?.timeline || wz?.q_timeline || "asap"
  ).toLowerCase();

  const isUrgent = rawTimeline === "asap" || rawTimeline.includes("immediately") || lead?.priority === "HOT";
  const timelineLabel = isUrgent
    ? t("adm_jb_tl_asap", "⚡ तत्काल (1-2 दिन / Urgent ASAP)")
    : rawTimeline.includes("week")
    ? t("adm_jb_tl_week", "📅 इसी हफ्ते में (Within 1 Week)")
    : rawTimeline.includes("month")
    ? t("adm_jb_tl_month", "🗓️ इस महीने के अंदर (Within This Month)")
    : t("adm_jb_tl_research", "🔍 मार्केट रेट और विकल्प समझ रहे हैं (Researching)");

  // 12. Final Price
  const totalPayable = Number(
    lead?.pricingSnapshot?.finalPrice ||
    lead?.pricingSnapshot?.total_payable ||
    lead?.total_payable ||
    0
  );

  // Generate Sales Pitch / Call Prep Summary
  const generateSalesPitch = () => {
    const existingSysPitch = isAddon
      ? `• *सेटअप प्रकार:* मौजूदा सिस्टम में जोड़ना (${existingChannels > 0 ? `${existingChannels}-Ch ${existingTech}, ${existingWorkingCameras} चालू, ${spareChannels} खाली` : (existingSystemKnown === false ? "स्पेसिफिकेशन्स अज्ञात - साइट सर्वे जरूरी" : "विस्तार")})\n`
      : `• *सेटअप प्रकार:* पूरी तरह नया सिस्टम (Fresh Installation)\n`;

    const recorderPitch = isAddon
      ? (recorderItem
          ? `• *रिकॉर्डर:* नया ${recorderItem.display_name || recorderItem.name} (अपग्रेड: कुल ${totalCombinedCameras} कैमरों के लिए पुराना ${existingChannels}-Ch DVR छोटा था)\n`
          : `• *रिकॉर्डर:* मौजूदा ${existingChannels}-Ch DVR का उपयोग (${spareChannels - totalCameras} पोर्ट अभी भी खाली, ₹0 रिकॉर्डर खर्च)\n`)
      : `• *रिकॉर्डर:* ${recorderItem?.display_name || recorderItem?.name || "शामिल"}\n`;

    return (
      `📋 *${customerName}* - ग्राहक चयन व आवश्यकता (TEAM CCTV Call Prep)\n` +
      `• *साइट लोकेशन:* ${fullAddress || locationSummary}\n` +
      `• *परिसर:* ${propertyInfo.title} (सीलिंग: ${ceilingLabel})\n` +
      existingSysPitch +
      `• *सिस्टम:* ${totalCameras} नए कैमरों का ${techLabel} सेटअप${isAddon ? ` (कुल सक्रिय: ${totalCombinedCameras} कैमरे)` : ""}\n` +
      `• *कैमरा विभाजन:* ${outdoorBullets} आउटडोर वेदरप्रूफ बुलेट + ${indoorDomes} इनडोर डोम + ${wirelessCameras} वायरलेस\n` +
      `• *ब्रांड व क्वालिटी:* ${activeBrand} (${activeResolution})${hasAudio ? " + इन-बिल्ट ऑडियो माइक 🎙️" : ""}${hasColorNight ? " + कलर नाइट विजन 🌈" : ""}\n` +
      recorderPitch +
      `• *स्टोरेज:* ${storageDays} दिन रिकॉर्डिंग (${storageHardwareTitle})${isAddon && retainStorage ? " [पुराना HDD रीयूज]" : ""}\n` +
      `• *केबलिंग (दूरी):* ${cablingDone ? "कंसील्ड वायरिंग तैयार (0m नया तार)" : `${actualCableMeters} मीटर 100% सॉलिड कॉपर केबल (~${avgMetersPerCam}m/कैमरा)`}\n` +
      `• *BOM पैकेजिंग:* ${cablingDone ? "कंसील्ड वायरिंग तैयार (0m नया तार, ₹0 केबल शुल्क)" : (bundleCount90m > 0 ? `${bundleCount90m} बंडल (90m) + ${openMeters}m खुला तार` : `${actualCableMeters}m कॉपर तार`)}\n` +
      `• *इंटरनेट:* ${broadbandLabel} (${remoteViewingRequested ? "फ्री मोबाइल ऐप एक्टिव" : "लोकल व्यू"})\n` +
      `• *टाइमलाइन:* ${timelineLabel}\n` +
      `• *कुल कोटेशन:* ₹${totalPayable.toLocaleString("en-IN")} (18% GST व डोरस्टेप फिटिंग सहित)`
    );
  };

  const handleCopyPitch = () => {
    const text = generateSalesPitch();
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(t("adm_jb_toast_pitch_copied", "कॉल सारांश कॉपी हो गया! सेल्स कॉल में उपयोग करें।"));
    setTimeout(() => setCopied(false), 2200);
  };

  const handleOpenWhatsAppChat = () => {
    if (!customerPhone) {
      toast.error(t("adm_ld_no_mob", "No Mobile Number"));
      return;
    }
    const pitch = generateSalesPitch();
    openWhatsAppChat(customerPhone, pitch);
  };

  return (
    <Card className="border-blue-200 dark:border-blue-900/60 shadow-sm overflow-hidden bg-white dark:bg-zinc-900 transition-all">
      {/* Header Bar */}
      <CardHeader className="p-4 sm:p-5 border-b bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50/60 dark:from-blue-950/30 dark:via-zinc-900 dark:to-zinc-900">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300 font-black text-base sm:text-lg">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                {t("adm_jb_title", "ग्राहक चयन और जरूरत का पूरा सफर")}
              </span>
              <Badge variant="outline" className="bg-blue-100/70 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 border-blue-300 font-bold text-[11px] py-0.5">
                {sourceLabel}
              </Badge>
              {pincode && (
                <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border-emerald-300 font-bold text-[11px] py-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{area ? `${area}, ` : ""}{city} ({pincode})</span>
                </Badge>
              )}
              {isUrgent && (
                <Badge className="bg-red-500 hover:bg-red-600 text-white font-bold text-[10px] py-0.5">
                  <Flame className="w-3 h-3 mr-0.5 inline shrink-0" /> {t("adm_leads_tl_asap", "⚡ तत्काल (ASAP)")}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-medium">
              {t("adm_jb_subtitle", "कोटेशन तक पहुँचने के दौरान ग्राहक द्वारा चुने गए सभी विकल्प, साइट इंफ्रास्ट्रक्चर और हार्डवेयर प्राथमिकताएं")}
            </p>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopyPitch}
              className="h-8 px-2.5 text-xs font-bold text-slate-700 dark:text-zinc-200 border-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800"
              title={t("adm_jb_copy_pitch_tip", "कॉल करने से पहले तैयारी के लिए सारांश कॉपी करें")}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">{t("adm_jb_copied", "कॉपी हो गया!")}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1" />
                  <span>{t("adm_jb_btn_copy_pitch", "कॉल सारांश कॉपी")}</span>
                </>
              )}
            </Button>

            {customerPhone && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleOpenWhatsAppChat}
                className="h-8 px-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                title={t("adm_jb_wa_tip", "WhatsApp पर सारांश भेजें या चैट शुरू करें")}
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                <span>{t("adm_jb_btn_wa", "WhatsApp")}</span>
              </Button>
            )}

            {!isPaid && onEditRequirements && (
              <Button
                size="sm"
                variant="outline"
                onClick={onEditRequirements}
                className="h-8 px-2.5 text-xs font-bold text-amber-700 dark:text-amber-400 border-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30"
              >
                <Zap className="w-3.5 h-3.5 mr-1 text-amber-600 shrink-0" />
                <span>{t("adm_ld_edit_req", "जरूरत बदलें")}</span>
              </Button>
            )}

            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* 7-Step Stepped Horizontal Roadmap */}
        <div className="pt-3 mt-1 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-[620px] text-[11px] font-semibold text-slate-600 dark:text-zinc-400">
            {/* Step 1 */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-100/70 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-black">1</span>
              <span>{sourceLabel.split(" ")[1] || "विजार्ड"}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            {/* Step 2 */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-100/70 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800">
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black">2</span>
              <span>
                {propertyInfo.title.split(" ")[0]}
                {isAddon ? ` (${existingChannels > 0 ? `${existingChannels}Ch` : "मौजूदा"})` : ""}
              </span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            {/* Step 3 */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100/70 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800">
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-black">3</span>
              <span>{totalCameras} नए कैमरे{isAddon && existingWorkingCameras > 0 ? ` (+${existingWorkingCameras})` : ""}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            {/* Step 4 */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100/70 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
              <span className="w-4 h-4 rounded-full bg-amber-600 text-white flex items-center justify-center text-[10px] font-black">4</span>
              <span>{activeBrand} {activeResolution.split(" ")[0]}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            {/* Step 5 */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100/70 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800">
              <span className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-black">5</span>
              <span>{storageDays}D स्टोरेज</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            {/* Step 6 */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-cyan-100/70 dark:bg-cyan-950/60 text-cyan-900 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-800">
              <span className="w-4 h-4 rounded-full bg-cyan-600 text-white flex items-center justify-center text-[10px] font-black">6</span>
              <span>{cablingDone ? "कंसील्ड तार" : `${actualCableMeters}m कॉपर तार`}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />

            {/* Step 7 */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold shadow-xs">
              <span className="w-4 h-4 rounded-full bg-white text-emerald-700 flex items-center justify-center text-[10px] font-black">✓</span>
              <span>₹{totalPayable.toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Main Expanded Bento Grid */}
      {isExpanded && (
        <CardContent className="p-4 sm:p-5 space-y-4">
          
          {/* Top Notice: Location & Address Bar (Fixing Missing Location!) */}
          <div className="p-3 sm:p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/70 dark:bg-emerald-950/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5 text-xs sm:text-sm">
                  <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                  {t("adm_jb_loc_title", "ग्राहक द्वारा सबमिट की गई साइट व इंस्टॉलेशन लोकेशन:")}
                </span>
                {pincode && (
                  <span className="font-black px-2 py-0.5 rounded bg-emerald-600 text-white text-[11px]">
                    पिनकोड: {pincode}
                  </span>
                )}
                {coordinates && (
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-mono bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded">
                    GPS: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                  </span>
                )}
              </div>
              <p className="text-zinc-700 dark:text-zinc-300 text-xs font-semibold leading-relaxed">
                {fullAddress || [area, city, state, pincode].filter(Boolean).join(", ") || t("adm_jb_loc_pending", "क्षेत्र: जयपुर / राजस्थान (पिनकोड विवरण)")}
              </p>
            </div>

            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shrink-0 shadow-xs transition-all"
              >
                <Compass className="w-3.5 h-3.5 shrink-0" />
                <span>{t("adm_jb_btn_gmaps", "गूगल मैप्स पर देखें")}</span>
                <ExternalLink className="w-3 h-3 ml-0.5 shrink-0" />
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            
            {/* Box 1: Premise & Structural Context */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-2.5">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-xs flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                  <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  {t("adm_jb_box1_title", "परिसर व स्थापना का प्रकार")}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {propertyInfo.tag}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold">{t("adm_jb_prop_lbl", "प्रॉपर्टी का प्रकार:")}</p>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{propertyInfo.title}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold">{t("adm_jb_setup_lbl", "सेटअप का प्रकार:")}</p>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>{instTypeLabel}</span>
                    {isAddon && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                        {existingChannels > 0 ? `${existingChannels}-Ch ${existingTech}` : (isCallbackScenario ? "स्पेस अज्ञात" : "विस्तार")}
                      </span>
                    )}
                  </p>
                </div>

                {/* DEDICATED EXISTING SYSTEM BLUEPRINT CARD */}
                {isAddon && (
                  <div className="mt-2 pt-2 border-t border-dashed border-zinc-300 dark:border-zinc-700 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] text-indigo-900 dark:text-indigo-300 flex items-center gap-1">
                        <HardDrive className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        {t("adm_jb_ext_sys_title", "मौजूदा सिस्टम का विवरण (Existing System Blueprint):")}
                      </span>
                      {existingSystemKnown === false || isCallbackScenario ? (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                          {t("adm_jb_ext_cb_tag", "कॉल बैक रिक्वेस्ट")}
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          {t("adm_jb_ext_verified_tag", "कस्टमर द्वारा दर्ज")}
                        </span>
                      )}
                    </div>

                    {existingSystemKnown === false || isCallbackScenario ? (
                      <div className="p-2 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 text-[11px] space-y-1">
                        <p className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1">
                          <span>🔍</span>
                          <span>{t("adm_jb_ext_unk_title", "तकनीकी स्पेसिफिकेशन्स अज्ञात (साइट सर्वे जरूरी)")}</span>
                        </p>
                        <p className="text-[10px] text-blue-800 dark:text-blue-300 leading-relaxed">
                          {t("adm_jb_ext_unk_desc", "ग्राहक को पुराने रिकॉर्डर चैनल/टेक्नोलॉजी की जानकारी नहीं है। इंजीनियर कॉल या साइट पर बैक-पैनल चेक करके कम्पैटिबिलिटी तय करेंगे।")}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                          <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60">
                            <span className="text-[10px] text-muted-foreground block">{t("adm_jb_ext_tech_lbl", "मौजूदा टेक्नोलॉजी:")}</span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">{existingTechLabel}</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60">
                            <span className="text-[10px] text-muted-foreground block">{t("adm_jb_ext_ch_lbl", "मौजूदा रिकॉर्डर:")}</span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">
                              {existingChannels > 0 ? `${existingChannels} ${t("adm_jb_channels", "चैनल")}` : t("adm_jb_not_specified", "दर्ज नहीं")}
                            </span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60">
                            <span className="text-[10px] text-muted-foreground block">{t("adm_jb_ext_working_lbl", "अभी चालू कैमरे:")}</span>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-[11px]">{existingWorkingCameras} पीस</span>
                          </div>
                          <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60">
                            <span className="text-[10px] text-muted-foreground block">{t("adm_jb_ext_spare_lbl", "खाली पोर्ट (स्पेयर):")}</span>
                            <span className={`font-black text-[11px] ${spareChannels > 0 ? "text-emerald-700 dark:text-emerald-400" : "text-amber-700 dark:text-amber-400"}`}>
                              {spareChannels} {t("adm_jb_ports", "पोर्ट")}
                            </span>
                          </div>
                        </div>

                        {/* Feasibility & Upgrade Status Badge */}
                        <div className={`p-2 rounded-lg border text-[11px] leading-snug ${
                          isUpgradeNeeded || recorderItem
                            ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200"
                            : "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200"
                        }`}>
                          {isUpgradeNeeded || recorderItem ? (
                            <div>
                              <p className="font-bold flex items-center gap-1">
                                <span>⚠️</span>
                                <span>{t("adm_jb_ext_upg_title", "नया रिकॉर्डर अपग्रेड शामिल:")}</span>
                              </p>
                              <p className="text-[10px] mt-0.5 opacity-90">
                                {existingChannels > 0 ? (
                                  t("adm_jb_ext_upg_desc", "{new} नए + {old} चालू = कुल {total} कैमरे। पुराने {ch}-चैनल DVR की क्षमता कम होने से कोटेशन में नया {rec} शामिल है।", {
                                    new: String(totalCameras),
                                    old: String(existingWorkingCameras),
                                    total: String(totalCombinedCameras),
                                    ch: String(existingChannels),
                                    rec: recorderItem?.display_name || recorderItem?.name || "16-Ch DVR"
                                  })
                                ) : (
                                  t("adm_jb_ext_upg_desc_gen", "कुल {total} कैमरों के लिए BOM में नया {rec} शामिल किया गया है।", {
                                    total: String(totalCameras),
                                    rec: recorderItem?.display_name || recorderItem?.name || "रिकॉर्डर"
                                  })
                                )}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-bold flex items-center gap-1">
                                <span>✅</span>
                                <span>{t("adm_jb_ext_compat_title", "मौजूदा रिकॉर्डर कम्पैटिबल (₹0 अतिरिक्त खर्च):")}</span>
                              </p>
                              <p className="text-[10px] mt-0.5 opacity-90">
                                {t("adm_jb_ext_compat_desc", "{new} नए कैमरे पुराने {ch}-चैनल रिकॉर्डर में आसानी से फिट हो जाएंगे ({rem} पोर्ट शेष रहेंगे)।", {
                                  new: String(totalCameras),
                                  ch: String(existingChannels),
                                  rem: String(Math.max(0, spareChannels - totalCameras))
                                })}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Storage Note if Addon */}
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <span>💾</span>
                          <span>
                            {retainStorage
                              ? t("adm_jb_ext_stor_reused", "स्टोरेज: ग्राहक का पुराना हार्ड डिस्क उपयोग होगा (नया HDD चार्ज ₹0)")
                              : t("adm_jb_ext_stor_new", "स्टोरेज: नए व पुराने सभी {total} कैमरों के बैकअप हेतु नई सर्विलांस HDD शामिल", { total: String(totalCombinedCameras) })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold">{t("adm_jb_ceil_lbl", "सीलिंग की ऊंचाई:")}</p>
                    <p className="font-medium text-[11px] text-zinc-700 dark:text-zinc-300">{ceilingLabel}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-semibold">{t("adm_jb_surf_lbl", "दीवार का प्रकार:")}</p>
                    <p className="font-medium text-[11px] text-zinc-700 dark:text-zinc-300 truncate" title={surfaceLabel}>{surfaceLabel}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 2: Camera Distribution & Placement */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-2.5">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-xs flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                  <Camera className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  {t("adm_jb_box2_title", "कैमरा विभाजन व कवरेज")}
                </span>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-950 px-2 py-0.5 rounded-md">
                  {totalCameras} {t("adm_qvh_units", "Units")}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {/* Visual Ratio Bar */}
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden flex">
                  {outdoorBullets > 0 && (
                    <div 
                      className="bg-emerald-500 h-full" 
                      style={{ width: `${(outdoorBullets / Math.max(1, totalCameras)) * 100}%` }}
                      title={`Outdoor Bullets: ${outdoorBullets}`}
                    />
                  )}
                  {indoorDomes > 0 && (
                    <div 
                      className="bg-blue-500 h-full" 
                      style={{ width: `${(indoorDomes / Math.max(1, totalCameras)) * 100}%` }}
                      title={`Indoor Domes: ${indoorDomes}`}
                    />
                  )}
                  {wirelessCameras > 0 && (
                    <div 
                      className="bg-amber-500 h-full" 
                      style={{ width: `${(wirelessCameras / Math.max(1, totalCameras)) * 100}%` }}
                      title={`Wireless/4G: ${wirelessCameras}`}
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60">
                    <p className="text-muted-foreground font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      {t("adm_jb_cam_outdoor", "आउटडोर बुलेट:")}
                    </p>
                    <p className="text-sm font-black text-foreground mt-0.5">{outdoorBullets} पीस</p>
                    <span className="text-[10px] text-muted-foreground">🌧️ IP67 वेदरप्रूफ</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60">
                    <p className="text-muted-foreground font-medium flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                      {t("adm_jb_cam_indoor", "इनडोर डोम:")}
                    </p>
                    <p className="text-sm font-black text-foreground mt-0.5">{indoorDomes} पीस</p>
                    <span className="text-[10px] text-muted-foreground">🏠 सीलिंग माउंट</span>
                  </div>
                </div>

                {wirelessCameras > 0 && (
                  <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between text-[11px]">
                    <span className="font-medium text-muted-foreground flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      {t("adm_jb_cam_wifi", "स्मार्ट वायरलेस / 4G:")}
                    </span>
                    <span className="font-black text-foreground">{wirelessCameras} पीस (360° PTZ)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Box 3: Brand, Resolution & Special Features */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-2.5">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-xs flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                  <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                  {t("adm_jb_box3_title", "ब्रांड, स्पष्टता व खास फीचर्स")}
                </span>
                <span className="text-xs font-black text-blue-700 dark:text-blue-300 bg-blue-100/70 dark:bg-blue-950 px-2 py-0.5 rounded-md">
                  {activeBrand}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">{t("adm_jb_res_lbl", "कैमरा रेजोल्यूशन:")}</span>
                  <span className="font-black text-foreground text-sm">{activeResolution}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-semibold">{t("adm_drw_tech", "टेक्नोलॉजी:")}</span>
                  <span className="font-bold text-zinc-800 dark:text-zinc-200">{techLabel}</span>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold mb-1">{t("adm_jb_feat_lbl", "चुने गए हार्डवेयर फीचर्स:")}</p>
                  <div className="flex flex-wrap gap-1">
                    {hasAudio && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                        <Volume2 className="w-3 h-3 shrink-0" />
                        {t("adm_jb_ft_mic", "ऑडियो माइक (Mic)")}
                      </span>
                    )}
                    {hasColorNight && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 text-[10px] font-bold">
                        <SunMedium className="w-3 h-3 shrink-0" />
                        {t("adm_jb_ft_color", "फुल-कलर नाइट")}
                      </span>
                    )}
                    {hasPTZ && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 text-[10px] font-bold">
                        <RotateCw className="w-3 h-3 shrink-0" />
                        {t("adm_jb_ft_ptz", "360° PTZ रोटेशन")}
                      </span>
                    )}
                    {hasTwoWay && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 text-[10px] font-bold">
                        <Radio className="w-3 h-3 shrink-0" />
                        {t("adm_jb_ft_twoway", "2-Way ऑडियो टॉक")}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 text-[10px] font-bold">
                      🌧️ IP67 वेदरप्रूफ
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Box 4: Storage & Recording Retention */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-2.5">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-xs flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                  <HardDrive className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  {t("adm_jb_box4_title", "रिकॉर्डिंग बैकअप व हार्ड डिस्क")}
                </span>
                <span className="text-xs font-black text-purple-700 dark:text-purple-300 bg-purple-100/70 dark:bg-purple-950 px-2 py-0.5 rounded-md">
                  {storageDays} {t("adm_qm_days_suffix", "Days")}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold">{t("adm_jb_stor_dev_lbl", "स्टोरेज हार्डवेयर ड्राइव:")}</p>
                  <p className="font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 leading-snug">{storageHardwareTitle}</p>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-[11px] text-emerald-900 dark:text-emerald-200">
                  <p className="font-bold flex items-center gap-1">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {t("adm_jb_gen_hdd_tag", "100% असली 24×7 सर्विलांस ड्राइव")}
                  </p>
                  <p className="text-[10px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                    {t("adm_jb_hdd_guar", "वेस्टर्न डिजिटल पर्पल / तोशिबा S300 / सीगेट स्काईहॉक • 3 साल वारंटी")}
                  </p>
                </div>
              </div>
            </div>

            {/* Box 5: Cabling & Wiring (WITH EXACT METERS SELECTED!) */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-2.5">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-xs flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                  <Cable className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  {t("adm_jb_box5_title", "वायरिंग, केबल व साइट स्थिति")}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${cablingDone ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-cyan-100 text-cyan-800 dark:bg-cyan-950 dark:text-cyan-200"}`}>
                  {cablingDone ? t("adm_jb_wire_done_tag", "✓ वायरिंग तैयार") : t("adm_jb_wire_new_tag", "नई केबलिंग शामिल")}
                </span>
              </div>
              <div className="space-y-2 text-xs">
                {/* Actual Meters Highlight */}
                {!cablingDone ? (
                  <div className="p-2.5 rounded-lg bg-cyan-50/80 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/60">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-cyan-900 dark:text-cyan-200">
                        {t("adm_jb_cabl_mtr_sel", "चुनी गई वास्तविक केबल दूरी:")}
                      </span>
                      <span className="text-sm font-black text-cyan-700 dark:text-cyan-300">
                        {actualCableMeters} {t("wz_meters", "मीटर")}
                      </span>
                    </div>
                    <p className="text-[10px] text-cyan-800 dark:text-cyan-300 mt-0.5">
                      • औसत दूरी: <span className="font-bold">~{avgMetersPerCam} मीटर</span> प्रति कैमरा {isCustomCableMeters ? `(मानक 15m कोटे से +${Math.max(0, actualCableMeters - standardLimitMeters)}m अतिरिक्त)` : "(मानक कोटा)"}
                    </p>
                    <p className="text-[10px] text-cyan-700 dark:text-cyan-400 mt-1 font-medium border-t border-cyan-200/60 dark:border-cyan-800/40 pt-1">
                      📦 BOM पैकेजिंग: <span className="font-bold text-foreground">{bundleCount90m > 0 ? `${bundleCount90m} बंडल (90m प्रत्येक) + ${openMeters}m खुला तार` : `${actualCableMeters}m शुद्ध तांबा तार`}</span>
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                    <p className="font-bold text-emerald-900 dark:text-emerald-200">
                      ✓ कंसील्ड वायरिंग पहले से तैयार है
                    </p>
                    <p className="text-[10px] text-emerald-800 dark:text-emerald-300 mt-0.5">
                      ग्राहक ने पुष्टि की है कि साइट पर केबलिंग तैयार है (अतिरिक्त तार शुल्क शून्य)
                    </p>
                  </div>
                )}

                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold">{t("adm_jb_pwr_stat_lbl", "पावर सॉकेट स्थिति:")}</p>
                  <p className="font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">{powerWiringLabel}</p>
                </div>
                <div className="pt-0.5 text-[10px] text-muted-foreground flex items-center gap-1 flex-wrap">
                  <span>✓ 100% प्योर कॉपर</span>
                  <span>•</span>
                  <span>✓ BNC कनेक्टर्स</span>
                  <span>•</span>
                  <span>✓ DC पिन</span>
                  <span>•</span>
                  <span>✓ PVC जंक्शन बॉक्स</span>
                </div>
              </div>
            </div>

            {/* Box 6: Internet, Remote Viewing & Urgency */}
            <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-800/40 space-y-2.5">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-xs flex items-center gap-1.5 text-zinc-900 dark:text-zinc-100">
                  <Wifi className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  {t("adm_jb_box6_title", "इंटरनेट, मोबाइल ऐप व टाइमलाइन")}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${isUrgent ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200" : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200"}`}>
                  {isUrgent ? "⚡ ASAP" : "Normal"}
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold">{t("adm_jb_net_lbl", "इंटरनेट / ब्रॉडबैंड:")}</p>
                  <p className="font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">{broadbandLabel}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold">{t("adm_jb_app_lbl", "फोन पर लाइव व्यू:")}</p>
                  <p className="font-semibold text-emerald-700 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    {remoteViewingRequested ? t("adm_jb_app_ok", "फ्री मोबाइल ऐप सेटअप सक्रिय (Hik-Connect / gCMOB)") : t("adm_jb_app_no", "लोकल टीवी / मॉनिटर व्यू")}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground font-semibold">{t("adm_jb_urg_lbl", "लगाने की टाइमलाइन:")}</p>
                  <p className="font-black text-foreground mt-0.5">{timelineLabel}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Section: Customer Behavioral Intent vs Pricing Engine Automated Fulfillment */}
          <div className="rounded-xl border border-indigo-200 dark:border-indigo-900/60 overflow-hidden bg-white dark:bg-zinc-900">
            <div className="p-3 bg-gradient-to-r from-indigo-50/80 via-blue-50/40 to-slate-50/60 dark:from-indigo-950/40 dark:via-zinc-900 dark:to-zinc-900 border-b border-indigo-100 dark:border-indigo-900/40 flex items-center justify-between">
              <span className="font-bold text-xs sm:text-sm text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4 text-indigo-600 shrink-0" />
                {t("adm_jb_comp_title", "ग्राहक व्यवहार (कैटलॉग फिल्टर) बनाम प्राइसिंग इंजन समाधान (Customer Intent vs Engine Fulfillment)")}
              </span>
              <button
                type="button"
                onClick={() => setShowBehavioralComparison(!showBehavioralComparison)}
                className="text-xs text-indigo-700 dark:text-indigo-300 font-bold hover:underline"
              >
                {showBehavioralComparison ? "समेटें ▲" : "देखें ▼"}
              </button>
            </div>

            {showBehavioralComparison && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800">
                
                {/* Column 1: Customer Behavioral Intent */}
                <div className="space-y-2.5 pr-0 md:pr-2">
                  <div className="flex items-center gap-1.5 text-blue-900 dark:text-blue-300 font-bold text-xs uppercase tracking-wider pb-1 border-b">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>ग्राहक द्वारा चुने गए विकल्प (Customer Behavioral Actions):</span>
                  </div>
                  
                  <ul className="space-y-1.5 text-[11px] text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold shrink-0">•</span>
                      <span><strong className="text-foreground">विजार्ड पाथ:</strong> {sourceLabel} (गाइडेड फ्लो)</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold shrink-0">•</span>
                      <span><strong className="text-foreground">परिसर व सेटअप:</strong> {propertyInfo.title.split("(")[0]} ({instTypeLabel})</span>
                    </li>
                    {isAddon && (
                      <li className="flex items-start gap-1.5 p-1.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
                        <span className="text-blue-600 font-bold shrink-0">•</span>
                        <div>
                          <strong className="text-foreground">मौजूदा सिस्टम इनपुट (Wizard Step 2):</strong>
                          {existingChannels > 0 ? (
                            <span className="block mt-0.5 text-blue-950 dark:text-blue-200 font-medium">
                              {existingTechLabel} • {existingChannels}-चैनल रिकॉर्डर • {existingWorkingCameras} चालू कैमरे ({spareChannels} खाली पोर्ट उपलब्ध)
                            </span>
                          ) : existingSystemKnown === false ? (
                            <span className="block mt-0.5 text-amber-700 dark:text-amber-300 font-medium">
                              तकनीकी स्पेसिफिकेशन्स अज्ञात (साइट सर्वे / कम्पैटिबिलिटी चेक रिक्वेस्ट दर्ज)
                            </span>
                          ) : (
                            <span className="block mt-0.5 text-blue-950 dark:text-blue-200 font-medium">
                              मौजूदा सिस्टम विस्तार (Add-on Mode)
                            </span>
                          )}
                        </div>
                      </li>
                    )}
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold shrink-0">•</span>
                      <span><strong className="text-foreground">कैमरा कॉन्फ़िगरेशन:</strong> {totalCameras} नए कैमरे ({outdoorBullets} आउटडोर बुलेट + {indoorDomes} इनडोर){isAddon && existingWorkingCameras > 0 ? ` + ${existingWorkingCameras} पुराने = ${totalCombinedCameras} कुल सक्रिय` : ""}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold shrink-0">•</span>
                      <span>
                        <strong className="text-foreground">केबलिंग स्थिति:</strong>{" "}
                        <span className="font-bold text-blue-700 dark:text-blue-300">
                          {cablingDone ? "कंसील्ड वायरिंग तैयार (0m नया तार, ₹0 केबल शुल्क)" : `${actualCableMeters} मीटर (~${avgMetersPerCam}m प्रति कैमरा)`}
                        </span>
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold shrink-0">•</span>
                      <span><strong className="text-foreground">स्टोरेज रिटेंशन चयन:</strong> {storageDays} दिन बैकअप {isAddon && retainStorage ? "(पुराना HDD रीयूज)" : ""}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold shrink-0">•</span>
                      <span><strong className="text-foreground">कैटलॉग ब्रांड फिल्टर:</strong> <span className="font-black text-indigo-700 dark:text-indigo-300">{activeBrand}</span> टैब पर क्लिक किया</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold shrink-0">•</span>
                      <span><strong className="text-foreground">कैटलॉग रेजोल्यूशन चयन:</strong> {activeResolution}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold shrink-0">•</span>
                      <span><strong className="text-foreground">फीचर टॉगल:</strong> {hasAudio ? "✓ इन-बिल्ट ऑडियो माइक (Mic) इनेबल" : "मानक वीडियो"} {hasColorNight ? "• ✓ कलर नाइट" : ""}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-blue-600 font-bold shrink-0">•</span>
                      <span><strong className="text-foreground">टाइमलाइन व लोकेशन:</strong> {timelineLabel} • {pincode ? `${pincode} (${city})` : city}</span>
                    </li>
                  </ul>
                </div>

                {/* Column 2: Pricing Engine Automated Fulfillment */}
                <div className="space-y-2.5 pt-3 md:pt-0 pl-0 md:pl-4">
                  <div className="flex items-center gap-1.5 text-emerald-900 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider pb-1 border-b">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>प्राइसिंग इंजन का समाधान (Engine Automated BOM):</span>
                  </div>

                  <ul className="space-y-1.5 text-[11px] text-zinc-700 dark:text-zinc-300">
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span><strong className="text-foreground">कैमरा हार्डवेयर:</strong> {cameraItems[0]?.display_name || cameraItems[0]?.name || `${totalCameras}x ${activeBrand} ${activeResolution}`} ({totalCameras} पीस)</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span>
                        <strong className="text-foreground">DVR / NVR निर्णय:</strong>{" "}
                        {recorderItem ? (
                          <span className="font-semibold text-emerald-950 dark:text-emerald-200">
                            {recorderItem.display_name || recorderItem.name} {isAddon && existingChannels > 0 ? `(अपग्रेड: कुल ${totalCombinedCameras} कैमरों के लिए पुराना ${existingChannels}-Ch DVR छोटा था)` : ""}
                          </span>
                        ) : (
                          <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                            {isAddon && existingChannels > 0 ? `मौजूदा ${existingChannels}-चैनल रिकॉर्डर का रीयूज (नया DVR शुल्क ₹0 — ग्राहक की बचत)` : "कोई नया रिकॉर्डर आवश्यक नहीं"}
                          </span>
                        )}
                      </span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span><strong className="text-foreground">स्टोरेज ड्राइव:</strong> {storageHardwareTitle} (3 साल वारंटी){isAddon && retainStorage ? " [ग्राहक की पुरानी HDD रीयूज]" : ""}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span><strong className="text-foreground">केबल पैकेजिंग:</strong> <span className="font-bold text-emerald-700 dark:text-emerald-300">{cablingDone ? "कंसील्ड केबलिंग (₹0 नया तार)" : (bundleCount90m > 0 ? `${bundleCount90m} बंडल (90m = ${bundleCount90m * 90}m) + ${openMeters}m खुला तार = ${actualCableMeters}m कुल` : `${actualCableMeters}m शुद्ध तांबा`)}</span></span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span><strong className="text-foreground">पावर सप्लाई:</strong> {items.find(i => (i.name || "").includes("SMPS") || (i.name || "").includes("Power"))?.display_name || (isWireless ? "12V पावर एडेप्टर्स" : (isIP ? "PoE स्विच / पावर" : "12V सेंट्रलाइज्ड SMPS"))}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span><strong className="text-foreground">एक्सेसरीज:</strong> BNC कनेक्टर्स ({totalCameras * 2}) + DC पिन ({totalCameras}) + PVC वेदरप्रूफ बॉक्स ({totalCameras})</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span><strong className="text-foreground">इंस्टॉलेशन व फिटिंग:</strong> {cablingDone ? `${totalCameras}x माउंटिंग व मौजूदा केबलिंग टर्मिनेशन` : `${totalCameras}x फुल टर्नकी वायरिंग, माउंटिंग व ऐप सेटअप`}</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold shrink-0">✓</span>
                      <span><strong className="text-foreground">18% GST समाधान:</strong> ₹{totalPayable.toLocaleString("en-IN")} कुल देय (18% टैक्स सहित, ₹0 हिडन)</span>
                    </li>
                  </ul>
                </div>

              </div>
            )}
          </div>

          {/* Quick Telecaller Pitch Summary Box */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-amber-50/80 via-orange-50/40 to-yellow-50/60 dark:from-amber-950/30 dark:via-zinc-800 dark:to-zinc-800 border border-amber-200 dark:border-amber-900/60 text-xs space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="font-black text-amber-900 dark:text-amber-300 flex items-center gap-1.5 text-xs sm:text-sm">
                <PhoneCall className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                {t("adm_jb_pitch_card_t", "💡 टेलीकॉलर / सेल्स एडवाइजर सारांश (कॉल करने से पहले एक नजर देखें):")}
              </span>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopyPitch}
                className="h-7 px-2 text-[11px] font-bold text-amber-800 dark:text-amber-200 hover:bg-amber-100/60 dark:hover:bg-amber-900/40"
              >
                {copied ? <Check className="w-3 h-3 mr-1 text-emerald-600" /> : <Copy className="w-3 h-3 mr-1" />}
                <span>{copied ? "कॉपी हो गया!" : "कॉल सारांश कॉपी"}</span>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] pt-1">
              <div className="bg-white/80 dark:bg-zinc-900/80 p-2 rounded-lg border border-amber-100 dark:border-amber-900/40">
                <p className="text-muted-foreground font-medium">परिसर व सेटअप</p>
                <p className="font-bold text-foreground truncate mt-0.5">{propertyInfo.title.split("(")[0]} • {isAddon ? "सिस्टम विस्तार" : "नया"}</p>
              </div>
              <div className="bg-white/80 dark:bg-zinc-900/80 p-2 rounded-lg border border-amber-100 dark:border-amber-900/40">
                <p className="text-muted-foreground font-medium">{isAddon ? "कैमरा व मौजूदा स्टेटस" : "कैमरा व ब्रांड"}</p>
                <p className="font-bold text-foreground truncate mt-0.5">
                  {totalCameras}x {activeBrand} {isAddon && existingChannels > 0 ? `(पुराना: ${existingChannels}Ch)` : `(${activeResolution.split(" ")[0]})`}
                </p>
              </div>
              <div className="bg-white/80 dark:bg-zinc-900/80 p-2 rounded-lg border border-amber-100 dark:border-amber-900/40">
                <p className="text-muted-foreground font-medium">{isAddon ? "रिकॉर्डर अपग्रेड निर्णय" : "केबल व दूरी"}</p>
                <p className="font-bold text-foreground truncate mt-0.5">
                  {isAddon ? (
                    recorderItem ? `⚠️ नया 16-Ch अपग्रेड` : `✅ पुराना DVR रीयूज`
                  ) : (
                    `${actualCableMeters}m (${cablingDone ? "कंसील्ड" : "कॉपर तार"})`
                  )}
                </p>
              </div>
              <div className="bg-white/80 dark:bg-zinc-900/80 p-2 rounded-lg border border-amber-100 dark:border-amber-900/40">
                <p className="text-muted-foreground font-medium">कुल कोटेशन (GST शामिल)</p>
                <p className="font-black text-emerald-600 truncate mt-0.5">₹{totalPayable.toLocaleString("en-IN")}</p>
              </div>
            </div>
          </div>

          {/* Technical JSON Inspector Toggle */}
          <div className="pt-1 text-right">
            <button
              type="button"
              onClick={() => setShowRawJson(!showRawJson)}
              className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline underline-offset-2"
            >
              {showRawJson ? "▲ तकनीकी डेटा छिपाएं (Hide Raw JSON)" : "▼ तकनीकी डेटा देखें (Inspect Raw Answers)"}
            </button>
            {showRawJson && (
              <div className="mt-2 text-left p-3 rounded-xl bg-zinc-900 text-zinc-100 text-[10px] font-mono overflow-x-auto max-h-60 border border-zinc-700">
                <pre>{JSON.stringify({ address: lead?.address, requirementSnapshot: req, wizard_answers: wz, selection: sel }, null, 2)}</pre>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
