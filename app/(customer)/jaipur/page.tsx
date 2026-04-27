"use client";

import CityLandingPage from "@/components/shared/CityLandingPage";

export default function JaipurLandingPage() {
  const neighborhoods = [
    "Vaishali Nagar", "Malviya Nagar", "C-Scheme", "Mansarovar", 
    "Jagatpura", "Raja Park", "Bapu Nagar", "Sitapura Industrial Area", 
    "VKI Area", "Vidhyadhar Nagar", "Tonk Road", "Ajmer Road"
  ];

  return (
    <CityLandingPage 
      cityName="Jaipur"
      neighborhoods={neighborhoods}
      commercialAreas="Sitapura or VKI"
    />
  );
}
