const fs = require('fs');
const file = 'app/api/webhooks/payment/route.ts';
let code = fs.readFileSync(file, 'utf8');

// 1. replace fully_paid with paid
code = code.replace(/"fully_paid"/g, '"paid"');

// 2. add amount_paid and amount_due to the invoice creation
code = code.replace(
  /total_payable: quoteData.total_payable \|\| 0,\n\s*payment_status:/,
  `total_payable: quoteData.total_payable || 0,\n          amount_paid: quoteData.amount_paid || 0,\n          amount_due: quoteData.amount_due || 0,\n          payment_status:`
);

fs.writeFileSync(file, code, 'utf8');
