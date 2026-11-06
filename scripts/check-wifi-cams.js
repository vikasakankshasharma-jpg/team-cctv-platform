const fs = require('fs');
const p = 'C:/Users/hp/Downloads/Megacompuworld/PTZ _ PT _ 4G _ WIFI Camera _ Mega Compu World.html';
if (fs.existsSync(p)) {
  const html = fs.readFileSync(p, 'utf8');
  const parts = html.split('class="pcard"');
  console.log('Cards:', parts.length - 1);
  for (let i = 1; i < parts.length; i++) {
    const b = parts[i];
    const pid = (b.match(/PID:\s*([A-Za-z0-9]+)/) || [])[1];
    const pr = (b.match(/₹\s*([0-9,]+)/) || [])[1];
    const t = (b.match(/title="([^"]+)"/) || b.match(/aria-label="([^"]+)"/) || [])[1];
    console.log('  ' + pid + ' -> ₹' + pr + ' | ' + t);
  }
}
