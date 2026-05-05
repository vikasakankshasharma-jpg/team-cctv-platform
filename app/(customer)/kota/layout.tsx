import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CCTV Installation Cost in Kota | Free Online Quote | TEAM CCTV",
  description:
    "Get the best CCTV camera installation cost in Kota. Instant online quote for HD & IP cameras, DVR/NVR systems. Serving Dadabari, Talwandi, Vigyan Nagar & all of Kota. GST included.",
  keywords: [
    "CCTV installation cost in Kota",
    "CCTV camera price in Kota",
    "CCTV quotation Kota",
    "CCTV installation Kota",
    "CP Plus camera Kota",
    "security camera Kota Rajasthan",
    "CCTV dealer Kota",
  ],
  openGraph: {
    title: "CCTV Installation Cost in Kota | TEAM CCTV",
    description:
      "Get a custom CCTV security blueprint and installation cost for your Kota property in 2 minutes. GST-inclusive pricing, 1-year warranty.",
    type: "website",
    locale: "en_IN",
    siteName: "TEAM CCTV",
    url: "https://cctvquotation.com/kota",
  },
  alternates: {
    canonical: "https://cctvquotation.com/kota",
  },
};

export default function KotaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
