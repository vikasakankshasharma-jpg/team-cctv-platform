const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/hp/Downloads/Megacompuworld';
if (!fs.existsSync(dir)) {
  console.error('Directory does not exist:', dir);
  process.exit(1);
}

const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));
console.log('HTML files in Megacompuworld:', files.length);

const allProducts = [];
const seenPids = new Set();

files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  // Match card blocks
  // Find all cards using regex
  const parts = content.split('class="pcard"');
  for (let i = 1; i < parts.length; i++) {
    const block = parts[i].split('class="pcard"')[0];
    const pidMatch = block.match(/PID:\s*([A-Za-z0-9]+)/);
    const itemMatch = block.match(/(?:Item\s*CD|Item\s*Code):\s*([A-Za-z0-9]+)/i);
    const priceMatch = block.match(/₹\s*([0-9,]+)/);
    const titleMatch = block.match(/<(?:a|h3|h2)[^>]*?(?:title|aria-label)="([^"]+)"/i) || block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);

    if (pidMatch && priceMatch) {
      const pid = pidMatch[1];
      const price = parseInt(priceMatch[1].replace(/,/g, ''), 10);
      let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
      if (!title) {
        const anyTitle = block.match(/class="[^"]*pcard-title[^"]*"[^>]*>([\s\S]*?)<\//i);
        if (anyTitle) title = anyTitle[1].replace(/<[^>]+>/g, '').trim();
      }
      
      allProducts.push({
        pid,
        item_code: itemMatch ? itemMatch[1] : '',
        title,
        price,
        file: f
      });
    }
  }
});

console.log('Total extracted card instances:', allProducts.length);

// Let's filter surveillance hard disks
const hdds = allProducts.filter(p => p.file.includes('Surveillance Hard Disk'));
console.log('\nHDDs extracted from Surveillance Hard Disk HTML:');
hdds.forEach(h => console.log(`  ${h.pid}: ${h.title} -> ₹${h.price} (${h.item_code})`));
