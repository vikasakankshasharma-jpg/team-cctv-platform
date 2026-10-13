/**
 * Master Verified 4-Quadrant Micro-Zones for all Jaipur PIN Codes (302xxx & Metro)
 * Authoritative source of geographic truth for CCTV lead routing, salesperson territory
 * assignment, and admin coverage zone configuration.
 *
 * Each PIN code is strictly partitioned into:
 * - North-West, North-East, South-West, South-East
 * with prominent commercial anchors and authentic residential colonies.
 */

export interface QuadrantDefinition {
  zone: "North-West" | "North-East" | "South-West" | "South-East";
  anchor: string;
  coverage: string;
}

export const JAIPUR_VERIFIED_QUADRANTS: Record<string, QuadrantDefinition[]> = {
  // ── 302001: Jaipur GPO / MI Road / Pink City West ──
  "302001": [
    { zone: "North-West", anchor: "Chandpole Bazar", coverage: "Chandpole Bazar, Chhoti Chaupar, Purani Basti, Bagru Walon Ka Rasta" },
    { zone: "North-East", anchor: "Tripolia Bazar", coverage: "Tripolia Bazar, Badi Chaupar, Sireh Deori Bazar, Hawa Mahal area" },
    { zone: "South-West", anchor: "Panch Batti / GPO", coverage: "Panch Batti, MI Road (West), Ganpati Plaza, Sansar Chandra Road, Jaipur GPO" },
    { zone: "South-East", anchor: "Ajmeri Gate", coverage: "Ajmeri Gate, New Gate, Bapu Bazar, Ram Niwas Bagh, Albert Hall area" }
  ],

  // ── 302002: Walled City Central / Kishanpole / Chaura Rasta ──
  "302002": [
    { zone: "North-West", anchor: "Kishanpole Bazar", coverage: "Kishanpole Bazar, Khazane Walon Ka Rasta, Baba Harish Chandra Marg" },
    { zone: "North-East", anchor: "Tripolia Bazar Central", coverage: "Tripolia Bazar, Chhoti Chaupar to Badi Chaupar stretch, Maniharon Ka Rasta" },
    { zone: "South-West", anchor: "Chaura Rasta", coverage: "Chaura Rasta, Golcha Cinema, Film Colony, Nataniyon Ka Rasta" },
    { zone: "South-East", anchor: "Nehru Bazar / Sanganeri Gate", coverage: "Nehru Bazar, Bapu Bazar, Indira Bazar, Sanganeri Gate" }
  ],

  // ── 302003: Walled City East / Ramganj / Ghat Gate / Surajpole / Transport Nagar ──
  "302003": [
    { zone: "North-West", anchor: "Ramganj Bazar", coverage: "Ramganj Bazar, Char Darwaza, Subhash Chowk, Sireh Deori East" },
    { zone: "North-East", anchor: "Surajpole Gate", coverage: "Surajpole Bazar, Galta Gate, Delhi Bypass junction" },
    { zone: "South-West", anchor: "Ghat Gate", coverage: "Ghat Gate, Ramganj Chaupar south, Moti Dungri Road approach" },
    { zone: "South-East", anchor: "Transport Nagar / Agra Road", coverage: "Transport Nagar, Agra Road (NH-21), Ghat Ki Guni, Gurjar Ghati" }
  ],

  // ── 302004: Raja Park / Adarsh Nagar / Tilak Nagar / Jawahar Nagar ──
  "302004": [
    { zone: "North-West", anchor: "Raja Park Main Market", coverage: "Raja Park Main Market, Panchwati, AC Market, Dhruv Marg" },
    { zone: "North-East", anchor: "Pink Square Mall", coverage: "Pink Square Mall, Sethi Colony, Govind Marg, Janta Colony" },
    { zone: "South-West", anchor: "Tilak Nagar / LBS College", coverage: "Tilak Nagar, LBS College, Bhagat Singh Park, Pranami Mandir" },
    { zone: "South-East", anchor: "Jawahar Nagar Sectors", coverage: "Jawahar Nagar (Sectors 1-7), Sector 4 Shopping Centre, Jhalana Bypass" }
  ],

  // ── 302005: Vidhan Sabha / Secretariat / Lal Kothi / High Court ──
  "302005": [
    { zone: "North-West", anchor: "Vidhan Sabha / Jyoti Nagar", coverage: "Rajasthan Vidhan Sabha, Jyoti Nagar, Janpath, NCR Building" },
    { zone: "North-East", anchor: "Rajasthan Secretariat", coverage: "Government Secretariat, High Court (Old), Statue Circle South, Bhagwan Das Road" },
    { zone: "South-West", anchor: "Lal Kothi Scheme", coverage: "Lal Kothi Scheme, JP Phatak, Pankaj Singhvi Marg, Jyoti Nagar West" },
    { zone: "South-East", anchor: "Ambedkar Circle / Rambagh", coverage: "Ambedkar Circle, Rajasthan State Archives, Rambagh Palace approach, Sahakar Bhawan" }
  ],

  // ── 302006: Civil Lines / Railway Station / Jacob Road / Hasanpura ──
  "302006": [
    { zone: "North-West", anchor: "Jaipur Junction Railway Station", coverage: "Jaipur Junction (Platform 1), Station Road, Hasanpura, Power House" },
    { zone: "North-East", anchor: "Khasa Kothi Circle", coverage: "Khasa Kothi Circle, Collectorate South, Ganpati Nagar, Railway Colony" },
    { zone: "South-West", anchor: "Civil Lines / Raj Bhawan", coverage: "Civil Lines, Raj Bhawan, Chief Minister Residence, Jacob Road" },
    { zone: "South-East", anchor: "22 Godown / Hawa Sadak", coverage: "22 Godown Circle, Hawa Sadak, PWD Office, ESI Hospital" }
  ],

  // ── 302011: Ajmer Road / DCM / Kings Road / Nirman Nagar ──
  "302011": [
    { zone: "North-West", anchor: "DCM Ajmer Road", coverage: "DCM Ajmer Road, Tagore Nagar, Janpath, Heera Nagar" },
    { zone: "North-East", anchor: "Kings Road / Nirman Nagar", coverage: "Kings Road, Nirman Nagar (AB Block), DCM Flyover" },
    { zone: "South-West", anchor: "Rani Sati Nagar", coverage: "Rani Sati Nagar, Shyam Nagar Extension, Janpath South" },
    { zone: "South-East", anchor: "Gurjar Ki Thadi", coverage: "Gurjar Ki Thadi, New Sanganer Road junction, Gopalpura Bypass West" }
  ],

  // ── 302012: Jhotwara / Niwaru Road / Kalwar Road / Khatipura / Nangal Jaisabohara ──
  "302012": [
    { zone: "North-West", anchor: "Niwaru Road", coverage: "Niwaru Road, Anand Nagar, Peedha Factory, Ashok Nagar (Jhotwara), Baori approach" },
    { zone: "North-East", anchor: "Lata Circle", coverage: "Lata Circle, Jhotwara Police Station, Kalwar Road Main Market, Khora Bisal" },
    { zone: "South-West", anchor: "Khatipura Tiraha", coverage: "Khatipura Tiraha, Khatipura Railway Station, Shilp Bari, Jaswant Nagar" },
    { zone: "South-East", anchor: "Jhotwara Industrial Area", coverage: "Jhotwara Industrial Area, Panchayat Samiti, Tara Nagar, Joshi Marg, Nangal Jaisabohara" }
  ],

  // ── 302013: VKI Industrial Area / Harmada / Sikar Road ──
  "302013": [
    { zone: "North-West", anchor: "VKIA Road No. 9 to 14", coverage: "Road No. 9-14 VKIA, Akhepura, Badarna, Vishwakarma Police Station" },
    { zone: "North-East", anchor: "Harmada / Sikar Highway", coverage: "Harmada Ghati, Sikar Road (NH-52), Laxmipura, Sun City approach" },
    { zone: "South-West", anchor: "VKIA Road No. 1 to 5", coverage: "Road No. 1-5 VKIA, Kedia Palace, Dadi Ka Phatak North" },
    { zone: "South-East", anchor: "Murlipura Chauraha / Sikar Road", coverage: "Murlipura Chauraha, Bajri Mandi, Dher Ke Balaji, Road No. 1" }
  ],

  // ── 302015: Tonk Phatak / Bajaj Nagar / Gandhi Nagar / Barkat Nagar ──
  "302015": [
    { zone: "North-West", anchor: "Tonk Phatak", coverage: "Tonk Phatak, Krishna Nagar, Barkat Nagar North, Phatak Flyover" },
    { zone: "North-East", anchor: "Gandhi Nagar Station", coverage: "Gandhi Nagar Railway Station, Bajaj Nagar North, University Marg" },
    { zone: "South-West", anchor: "Himmat Nagar / Barkat Nagar", coverage: "Himmat Nagar, Barkat Nagar Main Market, Imli Phatak approach" },
    { zone: "South-East", anchor: "Bajaj Nagar Enclave", coverage: "Bajaj Nagar Enclave, Mahaveer Nagar Extension, Tonk Road" }
  ],

  // ── 302016: Bani Park / Shastri Nagar / Collectorate / Kanti Nagar ──
  "302016": [
    { zone: "North-West", anchor: "Shastri Nagar / Science Park", coverage: "Shastri Nagar, Science Park, Subhash Nagar, Peetal Factory" },
    { zone: "North-East", anchor: "Collectorate Circle", coverage: "Collectorate Circle, Mini Secretariat, Dushyant Marg, Banipark North" },
    { zone: "South-West", anchor: "Sawai Jai Singh Highway", coverage: "Sawai Jai Singh Highway, Kabir Marg, Central Bani Park, Madho Singh Road" },
    { zone: "South-East", anchor: "Sindhi Camp / Kanti Nagar", coverage: "Sindhi Camp Bus Stand, Kanti Nagar, Station Road North, Vanasthali Marg" }
  ],

  // ── 302017: Malviya Nagar / WTP / Gaurav Tower / Calgiri / Jawahar Circle ──
  "302017": [
    { zone: "North-West", anchor: "Gaurav Tower (GT)", coverage: "Gaurav Tower, Malviya Nagar Sectors 1-4, Model Town, Malviya Nagar Phatak" },
    { zone: "North-East", anchor: "World Trade Park (WTP)", coverage: "World Trade Park, JLN Marg, Jawahar Circle, Malviya Nagar Flyover" },
    { zone: "South-West", anchor: "Calgiri Road / Fortis", coverage: "Calgiri Hospital Road, Fortis Hospital, Sectors 5-8, Amit Bhardwaj Marg" },
    { zone: "South-East", anchor: "Apex Circle / Malviya Industrial", coverage: "Apex Circle, Malviya Industrial Area, Sectors 9-14, D-Block" }
  ],

  // ── 302018: Durgapura / Mahaveer Nagar / Triveni Nagar / Gopalpura Bypass ──
  "302018": [
    { zone: "North-West", anchor: "Gopalpura Bypass / Triveni Nagar", coverage: "Gopalpura Bypass, Triveni Nagar, Mahesh Nagar, Arjun Nagar" },
    { zone: "North-East", anchor: "Durgapura Railway Station", coverage: "Durgapura Railway Station, Mahaveer Nagar, Tonk Road (Durgapura stretch)" },
    { zone: "South-West", anchor: "Agriculture Research Station", coverage: "Agriculture Research Station (Durgapura), Surya Nagar, Kisan Marg" },
    { zone: "South-East", anchor: "Durgapura Flyover / Maharani Farm", coverage: "Durgapura Flyover, Maharani Farm, Tarun Vihar, Kalyan Nagar" }
  ],

  // ── 302019: Shyam Nagar / Sodala / Ram Nagar / Swej Farm / Purani Chungi ──
  "302019": [
    { zone: "North-West", anchor: "Sodala / Purani Chungi", coverage: "Sodala Chauraha, Purani Chungi, Ajmer Road, Sushilpura" },
    { zone: "North-East", anchor: "Ram Nagar / Hawa Sadak", coverage: "Ram Nagar Metro Station, Hawa Sadak, Sudershanpura, ESI Road" },
    { zone: "South-West", anchor: "Shyam Nagar Metro Station", coverage: "Shyam Nagar Metro Station, Janpath, Vivek Vihar, Padmawati Colony" },
    { zone: "South-East", anchor: "Swej Farm / New Sanganer Road", coverage: "Swej Farm, Nandpuri, New Sanganer Road (Sodala to Mansarovar link)" }
  ],

  // ── 302020: Mansarovar (Sectors 1-12) / VT Road / Shipra Path / Patel Marg ──
  "302020": [
    { zone: "North-West", anchor: "VT Road / Metro Station", coverage: "VT Road, Mansarovar Metro Station, Bhrigu Path, Sectors 1-3" },
    { zone: "North-East", anchor: "Patel Marg / Mansarovar Stadium", coverage: "Patel Marg, Swarn Path, Kaveri Path, Mansarovar Stadium, Mansarovar Thana" },
    { zone: "South-West", anchor: "Madhyam Marg / Thadi Market", coverage: "Madhyam Marg, Thadi Market, Rajat Path, Sectors 7-9, Meera Marg" },
    { zone: "South-East", anchor: "Shipra Path / Dhanwantri", coverage: "Shipra Path, Dhanwantri Hospital, Varun Path, Sectors 10-12, Aravali Marg" }
  ],

  // ── 302021: Vaishali Nagar / Chitrakoot / Gandhi Path / Amrapali Circle ──
  "302021": [
    { zone: "North-West", anchor: "Nursery Circle / Rangoli", coverage: "Nursery Circle, Vaishali Police Station, Rangoli Gardens, Vaishali West" },
    { zone: "North-East", anchor: "Amrapali Circle / Queens Road", coverage: "Amrapali Circle, National Handloom, Queens Road, Gupta Store" },
    { zone: "South-West", anchor: "Gandhi Path West / Akshardham", coverage: "Gandhi Path West, Akshardham Mandir, Chitrakoot Stadium, Pratap Nagar (Vaishali)" },
    { zone: "South-East", anchor: "Chitrakoot / DCM Border", coverage: "Chitrakoot Sectors 1-4, DCM Ajmer Road border, Tagore Nagar" }
  ],

  // ── 302022: Sitapura RIICO / JECC / Mahatma Gandhi Hospital / Bilwa ──
  "302022": [
    { zone: "North-West", anchor: "Sitapura Gate No. 1 / JECC", coverage: "Sitapura Industrial Area Gate No. 1, JECC Exhibition Centre, EPIP Zone" },
    { zone: "North-East", anchor: "Mahatma Gandhi Hospital", coverage: "Mahatma Gandhi Medical College & Hospital, JECRC University, ISI-1 RIICO" },
    { zone: "South-West", anchor: "Sitapura Phase 3 & 4", coverage: "RIICO Phase 3 & 4, Apparel Park, Gems & Jewellery SEZ" },
    { zone: "South-East", anchor: "India Gate / Tonk Road", coverage: "India Gate Sitapura, Bilwa, Goner Road junction, Ring Road Sitapura" }
  ],

  // ── 302023: Sanganer Town / Sanganer Bazar / Kagzi Mohalla / Diggi Road ──
  "302023": [
    { zone: "North-West", anchor: "Sanganer Flyover", coverage: "Sanganer Flyover, Muhana Mandi Road entry, Chauraha Sanganer" },
    { zone: "North-East", anchor: "Sanganer Main Bazar", coverage: "Sanganer Bazar, Sanganer Police Station, Block Print Markets" },
    { zone: "South-West", anchor: "Kagzi Mohalla", coverage: "Kagzi Mohalla (Handmade paper hub), Jain Temple Sanganer" },
    { zone: "South-East", anchor: "Diggi Malpura Road / Stadium", coverage: "Diggi Malpura Road, Sanganer Stadium, Cheeda Market" }
  ],

  // ── 302024: Khatipura West / Sirsi Road / Kanakpura / Meena Wala ──
  "302024": [
    { zone: "North-West", anchor: "Sirsi Road / Kanakpura", coverage: "Sirsi Road, Kanakpura Railway Station, Mundia Rampura border" },
    { zone: "North-East", anchor: "Khatipura Chauraha", coverage: "Khatipura Chauraha, Officers Campus, Sirsi Road entry" },
    { zone: "South-West", anchor: "Meena Wala / Sirsi Village", coverage: "Meena Wala, Sirsi Village approach, Narayan Vihar West" },
    { zone: "South-East", anchor: "Panchyawala", coverage: "Panchyawala, Vaishali Nagar Extension, Gandhi Path West" }
  ],

  // ── 302025: Jagatpura / Model Town / NRI Colony / SKIT / Akshay Patra ──
  "302025": [
    { zone: "North-West", anchor: "Jagatpura Flyover / Station", coverage: "Jagatpura Flyover, Jagatpura Railway Station, Model Town" },
    { zone: "North-East", anchor: "7 Number Bus Stand", coverage: "7 Number Bus Stand, Indira Gandhi Nagar, Sector 1-5 Jagatpura" },
    { zone: "South-West", anchor: "SKIT College / Akshay Patra", coverage: "SKIT Engineering College, Ramnagariya, Akshay Patra Temple" },
    { zone: "South-East", anchor: "Mahal Road / NRI Colony", coverage: "Mahal Road, Gyan Vihar University, NRI Colony Jagatpura, Bombay Hospital site" }
  ],

  // ── 302026: Bhankrota / Mahapura / Ajmer Expressway / DPS School ──
  "302026": [
    { zone: "North-West", anchor: "Bhankrota Chauraha", coverage: "Bhankrota Chauraha, Ajmer Expressway (NH-48), Chimanpura" },
    { zone: "North-East", anchor: "Jaisinghpura / DPS", coverage: "Jaisinghpura, DPS School, Narayan Vihar Extension" },
    { zone: "South-West", anchor: "Mahapura / Omaxe City", coverage: "Mahapura, Omaxe City approach, Ajmer Road Toll plaza" },
    { zone: "South-East", anchor: "Bad Ke Balaji / Ring Road", coverage: "Bad Ke Balaji, Ring Road Bhankrota cloverleaf, Kalwara link" }
  ],

  // ── 302027: Jaisinghpura Khor / Lalwas / CRPF / Delhi Road East ──
  "302027": [
    { zone: "North-West", anchor: "Jaisinghpura Khor", coverage: "Jaisinghpura Khor main market, Amber foothills east" },
    { zone: "North-East", anchor: "CRPF Campus Lalwas", coverage: "CRPF Campus Lalwas, Jamwa Ramgarh Road" },
    { zone: "South-West", anchor: "Saipura / Rahori", coverage: "Saipura, Rahori, Indergarh" },
    { zone: "South-East", anchor: "Langariyawas / Saiwar", coverage: "Langariyawas, Saiwar, Roopwas, Delhi Highway connector" }
  ],

  // ── 302028: Amer Town / Amber Fort / Delhi Highway North ──
  "302028": [
    { zone: "North-West", anchor: "Amber Palace / Maota Lake", coverage: "Amber Fort, Maota Lake, Jaigarh, Kheri Gate" },
    { zone: "North-East", anchor: "Delhi Highway / Kunda", coverage: "Delhi Highway (NH-48), Kunda Amer, Kukas approach" },
    { zone: "South-West", anchor: "Amer Town Main Bazar", coverage: "Amer Town, Jagat Shiromani Mandir, Hathi Gaon" },
    { zone: "South-East", anchor: "Nangal Soosawatan / Natata", coverage: "Nangal Soosawatan, Natata, Aravalli ridge" }
  ],

  // ── 302029: Sanganer Airport / Terminal 1 & 2 / Airport Cargo / Muhana ──
  "302029": [
    { zone: "North-West", anchor: "Airport Terminal 2", coverage: "Jaipur International Airport Terminal 2, Jawahar Circle South" },
    { zone: "North-East", anchor: "Airport Cargo / Jagatpura Link", coverage: "Airport Cargo Complex, Jagatpura link road" },
    { zone: "South-West", anchor: "Airport Terminal 1 / Old Airport", coverage: "Terminal 1 (Hajj Terminal), Old Airport Road, Sanganer Town" },
    { zone: "South-East", anchor: "Tonk Road Airport Crossing", coverage: "Tonk Road Airport Crossing, Cheelgadi Restaurant, Flyover" }
  ],

  // ── 302030: Bagru / Bagru Industrial Area / Ajmer Highway ──
  "302030": [
    { zone: "North-West", anchor: "Bagru Chhipa Mohalla", coverage: "Bagru Chhipa Mohalla, Handblock Print Hub" },
    { zone: "North-East", anchor: "Bagru Industrial Area", coverage: "Bagru Industrial Area Phase 1 & 2, RIICO" },
    { zone: "South-West", anchor: "Mahindra World City Link", coverage: "Mahindra World City Link, Bagru Bypass" },
    { zone: "South-East", anchor: "Ajmer Road Toll Plaza", coverage: "Ajmer Road Toll Plaza, Bagru Town Centre" }
  ],

  // ── 302031: Jamdoli / Luniawas / Agra Road NH-21 Corridor ──
  "302031": [
    { zone: "North-West", anchor: "Jamdoli Chauraha", coverage: "Jamdoli Chauraha, JECRC Medical / Keshav Vidyapeeth" },
    { zone: "North-East", anchor: "Agra Road NH-21 Corridor", coverage: "Agra Road Highway, Kanota approach, Sumel" },
    { zone: "South-West", anchor: "Sisodia Rani Ka Bagh", coverage: "Sisodia Rani Ka Bagh, Ghat Ki Guni East, Vidyadhar Ka Bagh" },
    { zone: "South-East", anchor: "Luniawas / Goner Link", coverage: "Luniawas, Goner link road, Ring Road Agra Road node" }
  ],

  // ── 302032: C-Scheme / Statue Circle / Ashok Nagar / Secretariat ──
  "302032": [
    { zone: "North-West", anchor: "Ahinsa Circle / Ashok Nagar", coverage: "Ahinsa Circle, Ashok Nagar, St. Xavier's School" },
    { zone: "North-East", anchor: "Statue Circle", coverage: "Statue Circle, Bhagwan Das Road, Secretariat North" },
    { zone: "South-West", anchor: "Subhash Marg", coverage: "Subhash Marg, C-Scheme Post Office, Jamnalal Bajaj Marg" },
    { zone: "South-East", anchor: "Government Secretariat", coverage: "Government Secretariat, Raj Bhawan East, SMS Hospital North" }
  ],

  // ── 302033: Pratap Nagar Housing Board (Sectors 1-28) / Haldi Ghati / Kumbha Marg ──
  "302033": [
    { zone: "North-West", anchor: "Pratap Nagar Sector 1-5", coverage: "Sectors 1-5, Tonk Road, Sanganer Border, Chhatrapati Nagar" },
    { zone: "North-East", anchor: "Haldi Ghati Marg / Sector 8-11", coverage: "Haldi Ghati Marg, Sector 8-11, India Gate, Coaching Hub Phase 1" },
    { zone: "South-West", anchor: "Kumbha Marg / Sector 16-22", coverage: "Kumbha Marg, Sector 16-22, Sheopur, Pratap Nagar Hospital" },
    { zone: "South-East", anchor: "NRI Colony / Sector 26-28", coverage: "NRI Colony Pratap Nagar, Sectors 26-28, Ring Road Pratap Nagar exit" }
  ],

  // ── 302034: Panchyawala / Sirsi Road Extension / Meena Wala ──
  "302034": [
    { zone: "North-West", anchor: "Sirsi Road Extension", coverage: "Sirsi Road, Kanakpura border, Harsh Vihar" },
    { zone: "North-East", anchor: "Panchyawala Main Market", coverage: "Panchyawala Main Market, Officers Campus West" },
    { zone: "South-West", anchor: "Meena Wala / Gandhi Path", coverage: "Meena Wala, Gandhi Path West extension, Royal City" },
    { zone: "South-East", anchor: "Chitrakoot West Border", coverage: "Chitrakoot West Border, Vaishali Nagar extension" }
  ],

  // ── 302037: Mahindra World City SEZ / Ajmer Road ──
  "302037": [
    { zone: "North-West", anchor: "MWC IT SEZ Gate 1", coverage: "Infosys, Wipro, MWC IT Park Zone" },
    { zone: "North-East", anchor: "MWC Main Entrance", coverage: "Ajmer Road Highway entrance, Commercial Centre" },
    { zone: "South-West", anchor: "MWC DTA / Industrial", coverage: "Domestic Tariff Area, JCB Plant, Deutsche Bank campus" },
    { zone: "South-East", anchor: "Mahindra Bloomdale", coverage: "Bloomdale, Origins, Kalwara Village approach" }
  ],

  // ── 302038: Kukas / Amity / Delhi Highway Institutional ──
  "302038": [
    { zone: "North-West", anchor: "Amity University Campus", coverage: "Amity University, RIICO Kukas Phase 1" },
    { zone: "North-East", anchor: "Delhi Highway / Kukas Chowk", coverage: "Delhi Highway (NH-48), Kukas Main Market, Le Meridien" },
    { zone: "South-West", anchor: "RIICO Industrial Area Kukas", coverage: "RIICO Industrial Area Phase 2, Arya College Kukas" },
    { zone: "South-East", anchor: "Dhand / Kookas Village", coverage: "Dhand, Toda Meena, Bilod, Basna" }
  ],

  // ── 302039: Vidhyadhar Nagar (Central Spine) / Ambabari / Murlipura ──
  "302039": [
    { zone: "North-West", anchor: "Vidhyadhar Nagar Central Spine", coverage: "Central Spine, Sectors 1-4, Utsav Marg, National Handloom VDN" },
    { zone: "North-East", anchor: "Ambabari / Sikar Road", coverage: "Ambabari, Sikar Road (Dher Ke Balaji), Kedia Palace" },
    { zone: "South-West", anchor: "Murlipura Scheme", coverage: "Murlipura Scheme, Vikas Nagar, Shiv Nagar" },
    { zone: "South-East", anchor: "Dadi Ka Phatak / Alka Cinema", coverage: "Dadi Ka Phatak, Alka Cinema, Road No. 1 Sikar Road" }
  ],

  // ── 302041: Dhankya / Bindayaka Industrial Area / Mundia Rampura / Sirsi West ──
  "302041": [
    { zone: "North-West", anchor: "Dhankya Village / Station", coverage: "Dhankya Village, Dhankya Railway Station, Kalwar Link" },
    { zone: "North-East", anchor: "Bindayaka Industrial Area", coverage: "Bindayaka Industrial Area (RIICO), Sirsi Road" },
    { zone: "South-West", anchor: "Mundia Rampura / Bichpari", coverage: "Mundia Rampura, Bichpari, Ajmer Road link" },
    { zone: "South-East", anchor: "Vaayu Vihar / Raj Water Park", coverage: "Vaayu Vihar, Raj Water Park approach, Sirsi West" }
  ],

  // ── 302042: Bad Ke Balaji / Ajmer Road / Thikariya ──
  "302042": [
    { zone: "North-West", anchor: "Bad Ke Balaji Temple", coverage: "Bad Ke Balaji Temple, Ajmer Road Highway" },
    { zone: "North-East", anchor: "Bhankrota Western Border", coverage: "Bhankrota western border, DPS link" },
    { zone: "South-West", anchor: "Ajmer Road / Toll approach", coverage: "Ajmer Road, Thikariya border" },
    { zone: "South-East", anchor: "Ring Road Cloverleaf", coverage: "Ring Road Ajmer Road interchange" }
  ],

  // ── 302044: Govindpura / Kalwar Road / Hathoj ──
  "302044": [
    { zone: "North-West", anchor: "Kalwar Road Highway", coverage: "Kalwar Road Highway, Hathoj approach" },
    { zone: "North-East", anchor: "Govindpura Village", coverage: "Govindpura, Jhotwara extension" },
    { zone: "South-West", anchor: "Pachar Link Road", coverage: "Pachar road, Kalwar village link" },
    { zone: "South-East", anchor: "Gokulpura Border", coverage: "Gokulpura, Jhotwara border" }
  ],

  // ── 302047: Mansarovar Extension / Dholai / Patrakar Colony ──
  "302047": [
    { zone: "North-West", anchor: "Patrakar Colony", coverage: "Patrakar Colony, Mansarovar Sector 12 Extension" },
    { zone: "North-East", anchor: "Dholai / Vijay Path Extension", coverage: "Dholai, Vijay Path Extension, New Sanganer Road link" },
    { zone: "South-West", anchor: "Muhana Mandi Road approach", coverage: "Muhana Mandi Road, Keshav Nagar" },
    { zone: "South-East", anchor: "Vande Mataram Circle", coverage: "Vande Mataram Marg, Mansarovar Extension South" }
  ],

  // ── 302048: Sun City / Sikar Road / Harmada Extension ──
  "302048": [
    { zone: "North-West", anchor: "Sun City Main Gate", coverage: "Sun City Township, Sikar Highway NH-52" },
    { zone: "North-East", anchor: "Harmada Ghati North", coverage: "Harmada Ghati, Foothills, Bypass link" },
    { zone: "South-West", anchor: "Sikar Road Chauraha", coverage: "Sikar Road, VKIA Road No. 14 North" },
    { zone: "South-East", anchor: "Nehrugram", coverage: "Nehrugram, Sarna Doongar approach" }
  ],

  // ── 302049: Amber Road / Zorawar Singh Gate / Jal Mahal ──
  "302049": [
    { zone: "North-West", anchor: "Kanak Vrindavan / Amber Road", coverage: "Kanak Vrindavan, Amber Palace approach" },
    { zone: "North-East", anchor: "Jal Mahal / Man Sagar", coverage: "Jal Mahal Lake, Govind Nagar, Parshuram Dwara" },
    { zone: "South-West", anchor: "Zorawar Singh Gate", coverage: "Zorawar Singh Gate, City Palace North, Subhash Chowk" },
    { zone: "South-East", anchor: "Ramgarh Mod", coverage: "Ramgarh Mod, Jamwa Ramgarh Road start, Brahmapuri" }
  ]
};

/**
 * Helper to fetch verified quadrants for a given PIN code.
 */
export function getVerifiedQuadrants(pincode: string): QuadrantDefinition[] | null {
  return JAIPUR_VERIFIED_QUADRANTS[pincode.trim()] || null;
}
