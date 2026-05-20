import Script from "next/script";

interface LocalBusinessSchemaProps {
  cityName: string;
}

export default function LocalBusinessSchema({ cityName }: LocalBusinessSchemaProps) {
  // Use a centralized corporate entity with a local service area target
  const schema = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "SecurityEquipmentInstallationService"],
    "name": "TEAM SECURE SYSTEMS PVT LTD",
    "image": "https://cctvquotation.com/og-image.jpg",
    "@id": `https://cctvquotation.com/${cityName.toLowerCase()}#localbusiness`,
    "url": `https://cctvquotation.com/${cityName.toLowerCase()}`,
    "telephone": "+919999999999", // Placeholder, will be updated via environment variable if needed
    "priceRange": "₹₹",
    "description": `Professional CCTV installation, maintenance, and security blueprinting services in ${cityName}. Professional planning.`,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": cityName,
      "addressRegion": "Rajasthan",
      "addressCountry": "IN"
    },
    "areaServed": {
      "@type": "City",
      "name": cityName
    },
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "CCTV Installation Packages",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "HD CCTV Installation"
          }
        },
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "IP Camera System Installation"
          }
        }
      ]
    }
  };

  return (
    <Script
      id={`schema-local-business-${cityName.toLowerCase()}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
