import { ChevronDown } from "lucide-react";

export const faqs = [
  {
    q: "Is GST included in the quote price?",
    a: "Yes. All our quotes include 18% GST. The price you see is the final CCTV with GST price you pay — no surprises.",
  },
  {
    q: "Does the price include installation?",
    a: "Yes. Labour and wiring costs are calculated based on your property and included in the final CCTV camera price with installation.",
  },
  {
    q: "How much does a 4-camera CCTV system cost in Jaipur?",
    a: `Prices are dynamic. As of ${new Date().toLocaleString("en-US", { month: "short", year: "numeric" })}, a standard 4-camera CP Plus system with professional installation typically ranges from ₹12,000 to ₹18,000 depending on wiring length and camera resolution.`,
  },
  {
    q: "Are your cameras STQC or BIS-ER compliant?",
    a: "Yes. We strictly adhere to Indian security standards. We provide STQC-certified hardware for Government projects and BIS-ER compliant systems for retail and home installations. We only use trusted brands like CP Plus and Prama.",
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border border-zinc-100 dark:border-zinc-800/60 rounded-[24px] overflow-hidden bg-zinc-50 dark:bg-zinc-900 shadow-inner marker:content-[''] [&::-webkit-details-marker]:hidden">
      <summary className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left cursor-pointer touch-manipulation select-none list-none">
        <h4 className="text-sm sm:text-base font-black text-zinc-900 dark:text-white tracking-tight">{q}</h4>
        <ChevronDown
          className="w-5 h-5 shrink-0 text-zinc-400 transition-transform duration-300 group-open:rotate-180"
        />
      </summary>
      <div className="px-6 pb-5 animate-in slide-in-from-top-2 fade-in duration-200">
        <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed text-sm">{a}</p>
      </div>
    </details>
  );
}

export function FaqSection() {
  return (
    <div className="mt-20 sm:mt-40 w-full max-w-5xl mx-auto text-left">
      <div className="flex flex-col items-center mb-10 sm:mb-20">
        <span className="text-[10px] font-black text-blue-500 uppercase tracking-[0.4em] mb-4 text-center">Support &amp; Clarification</span>
        <h3 className="text-3xl sm:text-4xl md:text-5xl font-black text-zinc-900 dark:text-white tracking-tighter text-center">
          Frequently Asked Questions
        </h3>
      </div>

      <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-10">
        {faqs.map((faq, i) => (
          <FaqItem key={i} q={faq.q} a={faq.a} />
        ))}
      </div>
    </div>
  );
}
