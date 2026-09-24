const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\app\\api\\webhooks\\razorpay\\route.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the start of Stage 2 to inject idempotency check
const stage2Regex = /const dQuoteData = dQuoteDoc\.data\(\) as any;\s*const paidAmount = paymentEntity\.amount \/ 100;/;
const stage2Replacement = `const dQuoteData = dQuoteDoc.data() as any;

        // IDEMPOTENCY CHECK: Ensure we haven't already processed this exact payment
        const hasProcessed = dQuoteData.payment_history?.some((p: any) => p.payment_id === paymentId);
        if (hasProcessed) {
          console.log(\`[Razorpay Webhook]: Idempotency caught duplicate delivery webhook for \${paymentId}\`);
          return NextResponse.json({ success: true, note: "Already processed" });
        }

        const paidAmount = paymentEntity.amount / 100;`;
content = content.replace(stage2Regex, stage2Replacement);

// Replace the start of Stage 3 to inject idempotency check
const stage3Regex = /const iQuoteData = iQuoteDoc\.data\(\) as any;\s*const iPaidAmount = paymentEntity\.amount \/ 100;/;
const stage3Replacement = `const iQuoteData = iQuoteDoc.data() as any;

        // IDEMPOTENCY CHECK: Ensure we haven't already processed this exact payment
        const hasProcessed = iQuoteData.payment_history?.some((p: any) => p.payment_id === paymentId);
        if (hasProcessed) {
          console.log(\`[Razorpay Webhook]: Idempotency caught duplicate installation webhook for \${paymentId}\`);
          return NextResponse.json({ success: true, note: "Already processed" });
        }

        const iPaidAmount = paymentEntity.amount / 100;`;
content = content.replace(stage3Regex, stage3Replacement);

// Replace the start of Stage 1 (booking) to inject idempotency check
const stage1Regex = /const bQuoteData = bQuoteDoc\.data\(\) as any;\s*const bPaidAmount = paymentEntity\.amount \/ 100;/;
const stage1Replacement = `const bQuoteData = bQuoteDoc.data() as any;

        // IDEMPOTENCY CHECK: Ensure we haven't already processed this exact payment
        const hasProcessed = bQuoteData.payment_history?.some((p: any) => p.payment_id === paymentId);
        if (hasProcessed) {
          console.log(\`[Razorpay Webhook]: Idempotency caught duplicate booking webhook for \${paymentId}\`);
          return NextResponse.json({ success: true, note: "Already processed" });
        }

        const bPaidAmount = paymentEntity.amount / 100;`;
content = content.replace(stage1Regex, stage1Replacement);

fs.writeFileSync(filePath, content);
console.log("Injected Idempotency Checks into Razorpay Webhook.");
