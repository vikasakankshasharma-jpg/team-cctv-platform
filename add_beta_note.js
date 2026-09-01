const fs = require("fs");
let text = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

text = text.replace(
  `<button onClick={handlePayment} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-black transition-all shadow-lg shadow-zinc-900/20 active:scale-95 disabled:opacity-50">
                         ?? {loading ? "Connecting to Payment Gateway..." : "Pay Now & Schedule Installation"}
                      </button>`,
  `<div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-3">
                        <p className="text-xs text-amber-800 font-bold mb-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                          BETA TEST MODE
                        </p>
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                          To test the checkout flow, click Pay Now and select UPI. Enter <strong className="font-mono bg-amber-100 px-1 rounded">success@razorpay</strong> to simulate a successful transaction without real money.
                        </p>
                      </div>
                      <button onClick={handlePayment} disabled={loading} className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-black transition-all shadow-lg shadow-zinc-900/20 active:scale-95 disabled:opacity-50">
                         ?? {loading ? "Connecting to Payment Gateway..." : "Pay Now (Test Mode)"}
                      </button>`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", text);
