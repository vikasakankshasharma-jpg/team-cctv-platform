import type { Metadata } from "next";
import { SPEECH_LOCALE_MAP, type LocaleCode } from "./mapping";

export interface HomeSeoCopy {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

export const HOME_SEO_METADATA: Record<LocaleCode, HomeSeoCopy> = {
  en: {
    title: "Instant Free CCTV Quotation & CCTV Setup on EMI | Compare CP Plus, Hikvision & Prama",
    description:
      "Get an instant free CCTV quotation online. Complete CCTV setup with installation on easy EMI starting ₹649/mo. Compare multiple brand variations for your home or business.",
    ogTitle: "Instant Free CCTV Quotation & CCTV Setup on EMI | Compare Brands",
    ogDescription:
      "Instant CCTV quotation online. Complete setup with installation on EMI starting ₹649/month. Compare CP Plus, Hikvision, and Prama with transparent pricing.",
  },
  hi: {
    title: "फ्री CCTV कोटेशन और आसान EMI पर पूरा सेटअप | CP Plus, Hikvision और Prama की तुलना करें",
    description:
      "2 मिनट में ऑनलाइन फ्री CCTV कोटेशन पाएं। ₹649/माह से शुरू आसान EMI और फिटिंग के साथ। अपने घर या दुकान के लिए सभी ब्रांड का पक्का रेट देखें।",
    ogTitle: "फ्री CCTV कोटेशन और आसान EMI पर सेटअप | ब्रांड्स तुलना करें",
    ogDescription:
      "ऑनलाइन पक्का CCTV कोटेशन पाएं। ₹649/माह से EMI और पूरी फिटिंग। 18% GST बिल के साथ।",
  },
  mr: {
    title: "मोफत CCTV कोटेशन आणि सोप्या EMI वर पूर्ण सेटअप | CP Plus, Hikvision व Prama तुलना",
    description:
      "2 मिनिटांत ऑनलाइन मोफत CCTV कोटेशन मिळवा। ₹649/महिना पासून सोप्या EMI वर संपूर्ण फिटिंग. घर आणि दुकानासाठी अस्सल ब्रँड्सची तुलना करा.",
    ogTitle: "मोफत CCTV कोटेशन आणि सोप्या EMI वर सेटअप",
    ogDescription:
      "ऑनलाइन अचूक CCTV कोटेशन आणि ₹649/महिना पासून EMI. 18% GST बिलासह.",
  },
  gu: {
    title: "ફ્રી CCTV ક્વોટેશન અને સરળ EMI પર પૂરો સેટઅપ | CP Plus, Hikvision અને Prama સરખાવો",
    description:
      "2 મિનિટમાં ઓનલાઇન ફ્રી CCTV ક્વોટેશન મેળવો. ₹649/મહિનાથી સરળ EMI અને ફિટિંગ સાથે. ઘર કે દુકાન માટે બ્રાન્ડ્સના પાક્કા ભાવ જુઓ.",
    ogTitle: "ફ્રી CCTV ક્વોટેશન અને સરળ EMI પર સેટઅપ",
    ogDescription:
      "ઓનલાઇન પાક્કું CCTV ક્વોટેશન મેળવો. ₹649/મહિનાથી EMI અને 18% GST બિલ સાથે.",
  },
  ta: {
    title: "இலவச CCTV கொட்டேஷன் & சுலப EMI-ல் முழு செட்டப் | CP Plus, Hikvision & Prama ஒப்பிடுங்கள்",
    description:
      "2 நிமிடத்தில் ஆன்லைனில் இலவச CCTV கொட்டேஷன் பெறுங்கள். மாதம் ₹649 முதல் சுலப EMI மற்றும் ஃபிட்டிங். 18% GST பில்லுடன்.",
    ogTitle: "இலவச CCTV கொட்டேஷன் & சுலப EMI-ல் முழு செட்டப்",
    ogDescription:
      "ஆன்லைனில் துல்லியமான CCTV கொட்டேஷன் பெறுங்கள். ₹649/மாதம் முதல் EMI.",
  },
  te: {
    title: "ఉచిత CCTV కొటేషన్ & సులభ EMI పై పూర్తి సెటప్ | CP Plus, Hikvision & Prama పోల్చండి",
    description:
      "2 నిమిషాల్లో ఆన్‌లైన్‌లో ఉచిత CCTV కొటేషన్ పొందండి. నెలకు ₹649 నుండి సులభ EMI మరియు ఫిట్టింగ్. 18% GST బిల్లుతో.",
    ogTitle: "ఉచిత CCTV కొటేషన్ & సులభ EMI పై సెటప్",
    ogDescription:
      "ఆన్‌లైన్‌లో ఖచ్చితమైన CCTV కొటేషన్. ₹649/నెల నుండి EMI మరియు పూర్తి ఫిట్టింగ్.",
  },
  kn: {
    title: "ಉಚಿತ CCTV ಕೊಟೇಶನ್ ಮತ್ತು ಸುಲಭ EMI ನಲ್ಲಿ ಪೂರ್ಣ ಸೆಟಪ್ | CP Plus, Hikvision & Prama ಹೋಲಿಸಿ",
    description:
      "2 ನಿಮಿಷದಲ್ಲಿ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ಉಚಿತ CCTV ಕೊಟೇಶನ್ ಪಡೆಯಿರಿ. ತಿಂಗಳಿಗೆ ₹649 ರಿಂದ ಸುಲಭ EMI ಹಾಗೂ ಫಿಟ್ಟಿಂಗ್. 18% GST ಬಿಲ್‌ನೊಂದಿಗೆ.",
    ogTitle: "ಉಚಿತ CCTV ಕೊಟೇಶನ್ ಮತ್ತು ಸುಲಭ EMI ನಲ್ಲಿ ಸೆಟಪ್",
    ogDescription:
      "ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ನಿಖರ CCTV ಕೊಟೇಶನ್. ₹649/ತಿಂಗಳು ಇಂದ EMI.",
  },
  bn: {
    title: "ফ্রি CCTV কোটেশন ও সহজ EMI-তে সম্পূর্ণ সেটআপ | CP Plus, Hikvision ও Prama তুলনা করুন",
    description:
      "২ মিনিটে অনলাইনে ফ্রি CCTV কোটেশন পান। ₹649/মাস থেকে সহজ EMI ও ফিটিং সহ। ১৮% GST বিল এবং ওয়ারেন্টি অন্তর্ভুক্ত।",
    ogTitle: "ফ্রি CCTV কোটেশন ও সহজ EMI-তে সেটআপ",
    ogDescription:
      "অনলাইনে সঠিক CCTV কোটেশন পান। ₹649/মাস থেকে EMI ও সম্পূর্ণ ফিটিং।",
  },
  ml: {
    title: "സൗജന്യ CCTV കൊട്ടേഷനും എളുപ്പ EMI-ൽ മുഴുവൻ സെറ്റപ്പും | CP Plus, Hikvision & Prama താരതമ്യം ചെയ്യുക",
    description:
      "2 മിനിറ്റിൽ ഓൺലൈനിൽ സൗജന്യ CCTV കൊട്ടേഷൻ നേടൂ. മാസം ₹649 മുതൽ എളുപ്പ EMI-യും ഫിറ്റിംഗും. 18% GST ബില്ലിനൊപ്പം.",
    ogTitle: "സൗജന്യ CCTV കൊട്ടേഷനും എളുപ്പ EMI-ൽ സെറ്റപ്പും",
    ogDescription:
      "ഓൺലൈനിൽ കൃത്യമായ CCTV കൊട്ടേഷൻ നേടൂ. മാസം ₹649 മുതൽ EMI.",
  },
  pa: {
    title: "ਮੁਫ਼ਤ CCTV ਕੋਟੇਸ਼ਨ ਤੇ ਆਸਾਨ EMI ਉੱਤੇ ਪੂਰਾ ਸੈੱਟਅੱਪ | CP Plus, Hikvision ਤੇ Prama ਦੀ ਤੁਲਨਾ ਕਰੋ",
    description:
      "2 ਮਿੰਟਾਂ ਵਿੱਚ ਆਨਲਾਈਨ ਮੁਫ਼ਤ CCTV ਕੋਟੇਸ਼ਨ ਪਾਓ। ₹649/ਮਹੀਨਾ ਤੋਂ ਆਸਾਨ EMI ਤੇ ਫਿਟਿੰਗ ਸਮੇਤ। 18% GST ਬਿੱਲ ਨਾਲ।",
    ogTitle: "ਮੁਫ਼ਤ CCTV ਕੋਟੇਸ਼ਨ ਤੇ ਆਸਾਨ EMI ਉੱਤੇ ਸੈੱਟਅੱਪ",
    ogDescription:
      "ਆਨਲਾਈਨ ਪੱਕਾ CCTV ਕੋਟੇਸ਼ਨ ਪਾਓ। ₹649/ਮਹੀਨਾ ਤੋਂ EMI ਅਤੇ ਪੂਰੀ ਫਿਟਿੰਗ।",
  },
  or: {
    title: "ମାଗଣା CCTV କୋଟେସନ୍ ଓ ସହଜ EMI ରେ ସମ୍ପୂର୍ଣ୍ଣ ସେଟଅପ୍ | CP Plus, Hikvision ଓ Prama ତୁଳନା କରନ୍ତୁ",
    description:
      "2 ମିନିଟରେ ଅନଲାଇନରେ ମାଗଣା CCTV କୋଟେସନ୍ ପାଆନ୍ତୁ। ₹649/ମାସରୁ ସହଜ EMI ଓ ଫିଟିଂ ସହିତ। 18% GST ବିଲ୍ ସାମିଲ।",
    ogTitle: "ମାଗଣା CCTV କୋଟେସନ୍ ଓ ସହଜ EMI ରେ ସେଟଅପ୍",
    ogDescription:
      "ଅନଲାଇନରେ ସଠିକ୍ CCTV କୋଟେସନ୍ ପାଆନ୍ତୁ। ₹649/ମାସରୁ EMI।",
  },
};

const CITY_INSTALL_TITLE: Record<LocaleCode, string> = {
  en: "{brand}CCTV Installation in {city} | Transparent Pricing",
  hi: "{city} में {brand}CCTV फिटिंग और कोटेशन | पक्का और साफ रेट",
  mr: "{city} मध्ये {brand}CCTV फिटिंग व कोटेशन | अचूक दर",
  gu: "{city} માં {brand}CCTV ફિટિંગ અને ક્વોટેશન | પાક્કો ભાવ",
  ta: "{city} பகுதியில் {brand}CCTV பொருத்துதல் & கொட்டேஷன் | தெளிவான விலை",
  te: "{city} లో {brand}CCTV ఫిట్టింగ్ & కొటేషన్ | ఖచ్చితమైన ధరలు",
  kn: "{city} ನಲ್ಲಿ {brand}CCTV ಫಿಟ್ಟಿಂಗ್ ಮತ್ತು ಕೊಟೇಶನ್ | ಸ್ಪಷ್ಟ ದರ",
  bn: "{city}-এ {brand}CCTV ফিটিং ও কোটেশন | পরিষ্কার দাম",
  ml: "{city}-ൽ {brand}CCTV ഫിറ്റിംഗും കൊട്ടേഷനും | കൃത്യമായ നിരക്ക്",
  pa: "{city} ਵਿੱਚ {brand}CCTV ਫਿਟਿੰਗ ਅਤੇ ਕੋਟੇਸ਼ਨ | ਪੱਕਾ ਰੇਟ",
  or: "{city} ରେ {brand}CCTV ଫିଟିଂ ଓ କୋଟେସନ୍ | ସଠିକ୍ ଦାମ୍",
};

const CITY_QUOTE_TITLE: Record<LocaleCode, string> = {
  en: "Get {brand}CCTV Quotation in {city} | Instant Estimator",
  hi: "{city} के लिए {brand}CCTV कोटेशन पाएं | 2 मिनट में पक्का रेट",
  mr: "{city} साठी {brand}CCTV कोटेशन मिळवा | त्वरित अंदाज",
  gu: "{city} માટે {brand}CCTV ક્વોટેશન મેળવો | તરત જ ભાવ જુઓ",
  ta: "{city} பகுதிக்கு {brand}CCTV கொட்டேஷன் பெறுங்கள் | உடனடி மதிப்பீடு",
  te: "{city} కోసం {brand}CCTV కొటేషన్ పొందండి | ఇన్‌స్టంట్ ఎస్టిమేటర్",
  kn: "{city} ಗೆ {brand}CCTV ಕೊಟೇಶನ್ ಪಡೆಯಿರಿ | ತಕ್ಷಣದ ಅಂದಾಜು",
  bn: "{city}-এর জন্য {brand}CCTV কোটেশন পান | তাৎক্ষণিক রেট",
  ml: "{city}-ലേക്ക് {brand}CCTV കൊട്ടേഷൻ നേടൂ | ഉടനടി കണക്ക്",
  pa: "{city} ਲਈ {brand}CCTV ਕੋਟੇਸ਼ਨ ਲਓ | ਤੁਰੰਤ ਰੇਟ",
  or: "{city} ପାଇଁ {brand}CCTV କୋଟେସନ୍ ପାଆନ୍ତୁ | ତୁରନ୍ତ ଦାମ୍",
};

export function buildCitySeoMetadata({
  locale,
  cityName,
  brandPrefix,
  intent,
  installDesc,
  quoteDesc,
}: {
  locale: LocaleCode;
  cityName: string;
  brandPrefix: string;
  intent: string;
  installDesc: string;
  quoteDesc: string;
}) {
  const titleTpl =
    intent === "quotation"
      ? CITY_QUOTE_TITLE[locale] || CITY_QUOTE_TITLE.en
      : CITY_INSTALL_TITLE[locale] || CITY_INSTALL_TITLE.en;
  const title = titleTpl
    .replace("{brand}", brandPrefix)
    .replace("{city}", cityName)
    .replace(/\s{2,}/g, " ")
    .trim();
  const description = (intent === "quotation" ? quoteDesc : installDesc)
    .replace("{brand}", brandPrefix.trim())
    .replace("{city}", cityName)
    .replace(/\s{2,}/g, " ")
    .trim();
  return { title, description };
}

export type CustomerPageSeoKey =
  | "wizard"
  | "build"
  | "pro_builder"
  | "customer_login"
  | "customer_dashboard"
  | "customer_documents"
  | "customer_amc"
  | "customer_profile"
  | "customer_support"
  | "for_installers"
  | "payment_success"
  | "privacy_policy"
  | "terms_of_service"
  | "track"
  | "book_survey"
  | "login"
  | "rate_us"
  | "refer_and_earn"
  | "delivery_verify";

interface PageSeoEntry {
  title: string;
  description: string;
}

export const PAGE_SEO_METADATA: Record<CustomerPageSeoKey, Record<LocaleCode, PageSeoEntry>> = {
  wizard: {
    en: {
      title: "Get Free CCTV Quote | CCTVQuotation by TEAM",
      description: "Design your security camera system in minutes and get an instant, accurate CCTV quotation with GST & installation.",
    },
    hi: {
      title: "फ्री CCTV कोटेशन पाएं | CCTVQuotation",
      description: "कुछ आसान सवालों के जवाब दें और अपने घर या दुकान के लिए तुरंत पक्का CCTV कोटेशन पाएं। 18% GST और फिटिंग शामिल।",
    },
    mr: {
      title: "मोफत CCTV कोटेशन मिळवा | CCTVQuotation",
      description: "काही सोप्या प्रश्नांची उत्तरे द्या आणि घर किंवा दुकानासाठी लगेच अचूक CCTV कोटेशन मिळवा. 18% GST व फिटिंगसह.",
    },
    gu: {
      title: "ફ્રી CCTV ક્વોટેશન મેળવો | CCTVQuotation",
      description: "થોડા સરળ સવાલોના જવાબ આપો અને ઘર કે દુકાન માટે તરત જ પાક્કું CCTV ક્વોટેશન મેળવો. GST અને ફિટિંગ સામેલ.",
    },
    ta: {
      title: "இலவச CCTV கொட்டேஷன் பெறுங்கள் | CCTVQuotation",
      description: "சில எளிய கேள்விகளுக்கு பதிலளித்து வீடு அல்லது கடைக்கு உடனடி CCTV கொட்டேஷன் பெறுங்கள். GST & ஃபிட்டிங் உட்பட.",
    },
    te: {
      title: "ఉచిత CCTV కొటేషన్ పొందండి | CCTVQuotation",
      description: "కొన్ని సులభమైన ప్రశ్నలకు సమాధానమిచ్చి మీ ఇంటికి లేదా దుకాణానికి వెంటనే CCTV కొటేషన్ పొందండి.",
    },
    kn: {
      title: "ಉಚಿತ CCTV ಕೊಟೇಶನ್ ಪಡೆಯಿರಿ | CCTVQuotation",
      description: "ಕೆಲವು ಸರಳ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ ಮತ್ತು ನಿಮ್ಮ ಮನೆ ಅಥವಾ ಅಂಗಡಿಗೆ ತಕ್ಷಣ CCTV ಕೊಟೇಶನ್ ಪಡೆಯಿರಿ.",
    },
    bn: {
      title: "ফ্রি CCTV কোটেশন পান | CCTVQuotation",
      description: "কয়েকটি সহজ প্রশ্নের উত্তর দিয়ে ঘর বা দোকানের জন্য মুহূর্তেই সঠিক CCTV কোটেশন পেয়ে যান।",
    },
    ml: {
      title: "സൗജന്യ CCTV ക്വട്ടേഷൻ നേടൂ | CCTVQuotation",
      description: "ചില ലളിതമായ ചോദ്യങ്ങൾക്ക് ഉത്തരം നൽകി വീടിനോ കടയ്ക്കോ ഉടനടി CCTV ക്വട്ടേഷൻ നേടൂ.",
    },
    pa: {
      title: "ਮੁਫ਼ਤ CCTV ਕੋਟੇਸ਼ਨ ਲਓ | CCTVQuotation",
      description: "ਕੁਝ ਸੌਖੇ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦਿਓ ਅਤੇ ਘਰ ਜਾਂ ਦੁਕਾਨ ਲਈ ਤੁਰੰਤ ਪੱਕਾ CCTV ਕੋਟੇਸ਼ਨ ਲਓ।",
    },
    or: {
      title: "ମାଗଣା CCTV କୋଟେସନ୍ ପାଆନ୍ତୁ | CCTVQuotation",
      description: "କିଛି ସହଜ ପ୍ରଶ୍ନର ଉତ୍ତର ଦେଇ ଘର କିମ୍ବା ଦୋକାନ ପାଇଁ ତୁରନ୍ତ ସଠିକ୍ CCTV କୋଟେସନ୍ ପାଆନ୍ତୁ।",
    },
  },
  build: {
    en: {
      title: "Build Your CCTV System | CCTVQuotation by TEAM",
      description: "Already know what you need? Select your cameras, recorder, storage, and accessories to get an instant quotation.",
    },
    hi: {
      title: "अपना CCTV सिस्टम खुद बनाएं | CCTVQuotation",
      description: "कैमरे, DVR/NVR, हार्ड डिस्क और जरूरी सामान खुद चुनें और तुरंत पक्का कोटेशन पाएं।",
    },
    mr: {
      title: "तुमची CCTV सिस्टीम स्वतः बनवा | CCTVQuotation",
      description: "कॅमेरे, DVR/NVR, हार्ड डिस्क आणि ॲक्सेसरीज स्वतः निवडा आणि लगेच कोटेशन मिळवा.",
    },
    gu: {
      title: "તમારી CCTV સિસ્ટમ જાતે બનાવો | CCTVQuotation",
      description: "કેમેરા, DVR/NVR, હાર્ડ ડિસ્ક અને સામાન જાતે પસંદ કરો અને તરત ક્વોટેશન મેળવો.",
    },
    ta: {
      title: "உங்கள் CCTV சிஸ்டத்தை நீங்களே உருவாக்குங்கள் | CCTVQuotation",
      description: "கேமராக்கள், DVR/NVR, ஹார்டு டிஸ்க் மற்றும் உபகரணங்களைத் தேர்ந்தெடுத்து உடனடி கொட்டேஷன் பெறுங்கள்.",
    },
    te: {
      title: "మీ CCTV సిస్టమ్ మీరే రూపొందించండి | CCTVQuotation",
      description: "కెమెరాలు, DVR/NVR, హార్డ్ డిస్క్ మరియు యాక్సెసరీలను ఎంచుకుని తక్షణ కొటేషన్ పొందండి.",
    },
    kn: {
      title: "ನಿಮ್ಮ CCTV ಸಿಸ್ಟಮ್ ನೀವೇ ನಿರ್ಮಿಸಿ | CCTVQuotation",
      description: "ಕ್ಯಾಮೆರಾ, DVR/NVR, ಹಾರ್ಡ್ ಡಿಸ್ಕ್ ಮತ್ತು ಬಿಡಿಭಾಗಗಳನ್ನು ಆರಿಸಿ ತಕ್ಷಣ ಕೊಟೇಶನ್ ಪಡೆಯಿರಿ.",
    },
    bn: {
      title: "নিজের CCTV সিস্টেম নিজেই সাজান | CCTVQuotation",
      description: "ক্যামেরা, DVR/NVR, হার্ড ডিস্ক ও অ্যাক্সেসরি বেছে নিয়ে মুহূর্তেই কোটেশন পান।",
    },
    ml: {
      title: "നിങ്ങളുടെ CCTV സിസ്റ്റം സ്വയം തിരഞ്ഞെടുക്കൂ | CCTVQuotation",
      description: "ക്യാമറ, DVR/NVR, ഹാർഡ് ഡിസ്ക് എന്നിവ സ്വയം തിരഞ്ഞെടുത്ത് ഉടനടി ക്വട്ടേഷൻ നേടൂ.",
    },
    pa: {
      title: "ਆਪਣਾ CCTV ਸਿਸਟਮ ਖੁਦ ਬਣਾਓ | CCTVQuotation",
      description: "ਕੈਮਰੇ, DVR/NVR, ਹਾਰਡ ਡਿਸਕ ਤੇ ਸਮਾਨ ਖੁਦ ਚੁਣੋ ਅਤੇ ਤੁਰੰਤ ਕੋਟੇਸ਼ਨ ਲਓ।",
    },
    or: {
      title: "ନିଜ CCTV ସିଷ୍ଟମ୍ ନିଜେ ତିଆରି କରନ୍ତୁ | CCTVQuotation",
      description: "କ୍ୟାମେରା, DVR/NVR, ହାର୍ଡ ଡିସ୍କ ଓ ଆସେସରି ବାଛି ତୁରନ୍ତ କୋଟେସନ୍ ପାଆନ୍ତୁ।",
    },
  },
  pro_builder: {
    en: {
      title: "Pro Builder | CCTV Quotation",
      description: "Advanced hardware configurator to select exact camera, recorder, PoE/SMPS, storage, and accessories.",
    },
    hi: {
      title: "प्रो बिल्डर — कस्टम CCTV कोटेशन | CCTVQuotation",
      description: "ब्रांड, मॉडल, DVR/NVR, केबल और हार्ड डिस्क आइटम-दर-आइटम चुनकर अपना कस्टम CCTV कोटेशन बनाएं।",
    },
    mr: {
      title: "प्रो बिल्डर — कस्टम CCTV कोटेशन | CCTVQuotation",
      description: "प्रत्येक कॅमेरा, DVR/NVR, केबल आणि हार्ड डिस्क स्वतः निवडून कस्टम कोटेशन तयार करा.",
    },
    gu: {
      title: "પ્રો બિલ્ડર — કસ્ટમ CCTV ક્વોટેશન | CCTVQuotation",
      description: "દરેક કેમેરા, DVR/NVR, કેબલ અને હાર્ડ ડિસ્ક પસંદ કરીને તમારું કસ્ટમ ક્વોટેશન બનાવો.",
    },
    ta: {
      title: "ப்ரோ பில்டர் — கஸ்டம் CCTV கொட்டேஷன் | CCTVQuotation",
      description: "கேமரா, DVR/NVR, கேபிள் மற்றும் ஹார்டு டிஸ்க் ஆகியவற்றை தனித்தனியாக தேர்ந்தெடுத்து கொட்டேஷன் உருவாக்குங்கள்.",
    },
    te: {
      title: "ప్రో బిల్డర్ — కస్టమ్ CCTV కొటేషన్ | CCTVQuotation",
      description: "కెమెరా, DVR/NVR, కేబుల్ మరియు హార్డ్ డిస్క్ విడివిడిగా ఎంచుకుని కస్టమ్ కొటేషన్ తయారు చేయండి.",
    },
    kn: {
      title: "ಪ್ರೋ ಬಿಲ್ಡರ್ — ಕಸ್ಟಮ್ CCTV ಕೊಟೇಶನ್ | CCTVQuotation",
      description: "ಕ್ಯಾಮೆರಾ, DVR/NVR, ಕೇಬಲ್ ಮತ್ತು ಹಾರ್ಡ್ ಡಿಸ್ಕ್ ಪ್ರತ್ಯೇಕವಾಗಿ ಆರಿಸಿ ಕಸ್ಟಮ್ ಕೊಟೇಶನ್ ತಯಾರಿಸಿ.",
    },
    bn: {
      title: "প্রো বিল্ডার — কাস্টম CCTV কোটেশন | CCTVQuotation",
      description: "প্রতিটি ক্যামেরা, DVR/NVR, কেবল এবং হার্ড ডিস্ক আলাদাভাবে বেছে কাস্টম কোটেশন তৈরি করুন।",
    },
    ml: {
      title: "പ്രോ ബിൽഡർ — കസ്റ്റം CCTV ക്വട്ടേഷൻ | CCTVQuotation",
      description: "ഓരോ ക്യാമറ, DVR/NVR, കേബിൾ, ഹാർഡ് ഡിസ്ക് എന്നിവ വെവ്വേറെ തിരഞ്ഞെടുത്ത് ക്വട്ടേഷൻ ഉണ്ടാക്കൂ.",
    },
    pa: {
      title: "ਪ੍ਰੋ ਬਿਲਡਰ — ਕਸਟਮ CCTV ਕੋਟੇਸ਼ਨ | CCTVQuotation",
      description: "ਕੈਮਰੇ, DVR/NVR, ਤਾਰ ਅਤੇ ਹਾਰਡ ਡਿਸਕ ਵੱਖਰੇ-ਵੱਖਰੇ ਚੁਣ ਕੇ ਕਸਟਮ ਕੋਟੇਸ਼ਨ ਬਣਾਓ।",
    },
    or: {
      title: "ପ୍ରୋ ବିଲ୍ଡର୍ — କଷ୍ଟମ୍ CCTV କୋଟେସନ୍ | CCTVQuotation",
      description: "କ୍ୟାମେରା, DVR/NVR, କେବଲ୍ ଏବଂ ହାର୍ଡ ଡିସ୍କ ବାଛି ନିଜ ପସନ୍ଦର କୋଟେସନ୍ ତିଆରି କରନ୍ତୁ।",
    },
  },
  customer_login: {
    en: {
      title: "Customer Login | TEAM CCTV Platform",
      description: "Secure WhatsApp OTP login for customers to view quotations, download GST invoices, and track installations.",
    },
    hi: {
      title: "ग्राहक लॉगिन | TEAM CCTV पोर्टल",
      description: "अपना कोटेशन, GST बिल और कैमरा फिटिंग स्टेटस देखने के लिए WhatsApp OTP से सुरक्षित लॉगिन करें।",
    },
    mr: {
      title: "ग्राहक लॉगिन | TEAM CCTV पोर्टल",
      description: "तुमचे कोटेशन, GST बिल आणि फिटिंग स्टेटस पाहण्यासाठी WhatsApp OTP ने सुरक्षित लॉगिन करा.",
    },
    gu: {
      title: "ગ્રાહક લોગિન | TEAM CCTV પોર્ટલ",
      description: "તમારું ક્વોટેશન, GST બિલ અને ફિટિંગ સ્ટેટસ જોવા માટે WhatsApp OTP થી સેફ લોગિન કરો.",
    },
    ta: {
      title: "வாடிக்கையாளர் லாகின் | TEAM CCTV",
      description: "உங்கள் கொட்டேஷன், GST பில் மற்றும் ஃபிட்டிங் நிலையைப் பார்க்க WhatsApp OTP மூலம் லாகின் செய்யவும்.",
    },
    te: {
      title: "కస్టమర్ లాగిన్ | TEAM CCTV",
      description: "మీ కొటేషన్, GST బిల్లు మరియు ఇన్‌స్టాలేషన్ స్టేటస్ చూడటానికి WhatsApp OTP తో సురక్షితంగా లాగిన్ చేయండి.",
    },
    kn: {
      title: "ಗ್ರಾಹಕರ ಲಾಗಿನ್ | TEAM CCTV",
      description: "ನಿಮ್ಮ ಕೊಟೇಶನ್, GST ಬಿಲ್ ಮತ್ತು ಫಿಟ್ಟಿಂಗ್ ಸ್ಥಿತಿಯನ್ನು ನೋಡಲು WhatsApp OTP ಮೂಲಕ ಲಾಗಿನ್ ಆಗಿ.",
    },
    bn: {
      title: "গ্রাহক লগইন | TEAM CCTV পোর্টাল",
      description: "আপনার কোটেশন, GST বিল ও ফিটিং স্ট্যাটাস দেখতে WhatsApp OTP দিয়ে নিরাপদ লগইন করুন।",
    },
    ml: {
      title: "ഉപഭോക്തൃ ലോഗിൻ | TEAM CCTV",
      description: "നിങ്ങളുടെ ക്വട്ടേഷൻ, GST ബിൽ, ഫിറ്റിംഗ് വിവരങ്ങൾ എന്നിവ കാണാൻ WhatsApp OTP വഴി ലോഗിൻ ചെയ്യുക.",
    },
    pa: {
      title: "ਗਾਹਕ ਲੌਗਇਨ | TEAM CCTV ਪੋਰਟਲ",
      description: "ਆਪਣਾ ਕੋਟੇਸ਼ਨ, GST ਬਿੱਲ ਅਤੇ ਫਿਟਿੰਗ ਸਟੇਟਸ ਦੇਖਣ ਲਈ WhatsApp OTP ਨਾਲ ਸੁਰੱਖਿਅਤ ਲੌਗਇਨ ਕਰੋ।",
    },
    or: {
      title: "ଗ୍ରାହକ ଲଗଇନ୍ | TEAM CCTV",
      description: "ଆପଣଙ୍କ କୋଟେସନ୍, GST ବିଲ୍ ଏବଂ ଫିଟିଂ ସ୍ଥିତି ଦେଖିବାକୁ WhatsApp OTP ଦ୍ୱାରା ଲଗଇନ୍ କରନ୍ତୁ।",
    },
  },
  customer_dashboard: {
    en: {
      title: "My Dashboard | TEAM CCTV",
      description: "View your CCTV quotations, installation progress, and tax invoices.",
    },
    hi: {
      title: "मेरा डैशबोर्ड | TEAM CCTV",
      description: "अपने सभी CCTV कोटेशन, फिटिंग का लाइव स्टेटस और GST बिल यहां देखें।",
    },
    mr: {
      title: "माझा डॅशबोर्ड | TEAM CCTV",
      description: "तुमचे सर्व CCTV कोटेशन, कामाची प्रगती आणि GST बिले येथे पहा.",
    },
    gu: {
      title: "મારું ડેશબોર્ડ | TEAM CCTV",
      description: "તમારા બધા CCTV ક્વોટેશન, કામની પ્રગતિ અને GST બિલ અહીં જુઓ.",
    },
    ta: {
      title: "என் டாஷ்போர்டு | TEAM CCTV",
      description: "உங்கள் CCTV கொட்டேஷன்கள், நிறுவல் நிலை மற்றும் பில்களை இங்கே பார்க்கவும்.",
    },
    te: {
      title: "నా డాష్‌బోర్డ్ | TEAM CCTV",
      description: "మీ CCTV కొటేషన్లు, ఇన్‌స్టాలేషన్ పురోగతి మరియు బిల్లులను ఇక్కడ చూడండి.",
    },
    kn: {
      title: "ನನ್ನ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ | TEAM CCTV",
      description: "ನಿಮ್ಮ ಎಲ್ಲಾ CCTV ಕೊಟೇಶನ್‌ಗಳು, ಅಳವಡಿಕೆ ಪ್ರಗತಿ ಮತ್ತು ಬಿಲ್‌ಗಳನ್ನು ಇಲ್ಲಿ ನೋಡಿ.",
    },
    bn: {
      title: "আমার ড্যাশবোর্ড | TEAM CCTV",
      description: "আপনার সব CCTV কোটেশন, কাজের অগ্রগতি এবং বিল এখানে দেখুন।",
    },
    ml: {
      title: "എന്റെ ഡാഷ്‌ബോർഡ് | TEAM CCTV",
      description: "നിങ്ങളുടെ എല്ലാ CCTV ക്വട്ടേഷനുകളും ഇൻസ്റ്റലേഷൻ പുരോഗതിയും ബില്ലുകളും ഇവിടെ കാണാം.",
    },
    pa: {
      title: "ਮੇਰਾ ਡੈਸ਼ਬੋਰਡ | TEAM CCTV",
      description: "ਆਪਣੇ ਸਾਰੇ CCTV ਕੋਟੇਸ਼ਨ, ਫਿਟਿੰਗ ਦੀ ਤਰੱਕੀ ਅਤੇ ਬਿੱਲ ਇੱਥੇ ਦੇਖੋ।",
    },
    or: {
      title: "ମୋ ଡ୍ୟାଶବୋର୍ଡ | TEAM CCTV",
      description: "ଆପଣଙ୍କ ସମସ୍ତ CCTV କୋଟେସନ୍, ଇନଷ୍ଟଲେସନ୍ ଅଗ୍ରଗତି ଏବଂ ବିଲ୍ ଏଠାରେ ଦେଖନ୍ତୁ।",
    },
  },
  customer_documents: {
    en: {
      title: "My Documents | TEAM CCTV",
      description: "View and download your official GST invoices, receipts, and warranty certificates.",
    },
    hi: {
      title: "मेरे दस्तावेज़ व बिल | TEAM CCTV",
      description: "अपनी पेमेंट रसीद, GST टैक्स इनवॉइस और 1 साल का वारंटी सर्टिफिकेट डाउनलोड करें।",
    },
    mr: {
      title: "माझी कागदपत्रे व बिले | TEAM CCTV",
      description: "तुमची पेमेंट पावती, GST टॅक्स इनव्हॉइस आणि वॉरंटी प्रमाणपत्र डाउनलोड करा.",
    },
    gu: {
      title: "મારા ડોક્યુમેન્ટ્સ અને બિલ | TEAM CCTV",
      description: "તમારી પેમેન્ટ રસીદ, GST ટેક્સ ઇન્વોઇસ અને વોરંટી સર્ટિફિકેટ ડાઉનલોડ કરો.",
    },
    ta: {
      title: "என் ஆவணங்கள் & பில்கள் | TEAM CCTV",
      description: "உங்கள் ரசீதுகள், GST இன்வாய்ஸ் மற்றும் வாரண்டி சான்றிதழ்களை பதிவிறக்கம் செய்யவும்.",
    },
    te: {
      title: "నా డాక్యుమెంట్లు & బిల్లులు | TEAM CCTV",
      description: "మీ పేమెంట్ రసీదులు, GST ట్యాక్స్ ఇన్‌వాయిస్ మరియు వారంటీ సర్టిఫికెట్లు డౌన్‌లోడ్ చేయండి.",
    },
    kn: {
      title: "ನನ್ನ ದಾಖಲೆಗಳು ಮತ್ತು ಬಿಲ್‌ಗಳು | TEAM CCTV",
      description: "ನಿಮ್ಮ ಪಾವತಿ ರಸೀದಿ, GST ಟ್ಯಾಕ್ಸ್ ಇನ್‌ವಾಯ್ಸ್ ಮತ್ತು ವಾರಂಟಿ ಪ್ರಮಾಣಪತ್ರಗಳನ್ನು ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.",
    },
    bn: {
      title: "আমার ডকুমেন্ট ও বিল | TEAM CCTV",
      description: "আপনার পেমেন্ট রসিদ, GST ট্যাক্স ইনভয়েস এবং ওয়ারেন্টি সার্টিফিকেট ডাউনলোড করুন।",
    },
    ml: {
      title: "എന്റെ രേഖകളും ബില്ലുകളും | TEAM CCTV",
      description: "നിങ്ങളുടെ പേയ്മെന്റ് രസീത്, GST ടാക്സ് ഇൻവോയ്സ്, വാറന്റി സർട്ടിഫിക്കറ്റ് എന്നിവ ഡൗൺലോഡ് ചെയ്യുക.",
    },
    pa: {
      title: "ਮੇਰੇ ਦਸਤਾਵੇਜ਼ ਤੇ ਬਿੱਲ | TEAM CCTV",
      description: "ਆਪਣੀ ਪੇਮੈਂਟ ਰਸੀਦ, GST ਟੈਕਸ ਇਨਵੌਇਸ ਅਤੇ ਵਾਰੰਟੀ ਸਰਟੀਫਿਕੇਟ ਡਾਊਨਲੋਡ ਕਰੋ।",
    },
    or: {
      title: "ମୋ ଡକ୍ୟୁମେଣ୍ଟ୍ ଏବଂ ବିଲ୍ | TEAM CCTV",
      description: "ଆପଣଙ୍କ ପେମେଣ୍ଟ ରସିଦ, GST ଟ୍ୟାକ୍ସ ଇନଭଏସ୍ ଏବଂ ୱାରେଣ୍ଟି ସାର୍ଟିଫିକେଟ୍ ଡାଉନଲୋଡ୍ କରନ୍ତୁ।",
    },
  },
  customer_amc: {
    en: {
      title: "My Warranties & AMC | TEAM CCTV",
      description: "Check active hardware warranties and AMC service visit coverage.",
    },
    hi: {
      title: "मेरी वारंटी और AMC | TEAM CCTV",
      description: "अपने सभी CCTV कैमरों और DVR/NVR की वारंटी अवधि और AMC सर्विस देखें।",
    },
    mr: {
      title: "माझी वॉरंटी आणि AMC | TEAM CCTV",
      description: "तुमच्या सर्व CCTV उपकरणांची वॉरंटी आणि AMC सर्व्हिस तपशील पहा.",
    },
    gu: {
      title: "મારી વોરંટી અને AMC | TEAM CCTV",
      description: "તમારા બધા CCTV ઉપકરણોની વોરંટી અને AMC સર્વિસ વિગત જુઓ.",
    },
    ta: {
      title: "என் வாரண்டி & AMC | TEAM CCTV",
      description: "உங்கள் CCTV கருவிகளின் வாரண்டி மற்றும் AMC சர்வீஸ் விவரங்களைப் பார்க்கவும்.",
    },
    te: {
      title: "నా వారంటీ & AMC | TEAM CCTV",
      description: "మీ CCTV పరికరాల వారంటీ మరియు AMC సర్వీస్ వివరాలను చూడండి.",
    },
    kn: {
      title: "ನನ್ನ ವಾರಂಟಿ ಮತ್ತು AMC | TEAM CCTV",
      description: "ನಿಮ್ಮ CCTV ಉಪಕರಣಗಳ ವಾರಂಟಿ ಮತ್ತು AMC ಸೇವಾ ವಿವರಗಳನ್ನು ನೋಡಿ.",
    },
    bn: {
      title: "আমার ওয়ারেন্টি ও AMC | TEAM CCTV",
      description: "আপনার সব CCTV যন্ত্রপাতির ওয়ারেন্টি ও AMC সার্ভিসের তথ্য দেখুন।",
    },
    ml: {
      title: "എന്റെ വാറന്റിയും AMC-യും | TEAM CCTV",
      description: "നിങ്ങളുടെ CCTV ഉപകരണങ്ങളുടെ വാറന്റിയും AMC സർവീസ് വിവരങ്ങളും കാണുക.",
    },
    pa: {
      title: "ਮੇਰੀ ਵਾਰੰਟੀ ਅਤੇ AMC | TEAM CCTV",
      description: "ਆਪਣੇ ਸਾਰੇ CCTV ਸਮਾਨ ਦੀ ਵਾਰੰਟੀ ਅਤੇ AMC ਸਰਵਿਸ ਦੀ ਜਾਣਕਾਰੀ ਦੇਖੋ।",
    },
    or: {
      title: "ମୋ ୱାରେଣ୍ଟି ଏବଂ AMC | TEAM CCTV",
      description: "ଆପଣଙ୍କ ସମସ୍ତ CCTV ଉପକରଣର ୱାରେଣ୍ଟି ଏବଂ AMC ସର୍ଭିସ୍ ବିବରଣୀ ଦେଖନ୍ତୁ।",
    },
  },
  customer_profile: {
    en: {
      title: "My Profile | TEAM CCTV",
      description: "Manage your personal details, billing GSTIN, and installation addresses.",
    },
    hi: {
      title: "मेरी प्रोफ़ाइल | TEAM CCTV",
      description: "अपना नाम, मोबाइल नंबर, पता और GST बिलिंग जानकारी अपडेट करें।",
    },
    mr: {
      title: "माझे प्रोफाइल | TEAM CCTV",
      description: "तुमचे नाव, मोबाईल नंबर, पत्ता आणि GST बिलिंग तपशील अपडेट करा.",
    },
    gu: {
      title: "મારી પ્રોફાઇલ | TEAM CCTV",
      description: "તમારું નામ, મોબાઇલ નંબર, સરનામું અને GST બિલિંગ માહિતી અપડેટ કરો.",
    },
    ta: {
      title: "என் சுயவிவரம் | TEAM CCTV",
      description: "உங்கள் பெயர், மொபைல் எண், முகவரி மற்றும் GST பில் விவரங்களைப் புதுப்பிக்கவும்.",
    },
    te: {
      title: "నా ప్రొఫైల్ | TEAM CCTV",
      description: "మీ పేరు, మొబైల్ నంబర్, చిరునామా మరియు GST బిల్లింగ్ వివరాలను అప్‌డేట్ చేయండి.",
    },
    kn: {
      title: "ನನ್ನ ಪ್ರೊಫೈಲ್ | TEAM CCTV",
      description: "ನಿಮ್ಮ ಹೆಸರು, ಮೊಬೈಲ್ ಸಂಖ್ಯೆ, ವಿಳಾಸ ಮತ್ತು GST ಬಿಲ್ಲಿಂಗ್ ವಿವರಗಳನ್ನು ನವೀಕರಿಸಿ.",
    },
    bn: {
      title: "আমার প্রোফাইল | TEAM CCTV",
      description: "আপনার নাম, মোবাইল নম্বর, ঠিকানা ও GST বিলিং তথ্য আপডেট করুন।",
    },
    ml: {
      title: "എന്റെ പ്രൊഫൈൽ | TEAM CCTV",
      description: "നിങ്ങളുടെ പേര്, മൊബൈൽ നമ്പർ, വിലാസം, GST ബില്ലിംഗ് വിവരങ്ങൾ എന്നിവ അപ്‌ഡേറ്റ് ചെയ്യുക.",
    },
    pa: {
      title: "ਮੇਰੀ ਪ੍ਰੋਫਾਈਲ | TEAM CCTV",
      description: "ਆਪਣਾ ਨਾਮ, ਮੋਬਾਈਲ ਨੰਬਰ, ਪਤਾ ਅਤੇ GST ਬਿਲਿੰਗ ਜਾਣਕਾਰੀ ਅੱਪਡੇਟ ਕਰੋ।",
    },
    or: {
      title: "ମୋ ପ୍ରୋଫାଇଲ୍ | TEAM CCTV",
      description: "ଆପଣଙ୍କ ନାମ, ମୋବାଇଲ୍ ନମ୍ବର, ଠିକଣା ଏବଂ GST ବିଲିଂ ତଥ୍ୟ ଅପଡେଟ୍ କରନ୍ତୁ।",
    },
  },
  customer_support: {
    en: {
      title: "Support & Help | TEAM CCTV",
      description: "Raise a support ticket, view warranty coverage, and get fast assistance.",
    },
    hi: {
      title: "सपोर्ट और सहायता | TEAM CCTV",
      description: "कैमरा सर्विस टिकट दर्ज करें, वारंटी देखें और तुरंत मदद पाएं।",
    },
    mr: {
      title: "मदत व सपोर्ट | TEAM CCTV",
      description: "सर्व्हिस तिकीट नोंदवा, वॉरंटी पहा आणि त्वरित मदत मिळवा.",
    },
    gu: {
      title: "સપોર્ટ અને મદદ | TEAM CCTV",
      description: "સર્વિસ ટિકિટ નોંધાવો, વોરંટી જુઓ અને ઝડપી મદદ મેળવો.",
    },
    ta: {
      title: "உதவி & சப்போர்ட் | TEAM CCTV",
      description: "சர்வீஸ் டிக்கெட் பதிவு செய்யவும், வாரண்டி பார்க்கவும், உடனடி உதவி பெறவும்.",
    },
    te: {
      title: "సపోర్ట్ & సహాయం | TEAM CCTV",
      description: "సర్వీస్ టికెట్ నమోదు చేయండి, వారంటీ చూడండి మరియు తక్షణ సహాయం పొందండి.",
    },
    kn: {
      title: "ಬೆಂಬಲ ಮತ್ತು ಸಹಾಯ | TEAM CCTV",
      description: "ಸರ್ವೀಸ್ ಟಿಕೆಟ್ ದಾಖಲಿಸಿ, ವಾರಂಟಿ ನೋಡಿ ಮತ್ತು ತ್ವರಿತ ಸಹಾಯ ಪಡೆಯಿರಿ.",
    },
    bn: {
      title: "সাপোর্ট ও সাহায্য | TEAM CCTV",
      description: "সার্ভিস টিকিট খুলুন, ওয়ারেন্টি দেখুন এবং দ্রুত সাহায্য পান।",
    },
    ml: {
      title: "സപ്പോർട്ടും സഹായവും | TEAM CCTV",
      description: "സർവീസ് ടിക്കറ്റ് നൽകുക, വാറന്റി പരിശോധിക്കുക, വേഗത്തിൽ സഹായം നേടുക.",
    },
    pa: {
      title: "ਸਪੋਰਟ ਅਤੇ ਮਦਦ | TEAM CCTV",
      description: "ਸਰਵਿਸ ਟਿਕਟ ਦਰਜ ਕਰੋ, ਵਾਰੰਟੀ ਦੇਖੋ ਅਤੇ ਤੁਰੰਤ ਮਦਦ ਲਓ।",
    },
    or: {
      title: "ସପୋର୍ଟ ଓ ସହାୟତା | TEAM CCTV",
      description: "ସର୍ଭିସ୍ ଟିକେଟ୍ ଦାଖଲ କରନ୍ତୁ, ୱାରେଣ୍ଟି ଦେଖନ୍ତୁ ଏବଂ ତୁରନ୍ତ ସହାୟତା ପାଆନ୍ତୁ।",
    },
  },
  for_installers: {
    en: {
      title: "Join the CCTVQuotation Installer Network | Grow Your CCTV Business",
      description: "Get high-quality, verified CCTV leads in your territory. Join India's trusted network for security system installers.",
    },
    hi: {
      title: "CCTVQuotation इंस्टॉलर नेटवर्क से जुड़ें | अपना बिज़नेस बढ़ाएं",
      description: "अपने इलाके में पक्के और वेरिफाइड CCTV ऑर्डर पाएं। भारत के भरोसेमंद इंस्टॉलर पार्टनर नेटवर्क से जुड़ें।",
    },
    mr: {
      title: "CCTVQuotation इन्स्टॉलर नेटवर्कमध्ये सामील व्हा | व्यवसाय वाढवा",
      description: "तुमच्या परिसरात खात्रीशीर CCTV ऑर्डर्स मिळवा. भारताच्या विश्वासू इन्स्टॉलर नेटवर्कशी जोडा.",
    },
    gu: {
      title: "CCTVQuotation ઇન્સ્ટોલર નેટવર્કમાં જોડાઓ | વ્યવસાય વધારો",
      description: "તમારા વિસ્તારમાં પાક્કા અને વેરિફાઇડ CCTV ઓર્ડર મેળવો. ભારતના વિશ્વસનીય ઇન્સ્ટોલર નેટવર્કમાં જોડાઓ.",
    },
    ta: {
      title: "CCTVQuotation இன்ஸ்டாலர் நெட்வொர்க்கில் சேருங்கள்",
      description: "உங்கள் பகுதியில் உறுதியான CCTV ஆர்டர்களைப் பெறுங்கள். நம்பகமான இன்ஸ்டாலர் கூட்டாளர் நெட்வொர்க்கில் இணையுங்கள்.",
    },
    te: {
      title: "CCTVQuotation ఇన్‌స్టాలర్ నెట్‌వర్క్‌లో చేరండి",
      description: "మీ ప్రాంతంలో ధృవీకరించిన CCTV ఆర్డర్లను పొందండి. నమ్మకమైన ఇన్‌స్టాలర్ భాగస్వామి నెట్‌వర్క్‌లో చేరండి.",
    },
    kn: {
      title: "CCTVQuotation ಇನ್‌ಸ್ಟಾಲರ್ ನೆಟ್‌ವರ್ಕ್‌ಗೆ ಸೇರಿ",
      description: "ನಿಮ್ಮ ಪ್ರದೇಶದಲ್ಲಿ ಖಚಿತವಾದ CCTV ಆರ್ಡರ್‌ಗಳನ್ನು ಪಡೆಯಿರಿ. ವಿಶ್ವಾಸಾರ್ಹ ಇನ್‌ಸ್ಟಾಲರ್ ನೆಟ್‌ವರ್ಕ್ ಸೇರಿ.",
    },
    bn: {
      title: "CCTVQuotation ইনস্টলার নেটওয়ার্কে যোগ দিন",
      description: "আপনার এলাকায় যাচাইকৃত CCTV অর্ডার পান। ভারতের বিশ্বস্ত ইনস্টলার পার্টনার নেটওয়ার্কে যুক্ত হোন।",
    },
    ml: {
      title: "CCTVQuotation ഇൻസ്റ്റാളർ നെറ്റ്‌വർക്കിൽ ചേരൂ",
      description: "നിങ്ങളുടെ പ്രദേശത്ത് സ്ഥിരീകരിച്ച CCTV ഓർഡറുകൾ നേടൂ. വിശ്വസ്ത ഇൻസ്റ്റാളർ പങ്കാളി നെറ്റ്‌വർക്കിൽ അംഗമാകൂ.",
    },
    pa: {
      title: "CCTVQuotation ਇੰਸਟਾਲਰ ਨੈੱਟਵਰਕ ਨਾਲ ਜੁੜੋ",
      description: "ਆਪਣੇ ਇਲਾਕੇ ਵਿੱਚ ਪੱਕੇ ਅਤੇ ਵੈਰੀਫਾਈਡ CCTV ਆਰਡਰ ਲਓ। ਭਰੋਸੇਯੋਗ ਇੰਸਟਾਲਰ ਨੈੱਟਵਰਕ ਦਾ ਹਿੱਸਾ ਬਣੋ।",
    },
    or: {
      title: "CCTVQuotation ଇନଷ୍ଟଲର୍ ନେଟୱାର୍କରେ ଯୋଗ ଦିଅନ୍ତୁ",
      description: "ଆପଣଙ୍କ ଅଞ୍ଚଳରେ ପକ୍କା CCTV ଅର୍ଡର୍ ପାଆନ୍ତୁ। ବିଶ୍ୱସ୍ତ ଇନଷ୍ଟଲର୍ ପାର୍ଟନର୍ ନେଟୱାର୍କରେ ସାମିଲ ହୁଅନ୍ତୁ।",
    },
  },
  payment_success: {
    en: {
      title: "Payment Successful | CCTVQuotation by TEAM",
      description: "Your CCTV installation payment has been confirmed. Download your GST tax invoice.",
    },
    hi: {
      title: "पेमेंट सफल रहा | CCTVQuotation",
      description: "आपकी CCTV बुकिंग और पेमेंट कन्फर्म हो गई है। अपना GST बिल डाउनलोड करें।",
    },
    mr: {
      title: "पेमेंट यशस्वी झाले | CCTVQuotation",
      description: "तुमची CCTV बुकिंग आणि पेमेंट निश्चित झाले आहे. तुमचे GST बिल डाउनलोड करा.",
    },
    gu: {
      title: "પેમેન્ટ સફળ રહ્યું | CCTVQuotation",
      description: "તમારું CCTV બુકિંગ અને પેમેન્ટ કન્ફર્મ થયું છે. તમારું GST બિલ ડાઉનલોડ કરો.",
    },
    ta: {
      title: "கட்டணம் வெற்றிகரமாக முடிந்தது | CCTVQuotation",
      description: "உங்கள் CCTV புக்கிங் & கட்டணம் உறுதி செய்யப்பட்டது. உங்கள் GST பில்லை பதிவிறக்கவும்.",
    },
    te: {
      title: "పేమెంట్ విజయవంతమైంది | CCTVQuotation",
      description: "మీ CCTV బుకింగ్ మరియు పేమెంట్ నిర్ధారించబడింది. మీ GST బిల్లు డౌన్‌లోడ్ చేసుకోండి.",
    },
    kn: {
      title: "ಪಾವತಿ ಯಶಸ್ವಿಯಾಗಿದೆ | CCTVQuotation",
      description: "ನಿಮ್ಮ CCTV ಬುಕಿಂಗ್ ಮತ್ತು ಪಾವತಿ ಖಚಿತವಾಗಿದೆ. ನಿಮ್ಮ GST ಬಿಲ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ.",
    },
    bn: {
      title: "পেমেন্ট সফল হয়েছে | CCTVQuotation",
      description: "আপনার CCTV বুকিং ও পেমেন্ট কনফার্ম হয়েছে। আপনার GST বিল ডাউনলোড করুন।",
    },
    ml: {
      title: "പേയ്മെന്റ് വിജയിച്ചു | CCTVQuotation",
      description: "നിങ്ങളുടെ CCTV ബുക്കിംഗും പേയ്മെന്റും ഉറപ്പാക്കിയിരിക്കുന്നു. GST ബിൽ ഡൗൺലോഡ് ചെയ്യൂ.",
    },
    pa: {
      title: "ਪੇਮੈਂਟ ਸਫਲ ਰਿਹਾ | CCTVQuotation",
      description: "ਤੁਹਾਡੀ CCTV ਬੁਕਿੰਗ ਤੇ ਪੇਮੈਂਟ ਪੱਕੀ ਹੋ ਗਈ ਹੈ। ਆਪਣਾ GST ਬਿੱਲ ਡਾਊਨਲੋਡ ਕਰੋ।",
    },
    or: {
      title: "ପେମେଣ୍ଟ ସଫଳ ହେଲା | CCTVQuotation",
      description: "ଆପଣଙ୍କ CCTV ବୁକିଂ ଏବଂ ପେମେଣ୍ଟ ନିଶ୍ଚିତ ହୋଇଛି। ଆପଣଙ୍କ GST ବିଲ୍ ଡାଉନଲୋଡ୍ କରନ୍ତୁ।",
    },
  },
  privacy_policy: {
    en: {
      title: "Privacy Policy | CCTVQuotation — cctvquotation.com",
      description: "Privacy Policy for CCTVQuotation's online CCTV quotation platform in accordance with the DPDP Act, 2023.",
    },
    hi: {
      title: "प्राइवेसी पॉलिसी (Privacy Policy) | CCTVQuotation",
      description: "CCTVQuotation ग्राहकों के डेटा और नंबर की सुरक्षा कैसे करता है — DPDP Act, 2023 के अनुसार प्राइवेसी नियम।",
    },
    mr: {
      title: "प्रायव्हसी पॉलिसी (गोपनीयता धोरण) | CCTVQuotation",
      description: "CCTVQuotation तुमच्या वैयक्तिक माहितीचे व नंबरचे संरक्षण कसे करते ते जाणून घ्या.",
    },
    gu: {
      title: "પ્રાઇવસી પોલિસી (ગોપનીયતા નીતિ) | CCTVQuotation",
      description: "CCTVQuotation તમારી અંગત માહિતી અને મોબાઇલ નંબરની સુરક્ષા કેવી રીતે રાખે છે તે જાણો.",
    },
    ta: {
      title: "தனியுரிமைக் கொள்கை (Privacy Policy) | CCTVQuotation",
      description: "CCTVQuotation உங்கள் தனிப்பட்ட தரவை எவ்வாறு பாதுகாக்கிறது என்பதை அறியவும்.",
    },
    te: {
      title: "ప్రైవసీ పాలసీ (గోప్యతా విధానం) | CCTVQuotation",
      description: "CCTVQuotation మీ వ్యక్తిగత డేటాను ఎలా భద్రంగా ఉంచుతుందో తెలుసుకోండి.",
    },
    kn: {
      title: "ಗೌಪ್ಯತಾ ನೀತಿ (Privacy Policy) | CCTVQuotation",
      description: "CCTVQuotation ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ಮಾಹಿತಿಯನ್ನು ಹೇಗೆ ಸುರಕ್ಷಿತವಾಗಿಡುತ್ತದೆ ಎಂಬುದನ್ನು ತಿಳಿಯಿರಿ.",
    },
    bn: {
      title: "প্রাইভেসি পলিসি (গোপনীয়তা নীতি) | CCTVQuotation",
      description: "CCTVQuotation কীভাবে আপনার ব্যক্তিগত তথ্য ও মোবাইল নম্বর সুরক্ষিত রাখে তা জানুন।",
    },
    ml: {
      title: "സ്വകാര്യതാ നയം (Privacy Policy) | CCTVQuotation",
      description: "CCTVQuotation നിങ്ങളുടെ സ്വകാര്യ വിവരങ്ങൾ എങ്ങനെ സുരക്ഷിതമാക്കുന്നു എന്ന് വായിക്കുക.",
    },
    pa: {
      title: "ਪ੍ਰਾਈਵੇਸੀ ਪਾਲਿਸੀ (Privacy Policy) | CCTVQuotation",
      description: "CCTVQuotation ਤੁਹਾਡੀ ਨਿੱਜੀ ਜਾਣਕਾਰੀ ਅਤੇ ਨੰਬਰ ਨੂੰ ਕਿਵੇਂ ਸੁਰੱਖਿਅਤ ਰੱਖਦਾ ਹੈ, ਪੜ੍ਹੋ।",
    },
    or: {
      title: "ପ୍ରାଇଭେସି ପଲିସି (ଗୋପନୀୟତା ନୀତି) | CCTVQuotation",
      description: "CCTVQuotation ଆପଣଙ୍କ ବ୍ୟକ୍ତିଗତ ତଥ୍ୟ ଓ ନମ୍ବରକୁ କିପରି ସୁରକ୍ଷିତ ରଖେ ତାହା ଜାଣନ୍ତୁ।",
    },
  },
  terms_of_service: {
    en: {
      title: "Terms of Service | CCTVQuotation — cctvquotation.com",
      description: "Terms of Service for CCTVQuotation's CCTV quotation and installation platform: pricing, warranty, and service terms.",
    },
    hi: {
      title: "सेवा की शर्तें (Terms of Service) | CCTVQuotation",
      description: "CCTVQuotation की कोटेशन वैधता, पेमेंट नियम, फिटिंग और 1 साल की वारंटी से जुड़ी शर्तें।",
    },
    mr: {
      title: "सेवेच्या अटी (Terms of Service) | CCTVQuotation",
      description: "CCTVQuotation चे कोटेशन दर, पेमेंट नियम, फिटिंग आणि वॉरंटी संदर्भातील अटी वाचा.",
    },
    gu: {
      title: "સેવાની શરતો (Terms of Service) | CCTVQuotation",
      description: "CCTVQuotation ના ક્વોટેશન ભાવ, પેમેન્ટ નિયમો, ફિટિંગ અને વોરંટી અંગેની શરતો.",
    },
    ta: {
      title: "சேவை விதிமுறைகள் (Terms of Service) | CCTVQuotation",
      description: "CCTVQuotation கொட்டேஷன் விலை, கட்டண விதிமுறைகள் மற்றும் வாரண்டி பற்றிய தகவல்கள்.",
    },
    te: {
      title: "సేవా నిబంధనలు (Terms of Service) | CCTVQuotation",
      description: "CCTVQuotation కొటేషన్ ధరలు, పేమెంట్ విధానాలు, ఫిట్టింగ్ మరియు వారంటీ నిబంధనలు.",
    },
    kn: {
      title: "ಸೇವಾ ನಿಯಮಗಳು (Terms of Service) | CCTVQuotation",
      description: "CCTVQuotation ಕೊಟೇಶನ್ ದರಗಳು, ಪಾವತಿ ನಿಯಮಗಳು, ಅಳವಡಿಕೆ ಮತ್ತು ವಾರಂಟಿ ಷರತ್ತುಗಳು.",
    },
    bn: {
      title: "পরিষেবার শর্তাবলী (Terms of Service) | CCTVQuotation",
      description: "CCTVQuotation-এর কোটেশন দাম, পেমেন্ট নিয়ম, ফিটিং এবং ওয়ারেন্টি সংক্রান্ত শর্তাবলী।",
    },
    ml: {
      title: "സേവന നിബന്ധനകൾ (Terms of Service) | CCTVQuotation",
      description: "CCTVQuotation ക്വട്ടേഷൻ നിരക്കുകൾ, പേയ്മെന്റ് നിയമങ്ങൾ, വാറന്റി വ്യവസ്ഥകൾ എന്നിവ വായിക്കുക.",
    },
    pa: {
      title: "ਸੇਵਾ ਦੀਆਂ ਸ਼ਰਤਾਂ (Terms of Service) | CCTVQuotation",
      description: "CCTVQuotation ਦੇ ਕੋਟੇਸ਼ਨ ਰੇਟ, ਪੇਮੈਂਟ ਨਿਯਮ, ਫਿਟਿੰਗ ਅਤੇ ਵਾਰੰਟੀ ਦੀਆਂ ਸ਼ਰਤਾਂ।",
    },
    or: {
      title: "ସେବା ସର୍ତ୍ତାବଳୀ (Terms of Service) | CCTVQuotation",
      description: "CCTVQuotation ର କୋଟେସନ୍ ଦାମ୍, ପେମେଣ୍ଟ ନିୟମ, ଫିଟିଂ ଓ ୱାରେଣ୍ଟି ସର୍ତ୍ତାବଳୀ ପଢ଼ନ୍ତୁ।",
    },
  },
  track: {
    en: {
      title: "Track Installation & Quotation | TEAM CCTV",
      description: "Track your CCTV quotation, technician assignment, installation progress, and download GST invoices.",
    },
    hi: {
      title: "अपना ऑर्डर और फिटिंग ट्रैक करें | TEAM CCTV",
      description: "अपने CCTV कोटेशन, टेक्नीशियन विज़िट और फिटिंग की लाइव स्थिति देखें तथा बिल डाउनलोड करें।",
    },
    mr: {
      title: "तुमची ऑर्डर व फिटिंग ट्रॅक करा | TEAM CCTV",
      description: "तुमचे CCTV कोटेशन, टेक्निशियन विझिट आणि फिटिंगची सद्यस्थिती तपासा.",
    },
    gu: {
      title: "તમારો ઓર્ડર અને ફિટિંગ ટ્રેક કરો | TEAM CCTV",
      description: "તમારું CCTV ક્વોટેશન, ટેકનિશિયન વિઝિટ અને ફિટિંગ સ્ટેટસ લાઇવ જુઓ.",
    },
    ta: {
      title: "உங்கள் ஆர்டர் & ஃபிட்டிங்கை ட்ராக் செய்யவும் | TEAM CCTV",
      description: "உங்கள் CCTV கொட்டேஷன், டெக்னீஷியன் வருகை மற்றும் ஃபிட்டிங் நிலையை நேரலையில் பார்க்கவும்.",
    },
    te: {
      title: "మీ ఆర్డర్ & ఇన్‌స్టాలేషన్ ట్రాక్ చేయండి | TEAM CCTV",
      description: "మీ CCTV కొటేషన్, టెక్నీషియన్ విజిట్ మరియు ఇన్‌స్టాలేషన్ స్టేటస్ లైవ్‌లో చూడండి.",
    },
    kn: {
      title: "ನಿಮ್ಮ ಆರ್ಡರ್ ಮತ್ತು ಫಿಟ್ಟಿಂಗ್ ಟ್ರ್ಯಾಕ್ ಮಾಡಿ | TEAM CCTV",
      description: "ನಿಮ್ಮ CCTV ಕೊಟೇಶನ್, ತಂತ್ರಜ್ಞರ ಭೇಟಿ ಮತ್ತು ಅಳವಡಿಕೆ ಪ್ರಗತಿಯನ್ನು ನೇರವಾಗಿ ನೋಡಿ.",
    },
    bn: {
      title: "আপনার অর্ডার ও ফিটিং ট্র্যাক করুন | TEAM CCTV",
      description: "আপনার CCTV কোটেশন, টেকনিশিয়ান ভিজিট ও ফিটিংয়ের লাইভ স্ট্যাটাস দেখুন।",
    },
    ml: {
      title: "നിങ്ങളുടെ ഓർഡറും ഫിറ്റിംഗും ട്രാക്ക് ചെയ്യൂ | TEAM CCTV",
      description: "നിങ്ങളുടെ CCTV ക്വട്ടേഷൻ, ടെക്നീഷ്യൻ വിസിറ്റ്, ഇൻസ്റ്റലേഷൻ നിലവാരം എന്നിവ കാണുക.",
    },
    pa: {
      title: "ਆਪਣਾ ਆਰਡਰ ਅਤੇ ਫਿਟਿੰਗ ਟਰੈਕ ਕਰੋ | TEAM CCTV",
      description: "ਆਪਣਾ CCTV ਕੋਟੇਸ਼ਨ, ਟੈਕਨੀਸ਼ੀਅਨ ਵਿਜ਼ਿਟ ਅਤੇ ਫਿਟਿੰਗ ਦੀ ਲਾਈਵ ਸਥਿਤੀ ਦੇਖੋ।",
    },
    or: {
      title: "ଆପଣଙ୍କ ଅର୍ଡର୍ ଓ ଫିଟିଂ ଟ୍ରାକ୍ କରନ୍ତୁ | TEAM CCTV",
      description: "ଆପଣଙ୍କ CCTV କୋଟେସନ୍, ଟେକ୍ନିସିଆନ୍ ଭିଜିଟ୍ ଏବଂ ଫିଟିଂ ସ୍ଥିତି ଦେଖନ୍ତୁ।",
    },
  },
  book_survey: {
    en: {
      title: "Book a Free Site Survey | TEAM CCTV",
      description: "Schedule a free site survey with our CCTV engineers for exact camera placement & pricing.",
    },
    hi: {
      title: "फ्री साइट विज़िट बुक करें | TEAM CCTV",
      description: "कैमरे की सही जगह और पक्के खर्च के लिए हमारे इंजीनियर की फ्री साइट विज़िट बुक करें।",
    },
    mr: {
      title: "मोफत साइट व्हिजिट बुक करा | TEAM CCTV",
      description: "कॅमेऱ्यांच्या अचूक जागेसाठी आणि खर्चासाठी आमच्या इंजिनिअरची मोफत साइट व्हिजिट बुक करा.",
    },
    gu: {
      title: "ફ્રી સાઇટ વિઝિટ બુક કરો | TEAM CCTV",
      description: "કેમેરાની યોગ્ય જગ્યા અને પાક્કા ખર્ચ માટે અમારા એન્જિનિયરની ફ્રી સાઇટ વિઝિટ બુક કરો.",
    },
    ta: {
      title: "இலவச சைட் விசிட் புக் செய்யவும் | TEAM CCTV",
      description: "சரியான கேமரா இடம் மற்றும் விலைக்கு எங்கள் பொறியாளரின் இலவச சைட் விசிட் புக் செய்யவும்.",
    },
    te: {
      title: "ఉచిత సైట్ విజిట్ బుక్ చేయండి | TEAM CCTV",
      description: "కెమెరా సరైన ప్రదేశం మరియు ఖర్చు అంచనా కోసం మా ఇంజనీర్ ఉచిత సైట్ విజిట్ బుక్ చేయండి.",
    },
    kn: {
      title: "ಉಚಿತ ಸೈಟ್ ವಿಸಿಟ್ ಬುಕ್ ಮಾಡಿ | TEAM CCTV",
      description: "ಸರಿಯಾದ ಕ್ಯಾಮೆರಾ ಸ್ಥಳ ಮತ್ತು ನಿಖರ ವೆಚ್ಚಕ್ಕಾಗಿ ನಮ್ಮ ಎಂಜಿನಿಯರ್ ಭೇಟಿ ಬುಕ್ ಮಾಡಿ.",
    },
    bn: {
      title: "ফ্রি সাইট ভিজিট বুক করুন | TEAM CCTV",
      description: "ক্যামেরার সঠিক জায়গা ও খরচের হিসাব জানতে আমাদের ইঞ্জিনিয়ারের ফ্রি সাইট ভিজিট বুক করুন।",
    },
    ml: {
      title: "സൗജന്യ സൈറ്റ് വിസിറ്റ് ബുക്ക് ചെയ്യൂ | TEAM CCTV",
      description: "കൃത്യമായ ക്യാമറ സ്ഥാനവും ചെലവും അറിയാൻ ഞങ്ങളുടെ എഞ്ചിനീയറുടെ സൗജന്യ സന്ദർശനം ബുക്ക് ചെയ്യൂ.",
    },
    pa: {
      title: "ਮੁਫ਼ਤ ਸਾਈਟ ਵਿਜ਼ਿਟ ਬੁੱਕ ਕਰੋ | TEAM CCTV",
      description: "ਕੈਮਰਿਆਂ ਦੀ ਸਹੀ ਥਾਂ ਅਤੇ ਪੱਕੇ ਖਰਚੇ ਲਈ ਸਾਡੇ ਇੰਜੀਨੀਅਰ ਦੀ ਮੁਫ਼ਤ ਸਾਈਟ ਵਿਜ਼ਿਟ ਬੁੱਕ ਕਰੋ।",
    },
    or: {
      title: "ମାଗଣା ସାଇଟ୍ ଭିଜିଟ୍ ବୁକ୍ କରନ୍ତୁ | TEAM CCTV",
      description: "ସଠିକ୍ କ୍ୟାମେରା ସ୍ଥାନ ଓ ଖର୍ଚ୍ଚ ପାଇଁ ଆମ ଇଞ୍ଜିନିୟରଙ୍କ ମାଗଣା ସାଇଟ୍ ଭିଜିଟ୍ ବୁକ୍ କରନ୍ତୁ।",
    },
  },
  login: {
    en: {
      title: "Login | TEAM CCTV",
      description: "Secure login portal for customers, staff, and installer partners.",
    },
    hi: {
      title: "अकाउंट लॉगिन | TEAM CCTV",
      description: "ग्राहकों, स्टाफ और इंस्टॉलर पार्टनर्स के लिए सुरक्षित लॉगिन पोर्टल।",
    },
    mr: {
      title: "अकाउंट लॉगिन | TEAM CCTV",
      description: "ग्राहक, स्टाफ आणि इन्स्टॉलर पार्टनर्ससाठी सुरक्षित लॉगिन पोर्टल.",
    },
    gu: {
      title: "એકાઉન્ટ લોગિન | TEAM CCTV",
      description: "ગ્રાહકો, સ્ટાફ અને ઇન્સ્ટોલર પાર્ટનર્સ માટે સેફ લોગિન પોર્ટલ.",
    },
    ta: {
      title: "கணக்கு லாகின் | TEAM CCTV",
      description: "வாடிக்கையாளர்கள், ஊழியர்கள் மற்றும் பார்ட்னர்களுக்கான பாதுகாப்பான லாகின் போர்ட்டல்.",
    },
    te: {
      title: "ఖాతా లాగిన్ | TEAM CCTV",
      description: "కస్టమర్లు, సిబ్బంది మరియు పార్ట్‌నర్ల కోసం సురక్షిత లాగిన్ పోర్టల్.",
    },
    kn: {
      title: "ಖಾತೆ ಲಾಗಿನ್ | TEAM CCTV",
      description: "ಗ್ರಾಹಕರು, ಸಿಬ್ಬಂದಿ ಮತ್ತು ಪಾಲುದಾರರಿಗಾಗಿ ಸುರಕ್ಷಿತ ಲಾಗಿನ್ ಪೋರ್ಟಲ್.",
    },
    bn: {
      title: "অ্যাকাউন্ট লগইন | TEAM CCTV",
      description: "গ্রাহক, স্টাফ ও পার্টনারদের জন্য নিরাপদ লগইন পোর্টাল।",
    },
    ml: {
      title: "അക്കൗണ്ട് ലോഗിൻ | TEAM CCTV",
      description: "ഉപഭോക്താക്കൾക്കും സ്റ്റാഫിനും പാർട്ണർമാർക്കുമുള്ള സുരക്ഷിത ലോഗിൻ പോർട്ടൽ.",
    },
    pa: {
      title: "ਖਾਤਾ ਲੌਗਇਨ | TEAM CCTV",
      description: "ਗਾਹਕਾਂ, ਸਟਾਫ਼ ਅਤੇ ਪਾਰਟਨਰਾਂ ਲਈ ਸੁਰੱਖਿਅਤ ਲੌਗਇਨ ਪੋਰਟਲ।",
    },
    or: {
      title: "ଆକାଉଣ୍ଟ ଲଗଇନ୍ | TEAM CCTV",
      description: "ଗ୍ରାହକ, କର୍ମଚାରୀ ଏବଂ ପାର୍ଟନରଙ୍କ ପାଇଁ ସୁରକ୍ଷିତ ଲଗଇନ୍ ପୋର୍ଟାଲ୍।",
    },
  },
  rate_us: {
    en: {
      title: "Rate Your Experience | TEAM CCTV",
      description: "Share quick feedback on your CCTV installation and technician service.",
    },
    hi: {
      title: "अपना अनुभव रेट करें | TEAM CCTV",
      description: "अपनी CCTV फिटिंग और टेक्नीशियन की सर्विस पर अपना फीडबैक दें।",
    },
    mr: {
      title: "तुमचा अनुभव रेट करा | TEAM CCTV",
      description: "तुमच्या CCTV फिटिंग व टेक्निशियनच्या सेवेबद्दल अभिप्राय द्या.",
    },
    gu: {
      title: "તમારો અનુભવ રેટ કરો | TEAM CCTV",
      description: "તમારા CCTV ફિટિંગ અને ટેકનિશિયનની સેવા પર તમારો અભિપ્રાય આપો.",
    },
    ta: {
      title: "உங்கள் அனுபவத்தை மதிப்பிடுங்கள் | TEAM CCTV",
      description: "உங்கள் CCTV ஃபிட்டிங் மற்றும் டெக்னீஷியன் சேவை பற்றிய கருத்தைத் தெரிவிக்கவும்.",
    },
    te: {
      title: "మీ అనుభవాన్ని రేట్ చేయండి | TEAM CCTV",
      description: "మీ CCTV ఫిట్టింగ్ మరియు టెక్నీషియన్ సేవపై మీ అభిప్రాయాన్ని పంచుకోండి.",
    },
    kn: {
      title: "ನಿಮ್ಮ ಅನುಭವವನ್ನು ರೇಟ್ ಮಾಡಿ | TEAM CCTV",
      description: "ನಿಮ್ಮ CCTV ಫಿಟ್ಟಿಂಗ್ ಮತ್ತು ತಂತ್ರಜ್ಞರ ಸೇವೆಯ ಕುರಿತು ಪ್ರತಿಕ್ರಿಯೆ ನೀಡಿ.",
    },
    bn: {
      title: "আপনার অভিজ্ঞতা রেট করুন | TEAM CCTV",
      description: "আপনার CCTV ফিটিং ও টেকনিশিয়ানের কাজ কেমন লাগল জানান।",
    },
    ml: {
      title: "നിങ്ങളുടെ അനുഭവം റേറ്റ് ചെയ്യൂ | TEAM CCTV",
      description: "നിങ്ങളുടെ CCTV ഫിറ്റിംഗിനെയും ടെക്നീഷ്യന്റെ സേവനത്തെയും കുറിച്ച് അഭിപ്രായം രേഖപ്പെടുത്തൂ.",
    },
    pa: {
      title: "ਆਪਣਾ ਤਜਰਬਾ ਰੇਟ ਕਰੋ | TEAM CCTV",
      description: "ਆਪਣੀ CCTV ਫਿਟਿੰਗ ਅਤੇ ਟੈਕਨੀਸ਼ੀਅਨ ਦੀ ਸੇਵਾ ਬਾਰੇ ਫੀਡਬੈਕ ਦਿਓ।",
    },
    or: {
      title: "ଆପଣଙ୍କ ଅନୁଭୂତି ରେଟ୍ କରନ୍ତୁ | TEAM CCTV",
      description: "ଆପଣଙ୍କ CCTV ଫିଟିଂ ଏବଂ ଟେକ୍ନିସିଆନ୍ ସେବା ବିଷୟରେ ମତାମତ ଦିଅନ୍ତୁ।",
    },
  },
  refer_and_earn: {
    en: {
      title: "Refer & Earn ₹500 | TEAM CCTV Affiliate Program",
      description: "Earn flat ₹500 for every CCTV installation you refer. Instant free signup with your phone number.",
    },
    hi: {
      title: "रेफर करें और ₹500 कमाएं | TEAM CCTV",
      description: "हर सफल CCTV फिटिंग रेफर करने पर ₹500 पाएं और आपके दोस्त को भी ₹500 की छूट। तुरंत जुड़ें।",
    },
    mr: {
      title: "रेफर करा आणि ₹500 कमवा | TEAM CCTV",
      description: "प्रत्येक CCTV फिटिंग रेफर केल्यास थेट ₹500 मिळवा आणि मित्रालाही ₹500 सूट.",
    },
    gu: {
      title: "રેફર કરો અને ₹500 કમાઓ | TEAM CCTV",
      description: "દરેક CCTV ફિટિંગ રેફર કરવા પર સીધા ₹500 કમાઓ અને તમારા મિત્રને પણ ₹500 ની બચત.",
    },
    ta: {
      title: "பரிந்துரைத்து ₹500 சம்பாதியுங்கள் | TEAM CCTV",
      description: "ஒவ்வொரு CCTV ஃபிட்டிங் பரிந்துரைக்கும் ₹500 பெறுங்கள்; நண்பருக்கும் ₹500 தள்ளுபடி.",
    },
    te: {
      title: "రెఫర్ చేసి ₹500 సంపాదించండి | TEAM CCTV",
      description: "మీరు రెఫర్ చేసే ప్రతి CCTV ఫిట్టింగ్‌కు ₹500 పొందండి; మీ స్నేహితులకు ₹500 తగ్గింపు.",
    },
    kn: {
      title: "ರೆಫರ್ ಮಾಡಿ ₹500 ಗಳಿಸಿ | TEAM CCTV",
      description: "ಪ್ರತಿ CCTV ಫಿಟ್ಟಿಂಗ್ ರೆಫರಲ್‌ಗೆ ₹500 ಗಳಿಸಿ ಮತ್ತು ನಿಮ್ಮ ಸ್ನೇಹಿತರಿಗೂ ₹500 ರಿಯಾಯಿತಿ.",
    },
    bn: {
      title: "রেফার করে ₹500 আয় করুন | TEAM CCTV",
      description: "প্রতিটি CCTV ফিটিং রেফার করলেই পান ₹500 এবং আপনার বন্ধুর জন্যও ₹500 ছাড়।",
    },
    ml: {
      title: "റഫർ ചെയ്ത് ₹500 നേടൂ | TEAM CCTV",
      description: "നിങ്ങൾ റഫർ ചെയ്യുന്ന ഓരോ CCTV ഫിറ്റിംഗിനും ₹500 നേടൂ; സുഹൃത്തിന് ₹500 ഇളവും.",
    },
    pa: {
      title: "ਰੈਫਰ ਕਰੋ ਤੇ ₹500 ਕਮਾਓ | TEAM CCTV",
      description: "ਹਰ CCTV ਫਿਟਿੰਗ ਰੈਫਰ ਕਰਨ 'ਤੇ ਸਿੱਧੇ ₹500 ਕਮਾਓ ਅਤੇ ਦੋਸਤ ਨੂੰ ਵੀ ₹500 ਦੀ ਛੋਟ।",
    },
    or: {
      title: "ରେଫର୍ କରି ₹500 ରୋଜଗାର କରନ୍ତୁ | TEAM CCTV",
      description: "ପ୍ରତିଟି CCTV ଫିଟିଂ ରେଫର୍ କଲେ ପାଆନ୍ତୁ ₹500 ଏବଂ ବନ୍ଧୁଙ୍କୁ ମଧ୍ୟ ₹500 ରିହାତି।",
    },
  },
  delivery_verify: {
    en: {
      title: "Material Delivery Verification | TEAM CCTV",
      description: "Verify sealed genuine hardware boxes and serial numbers during material delivery.",
    },
    hi: {
      title: "सामान डिलीवरी वेरिफिकेशन | TEAM CCTV",
      description: "डिलीवरी के समय सील पैक असली सामान और सीरियल नंबर कन्फर्म करें।",
    },
    mr: {
      title: "सामान डिलिव्हरी पडताळणी | TEAM CCTV",
      description: "डिलिव्हरीच्या वेळी सीलबंद अस्सल उपकरणे व सीरियल नंबर तपासा.",
    },
    gu: {
      title: "સામાન ડિલિવરી વેરિફિકેશન | TEAM CCTV",
      description: "ડિલિવરી સમયે સીલપેક અસલી સામાન અને સીરિયલ નંબર કન્ફર્મ કરો.",
    },
    ta: {
      title: "பொருள் டெலிவரி சரிபார்ப்பு | TEAM CCTV",
      description: "டெலிவரி நேரத்தில் சீல் செய்யப்பட்ட அசல் பொருட்களையும் சீரியல் எண்களையும் சரிபார்க்கவும்.",
    },
    te: {
      title: "మెటీరియల్ డెలివరీ ధృవీకరణ | TEAM CCTV",
      description: "డెలివరీ సమయంలో సీల్డ్ అసలైన సామాను మరియు సీరియల్ నంబర్లను నిర్ధారించండి.",
    },
    kn: {
      title: "ಸಾಮಗ್ರಿ ಡೆಲಿವರಿ ಪರಿಶೀಲನೆ | TEAM CCTV",
      description: "ಡೆಲಿವರಿ ಸಮಯದಲ್ಲಿ ಸೀಲ್ ಮಾಡಿದ ಅಸಲಿ ಉಪಕರಣಗಳು ಮತ್ತು ಸೀರಿಯಲ್ ಸಂಖ್ಯೆಗಳನ್ನು ದೃಢೀಕರಿಸಿ.",
    },
    bn: {
      title: "মাল ডেলিভারি যাচাই | TEAM CCTV",
      description: "ডেলিভারির সময় সিলপ্যাক আসল যন্ত্রপাতি ও সিরিয়াল নম্বর মিলিয়ে নিশ্চিত করুন।",
    },
    ml: {
      title: "സാധനങ്ങൾ ഡെലിവറി സ്ഥിരീകരണം | TEAM CCTV",
      description: "ഡെലിവറി സമയത്ത് സീൽ ചെയ്ത യഥാർത്ഥ ഉപകരണങ്ങളും സീരിയൽ നമ്പറുകളും ഉറപ്പാക്കുക.",
    },
    pa: {
      title: "ਸਮਾਨ ਡਿਲੀਵਰੀ ਵੈਰੀਫਿਕੇਸ਼ਨ | TEAM CCTV",
      description: "ਡਿਲੀਵਰੀ ਵੇਲੇ ਸੀਲਬੰਦ ਅਸਲੀ ਸਮਾਨ ਅਤੇ ਸੀਰੀਅਲ ਨੰਬਰ ਪੱਕੇ ਕਰੋ।",
    },
    or: {
      title: "ସାମଗ୍ରୀ ଡେଲିଭରି ଯାଞ୍ଚ | TEAM CCTV",
      description: "ଡେଲିଭରି ସମୟରେ ସିଲ୍ ପ୍ୟାକ୍ ପ୍ରକୃତ ସାମଗ୍ରୀ ଏବଂ ସିରିଏଲ୍ ନମ୍ବର ନିଶ୍ଚିତ କରନ୍ତୁ।",
    },
  },
};

export function buildPageMetadata(
  pageKey: CustomerPageSeoKey,
  locale: LocaleCode,
  extra?: Partial<Metadata>
): Metadata {
  const entry = PAGE_SEO_METADATA[pageKey]?.[locale] || PAGE_SEO_METADATA[pageKey].en;
  const ogLocale = (SPEECH_LOCALE_MAP[locale] || "en-IN").replace("-", "_");

  return {
    title: entry.title,
    description: entry.description,
    openGraph: {
      title: entry.title,
      description: entry.description,
      siteName: "CCTVQuotation",
      type: "website",
      locale: ogLocale,
    },
    ...extra,
  };
}

const QUOTE_PREVIEW_TITLE: Record<LocaleCode, string> = {
  en: "CCTV Quote Preview | TEAM CCTV",
  hi: "CCTV कोटेशन प्रीव्यू | TEAM CCTV",
  mr: "CCTV कोटेशन प्रीव्ह्यू | TEAM CCTV",
  gu: "CCTV ક્વોટેશન પ્રિવ્યૂ | TEAM CCTV",
  ta: "CCTV கொட்டேஷன் முன்னோட்டம் | TEAM CCTV",
  te: "CCTV కొటేషన్ ప్రివ్యూ | TEAM CCTV",
  kn: "CCTV ಕೊಟೇಶನ್ ಪೂರ್ವವೀಕ್ಷಣೆ | TEAM CCTV",
  bn: "CCTV কোটেশন প্রিভিউ | TEAM CCTV",
  ml: "CCTV ക്വട്ടേഷൻ പ്രിവ്യൂ | TEAM CCTV",
  pa: "CCTV ਕੋਟੇਸ਼ਨ ਪ੍ਰੀਵਿਊ | TEAM CCTV",
  or: "CCTV କୋଟେସନ୍ ପ୍ରିଭ୍ୟୁ | TEAM CCTV",
};

const QUOTE_REVIEW_TITLE: Record<LocaleCode, string> = {
  en: "Quote Review | TEAM CCTV",
  hi: "कोटेशन समीक्षा | TEAM CCTV",
  mr: "कोटेशन तपासणी | TEAM CCTV",
  gu: "ક્વોટેશન વિગત | TEAM CCTV",
  ta: "கொட்டேஷன் சரிபார்ப்பு | TEAM CCTV",
  te: "కొటేషన్ సమీక్ష | TEAM CCTV",
  kn: "ಕೊಟೇಶನ್ ಪರಿಶೀಲನೆ | TEAM CCTV",
  bn: "কোটেশন পর্যালোচনা | TEAM CCTV",
  ml: "ക്വട്ടേഷൻ അവലോകനം | TEAM CCTV",
  pa: "ਕੋਟੇਸ਼ਨ ਸਮੀਖਿਆ | TEAM CCTV",
  or: "କୋଟେସନ୍ ସମୀକ୍ଷା | TEAM CCTV",
};

const QUOTE_FOR_TITLE: Record<LocaleCode, (name: string) => string> = {
  en: (n) => `Quotation for ${n} | TEAM CCTV`,
  hi: (n) => `${n} के लिए CCTV कोटेशन | TEAM CCTV`,
  mr: (n) => `${n} यांच्यासाठी CCTV कोटेशन | TEAM CCTV`,
  gu: (n) => `${n} માટે CCTV ક્વોટેશન | TEAM CCTV`,
  ta: (n) => `${n} க்கான CCTV கொட்டேஷன் | TEAM CCTV`,
  te: (n) => `${n} కోసం CCTV కొటేషన్ | TEAM CCTV`,
  kn: (n) => `${n} ಅವರಿಗಾಗಿ CCTV ಕೊಟೇಶನ್ | TEAM CCTV`,
  bn: (n) => `${n}-এর জন্য CCTV কোটেশন | TEAM CCTV`,
  ml: (n) => `${n} നുള്ള CCTV ക്വട്ടേഷൻ | TEAM CCTV`,
  pa: (n) => `${n} ਲਈ CCTV ਕੋਟੇਸ਼ਨ | TEAM CCTV`,
  or: (n) => `${n} ଙ୍କ ପାଇଁ CCTV କୋଟେସନ୍ | TEAM CCTV`,
};

const QUOTE_FALLBACK_CLIENT: Record<LocaleCode, string> = {
  en: "Valued Customer",
  hi: "सम्मानित ग्राहक",
  mr: "सन्माननीय ग्राहक",
  gu: "માનનીય ગ્રાહક",
  ta: "மதிப்பிற்குரிய வாடிக்கையாளர்",
  te: "గౌరవనీయ కస్టమర్",
  kn: "ಗೌರವಾನ್ವಿತ ಗ್ರಾಹಕ",
  bn: "সম্মানিত গ্রাহক",
  ml: "ബഹുമാന്യ ഉപഭോക്താവ്",
  pa: "ਸਤਿਕਾਰਯੋਗ ਗਾਹਕ",
  or: "ସମ୍ମାନିତ ଗ୍ରାହକ",
};

const QUOTE_DESC: Record<LocaleCode, string> = {
  en: "Your customized CCTV quotation from TEAM CCTV. Compare brand options with 18% GST & professional installation included.",
  hi: "TEAM CCTV से आपका कस्टमाइज़्ड CCTV कोटेशन। 18% GST और फिटिंग सहित सभी ब्रांड विकल्प देखें।",
  mr: "TEAM CCTV कडून तुमचे कस्टमाइझ्ड CCTV कोटेशन. 18% GST व फिटिंगसह ब्रँड पर्याय पहा.",
  gu: "TEAM CCTV તરફથી તમારું કસ્ટમાઇઝ્ડ CCTV ક્વોટેશન. 18% GST અને ફિટિંગ સાથે બ્રાન્ડ વિકલ્પો જુઓ.",
  ta: "TEAM CCTV-இலிருந்து உங்கள் தனிப்பயன் CCTV கொட்டேஷன். 18% GST மற்றும் ஃபிட்டிங்குடன் பிராண்டுகளை ஒப்பிடுங்கள்.",
  te: "TEAM CCTV నుండి మీ కస్టమైజ్డ్ CCTV కొటేషన్. 18% GST & ఫిట్టింగ్‌తో బ్రాండ్ ఆప్షన్లను చూడండి.",
  kn: "TEAM CCTV ನಿಂದ ನಿಮ್ಮ ಕಸ್ಟಮೈಸ್ಡ್ CCTV ಕೊಟೇಶನ್. 18% GST ಮತ್ತು ಫಿಟ್ಟಿಂಗ್ ಸಹಿತ ಬ್ರ್ಯಾಂಡ್ ಆಯ್ಕೆಗಳನ್ನು ನೋಡಿ.",
  bn: "TEAM CCTV থেকে আপনার কাস্টমাইজড CCTV কোটেশন। 18% GST ও ফিটিংসহ ব্র্যান্ড অপশন দেখুন।",
  ml: "TEAM CCTV-യിൽ നിന്നുള്ള നിങ്ങളുടെ CCTV ക്വട്ടേഷൻ. 18% GST-യും ഫിറ്റിംഗും സഹിതം താരതമ്യം ചെയ്യൂ.",
  pa: "TEAM CCTV ਵੱਲੋਂ ਤੁਹਾਡਾ ਕਸਟਮਾਈਜ਼ਡ CCTV ਕੋਟੇਸ਼ਨ। 18% GST ਅਤੇ ਫਿਟਿੰਗ ਸਮੇਤ ਬ੍ਰਾਂਡ ਦੇਖੋ।",
  or: "TEAM CCTV ରୁ ଆପଣଙ୍କ କଷ୍ଟମାଇଜ୍ଡ୍ CCTV କୋଟେସନ୍। 18% GST ଏବଂ ଫିଟିଂ ସହିତ ବ୍ରାଣ୍ଡ୍ ଦେଖନ୍ତୁ।",
};

export function buildQuotePageMetadata(
  locale: LocaleCode,
  mode: "preview" | "review_fallback" | "named",
  customerName?: string
): Metadata {
  const title =
    mode === "preview"
      ? QUOTE_PREVIEW_TITLE[locale] || QUOTE_PREVIEW_TITLE.en
      : mode === "review_fallback"
        ? QUOTE_REVIEW_TITLE[locale] || QUOTE_REVIEW_TITLE.en
        : (QUOTE_FOR_TITLE[locale] || QUOTE_FOR_TITLE.en)(
            customerName?.trim() || QUOTE_FALLBACK_CLIENT[locale] || QUOTE_FALLBACK_CLIENT.en
          );
  const description = QUOTE_DESC[locale] || QUOTE_DESC.en;
  return { title, description };
}

