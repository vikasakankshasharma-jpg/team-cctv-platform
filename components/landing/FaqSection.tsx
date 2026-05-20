export const faqs = [
  {
    q: "Is GST included in the quote price?",
    a: "Yes. All TEAM CCTV quotations include 18% GST with no hidden charges. The price covers cameras, DVR/NVR, HDD, cabling, and professional installation — everything.",
  },
  {
    q: "Does the price include installation?",
    a: "Yes. Every quotation includes full professional installation — camera mounting, cable routing, DVR/NVR setup, mobile app configuration, and a complete system demonstration.",
  },
  {
    q: "How much does a 4-camera CCTV system cost in Jaipur?",
    a: "A CP Plus HD 4-camera system starts at ₹18,000–₹28,000. An IP (NVR) system starts at ₹35,000–₹55,000. A 4K system starts at ₹55,000–₹85,000. All prices include GST and installation.",
  },
  {
    q: "Are your cameras BIS-ER compliant?",
    a: "Yes. We install CP Plus and Prama cameras which carry BIS-ER certification - suitable for government tenders, housing societies, and commercial projects. STQC certified cameras are also available as an optional premium upgrade during configuration.",
  },
];

export function FaqSection() {
  return (
    <section style={{ padding: "80px 24px", background: "#0F1F3D" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <h2 style={{ color: "white", fontSize: 28, marginBottom: 32, fontWeight: 700 }}>
          Frequently Asked Questions
        </h2>
        {faqs.map((item, i) => (
          <details key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.1)", paddingBottom: 16, marginBottom: 16 }}>
            <summary style={{ color: "rgba(255,255,255,0.85)", fontSize: 16, fontWeight: 500, cursor: "pointer", padding: "8px 0", listStyle: "none" }}>
              {item.q}
            </summary>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 14, lineHeight: 1.7, marginTop: 10 }}>
              {item.a}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
