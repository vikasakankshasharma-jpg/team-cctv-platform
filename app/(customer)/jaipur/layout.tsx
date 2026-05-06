import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CCTV Installation Cost in Jaipur, Free Online Quote | Team CCTV",
  description: "Get the best CCTV installation cost in Jaipur. Compare prices for 4-camera setups and top brands like CP Plus. Serving Vaishali Nagar, Malviya Nagar, and more.",
  keywords: ["CCTV installation cost in Jaipur", "CCTV camera price in Jaipur", "CCTV quotation Jaipur", "CCTV installation Jaipur", "CP Plus installation Jaipur"],
  openGraph: {
    title: "CCTV Installation Cost in Jaipur | Team CCTV",
    description: "Get a custom security blueprint and CCTV installation cost for your Jaipur property in 2 minutes.",
    type: "website",
    locale: "en_IN",
    siteName: "TEAM CCTV",
    url: "https://cctvquotation.com/jaipur",
  },
  alternates: {
    canonical: "https://cctvquotation.com/jaipur",
  },
};

import LocalBusinessSchema from "@/components/seo/LocalBusinessSchema";
import FAQSchema from "@/components/seo/FAQSchema";

export default function JaipurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <LocalBusinessSchema cityName="Jaipur" />
      <FAQSchema cityName="Jaipur" />
      {children}
    </>
  );
}
