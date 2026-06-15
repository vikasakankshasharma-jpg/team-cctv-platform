const fs = require('fs');

const file = 'lib/i18n/translations.ts';
let content = fs.readFileSync(file, 'utf8');

const keysToAdd = [
  'landing_pricing_title',
  'landing_pricing_subtitle',
  'landing_residential_tag',
  'landing_commercial_tag',
  'landing_residential_title',
  'landing_commercial_title',
  'landing_residential_desc',
  'landing_commercial_desc',
  'landing_areas_title',
  'landing_areas_desc',
  'landing_areas_all',
  'landing_final_cta_title',
  'landing_final_cta_desc',
  'landing_hero_highlight',
  'landing_exact_quote',
  'landing_custom_setup',
  'landing_call_support'
];

let typeMatch = content.match(/export type TranslationKey = \n([\s\S]*?);/);
if (typeMatch) {
  let existingKeys = typeMatch[1];
  let newType = existingKeys.trimEnd();
  for (const key of keysToAdd) {
    if (!newType.includes("| '" + key + "'")) {
      newType += "\n  | '" + key + "'";
    }
  }
  content = content.replace(typeMatch[1], newType + '\n');
}

const newTrans = {
  en: {
    landing_pricing_title: '{brand} CCTV Installation Cost in {city}',
    landing_pricing_subtitle: 'Updated transparent pricing for {date}',
    landing_residential_tag: 'Residential',
    landing_commercial_tag: 'Commercial',
    landing_residential_title: 'Standard 4-Camera Setup',
    landing_commercial_title: '8 to 16-Camera Networks',
    landing_residential_desc: 'Perfect for independent houses and small shops. Includes {brand} cameras, DVR, wiring, and professional installation.',
    landing_commercial_desc: 'Ideal for offices, warehouses, and factories in {commercialAreas}. High-definition IP cameras with extended storage.',
    landing_areas_title: 'Areas We Serve in {city}',
    landing_areas_desc: 'Our installation teams are dispatched daily across the entire city. We provide rapid service and maintenance to all major residential and commercial hubs.',
    landing_areas_all: '+ All Surrounding Areas',
    landing_final_cta_title: 'Secure your {city} property today.',
    landing_final_cta_desc: 'Get your exact quote in 2 minutes. 18% GST included. No hidden charges.',
    landing_hero_highlight: 'Across {city}.',
    landing_exact_quote: 'Get Exact Quote →',
    landing_custom_setup: 'Build Custom Setup →',
    landing_call_support: 'Call Local Support'
  },
  hi: {
    landing_pricing_title: '{city} में {brand} CCTV इंस्टॉलेशन की लागत',
    landing_pricing_subtitle: '{date} के लिए अपडेटेड पारदर्शी मूल्य निर्धारण',
    landing_residential_tag: 'आवासीय',
    landing_commercial_tag: 'व्यावसायिक',
    landing_residential_title: 'मानक 4-कैमरा सेटअप',
    landing_commercial_title: '8 से 16-कैमरा नेटवर्क',
    landing_residential_desc: 'स्वतंत्र घरों और छोटी दुकानों के लिए बिल्कुल सही। इसमें {brand} कैमरे, DVR, वायरिंग और पेशेवर इंस्टॉलेशन शामिल हैं।',
    landing_commercial_desc: '{commercialAreas} में कार्यालयों, गोदामों और कारखानों के लिए आदर्श। विस्तारित स्टोरेज वाले हाई-डेफिनिशन IP कैमरे।',
    landing_areas_title: '{city} में हमारे सेवा क्षेत्र',
    landing_areas_desc: 'हमारी इंस्टॉलेशन टीमें प्रतिदिन पूरे शहर में भेजी जाती हैं। हम सभी प्रमुख आवासीय और व्यावसायिक केंद्रों में त्वरित सेवा प्रदान करते हैं।',
    landing_areas_all: '+ सभी आसपास के क्षेत्र',
    landing_final_cta_title: 'आज ही अपनी {city} की संपत्ति सुरक्षित करें।',
    landing_final_cta_desc: '2 मिनट में सटीक कोट प्राप्त करें। 18% GST शामिल। कोई छिपे हुए शुल्क नहीं।',
    landing_hero_highlight: 'पूरे {city} में।',
    landing_exact_quote: 'सटीक कोटेशन प्राप्त करें →',
    landing_custom_setup: 'कस्टम सेटअप बनाएं →',
    landing_call_support: 'लोकल सपोर्ट को कॉल करें'
  },
  mr: {
    landing_pricing_title: '{city} मध्ये {brand} CCTV इन्स्टॉलेशनचा खर्च',
    landing_pricing_subtitle: '{date} साठी अद्यतनित पारदर्शक किंमती',
    landing_residential_tag: 'निवासी',
    landing_commercial_tag: 'व्यावसायिक',
    landing_residential_title: 'मानक 4-कॅमेरा सेटअप',
    landing_commercial_title: '8 ते 16-कॅमेरा नेटवर्क',
    landing_residential_desc: 'स्वतंत्र घरे आणि लहान दुकानांसाठी योग्य. {brand} कॅमेरे, DVR, वायरिंग आणि व्यावसायिक इन्स्टॉलेशन समाविष्ट आहे.',
    landing_commercial_desc: '{commercialAreas} मधील कार्यालये, गोदामे आणि कारखान्यांसाठी आदर्श. विस्तारित स्टोरेजसह हाय-डेफिनिशन IP कॅमेरे.',
    landing_areas_title: '{city} मधील आमचे सेवा क्षेत्र',
    landing_areas_desc: 'आमचे इन्स्टॉलेशन संघ दररोज संपूर्ण शहरात पाठवले जातात. आम्ही सर्व प्रमुख निवासी आणि व्यावसायिक केंद्रांमध्ये त्वरित सेवा प्रदान करतो.',
    landing_areas_all: '+ सर्व आसपासचे क्षेत्र',
    landing_final_cta_title: 'आजच तुमची {city} मधील मालमत्ता सुरक्षित करा.',
    landing_final_cta_desc: '2 मिनिटांत अचूक कोट मिळवा. 18% GST समाविष्ट. कोणतेही छुपे शुल्क नाही.',
    landing_hero_highlight: 'संपूर्ण {city} मध्ये.',
    landing_exact_quote: 'अचूक कोटेशन मिळवा →',
    landing_custom_setup: 'कस्टम सेटअप तयार करा →',
    landing_call_support: 'लोकल सपोर्टला कॉल करा'
  },
  gu: {
    landing_pricing_title: '{city} માં {brand} CCTV ઇન્સ્ટોલેશનનો ખર્ચ',
    landing_pricing_subtitle: '{date} માટે અપડેટ થયેલ પારદર્શક કિંમતો',
    landing_residential_tag: 'રહેણાંક',
    landing_commercial_tag: 'વ્યાવસાયિક',
    landing_residential_title: 'સ્ટાન્ડર્ડ 4-કેમેરા સેટઅપ',
    landing_commercial_title: '8 થી 16-કેમેરા નેટવર્ક',
    landing_residential_desc: 'સ્વતંત્ર ઘરો અને નાની દુકાનો માટે પરફેક્ટ. {brand} કેમેરા, DVR, વાયરિંગ અને પ્રોફેશનલ ઇન્સ્ટોલેશન શામેલ છે.',
    landing_commercial_desc: '{commercialAreas} માં ઓફિસો, વેરહાઉસ અને ફેક્ટરીઓ માટે આદર્શ.',
    landing_areas_title: '{city} માં અમારા સેવા વિસ્તારો',
    landing_areas_desc: 'અમારી ઇન્સ્ટોલેશન ટીમો દરરોજ સમગ્ર શહેરમાં મોકલવામાં આવે છે.',
    landing_areas_all: '+ આસપાસના તમામ વિસ્તારો',
    landing_final_cta_title: 'આજે જ તમારી {city} ની મિલકત સુરક્ષિત કરો.',
    landing_final_cta_desc: '2 મિનિટમાં ચોક્કસ ક્વોટ મેળવો. 18% GST શામેલ છે.',
    landing_hero_highlight: 'સમગ્ર {city} માં.',
    landing_exact_quote: 'ચોક્કસ ક્વોટેશન મેળવો →',
    landing_custom_setup: 'કસ્ટમ સેટઅપ બનાવો →',
    landing_call_support: 'લોકલ સપોર્ટને કૉલ કરો'
  },
  ta: {
    landing_pricing_title: '{city}-ல் {brand} CCTV நிறுவல் செலவு',
    landing_pricing_subtitle: '{date} க்கான புதுப்பிக்கப்பட்ட விலைகள்',
    landing_residential_tag: 'குடியிருப்பு',
    landing_commercial_tag: 'வணிகம்',
    landing_residential_title: 'ஸ்டாண்டர்ட் 4-கேமரா செட்டப்',
    landing_commercial_title: '8 முதல் 16-கேமரா நெட்வொர்க்குகள்',
    landing_residential_desc: 'தனி வீடுகள் மற்றும் சிறிய கடைகளுக்கு சிறந்தது. {brand} கேமராக்கள், DVR, வயரிங் மற்றும் தொழில்முறை நிறுவல் ஆகியவை அடங்கும்.',
    landing_commercial_desc: '{commercialAreas}-ல் உள்ள அலுவலகங்கள், கிடங்குகள் மற்றும் தொழிற்சாலைகளுக்கு சிறந்தது. விரிவாக்கப்பட்ட சேமிப்பகத்துடன் கூடிய உயர் வரையறை IP கேமராக்கள்.',
    landing_areas_title: '{city}-ல் எங்கள் சேவை பகுதிகள்',
    landing_areas_desc: 'எங்கள் நிறுவல் குழுக்கள் தினமும் நகரம் முழுவதும் அனுப்பப்படுகின்றன. அனைத்து முக்கிய குடியிருப்பு மற்றும் வணிக மையங்களுக்கும் நாங்கள் விரைவான சேவை மற்றும் பராமரிப்பை வழங்குகிறோம்.',
    landing_areas_all: '+ சுற்றியுள்ள அனைத்து பகுதிகளும்',
    landing_final_cta_title: 'உங்கள் {city} சொத்தை இன்றே பாதுகாக்கவும்.',
    landing_final_cta_desc: '2 நிமிடங்களில் உங்கள் சரியான மேற்கோளைப் பெறுங்கள். 18% ஜிஎஸ்டி சேர்க்கப்பட்டுள்ளது. மறைக்கப்பட்ட கட்டணங்கள் எதுவும் இல்லை.',
    landing_hero_highlight: '{city} முழுவதும்.',
    landing_exact_quote: 'சரியான மேற்கோளைப் பெறுங்கள் →',
    landing_custom_setup: 'விருப்ப அமைப்பை உருவாக்குங்கள் →',
    landing_call_support: 'உள்ளூர் ஆதரவை அழைக்கவும்'
  },
  te: {
    landing_pricing_title: '{city} లో {brand} CCTV ఇన్‌స్టాలేషన్ ఖర్చు',
    landing_pricing_subtitle: '{date} కోసం నవీకరించబడిన పారదర్శక ధరలు',
    landing_residential_tag: 'నివాస',
    landing_commercial_tag: 'వాణిజ్య',
    landing_residential_title: 'స్టాండర్డ్ 4-కెమెరా సెటప్',
    landing_commercial_title: '8 నుండి 16-కెమెరా నెట్‌వర్క్‌లు',
    landing_residential_desc: 'స్వతంత్ర ఇళ్ళు మరియు చిన్న దుకాణాలకు పర్ఫెక్ట్. ఇందులో {brand} కెమెరాలు, DVR, వైరింగ్ మరియు ప్రొఫెషనల్ ఇన్‌స్టాలేషన్ ఉన్నాయి.',
    landing_commercial_desc: '{commercialAreas} లోని కార్యాలయాలు, గిడ్డంగులు మరియు కర్మాగారాలకు అనువైనది. విస్తరించిన నిల్వతో హై-డెఫినిషన్ IP కెమెరాలు.',
    landing_areas_title: '{city} లో మా సేవా ప్రాంతాలు',
    landing_areas_desc: 'మా ఇన్‌స్టాలేషన్ బృందాలు ప్రతిరోజూ నగరమంతటా పంపబడతాయి. మేము అన్ని ప్రధాన నివాస మరియు వాణిజ్య కేంద్రాలకు వేగవంతమైన సేవ మరియు నిర్వహణను అందిస్తాము.',
    landing_areas_all: '+ చుట్టుపక్కల అన్ని ప్రాంతాలు',
    landing_final_cta_title: 'మీ {city} ఆస్తిని ఈరోజే సురక్షితం చేసుకోండి.',
    landing_final_cta_desc: '2 నిమిషాల్లో ఖచ్చితమైన కొటేషన్ పొందండి. 18% GST చేర్చబడింది. ఎలాంటి దాచిన ఛార్జీలు లేవు.',
    landing_hero_highlight: '{city} అంతటా.',
    landing_exact_quote: 'ఖచ్చితమైన కొటేషన్ పొందండి →',
    landing_custom_setup: 'కస్టమ్ సెటప్ చేయండి →',
    landing_call_support: 'స్థానిక మద్దతుకు కాల్ చేయండి'
  },
  kn: {
    landing_pricing_title: '{city} ನಲ್ಲಿ {brand} CCTV ಅಳವಡಿಕೆ ವೆಚ್ಚ',
    landing_pricing_subtitle: '{date} ಗಾಗಿ ನವೀಕರಿಸಿದ ಬೆಲೆಗಳು',
    landing_residential_tag: 'ವಸತಿ',
    landing_commercial_tag: 'ವಾಣಿಜ್ಯ',
    landing_residential_title: 'ಸ್ಟ್ಯಾಂಡರ್ಡ್ 4-ಕ್ಯಾಮೆರಾ ಸೆಟಪ್',
    landing_commercial_title: '8 ರಿಂದ 16-ಕ್ಯಾಮೆರಾ ನೆಟ್‌ವರ್ಕ್‌ಗಳು',
    landing_residential_desc: 'ಸ್ವತಂತ್ರ ಮನೆಗಳು ಮತ್ತು ಸಣ್ಣ ಅಂಗಡಿಗಳಿಗೆ ಸೂಕ್ತವಾಗಿದೆ.',
    landing_commercial_desc: '{commercialAreas} ನಲ್ಲಿನ ಕಚೇರಿಗಳು ಮತ್ತು ಕಾರ್ಖಾನೆಗಳಿಗೆ ಸೂಕ್ತವಾಗಿದೆ.',
    landing_areas_title: '{city} ನಲ್ಲಿ ನಮ್ಮ ಸೇವಾ ಪ್ರದೇಶಗಳು',
    landing_areas_desc: 'ನಮ್ಮ ತಂಡಗಳು ಪ್ರತಿದಿನ ನಗರದಾದ್ಯಂತ ಸೇವೆಗಳನ್ನು ಒದಗಿಸುತ್ತವೆ.',
    landing_areas_all: '+ ಸುತ್ತಮುತ್ತಲಿನ ಎಲ್ಲಾ ಪ್ರದೇಶಗಳು',
    landing_final_cta_title: 'ಇಂದೇ ನಿಮ್ಮ {city} ಆಸ್ತಿಯನ್ನು ಸುರಕ್ಷಿತಗೊಳಿಸಿ.',
    landing_final_cta_desc: '2 ನಿಮಿಷಗಳಲ್ಲಿ ನಿಖರವಾದ ಉಲ್ಲೇಖವನ್ನು ಪಡೆಯಿರಿ.',
    landing_hero_highlight: '{city} ನಾದ್ಯಂತ.',
    landing_exact_quote: 'ನಿಖರವಾದ ಉಲ್ಲೇಖವನ್ನು ಪಡೆಯಿರಿ →',
    landing_custom_setup: 'ಕಸ್ಟಮ್ ಸೆಟಪ್ ರಚಿಸಿ →',
    landing_call_support: 'ಸ್ಥಳೀಯ ಬೆಂಬಲಕ್ಕೆ ಕರೆ ಮಾಡಿ'
  },
  bn: {
    landing_pricing_title: '{city} তে {brand} CCTV ইনস্টলেশনের খরচ',
    landing_pricing_subtitle: '{date} এর জন্য আপডেট করা দাম',
    landing_residential_tag: 'আবাসিক',
    landing_commercial_tag: 'বাণিজ্যিক',
    landing_residential_title: 'স্ট্যান্ডার্ড ৪-ক্যামেরা সেটআপ',
    landing_commercial_title: '৮ থেকে ১৬-ক্যামেরা নেটওয়ার্ক',
    landing_residential_desc: 'স্বাধীন বাড়ি এবং ছোট দোকানের জন্য উপযুক্ত।',
    landing_commercial_desc: '{commercialAreas}-এ অফিস এবং কারখানার জন্য আদর্শ।',
    landing_areas_title: '{city} তে আমাদের পরিষেবা এলাকা',
    landing_areas_desc: 'আমাদের দলগুলি প্রতিদিন শহর জুড়ে পরিষেবা প্রদান করে।',
    landing_areas_all: '+ সমস্ত আশেপাশের এলাকা',
    landing_final_cta_title: 'আজই আপনার {city} এর সম্পত্তি সুরক্ষিত করুন।',
    landing_final_cta_desc: '২ মিনিটে সঠিক কোটেশন পান।',
    landing_hero_highlight: '{city} জুড়ে।',
    landing_exact_quote: 'সঠিক কোটেশন পান →',
    landing_custom_setup: 'কাস্টম সেটআপ তৈরি করুন →',
    landing_call_support: 'স্থানীয় সহায়তায় কল করুন'
  },
  ml: {
    landing_pricing_title: '{city}-ൽ {brand} CCTV ഇൻസ്റ്റാളേഷൻ ചെലവ്',
    landing_pricing_subtitle: '{date}-നുള്ള വിലകൾ',
    landing_residential_tag: 'റെസിഡൻഷ്യൽ',
    landing_commercial_tag: 'കൊമേഴ്സ്യൽ',
    landing_residential_title: 'സ്റ്റാൻഡേർഡ് 4-ക്യാമറ സെറ്റപ്പ്',
    landing_commercial_title: '8 മുതൽ 16-ക്യാമറ നെറ്റ്‌വർക്കുകൾ',
    landing_residential_desc: 'വീടുകൾക്കും ചെറിയ കടകൾക്കും അനുയോജ്യം.',
    landing_commercial_desc: '{commercialAreas}-ലെ ഓഫീസുകൾക്കും ഫാക്ടറികൾക്കും അനുയോജ്യം.',
    landing_areas_title: '{city}-ലെ ഞങ്ങളുടെ സേവന മേഖലകൾ',
    landing_areas_desc: 'ഞങ്ങളുടെ ടീമുകൾ നഗരത്തിലുടനീളം സേവനങ്ങൾ നൽകുന്നു.',
    landing_areas_all: '+ ചുറ്റുമുള്ള എല്ലാ പ്രദേശങ്ങളും',
    landing_final_cta_title: 'ഇന്ന് തന്നെ നിങ്ങളുടെ {city} പ്രോപ്പർട്ടി സുരക്ഷിതമാക്കുക.',
    landing_final_cta_desc: '2 മിനിറ്റിനുള്ളിൽ കൃത്യമായ കൊട്ടേഷൻ നേടുക.',
    landing_hero_highlight: '{city}-ൽ ഉടനീളം.',
    landing_exact_quote: 'കൃത്യമായ കൊട്ടേഷൻ നേടുക →',
    landing_custom_setup: 'കസ്റ്റം സെറ്റപ്പ് സൃഷ്ടിക്കുക →',
    landing_call_support: 'ലോക്കൽ സപ്പോർട്ടിലേക്ക് വിളിക്കുക'
  },
  pa: {
    landing_pricing_title: '{city} ਵਿੱਚ {brand} CCTV ਇੰਸਟਾਲੇਸ਼ਨ ਦੀ ਲਾਗਤ',
    landing_pricing_subtitle: '{date} ਲਈ ਅੱਪਡੇਟ ਕੀਤੀਆਂ ਕੀਮਤਾਂ',
    landing_residential_tag: 'ਰਿਹਾਇਸ਼ੀ',
    landing_commercial_tag: 'ਵਪਾਰਕ',
    landing_residential_title: 'ਸਟੈਂਡਰਡ 4-ਕੈਮਰਾ ਸੈੱਟਅੱਪ',
    landing_commercial_title: '8 ਤੋਂ 16-ਕੈਮਰਾ ਨੈੱਟਵਰਕ',
    landing_residential_desc: 'ਘਰਾਂ ਅਤੇ ਛੋਟੀਆਂ ਦੁਕਾਨਾਂ ਲਈ ਬਿਲਕੁਲ ਸਹੀ।',
    landing_commercial_desc: '{commercialAreas} ਵਿੱਚ ਦਫ਼ਤਰਾਂ ਅਤੇ ਫੈਕਟਰੀਆਂ ਲਈ ਆਦਰਸ਼।',
    landing_areas_title: '{city} ਵਿੱਚ ਸਾਡੇ ਸੇਵਾ ਖੇਤਰ',
    landing_areas_desc: 'ਸਾਡੀਆਂ ਟੀਮਾਂ ਰੋਜ਼ਾਨਾ ਪੂਰੇ ਸ਼ਹਿਰ ਵਿੱਚ ਸੇਵਾਵਾਂ ਪ੍ਰਦਾਨ ਕਰਦੀਆਂ ਹਨ।',
    landing_areas_all: '+ ਆਲੇ-ਦੁਆਲੇ ਦੇ ਸਾਰੇ ਖੇਤਰ',
    landing_final_cta_title: 'ਅੱਜ ਹੀ ਆਪਣੀ {city} ਦੀ ਜਾਇਦਾਦ ਨੂੰ ਸੁਰੱਖਿਅਤ ਕਰੋ।',
    landing_final_cta_desc: '2 ਮਿੰਟਾਂ ਵਿੱਚ ਸਹੀ ਕੋਟੇਸ਼ਨ ਪ੍ਰਾਪਤ ਕਰੋ।',
    landing_hero_highlight: 'ਪੂਰੇ {city} ਵਿੱਚ।',
    landing_exact_quote: 'ਸਹੀ ਕੋਟੇਸ਼ਨ ਪ੍ਰਾਪਤ ਕਰੋ →',
    landing_custom_setup: 'ਕਸਟਮ ਸੈੱਟਅੱਪ ਬਣਾਓ →',
    landing_call_support: 'ਲੋਕਲ ਸਪੋਰਟ ਨੂੰ ਕਾਲ ਕਰੋ'
  },
  or: {
    landing_pricing_title: '{city} ରେ {brand} CCTV ଇନଷ୍ଟଲେସନ୍ ଖର୍ଚ୍ଚ',
    landing_pricing_subtitle: '{date} ପାଇଁ ଅପଡେଟ୍ ହୋଇଥିବା ଦର',
    landing_residential_tag: 'ଆବାସିକ',
    landing_commercial_tag: 'ବାଣିଜ୍ୟିକ',
    landing_residential_title: 'ଷ୍ଟାଣ୍ଡାର୍ଡ 4-କ୍ୟାମେରା ସେଟଅପ୍',
    landing_commercial_title: '8 ରୁ 16-କ୍ୟାମେରା ନେଟୱାର୍କ',
    landing_residential_desc: 'ଘର ଏବଂ ଛୋଟ ଦୋକାନ ପାଇଁ ଉପଯୁକ୍ତ।',
    landing_commercial_desc: '{commercialAreas} ରେ ଥିବା ଅଫିସ୍ ଏବଂ କାରଖାନା ପାଇଁ ଆଦର୍ଶ।',
    landing_areas_title: '{city} ରେ ଆମର ସେବା ଅଞ୍ଚଳ',
    landing_areas_desc: 'ଆମର ଦଳ ପ୍ରତିଦିନ ସହର ସାରା ସେବା ପ୍ରଦାନ କରନ୍ତି।',
    landing_areas_all: '+ ଆଖପାଖର ସମସ୍ତ ଅଞ୍ଚଳ',
    landing_final_cta_title: 'ଆଜି ହିଁ ଆପଣଙ୍କର {city} ସମ୍ପତ୍ତି ସୁରକ୍ଷିତ କରନ୍ତୁ।',
    landing_final_cta_desc: '2 ମିନିଟରେ ସଠିକ୍ କୋଟେସନ୍ ପାଆନ୍ତୁ।',
    landing_hero_highlight: 'ସମଗ୍ର {city} ରେ।',
    landing_exact_quote: 'ସଠିକ୍ କୋଟେସନ୍ ପାଆନ୍ତୁ →',
    landing_custom_setup: 'କଷ୍ଟମ୍ ସେଟଅପ୍ କରନ୍ତୁ →',
    landing_call_support: 'ଲୋକାଲ୍ ସପୋର୍ଟକୁ କଲ୍ କରନ୍ତୁ'
  }
};

for (const lang of Object.keys(newTrans)) {
  for (const [key, value] of Object.entries(newTrans[lang])) {
    const regex = new RegExp(`(${lang}:\\s*{[\\s\\S]*?)(})`);
    content = content.replace(regex, (match, p1, p2) => {
      if (p1.includes(key + ':')) return match;
      return p1.trimEnd() + `,\\n    ${key}: '${value}'\\n  ` + p2;
    });
  }
}

fs.writeFileSync(file, content);
console.log("Translations updated");
