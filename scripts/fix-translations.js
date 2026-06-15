const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../lib/i18n/translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

// The corrupted string looks like:
// landing_pricing_title: '{brand  "wizard_lbl_environment": "Environment",\n  "wizard_opt_indoor": "Indoor Area",\n ... \n} CCTV Installation Cost in {city}',

// Since it was injected exactly at the FIRST closing brace after the language key, it replaced `{brand}`'s `}` with `  "wizard_...": "...",\n}`.
// So we just need to find: `  "wizard_lbl_environment": ` and remove from that up to the next `}` and replace with `}`. Wait no, the `}` was added back.

// Let's just fix it manually using a very targeted regex.
const newTranslations = {
  en: {
    wizard_lbl_environment: "Environment",
    wizard_opt_indoor: "Indoor Area",
    wizard_opt_outdoor: "Outdoor Area",
    wizard_lbl_quantity: "Quantity",
    wizard_lbl_special_features: "Special Features",
    wizard_lbl_optional: "(Optional)",
    feat_color: "Color Night Vision",
    feat_audio: "Speaker / Two-Way Talk",
    feat_ptz: "PTZ (Pan-Tilt-Zoom)",
    feat_solar: "Solar Powered",
    feat_4g: "4G / SIM Support",
    q_cam_count: "How many cameras do you need?",
  },
  hi: {
    wizard_lbl_environment: "वातावरण",
    wizard_opt_indoor: "आंतरिक क्षेत्र",
    wizard_opt_outdoor: "बाहरी क्षेत्र",
    wizard_lbl_quantity: "मात्रा",
    wizard_lbl_special_features: "विशेष सुविधाएं",
    wizard_lbl_optional: "(वैकल्पिक)",
    feat_color: "रंगीन नाइट विजन",
    feat_audio: "स्पीकर / टू-वे टॉक",
    feat_ptz: "PTZ (पैन-टिल्ट-ज़ूम)",
    feat_solar: "सौर ऊर्जा",
    feat_4g: "4G / सिम सपोर्ट",
    q_cam_count: "आपको कितने कैमरों की आवश्यकता है?",
  },
  mr: {
    wizard_lbl_environment: "वातावरण",
    wizard_opt_indoor: "घरातील जागा",
    wizard_opt_outdoor: "बाहेरील जागा",
    wizard_lbl_quantity: "प्रमाण",
    wizard_lbl_special_features: "विशेष वैशिष्ट्ये",
    wizard_lbl_optional: "(पर्यायी)",
    feat_color: "रंगीत नाईट व्हिजन",
    feat_audio: "स्पीकर / टू-वे टॉक",
    feat_ptz: "PTZ (पॅन-टिल्ट-झूम)",
    feat_solar: "सौर ऊर्जा",
    feat_4g: "4G / सिम सपोर्ट",
    q_cam_count: "तुम्हाला किती कॅमेरे हवे आहेत?",
  },
  gu: {
    wizard_lbl_environment: "પર્યાવરણ",
    wizard_opt_indoor: "આંતરિક વિસ્તાર",
    wizard_opt_outdoor: "બાહ્ય વિસ્તાર",
    wizard_lbl_quantity: "જથ્થો",
    wizard_lbl_special_features: "વિશેષ સુવિધાઓ",
    wizard_lbl_optional: "(વૈકલ્પિક)",
    feat_color: "રંગીન નાઇટ વિઝન",
    feat_audio: "સ્પીકર / ટુ-વે ટોક",
    feat_ptz: "PTZ (પાન-ટિલ્ટ-ઝૂમ)",
    feat_solar: "સૌર ઉર્જા",
    feat_4g: "4G / સિમ સપોર્ટ",
    q_cam_count: "તમારે કેટલા કેમેરાની જરૂર છે?",
  },
  ta: {
    wizard_lbl_environment: "சுற்றுச்சூழல்",
    wizard_opt_indoor: "உட்புறப் பகுதி",
    wizard_opt_outdoor: "வெளிப்புறப் பகுதி",
    wizard_lbl_quantity: "அளவு",
    wizard_lbl_special_features: "சிறப்பு அம்சங்கள்",
    wizard_lbl_optional: "(விருப்பத்திற்குரியது)",
    feat_color: "வண்ண இரவுப் பார்வை",
    feat_audio: "ஸ்பீக்கர் / இருவழிக் கதை",
    feat_ptz: "PTZ (பான்-டில்ட்-ஜூம்)",
    feat_solar: "சூரிய சக்தி",
    feat_4g: "4G / சிம் ஆதரவு",
    q_cam_count: "உங்களுக்கு எத்தனை கேமராக்கள் தேவை?",
  },
  te: {
    wizard_lbl_environment: "పర్యావరణం",
    wizard_opt_indoor: "లోపలి ప్రాంతం",
    wizard_opt_outdoor: "బయటి ప్రాంతం",
    wizard_lbl_quantity: "పరిమాణం",
    wizard_lbl_special_features: "ప్రత్యేక లక్షణాలు",
    wizard_lbl_optional: "(ఐచ్ఛికం)",
    feat_color: "రంగుల నైట్ విజన్",
    feat_audio: "స్పీకర్ / టూ-వే టాక్",
    feat_ptz: "PTZ (పాన్-టిల్ట్-జూమ్)",
    feat_solar: "సౌర శక్తి",
    feat_4g: "4G / సిమ్ మద్దతు",
    q_cam_count: "మీకు ఎన్ని కెమెరాలు కావాలి?",
  },
  kn: {
    wizard_lbl_environment: "ಪರಿಸರ",
    wizard_opt_indoor: "ಒಳಾಂಗಣ ಪ್ರದೇಶ",
    wizard_opt_outdoor: "ಹೊರಾಂಗಣ ಪ್ರದೇಶ",
    wizard_lbl_quantity: "ಪ್ರಮಾಣ",
    wizard_lbl_special_features: "ವಿಶೇಷ ವೈಶಿಷ್ಟ್ಯಗಳು",
    wizard_lbl_optional: "(ಐಚ್ಛಿಕ)",
    feat_color: "ಬಣ್ಣದ ನೈಟ್ ವಿಷನ್",
    feat_audio: "ಸ್ಪೀಕರ್ / ಟೂ-ವೇ ಟಾಕ್",
    feat_ptz: "PTZ (ಪ್ಯಾನ್-ಟಿಲ್ಟ್-ಜೂಮ್)",
    feat_solar: "ಸೌರ ಶಕ್ತಿ",
    feat_4g: "4G / ಸಿಮ್ ಬೆಂಬಲ",
    q_cam_count: "ನಿಮಗೆ ಎಷ್ಟು ಕ್ಯಾಮೆರಾಗಳು ಬೇಕು?",
  },
  bn: {
    wizard_lbl_environment: "পরিবেশ",
    wizard_opt_indoor: "ভিতরের এলাকা",
    wizard_opt_outdoor: "বাইরের এলাকা",
    wizard_lbl_quantity: "পরিমাণ",
    wizard_lbl_special_features: "বিশেষ বৈশিষ্ট্য",
    wizard_lbl_optional: "(ঐচ্ছিক)",
    feat_color: "রঙিন নাইট ভিশন",
    feat_audio: "স্পিকার / টু-ওয়ে টক",
    feat_ptz: "PTZ (প্যান-টিল্ট-জুম)",
    feat_solar: "সৌর শক্তি",
    feat_4g: "4G / সিম সাপোর্ট",
    q_cam_count: "আপনার কতগুলো ক্যামেরা দরকার?",
  },
  ml: {
    wizard_lbl_environment: "പരിസ്ഥിതി",
    wizard_opt_indoor: "ഉൾഭാഗം",
    wizard_opt_outdoor: "പുറംഭാഗം",
    wizard_lbl_quantity: "എണ്ണം",
    wizard_lbl_special_features: "പ്രത്യേക സവിശേഷതകൾ",
    wizard_lbl_optional: "(ഓപ്ഷണൽ)",
    feat_color: "കളർ നൈറ്റ് വിഷൻ",
    feat_audio: "സ്പീക്കർ / ടു-വേ ടോക്ക്",
    feat_ptz: "PTZ (പാൻ-ടിൽറ്റ്-സൂം)",
    feat_solar: "സോളാർ പവർ",
    feat_4g: "4G / സിം സപ്പോർട്ട്",
    q_cam_count: "നിങ്ങൾക്ക് എത്ര ക്യാമറകൾ വേണം?",
  },
  pa: {
    wizard_lbl_environment: "ਵਾਤਾਵਰਣ",
    wizard_opt_indoor: "ਅੰਦਰੂਨੀ ਖੇਤਰ",
    wizard_opt_outdoor: "ਬਾਹਰੀ ਖੇਤਰ",
    wizard_lbl_quantity: "ਮਾਤਰਾ",
    wizard_lbl_special_features: "ਖਾਸ ਵਿਸ਼ੇਸ਼ਤਾਵਾਂ",
    wizard_lbl_optional: "(ਵਿਕਲਪਿਕ)",
    feat_color: "ਰੰਗੀਨ ਨਾਈਟ ਵਿਜ਼ਨ",
    feat_audio: "ਸਪੀਕਰ / ਟੂ-ਵੇ ਟਾਕ",
    feat_ptz: "PTZ (ਪੈਨ-ਟਿਲਟ-ਜ਼ੂਮ)",
    feat_solar: "ਸੂਰਜੀ ਊਰਜਾ",
    feat_4g: "4G / ਸਿਮ ਸਪੋਰਟ",
    q_cam_count: "ਤੁਹਾਨੂੰ ਕਿੰਨੇ ਕੈਮਰੇ ਚਾਹੀਦੇ ਹਨ?",
  },
  or: {
    wizard_lbl_environment: "ପରିବେଶ",
    wizard_opt_indoor: "ଭିତର ଅଞ୍ଚଳ",
    wizard_opt_outdoor: "ବାହାର ଅଞ୍ଚଳ",
    wizard_lbl_quantity: "ପରିମାଣ",
    wizard_lbl_special_features: "ବିଶେଷ ସୁବିଧା",
    wizard_lbl_optional: "(ବୈକଳ୍ପିକ)",
    feat_color: "ରଙ୍ଗୀନ ନାଇଟ୍ ଭିଜନ୍",
    feat_audio: "ସ୍ପିକର୍ / ଟୁ-ୱେ ଟକ୍",
    feat_ptz: "PTZ (ପ୍ୟାନ୍-ଟିଲ୍ଟ-ଜୁମ୍)",
    feat_solar: "ସୌର ଶକ୍ତି",
    feat_4g: "4G / ସିମ୍ ସପୋର୍ଟ",
    q_cam_count: "ଆପଣଙ୍କୁ କେତୋଟି କ୍ୟାମେରା ଦରକାର?",
  }
};

let modifiedContent = content;

// 1. First, strip out all the injected lines and restore '{brand}'
const brokenRegex = /\{brand\s*"wizard_lbl_environment"[^}]*\}/g;
modifiedContent = modifiedContent.replace(brokenRegex, '{brand}');

// 2. Now append the new keys safely before the `landing_pricing_title` which is near the end, or just before the `}` of each language block.
// Wait, replacing before `}` is safer. We can match `landing_areas_all: '+ All Surrounding Areas',` or similar last known keys, but let's just find the last property in each block.
for (const [lang, keys] of Object.entries(newTranslations)) {
  let appendStr = '';
  for (const [key, val] of Object.entries(keys)) {
    appendStr += `    ${key}: "${val}",\n`;
  }
  
  // Find `landing_areas_all:` and insert after that line for this block
  const langRegex = new RegExp(`(\\b${lang}\\b\\s*:\\s*{.*?landing_areas_all\\s*:\\s*'.*?',\\s*)`, 's');
  modifiedContent = modifiedContent.replace(langRegex, `$1${appendStr}`);
}

fs.writeFileSync(filePath, modifiedContent);
console.log('Translations fixed successfully.');
