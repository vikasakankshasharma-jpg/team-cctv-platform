export interface CityConfig {
  name: string;
  heroHighlight: string;
  neighborhoods: string[];
  commercialAreas: string;
  localized?: Partial<Record<string, {
    name?: string;
    neighborhoods?: string[];
  }>>;
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
    commercialAreas: "Sitapura or VKI",
    localized: {
      hi: {
        name: "जयपुर",
        neighborhoods: ["वैशाली नगर", "मालवीय नगर", "सी-स्कीम", "मानसरोवर", "जगतपुरा", "राजा पार्क", "बापू नगर", "सीतापुरा इंडस्ट्रियल एरिया", "वीकेआई एरिया", "विद्याधर नगर", "टोंक रोड", "अजमेर रोड"]
      },
      mr: {
        name: "जयपूर",
        neighborhoods: ["वैशाली नगर", "मालवीय नगर", "सी-स्कीम", "मानसरोवर", "जगतपुरा", "राजा पार्क", "बापू नगर", "सीतापुरा इंडस्ट्रियल एरिया", "वीकेआय एरिया", "विद्याधर नगर", "टोंक रोड", "अजमेर रोड"]
      },
      gu: {
        name: "જયપુર",
        neighborhoods: ["વૈશાલી નગર", "માલવિયા નગર", "સી-સ્કીમ", "માનસરોવર", "જગતપુરા", "રાજા પાર્ક", "બાપુ નગર", "સીતાપુરા ઇન્ડસ્ટ્રિયલ એરિયા", "વીકેઆઈ એરિયા", "વિદ્યાધર નગર", "ટોંક રોડ", "અજમેર રોડ"]
      }
    }
  },
  kota: {
    name: "Kota",
    heroHighlight: "In the Coaching Hub.",
    neighborhoods: [
      "Talwandi", "Vigyan Nagar", "Indraprastha Industrial Area", "Kunadi", 
      "Mahaveer Nagar", "Dadabari", "R K Puram", "Bhimganj Mandi", 
      "Station Road", "Rangbari", "Gumanpura", "Nayapura"
    ],
    commercialAreas: "Indraprastha or DCM Area",
    localized: {
      hi: {
        name: "कोटा",
        neighborhoods: ["तलवंडी", "विज्ञान नगर", "इंद्रप्रस्थ इंडस्ट्रियल एरिया", "कुन्हाड़ी", "महावीर नगर", "दादाबाड़ी", "आर के पुरम", "भीमगंज मंडी", "स्टेशन रोड", "रंगबाड़ी", "गुमानपुरा", "नयापुरा"]
      },
      mr: {
        name: "कोटा",
        neighborhoods: ["तळवंडी", "विज्ञान नगर", "इंद्रप्रस्थ इंडस्ट्रियल एरिया", "कुन्हाडी", "महावीर नगर", "दादाबाडी", "आर के पुरम", "भीमगंज मंडी", "स्टेशन रोड", "रंगबाडी", "गुमानपुरा", "नयापुरा"]
      },
      gu: {
        name: "કોટા",
        neighborhoods: ["તલવંડી", "વિજ્ઞાન નગર", "ઇન્દ્રપ્રસ્થ ઇન્ડસ્ટ્રિયલ એરિયા", "કુન્હાડી", "મહાવીર નગર", "દાદાબાડી", "આર કે પુરમ", "ભીમગંજ મંડી", "સ્ટેશન રોડ", "રંગબાડી", "ગુમાનપુરા", "નયાપુરા"]
      }
    }
  },
  jodhpur: {
    name: "Jodhpur",
    heroHighlight: "Across the Blue City.",
    neighborhoods: [
      "Sardarpura", "Shastri Nagar", "Kamla Nehru Nagar", "Choupasni Housing Board", 
      "Ratanada", "Paota", "Banar Road", "Basni Industrial Area", 
      "Mandore", "Luni", "Pal Road", "Jhalamand"
    ],
    commercialAreas: "Basni or Mandore",
    localized: {
      hi: {
        name: "जोधपुर",
        neighborhoods: ["सरदारपुरा", "शास्त्री नगर", "कमला नेहरू नगर", "चौपासनी हाउसिंग बोर्ड", "रातानाडा", "पावटा", "बनाड़ रोड", "बासनी इंडस्ट्रियल एरिया", "मंडोर", "लूनी", "पाल रोड", "झालामंड"]
      },
      mr: {
        name: "जोधपूर",
        neighborhoods: ["सरदारपुरा", "शास्त्री नगर", "कमला नेहरू नगर", "चौपासनी हाउसिंग बोर्ड", "रातानाडा", "पावटा", "बनाड रोड", "बासनी इंडस्ट्रियल एरिया", "मंडोर", "लूनी", "पाल रोड", "झालामंड"]
      },
      gu: {
        name: "જોધપુર",
        neighborhoods: ["સરદારપુરા", "શાસ્ત્રી નગર", "કમલા નેહરુ નગર", "ચોપાસની હાઉસિંગ બોર્ડ", "રાતાનાડા", "પાવટા", "બનાડ રોડ", "બાસની ઇન્ડસ્ટ્રિયલ એરિયા", "મંડોર", "લૂની", "પાલ રોડ", "ઝાલામંડ"]
      }
    }
  },
  ajmer: {
    name: "Ajmer",
    heroHighlight: "In the Heart of Rajasthan.",
    neighborhoods: [
      "Vaishali Nagar", "Panchsheel Nagar", "Adarsh Nagar", "Civil Lines", 
      "Madan Ganj", "Kishangarh", "Beawar Road", "Ghooghra", 
      "Shastri Nagar", "Ramganj", "Pushkar Road", "Makhupura Industrial Area"
    ],
    commercialAreas: "Makhupura or Kishangarh",
    localized: {
      hi: {
        name: "अजमेर",
        neighborhoods: ["वैशाली नगर", "पंचशील नगर", "आदर्श नगर", "सिविल लाइंस", "मदनगंज", "किशनगढ़", "ब्यावर रोड", "घूघरा", "शास्त्री नगर", "रामगंज", "पुष्कर रोड", "माखुपुरा इंडस्ट्रियल एरिया"]
      },
      mr: {
        name: "अजमेर",
        neighborhoods: ["वैशाली नगर", "पंचशील नगर", "आदर्श नगर", "सिव्हिल लाइन्स", "मदनगंज", "किशनगढ", "ब्यावर रोड", "घूघरा", "शास्त्री नगर", "रामगंज", "पुष्कर रोड", "माखुपुरा इंडस्ट्रियल एरिया"]
      },
      gu: {
        name: "અજમેર",
        neighborhoods: ["વૈશાલી નગર", "પંચશીલ નગર", "આદર્શ નગર", "સિવિલ લાઇન્સ", "મદનગંજ", "કિશનગઢ", "બ્યાવર રોડ", "ઘૂઘરા", "શાસ્ત્રી નગર", "રામગંજ", "પુષ્કર રોડ", "માખુપુરા ઇન્ડસ્ટ્રિયલ એરિયા"]
      }
    }
  }
};

export function getCityData(slug: string, locale?: string): CityConfig {
  const normalizedSlug = slug.toLowerCase().trim();
  
  if (cityDatabase[normalizedSlug]) {
    const city = cityDatabase[normalizedSlug];
    if (locale && city.localized && city.localized[locale]) {
      return {
        ...city,
        name: city.localized[locale]?.name || city.name,
        neighborhoods: city.localized[locale]?.neighborhoods || city.neighborhoods
      };
    }
    return city;
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
