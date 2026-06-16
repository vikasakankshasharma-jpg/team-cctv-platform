const fs = require('fs');
const path = require('path');

const file = path.join('c:/Users/hp/Documents/TEAM Website/secure-easy/lib/i18n/translations.ts');
let content = fs.readFileSync(file, 'utf8');

const additionsEn = `
    how_it_works: "How It Works",
    easy_security: "Easy Security For Everyone.",
    perfect_coverage: "Perfect Coverage",
    perfect_coverage_desc: "We make sure every corner of your property is covered, leaving no blind spots for complete peace of mind.",
    right_cameras: "Right Cameras",
    right_cameras_desc: "We'll suggest the best camera technology for your specific needs, whether it's a small home or a large warehouse.",
    clear_pricing: "Clear Pricing",
    clear_pricing_desc: "Get three easy-to-understand price options (Value, Professional, and Elite) so you can choose what fits your budget.",
    trusted_partners: "Trusted Hardware Partners & Verified Installs",
    preferred_platform: "India's Preferred CCTV Platform | 500+ Properties Secured",
    landing_secure_space: "Secure your space",
    landing_today: "today.",
    landing_setup_subtitle: "2-minute setup. No hidden costs. 18% GST included in all plans.",
    faq_title: "Frequently Asked Questions",
    faq_subtitle: "Support & Clarification",
    faq_1_q: "Is GST included in the quote price?",
    faq_1_a: "Yes. All CCTVQuotation quotations include 18% GST with no hidden charges. The price covers cameras, DVR/NVR, HDD, cabling, and professional installation — everything.",
    faq_2_q: "Does the price include installation?",
    faq_2_a: "Yes. Every quotation includes full professional installation — camera mounting, cable routing, DVR/NVR setup, mobile app configuration on your phone, and a complete system demonstration.",
    faq_3_q: "How much does a 4-camera CCTV system cost in Jaipur?",
    faq_3_a: "A CP Plus HD 4-camera system starts at ₹18,000–₹28,000. An IP (NVR) system starts at ₹35,000–₹55,000. A 4K system starts at ₹55,000–₹85,000. All prices include GST and installation.",
    faq_4_q: "Are your cameras BIS-ER compliant?",
    faq_4_a: "Yes. We install CP Plus and Prama cameras which carry BIS-ER certification — suitable for government tenders, housing societies, and commercial projects.",
    footer_desc: "India's leading intelligent security planning ecosystem. We combine advanced hardware logic with certified human expertise.",
    footer_secure: "Secure & Verified Platform",
    footer_serving: "Serving all of India",
    footer_privacy: "Privacy Policy",
    footer_terms: "Terms of Service",
    footer_partner: "Partner Login"
`;

const additionsHi = `
    how_it_works: "यह कैसे काम करता है",
    easy_security: "सभी के लिए आसान सुरक्षा।",
    perfect_coverage: "संपूर्ण कवरेज",
    perfect_coverage_desc: "हम सुनिश्चित करते हैं कि आपकी संपत्ति का हर कोना कवर हो, जिससे मन की पूर्ण शांति के लिए कोई अंधा स्थान न रहे।",
    right_cameras: "सही कैमरे",
    right_cameras_desc: "हम आपकी विशिष्ट आवश्यकताओं के लिए सर्वोत्तम कैमरा तकनीक का सुझाव देंगे, चाहे वह छोटा घर हो या बड़ा गोदाम।",
    clear_pricing: "पारदर्शी मूल्य निर्धारण",
    clear_pricing_desc: "तीन समझने में आसान मूल्य विकल्प (वैल्यू, प्रोफेशनल और एलीट) प्राप्त करें ताकि आप अपना बजट चुन सकें।",
    trusted_partners: "विश्वसनीय हार्डवेयर भागीदार और सत्यापित इंस्टॉलेशन",
    preferred_platform: "भारत का पसंदीदा CCTV प्लेटफ़ॉर्म | 500+ संपत्तियां सुरक्षित",
    landing_secure_space: "अपनी जगह सुरक्षित करें",
    landing_today: "आज ही।",
    landing_setup_subtitle: "2 मिनट का सेटअप। कोई छिपी लागत नहीं। सभी प्लान में 18% GST शामिल।",
    faq_title: "अक्सर पूछे जाने वाले प्रश्न",
    faq_subtitle: "समर्थन और स्पष्टीकरण",
    faq_1_q: "क्या कोट मूल्य में GST शामिल है?",
    faq_1_a: "हाँ। सभी CCTVQuotation कोटेशन में 18% GST शामिल है और कोई छिपी हुई लागत नहीं है। मूल्य में कैमरे, DVR/NVR, HDD, केबलिंग और व्यावसायिक इंस्टॉलेशन — सब कुछ शामिल है।",
    faq_2_q: "क्या मूल्य में इंस्टॉलेशन शामिल है?",
    faq_2_a: "हाँ। हर कोटेशन में पूर्ण व्यावसायिक इंस्टॉलेशन शामिल है — कैमरा माउंटिंग, केबल रूटिंग, DVR/NVR सेटअप, आपके फोन पर मोबाइल ऐप कॉन्फ़िगरेशन, और एक पूर्ण सिस्टम प्रदर्शन।",
    faq_3_q: "जयपुर में 4-कैमरा CCTV सिस्टम की कीमत कितनी है?",
    faq_3_a: "CP Plus HD 4-कैमरा सिस्टम ₹18,000–₹28,000 से शुरू होता है। IP (NVR) सिस्टम ₹35,000–₹55,000 से शुरू होता है। 4K सिस्टम ₹55,000–₹85,000 से शुरू होता है। सभी कीमतों में GST और इंस्टॉलेशन शामिल हैं।",
    faq_4_q: "क्या आपके कैमरे BIS-ER कंप्लायंट हैं?",
    faq_4_a: "हाँ। हम CP Plus और Prama कैमरे स्थापित करते हैं जो BIS-ER प्रमाणन रखते हैं — सरकारी निविदाओं, हाउसिंग सोसाइटी और व्यावसायिक परियोजनाओं के लिए उपयुक्त।",
    footer_desc: "भारत का अग्रणी बुद्धिमान सुरक्षा योजना इकोसिस्टम। हम प्रमाणित मानवीय विशेषज्ञता के साथ उन्नत हार्डवेयर तर्क को जोड़ते हैं।",
    footer_secure: "सुरक्षित और सत्यापित प्लेटफ़ॉर्म",
    footer_serving: "संपूर्ण भारत में सेवा दे रहे हैं",
    footer_privacy: "गोपनीयता नीति",
    footer_terms: "सेवा की शर्तें",
    footer_partner: "पार्टनर लॉगिन"
`;

const additionsMr = `
    how_it_works: "हे कसे कार्य करते",
    easy_security: "सर्वांसाठी सोपी सुरक्षा.",
    perfect_coverage: "परिपूर्ण कव्हरेज",
    perfect_coverage_desc: "आम्ही तुमच्या मालमत्तेचा प्रत्येक कोपरा कव्हर केला आहे याची खात्री करतो, ज्यामुळे मनःशांतीसाठी कोणतीही अंधुक जागा उरत नाही.",
    right_cameras: "योग्य कॅमेरे",
    right_cameras_desc: "तुमच्या विशिष्ट गरजांसाठी आम्ही सर्वोत्तम कॅमेरा तंत्रज्ञान सुचवू, मग ते लहान घर असो वा मोठे गोदाम.",
    clear_pricing: "पारदर्शक किंमती",
    clear_pricing_desc: "तीन समजण्यास सोपे किंमत पर्याय (व्हॅल्यू, प्रोफेशनल आणि एलिट) मिळवा जेणेकरून तुम्ही तुमच्या बजेटनुसार निवड करू शकाल.",
    trusted_partners: "विश्वसनीय हार्डवेअर भागीदार आणि सत्यापित इन्स्टॉलेशन्स",
    preferred_platform: "भारताचे पसंतीचे CCTV प्लॅटफॉर्म | 500+ मालमत्ता सुरक्षित",
    landing_secure_space: "तुमची जागा सुरक्षित करा",
    landing_today: "आजच.",
    landing_setup_subtitle: "2-मिनिटांचा सेटअप. कोणतेही छुपे खर्च नाहीत. सर्व प्लान्समध्ये 18% GST समाविष्ट आहे.",
    faq_title: "वारंवार विचारले जाणारे प्रश्न",
    faq_subtitle: "सपोर्ट आणि स्पष्टीकरण",
    faq_1_q: "कोट किंमतीत GST समाविष्ट आहे का?",
    faq_1_a: "होय. सर्व CCTVQuotation कोटेशन्समध्ये कोणत्याही छुप्या शुल्काशिवाय 18% GST समाविष्ट आहे. किंमतीमध्ये कॅमेरे, DVR/NVR, HDD, केबलिंग आणि व्यावसायिक इन्स्टॉलेशन — सर्वकाही समाविष्ट आहे.",
    faq_2_q: "किंमतीत इन्स्टॉलेशन समाविष्ट आहे का?",
    faq_2_a: "होय. प्रत्येक कोटेशनमध्ये पूर्ण व्यावसायिक इन्स्टॉलेशन समाविष्ट आहे — कॅमेरा माउंटिंग, केबल राउटिंग, DVR/NVR सेटअप, तुमच्या फोनवर मोबाइल ॲप कॉन्फिगरेशन आणि संपूर्ण प्रणालीचे प्रात्यक्षिक.",
    faq_3_q: "जयपूरमध्ये 4-कॅमेरा CCTV सिस्टीमची किंमत किती आहे?",
    faq_3_a: "CP Plus HD 4-कॅमेरा सिस्टीम ₹18,000–₹28,000 पासून सुरू होते. IP (NVR) सिस्टीम ₹35,000–₹55,000 पासून सुरू होते. 4K सिस्टीम ₹55,000–₹85,000 पासून सुरू होते. सर्व किंमतींमध्ये GST आणि इन्स्टॉलेशन समाविष्ट आहे.",
    faq_4_q: "तुमचे कॅमेरे BIS-ER प्रमाणित आहेत का?",
    faq_4_a: "होय. आम्ही CP Plus आणि Prama कॅमेरे इन्स्टॉल करतो ज्यांना BIS-ER प्रमाणपत्र आहे — सरकारी निविदा, हाउसिंग सोसायट्या आणि व्यावसायिक प्रकल्पांसाठी योग्य.",
    footer_desc: "भारतातील आघाडीची बुद्धिमान सुरक्षा नियोजन इकोसिस्टम. आम्ही प्रमाणित मानवी कौशल्यासह प्रगत हार्डवेअर लॉजिकची जोड देतो.",
    footer_secure: "सुरक्षित आणि सत्यापित प्लॅटफॉर्म",
    footer_serving: "संपूर्ण भारतात सेवा देत आहोत",
    footer_privacy: "गोपनीयता धोरण",
    footer_terms: "सेवा अटी",
    footer_partner: "पार्टनर लॉगिन"
`;

const additionsGu = `
    how_it_works: "આ કેવી રીતે કામ કરે છે",
    easy_security: "બધા માટે સરળ સુરક્ષા.",
    perfect_coverage: "સંપૂર્ણ કવરેજ",
    perfect_coverage_desc: "અમે ખાતરી કરીએ છીએ કે તમારી મિલકતનો દરેક ખૂણો આવરી લેવામાં આવ્યો છે, જેથી માનસિક શાંતિ માટે કોઈ અંધારા સ્થાનો રહે નહીં.",
    right_cameras: "યોગ્ય કેમેરા",
    right_cameras_desc: "અમે તમારી ચોક્કસ જરૂરિયાતો માટે શ્રેષ્ઠ કેમેરા ટેક્નોલોજી સૂચવીશું, ભલે તે નાનું ઘર હોય કે મોટું ગોડાઉન.",
    clear_pricing: "પારદર્શક કિંમતો",
    clear_pricing_desc: "ત્રણ સમજવા માટે સરળ કિંમતના વિકલ્પો (વેલ્યુ, પ્રોફેશનલ અને એલિટ) મેળવો જેથી તમે તમારા બજેટને અનુરૂપ પસંદગી કરી શકો.",
    trusted_partners: "વિશ્વસનીય હાર્ડવેર ભાગીદારો અને ચકાસાયેલ ઇન્સ્ટોલેશન્સ",
    preferred_platform: "ભારતનું પસંદગીનું CCTV પ્લેટફોર્મ | 500+ મિલકતો સુરક્ષિત",
    landing_secure_space: "તમારી જગ્યા સુરક્ષિત કરો",
    landing_today: "આજે જ.",
    landing_setup_subtitle: "2-મિનિટનું સેટઅપ. કોઈ છુપાયેલા ખર્ચ નથી. તમામ પ્લાનમાં 18% GST સામેલ છે.",
    faq_title: "વારંવાર પૂછાતા પ્રશ્નો",
    faq_subtitle: "સપોર્ટ અને સ્પષ્ટતા",
    faq_1_q: "શું કિંમતમાં GST સામેલ છે?",
    faq_1_a: "હા. તમામ CCTVQuotation ક્વોટેશનમાં 18% GST સામેલ છે અને કોઈ છુપાયેલા ખર્ચ નથી. કિંમતમાં કેમેરા, DVR/NVR, HDD, કેબલિંગ અને પ્રોફેશનલ ઇન્સ્ટોલેશન — બધું જ સામેલ છે.",
    faq_2_q: "શું કિંમતમાં ઇન્સ્ટોલેશન સામેલ છે?",
    faq_2_a: "હા. દરેક ક્વોટેશનમાં સંપૂર્ણ પ્રોફેશનલ ઇન્સ્ટોલેશન સામેલ છે — કેમેરા માઉન્ટિંગ, કેબલ રૂટિંગ, DVR/NVR સેટઅપ, તમારા ફોન પર મોબાઇલ એપ્લિકેશન ગોઠવણી અને સંપૂર્ણ સિસ્ટમ પ્રદર્શન.",
    faq_3_q: "જયપુરમાં 4-કેમેરા CCTV સિસ્ટમનો ખર્ચ કેટલો છે?",
    faq_3_a: "CP Plus HD 4-કેમેરા સિસ્ટમ ₹18,000–₹28,000 થી શરૂ થાય છે. IP (NVR) સિસ્ટમ ₹35,000–₹55,000 થી શરૂ થાય છે. 4K સિસ્ટમ ₹55,000–₹85,000 થી શરૂ થાય છે. તમામ કિંમતોમાં GST અને ઇન્સ્ટોલેશન સામેલ છે.",
    faq_4_q: "શું તમારા કેમેરા BIS-ER પ્રમાણિત છે?",
    faq_4_a: "હા. અમે CP Plus અને Prama કેમેરા ઇન્સ્ટોલ કરીએ છીએ જે BIS-ER પ્રમાણપત્ર ધરાવે છે — સરકારી ટેન્ડર, હાઉસિંગ સોસાયટીઓ અને વાણિજ્યિક પ્રોજેક્ટ્સ માટે યોગ્ય.",
    footer_desc: "ભારતની અગ્રણી ઇન્ટેલિજન્ટ સિક્યુરિટી પ્લાનિંગ ઇકોસિસ્ટમ. અમે પ્રમાણિત માનવીય કુશળતા સાથે અદ્યતન હાર્ડવેર લોજિકને જોડીએ છીએ.",
    footer_secure: "સુરક્ષિત અને ચકાસાયેલ પ્લેટફોર્મ",
    footer_serving: "સમગ્ર ભારતમાં સેવા આપી રહ્યા છીએ",
    footer_privacy: "ગોપનીયતા નીતિ",
    footer_terms: "સેવાની શરતો",
    footer_partner: "પાર્ટનર લોગિન"
`;

const replaceLastOccurrence = (str, search, replacement) => {
    const lastIndex = str.lastIndexOf(search);
    if (lastIndex === -1) return str;
    return str.substring(0, lastIndex) + replacement + str.substring(lastIndex + search.length);
};

// Add types
const newTypes = `
  | "faq_title"
  | "faq_subtitle"
  | "faq_1_q"
  | "faq_1_a"
  | "faq_2_q"
  | "faq_2_a"
  | "faq_3_q"
  | "faq_3_a"
  | "faq_4_q"
  | "faq_4_a"
  | "footer_desc"
  | "footer_secure"
  | "footer_serving"
  | "footer_privacy"
  | "footer_terms"
  | "footer_partner";`;

if (!content.includes('faq_title')) {
  content = replaceLastOccurrence(content, 'fopt_amc_no";', 'fopt_amc_no"' + newTypes);

  content = content.replace(/fopt_amc_no: "No, I will manage it myself"(\\r?\\n)\\s*\\},/g, 'fopt_amc_no: "No, I will manage it myself",\\n' + additionsEn + '\\n  },');
  content = content.replace(/fopt_amc_no: "नहीं, मैं खुद संभाल लूंगा"(\\r?\\n)\\s*\\},/g, 'fopt_amc_no: "नहीं, मैं खुद संभाल लूंगा",\\n' + additionsHi + '\\n  },');
  content = content.replace(/fopt_amc_no: "नाही, मी स्वतः व्यवस्थापन करेन"(\\r?\\n)\\s*\\},/g, 'fopt_amc_no: "नाही, मी स्वतः व्यवस्थापन करेन",\\n' + additionsMr + '\\n  },');
  content = content.replace(/fopt_amc_no: "ના, હું જાતે મેનેજ કરીશ"(\\r?\\n)\\s*\\}/g, 'fopt_amc_no: "ના, હું જાતે મેનેજ કરીશ",\\n' + additionsGu + '\\n  }');

  fs.writeFileSync(file, content, 'utf8');
  console.log('done');
} else {
  console.log('Already added');
}
