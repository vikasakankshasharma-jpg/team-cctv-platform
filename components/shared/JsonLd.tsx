/**
 * JsonLd — Structured Data for TEAM CCTV
 *
 * Injects schema.org JSON-LD into the <head> for rich Google results:
 *   - LocalBusiness  → Google Business Panel, maps, local pack
 *   - Service        → Rich snippet for CCTV installation service
 *   - FAQPage        → FAQ accordion rich results in SERPs
 *   - WebSite        → Sitelinks search box eligibility
 *
 * Zero client JS — rendered as a plain <script> tag at build time.
 */
export function JsonLd() {
  const baseUrl = "https://cctvquotation.com";

  // ── 1. LocalBusiness ──────────────────────────────────────────────────────
  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}/#business`,
    name: "TEAM CCTV Jaipur",
    alternateName: "TEAM Secure Systems",
    description:
      "Jaipur's leading CCTV installation and security system provider. Get instant AI-driven quotations for HD and IP camera systems with GST-inclusive pricing.",
    url: baseUrl,
    telephone: "+91-97726-99395",
    email: "team.cctv.jaipur@gmail.com",
    priceRange: "₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, UPI, Bank Transfer",
    image: `${baseUrl}/og-image.png`,
    logo: `${baseUrl}/favicon.ico`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Jaipur",
      addressLocality: "Jaipur",
      addressRegion: "Rajasthan",
      postalCode: "302001",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 26.9124,
      longitude: 75.7873,
    },
    areaServed: [
      { "@type": "City", name: "Jaipur" },
      { "@type": "City", name: "Jodhpur" },
      { "@type": "City", name: "Kota" },
      { "@type": "City", name: "Ajmer" },
    ],
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
        opens: "09:00",
        closes: "19:00",
      },
    ],
    sameAs: [
      "https://www.justdial.com/Jaipur/Team-Cctv",
    ],
  };

  // ── 2. Service ────────────────────────────────────────────────────────────
  const service = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "CCTV Camera Installation in Jaipur",
    description:
      "Professional CCTV camera installation service in Jaipur for homes, shops, offices, warehouses, and industrial units. Includes HD and IP camera systems with DVR/NVR, 1-year warranty, and AMC options.",
    provider: { "@id": `${baseUrl}/#business` },
    areaServed: { "@type": "City", name: "Jaipur" },
    serviceType: "CCTV Installation",
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: "8000",
      priceSpecification: {
        "@type": "PriceSpecification",
        minPrice: "8000",
        maxPrice: "200000",
        priceCurrency: "INR",
      },
      description: "Complete CCTV system including cameras, DVR/NVR, cabling, and installation. Price varies by camera count and type.",
    },
  };

  // ── 3. FAQPage ────────────────────────────────────────────────────────────
  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How much does CCTV installation cost in Jaipur?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "CCTV installation in Jaipur starts from ₹8,000 for a basic 2-camera HD system and goes up to ₹2,00,000+ for large IP camera networks. The exact cost depends on the number of cameras, camera type (HD or IP), recording days, and installation complexity. Use our free online quotation tool to get an instant, itemised estimate.",
        },
      },
      {
        "@type": "Question",
        name: "What is the difference between HD and IP CCTV cameras?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "HD (analog) cameras use traditional coaxial cables and DVR recorders — they are more affordable and ideal for homes and small shops. IP (network) cameras use Cat6 or WiFi cabling with NVR recorders — they offer higher resolution (up to 8MP/4K), remote access, and are better for offices, warehouses, and large properties.",
        },
      },
      {
        "@type": "Question",
        name: "Do you provide AMC (Annual Maintenance Contract) for CCTV systems?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. TEAM CCTV offers flexible AMC plans starting at 5% of the total system cost per year. AMC covers unlimited site visits and labour — product replacement is billed separately. 1, 2, and 3-year AMC plans are available.",
        },
      },
      {
        "@type": "Question",
        name: "How long does CCTV installation take in Jaipur?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A standard 4–8 camera system is typically installed in a single day (6–8 hours). Larger systems with 16+ cameras or complex cabling may take 2–3 days. We conduct a free site survey before installation to provide an accurate timeline.",
        },
      },
      {
        "@type": "Question",
        name: "Is GST included in your CCTV quotation?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. All prices in our online quotation tool are GST-inclusive (18% GST as per government norms). There are no hidden charges — the quoted price is the final price.",
        },
      },
    ],
  };

  // ── 4. WebSite (sitelinks search box eligibility) ─────────────────────────
  const webSite = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "TEAM CCTV Jaipur",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/wizard?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const schemas = [localBusiness, service, faqPage, webSite];

  return (
    <>
      {schemas.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
    </>
  );
}
