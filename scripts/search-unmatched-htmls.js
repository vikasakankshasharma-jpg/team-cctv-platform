const fs = require('fs');
const path = require('path');

const dir = 'C:/Users/hp/Downloads/Megacompuworld';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.html'));

const queries = [
  '2CE70KF0T',
  '0401E',
  '0801E',
  '1601E',
  '7116HGHI',
  'DR1A08Q',
  'SanDisk',
  'EVM',
  'Multybyte',
  'CP Plus',
  'Securelink',
  'Comrack',
  'Skyhawk 1TB',
  'Purple 1TB'
];

files.forEach(f => {
  const content = fs.readFileSync(path.join(dir, f), 'utf8');
  queries.forEach(q => {
    if (content.toLowerCase().includes(q.toLowerCase())) {
      // Find cards containing q
      const parts = content.split('class="pcard"');
      for (let i = 1; i < parts.length; i++) {
        const block = parts[i].split('class="pcard"')[0];
        if (block.toLowerCase().includes(q.toLowerCase())) {
          const pidMatch = block.match(/PID:\s*([A-Za-z0-9]+)/);
          const priceMatch = block.match(/₹\s*([0-9,]+)/);
          const titleMatch = block.match(/<(?:a|h3|h2)[^>]*?(?:title|aria-label)="([^"]+)"/i) || block.match(/<h3[^>]*>([\s\S]*?)<\/h3>/i);
          let title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : '';
          console.log(`[${f}] MATCH "${q}": PID: ${pidMatch ? pidMatch[1] : 'N/A'}, Price: ₹${priceMatch ? priceMatch[1] : 'N/A'}, Title: ${title}`);
        }
      }
    }
  });
});
