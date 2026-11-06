const fs = require('fs');
const content = fs.readFileSync('components/quotation/InstantQuotationReview.tsx', 'utf8');
const searchStr = 'Book with ₹500 Token Advance';
console.log('Includes token advance:', content.includes(searchStr));
const idx = content.indexOf(searchStr);
console.log('Slice:', JSON.stringify(content.slice(idx - 20, idx + 60)));
