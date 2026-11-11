import { TranslatedText } from "@/components/shared/TranslatedText";

export const faqs = [
  {
    qKey: "faq_s_q1",
    aKey: "faq_s_a1",
    q: "Is GST included in the quote price?",
    a: "Yes. All TEAM CCTV quotations include 18% GST with no hidden charges. The price covers cameras, DVR/NVR, cabling, and professional installation — completely transparent.",
  },
  {
    qKey: "faq_s_q2",
    aKey: "faq_s_a2",
    q: "Does the price include installation?",
    a: "Yes. Every quotation includes full professional installation — camera mounting, cable routing, DVR/NVR setup, mobile app configuration, and a complete system demonstration.",
  },
  {
    qKey: "faq_s_q3",
    aKey: "faq_s_a3",
    q: "How much does a 4-camera CCTV system cost?",
    a: "A complete 4-camera setup starts from ~₹14,200 to ₹18,000 depending on brand and configuration. All prices include 18% GST, cabling, and professional installation.",
  },
  {
    qKey: "faq_s_q4",
    aKey: "faq_s_a4",
    q: "Are your cameras BIS-ER compliant?",
    a: "Yes. We install CP Plus and Prama cameras which carry BIS-ER certification - suitable for government tenders, housing societies, and commercial projects. STQC certified cameras are also available as an optional premium upgrade during configuration.",
  },
];

export function FaqSection() {
  return (
    <section style={{ padding: "80px 24px", background: "#0F1F3D" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 style={{ color: "white", fontSize: 28, marginBottom: 32, fontWeight: 700 }}>
          <TranslatedText tKey="faq_title" defaultText="Frequently Asked Questions" />
        </h2>
        {faqs.map((item, i) => (
          <details key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16, marginBottom: 16 }}>
            <summary style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, fontWeight: 500, cursor: "pointer", padding: "8px 0", listStyle: "none" }}>
              <TranslatedText tKey={item.qKey} defaultText={item.q} />
            </summary>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7, marginTop: 10 }}>
              <TranslatedText tKey={item.aKey} defaultText={item.a} />
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
