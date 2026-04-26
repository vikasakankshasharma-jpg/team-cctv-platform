"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto px-6 py-20 md:py-32 w-full">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-12"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>
        
        <div className="prose prose-zinc dark:prose-invert max-w-none">
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-8">Terms of Service</h1>
          <p className="text-zinc-500 font-medium mb-12">Last Updated: October 2023</p>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">1. Agreement to Terms</h2>
            <p>
              By accessing and using cctvquotation.com (the "Site") and generating a quotation using our Smart Security Configurator, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, please do not use our services.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">2. Service Description</h2>
            <p>
              TEAM CCTV provides an online platform that allows users to generate estimated costs for CCTV installation and hardware specifically in Jaipur, Rajasthan. The quotations provided are estimates based on the information you provide and current market rates for STQC compliant hardware (like CP Plus) and labor.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">3. Quotation Accuracy</h2>
            <p>
              While we strive to provide the most accurate quotations possible, the final price of installation may vary by ±5% subject to a physical site inspection. Final pricing is confirmed only after our technical team surveys your property in Jaipur.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">4. User Information</h2>
            <p>
              By submitting your information (name, phone number, property details) to generate a quote, you authorize TEAM CCTV or its representatives to contact you regarding your security requirements. We manage this data in accordance with our Privacy Policy.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">5. Limitation of Liability</h2>
            <p>
              TEAM CCTV shall not be liable for any indirect, incidental, special, consequential or punitive damages resulting from your use of or inability to use the service, or any reliance on the quotations provided.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">6. Contact Information</h2>
            <p>
              For any questions regarding these Terms of Service, please contact us:
            </p>
            <p className="mt-4 font-bold">
              TEAM CCTV <br/>
              Jaipur, Rajasthan <br/>
              Phone: +91 97726 99395
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
