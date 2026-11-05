const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });
const admin = require('firebase-admin');

// 1. Extract all products from downloaded HTML files in Megacompuworld
const dir = 'C:/Users/hp/Downloads/Megacompuworld';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const megaProductsByPid = new Map();
const megaProductsByItemCode = new Map();
const megaProducts = [];

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
      
      const item = { pid, itemCode, title, price, file: f };
      megaProducts.push(item);
      megaProductsByPid.set(pid, item);
      if (itemCode) megaProductsByItemCode.set(itemCode, item);
    }
  }
});

console.log(`Loaded ${megaProducts.length} items from ${files.length} HTML files.`);

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

function normalizeStr(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function audit() {
  const snap = await db.collection('products').get();
  console.log(`Auditing ${snap.docs.length} Firestore products against Mega Compu World public non-login prices...`);

  const results = {
    exactMatch: [],
    priceMismatch: [],
    customOrBudget: [],
    unmatched: []
  };

  snap.docs.forEach(doc => {
    const p = doc.data();
    const docId = doc.id;
    const vendorPid = (p.vendor_pid || p.pid || p.sku || '').toUpperCase();
    const internalSku = (p.internal_sku || '').toUpperCase();
    const itemCode = (p.item_code || p.item_cd || '').toUpperCase();

    // Try finding Mega product
    let mega = megaProductsByPid.get(vendorPid) || megaProductsByPid.get(internalSku);
    if (!mega && itemCode) {
      mega = megaProductsByItemCode.get(itemCode);
    }
    if (!mega) {
      // Try by exact or fuzzy title
      const pNorm = normalizeStr(p.display_name);
      mega = megaProducts.find(m => {
        const mNorm = normalizeStr(m.title);
        return mNorm === pNorm || (pNorm.length > 15 && mNorm.includes(pNorm)) || (mNorm.length > 15 && pNorm.includes(mNorm));
      });
    }

    // Try matching specific model codes in title (e.g., 2CE70DF0T, TA24PL2C, etc.)
    if (!mega && p.technical_name) {
      const tech = normalizeStr(p.technical_name);
      if (tech.length >= 5) {
        mega = megaProducts.find(m => normalizeStr(m.title).includes(tech));
      }
    }

    if (mega) {
      if (p.unit_price === mega.price) {
        results.exactMatch.push({ id: docId, name: p.display_name, price: p.unit_price, megaTitle: mega.title, pid: mega.pid });
      } else {
        results.priceMismatch.push({
          id: docId,
          name: p.display_name,
          category: p.category,
          currentPrice: p.unit_price,
          megaPrice: mega.price,
          difference: p.unit_price - mega.price,
          megaTitle: mega.title,
          pid: mega.pid
        });
      }
    } else {
      if (docId.startsWith('HDD-BUD') || docId.startsWith('ACC-') || docId.startsWith('CAB-ELEC') || docId.includes('generic') || p.brand === 'Budget Brand') {
        results.customOrBudget.push({ id: docId, name: p.display_name, category: p.category, price: p.unit_price });
      } else {
        results.unmatched.push({ id: docId, name: p.display_name, category: p.category, brand: p.brand, price: p.unit_price });
      }
    }
  });

  console.log(`\n=== AUDIT SUMMARY ===`);
  console.log(`- Exact Price Matches: ${results.exactMatch.length}`);
  console.log(`- Price Mismatches: ${results.priceMismatch.length}`);
  console.log(`- Custom / Budget Items (not sold on Mega): ${results.customOrBudget.length}`);
  console.log(`- Unmatched Catalog Items: ${results.unmatched.length}`);

  if (results.priceMismatch.length > 0) {
    console.log(`\n=== ⚠️ PRICE MISMATCHES FOUND (${results.priceMismatch.length}) ===`);
    results.priceMismatch.forEach(m => {
      console.log(`\n[${m.id}] ${m.name} (${m.category})`);
      console.log(`  Current Firestore unit_price: ₹${m.currentPrice}`);
      console.log(`  Mega Compu World Price:     ₹${m.megaPrice} (PID: ${m.pid})`);
      console.log(`  Difference:                  ${m.difference > 0 ? '+' : ''}₹${m.difference}`);
      console.log(`  Mega Product Title:          ${m.megaTitle}`);
    });
  }

  if (results.unmatched.length > 0) {
    console.log(`\n=== 🔍 UNMATCHED ITEMS (${results.unmatched.length}) ===`);
    results.unmatched.forEach(u => {
      console.log(`[${u.id}] ${u.name} | Cat: ${u.category} | Brand: ${u.brand} | ₹${u.price}`);
    });
  }
}

audit().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
