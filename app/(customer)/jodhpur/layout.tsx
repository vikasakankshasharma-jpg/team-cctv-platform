import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CCTV Installation Cost in Jodhpur | Free Online Quote | TEAM CCTV",
  description:
    "Get the best CCTV camera installation cost in Jodhpur. Instant online quote for HD & IP cameras, DVR/NVR systems. Serving Ratanada, Sardarpura, Paota & all of Jodhpur. GST included.",
  keywords: [
    "CCTV installation cost in Jodhpur",
    "CCTV camera price in Jodhpur",
    "CCTV quotation Jodhpur",
    "CCTV installation Jodhpur",
    "CP Plus camera Jodhpur",
    "security camera Jodhpur",
    "CCTV dealer Jodhpur",
  ],
  openGraph: {
    title: "CCTV Installation Cost in Jodhpur | TEAM CCTV",
    description:
      "Get a custom CCTV security blueprint and installation cost for your Jodhpur property in 2 minutes. GST-inclusive pricing, 1-year warranty.",
    type: "website",
    locale: "en_IN",
    siteName: "TEAM CCTV",
    url: "https://cctvquotation.com/jodhpur",
  },
  alternates: {
    canonical: "https://cctvquotation.com/jodhpur",
  },
};

import LocalBusinessSchema from "@/components/seo/LocalBusinessSchema";
import FAQSchema from "@/components/seo/FAQSchema";

export default function JodhpurLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LocalBusinessSchema cityName="Jodhpur" />
      <FAQSchema cityName="Jodhpur" />
      {children}
    </>
  );
}
