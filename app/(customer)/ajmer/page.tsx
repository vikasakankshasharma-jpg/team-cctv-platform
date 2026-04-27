"use client";

import CityLandingPage from "@/components/shared/CityLandingPage";

export default function AjmerLandingPage() {
  const neighborhoods = [
    "Vaishali Nagar", "Panchsheel Nagar", "Adarsh Nagar", "Civil Lines", 
    "Madan Ganj", "Kishangarh", "Beawar Road", "Ghooghra", 
    "Shastri Nagar", "Ramganj", "Pushkar Road", "Makhupura Industrial Area"
  ];

  return (
    <CityLandingPage 
      cityName="Ajmer"
      heroHighlight="In the Heart of Rajasthan."
      neighborhoods={neighborhoods}
      commercialAreas="Makhupura or Kishangarh"
    />
  );
}
