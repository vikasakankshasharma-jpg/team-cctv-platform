"use client";

import CityLandingPage from "@/components/shared/CityLandingPage";

export default function KotaLandingPage() {
  const neighborhoods = [
    "Talwandi", "Vigyan Nagar", "Indraprastha Industrial Area", "Kunadi", 
    "Mahaveer Nagar", "Dadabari", "R K Puram", "Bhimganj Mandi", 
    "Station Road", "Rangbari", "Gumanpura", "Nayapura"
  ];

  return (
    <CityLandingPage 
      cityName="Kota"
      heroHighlight="In the Coaching Hub."
      neighborhoods={neighborhoods}
      commercialAreas="Indraprastha or DCM Area"
    />
  );
}
