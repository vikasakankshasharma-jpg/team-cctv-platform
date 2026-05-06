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
    alternateName: "TEAM CCTV",
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
    name: "TEAM CCTV Quotation",
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
    </>
  );
}
