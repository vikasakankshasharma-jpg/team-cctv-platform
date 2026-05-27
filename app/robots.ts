import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // General public crawlers — allow all customer-facing pages
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/partner",
          "/partner/",
          "/api/",
          "/_next/",
          "/static/",
          "/quote/",      // Individual quote pages are private/personalised
        ],
      },
      {
        // Block AI training scrapers from sensitive pages
        userAgent: ["GPTBot", "Google-Extended", "CCBot", "anthropic-ai"],
        disallow: ["/"],
      },
    ],
    sitemap: "https://cctvquotation.com/sitemap.xml",
    host: "https://cctvquotation.com",
  };
}
