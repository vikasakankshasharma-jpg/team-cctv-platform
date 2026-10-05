const fs = require('fs');
const db = JSON.parse(fs.readFileSync('db_dump.json', 'utf8'));

// Expected prices from Excel sheet
const expected = [
  // HD Analog Cameras
  { match: (p) => p.brand === 'CP Plus' && p.category === 'cctv_camera' && p.technology === 'HD' && p.resolution === '2MP' && p.night_vision === 'Black & White' && p.form_factor === 'Dome', cost: 1000, name: 'CP Plus 2MP B&W Dome' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'cctv_camera' && p.technology === 'HD' && p.resolution === '2MP' && p.night_vision === 'Black & White' && p.form_factor === 'Bullet', cost: 1050, name: 'CP Plus 2MP B&W Bullet' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'cctv_camera' && p.technology === 'HD' && p.resolution === '2MP' && p.night_vision === 'Color' && p.form_factor === 'Dome', cost: 1250, name: 'CP Plus 2MP Color Dome' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'cctv_camera' && p.technology === 'HD' && p.resolution === '2MP' && p.night_vision === 'Color' && p.form_factor === 'Bullet', cost: 1300, name: 'CP Plus 2MP Color Bullet' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'cctv_camera' && p.technology === 'HD' && p.resolution === '5MP' && p.night_vision === 'Color' && p.form_factor === 'Dome', cost: 1600, name: 'CP Plus 5MP Color Dome' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'cctv_camera' && p.technology === 'HD' && p.resolution === '5MP' && p.night_vision === 'Color' && p.form_factor === 'Bullet', cost: 1650, name: 'CP Plus 5MP Color Bullet' },
  { match: (p) => p.brand === 'Budget Brand' && p.category === 'cctv_camera' && p.technology === 'HD' && p.resolution === '2MP' && p.night_vision === 'Color' && p.form_factor === 'Dome', cost: 700, name: 'Budget 2MP Color Dome' },
  { match: (p) => p.brand === 'Budget Brand' && p.category === 'cctv_camera' && p.technology === 'HD' && p.resolution === '2MP' && p.night_vision === 'Color' && p.form_factor === 'Bullet', cost: 750, name: 'Budget 2MP Color Bullet' },
  
  // HD DVR
  { match: (p) => p.brand === 'CP Plus' && p.category === 'recorder' && p.technology === 'HD' && p.channels === 4 && p.max_camera_resolution === '2MP', cost: 3700, name: 'CP Plus 4Ch 2MP DVR' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'recorder' && p.technology === 'HD' && p.channels === 8 && p.max_camera_resolution === '2MP', cost: 4800, name: 'CP Plus 8Ch 2MP DVR' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'recorder' && p.technology === 'HD' && p.channels === 16 && p.max_camera_resolution === '2MP', cost: 8100, name: 'CP Plus 16Ch 2MP DVR' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'recorder' && p.technology === 'HD' && p.channels === 4 && p.max_camera_resolution === '5MP', cost: 5750, name: 'CP Plus 4Ch 5MP DVR' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'recorder' && p.technology === 'HD' && p.channels === 8 && p.max_camera_resolution === '5MP', cost: 8100, name: 'CP Plus 8Ch 5MP DVR' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'recorder' && p.technology === 'HD' && p.channels === 16 && p.max_camera_resolution === '5MP', cost: 13300, name: 'CP Plus 16Ch 5MP DVR' },
  
  // Power Supply
  { match: (p) => p.brand === 'CP Plus' && p.category === 'power' && p.channels === 8, cost: 600, name: 'CP Plus 8Ch Power Supply' },
  { match: (p) => p.brand === 'Budget Brand' && p.category === 'power' && p.channels === 8, cost: 350, name: 'Budget 8Ch Power Supply' },
  
  // Storage
  { match: (p) => p.brand === 'Budget Brand' && (p.category === 'storage' || p.storage_type === 'Hard Disk') && p.capacity === '500GB', cost: 1800, name: 'Budget 500GB HDD' },
  { match: (p) => p.brand === 'Budget Brand' && (p.category === 'storage' || p.storage_type === 'Hard Disk') && p.capacity === '1TB', cost: 5200, name: 'Budget 1TB HDD' },
  { match: (p) => p.brand === 'Budget Brand' && (p.category === 'storage' || p.storage_type === 'Hard Disk') && p.capacity === '2TB', cost: 8000, name: 'Budget 2TB HDD' },
  { match: (p) => p.brand === 'Budget Brand' && (p.category === 'storage' || p.storage_type === 'Hard Disk') && p.capacity === '4TB', cost: 15000, name: 'Budget 4TB HDD' },
  { match: (p) => p.brand === 'Seagate' && (p.category === 'storage' || p.storage_type === 'Hard Disk') && p.capacity === '1TB', cost: 9500, name: 'Seagate 1TB HDD' },
  { match: (p) => p.brand === 'Seagate' && (p.category === 'storage' || p.storage_type === 'Hard Disk') && p.capacity === '2TB', cost: 10900, name: 'Seagate 2TB HDD' },
  { match: (p) => p.brand === 'Seagate' && (p.category === 'storage' || p.storage_type === 'Hard Disk') && p.capacity === '4TB', cost: 18500, name: 'Seagate 4TB HDD' },
  
  // Network NVR
  { match: (p) => p.brand === 'CP Plus' && p.category === 'recorder' && p.technology === 'IP' && p.channels === 4, cost: 4700, name: 'CP Plus 4Ch IP NVR' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'recorder' && p.technology === 'IP' && p.channels === 8, cost: 5200, name: 'CP Plus 8Ch IP NVR' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'recorder' && p.technology === 'IP' && p.channels === 16, cost: 8300, name: 'CP Plus 16Ch IP NVR' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'recorder' && p.technology === 'IP' && p.channels === 32, cost: 15000, name: 'CP Plus 32Ch IP NVR' },
  
  // IP Cameras
  { match: (p) => p.brand === 'CP Plus' && p.category === 'cctv_camera' && p.technology === 'IP' && p.resolution === '2MP' && p.form_factor === 'Dome', cost: 3100, name: 'CP Plus 2MP IP Dome ECO' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'cctv_camera' && p.technology === 'IP' && p.resolution === '2MP' && p.form_factor === 'Bullet', cost: 3200, name: 'CP Plus 2MP IP Bullet ECO' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'cctv_camera' && p.technology === 'IP' && p.resolution === '4MP' && p.form_factor === 'Dome', cost: 3900, name: 'CP Plus 4MP IP Dome Normal' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'cctv_camera' && p.technology === 'IP' && p.resolution === '4MP' && p.form_factor === 'Bullet', cost: 4000, name: 'CP Plus 4MP IP Bullet Normal' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'cctv_camera' && p.technology === 'IP' && p.resolution === '6MP' && p.form_factor === 'Dome', cost: 5200, name: 'CP Plus 6MP IP Dome Normal' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'cctv_camera' && p.technology === 'IP' && p.resolution === '6MP' && p.form_factor === 'Bullet', cost: 5250, name: 'CP Plus 6MP IP Bullet Normal' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'cctv_camera' && p.technology === 'IP' && p.resolution === '8MP' && p.form_factor === 'Dome', cost: 7500, name: 'CP Plus 8MP IP Dome Premium' },
  { match: (p) => p.brand === 'CP Plus' && p.category === 'cctv_camera' && p.technology === 'IP' && p.resolution === '8MP' && p.form_factor === 'Bullet', cost: 7500, name: 'CP Plus 8MP IP Bullet Premium' },
  { match: (p) => p.brand === 'Budget Brand' && p.category === 'cctv_camera' && p.technology === 'IP' && p.resolution === '5MP' && p.form_factor === 'Dome' && (p.tier === 'ECO' || (p.display_name && p.display_name.includes('ECO'))), cost: 1400, name: 'Budget 5MP IP Dome ECO' },
  { match: (p) => p.brand === 'Budget Brand' && p.category === 'cctv_camera' && p.technology === 'IP' && p.resolution === '5MP' && p.form_factor === 'Bullet' && (p.tier === 'ECO' || (p.display_name && p.display_name.includes('ECO'))), cost: 1450, name: 'Budget 5MP IP Bullet ECO' },
  { match: (p) => p.brand === 'Budget Brand' && p.category === 'cctv_camera' && p.technology === 'IP' && p.resolution === '5MP' && p.form_factor === 'Dome' && (!p.tier || p.tier !== 'ECO') && (!p.display_name || !p.display_name.includes('ECO')), cost: 2000, name: 'Budget 5MP IP Dome Premium' },
  { match: (p) => p.brand === 'Budget Brand' && p.category === 'cctv_camera' && p.technology === 'IP' && p.resolution === '5MP' && p.form_factor === 'Bullet' && (!p.tier || p.tier !== 'ECO') && (!p.display_name || !p.display_name.includes('ECO')), cost: 2050, name: 'Budget 5MP IP Bullet Premium' },
];

const found = [];
const mismatches = [];
const notFound = [];

for (const exp of expected) {
  const matches = db.products.filter(exp.match);
  if (matches.length > 0) {
    const p = matches[0];
    if (p.base_cost === exp.cost) {
      found.push({ name: exp.name, dbCost: p.base_cost, excelCost: exp.cost, status: 'MATCH' });
    } else {
      mismatches.push({ name: exp.name, dbCost: p.base_cost, excelCost: exp.cost, id: p.id });
    }
  } else {
    notFound.push(exp.name);
  }
}

console.log('--- MISMATCHES ---');
console.table(mismatches);
console.log('\n--- NOT FOUND (could be spelling/mapping diff) ---');
console.log(notFound);

