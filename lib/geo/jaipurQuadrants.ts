/**
 * Master Verified 4-Quadrant Micro-Zones for all Jaipur PIN Codes (302xxx & Metro)
 * Authoritative source of geographic truth for CCTV lead routing, salesperson territory
 * assignment, and admin coverage zone configuration.
 *
 * Each PIN code is strictly partitioned into:
 * - North-West, North-East, South-West, South-East
 * with prominent commercial anchors and authentic residential colonies.
 */

export interface DeliveryHubDefinition {
  zone: string;
  anchor: string;
  coverage: string;
  compassZone?: "North-West" | "North-East" | "South-West" | "South-East";
}

// Retain QuadrantDefinition alias for backwards compatibility
export type QuadrantDefinition = DeliveryHubDefinition;

export const JAIPUR_VERIFIED_QUADRANTS: Record<string, QuadrantDefinition[]> = {
  // ── 302001: Jaipur GPO / MI Road / Pink City West ──
  "302001": [
    { zone: "Chandpole Bazar", anchor: "Chandpole Bazar", coverage: "Chandpole Bazar, Chhoti Chaupar, Purani Basti, Bagru Walon Ka Rasta", compassZone: "North-West" },
    { zone: "Tripolia Bazar", anchor: "Tripolia Bazar", coverage: "Tripolia Bazar, Badi Chaupar, Sireh Deori Bazar, Hawa Mahal area", compassZone: "North-East" },
    { zone: "Panch Batti / GPO", anchor: "Panch Batti / GPO", coverage: "Panch Batti, MI Road (West), Ganpati Plaza, Sansar Chandra Road, Jaipur GPO", compassZone: "South-West" },
    { zone: "Ajmeri Gate", anchor: "Ajmeri Gate", coverage: "Ajmeri Gate, New Gate, Bapu Bazar, Ram Niwas Bagh, Albert Hall area", compassZone: "South-East" }
  ],

  // ── 302002: Walled City Central / Kishanpole / Chaura Rasta ──
  "302002": [
    { zone: "Kishanpole Bazar", anchor: "Kishanpole Bazar", coverage: "Kishanpole Bazar, Khazane Walon Ka Rasta, Baba Harish Chandra Marg", compassZone: "North-West" },
    { zone: "Tripolia Bazar Central", anchor: "Tripolia Bazar Central", coverage: "Tripolia Bazar, Chhoti Chaupar to Badi Chaupar stretch, Maniharon Ka Rasta", compassZone: "North-East" },
    { zone: "Chaura Rasta", anchor: "Chaura Rasta", coverage: "Chaura Rasta, Golcha Cinema, Film Colony, Nataniyon Ka Rasta", compassZone: "South-West" },
    { zone: "Nehru Bazar / Sanganeri Gate", anchor: "Nehru Bazar / Sanganeri Gate", coverage: "Nehru Bazar, Bapu Bazar, Indira Bazar, Sanganeri Gate", compassZone: "South-East" }
  ],

  // ── 302003: Walled City East / Ramganj / Ghat Gate / Surajpole / Transport Nagar ──
  "302003": [
    { zone: "Ramganj Bazar", anchor: "Ramganj Bazar", coverage: "Ramganj Bazar, Char Darwaza, Subhash Chowk, Sireh Deori East", compassZone: "North-West" },
    { zone: "Surajpole Gate", anchor: "Surajpole Gate", coverage: "Surajpole Bazar, Galta Gate, Delhi Bypass junction", compassZone: "North-East" },
    { zone: "Ghat Gate", anchor: "Ghat Gate", coverage: "Ghat Gate, Ramganj Chaupar south, Moti Dungri Road approach", compassZone: "South-West" },
    { zone: "Transport Nagar / Agra Road", anchor: "Transport Nagar / Agra Road", coverage: "Transport Nagar, Agra Road (NH-21), Ghat Ki Guni, Gurjar Ghati", compassZone: "South-East" }
  ],

  // ── 302004: Raja Park / Adarsh Nagar / Tilak Nagar / Jawahar Nagar ──
  "302004": [
    { zone: "Raja Park Main Market", anchor: "Raja Park Main Market", coverage: "Raja Park Main Market, Panchwati, AC Market, Dhruv Marg", compassZone: "North-West" },
    { zone: "Pink Square Mall", anchor: "Pink Square Mall", coverage: "Pink Square Mall, Sethi Colony, Govind Marg, Janta Colony", compassZone: "North-East" },
    { zone: "Tilak Nagar / LBS College", anchor: "Tilak Nagar / LBS College", coverage: "Tilak Nagar, LBS College, Bhagat Singh Park, Pranami Mandir", compassZone: "South-West" },
    { zone: "Jawahar Nagar Sectors", anchor: "Jawahar Nagar Sectors", coverage: "Jawahar Nagar (Sectors 1-7), Sector 4 Shopping Centre, Jhalana Bypass", compassZone: "South-East" }
  ],

  // ── 302005: Vidhan Sabha / Secretariat / Lal Kothi / High Court ──
  "302005": [
    { zone: "Vidhan Sabha / Jyoti Nagar", anchor: "Vidhan Sabha / Jyoti Nagar", coverage: "Rajasthan Vidhan Sabha, Jyoti Nagar, Janpath, NCR Building", compassZone: "North-West" },
    { zone: "Rajasthan Secretariat", anchor: "Rajasthan Secretariat", coverage: "Government Secretariat, High Court (Old), Statue Circle South, Bhagwan Das Road", compassZone: "North-East" },
    { zone: "Lal Kothi Scheme", anchor: "Lal Kothi Scheme", coverage: "Lal Kothi Scheme, JP Phatak, Pankaj Singhvi Marg, Jyoti Nagar West", compassZone: "South-West" },
    { zone: "Ambedkar Circle / Rambagh", anchor: "Ambedkar Circle / Rambagh", coverage: "Ambedkar Circle, Rajasthan State Archives, Rambagh Palace approach, Sahakar Bhawan", compassZone: "South-East" }
  ],

  // ── 302006: Civil Lines / Railway Station / Jacob Road / Hasanpura ──
  "302006": [
    { zone: "Jaipur Junction Railway Station", anchor: "Jaipur Junction Railway Station", coverage: "Jaipur Junction (Platform 1), Station Road, Hasanpura, Power House", compassZone: "North-West" },
    { zone: "Khasa Kothi Circle", anchor: "Khasa Kothi Circle", coverage: "Khasa Kothi Circle, Collectorate South, Ganpati Nagar, Railway Colony", compassZone: "North-East" },
    { zone: "Civil Lines / Raj Bhawan", anchor: "Civil Lines / Raj Bhawan", coverage: "Civil Lines, Raj Bhawan, Chief Minister Residence, Jacob Road", compassZone: "South-West" },
    { zone: "22 Godown / Hawa Sadak", anchor: "22 Godown / Hawa Sadak", coverage: "22 Godown Circle, Hawa Sadak, PWD Office, ESI Hospital", compassZone: "South-East" }
  ],

  // ── 302011: Ajmer Road / DCM / Kings Road / Nirman Nagar ──
  "302011": [
    { zone: "DCM Ajmer Road", anchor: "DCM Ajmer Road", coverage: "DCM Ajmer Road, Tagore Nagar, Janpath, Heera Nagar", compassZone: "North-West" },
    { zone: "Kings Road / Nirman Nagar", anchor: "Kings Road / Nirman Nagar", coverage: "Kings Road, Nirman Nagar (AB Block), DCM Flyover", compassZone: "North-East" },
    { zone: "Rani Sati Nagar", anchor: "Rani Sati Nagar", coverage: "Rani Sati Nagar, Shyam Nagar Extension, Janpath South", compassZone: "South-West" },
    { zone: "Gurjar Ki Thadi", anchor: "Gurjar Ki Thadi", coverage: "Gurjar Ki Thadi, New Sanganer Road junction, Gopalpura Bypass West", compassZone: "South-East" }
  ],

  // ── 302012: Jhotwara / Niwaru Road / Kalwar Road / Khatipura / Nangal Jaisabohara ──
  "302012": [
    { zone: "Niwaru Road", anchor: "Niwaru Road", coverage: "Niwaru Road, Anand Nagar, Peedha Factory, Ashok Nagar (Jhotwara), Baori approach", compassZone: "North-West" },
    { zone: "Lata Circle", anchor: "Lata Circle", coverage: "Lata Circle, Jhotwara Police Station, Kalwar Road Main Market, Khora Bisal", compassZone: "North-East" },
    { zone: "Khatipura Tiraha", anchor: "Khatipura Tiraha", coverage: "Khatipura Tiraha, Khatipura Railway Station, Shilp Bari, Jaswant Nagar", compassZone: "South-West" },
    { zone: "Jhotwara Industrial Area", anchor: "Jhotwara Industrial Area", coverage: "Jhotwara Industrial Area, Panchayat Samiti, Tara Nagar, Joshi Marg, Nangal Jaisabohara", compassZone: "South-East" }
  ],

  // ── 302013: VKI Industrial Area / Harmada / Sikar Road ──
  "302013": [
    { zone: "VKIA Road No. 9 to 14", anchor: "VKIA Road No. 9 to 14", coverage: "Road No. 9-14 VKIA, Akhepura, Badarna, Vishwakarma Police Station", compassZone: "North-West" },
    { zone: "Harmada / Sikar Highway", anchor: "Harmada / Sikar Highway", coverage: "Harmada Ghati, Sikar Road (NH-52), Laxmipura, Sun City approach", compassZone: "North-East" },
    { zone: "VKIA Road No. 1 to 5", anchor: "VKIA Road No. 1 to 5", coverage: "Road No. 1-5 VKIA, Kedia Palace, Dadi Ka Phatak North", compassZone: "South-West" },
    { zone: "Murlipura Chauraha / Sikar Road", anchor: "Murlipura Chauraha / Sikar Road", coverage: "Murlipura Chauraha, Bajri Mandi, Dher Ke Balaji, Road No. 1", compassZone: "South-East" }
  ],

  // ── 302015: Tonk Phatak / Bajaj Nagar / Gandhi Nagar / Barkat Nagar ──
  "302015": [
    { zone: "Tonk Phatak", anchor: "Tonk Phatak", coverage: "Tonk Phatak, Krishna Nagar, Barkat Nagar North, Phatak Flyover", compassZone: "North-West" },
    { zone: "Gandhi Nagar Station", anchor: "Gandhi Nagar Station", coverage: "Gandhi Nagar Railway Station, Bajaj Nagar North, University Marg", compassZone: "North-East" },
    { zone: "Himmat Nagar / Barkat Nagar", anchor: "Himmat Nagar / Barkat Nagar", coverage: "Himmat Nagar, Barkat Nagar Main Market, Imli Phatak approach", compassZone: "South-West" },
    { zone: "Bajaj Nagar Enclave", anchor: "Bajaj Nagar Enclave", coverage: "Bajaj Nagar Enclave, Mahaveer Nagar Extension, Tonk Road", compassZone: "South-East" }
  ],

  // ── 302016: Bani Park / Shastri Nagar / Collectorate / Kanti Nagar ──
  "302016": [
    { zone: "Shastri Nagar / Science Park", anchor: "Shastri Nagar / Science Park", coverage: "Shastri Nagar, Science Park, Subhash Nagar, Peetal Factory", compassZone: "North-West" },
    { zone: "Collectorate Circle", anchor: "Collectorate Circle", coverage: "Collectorate Circle, Mini Secretariat, Dushyant Marg, Banipark North", compassZone: "North-East" },
    { zone: "Sawai Jai Singh Highway", anchor: "Sawai Jai Singh Highway", coverage: "Sawai Jai Singh Highway, Kabir Marg, Central Bani Park, Madho Singh Road", compassZone: "South-West" },
    { zone: "Sindhi Camp / Kanti Nagar", anchor: "Sindhi Camp / Kanti Nagar", coverage: "Sindhi Camp Bus Stand, Kanti Nagar, Station Road North, Vanasthali Marg", compassZone: "South-East" }
  ],

  // ── 302017: Malviya Nagar / WTP / Gaurav Tower / Calgiri / Jawahar Circle ──
  "302017": [
    { zone: "Gaurav Tower (GT)", anchor: "Gaurav Tower (GT)", coverage: "Gaurav Tower, Malviya Nagar Sectors 1-4, Model Town, Malviya Nagar Phatak", compassZone: "North-West" },
    { zone: "World Trade Park (WTP)", anchor: "World Trade Park (WTP)", coverage: "World Trade Park, JLN Marg, Jawahar Circle, Malviya Nagar Flyover", compassZone: "North-East" },
    { zone: "Calgiri Road / Fortis", anchor: "Calgiri Road / Fortis", coverage: "Calgiri Hospital Road, Fortis Hospital, Sectors 5-8, Amit Bhardwaj Marg", compassZone: "South-West" },
    { zone: "Apex Circle / Malviya Industrial", anchor: "Apex Circle / Malviya Industrial", coverage: "Apex Circle, Malviya Industrial Area, Sectors 9-14, D-Block", compassZone: "South-East" }
  ],

  // ── 302018: Durgapura / Mahaveer Nagar / Triveni Nagar / Gopalpura Bypass ──
  "302018": [
    { zone: "Gopalpura Bypass / Triveni Nagar", anchor: "Gopalpura Bypass / Triveni Nagar", coverage: "Gopalpura Bypass, Triveni Nagar, Mahesh Nagar, Arjun Nagar", compassZone: "North-West" },
    { zone: "Durgapura Railway Station", anchor: "Durgapura Railway Station", coverage: "Durgapura Railway Station, Mahaveer Nagar, Tonk Road (Durgapura stretch)", compassZone: "North-East" },
    { zone: "Agriculture Research Station", anchor: "Agriculture Research Station", coverage: "Agriculture Research Station (Durgapura), Surya Nagar, Kisan Marg", compassZone: "South-West" },
    { zone: "Durgapura Flyover / Maharani Farm", anchor: "Durgapura Flyover / Maharani Farm", coverage: "Durgapura Flyover, Maharani Farm, Tarun Vihar, Kalyan Nagar", compassZone: "South-East" }
  ],

  // ── 302019: Shyam Nagar / Sodala / Ram Nagar / Swej Farm / Purani Chungi ──
  "302019": [
    { zone: "Sodala / Purani Chungi", anchor: "Sodala / Purani Chungi", coverage: "Sodala Chauraha, Purani Chungi, Ajmer Road, Sushilpura", compassZone: "North-West" },
    { zone: "Ram Nagar / Hawa Sadak", anchor: "Ram Nagar / Hawa Sadak", coverage: "Ram Nagar Metro Station, Hawa Sadak, Sudershanpura, ESI Road", compassZone: "North-East" },
    { zone: "Shyam Nagar Metro Station", anchor: "Shyam Nagar Metro Station", coverage: "Shyam Nagar Metro Station, Janpath, Vivek Vihar, Padmawati Colony", compassZone: "South-West" },
    { zone: "Swej Farm / New Sanganer Road", anchor: "Swej Farm / New Sanganer Road", coverage: "Swej Farm, Nandpuri, New Sanganer Road (Sodala to Mansarovar link)", compassZone: "South-East" }
  ],

  // ── 302020: Mansarovar (Sectors 1-12) / VT Road / Shipra Path / Patel Marg ──
  "302020": [
    { zone: "VT Road / Metro Station", anchor: "VT Road / Metro Station", coverage: "VT Road, Mansarovar Metro Station, Bhrigu Path, Sectors 1-3", compassZone: "North-West" },
    { zone: "Patel Marg / Mansarovar Stadium", anchor: "Patel Marg / Mansarovar Stadium", coverage: "Patel Marg, Swarn Path, Kaveri Path, Mansarovar Stadium, Mansarovar Thana", compassZone: "North-East" },
    { zone: "Madhyam Marg / Thadi Market", anchor: "Madhyam Marg / Thadi Market", coverage: "Madhyam Marg, Thadi Market, Rajat Path, Sectors 7-9, Meera Marg", compassZone: "South-West" },
    { zone: "Shipra Path / Dhanwantri", anchor: "Shipra Path / Dhanwantri", coverage: "Shipra Path, Dhanwantri Hospital, Varun Path, Sectors 10-12, Aravali Marg", compassZone: "South-East" }
  ],

  // ── 302021: Vaishali Nagar / Chitrakoot / Gandhi Path / Amrapali Circle ──
  "302021": [
    { zone: "Nursery Circle / Rangoli", anchor: "Nursery Circle / Rangoli", coverage: "Nursery Circle, Vaishali Police Station, Rangoli Gardens, Vaishali West", compassZone: "North-West" },
    { zone: "Amrapali Circle / Queens Road", anchor: "Amrapali Circle / Queens Road", coverage: "Amrapali Circle, National Handloom, Queens Road, Gupta Store", compassZone: "North-East" },
    { zone: "Gandhi Path West / Akshardham", anchor: "Gandhi Path West / Akshardham", coverage: "Gandhi Path West, Akshardham Mandir, Chitrakoot Stadium, Pratap Nagar (Vaishali)", compassZone: "South-West" },
    { zone: "Chitrakoot / DCM Border", anchor: "Chitrakoot / DCM Border", coverage: "Chitrakoot Sectors 1-4, DCM Ajmer Road border, Tagore Nagar", compassZone: "South-East" }
  ],

  // ── 302022: Sitapura RIICO / JECC / Mahatma Gandhi Hospital / Bilwa ──
  "302022": [
    { zone: "Sitapura Gate No. 1 / JECC", anchor: "Sitapura Gate No. 1 / JECC", coverage: "Sitapura Industrial Area Gate No. 1, JECC Exhibition Centre, EPIP Zone", compassZone: "North-West" },
    { zone: "Mahatma Gandhi Hospital", anchor: "Mahatma Gandhi Hospital", coverage: "Mahatma Gandhi Medical College & Hospital, JECRC University, ISI-1 RIICO", compassZone: "North-East" },
    { zone: "Sitapura Phase 3 & 4", anchor: "Sitapura Phase 3 & 4", coverage: "RIICO Phase 3 & 4, Apparel Park, Gems & Jewellery SEZ", compassZone: "South-West" },
    { zone: "India Gate / Tonk Road", anchor: "India Gate / Tonk Road", coverage: "India Gate Sitapura, Bilwa, Goner Road junction, Ring Road Sitapura", compassZone: "South-East" }
  ],

  // ── 302023: Sanganer Town / Sanganer Bazar / Kagzi Mohalla / Diggi Road ──
  "302023": [
    { zone: "Sanganer Flyover", anchor: "Sanganer Flyover", coverage: "Sanganer Flyover, Muhana Mandi Road entry, Chauraha Sanganer", compassZone: "North-West" },
    { zone: "Sanganer Main Bazar", anchor: "Sanganer Main Bazar", coverage: "Sanganer Bazar, Sanganer Police Station, Block Print Markets", compassZone: "North-East" },
    { zone: "Kagzi Mohalla", anchor: "Kagzi Mohalla", coverage: "Kagzi Mohalla (Handmade paper hub), Jain Temple Sanganer", compassZone: "South-West" },
    { zone: "Diggi Malpura Road / Stadium", anchor: "Diggi Malpura Road / Stadium", coverage: "Diggi Malpura Road, Sanganer Stadium, Cheeda Market", compassZone: "South-East" }
  ],

  // ── 302024: Khatipura West / Sirsi Road / Kanakpura / Meena Wala ──
  "302024": [
    { zone: "Sirsi Road / Kanakpura", anchor: "Sirsi Road / Kanakpura", coverage: "Sirsi Road, Kanakpura Railway Station, Mundia Rampura border", compassZone: "North-West" },
    { zone: "Khatipura Chauraha", anchor: "Khatipura Chauraha", coverage: "Khatipura Chauraha, Officers Campus, Sirsi Road entry", compassZone: "North-East" },
    { zone: "Meena Wala / Sirsi Village", anchor: "Meena Wala / Sirsi Village", coverage: "Meena Wala, Sirsi Village approach, Narayan Vihar West", compassZone: "South-West" },
    { zone: "Panchyawala", anchor: "Panchyawala", coverage: "Panchyawala, Vaishali Nagar Extension, Gandhi Path West", compassZone: "South-East" }
  ],

  // ── 302025: Jagatpura / Model Town / NRI Colony / SKIT / Akshay Patra ──
  "302025": [
    { zone: "Jagatpura Flyover / Station", anchor: "Jagatpura Flyover / Station", coverage: "Jagatpura Flyover, Jagatpura Railway Station, Model Town", compassZone: "North-West" },
    { zone: "7 Number Bus Stand", anchor: "7 Number Bus Stand", coverage: "7 Number Bus Stand, Indira Gandhi Nagar, Sector 1-5 Jagatpura", compassZone: "North-East" },
    { zone: "SKIT College / Akshay Patra", anchor: "SKIT College / Akshay Patra", coverage: "SKIT Engineering College, Ramnagariya, Akshay Patra Temple", compassZone: "South-West" },
    { zone: "Mahal Road / NRI Colony", anchor: "Mahal Road / NRI Colony", coverage: "Mahal Road, Gyan Vihar University, NRI Colony Jagatpura, Bombay Hospital site", compassZone: "South-East" }
  ],

  // ── 302026: Bhankrota / Mahapura / Ajmer Expressway / DPS School ──
  "302026": [
    { zone: "Bhankrota Chauraha", anchor: "Bhankrota Chauraha", coverage: "Bhankrota Chauraha, Ajmer Expressway (NH-48), Chimanpura", compassZone: "North-West" },
    { zone: "Jaisinghpura / DPS", anchor: "Jaisinghpura / DPS", coverage: "Jaisinghpura, DPS School, Narayan Vihar Extension", compassZone: "North-East" },
    { zone: "Mahapura / Omaxe City", anchor: "Mahapura / Omaxe City", coverage: "Mahapura, Omaxe City approach, Ajmer Road Toll plaza", compassZone: "South-West" },
    { zone: "Bad Ke Balaji / Ring Road", anchor: "Bad Ke Balaji / Ring Road", coverage: "Bad Ke Balaji, Ring Road Bhankrota cloverleaf, Kalwara link", compassZone: "South-East" }
  ],

  // ── 302027: Jaisinghpura Khor / Lalwas / CRPF / Delhi Road East ──
  "302027": [
    { zone: "Jaisinghpura Khor", anchor: "Jaisinghpura Khor", coverage: "Jaisinghpura Khor main market, Amber foothills east", compassZone: "North-West" },
    { zone: "CRPF Campus Lalwas", anchor: "CRPF Campus Lalwas", coverage: "CRPF Campus Lalwas, Jamwa Ramgarh Road", compassZone: "North-East" },
    { zone: "Saipura / Rahori", anchor: "Saipura / Rahori", coverage: "Saipura, Rahori, Indergarh", compassZone: "South-West" },
    { zone: "Langariyawas / Saiwar", anchor: "Langariyawas / Saiwar", coverage: "Langariyawas, Saiwar, Roopwas, Delhi Highway connector", compassZone: "South-East" }
  ],

  // ── 302028: Amer Town / Amber Fort / Delhi Highway North ──
  "302028": [
    { zone: "Amber Palace / Maota Lake", anchor: "Amber Palace / Maota Lake", coverage: "Amber Fort, Maota Lake, Jaigarh, Kheri Gate", compassZone: "North-West" },
    { zone: "Delhi Highway / Kunda", anchor: "Delhi Highway / Kunda", coverage: "Delhi Highway (NH-48), Kunda Amer, Kukas approach", compassZone: "North-East" },
    { zone: "Amer Town Main Bazar", anchor: "Amer Town Main Bazar", coverage: "Amer Town, Jagat Shiromani Mandir, Hathi Gaon", compassZone: "South-West" },
    { zone: "Nangal Soosawatan / Natata", anchor: "Nangal Soosawatan / Natata", coverage: "Nangal Soosawatan, Natata, Aravalli ridge", compassZone: "South-East" }
  ],

  // ── 302029: Sanganer Airport / Terminal 1 & 2 / Airport Cargo / Muhana ──
  "302029": [
    { zone: "Airport Terminal 2", anchor: "Airport Terminal 2", coverage: "Jaipur International Airport Terminal 2, Jawahar Circle South", compassZone: "North-West" },
    { zone: "Airport Cargo / Jagatpura Link", anchor: "Airport Cargo / Jagatpura Link", coverage: "Airport Cargo Complex, Jagatpura link road", compassZone: "North-East" },
    { zone: "Airport Terminal 1 / Old Airport", anchor: "Airport Terminal 1 / Old Airport", coverage: "Terminal 1 (Hajj Terminal), Old Airport Road, Sanganer Town", compassZone: "South-West" },
    { zone: "Tonk Road Airport Crossing", anchor: "Tonk Road Airport Crossing", coverage: "Tonk Road Airport Crossing, Cheelgadi Restaurant, Flyover", compassZone: "South-East" }
  ],

  // ── 302030: Bagru / Bagru Industrial Area / Ajmer Highway ──
  "302030": [
    { zone: "Bagru Chhipa Mohalla", anchor: "Bagru Chhipa Mohalla", coverage: "Bagru Chhipa Mohalla, Handblock Print Hub", compassZone: "North-West" },
    { zone: "Bagru Industrial Area", anchor: "Bagru Industrial Area", coverage: "Bagru Industrial Area Phase 1 & 2, RIICO", compassZone: "North-East" },
    { zone: "Mahindra World City Link", anchor: "Mahindra World City Link", coverage: "Mahindra World City Link, Bagru Bypass", compassZone: "South-West" },
    { zone: "Ajmer Road Toll Plaza", anchor: "Ajmer Road Toll Plaza", coverage: "Ajmer Road Toll Plaza, Bagru Town Centre", compassZone: "South-East" }
  ],

  // ── 302031: Jamdoli / Luniawas / Agra Road NH-21 Corridor ──
  "302031": [
    { zone: "Jamdoli Chauraha", anchor: "Jamdoli Chauraha", coverage: "Jamdoli Chauraha, JECRC Medical / Keshav Vidyapeeth", compassZone: "North-West" },
    { zone: "Agra Road NH-21 Corridor", anchor: "Agra Road NH-21 Corridor", coverage: "Agra Road Highway, Kanota approach, Sumel", compassZone: "North-East" },
    { zone: "Sisodia Rani Ka Bagh", anchor: "Sisodia Rani Ka Bagh", coverage: "Sisodia Rani Ka Bagh, Ghat Ki Guni East, Vidyadhar Ka Bagh", compassZone: "South-West" },
    { zone: "Luniawas / Goner Link", anchor: "Luniawas / Goner Link", coverage: "Luniawas, Goner link road, Ring Road Agra Road node", compassZone: "South-East" }
  ],

  // ── 302032: C-Scheme / Statue Circle / Ashok Nagar / Secretariat ──
  "302032": [
    { zone: "Ahinsa Circle / Ashok Nagar", anchor: "Ahinsa Circle / Ashok Nagar", coverage: "Ahinsa Circle, Ashok Nagar, St. Xavier's School", compassZone: "North-West" },
    { zone: "Statue Circle", anchor: "Statue Circle", coverage: "Statue Circle, Bhagwan Das Road, Secretariat North", compassZone: "North-East" },
    { zone: "Subhash Marg", anchor: "Subhash Marg", coverage: "Subhash Marg, C-Scheme Post Office, Jamnalal Bajaj Marg", compassZone: "South-West" },
    { zone: "Government Secretariat", anchor: "Government Secretariat", coverage: "Government Secretariat, Raj Bhawan East, SMS Hospital North", compassZone: "South-East" }
  ],

  // ── 302033: Pratap Nagar Housing Board (Sectors 1-28) / Haldi Ghati / Kumbha Marg ──
  "302033": [
    { zone: "Pratap Nagar Sector 1-5", anchor: "Pratap Nagar Sector 1-5", coverage: "Sectors 1-5, Tonk Road, Sanganer Border, Chhatrapati Nagar", compassZone: "North-West" },
    { zone: "Haldi Ghati Marg / Sector 8-11", anchor: "Haldi Ghati Marg / Sector 8-11", coverage: "Haldi Ghati Marg, Sector 8-11, India Gate, Coaching Hub Phase 1", compassZone: "North-East" },
    { zone: "Kumbha Marg / Sector 16-22", anchor: "Kumbha Marg / Sector 16-22", coverage: "Kumbha Marg, Sector 16-22, Sheopur, Pratap Nagar Hospital", compassZone: "South-West" },
    { zone: "NRI Colony / Sector 26-28", anchor: "NRI Colony / Sector 26-28", coverage: "NRI Colony Pratap Nagar, Sectors 26-28, Ring Road Pratap Nagar exit", compassZone: "South-East" }
  ],

  // ── 302034: Panchyawala / Sirsi Road Extension / Meena Wala ──
  "302034": [
    { zone: "Sirsi Road Extension", anchor: "Sirsi Road Extension", coverage: "Sirsi Road, Kanakpura border, Harsh Vihar", compassZone: "North-West" },
    { zone: "Panchyawala Main Market", anchor: "Panchyawala Main Market", coverage: "Panchyawala Main Market, Officers Campus West", compassZone: "North-East" },
    { zone: "Meena Wala / Gandhi Path", anchor: "Meena Wala / Gandhi Path", coverage: "Meena Wala, Gandhi Path West extension, Royal City", compassZone: "South-West" },
    { zone: "Chitrakoot West Border", anchor: "Chitrakoot West Border", coverage: "Chitrakoot West Border, Vaishali Nagar extension", compassZone: "South-East" }
  ],

  // ── 302037: Mahindra World City SEZ / Ajmer Road ──
  "302037": [
    { zone: "MWC IT SEZ Gate 1", anchor: "MWC IT SEZ Gate 1", coverage: "Infosys, Wipro, MWC IT Park Zone", compassZone: "North-West" },
    { zone: "MWC Main Entrance", anchor: "MWC Main Entrance", coverage: "Ajmer Road Highway entrance, Commercial Centre", compassZone: "North-East" },
    { zone: "MWC DTA / Industrial", anchor: "MWC DTA / Industrial", coverage: "Domestic Tariff Area, JCB Plant, Deutsche Bank campus", compassZone: "South-West" },
    { zone: "Mahindra Bloomdale", anchor: "Mahindra Bloomdale", coverage: "Bloomdale, Origins, Kalwara Village approach", compassZone: "South-East" }
  ],

  // ── 302038: Kukas / Amity / Delhi Highway Institutional ──
  "302038": [
    { zone: "Amity University Campus", anchor: "Amity University Campus", coverage: "Amity University, RIICO Kukas Phase 1", compassZone: "North-West" },
    { zone: "Delhi Highway / Kukas Chowk", anchor: "Delhi Highway / Kukas Chowk", coverage: "Delhi Highway (NH-48), Kukas Main Market, Le Meridien", compassZone: "North-East" },
    { zone: "RIICO Industrial Area Kukas", anchor: "RIICO Industrial Area Kukas", coverage: "RIICO Industrial Area Phase 2, Arya College Kukas", compassZone: "South-West" },
    { zone: "Dhand / Kookas Village", anchor: "Dhand / Kookas Village", coverage: "Dhand, Toda Meena, Bilod, Basna", compassZone: "South-East" }
  ],

  // ── 302039: Vidhyadhar Nagar (Central Spine) / Ambabari / Murlipura ──
  "302039": [
    { zone: "Vidhyadhar Nagar Central Spine", anchor: "Vidhyadhar Nagar Central Spine", coverage: "Central Spine, Sectors 1-4, Utsav Marg, National Handloom VDN", compassZone: "North-West" },
    { zone: "Ambabari / Sikar Road", anchor: "Ambabari / Sikar Road", coverage: "Ambabari, Sikar Road (Dher Ke Balaji), Kedia Palace", compassZone: "North-East" },
    { zone: "Murlipura Scheme", anchor: "Murlipura Scheme", coverage: "Murlipura Scheme, Vikas Nagar, Shiv Nagar", compassZone: "South-West" },
    { zone: "Dadi Ka Phatak / Alka Cinema", anchor: "Dadi Ka Phatak / Alka Cinema", coverage: "Dadi Ka Phatak, Alka Cinema, Road No. 1 Sikar Road", compassZone: "South-East" }
  ],

  // ── 302041: Dhankya / Bindayaka Industrial Area / Mundia Rampura / Sirsi West ──
  "302041": [
    { zone: "Dhankya Village / Station", anchor: "Dhankya Village / Station", coverage: "Dhankya Village, Dhankya Railway Station, Kalwar Link", compassZone: "North-West" },
    { zone: "Bindayaka Industrial Area", anchor: "Bindayaka Industrial Area", coverage: "Bindayaka Industrial Area (RIICO), Sirsi Road", compassZone: "North-East" },
    { zone: "Mundia Rampura / Bichpari", anchor: "Mundia Rampura / Bichpari", coverage: "Mundia Rampura, Bichpari, Ajmer Road link", compassZone: "South-West" },
    { zone: "Vaayu Vihar / Raj Water Park", anchor: "Vaayu Vihar / Raj Water Park", coverage: "Vaayu Vihar, Raj Water Park approach, Sirsi West", compassZone: "South-East" }
  ],

  // ── 302042: Bad Ke Balaji / Ajmer Road / Thikariya ──
  "302042": [
    { zone: "Bad Ke Balaji Temple", anchor: "Bad Ke Balaji Temple", coverage: "Bad Ke Balaji Temple, Ajmer Road Highway", compassZone: "North-West" },
    { zone: "Bhankrota Western Border", anchor: "Bhankrota Western Border", coverage: "Bhankrota western border, DPS link", compassZone: "North-East" },
    { zone: "Ajmer Road / Toll approach", anchor: "Ajmer Road / Toll approach", coverage: "Ajmer Road, Thikariya border", compassZone: "South-West" },
    { zone: "Ring Road Cloverleaf", anchor: "Ring Road Cloverleaf", coverage: "Ring Road Ajmer Road interchange", compassZone: "South-East" }
  ],

  // ── 302044: Govindpura / Kalwar Road / Hathoj ──
  "302044": [
    { zone: "Kalwar Road Highway", anchor: "Kalwar Road Highway", coverage: "Kalwar Road Highway, Hathoj approach", compassZone: "North-West" },
    { zone: "Govindpura Village", anchor: "Govindpura Village", coverage: "Govindpura, Jhotwara extension", compassZone: "North-East" },
    { zone: "Pachar Link Road", anchor: "Pachar Link Road", coverage: "Pachar road, Kalwar village link", compassZone: "South-West" },
    { zone: "Gokulpura Border", anchor: "Gokulpura Border", coverage: "Gokulpura, Jhotwara border", compassZone: "South-East" }
  ],

  // ── 302047: Mansarovar Extension / Dholai / Patrakar Colony ──
  "302047": [
    { zone: "Patrakar Colony", anchor: "Patrakar Colony", coverage: "Patrakar Colony, Mansarovar Sector 12 Extension", compassZone: "North-West" },
    { zone: "Dholai / Vijay Path Extension", anchor: "Dholai / Vijay Path Extension", coverage: "Dholai, Vijay Path Extension, New Sanganer Road link", compassZone: "North-East" },
    { zone: "Muhana Mandi Road approach", anchor: "Muhana Mandi Road approach", coverage: "Muhana Mandi Road, Keshav Nagar", compassZone: "South-West" },
    { zone: "Vande Mataram Circle", anchor: "Vande Mataram Circle", coverage: "Vande Mataram Marg, Mansarovar Extension South", compassZone: "South-East" }
  ],

  // ── 302048: Sun City / Sikar Road / Harmada Extension ──
  "302048": [
    { zone: "Sun City Main Gate", anchor: "Sun City Main Gate", coverage: "Sun City Township, Sikar Highway NH-52", compassZone: "North-West" },
    { zone: "Harmada Ghati North", anchor: "Harmada Ghati North", coverage: "Harmada Ghati, Foothills, Bypass link", compassZone: "North-East" },
    { zone: "Sikar Road Chauraha", anchor: "Sikar Road Chauraha", coverage: "Sikar Road, VKIA Road No. 14 North", compassZone: "South-West" },
    { zone: "Nehrugram", anchor: "Nehrugram", coverage: "Nehrugram, Sarna Doongar approach", compassZone: "South-East" }
  ],

  // ── 302049: Amber Road / Zorawar Singh Gate / Jal Mahal ──
  "302049": [
    { zone: "Kanak Vrindavan / Amber Road", anchor: "Kanak Vrindavan / Amber Road", coverage: "Kanak Vrindavan, Amber Palace approach", compassZone: "North-West" },
    { zone: "Jal Mahal / Man Sagar", anchor: "Jal Mahal / Man Sagar", coverage: "Jal Mahal Lake, Govind Nagar, Parshuram Dwara", compassZone: "North-East" },
    { zone: "Zorawar Singh Gate", anchor: "Zorawar Singh Gate", coverage: "Zorawar Singh Gate, City Palace North, Subhash Chowk", compassZone: "South-West" },
    { zone: "Ramgarh Mod", anchor: "Ramgarh Mod", coverage: "Ramgarh Mod, Jamwa Ramgarh Road start, Brahmapuri", compassZone: "South-East" }
  ]
};

/**
 * Helper to fetch verified quadrants for a given PIN code.
 */
export const getVerifiedHubs = getVerifiedQuadrants;
export function getVerifiedQuadrants(pincode: string): QuadrantDefinition[] | null {
  return JAIPUR_VERIFIED_QUADRANTS[pincode.trim()] || null;
}
