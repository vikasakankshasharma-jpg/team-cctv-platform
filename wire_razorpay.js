const fs = require("fs");
let text = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

const loadScriptFunc = `
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };
`;

const handlePaymentFunc = `
  const handlePayment = async () => {
    if (!finalPlan) return;
    setLoading(true);
    
    try {
      const res = await loadRazorpayScript();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        setLoading(false);
        return;
      }

      // Create Order
      const orderRes = await fetch("/api/payment/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: finalPlan.total_payable,
          receipt: savedQuoteId,
          notes: {
            customer_name: req.customer_name,
            customer_mobile: req.customer_mobile,
            installation_type: req.installation_type
          }
        })
      });
      const orderData = await orderRes.json();
      
      if (!orderData.success) {
        alert("Error initiating payment");
        setLoading(false);
        return;
      }

      // Open Razorpay Checkout Modal
      const options = {
        key: orderData.key_id,
        amount: orderData.order.amount,
        currency: orderData.order.currency,
        name: "CCTVQuotation by TEAM",
        description: "CCTV System & Installation",
        image: "/logo-horizontal.jpg",
        order_id: orderData.order.id,
        handler: function (response: any) {
          alert("Payment Successful! Payment ID: " + response.razorpay_payment_id + ". We will contact you shortly to schedule installation.");
        },
        prefill: {
          name: req.customer_name || "",
          contact: req.customer_mobile || "",
        },
        theme: {
          color: "#2563EB"
        }
      };

      const paymentObject = new (window as any).Razorpay(options);
      paymentObject.open();
    } catch (e) {
      console.error(e);
      alert("Payment Error");
    }
    setLoading(false);
  };
`;

text = text.replace("const handleUpdateQuote = (newReq: CCTVRequirement) => {", loadScriptFunc + "\n" + handlePaymentFunc + "\n  const handleUpdateQuote = (newReq: CCTVRequirement) => {");

text = text.replace(
  '<button className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-black transition-all shadow-lg shadow-zinc-900/20 active:scale-95">\n                         ?? Pay Now & Schedule Installation\n                      </button>',
  `<button onClick={handlePayment} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-black transition-all shadow-lg shadow-zinc-900/20 active:scale-95 disabled:opacity-50">
                         ?? {loading ? "Connecting to Payment Gateway..." : "Pay Now & Schedule Installation"}
                      </button>`
);

text = text.replace(
  '<button className="w-full flex items-center justify-center gap-2 bg-white border-2 border-zinc-200 hover:border-zinc-300 text-zinc-900 py-4 rounded-xl font-black transition-all active:scale-95">\n                         ?? Book Free Site Survey\n                      </button>',
  `<button onClick={handleSendWhatsApp} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-white border-2 border-zinc-200 hover:border-zinc-300 text-zinc-900 py-4 rounded-xl font-black transition-all active:scale-95 disabled:opacity-50">
                         ?? Book Free Site Survey
                      </button>`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", text);
