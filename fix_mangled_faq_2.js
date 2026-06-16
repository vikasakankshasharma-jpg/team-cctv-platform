const fs = require('fs');
const path = require('path');

const srcFile = path.resolve('lib/i18n/translations.ts');
let code = fs.readFileSync(srcFile, 'utf8');

const faqKeys = {
  en: {
    "faq_1_q": "Is GST included in the quote price?",
    "faq_1_a": "Yes. All CCTVQuotation quotations include 18% GST with no hidden charges. The price covers cameras, DVR/NVR, HDD, cabling, and professional installation — everything.",
    "faq_2_q": "Does the price include installation?",
    "faq_2_a": "Yes. Every quotation includes full professional installation — camera mounting, cable routing, DVR/NVR setup, mobile app configuration on your phone, and a complete system demonstration.",
    "faq_3_q": "How much does a 4-camera CCTV system cost in Jaipur?",
    "faq_3_a": "A CP Plus HD 4-camera system starts at ₹18,000–₹28,000. An IP (NVR) system starts at ₹35,000–₹55,000. A 4K system starts at ₹55,000–₹85,000. All prices include GST and installation.",
    "faq_4_q": "Are your cameras BIS-ER compliant?",
    "faq_4_a": "Yes. We install CP Plus and Prama cameras which carry BIS-ER certification — suitable for government tenders, housing societies, and commercial projects."
  },
  hi: {
    "faq_1_q": "क्या कोटेशन मूल्य में GST शामिल है?",
    "faq_1_a": "हाँ। सभी CCTVQuotation कोटेशन में 18% GST शामिल है, कोई छिपा हुआ शुल्क नहीं है। कीमत में कैमरे, DVR/NVR, HDD, केबलिंग और पेशेवर स्थापना शामिल है — सब कुछ।",
    "faq_2_q": "क्या कीमत में स्थापना (installation) शामिल है?",
    "faq_2_a": "हाँ। हर कोटेशन में पूर्ण पेशेवर स्थापना शामिल है — कैमरा माउंटिंग, केबल रूटिंग, DVR/NVR सेटअप, आपके फोन पर मोबाइल ऐप कॉन्फ़िगरेशन, और एक पूर्ण सिस्टम प्रदर्शन।",
    "faq_3_q": "जयपुर में 4-कैमरा CCTV सिस्टम की कीमत कितनी है?",
    "faq_3_a": "CP Plus HD 4-कैमरा सिस्टम ₹18,000–₹28,000 से शुरू होता है। IP (NVR) सिस्टम ₹35,000–₹55,000 से शुरू होता है। 4K सिस्टम ₹55,000–₹85,000 से शुरू होता है। सभी कीमतों में GST और स्थापना शामिल है।",
    "faq_4_q": "क्या आपके कैमरे BIS-ER प्रमाणित हैं?",
    "faq_4_a": "हाँ। हम CP Plus और Prama कैमरे स्थापित करते हैं जिनके पास BIS-ER प्रमाणन है — जो सरकारी निविदाओं, हाउसिंग सोसायटियों और व्यावसायिक परियोजनाओं के लिए उपयुक्त हैं।"
  },
  mr: {
    "faq_1_q": "कोटेशन किमतीत GST समाविष्ट आहे का?",
    "faq_1_a": "होय. सर्व CCTVQuotation कोटेशनमध्ये 18% GST समाविष्ट आहे आणि कोणतेही छुपे शुल्क नाही. या किमतीत कॅमेरे, DVR/NVR, HDD, केबलिंग आणि व्यावसायिक इन्स्टॉलेशन समाविष्ट आहे — सर्व काही.",
    "faq_2_q": "किमतीत इन्स्टॉलेशनचा समावेश आहे का?",
    "faq_2_a": "होय. प्रत्येक कोटेशनमध्ये संपूर्ण व्यावसायिक इन्स्टॉलेशन समाविष्ट आहे — कॅमेरा माउंटिंग, केबल राउटिंग, DVR/NVR सेटअप, तुमच्या फोनवर मोबाईल ॲप कॉन्फिगरेशन आणि संपूर्ण सिस्टम डेमो.",
    "faq_3_q": "जयपूरमध्ये 4-कॅमेरा CCTV सिस्टमची किंमत किती आहे?",
    "faq_3_a": "CP Plus HD 4-कॅमेरा सिस्टम ₹18,000–₹28,000 पासून सुरू होते. IP (NVR) सिस्टम ₹35,000–₹55,000 पासून सुरू होते. 4K सिस्टम ₹55,000–₹85,000 पासून सुरू होते. सर्व किमतींमध्ये GST आणि इन्स्टॉलेशन समाविष्ट आहे.",
    "faq_4_q": "तुमचे कॅमेरे BIS-ER प्रमाणित आहेत का?",
    "faq_4_a": "होय. आम्ही CP Plus आणि Prama कॅमेरे इन्स्टॉल करतो ज्यांना BIS-ER प्रमाणपत्र आहे — जे सरकारी टेंडर, गृहनिर्माण संस्था आणि व्यावसायिक प्रकल्पांसाठी योग्य आहेत."
  },
  gu: {
    "faq_1_q": "શું ક્વોટેશન કિંમતમાં GST શામેલ છે?",
    "faq_1_a": "હા. તમામ CCTVQuotation ક્વોટેશનમાં 18% GST શામેલ છે, કોઈ છુપાયેલ ખર્ચ નથી. કિંમતમાં કેમેરા, DVR/NVR, HDD, કેબલિંગ અને વ્યાવસાયિક ઇન્સ્ટોલેશન શામેલ છે — બધું જ.",
    "faq_2_q": "શું કિંમતમાં ઇન્સ્ટોલેશન શામેલ છે?",
    "faq_2_a": "હા. દરેક ક્વોટેશનમાં સંપૂર્ણ વ્યાવસાયિક ઇન્સ્ટોલેશન શામેલ છે — કેમેરા માઉન્ટિંગ, કેબલ રૂટિંગ, DVR/NVR સેટઅપ, તમારા ફોન પર મોબાઇલ એપ્લિકેશન રૂપરેખાંકન, અને સંપૂર્ણ સિસ્ટમ પ્રદર્શન.",
    "faq_3_q": "જયપુરમાં 4-કેમેરા CCTV સિસ્ટમની કિંમત કેટલી છે?",
    "faq_3_a": "CP Plus HD 4-કેમેરા સિસ્ટમ ₹18,000–₹28,000 થી શરૂ થાય છે. IP (NVR) સિસ્ટમ ₹35,000–₹55,000 થી શરૂ થાય છે. 4K સિસ્ટમ ₹55,000–₹85,000 થી શરૂ થાય છે. તમામ કિંમતોમાં GST અને ઇન્સ્ટોલેશન શામેલ છે.",
    "faq_4_q": "શું તમારા કેમેરા BIS-ER પ્રમાણિત છે?",
    "faq_4_a": "હા. અમે CP Plus અને Prama કેમેરા ઇન્સ્ટોલ કરીએ છીએ જે BIS-ER પ્રમાણપત્ર ધરાવે છે — જે સરકારી ટેન્ડર, હાઉસિંગ સોસાયટીઓ અને વ્યાવસાયિક પ્રોજેક્ટ્સ માટે યોગ્ય છે."
  }
};

const locales = ['en', 'hi', 'mr', 'gu'];

// Break file by locale blocks
let newCode = code;

for (const locale of locales) {
  const startMarker = `  ${locale}: {\n`;
  const nextLocales = locales.slice(locales.indexOf(locale) + 1);
  const endMarker = nextLocales.length > 0 ? `  ${nextLocales[0]}: {\n` : `};\n`;
  
  let startIndex = newCode.indexOf(startMarker);
  if (startIndex === -1) {
      startIndex = newCode.indexOf(`\n${locale}: {`);
  }
  let endIndex = endMarker === `};\n` ? newCode.lastIndexOf(`};`) : newCode.indexOf(endMarker);
  
  if (startIndex !== -1 && endIndex !== -1) {
    let block = newCode.substring(startIndex, endIndex);
    
    for (const [key, val] of Object.entries(faqKeys[locale])) {
      const escapedKey = key;
      const regex = new RegExp(`('${escapedKey}'|"${escapedKey}")\\s*:\\s*".*?"`); // NO global flag
      block = block.replace(regex, `'${escapedKey}': ${JSON.stringify(val)}`);
    }
    
    newCode = newCode.substring(0, startIndex) + block + newCode.substring(endIndex);
  }
}

fs.writeFileSync(srcFile, newCode, 'utf8');
console.log('Fixed translations per block!');
