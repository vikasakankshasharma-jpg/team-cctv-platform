/**
 * JsonLd — Structured Data for TEAM CCTV
 *
 * Injects global schema.org JSON-LD into the <head> for rich Google results:
 *   - Organization   → Global brand presence
 *   - WebSite        → Sitelinks search box eligibility
 *
 * (LocalBusiness, Service, and FAQPage schemas are now dynamically injected
 * at the city layout level via LocalBusinessSchema.tsx and FAQSchema.tsx)
 */
export function JsonLd() {
  const baseUrl = "https://cctvquotation.com";

  // ── 1. Organization ────────────────────────────────────────────────────────
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${baseUrl}/#organization`,
    name: "TEAM SECURE SYSTEMS PVT LTD",
    alternateName: ["CCTVQuotation", "TEAM CCTV"],
    url: baseUrl,
    logo: `${baseUrl}/favicon.ico`,
    image: `${baseUrl}/og-image.png`,
    sameAs: [
      "https://www.justdial.com/Jaipur/Team-Cctv",
    ],
  };

  // ── 2. WebSite ────────────────────────────────────────────────────────────
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: "CCTVQuotation",
    publisher: { "@id": `${baseUrl}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/wizard?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  // ── 3. LocalBusiness ────────────────────────────────────────────────────────
  const localBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "CCTVQuotation",
    "alternateName": "TEAM CCTV",
    "description": "Professional CCTV and Security System installation across India. We provide AI-driven exact quotes for CP Plus, Hikvision, and Prama cameras.",
    "url": "https://cctvquotation.com",
    "telephone": "+910000000000",
    "email": "support@cctvquotation.com",
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "IN"
    },
    "openingHoursSpecification": {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
      "opens": "09:00",
      "closes": "19:00"
    },
    "priceRange": "₹₹",
    "areaServed": "India",
    "sameAs": []
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
    </>
  );
}
