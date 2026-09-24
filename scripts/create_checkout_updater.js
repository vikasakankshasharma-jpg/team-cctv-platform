const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\app\\(customer)\\quote\\[leadId]\\review\\[quoteId]\\QuoteReviewClient.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Replace redirectToPaymentLink logic to use direct UI checkout
const oldLogicRegex = /const redirectToPaymentLink = async \([\s\S]*?\} catch \(e: any\) \{/m;

const newLogic = `
  const redirectToPaymentLink = async (type: "advance" | "advance_500" | "advance_500_cod" | "full" | "full_discount" | "emi", method: "all" | "emi", returnUrlOnly = false) => {
    try {
      // Map frontend type to backend type
      const backendType = (type === "advance" || type === "advance_500" || type === "advance_500_cod") ? "booking" : type;

      const toastId = toast.loading("Initializing secure payment gateway...");
      
      // 1. Get the Order ID from our new endpoint
      const res = await fetch("/api/payment/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: quote.id,
          leadId: quote.leadId,
          paymentType: backendType
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to initialize payment", { id: toastId });
        return;
      }

      // 2. Ensure Razorpay SDK is loaded
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Failed to load payment gateway. Please check your connection.", { id: toastId });
        return;
      }

      toast.dismiss(toastId);

      // 3. Open Razorpay UI Modal directly on page
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "TEAM CCTV",
        description: "Secure Checkout",
        order_id: data.orderId,
        handler: function (response: any) {
          toast.success("Payment Successful! Verifying...");
          // We can optionally verify here, but Webhooks will handle the database update
          window.location.href = `/payment-success?quoteId=${quote.id}&payment_id=${response.razorpay_payment_id}`;
        },
        prefill: {
          name: quote.customer.name,
          contact: quote.customer.phone,
          email: quote.customer.email || ""
        },
        theme: {
          color: "#000000"
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
         toast.error(response.error.description || "Payment failed or cancelled.");
      });
      rzp.open();

    } catch (e: any) {
`;

// It's a bit tricky to safely regex replace this exact block because the exact regex string might be greedy.
// I will just use a node script to manually find the function boundaries and replace it.
`;

fs.writeFileSync('C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\scripts\\update_checkout.js', `
const fs = require('fs');
const filePath = 'C:\\\\Users\\\\hp\\\\Documents\\\\TEAM Website\\\\secure-easy\\\\app\\\\(customer)\\\\quote\\\\[leadId]\\\\review\\\\[quoteId]\\\\QuoteReviewClient.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const startIdx = content.indexOf('const redirectToPaymentLink = async');
const endIdx = content.indexOf('const handleAccept = async', startIdx);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `${newLogic}`;
  
  // We need to just stitch it safely. Let's find the 'catch (e: any) {' right before handleAccept
  // Actually, replacing the whole function is safer.
}
`);
