"use client";

import CityLandingPage from "@/components/shared/CityLandingPage";

export default function JodhpurLandingPage() {
  const neighborhoods = [
    "Sardarpura", "Shastri Nagar", "Kamla Nehru Nagar", "Choupasni Housing Board", 
    "Ratanada", "Paota", "Banar Road", "Basni Industrial Area", 
    "Mandore", "Luni", "Pal Road", "Jhalamand"
  ];

  return (
    <CityLandingPage 
      cityName="Jodhpur"
      heroHighlight="Across the Blue City."
      neighborhoods={neighborhoods}
      commercialAreas="Basni or Mandore"
    />
  );
}
