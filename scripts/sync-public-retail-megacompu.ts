/**
 * @file scripts/sync-public-retail-megacompu.ts
 * @description Synchronizes all product customer retail prices (without login) in Firestore
 * with Mega Compu World (megajaipur.com) live public catalog.
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.join(__dirname, '../.env.local') });
import * as admin from 'firebase-admin';

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
let privateKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

if (!admin.apps.length) {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON))
    });
  } else {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey })
    });
  }
}

const db = admin.firestore();

// 1. Exact non-login customer retail prices from Mega Compu World (megajaipur.com)
// Source: Live screenshot media_1793876978122_ac4fd15d.jpg and C:\Users\hp\Downloads\Megacompuworld HTML files
const MEGA_COMPU_UPDATES: Record<string, {
  unit_price: number;
  margin_percentage: number;
  vendor_pid?: string;
  display_name?: string;
  brand?: string;
  category?: string;
  storage_capacity_tb?: number;
  storage_type?: string;
  technologies?: string[];
  is_active?: boolean;
  is_quotation_eligible?: boolean;
}> = {
  // --- SURVEILLANCE HARD DISKS (megajaipur.com/data-storage/surveillance-hard-disk) ---
  'hdd_2tb_wd_purple': {
    display_name: 'WD Purple 2TB Surveillance Hard Disk (3.5" SATA)',
    brand: 'WD',
    category: 'storage',
    vendor_pid: 'P104',
    unit_price: 12508, // Was ₹5,500
    margin_percentage: 8,
    storage_capacity_tb: 2,
    storage_type: 'Surveillance HDD',
    technologies: ['Common', 'HD', 'IP'],
    is_active: true,
    is_quotation_eligible: true
  },
  'hdd_2tb_seagate_skyhawk': {
    display_name: 'Seagate SkyHawk 2TB Surveillance HDD (3.5" SATA)',
    brand: 'Seagate',
    category: 'storage',
    vendor_pid: 'P4190',
    unit_price: 12455,
    margin_percentage: 8,
    storage_capacity_tb: 2,
    storage_type: 'Surveillance HDD',
    technologies: ['Common', 'HD', 'IP'],
    is_active: true,
    is_quotation_eligible: true
  },
  'hdd_2tb_toshiba': {
    display_name: 'Toshiba S300 2TB Surveillance HDD (3.5" SATA)',
    brand: 'Toshiba',
    category: 'storage',
    vendor_pid: 'P101',
    unit_price: 12065,
    margin_percentage: 8,
    storage_capacity_tb: 2,
    storage_type: 'Surveillance HDD',
    technologies: ['Common', 'HD', 'IP'],
    is_active: true,
    is_quotation_eligible: true
  },
  'hdd_4tb_wd_purple': {
    display_name: 'WD Purple 4TB Surveillance Hard Disk (3.5" SATA)',
    brand: 'WD',
    category: 'storage',
    vendor_pid: 'P105',
    unit_price: 17906, // Was ₹8,800
    margin_percentage: 8,
    storage_capacity_tb: 4,
    storage_type: 'Surveillance HDD',
    technologies: ['Common', 'HD', 'IP'],
    is_active: true,
    is_quotation_eligible: true
  },
  'hdd_4tb_seagate_skyhawk': {
    display_name: 'Seagate SkyHawk 4TB Surveillance HDD (3.5" SATA)',
    brand: 'Seagate',
    category: 'storage',
    vendor_pid: 'P4192',
    unit_price: 17300,
    margin_percentage: 8,
    storage_capacity_tb: 4,
    storage_type: 'Surveillance HDD',
    technologies: ['Common', 'HD', 'IP'],
    is_active: true,
    is_quotation_eligible: true
  },
  'hdd_6tb_wd_purple': {
    display_name: 'WD Purple 6TB Surveillance Hard Disk (3.5" SATA)',
    brand: 'WD',
    category: 'storage',
    vendor_pid: 'P106',
    unit_price: 26267, // Was ₹13,500
    margin_percentage: 8,
    storage_capacity_tb: 6,
    storage_type: 'Surveillance HDD',
    technologies: ['Common', 'HD', 'IP'],
    is_active: true,
    is_quotation_eligible: true
  },
  'hdd_6tb_seagate_skyhawk': {
    display_name: 'Seagate SkyHawk 6TB Surveillance HDD (3.5" SATA)',
    brand: 'Seagate',
    category: 'storage',
    vendor_pid: 'P4194',
    unit_price: 26267,
    margin_percentage: 8,
    storage_capacity_tb: 6,
    storage_type: 'Surveillance HDD',
    technologies: ['Common', 'HD', 'IP'],
    is_active: true,
    is_quotation_eligible: true
  },
  'hdd_8tb_seagate_skyhawk': {
    display_name: 'Seagate SkyHawk 8TB Surveillance HDD (3.5" SATA)',
    brand: 'Seagate',
    category: 'storage',
    vendor_pid: 'P4198',
    unit_price: 38409,
    margin_percentage: 8,
    storage_capacity_tb: 8,
    storage_type: 'Surveillance HDD',
    technologies: ['Common', 'HD', 'IP'],
    is_active: true,
    is_quotation_eligible: true
  },
  'hdd_8tb_wd_purple_pro': {
    display_name: 'WD Purple Pro 8TB Surveillance Hard Disk (3.5" SATA)',
    brand: 'WD',
    category: 'storage',
    vendor_pid: 'P107',
    unit_price: 38572,
    margin_percentage: 8,
    storage_capacity_tb: 8,
    storage_type: 'Surveillance HDD',
    technologies: ['Common', 'HD', 'IP'],
    is_active: true,
    is_quotation_eligible: true
  },
  'hdd_10tb_toshiba': {
    display_name: 'Toshiba S300 10TB Surveillance HDD (3.5" SATA)',
    brand: 'Toshiba',
    category: 'storage',
    vendor_pid: 'A1469',
    unit_price: 48941,
    margin_percentage: 8,
    storage_capacity_tb: 10,
    storage_type: 'Surveillance HDD',
    technologies: ['Common', 'HD', 'IP'],
    is_active: true,
    is_quotation_eligible: true
  },
  'hdd_10tb_wd_purple_pro': {
    display_name: 'WD Purple Pro 10TB Surveillance Hard Disk (3.5" SATA)',
    brand: 'WD',
    category: 'storage',
    vendor_pid: 'A1414',
    unit_price: 50950,
    margin_percentage: 8,
    storage_capacity_tb: 10,
    storage_type: 'Surveillance HDD',
    technologies: ['Common', 'HD', 'IP'],
    is_active: true,
    is_quotation_eligible: true
  },
  'hdd_10tb_seagate_skyhawk': {
    display_name: 'Seagate SkyHawk 10TB Surveillance HDD (3.5" SATA)',
    brand: 'Seagate',
    category: 'storage',
    vendor_pid: 'P4200',
    unit_price: 51419,
    margin_percentage: 8,
    storage_capacity_tb: 10,
    storage_type: 'Surveillance HDD',
    technologies: ['Common', 'HD', 'IP'],
    is_active: true,
    is_quotation_eligible: true
  },

  // --- CAMERAS & RECORDERS ---
  'CAM-TRU-HD-T18300': {
    vendor_pid: 'A3549',
    unit_price: 1534, // Was ₹1,450
    margin_percentage: 15
  },
  'REC-HIK-DVR-7108HGHI': {
    vendor_pid: 'A1788',
    unit_price: 4660, // Was ₹4,350
    margin_percentage: 15
  },
  'REC-HIK-DVR-7116HGHI': {
    vendor_pid: 'A2049',
    unit_price: 8191, // Was ₹6,850
    margin_percentage: 15
  },

  // --- ACCESSORIES & CABLING ---
  'HDMI-10M': {
    vendor_pid: 'P6037',
    unit_price: 266, // Was ₹450
    margin_percentage: 25
  },
  'HDMI-15M': {
    vendor_pid: 'P5415',
    unit_price: 390, // Was ₹680
    margin_percentage: 25
  },
  'HDMI-20M': {
    vendor_pid: 'A2832',
    unit_price: 474, // Was ₹950
    margin_percentage: 25
  },
  'cable_hdmi_1_5m': {
    vendor_pid: 'A2819',
    unit_price: 134, // Was ₹220
    margin_percentage: 25
  },
  'cable_hdmi_3m': {
    vendor_pid: 'A2829',
    unit_price: 152, // Was ₹350
    margin_percentage: 25
  },
  'cable_hdmi_5m': {
    vendor_pid: 'A2828',
    unit_price: 159, // Was ₹550
    margin_percentage: 25
  },
  'mount_pvc_junction_box_4x4': {
    vendor_pid: 'P7684',
    unit_price: 27, // Was ₹35
    margin_percentage: 25
  },
  'mount_pvc_junction_box_ip_475': {
    vendor_pid: 'P1788',
    unit_price: 36, // Was ₹45
    margin_percentage: 25
  },
  'rack_4u_wall_cctv': {
    vendor_pid: 'P540',
    unit_price: 2443, // Was ₹1,850
    margin_percentage: 25
  },

  // --- MICROSD CARDS ---
  'SD-SANDISK-64GB-HE': {
    vendor_pid: 'A1567',
    unit_price: 904, // Was ₹850
    margin_percentage: 15
  },
  'SD-SANDISK-128GB-HE': {
    vendor_pid: 'A1566',
    unit_price: 1848, // Was ₹1,450
    margin_percentage: 15
  },
  'SD-EVM-256GB': {
    vendor_pid: 'A1565',
    unit_price: 3584, // Was ₹2,450
    margin_percentage: 15
  }
};

async function executeSync() {
  console.log("==> Beginning Strict Non-Login Price Sync with Mega Compu World...");

  const batch = db.batch();
  let updateCount = 0;

  for (const [docId, update] of Object.entries(MEGA_COMPU_UPDATES)) {
    const docRef = db.collection('products').doc(docId);
    const existing = await docRef.get();

    const unit_price = update.unit_price;
    const margin = update.margin_percentage;
    const base_cost = Math.round(unit_price / (1 + margin / 100));

    const payload: any = {
      ...update,
      unit_price,
      base_cost,
      margin_percentage: margin,
      source_vendor: "Mega Compu World",
      updated_at: admin.firestore.FieldValue.serverTimestamp()
    };

    if (existing.exists) {
      batch.update(docRef, payload);
      console.log(`[UPDATE] ${docId}: ₹${existing.data()?.unit_price} -> ₹${unit_price} (Dealer Cost: ₹${base_cost}, Margin: +${margin}%)`);
    } else {
      batch.set(docRef, {
        ...payload,
        created_at: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`[CREATE] ${docId}: ₹${unit_price} (Dealer Cost: ₹${base_cost}, Margin: +${margin}%)`);
    }
    updateCount++;
  }

  await batch.commit();
  console.log(`\n==> Successfully synced ${updateCount} products to exact Mega Compu World retail prices!`);
}

executeSync().then(() => process.exit(0)).catch(err => {
  console.error("Error executing sync:", err);
  process.exit(1);
});
