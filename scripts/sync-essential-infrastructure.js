/**
 * @file scripts/sync-essential-infrastructure.js
 * @description Seeds authentic infrastructure, storage, power, cabling, and accessory
 * products from Mega Compu World Jaipur into Firestore to complement the 66 cameras and DVRs.
 */

require('dotenv').config({ path: '.env.local' });
const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
  });
} else {
  admin.initializeApp({
    credential: admin.credential.cert({ projectId, clientEmail, privateKey })
  });
}

const db = admin.firestore();
const ts = admin.firestore.FieldValue.serverTimestamp();

const INFRASTRUCTURE_PRODUCTS = {
  // ── STORAGE: SURVEILLANCE HDDS ──────────────────────────────────────────
  "hdd_1tb_seagate_skyhawk": {
    display_name: "Seagate SkyHawk 1TB Surveillance HDD",
    technical_name: "ST1000VX005-1TB",
    brand: "Seagate",
    category: "storage",
    technology: "Common",
    technologies: ["Common", "HD", "IP"],
    storage_capacity_tb: 1,
    storage_type: "Surveillance HDD",
    unit_price: 3800,
    base_cost: 3200,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    source_vendor: "Mega Compu World"
  },
  "hdd_2tb_wd_purple": {
    display_name: "WD Purple 2TB Surveillance Hard Disk (3.5\" SATA)",
    technical_name: "WD20PURZ-2TB",
    brand: "WD",
    category: "storage",
    technology: "Common",
    technologies: ["Common", "HD", "IP"],
    storage_capacity_tb: 2,
    storage_type: "Surveillance HDD",
    unit_price: 5500,
    base_cost: 4600,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "P104",
    source_vendor: "Mega Compu World"
  },
  "hdd_4tb_wd_purple": {
    display_name: "WD Purple 4TB Surveillance Hard Disk (3.5\" SATA)",
    technical_name: "WD40PURZ-4TB",
    brand: "WD",
    category: "storage",
    technology: "Common",
    technologies: ["Common", "HD", "IP"],
    storage_capacity_tb: 4,
    storage_type: "Surveillance HDD",
    unit_price: 8800,
    base_cost: 7400,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "P105",
    source_vendor: "Mega Compu World"
  },
  "hdd_6tb_wd_purple": {
    display_name: "WD Purple 6TB Surveillance Hard Disk (3.5\" SATA)",
    technical_name: "WD60PURZ-6TB",
    brand: "WD",
    category: "storage",
    technology: "Common",
    technologies: ["Common", "HD", "IP"],
    storage_capacity_tb: 6,
    storage_type: "Surveillance HDD",
    unit_price: 13500,
    base_cost: 11200,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "P106",
    source_vendor: "Mega Compu World"
  },

  // ── STORAGE: MICROSD CARDS (WIRELESS) ───────────────────────────────────
  "SD-SANDISK-64GB-HE": {
    display_name: "SanDisk High Endurance 64GB MicroSD Card",
    technical_name: "SDSQNRR-064G-GN6EI",
    brand: "SanDisk",
    category: "storage",
    technology: "Wireless",
    technologies: ["Wireless", "Common"],
    storage_capacity_gb: 64,
    storage_type: "MicroSD",
    unit_price: 650,
    base_cost: 520,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    source_vendor: "Mega Compu World"
  },
  "SD-SANDISK-128GB-HE": {
    display_name: "SanDisk High Endurance 128GB MicroSD Card",
    technical_name: "SDSQNRR-128G-GN6EI",
    brand: "SanDisk",
    category: "storage",
    technology: "Wireless",
    technologies: ["Wireless", "Common"],
    storage_capacity_gb: 128,
    storage_type: "MicroSD",
    unit_price: 1150,
    base_cost: 950,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    source_vendor: "Mega Compu World"
  },
  "SD-EVM-256GB": {
    display_name: "EVM 256GB Elite MicroSD Card For CCTV Camera",
    technical_name: "EVMSD/256GB",
    brand: "EVM",
    category: "storage",
    technology: "Wireless",
    technologies: ["Wireless", "Common"],
    storage_capacity_gb: 256,
    storage_type: "MicroSD",
    unit_price: 4122,
    base_cost: 3400,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    source_vendor: "Mega Compu World"
  },

  // ── POWER SUPPLIES (HD SMPS) ────────────────────────────────────────────
  "SMPS-CPP-8CH": {
    display_name: "CP-Plus CCTV Power Supply Eco 8ch 12v/10a (PD08V3)",
    technical_name: "CP-DPS-PD08V3",
    brand: "CP Plus",
    category: "power_device",
    technology: "HD",
    technologies: ["HD"],
    channels: 8,
    max_cameras: 8,
    unit_price: 840,
    base_cost: 650,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "A3666",
    source_vendor: "Mega Compu World"
  },
  "SMPS-SECURELINK-8CH": {
    display_name: "Securelink 8ch Metal CCTV Power Supply 12v/8a",
    technical_name: "SL-PS-12V8A-8CH",
    brand: "Securelink",
    category: "power_device",
    technology: "HD",
    technologies: ["HD"],
    channels: 8,
    max_cameras: 8,
    unit_price: 490,
    base_cost: 350,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "P3504",
    source_vendor: "Mega Compu World"
  },
  "SMPS-16CH-HEAVY": {
    display_name: "16-Camera SMPS Power Supply Metal Heavy (12V 20A)",
    technical_name: "SMPS-12V20A-16CH",
    brand: "Budget Brand",
    category: "power_device",
    technology: "HD",
    technologies: ["HD"],
    channels: 16,
    max_cameras: 16,
    unit_price: 1450,
    base_cost: 1100,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    source_vendor: "Mega Compu World"
  },

  // ── POE SWITCHES (IP TRANSMISSION) ──────────────────────────────────────
  "POE-SECURELINK-4CH": {
    display_name: "Securelink PoE Switch 4 Port (4 FE + 2 FE Uplink Port)",
    technical_name: "SL-POE-4FE-2FE",
    brand: "Securelink",
    category: "power_device",
    technology: "IP",
    technologies: ["IP"],
    channels: 4,
    network_ports: 4,
    max_cameras: 4,
    unit_price: 1080,
    base_cost: 850,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "A3645",
    source_vendor: "Mega Compu World"
  },
  "POE-SECURELINK-8CH": {
    display_name: "Securelink PoE Switch 8 Port (8 FE + 2 FE Uplink Port)",
    technical_name: "SL-POE-8FE-2FE",
    brand: "Securelink",
    category: "power_device",
    technology: "IP",
    technologies: ["IP"],
    channels: 8,
    network_ports: 8,
    max_cameras: 8,
    unit_price: 1440,
    base_cost: 1150,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "P3249",
    source_vendor: "Mega Compu World"
  },
  "POE-SECUREYE-16CH": {
    display_name: "Secureye 16-Port PoE Switch 250W (S-16FE-2UG-1UF-250W)",
    technical_name: "S-16FE-2UG-1UF-250W",
    brand: "Secureye",
    category: "power_device",
    technology: "IP",
    technologies: ["IP"],
    channels: 16,
    network_ports: 16,
    max_cameras: 16,
    unit_price: 5750,
    base_cost: 4800,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "P2235",
    source_vendor: "Mega Compu World"
  },

  // ── GIGABIT DESKTOP SWITCHES (PoE UPLINKS) ──────────────────────────────
  "SW-DLINK-5GIG": {
    display_name: "D-Link 5-Port Gigabit Desktop Switch (10/100/1000 Mbps DGS-1005A)",
    technical_name: "DGS-1005A",
    brand: "D-Link",
    category: "network",
    technology: "IP",
    technologies: ["IP", "Common"],
    channels: 5,
    unit_price: 850,
    base_cost: 650,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "P299",
    source_vendor: "Mega Compu World"
  },

  // ── CABLING (COAXIAL 3+1 & CAT6 COPPER) ─────────────────────────────────
  "CAB-HD-CPP-90": {
    display_name: "CP Plus 3+1 Coaxial Cable HD - 90 MTR Pure Copper",
    technical_name: "CP-CAG-90M-CU",
    brand: "CP Plus",
    category: "cable",
    technology: "HD",
    technologies: ["HD"],
    unit_price: 1553,
    base_cost: 1350,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    source_vendor: "Mega Compu World"
  },
  "CAB-HD-BUD-70": {
    display_name: "Budget Brand 3+1 Coaxial Cable HD - 70 MTR Copper Coated",
    technical_name: "BB-CAB31-70M",
    brand: "Budget Brand",
    category: "cable",
    technology: "HD",
    technologies: ["HD"],
    unit_price: 780,
    base_cost: 600,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    source_vendor: "Mega Compu World"
  },
  "CAB-IP-EVM-305-CU": {
    display_name: "EVM CAT6 LAN Cable Pure Copper Indoor 305M (24 AWG)",
    technical_name: "EVM-CAT6-305M-CU",
    brand: "EVM",
    category: "cable",
    technology: "IP",
    technologies: ["IP"],
    unit_price: 4160,
    base_cost: 3200,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "A3638",
    source_vendor: "Mega Compu World"
  },
  "CAB-IP-PRA-100-CU": {
    display_name: "Prama CAT6 LAN Cable Pure Copper Indoor 100M Grey (23 AWG)",
    technical_name: "PRA-CAT6-100M-CU",
    brand: "Prama",
    category: "cable",
    technology: "IP",
    technologies: ["IP"],
    unit_price: 1560,
    base_cost: 1200,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "A3673",
    source_vendor: "Mega Compu World"
  },

  // ── CONNECTORS & JUNCTION BOXES ─────────────────────────────────────────
  "CONN-BNC": {
    display_name: "A+ Products BNC Connector Copper Wire Male",
    technical_name: "APL-BNC-CU-MALE",
    brand: "A+ Products (Budget)",
    category: "connector",
    technology: "HD",
    technologies: ["HD"],
    unit_price: 23,
    base_cost: 15,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "P5322",
    source_vendor: "Mega Compu World"
  },
  "CONN-DC": {
    display_name: "Heavy Duty 12V DC Power Pin Connector",
    technical_name: "CONN-DC-PIN",
    brand: "Budget Brand",
    category: "connector",
    technology: "HD",
    technologies: ["HD"],
    unit_price: 8,
    base_cost: 5,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    source_vendor: "Mega Compu World"
  },
  "CONN-RJ45": {
    display_name: "Smart Pro RJ45 Modular Network Connector",
    technical_name: "SP-RJ45-PLUG",
    brand: "Budget Brand",
    category: "connector",
    technology: "IP",
    technologies: ["IP"],
    unit_price: 8,
    base_cost: 5,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "P429",
    source_vendor: "Mega Compu World"
  },
  "ACC-JUNCTION-BOX": {
    display_name: "Jascom PVC Waterproof Junction Box (5x5x2) with Copper Thread",
    technical_name: "JAS-JB-5X5X2",
    brand: "Jascom",
    category: "accessories",
    technology: "Common",
    technologies: ["Common", "HD", "IP", "Wireless"],
    unit_price: 30,
    base_cost: 20,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "P6091",
    source_vendor: "Mega Compu World"
  },

  // ── HDMI CABLES ─────────────────────────────────────────────────────────
  "HDMI-1.5M": {
    display_name: "High-Speed HDMI Cable 1.5 MTR (4K Support)",
    technical_name: "HDMI-1.5M-4K",
    brand: "Bungees",
    category: "hdmi_cable",
    technology: "Common",
    technologies: ["Common", "both", "HD", "IP", "Wireless"],
    unit_price: 84,
    base_cost: 60,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    source_vendor: "Mega Compu World"
  },
  "HDMI-3M": {
    display_name: "Bungees HDMI Cable 3M 4K Ultra HD",
    technical_name: "BUN-HDMI-3M-4K",
    brand: "Bungees",
    category: "hdmi_cable",
    technology: "Common",
    technologies: ["Common", "both", "HD", "IP", "Wireless"],
    unit_price: 168,
    base_cost: 120,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "P859",
    source_vendor: "Mega Compu World"
  },
  "HDMI-5M": {
    display_name: "Hi-Focus HDMI Cable 5M 4K 30Hz High-Speed",
    technical_name: "HF-HDMI-5M-4K",
    brand: "Hi-Focus",
    category: "hdmi_cable",
    technology: "Common",
    technologies: ["Common", "both", "HD", "IP", "Wireless"],
    unit_price: 252,
    base_cost: 180,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "P2948",
    source_vendor: "Mega Compu World"
  },
  "HDMI-10M": {
    display_name: "Ranz High-Speed HDMI Cable 10 MTR",
    technical_name: "RNZ-HDMI-10M",
    brand: "Ranz",
    category: "hdmi_cable",
    technology: "Common",
    technologies: ["Common", "both", "HD", "IP", "Wireless"],
    unit_price: 420,
    base_cost: 300,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    source_vendor: "Mega Compu World"
  },
  "HDMI-15M": {
    display_name: "Ranz High-Speed HDMI Cable 15 MTR",
    technical_name: "RNZ-HDMI-15M",
    brand: "Ranz",
    category: "hdmi_cable",
    technology: "Common",
    technologies: ["Common", "both", "HD", "IP", "Wireless"],
    unit_price: 630,
    base_cost: 450,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    source_vendor: "Mega Compu World"
  },
  "HDMI-20M": {
    display_name: "Ranz High-Speed HDMI Cable 20 MTR (Max Range)",
    technical_name: "RNZ-HDMI-20M",
    brand: "Ranz",
    category: "hdmi_cable",
    technology: "Common",
    technologies: ["Common", "both", "HD", "IP", "Wireless"],
    unit_price: 910,
    base_cost: 650,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    source_vendor: "Mega Compu World"
  },

  // ── RACKS & ENCLOSURES ──────────────────────────────────────────────────
  "ACC-2U-RACK-RECORDER": {
    display_name: "Ranz 2U Folding Metal Rack for DVR/NVR",
    technical_name: "RNZ-2U-RACK",
    brand: "Ranz",
    category: "rack",
    technology: "Common",
    technologies: ["Common", "HD", "IP"],
    unit_price: 490,
    base_cost: 350,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "P6312",
    source_vendor: "Mega Compu World"
  },
  "ACC-4U-RACK-RECORDER": {
    display_name: "Comrack 4U Heavy Equipment Rack for Recorder (400mm)",
    technical_name: "CMR-4U-400MM",
    brand: "Comrack",
    category: "rack",
    technology: "Common",
    technologies: ["Common", "HD", "IP"],
    unit_price: 630,
    base_cost: 450,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "P540",
    source_vendor: "Mega Compu World"
  },
  "ACC-PVC-RACK-POE": {
    display_name: "Securelink PVC Rack with PDU for DVR & PoE Switches (Up to 8Ch)",
    technical_name: "SL-PVC-RACK-8CH",
    brand: "Securelink",
    category: "rack",
    technology: "IP",
    technologies: ["IP", "HD", "Common"],
    unit_price: 630,
    base_cost: 450,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    vendor_pid: "P5018",
    source_vendor: "Mega Compu World"
  },

  // ── NETWORKING & ROUTERS ────────────────────────────────────────────────
  "ACC-4G-ROUTER": {
    display_name: "High-Speed 4G/5G SIM Wi-Fi Router (Dual Antenna)",
    technical_name: "RTR-4G-DUAL-ANT",
    brand: "Budget Brand",
    category: "network",
    technology: "Common",
    technologies: ["Common", "Wireless", "HD", "IP"],
    unit_price: 1885,
    base_cost: 1450,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    source_vendor: "Mega Compu World"
  },
  "DISP-19-INCH": {
    display_name: "19-inch Surveillance LED Display Monitor (HDMI/VGA)",
    technical_name: "MON-19-LED",
    brand: "Budget Brand",
    category: "display",
    technology: "Common",
    technologies: ["Common", "HD", "IP"],
    unit_price: 2415,
    base_cost: 2100,
    is_active: true,
    is_quotation_eligible: true,
    stock_status: "in_stock",
    source_vendor: "Mega Compu World"
  }
};

async function syncInfrastructure() {
  console.log(`Starting sync of ${Object.keys(INFRASTRUCTURE_PRODUCTS).length} infrastructure products...`);
  let count = 0;

  for (const [id, prodData] of Object.entries(INFRASTRUCTURE_PRODUCTS)) {
    const docRef = db.collection('products').doc(id);
    const existing = await docRef.get();

    await docRef.set(
      {
        ...prodData,
        id,
        created_at: existing.exists ? existing.data()?.created_at || ts : ts,
        updated_at: ts,
      },
      { merge: true }
    );
    count++;
    console.log(`[${count}] ✅ Seeded: [${prodData.category}] ${prodData.display_name} -> ₹${prodData.unit_price}`);
  }

  console.log(`\n🎉 Successfully seeded all ${count} essential infrastructure items!`);
  process.exit(0);
}

syncInfrastructure().catch(err => {
  console.error('❌ Error syncing infrastructure:', err);
  process.exit(1);
});
