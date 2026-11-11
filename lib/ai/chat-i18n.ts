import { LocaleCode } from "../i18n/mapping";

export interface ChatApiStrings {
  zeroCostReply: string;
  localNoteFooter: string;
  fallbackError: string;
  qaWhatsapp: string;
  qaBookSurvey: string;
  qaServiceVisit: string;
  qaWhatsappTech: string;
  qaPasswordResetWa: string;
  qaCameraInspection: string;
  qaInstantQuote: string;
  qaCustomPackage: string;
  qaWarrantyTerms: string;
  qaRenewAmc: string;
  qaTalkSupport: string;
}

const CHAT_API_STRINGS: Record<LocaleCode, ChatApiStrings> = {
  en: {
    zeroCostReply:
      "I am currently using quick offline manuals to keep support instant. For live help or custom pricing, our CCTV engineers are available right now on WhatsApp.",
    localNoteFooter: "Need a technician? Tap an option below to message us on WhatsApp.",
    fallbackError: "Sorry, I couldn't process that right now. Please try again or message us on WhatsApp.",
    qaWhatsapp: "Chat on WhatsApp",
    qaBookSurvey: "Book Free Site Survey",
    qaServiceVisit: "Book Service Visit",
    qaWhatsappTech: "WhatsApp Technician",
    qaPasswordResetWa: "Send Reset Request on WhatsApp",
    qaCameraInspection: "Book Camera Inspection",
    qaInstantQuote: "Generate Instant Quote",
    qaCustomPackage: "Calculate Custom Package",
    qaWarrantyTerms: "View Warranty Terms",
    qaRenewAmc: "Renew or Buy AMC Plan",
    qaTalkSupport: "Talk to Support",
  },
  hi: {
    zeroCostReply:
      "अभी मैं ऑफलाइन टेक्निकल गाइड से मदद कर रहा हूँ। तुरंत कस्टम रेट या लाइव मदद के लिए हमारे CCTV इंजीनियर WhatsApp पर उपलब्ध हैं।",
    localNoteFooter: "अगर टेक्नीशियन की मदद चाहिए, तो नीचे WhatsApp पर सीधा मैसेज करें।",
    fallbackError: "माफ़ कीजिए, अभी जवाब प्रोसेस नहीं हो पाया। कृपया दोबारा कोशिश करें या WhatsApp करें।",
    qaWhatsapp: "WhatsApp पर बात करें",
    qaBookSurvey: "फ्री Site Survey बुक करें",
    qaServiceVisit: "सर्विस विज़िट बुक करें",
    qaWhatsappTech: "टेक्नीशियन से WhatsApp करें",
    qaPasswordResetWa: "WhatsApp पर रीसेट भेजें",
    qaCameraInspection: "कैमरा चेकअप बुक करें",
    qaInstantQuote: "तुरंत Quote बनाएं",
    qaCustomPackage: "अपना पैकेज बनाएं",
    qaWarrantyTerms: "वारंटी नियम देखें",
    qaRenewAmc: "AMC प्लान रिन्यू/लें",
    qaTalkSupport: "सपोर्ट से बात करें",
  },
  mr: {
    zeroCostReply:
      "सध्या मी ऑफलाइन तांत्रिक गाईडमधून मदत करत आहे. त्वरित कस्टम रेट किंवा थेट मदतीसाठी आमचे CCTV इंजिनियर WhatsApp वर उपलब्ध आहेत.",
    localNoteFooter: "टेक्निशियनची मदत हवी असल्यास खाली WhatsApp वर मेसेज करा.",
    fallbackError: "माफ करा, सध्या उत्तर देता आले नाही. कृपया पुन्हा प्रयत्न करा किंवा WhatsApp करा.",
    qaWhatsapp: "WhatsApp वर बोला",
    qaBookSurvey: "फ्री Site Survey बुक करा",
    qaServiceVisit: "सर्व्हिस व्हिजिट बुक करा",
    qaWhatsappTech: "टेक्निशियनला WhatsApp करा",
    qaPasswordResetWa: "WhatsApp वर रीसेट पाठवा",
    qaCameraInspection: "कॅमेरा तपासणी बुक करा",
    qaInstantQuote: "झटपट Quote मिळवा",
    qaCustomPackage: "कस्टम पॅकेज तयार करा",
    qaWarrantyTerms: "वॉरंटी अटी पहा",
    qaRenewAmc: "AMC प्लॅन रिन्यू करा",
    qaTalkSupport: "सपोर्टशी बोला",
  },
  gu: {
    zeroCostReply:
      "હાલમાં હું ઓફલાઇન ટેક્નિકલ ગાઇડથી મદદ કરી રહ્યો છું. તરત કસ્ટમ ભાવ કે લાઇવ મદદ માટે અમારા CCTV એન્જિનિયર WhatsApp પર હાજર છે.",
    localNoteFooter: "ટેક્નિશિયનની મદદ જોઈએ તો નીચેથી WhatsApp પર મેસેજ કરો.",
    fallbackError: "માફ કરજો, હાલમાં જવાબ આપી શકાયો નહીં. ફરી પ્રયાસ કરો અથવા WhatsApp કરો.",
    qaWhatsapp: "WhatsApp પર વાત કરો",
    qaBookSurvey: "ફ્રી Site Survey બુક કરો",
    qaServiceVisit: "સર્વિસ વિઝિટ બુક કરો",
    qaWhatsappTech: "ટેક્નિશિયનને WhatsApp કરો",
    qaPasswordResetWa: "WhatsApp પર રીસેટ મોકલો",
    qaCameraInspection: "કેમેરા ચેકઅપ બુક કરો",
    qaInstantQuote: "તરત Quote મેળવો",
    qaCustomPackage: "કસ્ટમ પેકેજ બનાવો",
    qaWarrantyTerms: "વોરંટી નિયમો જુઓ",
    qaRenewAmc: "AMC પ્લાન રિન્યુ કરો",
    qaTalkSupport: "સપોર્ટ સાથે વાત કરો",
  },
  ta: {
    zeroCostReply:
      "இப்போது நான் ஆஃப்லைன் டெக்னிக்கல் கைடில் இருந்து உதவுகிறேன். உடனடி விலை அல்லது நேரடி உதவிக்கு எங்கள் CCTV இன்ஜினியர்கள் WhatsApp-இல் உள்ளனர்.",
    localNoteFooter: "டெக்னீஷியன் உதவி தேவைப்பட்டால் கீழே WhatsApp-இல் மெசேஜ் செய்யுங்கள்.",
    fallbackError: "மன்னிக்கவும், இப்போது பதில் அளிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும் அல்லது WhatsApp செய்யவும்.",
    qaWhatsapp: "WhatsApp-இல் பேசுங்க",
    qaBookSurvey: "இலவச Site Survey புக் பண்ணுங்க",
    qaServiceVisit: "சர்வீஸ் விசிட் புக் பண்ணுங்க",
    qaWhatsappTech: "டெக்னீஷியனுக்கு WhatsApp செய்யுங்க",
    qaPasswordResetWa: "WhatsApp-இல் ரீசெட் அனுப்புங்க",
    qaCameraInspection: "கேமரா செக்-அப் புக் பண்ணுங்க",
    qaInstantQuote: "உடனடி Quote எடுங்க",
    qaCustomPackage: "கஸ்டம் பேக்கேஜ் கணக்கிடுங்க",
    qaWarrantyTerms: "வாரண்டி விதிகள் பார்க்க",
    qaRenewAmc: "AMC பிளான் புதுப்பிக்க",
    qaTalkSupport: "சப்போர்ட்டிடம் பேசுங்க",
  },
  te: {
    zeroCostReply:
      "ప్రస్తుతం నేను ఆఫ్‌లైన్ టెక్నికల్ గైడ్ నుండి సహాయం చేస్తున్నాను. వెంటనే కస్టమ్ ధరలు లేదా లైవ్ సహాయం కోసం మా CCTV ఇంజనీర్లు WhatsApp లో అందుబాటులో ఉన్నారు.",
    localNoteFooter: "టెక్నీషియన్ సహాయం కావాలంటే కింద WhatsApp ద్వారా మెసేజ్ చేయండి.",
    fallbackError: "క్షమించండి, ఇప్పుడు ప్రాసెస్ చేయలేకపోయాము. దయచేసి మళ్లీ ప్రయత్నించండి లేదా WhatsApp చేయండి.",
    qaWhatsapp: "WhatsApp లో మాట్లాడండి",
    qaBookSurvey: "ఫ్రీ Site Survey బుక్ చేయండి",
    qaServiceVisit: "సర్వీస్ విజిట్ బుక్ చేయండి",
    qaWhatsappTech: "టెక్నీషియన్‌కు WhatsApp చేయండి",
    qaPasswordResetWa: "WhatsApp లో రీసెట్ పంపండి",
    qaCameraInspection: "కెమెరా తనిఖీ బుక్ చేయండి",
    qaInstantQuote: "వెంటనే Quote పొందండి",
    qaCustomPackage: "కస్టమ్ ప్యాకేజీ లెక్కించండి",
    qaWarrantyTerms: "వారంటీ నియమాలు చూడండి",
    qaRenewAmc: "AMC ప్లాన్ రీన్యూ చేయండి",
    qaTalkSupport: "సపోర్ట్‌తో మాట్లాడండి",
  },
  kn: {
    zeroCostReply:
      "ಪ್ರಸ್ತುತ ನಾನು ಆಫ್‌ಲೈನ್ ಟೆಕ್ನಿಕಲ್ ಗೈಡ್‌ನಿಂದ ಸಹಾಯ ಮಾಡುತ್ತಿದ್ದೇನೆ. ತಕ್ಷಣದ ದರಗಳು ಅಥವಾ ಲೈವ್ ಸಹಾಯಕ್ಕಾಗಿ ನಮ್ಮ CCTV ಎಂಜಿನಿಯರ್‌ಗಳು WhatsApp ನಲ್ಲಿ ಲಭ್ಯವಿದ್ದಾರೆ.",
    localNoteFooter: "ಟೆಕ್ನಿಷಿಯನ್ ಸಹಾಯ ಬೇಕಿದ್ದರೆ ಕೆಳಗಿನ WhatsApp ಬಟನ್ ಒತ್ತಿ ಮೆಸೇಜ್ ಮಾಡಿ.",
    fallbackError: "ಕ್ಷಮಿಸಿ, ಈಗ ಉತ್ತರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ WhatsApp ಮಾಡಿ.",
    qaWhatsapp: "WhatsApp ನಲ್ಲಿ ಮಾತನಾಡಿ",
    qaBookSurvey: "ಉಚಿತ Site Survey ಬುಕ್ ಮಾಡಿ",
    qaServiceVisit: "ಸರ್ವೀಸ್ ವಿಸಿಟ್ ಬುಕ್ ಮಾಡಿ",
    qaWhatsappTech: "ಟೆಕ್ನಿಷಿಯನ್‌ಗೆ WhatsApp ಮಾಡಿ",
    qaPasswordResetWa: "WhatsApp ನಲ್ಲಿ ರೀಸೆಟ್ ಕಳುಹಿಸಿ",
    qaCameraInspection: "ಕ್ಯಾಮೆರಾ ಪರಿಶೀಲನೆ ಬುಕ್ ಮಾಡಿ",
    qaInstantQuote: "ತಕ್ಷಣ Quote ಪಡೆಯಿರಿ",
    qaCustomPackage: "ಕಸ್ಟಮ್ ಪ್ಯಾಕೇಜ್ ಲೆಕ್ಕ ಹಾಕಿ",
    qaWarrantyTerms: "ವಾರಂಟಿ ನಿಯಮ ನೋಡಿ",
    qaRenewAmc: "AMC ಪ್ಲಾನ್ ನವೀಕರಿಸಿ",
    qaTalkSupport: "ಸಪೋರ್ಟ್ ಜೊತೆ ಮಾತನಾಡಿ",
  },
  bn: {
    zeroCostReply:
      "এখন আমি অফলাইন টেকনিক্যাল গাইড থেকে সাহায্য করছি। তাৎক্ষণিক কাস্টম দাম বা লাইভ সাহায্যের জন্য আমাদের CCTV ইঞ্জিনিয়াররা WhatsApp-এ আছেন।",
    localNoteFooter: "টেকনিশিয়ানের সাহায্য দরকার হলে নিচে WhatsApp-এ মেসেজ করুন।",
    fallbackError: "দুঃখিত, এখন উত্তর প্রসেস করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন বা WhatsApp করুন।",
    qaWhatsapp: "WhatsApp-এ কথা বলুন",
    qaBookSurvey: "ফ্রি Site Survey বুক করুন",
    qaServiceVisit: "সার্ভিস ভিজিট বুক করুন",
    qaWhatsappTech: "টেকনিশিয়ানকে WhatsApp করুন",
    qaPasswordResetWa: "WhatsApp-এ রিসেট পাঠান",
    qaCameraInspection: "ক্যামেরা চেকআপ বুক করুন",
    qaInstantQuote: "তাৎক্ষণিক Quote নিন",
    qaCustomPackage: "কাস্টম প্যাকেজ হিসাব করুন",
    qaWarrantyTerms: "ওয়ারেন্টি নিয়ম দেখুন",
    qaRenewAmc: "AMC প্ল্যান রিনিউ করুন",
    qaTalkSupport: "সাপোর্টে কথা বলুন",
  },
  ml: {
    zeroCostReply:
      "ഇപ്പോൾ ഞാൻ ഓഫ്‌ലൈൻ ടെക്നിക്കൽ ഗൈഡിൽ നിന്നാണ് സഹായിക്കുന്നത്. ഉടനടി നിരക്കുകൾക്കോ ലൈവ് സഹായത്തിനോ ഞങ്ങളുടെ CCTV എഞ്ചിനീയർമാർ WhatsApp-ൽ ലഭ്യമാണ്.",
    localNoteFooter: "ടെക്നീഷ്യന്റെ സഹായം വേണമെങ്കിൽ താഴെ WhatsApp വഴി മെസ്സേജ് അയക്കൂ.",
    fallbackError: "ക്ഷമിക്കണം, ഇപ്പോൾ മറുപടി നൽകാനായില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക അല്ലെങ്കിൽ WhatsApp ചെയ്യുക.",
    qaWhatsapp: "WhatsApp-ൽ സംസാരിക്കൂ",
    qaBookSurvey: "സൗജന്യ Site Survey ബുക്ക് ചെയ്യൂ",
    qaServiceVisit: "സർവീസ് വിസിറ്റ് ബുക്ക് ചെയ്യൂ",
    qaWhatsappTech: "ടെക്നീഷ്യന് WhatsApp ചെയ്യൂ",
    qaPasswordResetWa: "WhatsApp വഴി റീസെറ്റ് അയക്കൂ",
    qaCameraInspection: "ക്യാമറ പരിശോധന ബുക്ക് ചെയ്യൂ",
    qaInstantQuote: "ഉടൻ Quote നേടൂ",
    qaCustomPackage: "കസ്റ്റം പാക്കേജ് കണക്കാക്കൂ",
    qaWarrantyTerms: "വാറന്റി നിബന്ധനകൾ കാണൂ",
    qaRenewAmc: "AMC പ്ലാൻ പുതുക്കൂ",
    qaTalkSupport: "സപ്പോർട്ടുമായി സംസാരിക്കൂ",
  },
  pa: {
    zeroCostReply:
      "ਇਸ ਵੇਲੇ ਮੈਂ ਆਫਲਾਈਨ ਟੈਕਨੀਕਲ ਗਾਈਡ ਰਾਹੀਂ ਮਦਦ ਕਰ ਰਿਹਾ ਹਾਂ। ਤੁਰੰਤ ਕਸਟਮ ਰੇਟ ਜਾਂ ਲਾਈਵ ਮਦਦ ਲਈ ਸਾਡੇ CCTV ਇੰਜੀਨੀਅਰ WhatsApp 'ਤੇ ਮੌਜੂਦ ਹਨ।",
    localNoteFooter: "ਜੇਕਰ ਟੈਕਨੀਸ਼ੀਅਨ ਦੀ ਮਦਦ ਚਾਹੀਦੀ ਹੈ ਤਾਂ ਹੇਠਾਂ WhatsApp 'ਤੇ ਸੁਨੇਹਾ ਭੇਜੋ।",
    fallbackError: "ਮਾਫ਼ ਕਰਨਾ, ਇਸ ਵੇਲੇ ਜਵਾਬ ਪ੍ਰੋਸੈਸ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ ਜਾਂ WhatsApp ਕਰੋ।",
    qaWhatsapp: "WhatsApp 'ਤੇ ਗੱਲ ਕਰੋ",
    qaBookSurvey: "ਮੁਫ਼ਤ Site Survey ਬੁੱਕ ਕਰੋ",
    qaServiceVisit: "ਸਰਵਿਸ ਵਿਜ਼ਿਟ ਬੁੱਕ ਕਰੋ",
    qaWhatsappTech: "ਟੈਕਨੀਸ਼ੀਅਨ ਨੂੰ WhatsApp ਕਰੋ",
    qaPasswordResetWa: "WhatsApp 'ਤੇ ਰੀਸੈਟ ਭੇਜੋ",
    qaCameraInspection: "ਕੈਮਰਾ ਚੈੱਕਅੱਪ ਬੁੱਕ ਕਰੋ",
    qaInstantQuote: "ਤੁਰੰਤ Quote ਬਣਾਓ",
    qaCustomPackage: "ਕਸਟਮ ਪੈਕੇਜ ਬਣਾਓ",
    qaWarrantyTerms: "ਵਾਰੰਟੀ ਸ਼ਰਤਾਂ ਦੇਖੋ",
    qaRenewAmc: "AMC ਪਲਾਨ ਰੀਨਿਊ ਕਰੋ",
    qaTalkSupport: "ਸਪੋਰਟ ਨਾਲ ਗੱਲ ਕਰੋ",
  },
  or: {
    zeroCostReply:
      "ବର୍ତ୍ତମାନ ମୁଁ ଅଫଲାଇନ୍ ଟେକ୍ନିକାଲ୍ ଗାଇଡ୍ ମାଧ୍ୟମରେ ସାହାଯ୍ୟ କରୁଛି। ତୁରନ୍ତ କଷ୍ଟମ୍ ଦାମ୍ କିମ୍ବା ଲାଇଭ୍ ସାହାଯ୍ୟ ପାଇଁ ଆମର CCTV ଇଞ୍ଜିନିୟରମାନେ WhatsApp ରେ ଉପଲବ୍ଧ ଅଛନ୍ତି।",
    localNoteFooter: "ଟେକ୍ନିସିଆନଙ୍କ ସାହାଯ୍ୟ ଦରକାର ହେଲେ ତଳେ WhatsApp ରେ ମେସେଜ୍ କରନ୍ତୁ।",
    fallbackError: "କ୍ଷମା କରିବେ, ବର୍ତ୍ତମାନ ଉତ୍ତର ପ୍ରୋସେସ୍ ହୋଇପାରିଲା ନାହିଁ। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ କିମ୍ବା WhatsApp କରନ୍ତୁ।",
    qaWhatsapp: "WhatsApp ରେ କଥା ହୁଅନ୍ତୁ",
    qaBookSurvey: "ଫ୍ରି Site Survey ବୁକ୍ କରନ୍ତୁ",
    qaServiceVisit: "ସର୍ଭିସ୍ ଭିଜିଟ୍ ବୁକ୍ କରନ୍ତୁ",
    qaWhatsappTech: "ଟେକ୍ନିସିଆନଙ୍କୁ WhatsApp କରନ୍ତୁ",
    qaPasswordResetWa: "WhatsApp ରେ ରିସେଟ୍ ପଠାନ୍ତୁ",
    qaCameraInspection: "କ୍ୟାମେରା ଚେକ୍ଅପ୍ ବୁକ୍ କରନ୍ତୁ",
    qaInstantQuote: "ତୁରନ୍ତ Quote ପାଆନ୍ତୁ",
    qaCustomPackage: "କଷ୍ଟମ୍ ପ୍ୟାକେଜ୍ ହିସାବ କରନ୍ତୁ",
    qaWarrantyTerms: "ୱାରେଣ୍ଟି ନିୟମ ଦେଖନ୍ତୁ",
    qaRenewAmc: "AMC ପ୍ଲାନ୍ ରିନ୍ୟୁ କରନ୍ତୁ",
    qaTalkSupport: "ସପୋର୍ଟ ସହ କଥା ହୁଅନ୍ତୁ",
  },
};

const ACTION_LABEL_KEY_MAP: Record<string, keyof ChatApiStrings> = {
  "Chat on WhatsApp": "qaWhatsapp",
  "Book Free Site Survey": "qaBookSurvey",
  "Book Service Visit": "qaServiceVisit",
  "WhatsApp Technician": "qaWhatsappTech",
  "Send Reset Request on WhatsApp": "qaPasswordResetWa",
  "Book Camera Inspection": "qaCameraInspection",
  "Generate Instant Quote": "qaInstantQuote",
  "Calculate Custom Package": "qaCustomPackage",
  "View Warranty Terms": "qaWarrantyTerms",
  "Renew or Buy AMC Plan": "qaRenewAmc",
  "Talk to Support": "qaTalkSupport",
};

export function getChatApiStrings(locale?: string): ChatApiStrings {
  const clean = (locale || "en").toLowerCase().trim() as LocaleCode;
  return CHAT_API_STRINGS[clean] || CHAT_API_STRINGS.en;
}

export function localizeChatQuickActions(
  actions: { label: string; action: string }[] | undefined,
  locale?: string
): { label: string; action: string }[] {
  if (!actions || actions.length === 0) return [];
  const strings = getChatApiStrings(locale);
  return actions.map((item) => {
    const key = ACTION_LABEL_KEY_MAP[item.label];
    return {
      ...item,
      label: key ? strings[key] : item.label,
    };
  });
}
