const fs = require("fs");
let text = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

text = text.replace(
  /handler:\s*function\s*\(response:\s*any\)\s*\{\s*alert\("Payment Successful![^}]+\}\s*,/g,
  `handler: function (response: any) {
          window.location.href = \`/payment-success?quoteId=\${savedQuoteId}&paymentId=\${response.razorpay_payment_id}\`;
        },`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", text);
