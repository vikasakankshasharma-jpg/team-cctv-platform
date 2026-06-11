const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const sourceDir = 'C:/Users/hp/Documents/temp_extracted/temp';
const outputJson = path.join(__dirname, 'mega_jaipur_catalog.json');

const categoryMapping = {
  "HD Camera _ Mega Compu World.html": { category: "cctv_camera", technologies: ["HD"] },
  "IP Camera _ Mega Compu World.html": { category: "cctv_camera", technologies: ["IP"] },
  "PTZ _ PT _ 4G _ WIFI Camera _ Mega Compu World.html": { category: "cctv_camera", technologies: ["Wireless"] },
  "HD DVR _ Mega Compu World.html": { category: "recorder", technologies: ["HD"] },
  "IP NVR _ Mega Compu World.html": { category: "recorder", technologies: ["IP"] },
  "Surveillance Hard Disk _ Mega Jaipur.html": { category: "storage", technologies: ["Common"] },
  "Pull Out Hard Disk _ Mega Jaipur.html": { category: "storage", technologies: ["Common"] },
  "3+1 CCTV Cables _ Mega Jaipur.html": { category: "cable", technologies: ["HD"] }, // Coaxial mostly HD
  "LAN Cables (CAT6) _ Mega Jaipur.html": { category: "cable", technologies: ["IP"] }, // CAT6 mostly IP
  "HDMI Cables _ Mega Jaipur.html": { category: "hdmi_cable", technologies: ["Common"] },
  "Power Supply _ Adapter _ Mega Compu World.html": { category: "power_device", technologies: ["HD"] }, // SMPS mostly HD
  "Poe Switch _ Mega Compu World.html": { category: "network", technologies: ["IP"] }, // PoE is IP
  "Led _ Monitor _ Mega Compu World.html": { category: "display", technologies: ["Common"] },
  "Point To Point (P2P) _ Mega Jaipur.html": { category: "network", technologies: ["Wireless"] },
  "Router _ Access Point _ Range Extender _ Mega Compu.html": { category: "network", technologies: ["Wireless", "IP"] },
  "Accessories CCTV & Networking _ Mega Jaipur.html": { category: "accessories", technologies: ["Common"] }
};

async function parseCatalog() {
  const files = fs.readdirSync(sourceDir).filter(f => f.endsWith('.html'));
  
  const allProducts = [];

  for (const file of files) {
    const filePath = path.join(sourceDir, file);
    const html = fs.readFileSync(filePath, 'utf8');
    const $ = cheerio.load(html);

    const mapping = categoryMapping[file];
    if (!mapping) {
      console.warn(`No mapping found for file: ${file}`);
      continue;
    }

    // In Journal3, products are usually in .product-layout
    const products = $('.product-layout');
    
    console.log(`Processing ${file} - Found ${products.length} products`);

    products.each((i, el) => {
      const name = $(el).find('.name a').text().trim();
      let priceText = $(el).find('.price-new').text().trim() || $(el).find('.price').text().trim();
      
      // Clean up price (remove non-digits like â‚¹, Rs, commas)
      let price = 0;
      if (priceText) {
         // Some prices are "Ex Tax: â‚¹1,200", we want the main price
         const mainPriceStr = priceText.split('Ex Tax')[0].replace(/[^0-9.]/g, '');
         price = parseFloat(mainPriceStr) || 0;
      }

      const prodIdText = $(el).find('.ProcudtIdBx').text().trim();
      const itemCdText = $(el).find('.ProcudtCdBx').text().trim();
      let internal_sku = "";
      if (prodIdText) internal_sku = prodIdText.replace('Product ID:', '').trim();
      else if (itemCdText) internal_sku = itemCdText.replace('Item CD:', '').trim();

      if (name) {
        // Attempt to guess Brand from name
        let brand = "Unknown";
        if (name.toLowerCase().includes("hikvision")) brand = "Hikvision";
        else if (name.toLowerCase().includes("cp plus")) brand = "CP Plus";
        else if (name.toLowerCase().includes("dahua")) brand = "Dahua";
        else if (name.toLowerCase().includes("seagate")) brand = "Seagate";
        else if (name.toLowerCase().includes("wd") || name.toLowerCase().includes("western digital")) brand = "WD";
        else if (name.toLowerCase().includes("toshiba")) brand = "Toshiba";
        else if (name.toLowerCase().includes("d-link")) brand = "D-Link";
        else if (name.toLowerCase().includes("tp-link")) brand = "TP-Link";
        else if (name.toLowerCase().includes("e-vision")) brand = "E-Vision";
        else if (name.toLowerCase().includes("secure eye") || name.toLowerCase().includes("secureeye")) brand = "SecureEye";

        allProducts.push({
          display_name: name,
          technical_name: name, // Placeholder
          brand: brand,
          category: mapping.category,
          technologies: mapping.technologies,
          unit_price: price, // Assume retail
          base_cost: Math.round(price * 0.8), // Placeholder 20% margin
          margin_percentage: 20,
          is_active: true,
          internal_sku: internal_sku,
          catalog_path: file.replace(' _ Mega Compu World.html', '').replace(' _ Mega Jaipur.html', '')
        });
      }
    });
  }

  fs.writeFileSync(outputJson, JSON.stringify(allProducts, null, 2));
  console.log(`\nSuccessfully extracted ${allProducts.length} products to ${outputJson}`);
}

parseCatalog().catch(console.error);
