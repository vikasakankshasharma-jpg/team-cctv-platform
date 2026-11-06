const fs = require('fs');
const html = fs.readFileSync('C:/Users/hp/Downloads/Megacompuworld/HD DVR _ Mega Compu World.html', 'utf8');
const parts = html.split('class="pcard"');
for (let i = 1; i < parts.length; i++) {
  const b = parts[i];
  const pid = (b.match(/PID:\s*([A-Za-z0-9]+)/) || [])[1];
  const pr = (b.match(/₹\s*([0-9,]+)/) || [])[1];
  const t = (b.match(/title="([^"]+)"/) || b.match(/aria-label="([^"]+)"/) || [])[1];
  if (pid && pr) console.log(pid + ' -> ₹' + pr + ' | ' + t);
}
