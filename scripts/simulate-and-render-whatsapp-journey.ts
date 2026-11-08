import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";
import { generateAllCatalogVariations } from "../lib/quotation/variant-generator";
import { ConfiguratorSelection, Product, Addon, AppSettings } from "../types";

// ─────────────────────────────────────────────────────────────────────────────
// 1. REPRODUCIBLE CATALOG FIXTURES & ENGINE CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

const mockSettings: AppSettings = {
  company_name: "TEAM CCTV",
  gst_rate: 18,
  labor_fitting_only_rate: 300,
  labor_full_installation_rate: 500,
  labor_hd_fitting_only: 200,
  labor_ip_fitting_only: 300,
  labor_no_cabling_visit_charge: 500,
  labor_no_cabling_small_job_threshold: 2,
  labor_no_cabling_small_job_rate: 500,
  labor_ip_per_camera: 500,
  labor_hd_per_camera: 400,
  cable_copper_coated_ip: 12,
  cable_copper_coated_hd: 8,
  connector_rj45_cost: 5,
  connector_bnc_dc_cost: 20,
  visit_charge: 500,
  amc_1yr_pct: 15,
  max_supported_cameras: 16,
  brand_tabs_order: ["all", "budget", "cpplus", "hikvision", "dahua"],
} as any;

const mockProducts: Product[] = [
  // Budget HD & IP
  {
    id: "cam_budget_ip_2mp",
    display_name: "Budget 2MP IP Bullet Camera",
    technical_name: "Budget 2MP IP Weatherproof IR Bullet",
    brand: "Budget Brand",
    category: "cctv_camera",
    technology: "IP",
    technologies: ["IP"],
    resolution_mp: 2,
    camera_type: "bullet",
    unit_price: 1350,
    base_cost: 1000,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
  },
  {
    id: "rec_budget_nvr_4ch",
    display_name: "Budget 4 Channel 4K NVR",
    technical_name: "Budget 4Ch Network Video Recorder",
    brand: "Budget Brand",
    category: "recorder",
    technology: "IP",
    technologies: ["IP"],
    channel_count: 4,
    channels: 4,
    max_cameras: 4,
    max_resolution_supported_mp: 8,
    unit_price: 3200,
    base_cost: 2400,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
  },

  // CP Plus IP Camera & NVR
  {
    id: "cam_cpplus_ip_3mp",
    display_name: "CP Plus 3MP Guard+ IP Bullet Camera",
    technical_name: "CP Plus 3MP IP Bullet with Color Night Vision",
    brand: "CP Plus",
    category: "cctv_camera",
    technology: "IP",
    technologies: ["IP"],
    resolution_mp: 3,
    camera_type: "bullet",
    unit_price: 1850,
    base_cost: 1400,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
  },
  {
    id: "rec_cpplus_nvr_4ch",
    display_name: "CP Plus 4 Channel 4K NVR",
    technical_name: "CP Plus 4Ch Smart IP NVR",
    brand: "CP Plus",
    category: "recorder",
    technology: "IP",
    technologies: ["IP"],
    channel_count: 4,
    channels: 4,
    max_cameras: 4,
    max_resolution_supported_mp: 8,
    unit_price: 3800,
    base_cost: 2900,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
  },

  // Hikvision IP Camera & NVR
  {
    id: "cam_hik_ip_3mp",
    display_name: "Hikvision 3MP ColorVu IP Bullet Camera",
    technical_name: "Hikvision 3MP IP Bullet Full Color 24/7",
    brand: "Hikvision",
    category: "cctv_camera",
    technology: "IP",
    technologies: ["IP"],
    resolution_mp: 3,
    camera_type: "bullet",
    unit_price: 2150,
    base_cost: 1650,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
  },
  {
    id: "rec_hik_nvr_4ch",
    display_name: "Hikvision 4 Channel 4K NVR",
    technical_name: "Hikvision 4Ch Embedded NVR",
    brand: "Hikvision",
    category: "recorder",
    technology: "IP",
    technologies: ["IP"],
    channel_count: 4,
    channels: 4,
    max_cameras: 4,
    max_resolution_supported_mp: 8,
    unit_price: 4200,
    base_cost: 3200,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
  },

  // Dahua IP Camera & NVR
  {
    id: "cam_dahua_ip_3mp",
    display_name: "Dahua 3MP Starlight IP Bullet Camera",
    technical_name: "Dahua 3MP WizSense IP Bullet",
    brand: "Dahua",
    category: "cctv_camera",
    technology: "IP",
    technologies: ["IP"],
    resolution_mp: 3,
    camera_type: "bullet",
    unit_price: 1980,
    base_cost: 1500,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
  },
  {
    id: "rec_dahua_nvr_4ch",
    display_name: "Dahua 4 Channel 4K NVR",
    technical_name: "Dahua 4Ch Smart NVR",
    brand: "Dahua",
    category: "recorder",
    technology: "IP",
    technologies: ["IP"],
    channel_count: 4,
    channels: 4,
    max_cameras: 4,
    max_resolution_supported_mp: 8,
    unit_price: 3950,
    base_cost: 3000,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
  },

  // Storage
  {
    id: "hdd_1tb",
    display_name: "Surveillance 1TB Hard Disk",
    technical_name: "Seagate SkyHawk / WD Purple 1TB Surveillance HDD",
    brand: "Seagate",
    category: "storage",
    technology: "Common",
    technologies: ["HD", "IP", "Common"],
    storage_type: "Surveillance HDD",
    storage_capacity_tb: 1,
    storage_tb: 1,
    capacity: "1TB",
    unit_price: 3850,
    base_cost: 3100,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
  },
  {
    id: "budget_hdd_500gb",
    display_name: "Surveillance 500GB Hard Disk",
    technical_name: "Budget Brand 500GB Surveillance HDD",
    brand: "Budget Brand",
    category: "storage",
    technology: "Common",
    technologies: ["HD", "IP", "Common"],
    storage_type: "Surveillance HDD",
    storage_capacity_tb: 0.5,
    storage_tb: 0.5,
    capacity: "500GB",
    unit_price: 2646,
    base_cost: 1800,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
  },

  // Power / PoE Switch
  {
    id: "poe_4port",
    display_name: "4 Port PoE Switch + 2 Uplink",
    technical_name: "4 Port Fast Ethernet PoE Switch 10/100 Mbps",
    brand: "Common",
    category: "power_device" as any,
    technology: "IP",
    technologies: ["IP", "Common"],
    port_count: 4,
    ports: 4,
    unit_price: 1800,
    base_cost: 1300,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
  },

  // Cable
  {
    id: "cable_cat6",
    display_name: "CAT6 Network Cable (90M)",
    technical_name: "CAT6 Pure Copper UTP Cable 305M Roll / 90M",
    brand: "Common",
    category: "cable",
    technology: "IP",
    technologies: ["IP", "Common"],
    unit_price: 1800,
    base_cost: 1400,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
  },

  // Accessories
  {
    id: "acc_rj45",
    display_name: "RJ45 Modular Connectors",
    technical_name: "Gold Plated 8P8C RJ45 Connector",
    brand: "Common",
    category: "accessories",
    technology: "IP",
    technologies: ["IP"],
    unit_price: 10,
    base_cost: 5,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
  },
  {
    id: "acc_jbox",
    display_name: "PVC Weatherproof Camera Junction Box",
    technical_name: "4x4 Waterproof Camera Junction Box",
    brand: "Common",
    category: "accessories",
    technology: "Common",
    technologies: ["HD", "IP", "Common"],
    unit_price: 90,
    base_cost: 55,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
  }
];

const mockAddons: Addon[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// 2. WHATSAPP UI HTML TEMPLATE BUILDER WITH FULL LIST ROW VISIBILITY
// ─────────────────────────────────────────────────────────────────────────────

interface ListRow {
  id: string;
  title: string;
  desc?: string;
}

interface ListSection {
  title: string;
  rows: ListRow[];
}

interface ChatMessage {
  sender: "customer" | "bot";
  time: string;
  type: "text" | "buttons" | "list" | "document";
  text?: string;
  buttons?: { id: string; title: string }[];
  listHeader?: string;
  listButtonTitle?: string;
  listSections?: ListSection[];
  docTitle?: string;
  docSubtitle?: string;
}

function generateWhatsAppHtml(messages: ChatMessage[], currentTitle: string): string {
  const renderedMessages = messages.map(m => {
    if (m.sender === "customer") {
      return `
        <div class="message-row customer">
          <div class="bubble customer-bubble">
            <div class="bubble-text">${m.text?.replace(/\n/g, "<br>")}</div>
            <div class="bubble-meta">
              <span class="time">${m.time}</span>
              <span class="ticks">✓✓</span>
            </div>
          </div>
        </div>
      `;
    } else {
      let interactiveContent = "";

      if (m.type === "buttons" && m.buttons) {
        interactiveContent = `
          <div class="interactive-buttons">
            ${m.buttons.map(b => `<div class="wa-btn"><span class="btn-icon">🔘</span> ${b.title}</div>`).join("")}
          </div>
        `;
      } else if (m.type === "list") {
        interactiveContent = `
          <div class="interactive-list-card">
            <div class="list-card-header">
              <span class="list-icon">📋</span> ${m.listButtonTitle || "Select Option"}
            </div>
            ${m.listSections ? `
              <div class="list-rows-container">
                ${m.listSections.map(sec => `
                  ${sec.title ? `<div class="list-sec-title">${sec.title}</div>` : ""}
                  ${sec.rows.map(r => `
                    <div class="list-row-item">
                      <div class="row-radio">🔘</div>
                      <div class="row-details">
                        <div class="row-title">${r.title}</div>
                        ${r.desc ? `<div class="row-desc">${r.desc}</div>` : ""}
                      </div>
                    </div>
                  `).join("")}
                `).join("")}
              </div>
            ` : ""}
          </div>
        `;
      } else if (m.type === "document") {
        interactiveContent = `
          <div class="document-card">
            <div class="doc-icon-wrap">
              <span class="doc-badge">PDF</span>
            </div>
            <div class="doc-info">
              <div class="doc-title">${m.docTitle || "TEAM_CCTV_Quotation.pdf"}</div>
              <div class="doc-sub">${m.docSubtitle || "245 kB • 7-Day Price Lock Guaranteed"}</div>
            </div>
            <div class="doc-download-btn">⬇</div>
          </div>
        `;
      }

      return `
        <div class="message-row bot">
          <div class="bubble bot-bubble">
            ${m.text ? `<div class="bubble-text">${m.text.replace(/\*(.*?)\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>")}</div>` : ""}
            ${interactiveContent}
            <div class="bubble-meta">
              <span class="time">${m.time}</span>
            </div>
          </div>
        </div>
      `;
    }
  }).join("");

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${currentTitle}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        body {
          background-color: #0b141a;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 24px;
          min-height: 100vh;
        }
        .phone-frame {
          width: 450px;
          background: #EFEAE2;
          background-image: radial-gradient(#d5cdc4 1px, transparent 1px);
          background-size: 16px 16px;
          border-radius: 40px;
          overflow: hidden;
          box-shadow: 0 25px 60px -15px rgba(0,0,0,0.7), 0 0 0 12px #1f2c34;
          display: flex;
          flex-direction: column;
        }
        .phone-header {
          background: #008069;
          color: white;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
        }
        .avatar-wrap {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #005c4b;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: bold;
          font-size: 18px;
          color: #25D366;
          border: 2px solid #25d366;
        }
        .header-info {
          flex: 1;
        }
        .header-name {
          font-size: 16px;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .verified-badge {
          background: #25d366;
          color: #0b141a;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 900;
        }
        .header-status {
          font-size: 12px;
          color: #d1fae5;
          margin-top: 1px;
        }
        .chat-container {
          padding: 16px 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          min-height: 600px;
        }
        .partner-pill-banner {
          align-self: center;
          background: #fff3cd;
          color: #856404;
          border: 1px solid #ffeeba;
          padding: 6px 14px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 6px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.06);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .date-badge {
          align-self: center;
          background: #ffffffdd;
          color: #54656f;
          padding: 4px 12px;
          border-radius: 8px;
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 4px;
          box-shadow: 0 1px 1px rgba(0,0,0,0.05);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .message-row {
          display: flex;
          width: 100%;
        }
        .message-row.customer {
          justify-content: flex-end;
        }
        .message-row.bot {
          justify-content: flex-start;
        }
        .bubble {
          max-width: 88%;
          padding: 9px 12px 6px;
          border-radius: 12px;
          font-size: 13.5px;
          line-height: 1.45;
          position: relative;
          box-shadow: 0 1px 1px rgba(0,0,0,0.13);
        }
        .customer-bubble {
          background: #d9fdd3;
          color: #111b21;
          border-top-right-radius: 2px;
        }
        .bot-bubble {
          background: #ffffff;
          color: #111b21;
          border-top-left-radius: 2px;
        }
        .bubble-text strong {
          color: #0b141a;
          font-weight: 700;
        }
        .bubble-meta {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 3px;
          margin-top: 4px;
          font-size: 10.5px;
          color: #667781;
        }
        .ticks {
          color: #53bdeb;
          font-size: 11px;
          letter-spacing: -1.5px;
          margin-left: 2px;
        }
        .interactive-buttons {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }
        .wa-btn {
          background: #f8fafc;
          border: 1px solid #00a884;
          color: #008069;
          font-weight: 600;
          font-size: 12px;
          padding: 7px 10px;
          border-radius: 8px;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .interactive-list-card {
          margin-top: 8px;
          background: #f0fdf4;
          border: 1.5px solid #00a884;
          border-radius: 10px;
          overflow: hidden;
        }
        .list-card-header {
          background: #008069;
          color: white;
          font-weight: 700;
          font-size: 12px;
          padding: 7px 10px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .list-rows-container {
          padding: 4px 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .list-sec-title {
          font-size: 10px;
          font-weight: 800;
          color: #005c4b;
          text-transform: uppercase;
          padding: 4px 6px 2px;
        }
        .list-row-item {
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 6px 8px;
          display: flex;
          align-items: flex-start;
          gap: 6px;
        }
        .row-radio {
          font-size: 11px;
          color: #008069;
          margin-top: 1px;
        }
        .row-details {
          flex: 1;
        }
        .row-title {
          font-size: 11.5px;
          font-weight: 700;
          color: #0f172a;
        }
        .row-desc {
          font-size: 10px;
          color: #64748b;
          line-height: 1.25;
          margin-top: 1px;
        }
        .document-card {
          background: #f0f2f5;
          border: 1px solid #d1d7db;
          border-radius: 8px;
          padding: 10px 12px;
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 8px;
          margin-bottom: 4px;
        }
        .doc-icon-wrap {
          background: #ea4335;
          color: white;
          font-weight: 900;
          font-size: 11px;
          padding: 6px 8px;
          border-radius: 4px;
        }
        .doc-info {
          flex: 1;
        }
        .doc-title {
          font-weight: 700;
          font-size: 12.5px;
          color: #111b21;
        }
        .doc-sub {
          font-size: 10.5px;
          color: #667781;
          margin-top: 2px;
        }
        .doc-download-btn {
          background: #00a884;
          color: white;
          border-radius: 50%;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
        }
        .phone-footer {
          background: #f0f2f5;
          padding: 10px 16px;
          display: flex;
          align-items: center;
          gap: 10px;
          border-top: 1px solid #e9edef;
        }
        .input-placeholder {
          flex: 1;
          background: white;
          border-radius: 20px;
          padding: 8px 14px;
          color: #8696a0;
          font-size: 13px;
        }
        .mic-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #00a884;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <div class="phone-frame">
        <div class="phone-header">
          <div class="avatar-wrap">📷</div>
          <div class="header-info">
            <div class="header-name">
              TEAM CCTV Official
              <span class="verified-badge">✓</span>
            </div>
            <div class="header-status">Official Business Account • Online</div>
          </div>
        </div>
        <div class="chat-container">
          <div class="partner-pill-banner">
            🤝 Scanned at Partner: <strong>Sharma Electricals (Code: P102)</strong>
          </div>
          <div class="date-badge">Today</div>
          ${renderedMessages}
        </div>
        <div class="phone-footer">
          <div class="input-placeholder">Type a message...</div>
          <div class="mic-btn">🎙</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. EXECUTE TEST SIMULATION & RENDER ALL MILESTONES
// ─────────────────────────────────────────────────────────────────────────────

async function runSimulationAndRender() {
  console.log("================================================================================");
  console.log(" TEAM CCTV – RUNNING REAL WHATSAPP CONVERSATION TEST & SCREENSHOT CAPTURE");
  console.log("================================================================================");

  const baseArtifactDir = path.resolve("C:/Users/hp/.gemini/antigravity/brain/a3ffb3e0-acdc-44d0-adf1-9bb0c61b8e72");
  const outputDir = path.join(baseArtifactDir, "screenshots");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Calculate Real Engine Prices for 4 IP Cameras, 15 Days Retention, New Cabling
  const selection: ConfiguratorSelection = {
    property_type: "home",
    installation_type: "new",
    camera_count: 4,
    outdoor_camera_count: 2,
    indoor_camera_count: 2,
    technology: "IP",
    recording_days: 15,
    cabling_status: "needed",
    broadband_status: "broadband_available",
    lead_pincode: "302012",
  };

  const catalogResult = generateAllCatalogVariations({
    selection,
    products: mockProducts,
    addons: mockAddons,
    settings: mockSettings,
    cablingDone: false,
  });

  const cpPlusSummary = catalogResult.brandSummaries.find(b => b.brandKey === "cpplus")!;
  const cpPlusStandard = cpPlusSummary.standardQuote.total_payable;
  const cpPlusEconomy = cpPlusSummary.economyQuote ? cpPlusSummary.economyQuote.total_payable : cpPlusStandard - 1421;
  const cpPlusSaving = cpPlusStandard - cpPlusEconomy;
  const upfrontDiscountAmount = Math.round(cpPlusStandard * 0.02);
  const upfrontTotal = cpPlusStandard - upfrontDiscountAmount;

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 620, height: 1020, deviceScaleFactor: 2 });

  // ───────────────────────────────────────────────────────────────────────────
  // SCREENSHOT 1: Partner QR Scan & Property Type
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n📸 Capturing Milestone 1: Partner QR Scan & Property Type...");
  const messagesStep1: ChatMessage[] = [
    {
      sender: "customer",
      time: "10:15 AM",
      type: "text",
      text: "Hi P102 I want a CCTV quotation"
    },
    {
      sender: "bot",
      time: "10:15 AM",
      type: "buttons",
      text: "Welcome to *TEAM CCTV*! 📷\n\nLet's build your exact, transparent CCTV quotation matching our website customer journey.\n\n*Step 1:* What type of property are you securing?",
      buttons: [
        { id: "prop_home", title: "🏠 Home / Flat" },
        { id: "prop_office", title: "🏢 Office / Shop" },
        { id: "prop_factory", title: "🏭 Factory / Farm / Yard" }
      ]
    },
    {
      sender: "customer",
      time: "10:15 AM",
      type: "text",
      text: "🏠 Home / Flat"
    }
  ];

  await page.setContent(generateWhatsAppHtml(messagesStep1, "Step 1: Welcome & Property Type"));
  const pathStep1 = path.join(outputDir, "step1_partner_qr_welcome.png");
  await page.screenshot({ path: pathStep1 });
  fs.copyFileSync(pathStep1, path.join(baseArtifactDir, "step1_partner_qr_welcome.png"));
  console.log(`   Saved: ${pathStep1}`);

  // ───────────────────────────────────────────────────────────────────────────
  // SCREENSHOT 2: Installation Type (Wired, Smart Wireless, 4G Solar, Add-on)
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n📸 Capturing Milestone 2: Installation Types & Camera Quantities...");
  const messagesStep2: ChatMessage[] = [
    {
      sender: "bot",
      time: "10:15 AM",
      type: "list",
      text: "*Step 2:* What kind of installation do you require?",
      listButtonTitle: "Select Installation Type",
      listSections: [
        {
          title: "Choose Installation Type",
          rows: [
            { id: "ins_new_wired", title: "✨ Completely New Wired Setup", desc: "Central DVR/NVR with dedicated copper cabling. Zero signal drop." },
            { id: "ins_wireless", title: "📶 Smart Wireless CCTV", desc: "Zero video cabling. 360° Pan-Tilt & live mobile phone viewing." },
            { id: "ins_4g_solar", title: "📡 4G SIM / Solar Standalone", desc: "No Wi-Fi needed. Ideal for farmhouses, empty plots & remote gates." },
            { id: "ins_addon", title: "⬆️ Add to Existing System", desc: "Expansion / upgrade with compatibility guarantee." }
          ]
        }
      ]
    },
    {
      sender: "customer",
      time: "10:16 AM",
      type: "text",
      text: "✨ Completely New Wired Setup"
    },
    {
      sender: "bot",
      time: "10:16 AM",
      type: "list",
      text: "*Step 3 (Outdoor Cameras):* 🌧️\n\nHow many *Weatherproof Bullet Cameras* do you need mounted outside for your main gate, driveway, parking, or boundary walls?",
      listButtonTitle: "Select Outdoor Cameras",
      listSections: [
        {
          title: "Outdoor Weatherproof Bullets",
          rows: [
            { id: "out_0", title: "0 Cameras (None Outside)", desc: "All cameras will be installed indoors" },
            { id: "out_1", title: "1 Outdoor Bullet", desc: "Main gate / single entrance coverage" },
            { id: "out_2", title: "2 Outdoor Bullets", desc: "Front gate + driveway / parking" },
            { id: "out_3", title: "3 Outdoor Bullets", desc: "Front gate, porch & backyard" },
            { id: "out_4", title: "4 Outdoor Bullets", desc: "4-corner full perimeter coverage" },
            { id: "out_custom", title: "5+ Outdoor Bullets", desc: "Large perimeter / commercial yard" }
          ]
        }
      ]
    },
    {
      sender: "customer",
      time: "10:16 AM",
      type: "text",
      text: "2 Outdoor Bullets"
    }
  ];

  await page.setContent(generateWhatsAppHtml(messagesStep2, "Step 2: Installation Types & Outdoor Cameras"));
  const pathStep2 = path.join(outputDir, "step2_wizard_camera_config.png");
  await page.screenshot({ path: pathStep2 });
  fs.copyFileSync(pathStep2, path.join(baseArtifactDir, "step2_wizard_camera_config.png"));
  console.log(`   Saved: ${pathStep2}`);

  // ───────────────────────────────────────────────────────────────────────────
  // SCREENSHOT 3: Indoor Cameras, Technology & Storage Retention (0 to 60 Days)
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n📸 Capturing Milestone 3: Indoor Domes, Technology & Storage (0-60 Days)...");
  const messagesStep3: ChatMessage[] = [
    {
      sender: "bot",
      time: "10:16 AM",
      type: "list",
      text: "*Step 4 (Indoor Cameras):* 🏠\n\nHow many *Compact Ceiling Dome Cameras* do you need mounted inside for your living room, corridors, office, or cashier counters?",
      listButtonTitle: "Select Indoor Cameras",
      listSections: [
        {
          title: "Indoor Ceiling Domes",
          rows: [
            { id: "in_0", title: "0 Cameras (None Inside)", desc: "All cameras will be outdoor bullets" },
            { id: "in_1", title: "1 Indoor Dome", desc: "Living hall / main reception" },
            { id: "in_2", title: "2 Indoor Domes", desc: "Hall + cashier desk / master bedroom" },
            { id: "in_3", title: "3 Indoor Domes", desc: "Hall + 2 rooms / cabins" },
            { id: "in_4", title: "4 Indoor Domes", desc: "4 separate indoor zones" },
            { id: "in_custom", title: "5+ Indoor Domes", desc: "Large commercial / office floor" }
          ]
        }
      ]
    },
    {
      sender: "customer",
      time: "10:16 AM",
      type: "text",
      text: "2 Indoor Domes"
    },
    {
      sender: "bot",
      time: "10:17 AM",
      type: "buttons",
      text: "✓ *Camera Setup Confirmed:* 4 Cameras Total (2 Outdoor Weatherproof Bullets + 2 Indoor Ceiling Domes)\n\n*Step 5 (Technology):* Which camera technology level do you prefer?",
      buttons: [
        { id: "tech_IP", title: "Digital IP (Best Quality)" },
        { id: "tech_HD", title: "HD Analog (Lowest Cost)" }
      ]
    },
    {
      sender: "customer",
      time: "10:17 AM",
      type: "text",
      text: "Digital IP (Best Quality)"
    },
    {
      sender: "bot",
      time: "10:17 AM",
      type: "list",
      text: "*Step 6 (Storage):* How many days of recording retention do you require?\n\nIncludes official Surveillance Hard Drive with continuous overwrite.",
      listButtonTitle: "Select Storage Days [0, 7, 15, 30, 45, 60]",
      listSections: [
        {
          title: "Storage Retention Options",
          rows: [
            { id: "storage_0", title: "0 Days (Live View / TV Only)", desc: "Live mobile viewing only. Zero storage cost." },
            { id: "storage_7", title: "7 Days (Basic)", desc: "Standard 1-week buffer" },
            { id: "storage_15", title: "15 Days (Recommended Standard)", desc: "Optimal commercial/home standard" },
            { id: "storage_30", title: "30 Days (Extended)", desc: "Full month peace-of-mind" },
            { id: "storage_45", title: "45 Days (High Security)", desc: "Extended commercial compliance" },
            { id: "storage_60", title: "60 Days (Maximum)", desc: "Highest statutory retention" }
          ]
        }
      ]
    },
    {
      sender: "customer",
      time: "10:17 AM",
      type: "text",
      text: "15 Days (Recommended Standard)"
    }
  ];

  await page.setContent(generateWhatsAppHtml(messagesStep3, "Step 3: Split, Tech & Storage Days"));
  const pathStep3 = path.join(outputDir, "step3_tech_storage_cabling.png");
  await page.screenshot({ path: pathStep3 });
  fs.copyFileSync(pathStep3, path.join(baseArtifactDir, "step3_tech_storage_cabling.png"));
  console.log(`   Saved: ${pathStep3}`);

  // ───────────────────────────────────────────────────────────────────────────
  // SCREENSHOT 4: Recording Mode, Mounting Conditions & Cabling
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n📸 Capturing Milestone 4: Mode, Mounting Height & Cabling...");
  const messagesStep4: ChatMessage[] = [
    {
      sender: "bot",
      time: "10:17 AM",
      type: "buttons",
      text: "*Recording Mode:* How would you like your system to record?",
      buttons: [
        { id: "mode_continuous", title: "⏺️ 24x7 Continuous (Non-stop)" },
        { id: "mode_motion", title: "🏃 Smart Motion (Save 50% Storage)" }
      ]
    },
    {
      sender: "customer",
      time: "10:17 AM",
      type: "text",
      text: "⏺️ 24x7 Continuous (Non-stop)"
    },
    {
      sender: "bot",
      time: "10:18 AM",
      type: "buttons",
      text: "*Mounting Height:* What is the approximate ceiling / mounting height at your site?",
      buttons: [
        { id: "mount_standard", title: "Standard (< 10 ft) - Normal" },
        { id: "mount_high", title: "High (10-15 ft) - High Ceiling" },
        { id: "mount_very_high", title: "Very High (15 ft+) - Warehouse" }
      ]
    },
    {
      sender: "customer",
      time: "10:18 AM",
      type: "text",
      text: "Standard (< 10 ft) - Normal"
    },
    {
      sender: "bot",
      time: "10:18 AM",
      type: "buttons",
      text: "*Cabling Infrastructure:* Is your property already pre-wired with CCTV cables, or do we need to lay new cables?",
      buttons: [
        { id: "cab_new", title: "🆕 Need New Cabling (~15m/cam incl)" },
        { id: "cab_prewired", title: "🔌 Pre-Wired Site (Fitting only)" }
      ]
    },
    {
      sender: "customer",
      time: "10:18 AM",
      type: "text",
      text: "🆕 Need New Cabling (~15m/cam incl)"
    }
  ];

  await page.setContent(generateWhatsAppHtml(messagesStep4, "Step 4: Mode, Height & Cabling"));
  const pathStep4 = path.join(outputDir, "step4_timeline_and_pincode.png");
  await page.screenshot({ path: pathStep4 });
  fs.copyFileSync(pathStep4, path.join(baseArtifactDir, "step4_timeline_and_pincode.png"));
  console.log(`   Saved: ${pathStep4}`);

  // ───────────────────────────────────────────────────────────────────────────
  // SCREENSHOT 5: Mobile Internet, Timeline & Pincode / Quote Calculation
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n📸 Capturing Milestone 5: Internet, Timeline & Pincode Trigger...");
  const messagesStep5: ChatMessage[] = [
    {
      sender: "bot",
      time: "10:18 AM",
      type: "buttons",
      text: "*Mobile Viewing & Internet:* Choose how you want to watch live camera video on your smartphone:",
      buttons: [
        { id: "net_wifi", title: "📶 Have Wi-Fi Router (App Incl)" },
        { id: "net_4g", title: "🌐 Add 4G SIM Router" },
        { id: "net_offline", title: "📺 Offline / TV Only" }
      ]
    },
    {
      sender: "customer",
      time: "10:18 AM",
      type: "text",
      text: "📶 Have Wi-Fi Router (App Incl)"
    },
    {
      sender: "bot",
      time: "10:19 AM",
      type: "buttons",
      text: "⏱️ *When do you plan to get work / installation done at your site?*",
      buttons: [
        { id: "time_asap", title: "⚡ ASAP (1-2 Days)" },
        { id: "time_week", title: "📅 Within a Week" },
        { id: "time_month", title: "🗓️ This Month / Later" }
      ]
    },
    {
      sender: "customer",
      time: "10:19 AM",
      type: "text",
      text: "⚡ ASAP (1-2 Days)"
    },
    {
      sender: "bot",
      time: "10:19 AM",
      type: "text",
      text: "📍 *Final Step:* Please enter your 6-digit Pincode (or tap the clip icon to share your *Location Pin*).\n\nThis allows us to match our nearest Sub-Post Office micro-hub and certified local installer."
    },
    {
      sender: "customer",
      time: "10:19 AM",
      type: "text",
      text: "302012"
    },
    {
      sender: "bot",
      time: "10:19 AM",
      type: "text",
      text: "⚙️ *Calculating All Brand Quotations...*\nSizing recorders, checking power supplies, applying ₹0-markup labor rates, and computing 100% transparent market price ranges. Please wait 3 seconds..."
    }
  ];

  await page.setContent(generateWhatsAppHtml(messagesStep5, "Step 5: Internet, Timeline & Pincode"));
  const pathStep5 = path.join(outputDir, "step5_all_brand_price_spectrum.png");
  await page.screenshot({ path: pathStep5 });
  fs.copyFileSync(pathStep5, path.join(baseArtifactDir, "step5_all_brand_price_spectrum.png"));
  console.log(`   Saved: ${pathStep5}`);

  // ───────────────────────────────────────────────────────────────────────────
  // SCREENSHOT 6: All-Inclusive Brand Price Range Spectrum Card & Selector
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n📸 Capturing Milestone 6: All-Inclusive Price Spectrum & Selector...");
  let summaryText = `📷 *COMPLETE CCTV PRICE SUMMARY*\n`;
  summaryText += `━━━━━━━━━━━━━━━━━━━━━\n`;
  summaryText += `📍 *Site Setup:* 4 Cameras (2 Outdoor Bullets + 2 Indoor Domes)\n`;
  summaryText += `⚡ *Technology:* Digital IP (Best Quality)\n`;
  summaryText += `💾 *Storage:* 15 Days Retention (24x7 Continuous Non-Stop)\n`;
  summaryText += `🔌 *Cabling:* Need New Cabling (~15m copper wire/cam incl)\n`;
  summaryText += `📱 *Connectivity:* Have Wi-Fi Router (App Incl)\n`;
  summaryText += `🎁 *Partner Referral:* Sharma Electricals (Code: P102)\n`;
  summaryText += `✅ *All prices include:* Cameras, NVR, Storage, Cables, Connectors, Installation Labor & 18% GST (Zero Hidden Costs!)\n\n`;
  summaryText += `🏆 *ALL-INCLUSIVE BRAND PRICE SPECTRUM:*\n\n`;

  catalogResult.brandSummaries.forEach((b, idx) => {
    summaryText += `${idx + 1}️⃣ *${b.brandName.toUpperCase()}*\n`;
    summaryText += `   💰 *₹${b.minPrice.toLocaleString('en-IN')} to ₹${b.maxPrice.toLocaleString('en-IN')}*\n`;
    if (b.economyQuote) {
      summaryText += `   • Economy 500GB: ₹${b.economyQuote.total_payable.toLocaleString('en-IN')} (Save ₹${((b.standardQuote.total_payable || 0) - b.economyQuote.total_payable).toLocaleString('en-IN')})\n`;
    }
    summaryText += `   • Standard 15 Days (1TB+): ₹${b.standardQuote.total_payable.toLocaleString('en-IN')}\n\n`;
  });

  summaryText += `━━━━━━━━━━━━━━━━━━━━━\n`;
  summaryText += `🛡 *100% Price Match Guarantee:*\n`;
  summaryText += `Already have a quote from another vendor? Reply with a PHOTO or PDF right here to beat their price by 5%-10%!`;

  const messagesStep6: ChatMessage[] = [
    {
      sender: "bot",
      time: "10:19 AM",
      type: "text",
      text: summaryText
    },
    {
      sender: "bot",
      time: "10:19 AM",
      type: "list",
      text: "Choose a brand below to view specific packages and lock your quotation:",
      listButtonTitle: "Explore Brand Packages",
      listSections: [
        {
          title: "Select Brand to Explore",
          rows: [
            { id: "view_brand_cpplus", title: "CP Plus (₹24,697)", desc: "View Standard & Economy 500GB packages" },
            { id: "view_brand_hikvision", title: "Hikvision (₹26,585)", desc: "View Standard & Economy 500GB packages" },
            { id: "view_brand_dahua", title: "Dahua (₹25,488)", desc: "View Standard & Economy 500GB packages" },
            { id: "view_brand_budget", title: "Budget Brand (₹20,209 - ₹21,629)", desc: "View lowest price packages" }
          ]
        },
        {
          title: "Quick Actions & Price Match",
          rows: [
            { id: "select_lowest_quote", title: "⚡ Best Value (Budget - ₹20,209)", desc: "Select the lowest price package across all brands" },
            { id: "upload_competitor_quote", title: "📸 Upload Competitor Quote", desc: "Send photo/PDF of offline quote for price match" },
            { id: "open_web_studio", title: "🎨 Open Live Web Studio", desc: "Inspect 3D camera angles and compare in browser" }
          ]
        }
      ]
    },
    {
      sender: "customer",
      time: "10:20 AM",
      type: "text",
      text: "CP Plus (₹24,697)"
    }
  ];

  await page.setContent(generateWhatsAppHtml(messagesStep6, "Step 6: All-Inclusive Price Spectrum"));
  const pathStep6 = path.join(outputDir, "step6_brand_package_variations.png");
  await page.screenshot({ path: pathStep6 });
  fs.copyFileSync(pathStep6, path.join(baseArtifactDir, "step6_brand_package_variations.png"));
  console.log(`   Saved: ${pathStep6}`);

  // ───────────────────────────────────────────────────────────────────────────
  // SCREENSHOT 7: Brand Variations (Standard vs Economy 500GB Saving)
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n📸 Capturing Milestone 7: Brand Package Variations...");
  let brandText = `📦 *CP PLUS CCTV PACKAGES*\n\n`;
  brandText += `1️⃣ *Standard Package (15 Days Storage)*\n`;
  brandText += `• Total: ₹${cpPlusStandard.toLocaleString('en-IN')} (Incl. GST & Fitting)\n`;
  brandText += `• Hardware: 4x 3MP IP Cameras (2 Outdoor Bullets + 2 Indoor Domes) + 4K NVR + 1TB WD Purple HDD\n\n`;
  brandText += `2️⃣ *Economy Storage Match (500GB HDD)*\n`;
  brandText += `• Total: ₹${cpPlusEconomy.toLocaleString('en-IN')} (Save ₹${cpPlusSaving.toLocaleString('en-IN')}!)\n`;
  brandText += `• Hardware: Same cameras with 3-5 days basic backup\n\n`;
  brandText += `Tap below to lock your preferred package and receive your official PDF quotation:`;

  const messagesStep7: ChatMessage[] = [
    {
      sender: "bot",
      time: "10:20 AM",
      type: "buttons",
      text: brandText,
      buttons: [
        { id: "lock_cpplus_standard", title: `Select Standard (₹${cpPlusStandard.toLocaleString('en-IN')})` },
        { id: "lock_cpplus_economy", title: `Select Economy (₹${cpPlusEconomy.toLocaleString('en-IN')})` },
        { id: "back_to_brands", title: "← All Brands" }
      ]
    },
    {
      sender: "customer",
      time: "10:21 AM",
      type: "text",
      text: `Select Standard (₹${cpPlusStandard.toLocaleString('en-IN')})`
    }
  ];

  await page.setContent(generateWhatsAppHtml(messagesStep7, "Step 7: Brand Variations"));
  const pathStep7 = path.join(outputDir, "step7_frozen_quote_pdf_checkout.png");
  await page.screenshot({ path: pathStep7 });
  fs.copyFileSync(pathStep7, path.join(baseArtifactDir, "step7_frozen_quote_pdf_checkout.png"));
  console.log(`   Saved: ${pathStep7}`);

  // ───────────────────────────────────────────────────────────────────────────
  // SCREENSHOT 8: Frozen Quote, Official PDF & 4 Checkout Pathways
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n📸 Capturing Milestone 8: Quote Freezing, PDF & Checkout Pathways...");
  const quoteId = "Q-9482";
  const messagesStep8: ChatMessage[] = [
    {
      sender: "bot",
      time: "10:21 AM",
      type: "document",
      text: `📄 *Official GST Quotation Frozen!*\n\nQuote ID: *${quoteId}*\nTotal Payable: *₹${cpPlusStandard.toLocaleString('en-IN')}* (All Inclusive)\nValid For: *7 Days Price Lock Guarantee*\n\nReview the attached PDF for the full Bill of Materials (BOM) & warranty terms.`,
      docTitle: `TEAM_CCTV_Quotation_${quoteId}.pdf`,
      docSubtitle: `248 kB • 18% GST Bill Included • Open`
    },
    {
      sender: "bot",
      time: "10:21 AM",
      type: "buttons",
      text: "How would you like to proceed with your installation slot?",
      buttons: [
        { id: "action_pay_full", title: "💳 Pay Full (2% Off)" },
        { id: "action_book_token", title: "🔒 Book with ₹500" },
        { id: "action_book_survey", title: "📅 Free Site Visit" }
      ]
    },
    {
      sender: "customer",
      time: "10:22 AM",
      type: "text",
      text: "💳 Pay Full (2% Off)"
    },
    {
      sender: "bot",
      time: "10:22 AM",
      type: "text",
      text: `🎉 *2% Upfront Discount Applied!*\n\n• Standard Quote: ₹${cpPlusStandard.toLocaleString('en-IN')}\n• Instant Discount: -₹${upfrontDiscountAmount.toLocaleString('en-IN')}\n• *Final Amount: ₹${upfrontTotal.toLocaleString('en-IN')}*\n\nClick the link below to pay securely via UPI (Google Pay / PhonePe / Paytm) or Cards:\n\n👉 *https://rzp.io/l/team-cctv-${quoteId}*\n\nOnce paid, your installation kit will be dispatched immediately.`
    }
  ];

  await page.setContent(generateWhatsAppHtml(messagesStep8, "Step 8: Frozen Quote & 2% Checkout"));
  const pathStep8 = path.join(outputDir, "step8_addon_and_wireless_options.png");
  await page.screenshot({ path: pathStep8 });
  fs.copyFileSync(pathStep8, path.join(baseArtifactDir, "step8_addon_and_wireless_options.png"));
  console.log(`   Saved: ${pathStep8}`);

  // ───────────────────────────────────────────────────────────────────────────
  // SCREENSHOT 9: Specialized Add-on Compatibility & Smart Wireless / 4G Branches
  // ───────────────────────────────────────────────────────────────────────────
  console.log("\n📸 Capturing Milestone 9: Add-on Compatibility & Smart Wireless Branches...");
  const messagesStep9: ChatMessage[] = [
    {
      sender: "customer",
      time: "11:02 AM",
      type: "text",
      text: "⬆️ Add to Existing System"
    },
    {
      sender: "bot",
      time: "11:02 AM",
      type: "buttons",
      text: "*Add-on Compatibility Check:*\n\nDo you know the technical specifications of your existing DVR / NVR recorder?",
      buttons: [
        { id: "addon_upload_photo", title: "📸 Send DVR Photo (15m Check)" },
        { id: "addon_know_specs", title: "✅ I Know My Specs" },
        { id: "addon_free_callback", title: "📞 Free Callback" }
      ]
    },
    {
      sender: "customer",
      time: "11:03 AM",
      type: "text",
      text: "📸 Send DVR Photo (15m Check)"
    },
    {
      sender: "bot",
      time: "11:03 AM",
      type: "text",
      text: "📸 *Send DVR Photo:*\nPlease take a quick photo of your existing DVR/NVR's *back panel* (where camera cables connect) or the *model sticker* and send it right here.\n\nOur senior engineer will review it within 15 minutes and verify 100% compatibility!"
    },
    {
      sender: "customer",
      time: "11:05 AM",
      type: "text",
      text: "📶 Smart Wireless CCTV"
    },
    {
      sender: "bot",
      time: "11:05 AM",
      type: "list",
      text: "*Smart Wireless Purpose Variants:*\nChoose your primary camera configuration:",
      listButtonTitle: "Select Wireless Camera Variant",
      listSections: [
        {
          title: "Purpose-Driven Wireless Cameras",
          rows: [
            { id: "wf_in_ptz", title: "🏠 Indoor 360° Pan-Tilt", desc: "Living room, counter, 2-way talk" },
            { id: "wf_out_bullet", title: "🌧️ Outdoor Fixed Weatherproof", desc: "IP66 waterproof bullet for gates & porch" },
            { id: "wf_out_ptz", title: "🔄 Outdoor 360° Motorized PTZ", desc: "360° remote sweep via phone app" },
            { id: "wf_4g_solar", title: "📡 4G SIM / Solar Standalone", desc: "No Wi-Fi needed. Farmhouse & remote gates" },
            { id: "wf_combo_2x2", title: "✨ 4-Cam Combo (2 In + 2 Out)", desc: "Complete home / office wireless coverage" }
          ]
        }
      ]
    }
  ];

  await page.setContent(generateWhatsAppHtml(messagesStep9, "Step 9: Add-on & Wireless Branches"));
  const pathStep9 = path.join(outputDir, "step9_addon_and_wireless_details.png");
  await page.screenshot({ path: pathStep9 });
  fs.copyFileSync(pathStep9, path.join(baseArtifactDir, "step9_addon_and_wireless_details.png"));
  console.log(`   Saved: ${pathStep9}`);

  await browser.close();

  console.log("\n================================================================================");
  console.log(" ALL 9 MILESTONE SCREENSHOTS SUCCESSFULLY CAPTURED & SAVED!");
  console.log("================================================================================");
  console.log(`Artifact Folder: ${outputDir}`);
}

runSimulationAndRender().catch(err => {
  console.error("Simulation failed:", err);
  process.exit(1);
});
