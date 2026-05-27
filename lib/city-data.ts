export interface CityConfig {
  name: string;
  heroHighlight: string;
  neighborhoods: string[];
  commercialAreas: string;
}

export const cityDatabase: Record<string, CityConfig> = {
  jaipur: {
    name: "Jaipur",
    heroHighlight: "Across Jaipur.",
    neighborhoods: [
      "Vaishali Nagar", "Malviya Nagar", "C-Scheme", "Mansarovar", 
      "Jagatpura", "Raja Park", "Bapu Nagar", "Sitapura Industrial Area", 
      "VKI Area", "Vidhyadhar Nagar", "Tonk Road", "Ajmer Road"
    ],
    commercialAreas: "Sitapura or VKI"
  },
  kota: {
    name: "Kota",
    heroHighlight: "In the Coaching Hub.",
    neighborhoods: [
      "Talwandi", "Vigyan Nagar", "Indraprastha Industrial Area", "Kunadi", 
      "Mahaveer Nagar", "Dadabari", "R K Puram", "Bhimganj Mandi", 
      "Station Road", "Rangbari", "Gumanpura", "Nayapura"
    ],
    commercialAreas: "Indraprastha or DCM Area"
  },
  jodhpur: {
    name: "Jodhpur",
    heroHighlight: "Across the Blue City.",
    neighborhoods: [
      "Sardarpura", "Shastri Nagar", "Kamla Nehru Nagar", "Choupasni Housing Board", 
      "Ratanada", "Paota", "Banar Road", "Basni Industrial Area", 
      "Mandore", "Luni", "Pal Road", "Jhalamand"
    ],
    commercialAreas: "Basni or Mandore"
  },
  ajmer: {
    name: "Ajmer",
    heroHighlight: "In the Heart of Rajasthan.",
    neighborhoods: [
      "Vaishali Nagar", "Panchsheel Nagar", "Adarsh Nagar", "Civil Lines", 
      "Madan Ganj", "Kishangarh", "Beawar Road", "Ghooghra", 
      "Shastri Nagar", "Ramganj", "Pushkar Road", "Makhupura Industrial Area"
    ],
    commercialAreas: "Makhupura or Kishangarh"
  }
};

export function getCityData(slug: string): CityConfig {
  const normalizedSlug = slug.toLowerCase().trim();
  
  if (cityDatabase[normalizedSlug]) {
    return cityDatabase[normalizedSlug];
  }

  // Fallback for dynamically discovered cities via Pincode
  const formattedName = normalizedSlug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  return {
    name: formattedName,
    heroHighlight: `Across ${formattedName}.`,
    neighborhoods: [
      "Downtown Center", 
      "Residential Zones", 
      "Commercial Hubs", 
      "Industrial Areas",
      "City Suburbs",
      "Main Markets"
    ],
    commercialAreas: "local business parks or commercial zones"
  };
}
