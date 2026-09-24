const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\app\\(customer)\\quote\\[leadId]\\review\\[quoteId]\\QuoteReviewClient.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const startIdx = content.indexOf('const redirectToPaymentLink = async');
const endIdx = content.indexOf('const handleAccept = async');

if (startIdx !== -1 && endIdx !== -1) {
  const newFunction = `
  const redirectToPaymentLink = async (type: "advance" | "advance_500" | "advance_500_cod" | "full" | "full_discount" | "emi", method: "all" | "emi", returnUrlOnly = false) => {
    try {
      const backendType = (type === "advance" || type === "advance_500" || type === "advance_500_cod") ? "booking" : type;
      const toastId = toast.loading("Initializing secure payment gateway...");
      
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

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error("Failed to load payment gateway. Please check your connection.", { id: toastId });
        return;
      }

      toast.dismiss(toastId);

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: "INR",
        name: "TEAM CCTV",
        description: "Secure Checkout",
        order_id: data.orderId,
        handler: function (response: any) {
          toast.success("Payment Successful! Verifying...");
          window.location.href = \`/payment-success?quoteId=\${quote.id}&payment_id=\${response.razorpay_payment_id}\`;
        },
        prefill: {
          name: quote.customer.name,
          contact: quote.customer.phone,
          email: quote.customer.email || ""
        },
        theme: { color: "#000000" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any){
         toast.error(response.error.description || "Payment failed or cancelled.");
      });
      rzp.open();

    } catch (e: any) {
      toast.error("An error occurred loading the payment gateway.");
      console.error(e);
    }
  };

  `;

  content = content.substring(0, startIdx) + newFunction + content.substring(endIdx);
  fs.writeFileSync(filePath, content);
  console.log("Replaced redirectToPaymentLink with window.Razorpay order creation!");
} else {
  console.log("Could not find function boundaries");
}
