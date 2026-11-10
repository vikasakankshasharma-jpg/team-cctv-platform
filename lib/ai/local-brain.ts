import { adminDb } from "@/lib/firebase-admin";

export interface BrainQAPair {
  id: string;
  category: "troubleshooting" | "specifications" | "policy" | "wiring" | "pricing";
  keywords: string[];
  question: string;
  answer: string;
  source: string;
  quickActions?: { label: string; action: "whatsapp" | "survey" | "amc" | "quote" }[];
}

export const CANONICAL_KNOWLEDGE: BrainQAPair[] = [
  // ─── 1. TROUBLESHOOTING ──────────────────────────────────────────────────────
  {
    id: "trouble_dvr_beeping",
    category: "troubleshooting",
    keywords: ["dvr beeping", "nvr beeping", "beeping sound", "recorder beeping", "continuous beep", "hdd error"],
    question: "Why is my DVR or NVR beeping continuously?",
    answer: "Continuous beeping usually indicates one of three common issues:\n\n1. **Hard Drive (HDD) Error**: If the hard disk is new, unformatted, or failing, the DVR buzzes to alert you. Fix: Go to **Menu > Storage / HDD Management**, select the disk, and click **Format / Init**.\n2. **Video Loss / Camera Disconnected**: If a configured camera loses signal, the buzzer triggers. Fix: Check if any camera shows black screen or check loose BNC/LAN cables.\n3. **IP Conflict / Network Disconnected**: Fix: Go to **Menu > System > Exception** and turn off the buzzer for 'Network Disconnected' or resolve the IP conflict.\n\nNeed technician assistance? Tap below to WhatsApp our emergency team.",
    source: "TEAM CCTV User Guide (Section 4.1: Exception Alarms)",
    quickActions: [
      { label: "Chat on WhatsApp", action: "whatsapp" },
      { label: "Book Service Visit", action: "survey" },
    ],
  },
  {
    id: "trouble_app_offline",
    category: "troubleshooting",
    keywords: ["app offline", "hik-connect offline", "cp plus offline", "gcmob offline", "dmss offline", "phone view not working", "can't view on mobile", "device offline"],
    question: "Why does my CCTV app show 'Device Offline' on my phone?",
    answer: "When your mobile app shows 'Offline', follow these quick diagnostics:\n\n1. **Check LAN Port Lights**: Look behind your DVR/NVR. Are the green and amber LEDs on the Ethernet (LAN) port blinking? If dark, reseat or replace the LAN cable.\n2. **Reboot Wi-Fi Router**: 70% of offline issues resolve after power-cycling the Internet router.\n3. **Verify DHCP Settings**: On the DVR monitor, go to **Menu > Configuration > Network**. Ensure **DHCP is enabled** so the router assigns a valid IP.\n4. **Check Platform Access**: Go to **Network > Advanced > Platform Access** (Hik-Connect / Guarding Vision / InstaOn). Ensure status shows **'Online'**.\n\nIf it still stays offline, your ISP might be blocking DNS. Set Primary DNS to `8.8.8.8` and Secondary to `8.8.4.4`.",
    source: "TEAM CCTV User Guide (Section 5: Cloud Networking)",
    quickActions: [
      { label: "WhatsApp Technician", action: "whatsapp" },
    ],
  },
  {
    id: "trouble_forgot_password",
    category: "troubleshooting",
    keywords: ["forgot password", "reset password", "admin password", "password reset", "dvr locked", "pattern forgotten", "sadp tool"],
    question: "How do I reset my forgotten DVR/NVR password?",
    answer: "For security reasons, modern CCTV recorders cannot be reset with a generic master code. Here is the official reset process:\n\n1. **Hikvision / HiLook**: Download the official **SADP Tool** on a PC connected to the same Wi-Fi router. Select your DVR, click **'Forgot Password'**, and export the `.xml` secret key file. Send this file to our team for a reset code.\n2. **CP Plus / Dahua**: On the physical monitor login screen, click the **'?' icon** or 'Forgot Pattern'. A QR code will appear. Scan it using the registered mobile app or send a photo to our support.\n3. **Do NOT power off the DVR** during the reset procedure, as dynamic reset tokens expire upon reboot.",
    source: "TEAM CCTV Official Security Protocol",
    quickActions: [
      { label: "Send Reset Request on WhatsApp", action: "whatsapp" },
    ],
  },
  {
    id: "trouble_black_screen",
    category: "troubleshooting",
    keywords: ["black screen", "no video", "camera not showing", "video loss", "blank screen", "camera black"],
    question: "Why is one of my cameras showing a black screen with 'No Video'?",
    answer: "Single camera video loss is usually caused by physical connection or power supply issues:\n\n1. **Power Supply (12V DC)**: Check if the camera power adapter or central SMPS power channel is functioning. Cover the camera lens with your hand—do the red IR LEDs glow? If not, the camera has no power.\n2. **Connector Check**: For HD cameras, gently twist the **BNC connector** at the DVR back panel and camera junction box. For IP cameras, check if the RJ45 port LED on the PoE switch is glowing.\n3. **Resolution Mismatch**: If you plugged a new 5MP camera into an older 2MP (1080p) DVR, the DVR cannot decode it and displays black. Check DVR specifications.",
    source: "TEAM CCTV Technical Handbook (Section 3: Hardware Diagnostics)",
    quickActions: [
      { label: "Book Camera Inspection", action: "survey" },
    ],
  },

  // ─── 2. SPECIFICATIONS & PLANNING ──────────────────────────────────────────
  {
    id: "spec_2mp_vs_5mp",
    category: "specifications",
    keywords: ["2mp vs 5mp", "resolution difference", "which camera is best", "4mp vs 5mp", "megapixel comparison", "image clarity"],
    question: "What is the difference between 2MP, 4MP, and 5MP cameras?",
    answer: "Here is our engineer's recommendation:\n\n• **2MP (1080p Full HD)**: Excellent for indoor rooms, small offices, and billing counters where viewing distance is within 4–6 meters. Highly cost-effective.\n• **4MP / 5MP (Ultra HD / 2K+)**: Ideal for shop fronts, street gates, parking areas, and cash registers. Allows zooming in to read vehicle number plates and clear facial details up to 12–18 meters.\n• **Night Vision Type**: We strongly recommend **Color / Starlight (Dual Light)** cameras over traditional black-and-white IR so you get full color footage 24/7 even in total darkness.",
    source: "TEAM CCTV Master Product Catalog",
    quickActions: [
      { label: "Generate Instant Quote", action: "quote" },
    ],
  },
  {
    id: "spec_storage_calculation",
    category: "specifications",
    keywords: ["how much storage", "hdd recording days", "hard drive calculation", "1tb recording days", "2tb recording days", "4tb storage"],
    question: "How many days will a 1TB, 2TB, or 4TB hard drive record for?",
    answer: "With modern **H.265+ smart compression** at 15–20 fps, here is the standard recording duration:\n\n• **4 Cameras (2MP - 4MP)**:\n  - 1TB HDD: ~12 to 15 Days\n  - 2TB HDD: ~25 to 30 Days\n\n• **8 Cameras (2MP - 4MP)**:\n  - 2TB HDD: ~14 to 16 Days\n  - 4TB HDD: ~28 to 32 Days\n\n• **16 Cameras (2MP - 5MP)**:\n  - 4TB HDD: ~14 to 16 Days\n  - 8TB HDD: ~28 to 30 Days\n\n*Tip: Enabling Motion Detection recording can double or triple these recording periods.*",
    source: "TEAM CCTV Storage Calculation Engine",
    quickActions: [
      { label: "Calculate Custom Package", action: "quote" },
    ],
  },
  {
    id: "spec_cat6_vs_coaxial",
    category: "wiring",
    keywords: ["cat6 vs coaxial", "ip camera vs hd camera", "3+1 wire", "cat6 distance", "poe distance", "wiring limit"],
    question: "What cable should I use: CAT6 network cable or 3+1 coaxial wire?",
    answer: "• **CAT6 Solid Copper (IP CCTV)**: Best for new homes, modern offices, and commercial sites. One single cable carries high-definition video, audio, and power (PoE) up to 90–100 meters without signal drop.\n• **3+1 Coaxial (HD Analog CCTV)**: Budget-friendly and reliable for distances up to 60–75 meters. Runs composite video with separate power and audio wires.\n• **Important Installation Rule**: TEAM CCTV strictly uses **100% Solid Copper wiring** (never copper-clad aluminum/CCA) to prevent voltage drop and oxidation over 5+ years.",
    source: "TEAM CCTV Cabling Quality Standards",
  },

  // ─── 3. POLICIES & AMC ──────────────────────────────────────────────────────
  {
    id: "policy_warranty",
    category: "policy",
    keywords: ["warranty period", "guarantee", "brand warranty", "how much warranty", "replacement warranty", "camera warranty"],
    question: "What is the warranty policy on TEAM CCTV installations?",
    answer: "All installations through TEAM CCTV include:\n\n1. **2-Year Official Brand Manufacturer Warranty** on all CP Plus, Hikvision, and Dahua Cameras, DVRs, and NVRs.\n2. **1-Year Warranty on Central Power Supplies / SMPS**.\n3. **2-Year to 3-Year Warranty on Surveillance Hard Drives** (Seagate SkyHawk / WD Purple).\n4. **On-Site Installation Support**: If any hardware develops a manufacturing defect, our technician visits your site to service or replace it under warranty terms.",
    source: "TEAM CCTV Standard Terms of Service",
    quickActions: [
      { label: "View Warranty Terms", action: "amc" },
    ],
  },
  {
    id: "policy_amc_contracts",
    category: "policy",
    keywords: ["amc plan", "annual maintenance", "amc cost", "amc pricing", "maintenance contract", "service renewal"],
    question: "What is included in the Annual Maintenance Contract (AMC)?",
    answer: "Our AMC packages keep your security system operating at 100% efficiency year-round:\n\n• **Quarterly Preventive Maintenance**: Lens cleaning, focus calibration, angle realignment, and weather-proofing checks.\n• **HDD Health & Recording Verification**: Routine bad-sector audits to ensure critical footage is never lost.\n• **Priority On-Demand Breakdown Visits**: Technician dispatched within guaranteed SLA response time.\n• **Labor-Free Fault Rectification**: Free connector replacements and wiring troubleshooting.\n\nWe offer **1-Year (5%), 2-Year (8%), and 3-Year (10%)** bundled AMC plans.",
    source: "TEAM CCTV AMC Service Guide",
    quickActions: [
      { label: "Renew or Buy AMC Plan", action: "amc" },
      { label: "Talk to Support", action: "whatsapp" },
    ],
  },
];

/**
 * Calculates keyword-semantic match score between user query and knowledge base.
 */
function scoreMatch(query: string, item: BrainQAPair): number {
  const qClean = query.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
  const qWords = qClean.split(/\s+/).filter(w => w.length > 2);

  let score = 0;

  // Exact keyword phrase matching (high priority)
  for (const kw of item.keywords) {
    if (qClean.includes(kw)) {
      score += 40;
    }
  }

  // Word token overlap
  for (const word of qWords) {
    if (item.keywords.some(kw => kw.includes(word))) {
      score += 10;
    }
    if (item.question.toLowerCase().includes(word)) {
      score += 5;
    }
  }

  return score;
}

/**
 * Queries the Local Autonomous Brain with ZERO external API calls and ₹0 cost.
 */
export async function queryLocalBrain(userQuery: string): Promise<{
  matched: boolean;
  answer?: string;
  source?: string;
  quickActions?: { label: string; action: string }[];
  score: number;
}> {
  if (!userQuery || userQuery.trim().length === 0) {
    return { matched: false, score: 0 };
  }

  let bestMatch: BrainQAPair | null = null;
  let highestScore = 0;

  // 1. Check Canonical Pre-seeded Knowledge
  for (const item of CANONICAL_KNOWLEDGE) {
    const score = scoreMatch(userQuery, item);
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  // Confidence threshold: Score >= 25 is a confident match
  if (highestScore >= 25 && bestMatch) {
    return {
      matched: true,
      answer: bestMatch.answer,
      source: bestMatch.source,
      quickActions: bestMatch.quickActions,
      score: highestScore,
    };
  }

  // 2. Check Firestore Learned Brain Cache (Student AI learned answers)
  try {
    const brainRef = adminDb.collection("ai_brain");
    const snapshot = await brainRef
      .where("approvedByAdmin", "==", true)
      .limit(20)
      .get();

    for (const doc of snapshot.docs) {
      const data = doc.data();
      const questionText = data.question || "";
      const qClean = userQuery.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
      const docClean = questionText.toLowerCase().replace(/[^a-z0-9\s]/g, " ");

      // Token overlap
      const words = qClean.split(/\s+/).filter(w => w.length > 3);
      let matchCount = 0;
      for (const w of words) {
        if (docClean.includes(w)) matchCount++;
      }

      const ratio = words.length > 0 ? matchCount / words.length : 0;
      if (ratio >= 0.6 && data.answer) {
        return {
          matched: true,
          answer: data.answer,
          source: "Learned Knowledge (Admin Approved)",
          score: Math.round(ratio * 50),
        };
      }
    }
  } catch (err) {
    console.warn("Learned brain cache query skipped:", err);
  }

  return { matched: false, score: highestScore };
}
