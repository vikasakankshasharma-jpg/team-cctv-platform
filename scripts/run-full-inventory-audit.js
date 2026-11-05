const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const admin = require('firebase-admin');

// 1. Load Mega Compu World products from all 33 HTML files + clean_retail_megacompu.json
const dir = 'C:/Users/hp/Downloads/Megacompuworld';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const megaCatalog = new Map(); // key -> item
const megaByPid = new Map();
const megaByItemCode = new Map();

function cleanTitle(t) {
  return (t || '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalize(s) {
  return (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

// Ingest from HTML files
files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  const parts = content.split('class="pcard"');
  for (let i = 1; i < parts.length; i++) {
    const block = parts[i].split('class="pcard"')[0];
    const pidMatch = block.match(/PID:\s*([A-Za-z0-9]+)/);
    const itemMatch = block.match(/(?:Item\s*CD|Item\s*Code):\s*([A-Za-z0-9]+)/i);
    const priceMatch = block.match(/₹\s*([0-9,]+)/);
    const titleMatch = block.match(/<(?:a|h3|h2)[^>]*?(?:title|aria-label)="([^"]+)"/i) || block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);

    if (pidMatch && priceMatch) {
      const pid = pidMatch[1].toUpperCase();
      const itemCode = itemMatch ? itemMatch[1].toUpperCase() : '';
      const price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      if (!title) {
        const anyTitle = block.match(/class="[^"]*pcard-title[^"]*"[^>]*>([\s\S]*?)<\//i);
        if (anyTitle) title = anyTitle[1].replace(/<[^>]+>/g, '').trim();
      }
      title = cleanTitle(title);

      const entry = { pid, itemCode, title, price, file: f };
      megaCatalog.set(pid, entry);
      megaByPid.set(pid, entry);
      if (itemCode) megaByItemCode.set(itemCode, entry);
    }
  }
});

// Also ingest from clean_retail_megacompu.json for any extra items
if (fs.existsSync(path.join(__dirname, '../clean_retail_megacompu.json'))) {
  const cleanJson = JSON.parse(fs.readFileSync(path.join(__dirname, '../clean_retail_megacompu.json'), 'utf8'));
  cleanJson.forEach(it => {
    const pid = (it.pid || it.key || '').toUpperCase();
    if (pid && it.price > 0 && !megaByPid.has(pid)) {
      const entry = {
        pid,
        itemCode: (it.item_code || '').toUpperCase(),
        title: cleanTitle(it.title),
        price: it.price,
        file: 'clean_retail_megacompu.json'
      };
      megaCatalog.set(pid, entry);
      megaByPid.set(pid, entry);
      if (entry.itemCode) megaByItemCode.set(entry.itemCode, entry);
    }
  });
}

// Special known live rates from today's live Mega Compu World screenshot (5 Nov 2026, 16:39):
// P4198 (Seagate 8TB): ₹38,409
// P107 (WD Purple Pro 8TB): ₹38,572
if (megaByPid.has('P4198')) megaByPid.get('P4198').price = 38409;
if (megaByPid.has('P107')) megaByPid.get('P107').price = 38572;

console.log(`Loaded ${megaCatalog.size} total verified unique products from Mega Compu World.`);

// 2. Connect to Firestore
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

async function runFullInventoryTest() {
  const snap = await db.collection('products').get();
  console.log(`Auditing ALL ${snap.docs.length} products in Firestore inventory against Mega Compu World...`);

  const exactMatches = [];
  const priceMismatches = [];
  const notFoundOnVendor = [];

  const megaValues = Array.from(megaCatalog.values());

  snap.docs.forEach(doc => {
    const p = doc.data();
    const docId = doc.id;
    if (p.is_deleted === true) return;

    const vendorPid = (p.vendor_pid || p.pid || p.sku || '').toUpperCase();
    const internalSku = (p.internal_sku || '').toUpperCase();
    const itemCode = (p.item_code || p.item_cd || '').toUpperCase();

    let match = null;

    // 1. Direct PID lookup
    if (vendorPid && megaByPid.has(vendorPid)) {
      match = megaByPid.get(vendorPid);
    } else if (internalSku && megaByPid.has(internalSku)) {
      match = megaByPid.get(internalSku);
    } else if (megaByPid.has(docId.toUpperCase())) {
      match = megaByPid.get(docId.toUpperCase());
    }

    // 2. Item Code lookup
    if (!match && itemCode && megaByItemCode.has(itemCode)) {
      match = megaByItemCode.get(itemCode);
    }

    // 3. Technical model lookup
    if (!match && p.technical_name) {
      const techNorm = normalize(p.technical_name);
      if (techNorm.length >= 5) {
        match = megaValues.find(m => normalize(m.title).includes(techNorm));
      }
    }

    // 4. Exact / Normalized title lookup
    if (!match && p.display_name) {
      const titleNorm = normalize(p.display_name);
      match = megaValues.find(m => {
        const mNorm = normalize(m.title);
        return mNorm === titleNorm || (titleNorm.length > 20 && mNorm.includes(titleNorm)) || (mNorm.length > 20 && titleNorm.includes(mNorm));
      });
    }

    // Classify
    if (match) {
      const currentPrice = Number(p.unit_price || 0);
      const vendorPrice = Number(match.price);
      if (currentPrice === vendorPrice) {
        exactMatches.push({
          id: docId,
          name: p.display_name,
          category: p.category,
          brand: p.brand,
          unit_price: currentPrice,
          vendor_pid: match.pid,
          vendor_title: match.title,
          vendor_price: vendorPrice
        });
      } else {
        priceMismatches.push({
          id: docId,
          name: p.display_name,
          category: p.category,
          brand: p.brand,
          current_price: currentPrice,
          vendor_price: vendorPrice,
          diff: currentPrice - vendorPrice,
          vendor_pid: match.pid,
          vendor_title: match.title
        });
      }
    } else {
      notFoundOnVendor.push({
        id: docId,
        name: p.display_name,
        category: p.category,
        brand: p.brand,
        current_price: Number(p.unit_price || 0),
        reason: docId.startsWith('HDD-BUD') ? 'Budget/Refurbished Storage (Not stocked by OEM distributor)'
              : docId.startsWith('CAB-ELEC') ? 'Standard electrical power wire per meter (General hardware)'
              : docId.startsWith('ACC-PVC') ? 'Weatherproof custom PoE enclosure box'
              : docId.startsWith('connector_') ? 'Raw termination accessories (BNC / DC pin loose)'
              : docId.startsWith('display_') ? 'General surveillance LED monitor'
              : 'Specialized local / standalone SKU'
      });
    }
  });

  const report = {
    totalProducts: snap.docs.length,
    exactMatchesCount: exactMatches.length,
    priceMismatchesCount: priceMismatches.length,
    notFoundOnVendorCount: notFoundOnVendor.length,
    exactMatches,
    priceMismatches,
    notFoundOnVendor
  };

  fs.writeFileSync(path.join(__dirname, '../full_inventory_audit_report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(`\nAudit complete!`);
  console.log(`- Exact Matches with Vendor: ${exactMatches.length}`);
  console.log(`- Price Mismatches with Vendor: ${priceMismatches.length}`);
  console.log(`- Not Found on Vendor Website: ${notFoundOnVendor.length}`);

  if (priceMismatches.length > 0) {
    console.log(`\n=== PRICE MISMATCHES ===`);
    priceMismatches.forEach(m => {
      console.log(`[${m.id}] ${m.name} | Our: ₹${m.current_price} vs Vendor: ₹${m.vendor_price} (PID: ${m.vendor_pid})`);
    });
  }

  console.log(`\n=== NOT FOUND ON VENDOR (Sample) ===`);
  notFoundOnVendor.forEach(n => {
    console.log(`[${n.id}] ${n.name} | Cat: ${n.category} | Brand: ${n.brand} | Our Price: ₹${n.current_price} | Reason: ${n.reason}`);
  });
}

runFullInventoryTest().then(() => process.exit(0)).catch(err => {
  console.error("Audit error:", err);
  process.exit(1);
});
