"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "Is GST included in the quote price?", a: "Yes. All CCTVQuotation quotations include 18% GST with no hidden charges. The price covers cameras, DVR/NVR, HDD, cabling, and professional installation — everything." },
  { q: "Does the price include installation?", a: "Yes. Every quotation includes full professional installation — camera mounting, cable routing, DVR/NVR setup, mobile app configuration on your phone, and a complete system demonstration." },
  { q: "How much does a 4-camera CCTV system cost in Jaipur?", a: "A CP Plus HD 4-camera system starts at ₹18,000–₹28,000. An IP (NVR) system starts at ₹35,000–₹55,000. A 4K system starts at ₹55,000–₹85,000. All prices include GST and installation." },
  { q: "Are your cameras BIS-ER compliant?", a: "Yes. We install CP Plus and Prama cameras which carry BIS-ER certification — suitable for government tenders, housing societies, and commercial projects." },
];

export function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 px-4 sm:px-6 bg-slate-100 dark:bg-[#0F1F3D] w-full mt-16 transition-colors duration-500 rounded-[40px] sm:rounded-[60px] mx-auto max-w-[95%] xl:max-w-7xl">
      <div className="max-w-3xl mx-auto text-left">
        <p className="text-[11px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-blue-400 mb-2">Support &amp; Clarification</p>
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mb-10 tracking-tight">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          {faqs.map((item, i) => {
            const isOpen = openIndex === i;
            return (
              <div 
                key={i} 
                className={`border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden transition-all duration-300 ${isOpen ? 'bg-white dark:bg-white/5 shadow-xl' : 'bg-transparent hover:bg-slate-50 dark:hover:bg-white/5'}`}
              >
                <button
                  onClick={() => toggle(i)}
                  className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                >
                  <span className={`text-base sm:text-lg font-bold transition-colors ${isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                    {item.q}
                  </span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400'}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>
                <div 
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="p-5 pt-0 text-sm sm:text-base leading-relaxed text-slate-600 dark:text-slate-400">
                    {item.a}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
