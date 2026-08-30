import * as admin from "firebase-admin";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

if (!admin.apps.length) {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
  });
}

const db = admin.firestore();
const ts = admin.firestore.FieldValue.serverTimestamp();

function makePrice(cost) {
    return Math.round(cost * 1.3 / 10) * 10;
}

const PRODUCTS = {
  // HD CAMERAS
  "hd_cpplus_2mp_bw_dome": { display_name: "CP Plus 2MP B&W HD Dome Camera (Audio IN)", technical_name: "CP-HD-2MP-BW-DOME", brand: "cpplus", category: "cctv_camera", technology: "HD", resolution_mp: 2, base_cost: 1000, unit_price: makePrice(1000), is_active: true, features: ["mic", "bw_night_vision"] },
  "hd_cpplus_2mp_bw_bullet": { display_name: "CP Plus 2MP B&W HD Bullet Camera (Audio IN)", technical_name: "CP-HD-2MP-BW-BULLET", brand: "cpplus", category: "cctv_camera", technology: "HD", resolution_mp: 2, base_cost: 1050, unit_price: makePrice(1050), is_active: true, features: ["mic", "bw_night_vision"] },
  "hd_cpplus_2mp_color_dome": { display_name: "CP Plus 2MP Color HD Dome Camera (Audio IN)", technical_name: "CP-HD-2MP-COL-DOME", brand: "cpplus", category: "cctv_camera", technology: "HD", resolution_mp: 2, base_cost: 1250, unit_price: makePrice(1250), is_active: true, features: ["mic", "color_night"] },
  "hd_cpplus_2mp_color_bullet": { display_name: "CP Plus 2MP Color HD Bullet Camera (Audio IN)", technical_name: "CP-HD-2MP-COL-BULLET", brand: "cpplus", category: "cctv_camera", technology: "HD", resolution_mp: 2, base_cost: 1300, unit_price: makePrice(1300), is_active: true, features: ["mic", "color_night"] },
  "hd_cpplus_5mp_color_dome": { display_name: "CP Plus 5MP Color HD Dome Camera (Audio IN)", technical_name: "CP-HD-5MP-COL-DOME", brand: "cpplus", category: "cctv_camera", technology: "HD", resolution_mp: 5, base_cost: 1600, unit_price: makePrice(1600), is_active: true, features: ["mic", "color_night"] },
  "hd_cpplus_5mp_color_bullet": { display_name: "CP Plus 5MP Color HD Bullet Camera (Audio IN)", technical_name: "CP-HD-5MP-COL-BULLET", brand: "cpplus", category: "cctv_camera", technology: "HD", resolution_mp: 5, base_cost: 1650, unit_price: makePrice(1650), is_active: true, features: ["mic", "color_night"] },
  "hd_budget_2mp_color_dome": { display_name: "Budget 2MP Color HD Dome Camera (Audio IN)", technical_name: "BUDGET-HD-2MP-COL-DOME", brand: "budget", category: "cctv_camera", technology: "HD", resolution_mp: 2, base_cost: 700, unit_price: makePrice(700), is_active: true, features: ["mic", "color_night"] },
  "hd_budget_2mp_color_bullet": { display_name: "Budget 2MP Color HD Bullet Camera (Audio IN)", technical_name: "BUDGET-HD-2MP-COL-BULLET", brand: "budget", category: "cctv_camera", technology: "HD", resolution_mp: 2, base_cost: 750, unit_price: makePrice(750), is_active: true, features: ["mic", "color_night"] },

  // HD DVR
  "dvr_cpplus_4ch_2mp": { display_name: "CP Plus 4Ch HD DVR (2MP Supported)", technical_name: "CP-DVR-4CH-2MP", brand: "cpplus", category: "recorder", technology: "HD", channels: 4, max_cameras: 4, base_cost: 3700, unit_price: makePrice(3700), is_active: true },
  "dvr_cpplus_8ch_2mp": { display_name: "CP Plus 8Ch HD DVR (2MP Supported)", technical_name: "CP-DVR-8CH-2MP", brand: "cpplus", category: "recorder", technology: "HD", channels: 8, max_cameras: 8, base_cost: 4800, unit_price: makePrice(4800), is_active: true },
  "dvr_cpplus_16ch_2mp": { display_name: "CP Plus 16Ch HD DVR (2MP Supported)", technical_name: "CP-DVR-16CH-2MP", brand: "cpplus", category: "recorder", technology: "HD", channels: 16, max_cameras: 16, base_cost: 8100, unit_price: makePrice(8100), is_active: true },
  "dvr_cpplus_4ch_5mp": { display_name: "CP Plus 4Ch HD DVR (5MP Supported)", technical_name: "CP-DVR-4CH-5MP", brand: "cpplus", category: "recorder", technology: "HD", channels: 4, max_cameras: 4, base_cost: 5750, unit_price: makePrice(5750), is_active: true },
  "dvr_cpplus_8ch_5mp": { display_name: "CP Plus 8Ch HD DVR (5MP Supported)", technical_name: "CP-DVR-8CH-5MP", brand: "cpplus", category: "recorder", technology: "HD", channels: 8, max_cameras: 8, base_cost: 8100, unit_price: makePrice(8100), is_active: true },
  "dvr_cpplus_16ch_5mp": { display_name: "CP Plus 16Ch HD DVR (5MP Supported)", technical_name: "CP-DVR-16CH-5MP", brand: "cpplus", category: "recorder", technology: "HD", channels: 16, max_cameras: 16, base_cost: 13300, unit_price: makePrice(13300), is_active: true },

  // Power Supply (HD)
  "psu_cpplus_8ch": { display_name: "CP Plus 8Ch SMPS Power Supply", technical_name: "CP-PSU-8CH", brand: "cpplus", category: "power_device", technology: "HD", max_cameras: 8, base_cost: 600, unit_price: makePrice(600), is_active: true },
  "psu_budget_8ch": { display_name: "Budget 8Ch SMPS Power Supply", technical_name: "BUDGET-PSU-8CH", brand: "budget", category: "power_device", technology: "HD", max_cameras: 8, base_cost: 350, unit_price: makePrice(350), is_active: true },

  // IP CAMERAS
  "ip_cpplus_2mp_color_eco_dome": { display_name: "CP Plus 2MP Color IP Dome Camera (ECO, Audio IN)", technical_name: "CP-IP-2MP-COL-ECO-DOME", brand: "cpplus", category: "cctv_camera", technology: "IP", resolution_mp: 2, base_cost: 3200, unit_price: makePrice(3200), is_active: true, features: ["mic", "color_night"] },
  "ip_cpplus_2mp_color_eco_bullet": { display_name: "CP Plus 2MP Color IP Bullet Camera (ECO, Audio IN)", technical_name: "CP-IP-2MP-COL-ECO-BULLET", brand: "cpplus", category: "cctv_camera", technology: "IP", resolution_mp: 2, base_cost: 3250, unit_price: makePrice(3250), is_active: true, features: ["mic", "color_night"] },
  "ip_cpplus_4mp_color_norm_dome": { display_name: "CP Plus 4MP Color IP Dome Camera (Normal, Audio IN)", technical_name: "CP-IP-4MP-COL-NORM-DOME", brand: "cpplus", category: "cctv_camera", technology: "IP", resolution_mp: 4, base_cost: 4000, unit_price: makePrice(4000), is_active: true, features: ["mic", "color_night"] },
  "ip_cpplus_4mp_color_norm_bullet": { display_name: "CP Plus 4MP Color IP Bullet Camera (Normal, Audio IN)", technical_name: "CP-IP-4MP-COL-NORM-BULLET", brand: "cpplus", category: "cctv_camera", technology: "IP", resolution_mp: 4, base_cost: 4050, unit_price: makePrice(4050), is_active: true, features: ["mic", "color_night"] },
  "ip_cpplus_6mp_color_norm_dome": { display_name: "CP Plus 6MP Color IP Dome Camera (Normal, Audio IN)", technical_name: "CP-IP-6MP-COL-NORM-DOME", brand: "cpplus", category: "cctv_camera", technology: "IP", resolution_mp: 6, base_cost: 5200, unit_price: makePrice(5200), is_active: true, features: ["mic", "color_night"] },
  "ip_cpplus_6mp_color_norm_bullet": { display_name: "CP Plus 6MP Color IP Bullet Camera (Normal, Audio IN)", technical_name: "CP-IP-6MP-COL-NORM-BULLET", brand: "cpplus", category: "cctv_camera", technology: "IP", resolution_mp: 6, base_cost: 5250, unit_price: makePrice(5250), is_active: true, features: ["mic", "color_night"] },
  "ip_cpplus_8mp_color_prem_dome": { display_name: "CP Plus 8MP Color IP Dome Camera (Premium, Audio IN)", technical_name: "CP-IP-8MP-COL-PREM-DOME", brand: "cpplus", category: "cctv_camera", technology: "IP", resolution_mp: 8, base_cost: 7500, unit_price: makePrice(7500), is_active: true, features: ["mic", "color_night"] },
  "ip_budget_5mp_color_eco_dome": { display_name: "Budget 5MP Color IP Dome Camera (ECO, Audio IN)", technical_name: "BUDGET-IP-5MP-COL-ECO-DOME", brand: "budget", category: "cctv_camera", technology: "IP", resolution_mp: 5, base_cost: 1400, unit_price: makePrice(1400), is_active: true, features: ["mic", "color_night"] },
  "ip_budget_5mp_color_eco_bullet": { display_name: "Budget 5MP Color IP Bullet Camera (ECO, Audio IN)", technical_name: "BUDGET-IP-5MP-COL-ECO-BULLET", brand: "budget", category: "cctv_camera", technology: "IP", resolution_mp: 5, base_cost: 1450, unit_price: makePrice(1450), is_active: true, features: ["mic", "color_night"] },
  "ip_budget_5mp_color_prem_dome": { display_name: "Budget 5MP Color IP Dome Camera (Premium, Audio IN)", technical_name: "BUDGET-IP-5MP-COL-PREM-DOME", brand: "budget", category: "cctv_camera", technology: "IP", resolution_mp: 5, base_cost: 2000, unit_price: makePrice(2000), is_active: true, features: ["mic", "color_night"] },
  "ip_budget_5mp_color_prem_bullet": { display_name: "Budget 5MP Color IP Bullet Camera (Premium, Audio IN)", technical_name: "BUDGET-IP-5MP-COL-PREM-BULLET", brand: "budget", category: "cctv_camera", technology: "IP", resolution_mp: 5, base_cost: 2050, unit_price: makePrice(2050), is_active: true, features: ["mic", "color_night"] },

  // IP NVR
  "nvr_cpplus_4ch": { display_name: "CP Plus 4Ch NVR (1SATA)", technical_name: "CP-NVR-4CH", brand: "cpplus", category: "recorder", technology: "IP", channels: 4, max_cameras: 4, base_cost: 4900, unit_price: makePrice(4900), is_active: true },
  "nvr_cpplus_8ch": { display_name: "CP Plus 8Ch NVR (1SATA)", technical_name: "CP-NVR-8CH", brand: "cpplus", category: "recorder", technology: "IP", channels: 8, max_cameras: 8, base_cost: 5500, unit_price: makePrice(5500), is_active: true },
  "nvr_cpplus_16ch": { display_name: "CP Plus 16Ch NVR (1SATA)", technical_name: "CP-NVR-16CH", brand: "cpplus", category: "recorder", technology: "IP", channels: 16, max_cameras: 16, base_cost: 8300, unit_price: makePrice(8300), is_active: true },
  "nvr_cpplus_32ch": { display_name: "CP Plus 32Ch NVR (2SATA)", technical_name: "CP-NVR-32CH", brand: "cpplus", category: "recorder", technology: "IP", channels: 32, max_cameras: 32, base_cost: 15000, unit_price: makePrice(15000), is_active: true },

  // POE SWITCH
  "poe_budget_4ch": { display_name: "Budget 4Ch PoE Switch", technical_name: "BUDGET-POE-4CH", brand: "budget", category: "power_device", technology: "IP", max_cameras: 4, base_cost: 900, unit_price: makePrice(900), is_active: true },
  "poe_budget_8ch": { display_name: "Budget 8Ch PoE Switch", technical_name: "BUDGET-POE-8CH", brand: "budget", category: "power_device", technology: "IP", max_cameras: 8, base_cost: 1200, unit_price: makePrice(1200), is_active: true },
  "poe_dlink_16ch": { display_name: "D-Link 16Ch PoE Switch", technical_name: "DLINK-POE-16CH", brand: "dlink", category: "power_device", technology: "IP", max_cameras: 16, base_cost: 9500, unit_price: makePrice(9500), is_active: true },

  // HARD DISK
  "hdd_budget_500gb": { display_name: "Budget 500GB HDD", technical_name: "BUDGET-HDD-500GB", brand: "budget", category: "storage", technology: "BOTH", storage_tb: 0.5, base_cost: 1800, unit_price: makePrice(1800), is_active: true },
  "hdd_budget_1tb": { display_name: "Budget 1TB HDD", technical_name: "BUDGET-HDD-1TB", brand: "budget", category: "storage", technology: "BOTH", storage_tb: 1, base_cost: 4700, unit_price: makePrice(4700), is_active: true },
  "hdd_budget_2tb": { display_name: "Budget 2TB HDD", technical_name: "BUDGET-HDD-2TB", brand: "budget", category: "storage", technology: "BOTH", storage_tb: 2, base_cost: 7800, unit_price: makePrice(7800), is_active: true },
  "hdd_budget_4tb": { display_name: "Budget 4TB HDD", technical_name: "BUDGET-HDD-4TB", brand: "budget", category: "storage", technology: "BOTH", storage_tb: 4, base_cost: 14500, unit_price: makePrice(14500), is_active: true },
  "hdd_seagate_1tb": { display_name: "Seagate 1TB HDD", technical_name: "SEAGATE-HDD-1TB", brand: "seagate", category: "storage", technology: "BOTH", storage_tb: 1, base_cost: 9500, unit_price: makePrice(9500), is_active: true },
  "hdd_seagate_2tb": { display_name: "Seagate 2TB HDD", technical_name: "SEAGATE-HDD-2TB", brand: "seagate", category: "storage", technology: "BOTH", storage_tb: 2, base_cost: 10900, unit_price: makePrice(10900), is_active: true },
  "hdd_seagate_4tb": { display_name: "Seagate 4TB HDD", technical_name: "SEAGATE-HDD-4TB", brand: "seagate", category: "storage", technology: "BOTH", storage_tb: 4, base_cost: 18500, unit_price: makePrice(18500), is_active: true },

  // 3+1 CABLE
  "cab31_cpplus_90m": { display_name: "CP Plus 3+1 Copper Cable (90m)", technical_name: "CP-3+1-CO-90M", brand: "cpplus", category: "cable", technology: "HD", base_cost: 1350, unit_price: makePrice(1350), is_active: true },
  "cab31_budget_70m": { display_name: "Budget 3+1 Copper Coated Cable (70m)", technical_name: "BUDGET-3+1-CC-70M", brand: "budget", category: "cable", technology: "HD", base_cost: 600, unit_price: makePrice(600), is_active: true },

  // CAT6 CABLE
  "cat6_cpplus_305m_co": { display_name: "CP Plus CAT6 Copper Cable (305m)", technical_name: "CP-CAT6-CO-305M", brand: "cpplus", category: "cable", technology: "IP", base_cost: 9500, unit_price: makePrice(9500), is_active: true },
  "cat6_cpplus_305m_cc": { display_name: "CP Plus CAT6 Copper Coated Cable (305m)", technical_name: "CP-CAT6-CC-305M", brand: "cpplus", category: "cable", technology: "IP", base_cost: 3700, unit_price: makePrice(3700), is_active: true },
  "cat6_budget_100m_co": { display_name: "Budget CAT6 Copper Cable (100m)", technical_name: "BUDGET-CAT6-CO-100M", brand: "budget", category: "cable", technology: "IP", base_cost: 1200, unit_price: makePrice(1200), is_active: true },
  "cat6_budget_305m_cc": { display_name: "Budget CAT6 Copper Coated Cable (305m)", technical_name: "BUDGET-CAT6-CC-305M", brand: "budget", category: "cable", technology: "IP", base_cost: 3200, unit_price: makePrice(3200), is_active: true },

  // CONNECTORS
  "conn_bnc": { display_name: "BNC Connector", technical_name: "CONN-BNC", brand: "budget", category: "connector", technology: "HD", base_cost: 15, unit_price: makePrice(15), is_active: true },
  "conn_dc": { display_name: "DC Connector", technical_name: "CONN-DC", brand: "budget", category: "connector", technology: "HD", base_cost: 5, unit_price: makePrice(5), is_active: true },
  "conn_rj45": { display_name: "RJ45 Connector", technical_name: "CONN-RJ45", brand: "budget", category: "connector", technology: "IP", base_cost: 5, unit_price: makePrice(5), is_active: true },

  // HDMI CABLE
  "hdmi_1_5m": { display_name: "HDMI Cable (1.5m)", technical_name: "HDMI-1.5M", brand: "budget", category: "hdmi_cable", technology: "BOTH", base_cost: 60, unit_price: makePrice(60), is_active: true },
  "hdmi_3m": { display_name: "HDMI Cable (3m)", technical_name: "HDMI-3M", brand: "budget", category: "hdmi_cable", technology: "BOTH", base_cost: 120, unit_price: makePrice(120), is_active: true },
  "hdmi_5m": { display_name: "HDMI Cable (5m)", technical_name: "HDMI-5M", brand: "budget", category: "hdmi_cable", technology: "BOTH", base_cost: 180, unit_price: makePrice(180), is_active: true },
  "hdmi_10m": { display_name: "HDMI Cable (10m)", technical_name: "HDMI-10M", brand: "budget", category: "hdmi_cable", technology: "BOTH", base_cost: 300, unit_price: makePrice(300), is_active: true },

  // ACCESSORIES
  "acc_junction_box": { display_name: "Junction Box for Camera", technical_name: "ACC-JBOX", brand: "budget", category: "accessories", technology: "BOTH", base_cost: 20, unit_price: makePrice(20), is_active: true },
  "acc_2u_rack_recorder": { display_name: "2U Rack for Recorder", technical_name: "ACC-2URACK-REC", brand: "budget", category: "rack", technology: "BOTH", base_cost: 350, unit_price: makePrice(350), is_active: true },
  "acc_2u_rack_poe": { display_name: "2U Rack for PoE Switch", technical_name: "ACC-2URACK-POE", brand: "budget", category: "rack", technology: "IP", base_cost: 450, unit_price: makePrice(450), is_active: true },
  "acc_4g_router": { display_name: "4G Router", technical_name: "ACC-4GROUTER", brand: "budget", category: "network", technology: "BOTH", base_cost: 1450, unit_price: makePrice(1450), is_active: true },
  "acc_display_19": { display_name: "Display 19\"", technical_name: "ACC-DISP19", brand: "budget", category: "display", technology: "BOTH", base_cost: 2100, unit_price: makePrice(2100), is_active: true },
};

async function seedProducts() {
  console.log("Starting seed of new pricelist...");
  const batch = db.batch();
  for (const [productId, productData] of Object.entries(PRODUCTS)) {
    const ref = db.collection("products").doc(productId);
    batch.set(ref, { ...productData, created_at: ts, updated_at: ts }, { merge: true });
  }
  await batch.commit();
  console.log("Seeding complete!");
}

seedProducts().catch(console.error);
