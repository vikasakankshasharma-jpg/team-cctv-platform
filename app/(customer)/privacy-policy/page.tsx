"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
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
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-8">Privacy Policy</h1>
          <p className="text-zinc-500 font-medium mb-12">Last Updated: October 2023</p>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">1. Introduction</h2>
            <p>
              Welcome to TEAM CCTV. We respect your privacy and are committed to protecting your personal data. 
              This privacy policy will inform you as to how we look after your personal data when you visit our website 
              (cctvquotation.com) and tell you about your privacy rights and how the law protects you.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">2. The Data We Collect About You</h2>
            <p>
              When you use our Smart Security Configurator to generate a quotation, we may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li><strong>Identity Data</strong> includes first name, last name.</li>
              <li><strong>Contact Data</strong> includes property address in Jaipur, email address, and telephone numbers.</li>
              <li><strong>Property Data</strong> includes details about the type of property you wish to secure (e.g., number of rooms, outdoor areas).</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">3. How We Use Your Personal Data</h2>
            <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>To generate and provide you with an accurate CCTV quotation.</li>
              <li>To contact you regarding your quotation and potential installation in Jaipur.</li>
              <li>To improve our website, products/services, marketing, customer relationships, and experiences.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
            <p>
              We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way, altered, or disclosed.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">5. Contact Details</h2>
            <p>
              If you have any questions about this privacy policy or our privacy practices, please contact us at:
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
