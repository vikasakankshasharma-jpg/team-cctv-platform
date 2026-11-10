/**
 * @file lib/whatsapp/conversational-i18n.ts
 * @description Layman, Human-Touch Multilingual Conversational Engine for TEAM CCTV WhatsApp.
 * Supports all 11 recognized Indian languages with warm colloquial expressions,
 * avoiding rigid textbook/jargon terms and providing natural conversational flow.
 */

import { LocaleCode, ALL_11_LANGUAGES } from "../i18n/mapping";

export interface ConversationalStrings {
  langConfirmed: string;
  propHeader: string;
  propQuestion: string;
  propHomeTitle: string;
  propOfficeTitle: string;
  propFactoryTitle: string;
  installHeader: string;
  installWiredTitle: string;
  installWiredDesc: string;
  installWirelessTitle: string;
  installWirelessDesc: string;
  install4gTitle: string;
  install4gDesc: string;
  installAddonTitle: string;
  installAddonDesc: string;
  outdoorHeader: string;
  outdoorQuestion: string;
  indoorHeader: string;
  indoorQuestion: string;
  numberReplyHint: string;
  quickBtnBullets: string;
  quickBtnDomes: string;
  quickBtnNone: string;
  quickBtnDoneProceed: string;
  quickBtnChangeQty: string;
  storageHeader: string;
  storageQuestion: string;
  cablingHeader: string;
  pincodeHeader: string;
  pincodeQuestion: string;
  nameHeader: string;
  nameQuestion: string;
  allInclusiveTag: string;
  dualSetupValue: string;
  dualSetupPro: string;
}

export const CONVERSATIONAL_PROMPTS: Record<LocaleCode, ConversationalStrings> = {
  // 1. English
  en: {
    langConfirmed: "✓ Language set to: *English* 🇮🇳\n\nLet's configure the perfect CCTV setup for your site:",
    propHeader: "Step 1 of 6: Property Type",
    propQuestion: "What type of property are you securing?",
    propHomeTitle: "🏠 Home / Flat",
    propOfficeTitle: "🏢 Office / Shop",
    propFactoryTitle: "🏭 Factory / Farm",
    installHeader: "Step 1 of 6: Installation Type",
    installWiredTitle: "✨ New Wired Setup",
    installWiredDesc: "Central DVR/NVR with dedicated copper cabling. Zero signal drop.",
    installWirelessTitle: "📶 Smart Wireless CCTV",
    installWirelessDesc: "Zero video cabling. 360° Pan-Tilt & live mobile phone viewing.",
    install4gTitle: "📡 4G SIM / Solar Cam",
    install4gDesc: "No Wi-Fi needed. Ideal for farmhouses, empty plots & remote gates.",
    installAddonTitle: "⬆️ Add Existing System",
    installAddonDesc: "Expansion / upgrade with compatibility guarantee.",
    outdoorHeader: "Step 2 of 6: Outdoor Cameras 🌧️",
    outdoorQuestion: "How many Weatherproof Bullet Cameras do you need mounted outside for your main gate, driveway, parking, or boundary walls?",
    indoorHeader: "Step 2 of 6: Indoor Cameras 🏠",
    indoorQuestion: "How many Compact Ceiling Dome Cameras do you need mounted inside for your living room, corridors, office, or cashier counters?",
    numberReplyHint: "👉 Reply with any number (0 to 32) or tap below:",
    quickBtnBullets: "Bullets",
    quickBtnDomes: "Domes",
    quickBtnNone: "0 (None)",
    quickBtnDoneProceed: "✅ Done (Proceed)",
    quickBtnChangeQty: "✏️ Change Qty",
    storageHeader: "Step 3 of 6: Recording & Storage Backup 💾",
    storageQuestion: "How long do you want to keep recorded video stored?",
    cablingHeader: "Step 4 of 6: Cabling & Surface",
    pincodeHeader: "Step 6 of 6: Site Location & Pincode Dispatch 📍",
    pincodeQuestion: "Please enter your 6-digit Indian Pincode (e.g. 302012) or tap 📎 to share Location Pin:",
    nameHeader: "Final Step: Customer Name 👤",
    nameQuestion: "Please reply with your full name (for your official GST quotation PDF & 1-Year Free Doorstep Warranty Certificate):",
    allInclusiveTag: "All prices include: Cameras, DVR/NVR, Storage, Cables, Connectors, Installation Labor & 18% GST (Zero Hidden Costs!)",
    dualSetupValue: "Value Tier (HD Analog DVR - Lowest Price Guarantee)",
    dualSetupPro: "Pro Tier (Digital IP NVR & PoE - Best 4K Quality)",
  },

  // 2. Hindi (हिन्दी) - Warm, conversational Hinglish/Hindi
  hi: {
    langConfirmed: "✓ भाषा सेट की गई: *हिन्दी (Hindi)* 🇮🇳\n\nआइए आपके लिए सही सीसीटीवी सेटअप तैयार करते हैं:",
    propHeader: "स्टेप 1/6: प्रॉपर्टी का प्रकार चुनें",
    propQuestion: "आप किस प्रकार की जगह के लिए कैमरे लगवाना चाहते हैं?",
    propHomeTitle: "🏠 घर / फ्लैट (Home)",
    propOfficeTitle: "🏢 दुकान / ऑफिस (Shop)",
    propFactoryTitle: "🏭 फैक्ट्री / फार्म (Factory)",
    installHeader: "स्टेप 1/6: फिटिंग का प्रकार (Setup Type)",
    installWiredTitle: "✨ नया वायर्ड सेटअप (Wired)",
    installWiredDesc: "DVR/NVR + प्योर कॉपर केबलिंग। लाइफटाइम मजबूत सिग्नल।",
    installWirelessTitle: "📶 स्मार्ट वाई-फाई कैमरा",
    installWirelessDesc: "बिना वीडियो केबलिंग। मोबाइल पर लाइव 360° व्यू और 2-वे टॉक।",
    install4gTitle: "📡 4G सिम / सोलर कैमरा",
    install4gDesc: "वाई-फाई की जरूरत नहीं। फार्महाउस और खाली प्लॉट के लिए बेस्ट।",
    installAddonTitle: "⬆️ पुराने सिस्टम में जोड़ें",
    installAddonDesc: "पहले से लगे DVR/NVR में नए कैमरे जोड़ने के लिए।",
    outdoorHeader: "स्टेप 2/6: बाहर के कैमरे (Outdoor Bullet) 🌧️",
    outdoorQuestion: "मेन गेट, पार्किंग, बाहर की दीवार या गली की निगरानी के लिए कितने वाटरप्रूफ बुलेट कैमरे चाहिए?",
    indoorHeader: "स्टेप 2/6: अंदर के कैमरे (Indoor Dome) 🏠",
    indoorQuestion: "कमरे, हॉल, कैश काउंटर, दुकान या ऑफिस के अंदर लगाने के लिए कितने सीलिंग डोम कैमरे चाहिए?",
    numberReplyHint: "👉 कोई भी संख्या (0 से 32) टाइप करें या नीचे बटन दबाएं:",
    quickBtnBullets: "बुलेट कैमरे",
    quickBtnDomes: "डोम कैमरे",
    quickBtnNone: "0 (कोई नहीं)",
    quickBtnDoneProceed: "✅ आगे बढ़ें",
    quickBtnChangeQty: "✏️ संख्या बदलें",
    storageHeader: "स्टेप 3/6: रिकॉर्डिंग और हार्ड डिस्क (Storage) 💾",
    storageQuestion: "कैमरों की पुरानी रिकॉर्डिंग कितने दिनों तक सुरक्षित रखनी है?",
    cablingHeader: "स्टेप 4/6: केबलिंग और फिटिंग",
    pincodeHeader: "स्टेप 6/6: आपका एरिया पिनकोड (Site Pincode) 📍",
    pincodeQuestion: "कृपया अपना 6-अंकों का पिनकोड दर्ज करें (जैसे 302012) या लोकेशन पिन 📎 भेजें:",
    nameHeader: "अंतिम स्टेप: आपका शुभ नाम 👤",
    nameQuestion: "कृपया अपना पूरा नाम लिखें (यह आपके पक्के GST बिल और 1 साल की फ्री ऑन-साइट वारंटी सर्टिफिकेट पर आएगा):",
    allInclusiveTag: "सभी कीमतों में शामिल हैं: कैमरे, DVR/NVR, हार्ड डिस्क, केबल, फिटिंग लेबर और 18% GST (कोई छुपा हुआ चार्ज नहीं!)",
    dualSetupValue: "वैल्यू सेटअप (HD एनालॉग - सबसे कम रेट गारंटी)",
    dualSetupPro: "प्रो सेटअप (डिजिटल IP & PoE - बेस्ट 4K क्लैरिटी)",
  },

  // 3. Marathi (मराठी)
  mr: {
    langConfirmed: "✓ भाषा निवडली: *मराठी (Marathi)* 🇮🇳\n\nचला, तुमच्या जागेसाठी योग्य सीसीटीव्ही सेटअप निवडूया:",
    propHeader: "पायरी 1/6: जागेचा प्रकार निवडा",
    propQuestion: "तुम्हाला कोणत्या जागेसाठी सीसीटीव्ही कॅमेरे लावायचे आहेत?",
    propHomeTitle: "🏠 घर / फ्लॅट (Home)",
    propOfficeTitle: "🏢 दुकान / ऑफिस (Shop)",
    propFactoryTitle: "🏭 फॅक्टरी / फार्म (Factory)",
    installHeader: "पायरी 1/6: इन्स्टॉलेशनचा प्रकार",
    installWiredTitle: "✨ नवीन वायर्ड सेटअप (Wired)",
    installWiredDesc: "DVR/NVR + कॉपर केबलिंग. सिग्नल अजिबात तुटत नाही.",
    installWirelessTitle: "📶 स्मार्ट वायरलेस सीसीटीव्ही",
    installWirelessDesc: "केबलची गरज नाही. मोबाईलवर लाईव्ह 360° व्ह्यू.",
    install4gTitle: "📡 4G सिम / सोलर कॅमेरा",
    install4gDesc: "फार्महाऊस आणि मोकळ्या जागेसाठी उत्तम.",
    installAddonTitle: "⬆️ जुन्या सिस्टीममध्ये जोडा",
    installAddonDesc: "विद्यमान सेटअपचा विस्तार / अपग्रेड.",
    outdoorHeader: "पायरी 2/6: बाहेरील कॅमेरे (Outdoor Bullet) 🌧️",
    outdoorQuestion: "मुख्य गेट, पार्किंग किंवा बाहेरील आवारासाठी किती वॉटरप्रूफ बुलेट कॅमेरे हवेत?",
    indoorHeader: "पायरी 2/6: आतील कॅमेरे (Indoor Dome) 🏠",
    indoorQuestion: "हॉल, खोल्या किंवा दुकानाच्या आत बसवण्यासाठी किती सीलिंग डोम कॅमेरे हवेत?",
    numberReplyHint: "👉 कोणताही नंबर (0 ते 32) टाईप करा किंवा खालील बटण दाबा:",
    quickBtnBullets: "बुलेट कॅमेरे",
    quickBtnDomes: "डोम कॅमेरे",
    quickBtnNone: "0 (काहीही नाही)",
    quickBtnDoneProceed: "✅ पुढे जा",
    quickBtnChangeQty: "✏️ संख्या बदला",
    storageHeader: "पायरी 3/6: रेकॉर्डिंग आणि स्टोरेज (Storage) 💾",
    storageQuestion: "व्हिडिओ रेकॉर्डिंग किती दिवस साठवून ठेवायचे आहे?",
    cablingHeader: "पायरी 4/6: केबलिंग व फिटिंग",
    pincodeHeader: "पायरी 6/6: तुमचा पिनकोड (Pincode) 📍",
    pincodeQuestion: "कृपया तुमचा 6-अंकी पिनकोड पाठवा (उदा. 400001) किंवा लोकेशन शेअर करा 📎:",
    nameHeader: "शेवटची पायरी: तुमचे पूर्ण नाव 👤",
    nameQuestion: "कृपया तुमचे पूर्ण नाव पाठवा (जीएसटी बिल आणि 1 वर्षाच्या ऑन-साइट वॉरंटीसाठी):",
    allInclusiveTag: "सर्व किमतींमध्ये कॅमेरे, DVR/NVR, हार्ड डिस्क, केबल, फिटिंग आणि 18% GST समाविष्ट आहे (झिरो हिडन कॉस्ट!)",
    dualSetupValue: "व्हॅल्यू सेटअप (HD Analog - सर्वात कमी किंमत)",
    dualSetupPro: "प्रो सेटअप (Digital IP NVR - सर्वोत्तम गुणवत्ता)",
  },

  // 4. Gujarati (ગુજરાતી)
  gu: {
    langConfirmed: "✓ ભાષા સેટ થઈ: *ગુજરાતી (Gujarati)* 🇮🇳\n\nચાલો તમારી જગ્યા માટે યોગ્ય સીસીટીવી સેટઅપ બનાવીએ:",
    propHeader: "પગલું 1/6: જગ્યાનો પ્રકાર પસંદ કરો",
    propQuestion: "તમે કઈ જગ્યા માટે કેમેરા લગાવવા માંગો છો?",
    propHomeTitle: "🏠 ઘર / ફ્લેટ (Home)",
    propOfficeTitle: "🏢 દુકાન / ઓફિસ (Shop)",
    propFactoryTitle: "🏭 ફેક્ટરી / વાડી (Factory)",
    installHeader: "પગલું 1/6: ફિટિંગનો પ્રકાર",
    installWiredTitle: "✨ નવું વાયર્ડ સેટઅપ (Wired)",
    installWiredDesc: "DVR/NVR + કોપર કેબલિંગ સાથે મજબૂત સિગ્નલ.",
    installWirelessTitle: "📶 સ્માર્ટ વાઇ-ફાઇ કેમેરા",
    installWirelessDesc: "કેબલ વગર. મોબાઈલ પર લાઈવ 360° વ્યૂ.",
    install4gTitle: "📡 4G સિમ / સોલાર કેમેરા",
    install4gDesc: "વાઇ-ફાઇ વગર ફાર્મહાઉસ અને વાડી માટે ઉત્તમ.",
    installAddonTitle: "⬆️ જૂની સિસ્ટમમાં ઉમેરો",
    installAddonDesc: "હાલના DVR માં નવા કેમેરા ઉમેરવા.",
    outdoorHeader: "પગલું 2/6: બહારના કેમેરા (Outdoor Bullet) 🌧️",
    outdoorQuestion: "મેઇન ગેટ, પાર્કિંગ કે કમ્પાઉન્ડ માટે કેટલા વોટરપ્રૂફ બુલેટ કેમેરા જોઈએ?",
    indoorHeader: "પગલું 2/6: અંદરના કેમેરા (Indoor Dome) 🏠",
    indoorQuestion: "રૂમ, હોલ કે દુકાનની અંદર ફિટ કરવા માટે કેટલા સીલિંગ ડોમ કેમેરા જોઈએ?",
    numberReplyHint: "👉 કોઈ પણ નંબર (0 થી 32) લખો અથવા નીચેનું બટન દબાવો:",
    quickBtnBullets: "બુલેટ કેમેરા",
    quickBtnDomes: "ડોમ કેમેરા",
    quickBtnNone: "0 (કોઈ નહીં)",
    quickBtnDoneProceed: "✅ આગળ વધો",
    quickBtnChangeQty: "✏️ સંખ્યા બદલો",
    storageHeader: "પગલું 3/6: રેકોર્ડિંગ અને સ્ટોરેજ 💾",
    storageQuestion: "રેકોર્ડિંગ કેટલા દિવસ સાચવી રાખવું છે?",
    cablingHeader: "પગલું 4/6: વાયરિંગ અને ફિટિંગ",
    pincodeHeader: "પગલું 6/6: તમારો પિનકોડ (Pincode) 📍",
    pincodeQuestion: "કૃપા કરીને તમારો 6 અંકનો પિનકોડ લખો (જેમ કે 380001) અથવા લોકેશન મોકલો 📎:",
    nameHeader: "છેલ્લું પગલું: તમારું પૂરું નામ 👤",
    nameQuestion: "કૃપા કરીને તમારું પૂરું નામ લખો (GST બિલ અને 1 વર્ષની ઓન-સાઇટ વોરંટી માટે):",
    allInclusiveTag: "બધા ભાવોમાં કેમેરા, DVR/NVR, હાર્ડ ડિસ્ક, વાયર, ફિટિંગ લેબર અને 18% GST સામેલ છે (કોઈ છુપો ચાર્જ નથી!)",
    dualSetupValue: "વેલ્યુ સેટઅપ (HD એનાલોગ - સૌથી સસ્તું ગેરંટી)",
    dualSetupPro: "પ્રો સેટઅપ (ડિજિટલ IP & PoE - બેસ્ટ 4K ક્વોલિટી)",
  },

  // 5. Tamil (தமிழ்)
  ta: {
    langConfirmed: "✓ மொழி தேர்ந்தெடுக்கப்பட்டது: *தமிழ் (Tamil)* 🇮🇳\n\nஉங்கள் இடத்திற்கான சிறந்த சிசிடிவி அமைப்பைத் தேர்ந்தெடுப்போம்:",
    propHeader: "படி 1/6: இடத்தின் வகை",
    propQuestion: "எந்த இடத்திற்கு சிசிடிவி கேமரா பொருத்த வேண்டும்?",
    propHomeTitle: "🏠 வீடு / பிளாட் (Home)",
    propOfficeTitle: "🏢 கடை / அலுவலகம் (Shop)",
    propFactoryTitle: "🏭 தொழிற்சாலை / பண்ணை",
    installHeader: "படி 1/6: நிறுவல் வகை",
    installWiredTitle: "✨ புதிய ஒயர்டு அமைப்பு (Wired)",
    installWiredDesc: "DVR/NVR உடன் வலுவான செப்பு கேபிளிங்.",
    installWirelessTitle: "📶 ஸ்மார்ட் வயர்லெஸ் வைஃபை",
    installWirelessDesc: "கேபிள் தேவையில்லை. மொபைலில் நேரலை 360° காட்சி.",
    install4gTitle: "📡 4G சிம் / சோலார் கேமரா",
    install4gDesc: "வைஃபை இல்லாத பண்ணை மற்றும் தனி இடங்களுக்கு சிறந்தது.",
    installAddonTitle: "⬆️ பழைய அமைப்பில் சேர்க்க",
    installAddonDesc: "தற்போதுள்ள அமைப்பில் கூடுதல் கேமராக்கள்.",
    outdoorHeader: "படி 2/6: வெளிப்புற கேமராக்கள் (Outdoor) 🌧️",
    outdoorQuestion: "முக்கிய வாசல் மற்றும் பார்க்கிங் பகுதிக்கு எத்தனை வாட்டர்ப்ரூப் புல்லட் கேமராக்கள் வேண்டும்?",
    indoorHeader: "படி 2/6: உட்புற கேமராக்கள் (Indoor) 🏠",
    indoorQuestion: "அறை அல்லது கடைக்குள் பொருத்த எத்தனை சீலிங் டோம் கேமராக்கள் வேண்டும்?",
    numberReplyHint: "👉 ஏதேனும் எண்ணை (0 முதல் 32 வரை) தட்டச்சு செய்யவும் அல்லது கீழே தொடவும்:",
    quickBtnBullets: "புல்லட் கேமரா",
    quickBtnDomes: "டோம் கேமரா",
    quickBtnNone: "0 (எதுவும் இல்லை)",
    quickBtnDoneProceed: "✅ தொடரவும்",
    quickBtnChangeQty: "✏️ மாற்றவும்",
    storageHeader: "படி 3/6: பதிவு நாட்கள் (Storage) 💾",
    storageQuestion: "வீடியோ பதிவுகளை எத்தனை நாட்கள் சேமிக்க வேண்டும்?",
    cablingHeader: "படி 4/6: கேபிளிங் & பொருத்துதல்",
    pincodeHeader: "படி 6/6: உங்கள் பின்கோடு (Pincode) 📍",
    pincodeQuestion: "தயவுசெய்து உங்கள் 6 இலக்க பின்கோடை உள்ளிடவும் (எ.கா. 600001):",
    nameHeader: "இறுதி படி: உங்கள் முழு பெயர் 👤",
    nameQuestion: "உங்கள் முழு பெயரை உள்ளிடவும் (ஜிஎஸ்டி பில் மற்றும் 1 ஆண்டு வாரண்டிக்காக):",
    allInclusiveTag: "கேமராக்கள், DVR/NVR, ஹார்ட் டிஸ்க், கேபிள், பொருத்துதல் கூலி மற்றும் 18% GST அனைத்தும் அடங்கும் (மறைமுக கட்டணம் இல்லை!)",
    dualSetupValue: "வேல்யூ அமைப்பு (HD அனலாக் - குறைந்த விலை உத்தரவாதம்)",
    dualSetupPro: "ப்ரோ அமைப்பு (டிஜிட்டல் IP - சிறந்த தரம்)",
  },

  // 6. Telugu (తెలుగు)
  te: {
    langConfirmed: "✓ భాష సెట్ చేయబడింది: *తెలుగు (Telugu)* 🇮🇳\n\nమీ సైట్ కోసం సరైన సీసీటీవీ సెటప్‌ను సిద్ధం చేద్దాం:",
    propHeader: "దశ 1/6: ప్రాపర్టీ రకం",
    propQuestion: "మీరు ఏ ప్రదేశానికి సీసీటీవీ అమర్చాలనుకుంటున్నారు?",
    propHomeTitle: "🏠 ఇల్లు / ఫ్లాట్ (Home)",
    propOfficeTitle: "🏢 షాప్ / ఆఫీస్ (Shop)",
    propFactoryTitle: "🏭 ఫ్యాక్టరీ / ఫార్మ్",
    installHeader: "దశ 1/6: ఇన్‌స్టాలేషన్ రకం",
    installWiredTitle: "✨ కొత్త వైర్డ్ సెటప్ (Wired)",
    installWiredDesc: "DVR/NVR + కాపర్ కేబులింగ్. సిగ్నల్ సమస్యలు ఉండవు.",
    installWirelessTitle: "📶 స్మార్ట్ వైర్‌లెస్ వై-ఫై",
    installWirelessDesc: "కేబుల్ అవసరం లేదు. మొబైల్‌లో లైవ్ 360° వీక్షణ.",
    install4gTitle: "📡 4G సిమ్ / సోలార్ కెమెరా",
    install4gDesc: "వై-ఫై లేని ఫార్మ్‌హౌస్‌లకు ఉత్తమమైనది.",
    installAddonTitle: "⬆️ పాత సిస్టమ్‌కి జోడించండి",
    installAddonDesc: "ఉన్న రికార్డర్‌కు అదనపు కెమెరాలు.",
    outdoorHeader: "దశ 2/6: అవుట్‌డోర్ కెమెరాలు 🌧️",
    outdoorQuestion: "మెయిన్ గేట్, పార్కింగ్ కోసం ఎన్ని వాటర్‌ప్రూఫ్ బుల్లెట్ కెమెరాలు కావాలి?",
    indoorHeader: "దశ 2/6: ఇండోర్ కెమెరాలు 🏠",
    indoorQuestion: "గదులు, హాల్ లేదా షాప్ లోపల అమర్చడానికి ఎన్ని సీలింగ్ డోమ్ కెమెరాలు కావాలి?",
    numberReplyHint: "👉 ఏదైనా సంఖ్యను (0 నుండి 32) టైప్ చేయండి లేదా క్రింద నొక్కండి:",
    quickBtnBullets: "బుల్లెట్ కెమెరాలు",
    quickBtnDomes: "డోమ్ కెమెరాలు",
    quickBtnNone: "0 (ఏమీ లేదు)",
    quickBtnDoneProceed: "✅ కొనసాగించండి",
    quickBtnChangeQty: "✏️ మార్చండి",
    storageHeader: "దశ 3/6: స్టోరేజ్ & రికార్డింగ్ రోజులు 💾",
    storageQuestion: "రికార్డింగ్ ఎన్ని రోజులు నిల్వ ఉండాలి?",
    cablingHeader: "దశ 4/6: కేబులింగ్ & ఫిట్టింగ్",
    pincodeHeader: "దశ 6/6: మీ పిన్‌కోడ్ (Pincode) 📍",
    pincodeQuestion: "దయచేసి మీ 6 అంకెల పిన్‌కోడ్‌ను నమోదు చేయండి (ఉదా: 500001):",
    nameHeader: "చివరి దశ: మీ పూర్తి పేరు 👤",
    nameQuestion: "దయచేసి మీ పూర్తి పేరును పంపండి (GST బిల్లు మరియు 1 సంవత్సరం వారంటీ కోసం):",
    allInclusiveTag: "కెమెరాలు, DVR/NVR, హార్డ్ డిస్క్, వైరింగ్, ఫిట్టింగ్ మరియు 18% GST అన్నీ ఉన్నాయి (ఎలాంటి అదనపు ఛార్జీలు లేవు!)",
    dualSetupValue: "వాల్యూ సెటప్ (HD అనలాగ్ - అతి తక్కువ ధర)",
    dualSetupPro: "ప్రో సెటప్ (డిజిటల్ IP & PoE - ఉత్తమ నాణ్యత)",
  },

  // 7. Kannada (ಕನ್ನಡ)
  kn: {
    langConfirmed: "✓ ಭಾಷೆ ಆಯ್ಕೆಯಾಗಿದೆ: *ಕನ್ನಡ (Kannada)* 🇮🇳\n\nನಿಮ್ಮ ಜಾಗಕ್ಕೆ ಸೂಕ್ತವಾದ ಸಿಸಿಟಿವಿ ಸೆಟಪ್ ಆಯ್ಕೆ ಮಾಡೋಣ:",
    propHeader: "ಹಂತ 1/6: ಸ್ಥಳದ ಪ್ರಕಾರ",
    propQuestion: "ಯಾವ ಸ್ಥಳಕ್ಕಾಗಿ ನೀವು ಸಿಸಿಟಿವಿ ಅಳವಡಿಸಲು ಬಯಸುತ್ತೀರಿ?",
    propHomeTitle: "🏠 ಮನೆ / ಫ್ಲಾಟ್ (Home)",
    propOfficeTitle: "🏢 ಅಂಗಡಿ / ಕಚೇರಿ (Shop)",
    propFactoryTitle: "🏭 ಕಾರ್ಖಾನೆ / ಫಾರ್ಮ್",
    installHeader: "ಹಂತ 1/6: ಅನುಸ್ಥಾಪನೆಯ ಪ್ರಕಾರ",
    installWiredTitle: "✨ ಹೊಸ ವೈರ್ಡ್ ಸೆಟಪ್ (Wired)",
    installWiredDesc: "DVR/NVR + ತಾಮ್ರದ ಕೇಬಲ್. ಅತ್ಯುತ್ತಮ ಸಿಗ್ನಲ್.",
    installWirelessTitle: "📶 ಸ್ಮಾರ್ಟ್ ವೈರ್‌ಲೆಸ್ ಸಿಸಿಟಿವಿ",
    installWirelessDesc: "ಕೇಬಲ್ ಅಗತ್ಯವಿಲ್ಲ. ಮೊಬೈಲ್‌ನಲ್ಲಿ ಲೈವ್ 360° ವೀಕ್ಷಣೆ.",
    install4gTitle: "📡 4G ಸಿಮ್ / ಸೌರ ಕ್ಯಾಮೆರಾ",
    install4gDesc: "ವೈ-ಫೈ ಇಲ್ಲದ ತೋಟದ ಮನೆಗಳಿಗೆ ಸೂಕ್ತ.",
    installAddonTitle: "⬆️ ಹಳೆಯ ಸಿಸ್ಟಮ್‌ಗೆ ಸೇರಿಸಿ",
    installAddonDesc: "ಈಗಿರುವ DVR ಗೆ ಹೊಸ ಕ್ಯಾಮೆರಾಗಳು.",
    outdoorHeader: "ಹಂತ 2/6: ಹೊರಗಿನ ಕ್ಯಾಮೆರಾಗಳು (Outdoor) 🌧️",
    outdoorQuestion: "ಮುಖ್ಯ ಗೇಟ್, ಪಾರ್ಕಿಂಗ್‌ಗಾಗಿ ಎಷ್ಟು ವಾಟರ್‌ಪ್ರೂಫ್ ಬುಲೆಟ್ ಕ್ಯಾಮೆರಾಗಳು ಬೇಕು?",
    indoorHeader: "ಹಂತ 2/6: ಒಳಗಿನ ಕ್ಯಾಮೆರಾಗಳು (Indoor) 🏠",
    indoorQuestion: "ಕೋಣೆ, ಹಾಲ್ ಅಥವಾ ಅಂಗಡಿಯೊಳಗೆ ಅಳವಡಿಸಲು ಎಷ್ಟು ಸೀಲಿಂಗ್ ಡೋಮ್ ಕ್ಯಾಮೆರಾಗಳು ಬೇಕು?",
    numberReplyHint: "👉 ಯಾವುದೇ ಸಂಖ್ಯೆಯನ್ನು (0 ರಿಂದ 32) ಟೈಪ್ ಮಾಡಿ ಅಥವಾ ಕೆಳಗೆ ಒತ್ತಿರಿ:",
    quickBtnBullets: "ಬುಲೆಟ್ ಕ್ಯಾಮೆರಾ",
    quickBtnDomes: "ಡೋಮ್ ಕ್ಯಾಮೆರಾ",
    quickBtnNone: "0 (ಯಾವುದೂ ಇಲ್ಲ)",
    quickBtnDoneProceed: "✅ ಮುಂದುವರಿಯಿರಿ",
    quickBtnChangeQty: "✏️ ಬದಲಾಯಿಸಿ",
    storageHeader: "ಹಂತ 3/6: ರೆಕಾರ್ಡಿಂಗ್ ಮತ್ತು ಸಂಗ್ರಹಣೆ 💾",
    storageQuestion: "ರೆಕಾರ್ಡಿಂಗ್ ಎಷ್ಟು ದಿನಗಳವರೆಗೆ ಉಳಿಯಬೇಕು?",
    cablingHeader: "ಹಂತ 4/6: ಕೇಬಲ್ ಮತ್ತು ಫಿಟ್ಟಿಂಗ್",
    pincodeHeader: "ಹಂತ 6/6: ನಿಮ್ಮ ಪಿನ್‌ಕೋಡ್ (Pincode) 📍",
    pincodeQuestion: "ದಯವಿಟ್ಟು ನಿಮ್ಮ 6 ಅಂಕಿಗಳ ಪಿನ್‌ಕೋಡ್ ನಮೂದಿಸಿ (ಉದಾ: 560001):",
    nameHeader: "ಕೊನೆಯ ಹಂತ: ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರು 👤",
    nameQuestion: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ಪೂರ್ಣ ಹೆಸರನ್ನು ಬರೆಯಿರಿ (ಜಿಎಸ್‌ಟಿ ಬಿಲ್ ಮತ್ತು 1 ವರ್ಷದ ವಾರಂಟಿಗಾಗಿ):",
    allInclusiveTag: "ಕ್ಯಾಮೆರಾಗಳು, DVR/NVR, ಹಾರ್ಡ್ ಡಿಸ್ಕ್, ವೈರಿಂಗ್, ಇನ್‌ಸ್ಟಾಲೇಶನ್ ಮತ್ತು 18% GST ಎಲ್ಲವೂ ಒಳಗೊಂಡಿದೆ (ಯಾವುದೇ ಗುಪ್ತ ಶುಲ್ಕವಿಲ್ಲ!)",
    dualSetupValue: "ವ್ಯಾಲ್ಯೂ ಸೆಟಪ್ (HD ಅನಲಾಗ್ - ಕಡಿಮೆ ಬೆಲೆಯ ಭರವಸೆ)",
    dualSetupPro: "ಪ್ರೊ ಸೆಟಪ್ (ಡಿಜಿಟಲ್ IP - ಅತ್ಯುತ್ತಮ ಗುಣಮಟ್ಟ)",
  },

  // 8. Bengali (বাংলা)
  bn: {
    langConfirmed: "✓ ভাষা সেট করা হয়েছে: *বাংলা (Bengali)* 🇮🇳\n\nআসুন আপনার জায়গার জন্য সেরা সিসিটিভি সেটআপ বেছে নেওয়া যাক:",
    propHeader: "ধাপ ১/৬: জায়গার ধরন নির্বাচন করুন",
    propQuestion: "আপনি কোন জায়গার জন্য সিসিটিভি ক্যামেরা লাগাতে চান?",
    propHomeTitle: "🏠 বাড়ি / ফ্ল্যাট (Home)",
    propOfficeTitle: "🏢 দোকান / অফিস (Shop)",
    propFactoryTitle: "🏭 কারখানা / খামার (Factory)",
    installHeader: "ধাপ ১/৬: ইনস্টলেশনের ধরন",
    installWiredTitle: "✨ নতুন ওয়্যার্ড সেটআপ (Wired)",
    installWiredDesc: "DVR/NVR + কপার ক্যাবলিং সহ মজবুত সিগন্যাল।",
    installWirelessTitle: "📶 স্মার্ট ওয়্যারলেস সিসিটিভি",
    installWirelessDesc: "ভিডিও ক্যাবল ছাড়া। মোবাইলে সরাসরি ৩৬০° ভিউ।",
    install4gTitle: "📡 4G সিম / সোলার ক্যামেরা",
    install4gDesc: "ওয়াই-ফাই ছাড়া ফার্মহাউস ও দূরবর্তী স্থানের জন্য উপযুক্ত।",
    installAddonTitle: "⬆️ পুরানো সিস্টেমে যোগ করুন",
    installAddonDesc: "বিদ্যমান DVR এ অতিরিক্ত ক্যামেরা সংযোগ।",
    outdoorHeader: "ধাপ ২/৬: বাইরের ক্যামেরা (Outdoor Bullet) 🌧️",
    outdoorQuestion: "মেইন গেট বা পার্কিং এলাকার জন্য কতগুলি ওয়াটারপ্রুফ বুলেট ক্যামেরা লাগবে?",
    indoorHeader: "ধাপ ২/৬: ভেতরের ক্যামেরা (Indoor Dome) 🏠",
    indoorQuestion: "ঘর, হল বা দোকানের ভেতরে লাগানোর জন্য কতগুলি সিলিং ডোম ক্যামেরা লাগবে?",
    numberReplyHint: "👉 যেকোনো সংখ্যা (0 থেকে 32) টাইপ করুন বা নিচের বোতাম চাপুন:",
    quickBtnBullets: "বুলেট ক্যামেরা",
    quickBtnDomes: "ডোম ক্যামেরা",
    quickBtnNone: "0 (কিছুই না)",
    quickBtnDoneProceed: "✅ এগিয়ে যান",
    quickBtnChangeQty: "✏️ পরিবর্তন করুন",
    storageHeader: "ধাপ ৩/৬: রেকর্ডিং এবং স্টোরেজ 💾",
    storageQuestion: "ভিডিও রেকর্ডিং কত দিন পর্যন্ত সংরক্ষণ করতে চান?",
    cablingHeader: "ধাপ ৪/৬: ওয়্যারিং ও ফিটিং",
    pincodeHeader: "ধাপ ৬/৬: আপনার পিনকোড (Pincode) 📍",
    pincodeQuestion: "দয়া করে আপনার ৬ সংখ্যার পিনকোড লিখুন (যেমন: 700001):",
    nameHeader: "শেষ ধাপ: আপনার সম্পূর্ণ নাম 👤",
    nameQuestion: "দয়া করে আপনার পুরো নাম লিখুন (পাকা GST বিল এবং ১ বছরের ফ্রি অন-সাইট ওয়ারেন্টির জন্য):",
    allInclusiveTag: "ক্যামেরা, DVR/NVR, হার্ড ডিস্ক, ওয়্যার, ফিটিং লেবার এবং ১৮% GST সবই অন্তর্ভুক্ত (কোনো গোপন চার্জ নেই!)",
    dualSetupValue: "ভ্যালু সেটআপ (HD অ্যানালগ - সর্বনিম্ন মূল্যের গ্যারান্টি)",
    dualSetupPro: "প্রো সেটআপ (ডিজিটাল IP - সেরা স্পষ্টতা)",
  },

  // 9. Malayalam (മലയാളം)
  ml: {
    langConfirmed: "✓ ഭാഷ തിരഞ്ഞെടുത്തു: *മലയാളം (Malayalam)* 🇮🇳\n\nനിങ്ങളുടെ സ്ഥലത്തിനായി അനുയോജ്യമായ സിസിടിവി സെറ്റപ്പ് തിരഞ്ഞെടുക്കാം:",
    propHeader: "ഘട്ടം 1/6: സ്ഥലത്തിന്റെ തരം",
    propQuestion: "ഏത് സ്ഥലത്തേക്കാണ് സിസിടിവി ക്യാമറകൾ സ്ഥാപിക്കേണ്ടത്?",
    propHomeTitle: "🏠 വീട് / ഫ്ലാറ്റ് (Home)",
    propOfficeTitle: "🏢 ഷോപ്പ് / ഓഫീസ് (Shop)",
    propFactoryTitle: "🏭 ഫാക്ടറി / ഫാം (Factory)",
    installHeader: "ഘട്ടം 1/6: ഇൻസ്റ്റാളേഷൻ തരം",
    installWiredTitle: "✨ പുതിയ വയർഡ് സെറ്റപ്പ് (Wired)",
    installWiredDesc: "DVR/NVR + കോപ്പർ കേബിളിംഗ്. പൂർണ്ണ സിഗ്നൽ കരുത്ത്.",
    installWirelessTitle: "📶 സ്മാർട്ട് വയർലെസ്സ് വൈ-ഫൈ",
    installWirelessDesc: "കേബിളുകൾ ആവശ്യമില്ല. മൊബൈലിൽ ലൈവ് 360° കാഴ്ച.",
    install4gTitle: "📡 4G സിം / സോളാർ ക്യാമറ",
    install4gDesc: "വൈ-ഫൈ ഇല്ലാത്ത ഫാം ഹൗസുകൾക്ക് ഏറ്റവും അനുയോജ്യം.",
    installAddonTitle: "⬆️ പഴയ സിസ്റ്റത്തിലേക്ക് ചേർക്കുക",
    installAddonDesc: "നിലവിലുള്ള റിക്കോർഡറിലേക്ക് അധിക ക്യാമറകൾ.",
    outdoorHeader: "ഘട്ടം 2/6: ഔട്ട്ഡോർ ക്യാമറകൾ 🌧️",
    outdoorQuestion: "ഗേറ്റ്, പാർക്കിംഗ് ഏരിയകൾക്കായി എത്ര വാട്ടർപ്രൂഫ് ബുള്ളറ്റ് ക്യാമറകൾ വേണം?",
    indoorHeader: "ഘട്ടം 2/6: ഇൻഡോർ ക്യാമറകൾ 🏠",
    indoorQuestion: "മുറികൾ അല്ലെങ്കിൽ ഷോപ്പിനുള്ളിൽ സ്ഥാപിക്കാൻ എത്ര സീലിംഗ് ഡോം ക്യാമറകൾ വേണം?",
    numberReplyHint: "👉 ഏതെങ്കിലും നമ്പർ (0 മുതൽ 32 വരെ) ടൈപ്പ് ചെയ്യുക അല്ലെങ്കിൽ താഴെ അമർത്തുക:",
    quickBtnBullets: "ബുള്ളറ്റ് ക്യാമറ",
    quickBtnDomes: "ഡോം ക്യാമറ",
    quickBtnNone: "0 (ഒന്നുമില്ല)",
    quickBtnDoneProceed: "✅ തുടരുക",
    quickBtnChangeQty: "✏️ മാറ്റുക",
    storageHeader: "ഘട്ടം 3/6: റെക്കോർഡിംഗ് സൂക്ഷിക്കേണ്ട ദിവസങ്ങൾ 💾",
    storageQuestion: "റെക്കോർഡിംഗ് എത്ര ദിവസത്തേക്ക് സൂക്ഷിക്കണം?",
    cablingHeader: "ഘട്ടം 4/6: കേബിളിംഗും ഫിറ്റിംഗും",
    pincodeHeader: "ഘട്ടം 6/6: നിങ്ങളുടെ പിൻകോഡ് (Pincode) 📍",
    pincodeQuestion: "ദയവായി നിങ്ങളുടെ 6 അക്ക പിൻകോഡ് നൽകുക (ഉദാ: 682001):",
    nameHeader: "അവസാന ഘട്ടം: നിങ്ങളുടെ പൂർണ്ണമായ പേര് 👤",
    nameQuestion: "ദയവായി നിങ്ങളുടെ പൂർണ്ണമായ പേര് നൽകുക (GST ബില്ലിനും 1 വർഷത്തെ വാറന്റിക്കുമായി):",
    allInclusiveTag: "ക്യാമറകൾ, DVR/NVR, ഹാർഡ് ഡിസ്ക്, കേബിൾ, ഫിറ്റിംഗ് കൂലി, 18% GST എന്നിവയെല്ലാം ഉൾപ്പെടുന്നു (മറഞ്ഞിരിക്കുന്ന നിരക്കുകളില്ല!)",
    dualSetupValue: "വാല്യൂ സെറ്റപ്പ് (HD അനലോഗ് - കുറഞ്ഞ നിരക്ക് ഗ്യാരണ്ടി)",
    dualSetupPro: "പ്രോ സെറ്റപ്പ് (ഡിജിറ്റൽ IP - മികച്ച ഗുണനിലവാരം)",
  },

  // 10. Punjabi (ਪੰਜਾਬੀ)
  pa: {
    langConfirmed: "✓ ਭਾਸ਼ਾ ਸੈੱਟ ਕੀਤੀ ਗਈ: *ਪੰਜਾਬੀ (Punjabi)* 🇮🇳\n\nਆਓ ਤੁਹਾਡੇ ਘਰ ਜਾਂ ਦੁਕਾਨ ਲਈ ਸਭ ਤੋਂ ਵਧੀਆ ਸੀਸੀਟੀਵੀ ਸੈੱਟਅੱਪ ਚੁਣੀਏ:",
    propHeader: "ਕਦਮ 1/6: ਜਗ੍ਹਾ ਦੀ ਕਿਸਮ ਚੁਣੋ",
    propQuestion: "ਤੁਸੀਂ ਕਿਸ ਜਗ੍ਹਾ ਲਈ ਕੈਮਰੇ ਲਗਵਾਉਣੇ ਚਾਹੁੰਦੇ ਹੋ?",
    propHomeTitle: "🏠 ਘਰ / ਕੋਠੀ (Home)",
    propOfficeTitle: "🏢 ਦੁਕਾਨ / ਦਫ਼ਤਰ (Shop)",
    propFactoryTitle: "🏭 ਫ਼ੈਕਟਰੀ / ਫ਼ਾਰਮ (Factory)",
    installHeader: "ਕਦਮ 1/6: ਫਿਟਿੰਗ ਦੀ ਕਿਸਮ (Installation)",
    installWiredTitle: "✨ ਨਵਾਂ ਵਾਇਰਡ ਸੈੱਟਅੱਪ (Wired)",
    installWiredDesc: "DVR/NVR + ਪਿਓਰ ਕਾਪਰ ਕੇਬਲਿੰਗ। ਜ਼ੀਰੋ ਸਿਗਨਲ ਡਰਾਪ।",
    installWirelessTitle: "📶 ਸਮਾਰਟ ਵਾਈ-ਫਾਈ ਕੈਮਰਾ",
    installWirelessDesc: "ਬਿਨਾਂ ਕੇਬਲ ਦੇ। ਮੋਬਾਈਲ 'ਤੇ ਲਾਈਵ 360° ਦ੍ਰਿਸ਼।",
    install4gTitle: "📡 4G ਸਿਮ / ਸੋਲਰ ਕੈਮਰਾ",
    install4gDesc: "ਫਾਰਮ ਹਾਊਸ ਅਤੇ ਖੁੱਲ੍ਹੀਆਂ ਥਾਵਾਂ ਲਈ ਬਿਹਤਰੀਨ।",
    installAddonTitle: "⬆️ ਪੁਰਾਣੇ ਸਿਸਟਮ ਵਿੱਚ ਜੋੜੋ",
    installAddonDesc: "ਪਹਿਲਾਂ ਲੱਗੇ DVR ਵਿੱਚ ਨਵੇਂ ਕੈਮਰੇ ਵਧਾਉਣ ਲਈ।",
    outdoorHeader: "ਕਦਮ 2/6: ਬਾਹਰਲੇ ਕੈਮਰੇ (Outdoor Bullet) 🌧️",
    outdoorQuestion: "ਮੇਨ ਗੇਟ, ਪਾਰਕਿੰਗ ਜਾਂ ਬਾਹਰਲੀ ਕੰਧ ਲਈ ਕਿੰਨੇ ਵਾਟਰਪਰੂਫ ਬੁਲੇਟ ਕੈਮਰੇ ਚਾਹੀਦੇ ਹਨ?",
    indoorHeader: "ਕਦਮ 2/6: ਅੰਦਰਲੇ ਕੈਮਰੇ (Indoor Dome) 🏠",
    indoorQuestion: "ਕਮਰੇ, ਹਾਲ, ਕੈਸ਼ ਕਾਊਂਟਰ ਜਾਂ ਦੁਕਾਨ ਅੰਦਰ ਲਗਾਉਣ ਲਈ ਕਿੰਨੇ ਸੀਲਿੰਗ ਡੋਮ ਕੈਮਰੇ ਚਾਹੀਦੇ ਹਨ?",
    numberReplyHint: "👉 ਕੋਈ ਵੀ ਨੰਬਰ (0 ਤੋਂ 32) ਟਾਈਪ ਕਰੋ ਜਾਂ ਹੇਠਾਂ ਬਟਨ ਦਬਾਓ:",
    quickBtnBullets: "ਬੁਲੇਟ ਕੈਮਰੇ",
    quickBtnDomes: "ਡੋਮ ਕੈਮਰੇ",
    quickBtnNone: "0 (ਕੋਈ ਨਹੀਂ)",
    quickBtnDoneProceed: "✅ ਅੱਗੇ ਵਧੋ",
    quickBtnChangeQty: "✏️ ਗਿਣਤੀ ਬਦਲੋ",
    storageHeader: "ਕਦਮ 3/6: ਰਿਕਾਰਡਿੰਗ ਅਤੇ ਸਟੋਰੇਜ (Storage) 💾",
    storageQuestion: "ਪੁਰਾਣੀ ਰਿਕਾਰਡਿੰਗ ਕਿੰਨੇ ਦਿਨਾਂ ਤੱਕ ਸੁਰੱਖਿਅਤ ਰੱਖਣੀ ਹੈ?",
    cablingHeader: "ਕਦਮ 4/6: ਕੇਬਲਿੰਗ ਅਤੇ ਫਿਟਿੰਗ",
    pincodeHeader: "ਕਦਮ 6/6: ਤੁਹਾਡਾ ਪਿੰਨਕੋਡ (Pincode) 📍",
    pincodeQuestion: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ 6 ਅੰਕਾਂ ਦਾ ਪਿੰਨਕੋਡ ਲਿਖੋ (ਜਿਵੇਂ: 141001) ਜਾਂ ਲੋਕੇਸ਼ਨ ਭੇਜੋ 📎:",
    nameHeader: "ਆਖ਼ਰੀ ਕਦਮ: ਤੁਹਾਡਾ ਪੂਰਾ ਨਾਮ 👤",
    nameQuestion: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣਾ ਪੂਰਾ ਨਾਮ ਲਿਖੋ (ਇਹ GST ਬਿੱਲ ਅਤੇ 1 ਸਾਲ ਦੀ ਫ੍ਰੀ ਵਾਰੰਟੀ 'ਤੇ ਆਵੇਗਾ):",
    allInclusiveTag: "ਸਾਰੀਆਂ ਕੀਮਤਾਂ ਵਿੱਚ ਕੈਮਰੇ, DVR/NVR, ਹਾਰਡ ਡਿਸਕ, ਤਾਰਾਂ, ਫਿਟਿੰਗ ਅਤੇ 18% GST ਸ਼ਾਮਲ ਹੈ (ਕੋਈ ਵਾਧੂ ਖ਼ਰਚਾ ਨਹੀਂ!)",
    dualSetupValue: "ਵੈਲਿਊ ਸੈੱਟਅੱਪ (HD ਐਨਾਲਾਗ - ਸਭ ਤੋਂ ਘੱਟ ਰੇਟ)",
    dualSetupPro: "ਪ੍ਰੋ ਸੈੱਟਅੱਪ (ਡਿਜੀਟਲ IP - ਬਿਹਤਰੀਨ 4K ਕੁਆਲਿਟੀ)",
  },

  // 11. Odia (ଓଡ଼ିଆ)
  or: {
    langConfirmed: "✓ ଭାଷା ଚୟନ ହେଲା: *ଓଡ଼ିଆ (Odia)* 🇮🇳\n\nଆସନ୍ତୁ ଆପଣଙ୍କ ସ୍ଥାନ ପାଇଁ ଉପଯୁକ୍ତ ସିସିଟିଭି ସେଟଅପ୍ ବାଛିବା:",
    propHeader: "ପଦକ୍ଷେପ 1/6: ସ୍ଥାନର ପ୍ରକାର ବାଛନ୍ତୁ",
    propQuestion: "ଆପଣ କେଉଁ ସ୍ଥାନ ପାଇଁ କ୍ୟାମେରା ଲଗାଇବାକୁ ଚାହାଁନ୍ତି?",
    propHomeTitle: "🏠 ଘର / ଫ୍ଲାଟ୍ (Home)",
    propOfficeTitle: "🏢 ଦୋକାନ / ଅଫିସ୍ (Shop)",
    propFactoryTitle: "🏭 କାରଖାନା / ଫାର୍ମ (Factory)",
    installHeader: "ପଦକ୍ଷେପ 1/6: ଇନଷ୍ଟଲେସନ୍ ପ୍ରକାର",
    installWiredTitle: "✨ ନୂତନ ୱାୟାର୍ଡ ସେଟଅପ୍ (Wired)",
    installWiredDesc: "DVR/NVR + କପର କେବୁଲିଂ। ମଜବୁତ ସିଗ୍ନାଲ।",
    installWirelessTitle: "📶 ସ୍ମାର୍ଟ ୱାୟାରଲେସ୍ ସିସିଟିଭି",
    installWirelessDesc: "କେବୁଲ ବିନା। ମୋବାଇଲରେ ଲାଇଭ୍ 360° ଭିୟୁ।",
    install4gTitle: "📡 4G ସିମ୍ / ସୋଲାର କ୍ୟାମେରା",
    install4gDesc: "ୱାଇ-ଫାଇ ନଥିବା ଫାର୍ମହାଉସ୍ ପାଇଁ ଉତ୍ତମ।",
    installAddonTitle: "⬆️ ପୁରୁଣା ସିଷ୍ଟମରେ ଯୋଡ଼ନ୍ତୁ",
    installAddonDesc: "ବର୍ତ୍ତମାନର DVR ରେ ଅଧିକ କ୍ୟାମେରା।",
    outdoorHeader: "ପଦକ୍ଷେପ 2/6: ବାହାର କ୍ୟାମେରା (Outdoor Bullet) 🌧️",
    outdoorQuestion: "ମୁଖ୍ୟ ଗେଟ୍ ବା ପାର୍କିଂ ପାଇଁ କେତୋଟି ୱାଟରପ୍ରୁଫ୍ ବୁଲେଟ୍ କ୍ୟାମେରା ଦରକାର?",
    indoorHeader: "ପଦକ୍ଷେਪ 2/6: ଭିତର କ୍ୟାମେରା (Indoor Dome) 🏠",
    indoorQuestion: "ରୁମ୍, ହଲ୍ ବା ଦୋକାନ ଭିତରେ ଲଗାଇବା ପାଇଁ କେତୋଟି ସିଲିଂ ଡୋମ୍ କ୍ୟାମେରା ଦରକାର?",
    numberReplyHint: "👉 ଯେକୌଣସି ସଂଖ୍ୟା (0 ରୁ 32) ଟାଇପ୍ କରନ୍ତୁ କିମ୍ବା ତଳେ ଟ୍ୟାପ୍ କରନ୍ତୁ:",
    quickBtnBullets: "ବୁଲେଟ୍ କ୍ୟାମେରା",
    quickBtnDomes: "ଡୋମ୍ କ୍ୟାମେରା",
    quickBtnNone: "0 (କିଛି ନାହିଁ)",
    quickBtnDoneProceed: "✅ ଆଗକୁ ବଢ଼ନ୍ତୁ",
    quickBtnChangeQty: "✏️ ସଂଖ୍ୟା ବଦଳାନ୍ତୁ",
    storageHeader: "ପଦକ୍ଷେପ 3/6: ରେକର୍ଡିଂ ଏବଂ ଷ୍ଟୋରେଜ୍ 💾",
    storageQuestion: "ଭିଡିଓ ରେକର୍ଡିଂ କେତେ ଦିନ ପର୍ଯ୍ୟନ୍ତ ସୁରକ୍ଷିତ ରଖିବାକୁ ଚାହାଁନ୍ତି?",
    cablingHeader: "ପଦକ୍ଷେପ 4/6: କେବୁଲିଂ ଏବଂ ଫିଟିଂ",
    pincodeHeader: "ପଦକ୍ଷେପ 6/6: ଆପଣଙ୍କ ପିନକୋଡ୍ (Pincode) 📍",
    pincodeQuestion: "ଦୟାକରି ଆପଣଙ୍କ 6 ଅଙ୍କ ବିଶିଷ୍ଟ ପିନକୋଡ୍ ଲେଖନ୍ତୁ (ଯେପରି: 751001):",
    nameHeader: "ଶେଷ ପଦକ୍ଷେପ: ଆପଣଙ୍କ ପୂରା ନାମ 👤",
    nameQuestion: "ଦୟାକରି ଆପଣଙ୍କ ପୂରା ନାମ ଲେଖନ୍ତୁ (GST ବିଲ୍ ଏବଂ 1 ବର୍ଷର ୱାରେଣ୍ଟି ପାଇଁ):",
    allInclusiveTag: "କ୍ୟାମେରା, DVR/NVR, ହାର୍ଡ ଡିସ୍କ, କେବୁଲ, ଫିଟିଂ ଏବଂ 18% GST ସବୁ ଅନ୍ତର୍ଭୁକ୍ତ (କୌଣସି ଗୁପ୍ତ ଚାର୍ଜ ନାହିଁ!)",
    dualSetupValue: "ଭାଲ୍ୟୁ ସେଟଅପ୍ (HD ଆନାଲଗ୍ - ସର୍ବନିମ୍ନ ମୂଲ୍ୟ ଗ୍ୟାରେଣ୍ଟି)",
    dualSetupPro: "ପ୍ରୋ ସେଟଅପ୍ (ଡିଜିଟାଲ୍ IP - ଉତ୍ତମ ଗୁଣବତ୍ତା)",
  }
};

/**
 * Returns conversational strings for the specified locale, falling back gracefully to English.
 */
export function getConversationalStrings(locale?: string): ConversationalStrings {
  const code = (locale || "en") as LocaleCode;
  return CONVERSATIONAL_PROMPTS[code] || CONVERSATIONAL_PROMPTS.en;
}

/**
 * Builds the official 11-language numbered welcome menu text.
 */
export function buildWelcomeLanguageMenu(): string {
  let menu = `Welcome to *TEAM CCTV*! 🛡️\n`;
  menu += `टीम सीसीटीवी में आपका स्वागत है!\n`;
  menu += `_Get your 100% transparent CCTV quotation in 60 seconds with zero hidden costs._\n\n`;
  menu += `🌐 *Choose Your Preferred Language / अपनी भाषा चुनें:*\n`;
  menu += `━━━━━━━━━━━━━━━━━━━━━\n`;
  
  ALL_11_LANGUAGES.forEach(l => {
    const numEmoji = l.num === 10 ? "🔟" : l.num === 11 ? "1️⃣1️⃣" : `${l.num}️⃣`;
    menu += `${numEmoji} *${l.native}* (${l.english})\n`;
  });

  menu += `━━━━━━━━━━━━━━━━━━━━━\n`;
  menu += `👉 Reply with a number (*1 to 11*) or type language name (e.g. *Hindi*).\n`;
  menu += `⚡ Or tap a property option below to start immediately in English/Hindi:`;
  return menu;
}
