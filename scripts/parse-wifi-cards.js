const fs = require('fs');
const html = fs.readFileSync('C:/Users/hp/Downloads/Megacompuworld/PTZ _ PT _ 4G _ WIFI Camera _ Mega Compu World.html', 'utf8');
const parts = html.split('class="pcard"');
console.log('Card 22 raw:');
console.log(parts[22]);

