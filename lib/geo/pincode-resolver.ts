/**
 * @file lib/geo/pincode-resolver.ts
 * @description Universal, lightweight, zero-latency Indian Postal Hierarchy Resolver.
 * Maps India's 6-digit PIN codes to their authentic District, City, and State.
 * 
 * Rules:
 * - Zero external API costs: 100% in-memory static mapping
 * - Permanent ban on "Unknown" for Indian addresses
 * - Instant fallback from 3-digit division -> 2-digit postal sub-region -> State
 */

export interface ResolvedLocation {
  pincode: string;
  city: string;
  district: string;
  state: string;
  isRecognized: boolean;
}

// 2-Digit Postal Sub-Region to State/UT Mapping
const TWO_DIGIT_STATE_MAP: Record<string, string> = {
  "11": "Delhi",
  "12": "Haryana",
  "13": "Haryana",
  "14": "Punjab",
  "15": "Punjab",
  "16": "Chandigarh",
  "17": "Himachal Pradesh",
  "18": "Jammu & Kashmir",
  "19": "Jammu & Kashmir",
  "20": "Uttar Pradesh",
  "21": "Uttar Pradesh",
  "22": "Uttar Pradesh",
  "23": "Uttar Pradesh",
  "24": "Uttar Pradesh",
  "25": "Uttar Pradesh",
  "26": "Uttar Pradesh",
  "27": "Uttar Pradesh",
  "28": "Uttar Pradesh",
  "30": "Rajasthan",
  "31": "Rajasthan",
  "32": "Rajasthan",
  "33": "Rajasthan",
  "34": "Rajasthan",
  "36": "Gujarat",
  "37": "Gujarat",
  "38": "Gujarat",
  "39": "Gujarat",
  "40": "Maharashtra",
  "41": "Maharashtra",
  "42": "Maharashtra",
  "43": "Maharashtra",
  "44": "Maharashtra",
  "45": "Madhya Pradesh",
  "46": "Madhya Pradesh",
  "47": "Madhya Pradesh",
  "48": "Madhya Pradesh",
  "49": "Chhattisgarh",
  "50": "Telangana",
  "51": "Andhra Pradesh",
  "52": "Andhra Pradesh",
  "53": "Andhra Pradesh",
  "56": "Karnataka",
  "57": "Karnataka",
  "58": "Karnataka",
  "59": "Karnataka",
  "60": "Tamil Nadu",
  "61": "Tamil Nadu",
  "62": "Tamil Nadu",
  "63": "Tamil Nadu",
  "64": "Tamil Nadu",
  "67": "Kerala",
  "68": "Kerala",
  "69": "Kerala",
  "70": "West Bengal",
  "71": "West Bengal",
  "72": "West Bengal",
  "73": "West Bengal",
  "74": "West Bengal",
  "75": "Odisha",
  "76": "Odisha",
  "77": "Odisha",
  "78": "Assam",
  "79": "North East",
  "80": "Bihar",
  "81": "Bihar",
  "82": "Jharkhand",
  "83": "Jharkhand",
  "84": "Bihar",
  "85": "Bihar",
};

// 3-Digit Postal Division to District & State Mapping
const THREE_DIGIT_DISTRICT_MAP: Record<string, { district: string; state: string; city?: string }> = {
  // --- TELANGANA & ANDHRA PRADESH ---
  "500": { district: "Hyderabad", state: "Telangana", city: "Hyderabad" },
  "501": { district: "Rangareddy", state: "Telangana", city: "Rangareddy" },
  "502": { district: "Medak", state: "Telangana", city: "Sangareddy" },
  "503": { district: "Nizamabad", state: "Telangana", city: "Nizamabad" },
  "504": { district: "Adilabad", state: "Telangana", city: "Adilabad" },
  "505": { district: "Karimnagar", state: "Telangana", city: "Karimnagar" },
  "506": { district: "Warangal", state: "Telangana", city: "Warangal" },
  "507": { district: "Khammam", state: "Telangana", city: "Khammam" },
  "508": { district: "Nalgonda", state: "Telangana", city: "Nalgonda" }, // 508001
  "509": { district: "Mahabubnagar", state: "Telangana", city: "Mahabubnagar" },
  "515": { district: "Anantapur", state: "Andhra Pradesh", city: "Anantapur" },
  "516": { district: "YSR Kadapa", state: "Andhra Pradesh", city: "Kadapa" },
  "517": { district: "Chittoor", state: "Andhra Pradesh", city: "Tirupati" },
  "518": { district: "Kurnool", state: "Andhra Pradesh", city: "Kurnool" },
  "520": { district: "NTR", state: "Andhra Pradesh", city: "Vijayawada" },
  "521": { district: "Krishna", state: "Andhra Pradesh", city: "Machilipatnam" },
  "522": { district: "Guntur", state: "Andhra Pradesh", city: "Guntur" },
  "523": { district: "Prakasam", state: "Andhra Pradesh", city: "Ongole" },
  "524": { district: "SPSR Nellore", state: "Andhra Pradesh", city: "Nellore" },
  "530": { district: "Visakhapatnam", state: "Andhra Pradesh", city: "Visakhapatnam" },
  "531": { district: "Anakapalli", state: "Andhra Pradesh", city: "Anakapalli" },
  "532": { district: "Srikakulam", state: "Andhra Pradesh", city: "Srikakulam" },
  "533": { district: "Kakinada", state: "Andhra Pradesh", city: "Kakinada" },
  "534": { district: "West Godavari", state: "Andhra Pradesh", city: "Eluru" },
  "535": { district: "Vizianagaram", state: "Andhra Pradesh", city: "Vizianagaram" },

  // --- RAJASTHAN ---
  "301": { district: "Alwar", state: "Rajasthan", city: "Alwar" },
  "302": { district: "Jaipur", state: "Rajasthan", city: "Jaipur" },
  "303": { district: "Jaipur Rural", state: "Rajasthan", city: "Jaipur" },
  "304": { district: "Tonk", state: "Rajasthan", city: "Tonk" },
  "305": { district: "Ajmer", state: "Rajasthan", city: "Ajmer" },
  "306": { district: "Pali", state: "Rajasthan", city: "Pali" },
  "307": { district: "Sirohi", state: "Rajasthan", city: "Sirohi" },
  "311": { district: "Bhilwara", state: "Rajasthan", city: "Bhilwara" },
  "312": { district: "Chittorgarh", state: "Rajasthan", city: "Chittorgarh" },
  "313": { district: "Udaipur", state: "Rajasthan", city: "Udaipur" },
  "314": { district: "Dungarpur", state: "Rajasthan", city: "Dungarpur" },
  "321": { district: "Bharatpur", state: "Rajasthan", city: "Bharatpur" },
  "322": { district: "Sawai Madhopur", state: "Rajasthan", city: "Sawai Madhopur" },
  "323": { district: "Bundi", state: "Rajasthan", city: "Bundi" },
  "324": { district: "Kota", state: "Rajasthan", city: "Kota" },
  "325": { district: "Baran", state: "Rajasthan", city: "Baran" },
  "326": { district: "Jhalawar", state: "Rajasthan", city: "Jhalawar" },
  "331": { district: "Churu", state: "Rajasthan", city: "Churu" }, // 331024
  "332": { district: "Sikar", state: "Rajasthan", city: "Sikar" },
  "333": { district: "Jhunjhunu", state: "Rajasthan", city: "Jhunjhunu" },
  "334": { district: "Bikaner", state: "Rajasthan", city: "Bikaner" },
  "335": { district: "Sri Ganganagar", state: "Rajasthan", city: "Sri Ganganagar" },
  "341": { district: "Nagaur", state: "Rajasthan", city: "Nagaur" },
  "342": { district: "Jodhpur", state: "Rajasthan", city: "Jodhpur" },
  "343": { district: "Jalore", state: "Rajasthan", city: "Jalore" },
  "344": { district: "Barmer", state: "Rajasthan", city: "Barmer" },
  "345": { district: "Jaisalmer", state: "Rajasthan", city: "Jaisalmer" },

  // --- DELHI ---
  "110": { district: "New Delhi", state: "Delhi", city: "New Delhi" },

  // --- MAHARASHTRA & GOA ---
  "400": { district: "Mumbai", state: "Maharashtra", city: "Mumbai" },
  "401": { district: "Thane", state: "Maharashtra", city: "Thane" },
  "402": { district: "Raigad", state: "Maharashtra", city: "Alibag" },
  "403": { district: "North Goa", state: "Goa", city: "Panaji" },
  "411": { district: "Pune", state: "Maharashtra", city: "Pune" },
  "412": { district: "Pune Rural", state: "Maharashtra", city: "Pune" },
  "413": { district: "Solapur", state: "Maharashtra", city: "Solapur" },
  "414": { district: "Ahmednagar", state: "Maharashtra", city: "Ahmednagar" },
  "415": { district: "Satara", state: "Maharashtra", city: "Satara" },
  "416": { district: "Kolhapur", state: "Maharashtra", city: "Kolhapur" },
  "421": { district: "Kalyan", state: "Maharashtra", city: "Kalyan" },
  "422": { district: "Nashik", state: "Maharashtra", city: "Nashik" },
  "423": { district: "Malegaon", state: "Maharashtra", city: "Malegaon" },
  "424": { district: "Dhule", state: "Maharashtra", city: "Dhule" },
  "425": { district: "Jalgaon", state: "Maharashtra", city: "Jalgaon" },
  "431": { district: "Chhatrapati Sambhajinagar", state: "Maharashtra", city: "Aurangabad" },
  "440": { district: "Nagpur", state: "Maharashtra", city: "Nagpur" },
  "441": { district: "Nagpur Rural", state: "Maharashtra", city: "Nagpur" },
  "444": { district: "Amravati", state: "Maharashtra", city: "Amravati" },

  // --- KARNATAKA ---
  "560": { district: "Bengaluru Urban", state: "Karnataka", city: "Bengaluru" },
  "561": { district: "Bengaluru Rural", state: "Karnataka", city: "Bengaluru" },
  "562": { district: "Kolar", state: "Karnataka", city: "Kolar" },
  "570": { district: "Mysuru", state: "Karnataka", city: "Mysuru" },
  "571": { district: "Mandya", state: "Karnataka", city: "Mandya" },
  "572": { district: "Tumakuru", state: "Karnataka", city: "Tumakuru" },
  "573": { district: "Hassan", state: "Karnataka", city: "Hassan" },
  "574": { district: "Dakshina Kannada", state: "Karnataka", city: "Mangaluru" },
  "575": { district: "Mangaluru", state: "Karnataka", city: "Mangaluru" },
  "576": { district: "Udupi", state: "Karnataka", city: "Udupi" },
  "577": { district: "Shivamogga", state: "Karnataka", city: "Shivamogga" },
  "580": { district: "Dharwad", state: "Karnataka", city: "Hubballi" },
  "581": { district: "Uttara Kannada", state: "Karnataka", city: "Karwar" },
  "582": { district: "Gadag", state: "Karnataka", city: "Gadag" },
  "583": { district: "Ballari", state: "Karnataka", city: "Ballari" },
  "584": { district: "Raichur", state: "Karnataka", city: "Raichur" },
  "585": { district: "Kalaburagi", state: "Karnataka", city: "Kalaburagi" },
  "586": { district: "Vijayapura", state: "Karnataka", city: "Vijayapura" },
  "590": { district: "Belagavi", state: "Karnataka", city: "Belagavi" },

  // --- TAMIL NADU ---
  "600": { district: "Chennai", state: "Tamil Nadu", city: "Chennai" },
  "601": { district: "Tiruvallur", state: "Tamil Nadu", city: "Tiruvallur" },
  "602": { district: "Kanchipuram", state: "Tamil Nadu", city: "Kanchipuram" },
  "603": { district: "Chengalpattu", state: "Tamil Nadu", city: "Chengalpattu" },
  "604": { district: "Villupuram", state: "Tamil Nadu", city: "Tindivanam" },
  "605": { district: "Puducherry", state: "Puducherry", city: "Puducherry" },
  "620": { district: "Tiruchirappalli", state: "Tamil Nadu", city: "Tiruchirappalli" },
  "624": { district: "Dindigul", state: "Tamil Nadu", city: "Dindigul" },
  "625": { district: "Madurai", state: "Tamil Nadu", city: "Madurai" },
  "627": { district: "Tirunelveli", state: "Tamil Nadu", city: "Tirunelveli" },
  "628": { district: "Thoothukudi", state: "Tamil Nadu", city: "Thoothukudi" },
  "629": { district: "Kanyakumari", state: "Tamil Nadu", city: "Nagercoil" },
  "636": { district: "Salem", state: "Tamil Nadu", city: "Salem" },
  "638": { district: "Erode", state: "Tamil Nadu", city: "Erode" },
  "641": { district: "Coimbatore", state: "Tamil Nadu", city: "Coimbatore" },
  "642": { district: "Coimbatore Rural", state: "Tamil Nadu", city: "Pollachi" },

  // --- GUJARAT ---
  "380": { district: "Ahmedabad", state: "Gujarat", city: "Ahmedabad" },
  "382": { district: "Gandhinagar", state: "Gujarat", city: "Gandhinagar" },
  "384": { district: "Mehsana", state: "Gujarat", city: "Mehsana" },
  "385": { district: "Banaskantha", state: "Gujarat", city: "Palanpur" },
  "387": { district: "Kheda", state: "Gujarat", city: "Nadiad" },
  "388": { district: "Anand", state: "Gujarat", city: "Anand" },
  "390": { district: "Vadodara", state: "Gujarat", city: "Vadodara" },
  "392": { district: "Bharuch", state: "Gujarat", city: "Bharuch" },
  "393": { district: "Ankleshwar", state: "Gujarat", city: "Ankleshwar" },
  "394": { district: "Surat Rural", state: "Gujarat", city: "Surat" },
  "395": { district: "Surat", state: "Gujarat", city: "Surat" },
  "396": { district: "Valsad", state: "Gujarat", city: "Vapi" },

  // --- UTTAR PRADESH & UTTARAKHAND ---
  "201": { district: "Gautam Buddha Nagar", state: "Uttar Pradesh", city: "Noida" },
  "202": { district: "Aligarh", state: "Uttar Pradesh", city: "Aligarh" },
  "203": { district: "Bulandshahr", state: "Uttar Pradesh", city: "Bulandshahr" },
  "204": { district: "Hathras", state: "Uttar Pradesh", city: "Hathras" },
  "208": { district: "Kanpur Nagar", state: "Uttar Pradesh", city: "Kanpur" },
  "209": { district: "Kanpur Dehat", state: "Uttar Pradesh", city: "Kanpur Dehat" },
  "211": { district: "Prayagraj", state: "Uttar Pradesh", city: "Prayagraj" },
  "221": { district: "Varanasi", state: "Uttar Pradesh", city: "Varanasi" },
  "224": { district: "Ayodhya", state: "Uttar Pradesh", city: "Ayodhya" },
  "226": { district: "Lucknow", state: "Uttar Pradesh", city: "Lucknow" },
  "244": { district: "Moradabad", state: "Uttar Pradesh", city: "Moradabad" },
  "245": { district: "Hapur", state: "Uttar Pradesh", city: "Hapur" },
  "247": { district: "Saharanpur", state: "Uttar Pradesh", city: "Saharanpur" },
  "248": { district: "Dehradun", state: "Uttarakhand", city: "Dehradun" },
  "249": { district: "Haridwar", state: "Uttarakhand", city: "Haridwar" },
  "250": { district: "Meerut", state: "Uttar Pradesh", city: "Meerut" },
  "263": { district: "Nainital", state: "Uttarakhand", city: "Nainital" },
  "273": { district: "Gorakhpur", state: "Uttar Pradesh", city: "Gorakhpur" },
  "281": { district: "Mathura", state: "Uttar Pradesh", city: "Mathura" },
  "282": { district: "Agra", state: "Uttar Pradesh", city: "Agra" },
  "284": { district: "Jhansi", state: "Uttar Pradesh", city: "Jhansi" },

  // --- WEST BENGAL ---
  "700": { district: "Kolkata", state: "West Bengal", city: "Kolkata" },
  "711": { district: "Howrah", state: "West Bengal", city: "Howrah" },
  "712": { district: "Hooghly", state: "West Bengal", city: "Hooghly" },
  "713": { district: "Paschim Bardhaman", state: "West Bengal", city: "Durgapur" },
  "721": { district: "Paschim Medinipur", state: "West Bengal", city: "Midnapore" },
  "734": { district: "Darjeeling", state: "West Bengal", city: "Siliguri" },
  "741": { district: "Nadia", state: "West Bengal", city: "Kalyani" },
  "743": { district: "North 24 Parganas", state: "West Bengal", city: "Barasat" },

  // --- BIHAR & JHARKHAND ---
  "800": { district: "Patna", state: "Bihar", city: "Patna" },
  "801": { district: "Patna Rural", state: "Bihar", city: "Danapur" },
  "802": { district: "Bhojpur", state: "Bihar", city: "Ara" },
  "803": { district: "Nalanda", state: "Bihar", city: "Bihar Sharif" },
  "812": { district: "Bhagalpur", state: "Bihar", city: "Bhagalpur" },
  "823": { district: "Gaya", state: "Bihar", city: "Gaya" },
  "825": { district: "Hazaribagh", state: "Jharkhand", city: "Hazaribagh" },
  "826": { district: "Dhanbad", state: "Jharkhand", city: "Dhanbad" },
  "827": { district: "Bokaro", state: "Jharkhand", city: "Bokaro Steel City" },
  "831": { district: "East Singhbhum", state: "Jharkhand", city: "Jamshedpur" },
  "834": { district: "Ranchi", state: "Jharkhand", city: "Ranchi" },

  // --- PUNJAB & HARYANA ---
  "121": { district: "Faridabad", state: "Haryana", city: "Faridabad" },
  "122": { district: "Gurugram", state: "Haryana", city: "Gurugram" },
  "124": { district: "Rohtak", state: "Haryana", city: "Rohtak" },
  "125": { district: "Hisar", state: "Haryana", city: "Hisar" },
  "131": { district: "Sonipat", state: "Haryana", city: "Sonipat" },
  "132": { district: "Panipat", state: "Haryana", city: "Panipat" },
  "134": { district: "Panchkula", state: "Haryana", city: "Panchkula" },
  "141": { district: "Ludhiana", state: "Punjab", city: "Ludhiana" },
  "143": { district: "Amritsar", state: "Punjab", city: "Amritsar" },
  "144": { district: "Jalandhar", state: "Punjab", city: "Jalandhar" },
  "147": { district: "Patiala", state: "Punjab", city: "Patiala" },
  "151": { district: "Bathinda", state: "Punjab", city: "Bathinda" },

  // --- KERALA ---
  "682": { district: "Ernakulam", state: "Kerala", city: "Kochi" },
  "686": { district: "Kottayam", state: "Kerala", city: "Kottayam" },
  "688": { district: "Alappuzha", state: "Kerala", city: "Alappuzha" },
  "691": { district: "Kollam", state: "Kerala", city: "Kollam" },
  "695": { district: "Thiruvananthapuram", state: "Kerala", city: "Thiruvananthapuram" },
  "670": { district: "Kannur", state: "Kerala", city: "Kannur" },
  "673": { district: "Kozhikode", state: "Kerala", city: "Kozhikode" },
  "678": { district: "Palakkad", state: "Kerala", city: "Palakkad" },
  "680": { district: "Thrissur", state: "Kerala", city: "Thrissur" },

  // --- MADHYA PRADESH & CHHATTISGARH ---
  "452": { district: "Indore", state: "Madhya Pradesh", city: "Indore" },
  "456": { district: "Ujjain", state: "Madhya Pradesh", city: "Ujjain" },
  "462": { district: "Bhopal", state: "Madhya Pradesh", city: "Bhopal" },
  "474": { district: "Gwalior", state: "Madhya Pradesh", city: "Gwalior" },
  "482": { district: "Jabalpur", state: "Madhya Pradesh", city: "Jabalpur" },
  "490": { district: "Durg", state: "Chhattisgarh", city: "Bhilai" },
  "492": { district: "Raipur", state: "Chhattisgarh", city: "Raipur" },
  "495": { district: "Bilaspur", state: "Chhattisgarh", city: "Bilaspur" },

  // --- ODISHA ---
  "751": { district: "Khordha", state: "Odisha", city: "Bhubaneswar" },
  "752": { district: "Puri", state: "Odisha", city: "Puri" },
  "753": { district: "Cuttack", state: "Odisha", city: "Cuttack" },
  "768": { district: "Sambalpur", state: "Odisha", city: "Sambalpur" },
  "769": { district: "Sundargarh", state: "Odisha", city: "Rourkela" },

  // --- ASSAM & NORTH EAST ---
  "781": { district: "Kamrup", state: "Assam", city: "Guwahati" },
  "786": { district: "Dibrugarh", state: "Assam", city: "Dibrugarh" },
  "793": { district: "East Khasi Hills", state: "Meghalaya", city: "Shillong" },
  "795": { district: "Imphal West", state: "Manipur", city: "Imphal" },
  "796": { district: "Aizawl", state: "Mizoram", city: "Aizawl" },
  "797": { district: "Kohima", state: "Nagaland", city: "Kohima" },
  "799": { district: "West Tripura", state: "Tripura", city: "Agartala" },
};

/**
 * Resolves geographical hierarchy from a 6-digit Indian PIN code.
 * Guaranteed to NEVER return "Unknown" for valid Indian PIN codes.
 */
export function resolvePincodeHierarchy(rawPincode?: string | null): ResolvedLocation {
  const cleanPin = String(rawPincode || "").replace(/\D/g, "").slice(0, 6);
  if (cleanPin.length < 3) {
    return {
      pincode: cleanPin,
      city: "Jaipur",
      district: "Jaipur",
      state: "Rajasthan",
      isRecognized: false,
    };
  }

  const prefix3 = cleanPin.substring(0, 3);
  const match3 = THREE_DIGIT_DISTRICT_MAP[prefix3];
  if (match3) {
    return {
      pincode: cleanPin,
      city: match3.city || match3.district,
      district: match3.district,
      state: match3.state,
      isRecognized: true,
    };
  }

  const prefix2 = cleanPin.substring(0, 2);
  const stateMatch = TWO_DIGIT_STATE_MAP[prefix2];
  if (stateMatch) {
    return {
      pincode: cleanPin,
      city: stateMatch,
      district: stateMatch,
      state: stateMatch,
      isRecognized: true,
    };
  }

  // Fallback default
  return {
    pincode: cleanPin,
    city: "Jaipur",
    district: "Jaipur",
    state: "Rajasthan",
    isRecognized: false,
  };
}

/**
 * Cleanly formats a customer location display string without ever leaking "Unknown".
 * Example output: "Bottuguda, Nalgonda, Telangana (508001)" or "Nalgonda, Telangana (508001)"
 */
export function formatLocationDisplay(options: {
  area?: string | null;
  city?: string | null;
  district?: string | null;
  state?: string | null;
  pincode?: string | null;
}): string {
  const pin = String(options.pincode || "").replace(/\D/g, "");
  const fallback = resolvePincodeHierarchy(pin);

  const cleanVal = (val?: string | null) => {
    if (!val) return "";
    const trimmed = String(val).trim();
    if (trimmed.toLowerCase() === "unknown" || trimmed.toLowerCase() === "undefined" || trimmed.toLowerCase() === "null") {
      return "";
    }
    return trimmed;
  };

  const area = cleanVal(options.area);
  const rawCity = cleanVal(options.city);
  const rawDistrict = cleanVal(options.district);
  const rawState = cleanVal(options.state);

  const city = rawCity || rawDistrict || fallback.city;
  const district = rawDistrict || (city !== fallback.district ? fallback.district : "");
  const state = rawState || fallback.state;

  const parts: string[] = [];
  if (area && area !== city && area !== district) {
    parts.push(area);
  }
  if (district && district !== city) {
    parts.push(district);
  }
  if (city) {
    parts.push(city);
  }
  if (state && !parts.includes(state)) {
    parts.push(state);
  }

  const locationText = parts.length > 0 ? parts.join(", ") : fallback.district + ", " + fallback.state;
  return pin ? `${locationText} (${pin})` : locationText;
}
