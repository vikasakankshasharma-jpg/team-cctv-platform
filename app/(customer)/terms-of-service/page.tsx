import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, FileText, AlertCircle, Wrench, CreditCard, Scale, Phone, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service | CCTVQuotation — cctvquotation.com",
  description:
    "Terms of Service for CCTVQuotation's CCTV quotation and installation platform in Jaipur. Read our service terms, quotation accuracy, payment policy, and warranty information.",
  alternates: { canonical: "https://cctvquotation.com/terms-of-service" },
  openGraph: {
    title: "Terms of Service | CCTVQuotation",
    description: "Terms of service — CCTVQuotation by TEAM.",
    siteName: "CCTVQuotation",
    type: "website",
    locale: "en_IN",
  },
  twitter: {
    card: "summary",
    title: "Terms of Service | CCTVQuotation",
    description: "Terms of service — CCTVQuotation by TEAM.",
  },
};

export default function TermsOfServicePage() {
  const lastUpdated = "20 May 2026";
  const companyName = "TEAM CCTV (Proprietor: Vikash Akansha Sharma)";
  const domain = "cctvquotation.com";
  const phone = "+91 97726 99395";
  const email = "hello@cctvquotation.com";
  const address = "Malviya Nagar, Jaipur, Rajasthan — 302017";

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto px-6 py-16 md:py-28 w-full">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-10"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Hero */}
        <div className="flex items-start gap-5 mb-12">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
            <FileText className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white mb-2">
              Terms of Service
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">
              Last updated: {lastUpdated} &nbsp;·&nbsp; Governing jurisdiction: Jaipur, Rajasthan, India
            </p>
          </div>
        </div>

        {/* Quick summary */}
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-3 mb-12 p-6 bg-indigo-50/60 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-900/30">
          {[
            { icon: AlertCircle, title: "Estimates, not fixed prices", note: "Final price confirmed after site visit." },
            { icon: Wrench, title: "Professional installation", note: "All work done by trained TEAM technicians." },
            { icon: CreditCard, title: "Transparent payments", note: "GST invoice provided for every transaction." },
            { icon: Scale, title: "Jaipur jurisdiction", note: "Disputes governed by Rajasthan courts." },
          ].map(({ icon: Icon, title, note }) => (
            <div key={title} className="flex items-start gap-3">
              <Icon className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">{title}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{note}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-p:text-zinc-600 prose-p:dark:text-zinc-400 prose-li:text-zinc-600 prose-li:dark:text-zinc-400">

          <section>
            <h2>1. Acceptance of Terms</h2>
            <p>
              By accessing or using the website <a href={`https://${domain}`} className="text-blue-600 hover:underline">{domain}</a> (the &quot;Platform&quot;) or by completing the Smart Security Configurator Wizard to generate a CCTV quotation, you agree to be legally bound by these Terms of Service (&quot;Terms&quot;).
            </p>
            <p>
              If you do not agree to these Terms, please do not use our Platform. These Terms apply to all visitors, users, and anyone who accesses or uses our service.
            </p>
            <p>
              The Platform is operated by <strong className="text-zinc-900 dark:text-white">{companyName}</strong>, a registered business with its principal place of operations at {address}.
            </p>
          </section>

          <section>
            <h2>2. Description of Service</h2>
            <p>TEAM CCTV provides the following services through this Platform:</p>
            <ul>
              <li>An AI-assisted online CCTV quotation configurator (the &quot;Wizard&quot;) that generates estimated installation costs for security camera systems.</li>
              <li>Detailed quotations covering cameras (HD analog and IP), recorders (DVR/NVR), cabling, power supply, and installation labour.</li>
              <li>Lead capture and routing to our CCTV installation professionals in Jaipur, Rajasthan.</li>
              <li>Physical site surveys and professional installation services.</li>
              <li>Optional Annual Maintenance Contracts (AMC) for ongoing support.</li>
            </ul>
            <p>
              Our active installation service currently operates in Jaipur, Rajasthan. Reference quotations are provided for all India locations. Installation in other cities is subject to availability and franchise partner deployment.
            </p>
          </section>

          <section>
            <h2>3. Quotation Terms and Accuracy</h2>
            <p>
              Quotations generated by our Wizard are <strong className="text-zinc-900 dark:text-white">estimates</strong> based on the information you provide. They are indicative, not binding.
            </p>
            <ul>
              <li>Final prices are confirmed <strong className="text-zinc-900 dark:text-white">only after a physical site inspection</strong> by our technical team.</li>
              <li>The final price may vary by <strong className="text-zinc-900 dark:text-white">±10%</strong> from the online estimate, depending on site-specific factors such as cable run lengths, surface type, structural challenges, or access requirements.</li>
              <li>All prices displayed include <strong className="text-zinc-900 dark:text-white">18% GST</strong> unless explicitly stated otherwise.</li>
              <li>Quotation validity is <strong className="text-zinc-900 dark:text-white">7 days</strong> from the date of generation, subject to hardware price fluctuations.</li>
              <li>Quoted prices are for <strong className="text-zinc-900 dark:text-white">CP Plus and Prama brand hardware</strong>. Substitutions for other brands may change pricing.</li>
            </ul>
          </section>

          <section>
            <h2>4. User Obligations</h2>
            <p>When using this Platform, you agree to:</p>
            <ul>
              <li>Provide accurate and truthful information in the quotation wizard and lead capture form.</li>
              <li>Provide a valid mobile number that you own for OTP verification.</li>
              <li>Not use the Platform for commercial resale of quotations or for competitive intelligence gathering.</li>
              <li>Not attempt to reverse-engineer, scrape, or circumvent our pricing algorithms.</li>
              <li>Not submit false, misleading, or fraudulent quotation requests.</li>
              <li>Be 18 years of age or older to submit a lead and engage our services.</li>
            </ul>
          </section>

          <section>
            <h2>5. Appointment, Site Visit & Installation</h2>
            <ul>
              <li>After submitting a quotation request, our team will contact you within <strong className="text-zinc-900 dark:text-white">24 business hours</strong> to schedule a complimentary site visit.</li>
              <li>The site visit is free of charge for properties in Jaipur. A nominal visit fee may apply for properties in outskirt areas (communicated in advance).</li>
              <li>Installation timelines depend on hardware availability, your schedule, and team capacity. We will communicate estimated timelines clearly before work begins.</li>
              <li>You are responsible for providing safe access to the property and ensuring necessary permissions from property owners or housing societies.</li>
            </ul>
          </section>

          <section>
            <h2>6. Payment Terms</h2>
            <ul>
              <li>A standard advance of <strong className="text-zinc-900 dark:text-white">50% of the total project cost</strong> is required to confirm the installation booking and procure hardware.</li>
              <li>The remaining balance is due upon completion of installation and handover of the system.</li>
              <li>GST invoices (GSTIN applicable) are issued for all transactions.</li>
              <li>Refund of advance minus actual procurement costs applies if the project is cancelled by the customer after hardware has been procured, except where TEAM CCTV is at fault.</li>
            </ul>
          </section>

          <section>
            <h2>7. Hardware Warranty & AMC</h2>
            <ul>
              <li>All CP Plus and Prama hardware carries the <strong className="text-zinc-900 dark:text-white">manufacturer&apos;s standard warranty</strong> (typically 2–3 years). Warranty terms are governed by the respective manufacturer.</li>
              <li>Our installation workmanship is covered by a <strong className="text-zinc-900 dark:text-white">1-year workmanship warranty</strong> from the date of installation completion.</li>
              <li>An optional <strong className="text-zinc-900 dark:text-white">Annual Maintenance Contract (AMC)</strong> is available post-installation. AMC terms are specified in a separate agreement.</li>
              <li>Warranty is void if the hardware is tampered with, damaged due to power surges without proper surge protection, or physically damaged due to misuse.</li>
            </ul>
          </section>

          <section>
            <h2>8. Intellectual Property</h2>
            <p>
              All content on the Platform — including the quotation engine, pricing algorithms, product configurations, branding, text, graphics, and code — is the intellectual property of {companyName} and is protected under applicable Indian intellectual property laws.
            </p>
            <p>
              You are granted a limited, non-exclusive, non-transferable licence to access and use the Platform for personal quotation purposes only. You may not reproduce, distribute, or create derivative works from any Platform content.
            </p>
          </section>

          <section>
            <h2>9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, {companyName} shall not be liable for:
            </p>
            <ul>
              <li>Any reliance on online quotation estimates that differ from the final site-survey price.</li>
              <li>Indirect, incidental, or consequential losses arising from use of or inability to use the Platform.</li>
              <li>Interruptions in service due to maintenance, third-party infrastructure failure, or force majeure events.</li>
              <li>Security breaches caused by factors outside our reasonable control.</li>
            </ul>
            <p>
              Our total cumulative liability for any claim related to our installation service shall not exceed the amount you actually paid to us for that specific project.
            </p>
          </section>

          <section>
            <h2>10. Disclaimer of Warranties</h2>
            <p>
              The Platform and online quotation tool are provided on an &quot;as is&quot; and &quot;as available&quot; basis. We do not warrant that:
            </p>
            <ul>
              <li>The Platform will be uninterrupted, error-free, or free from viruses or bugs.</li>
              <li>Online quotation estimates are legally binding or will exactly match final installation invoices.</li>
            </ul>
          </section>

          <section>
            <h2>11. Governing Law and Dispute Resolution</h2>
            <p>
              These Terms are governed by and construed in accordance with the laws of India. Any disputes arising from or related to these Terms or our services shall be subject to the exclusive jurisdiction of the courts located in{" "}
              <strong className="text-zinc-900 dark:text-white">Jaipur, Rajasthan, India.</strong>
            </p>
            <p>
              Before initiating formal legal proceedings, both parties agree to attempt resolution through good-faith negotiation for a period of 30 days.
            </p>
          </section>

          <section>
            <h2>12. Changes to These Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. The &quot;Last Updated&quot; date at the top of this page reflects the most recent revision. Continued use of the Platform after any changes constitutes your acceptance of the new Terms. We recommend reviewing these Terms periodically.
            </p>
          </section>

          <section>
            <h2>13. Contact Us</h2>
            <p>
              For any questions, concerns, or clarifications about these Terms of Service:
            </p>
            <div className="not-prose bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mt-4">
              <div className="flex flex-col gap-3">
                <div>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Business Name</p>
                  <p className="font-bold text-zinc-900 dark:text-white">{companyName}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Address</p>
                  <p className="text-zinc-700 dark:text-zinc-300">{address}</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Phone</p>
                    <a href={`tel:${phone}`} className="text-blue-600 font-semibold hover:underline flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> {phone}
                    </a>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">Email</p>
                    <a href={`mailto:${email}`} className="text-blue-600 font-semibold hover:underline flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> {email}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
