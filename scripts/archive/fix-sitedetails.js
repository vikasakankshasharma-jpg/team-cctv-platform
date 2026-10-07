const fs = require('fs');
const path = 'components/quotation/SiteDetailsModal.tsx';
let code = fs.readFileSync(path, 'utf8');

const oldUrl = '`https://nominatim.openstreetmap.org/search?format=json&q=${pincode}+India`';
const newUrl = '`/api/pincode/${pincode}`';
code = code.replace(oldUrl, newUrl);

fs.writeFileSync(path, code);
console.log('Fixed URL in SiteDetailsModal.tsx');
