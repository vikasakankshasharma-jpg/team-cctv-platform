import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft, Shield, Lock, Eye, Phone, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy | TEAM CCTV — cctvquotation.com",
  description:
    "Privacy Policy for TEAM CCTV's online CCTV quotation platform. Learn how we collect, use, and protect your personal data in accordance with the Digital Personal Data Protection Act, 2023.",
  alternates: { canonical: "https://cctvquotation.com/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "16 May 2025";
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
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
            <Shield className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-zinc-900 dark:text-white mb-2">
              Privacy Policy
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 font-medium text-sm">
              Last updated: {lastUpdated} &nbsp;·&nbsp; Governed by DPDP Act 2023 (India)
            </p>
          </div>
        </div>

        {/* Key summary cards */}
        <div className="grid sm:grid-cols-3 gap-4 mb-12 p-6 bg-blue-50/60 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">No data sold</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Your information is never sold or shared with advertisers.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Eye className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">Purpose-limited use</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Data is used only for generating your CCTV quotation and follow-up.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-bold text-zinc-900 dark:text-white">You are in control</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Request deletion or correction of your data at any time.</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-zinc dark:prose-invert max-w-none prose-headings:font-black prose-headings:tracking-tight prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4 prose-p:text-zinc-600 prose-p:dark:text-zinc-400 prose-li:text-zinc-600 prose-li:dark:text-zinc-400">

          <section>
            <h2>1. Who We Are</h2>
            <p>
              <strong className="text-zinc-900 dark:text-white">{companyName}</strong> operates the website{" "}
              <a href={`https://${domain}`} className="text-blue-600 hover:underline">{domain}</a> (the{" "}
              &quot;Platform&quot;). We provide an online CCTV quotation and installation estimation service
              specifically for properties in Jaipur, Rajasthan, India.
            </p>
            <p>
              This Privacy Policy describes how we collect, use, store, and protect your personal data when you use
              our Smart Security Configurator Wizard, request a quotation, or contact us. It is compliant with the{" "}
              <strong className="text-zinc-900 dark:text-white">Digital Personal Data Protection Act, 2023 (DPDP Act)</strong> of India.
            </p>
          </section>

          <section>
            <h2>2. Data We Collect and Why</h2>
            <p>We collect only the minimum information necessary to provide you with an accurate CCTV quotation and to follow up on your enquiry.</p>

            <div className="not-prose overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 mb-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                    <th className="text-left px-4 py-3 font-bold text-zinc-700 dark:text-zinc-300">Data Category</th>
                    <th className="text-left px-4 py-3 font-bold text-zinc-700 dark:text-zinc-300">What We Collect</th>
                    <th className="text-left px-4 py-3 font-bold text-zinc-700 dark:text-zinc-300">Why</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-200">Identity</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Full name</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Address your quotation correctly</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-200">Contact</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Mobile number (OTP-verified)</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Follow-up on your CCTV enquiry</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-200">Property</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Property type, pincode, camera count, area type</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Generate an accurate system design and price</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-semibold text-zinc-800 dark:text-zinc-200">Technical</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">IP address, browser type, device type (via cookies)</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">Security, analytics, and fraud prevention</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p>We do <strong className="text-zinc-900 dark:text-white">not</strong> collect Aadhaar, PAN, financial account details, or any sensitive personal data.</p>
          </section>

          <section>
            <h2>3. Legal Basis for Processing</h2>
            <p>Under the DPDP Act 2023, we process your data on the following lawful grounds:</p>
            <ul>
              <li><strong className="text-zinc-900 dark:text-white">Consent:</strong> When you complete the quotation wizard and submit your details, you voluntarily provide your data for the stated purpose.</li>
              <li><strong className="text-zinc-900 dark:text-white">Contractual necessity:</strong> To provide the quotation service you requested.</li>
              <li><strong className="text-zinc-900 dark:text-white">Legitimate interest:</strong> To improve our service quality, maintain website security, and conduct analytics.</li>
            </ul>
          </section>

          <section>
            <h2>4. How We Use Your Data</h2>
            <ul>
              <li>To generate, display, and email your CCTV installation quotation.</li>
              <li>To assign and route your lead to our installation team in your area of Jaipur.</li>
              <li>To contact you via phone or SMS regarding your security system requirements.</li>
              <li>To send you updates on your quotation status or installation appointment.</li>
              <li>To improve the accuracy of our pricing engine and wizard questions.</li>
              <li>To comply with legal or regulatory obligations if required.</li>
            </ul>
            <p>We will <strong className="text-zinc-900 dark:text-white">never</strong> use your data for unrelated marketing, sell it to third parties, or share it with advertisers.</p>
          </section>

          <section>
            <h2>5. Data Sharing</h2>
            <p>We share your data only with the following categories of parties, strictly for providing our service:</p>
            <ul>
              <li><strong className="text-zinc-900 dark:text-white">Our installation team:</strong> TEAM CCTV technicians in Jaipur who will contact you for the site visit.</li>
              <li><strong className="text-zinc-900 dark:text-white">Firebase / Google Cloud (Firestore):</strong> Our secure cloud database where your lead data is stored. Google adheres to ISO 27001 and SOC 2 Type II standards.</li>
              <li><strong className="text-zinc-900 dark:text-white">Payment processors (Cashfree Payments):</strong> If you make an advance payment, your transaction details are processed by Cashfree, a PCI-DSS compliant payment gateway. We do not store card details.</li>
              <li><strong className="text-zinc-900 dark:text-white">Analytics (Google Analytics):</strong> Anonymised, aggregated data about website usage. No personally identifiable information is shared.</li>
            </ul>
          </section>

          <section>
            <h2>6. Data Retention</h2>
            <p>We retain your personal data for the following periods:</p>
            <ul>
              <li><strong className="text-zinc-900 dark:text-white">Lead and quotation data:</strong> 3 years from the date of the quotation, or until you request deletion, whichever is earlier.</li>
              <li><strong className="text-zinc-900 dark:text-white">OTP verification records:</strong> Deleted within 15 minutes of generation.</li>
              <li><strong className="text-zinc-900 dark:text-white">Analytics data:</strong> 14 months (Google Analytics default).</li>
            </ul>
            <p>After the retention period, your data is permanently and securely deleted from our systems.</p>
          </section>

          <section>
            <h2>7. Your Rights (DPDP Act 2023)</h2>
            <p>As a Data Principal under the DPDP Act, you have the following rights:</p>
            <ul>
              <li><strong className="text-zinc-900 dark:text-white">Right to Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong className="text-zinc-900 dark:text-white">Right to Correction:</strong> Request that inaccurate or incomplete data be corrected.</li>
              <li><strong className="text-zinc-900 dark:text-white">Right to Erasure:</strong> Request deletion of your personal data (subject to legal retention requirements).</li>
              <li><strong className="text-zinc-900 dark:text-white">Right to Withdraw Consent:</strong> Withdraw your consent at any time. This will not affect lawfulness of processing before withdrawal.</li>
              <li><strong className="text-zinc-900 dark:text-white">Right to Grievance Redressal:</strong> File a complaint with our Grievance Officer (contact below).</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href={`tel:${phone}`} className="text-blue-600 hover:underline">{phone}</a> or <a href={`mailto:${email}`} className="text-blue-600 hover:underline">{email}</a>. We will respond within <strong className="text-zinc-900 dark:text-white">30 days</strong>.</p>
          </section>

          <section>
            <h2>8. Cookies</h2>
            <p>We use the following types of cookies on {domain}:</p>
            <ul>
              <li><strong className="text-zinc-900 dark:text-white">Strictly necessary cookies:</strong> Required for the wizard and session management. Cannot be disabled.</li>
              <li><strong className="text-zinc-900 dark:text-white">Analytics cookies (Google Analytics):</strong> Help us understand how visitors use the site. These are anonymised and can be blocked via browser settings.</li>
            </ul>
            <p>We do not use advertising or tracking cookies of any kind.</p>
          </section>

          <section>
            <h2>9. Data Security</h2>
            <p>We implement appropriate technical and organisational measures to protect your data:</p>
            <ul>
              <li>All data transmitted between your browser and our servers is encrypted via TLS 1.3 (HTTPS).</li>
              <li>Our database (Google Firestore) is protected by granular security rules — only authorised staff can access lead data.</li>
              <li>Phone number verification uses a time-limited OTP system and records are purged immediately after verification.</li>
              <li>Admin access requires multi-factor authentication and role-based access controls.</li>
              <li>We conduct periodic security reviews of our platform.</li>
            </ul>
          </section>

          <section>
            <h2>10. Children&apos;s Privacy</h2>
            <p>
              Our services are not directed to individuals under the age of 18. We do not knowingly collect personal data from minors. If you believe a minor has submitted data through our platform, please contact us immediately for deletion.
            </p>
          </section>

          <section>
            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The &quot;Last Updated&quot; date at the top of this page reflects the most recent revision. Significant changes will be communicated via a notice on our homepage. Your continued use of the Platform after such changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2>12. Grievance Officer & Contact</h2>
            <p>
              For any privacy-related concerns, to exercise your rights, or to file a grievance, please contact our Data Fiduciary representative:
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
                <p className="text-xs text-zinc-500 dark:text-zinc-400 border-t border-zinc-200 dark:border-zinc-700 pt-3 mt-1">
                  Response time: within 30 days of receipt of your request.
                </p>
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
