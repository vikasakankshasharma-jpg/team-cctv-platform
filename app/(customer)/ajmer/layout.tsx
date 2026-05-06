import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CCTV Installation Cost in Ajmer | Free Online Quote | TEAM CCTV",
  description:
    "Get the best CCTV camera installation cost in Ajmer. Instant online quote for HD & IP cameras, DVR/NVR systems. Serving Vaishali Nagar, Nasirabad Road & all of Ajmer. GST included.",
  keywords: [
    "CCTV installation cost in Ajmer",
    "CCTV camera price in Ajmer",
    "CCTV quotation Ajmer",
    "CCTV installation Ajmer",
    "CP Plus camera Ajmer",
    "security camera Ajmer",
    "CCTV dealer Ajmer",
  ],
  openGraph: {
    title: "CCTV Installation Cost in Ajmer | TEAM CCTV",
    description:
      "Get a custom CCTV security blueprint and installation cost for your Ajmer property in 2 minutes. GST-inclusive pricing, 1-year warranty.",
    type: "website",
    locale: "en_IN",
    siteName: "TEAM CCTV",
    url: "https://cctvquotation.com/ajmer",
  },
  alternates: {
    canonical: "https://cctvquotation.com/ajmer",
  },
};

import LocalBusinessSchema from "@/components/seo/LocalBusinessSchema";
import FAQSchema from "@/components/seo/FAQSchema";

export default function AjmerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LocalBusinessSchema cityName="Ajmer" />
      <FAQSchema cityName="Ajmer" />
      {children}
    </>
  );
}
