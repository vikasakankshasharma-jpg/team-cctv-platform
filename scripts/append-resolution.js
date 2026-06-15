const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../lib/i18n/translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

const newTranslations = {
  en: {
    dynamic_step_resolution: "Image Resolution",
    q_resolution: "Select resolution:",
    opt_res_2mp: "2MP Standard HD",
    opt_res_4mp: "4MP Pro HD",
    opt_res_5mp: "5MP Ultra HD",
    opt_res_6mp: "6MP Premium",
    opt_res_8mp: "8MP Professional Grade"
  },
  hi: {
    dynamic_step_resolution: "छवि रिज़ॉल्यूशन",
    q_resolution: "रिज़ॉल्यूशन चुनें:",
    opt_res_2mp: "2MP मानक HD",
    opt_res_4mp: "4MP प्रो HD",
    opt_res_5mp: "5MP अल्ट्रा HD",
    opt_res_6mp: "6MP प्रीमियम",
    opt_res_8mp: "8MP व्यावसायिक ग्रेड"
  },
  mr: {
    dynamic_step_resolution: "प्रतिमा रिझोल्यूशन",
    q_resolution: "रिझोल्यूशन निवडा:",
    opt_res_2mp: "2MP मानक HD",
    opt_res_4mp: "4MP प्रो HD",
    opt_res_5mp: "5MP अल्ट्रा HD",
    opt_res_6mp: "6MP प्रीमियम",
    opt_res_8mp: "8MP व्यावसायिक श्रेणी"
  },
  gu: {
    dynamic_step_resolution: "છબી રીઝોલ્યુશન",
    q_resolution: "રીઝોલ્યુશન પસંદ કરો:",
    opt_res_2mp: "2MP સ્ટાન્ડર્ડ HD",
    opt_res_4mp: "4MP પ્રો HD",
    opt_res_5mp: "5MP અલ્ટ્રા HD",
    opt_res_6mp: "6MP પ્રીમિયમ",
    opt_res_8mp: "8MP વ્યાવસાયિક ગ્રેડ"
  },
  ta: {
    dynamic_step_resolution: "படத் தீர்மானம்",
    q_resolution: "தீர்மானத்தைத் தேர்ந்தெடுக்கவும்:",
    opt_res_2mp: "2MP நிலையான HD",
    opt_res_4mp: "4MP புரோ HD",
    opt_res_5mp: "5MP அல்ட்ரா HD",
    opt_res_6mp: "6MP பிரீமியம்",
    opt_res_8mp: "8MP தொழில்முறை தரம்"
  },
  te: {
    dynamic_step_resolution: "చిత్ర రిజల్యూషన్",
    q_resolution: "రిజల్యూషన్‌ను ఎంచుకోండి:",
    opt_res_2mp: "2MP ప్రామాణిక HD",
    opt_res_4mp: "4MP ప్రో HD",
    opt_res_5mp: "5MP అల్ట్రా HD",
    opt_res_6mp: "6MP ప్రీమియం",
    opt_res_8mp: "8MP ప్రొఫెషనల్ గ్రేడ్"
  },
  kn: {
    dynamic_step_resolution: "ಚಿತ್ರ ರೆಸಲ್ಯೂಶನ್",
    q_resolution: "ರೆಸಲ್ಯೂಶನ್ ಆಯ್ಕೆಮಾಡಿ:",
    opt_res_2mp: "2MP ಪ್ರಮಾಣಿತ HD",
    opt_res_4mp: "4MP ಪ್ರೊ HD",
    opt_res_5mp: "5MP ಅಲ್ಟ್ರಾ HD",
    opt_res_6mp: "6MP ಪ್ರೀಮಿಯಂ",
    opt_res_8mp: "8MP ವೃತ್ತಿಪರ ದರ್ಜೆ"
  },
  bn: {
    dynamic_step_resolution: "চিত্রের রেজোলিউশন",
    q_resolution: "রেজোলিউশন নির্বাচন করুন:",
    opt_res_2mp: "2MP স্ট্যান্ডার্ড HD",
    opt_res_4mp: "4MP প্রো HD",
    opt_res_5mp: "5MP আল্ট্রা HD",
    opt_res_6mp: "6MP প্রিমিয়াম",
    opt_res_8mp: "8MP পেশাদার গ্রেড"
  },
  ml: {
    dynamic_step_resolution: "ഇമേജ് റെസല്യൂഷൻ",
    q_resolution: "റെസല്യൂഷൻ തിരഞ്ഞെടുക്കുക:",
    opt_res_2mp: "2MP സ്റ്റാൻഡേർഡ് HD",
    opt_res_4mp: "4MP പ്രോ HD",
    opt_res_5mp: "5MP അൾട്രാ HD",
    opt_res_6mp: "6MP പ്രീമിയം",
    opt_res_8mp: "8MP പ്രൊഫഷണൽ ഗ്രേഡ്"
  },
  pa: {
    dynamic_step_resolution: "ਚਿੱਤਰ ਰੈਜ਼ੋਲਿਊਸ਼ਨ",
    q_resolution: "ਰੈਜ਼ੋਲਿਊਸ਼ਨ ਚੁਣੋ:",
    opt_res_2mp: "2MP ਸਟੈਂਡਰਡ HD",
    opt_res_4mp: "4MP ਪ੍ਰੋ HD",
    opt_res_5mp: "5MP ਅਲਟਰਾ HD",
    opt_res_6mp: "6MP ਪ੍ਰੀਮੀਅਮ",
    opt_res_8mp: "8MP ਪੇਸ਼ੇਵਰ ਗ੍ਰੇਡ"
  },
  or: {
    dynamic_step_resolution: "ଚିତ୍ର ରେଜୋଲ୍ୟୁସନ",
    q_resolution: "ରେଜୋଲ୍ୟୁସନ ଚୟନ କରନ୍ତୁ:",
    opt_res_2mp: "2MP ମାନକ HD",
    opt_res_4mp: "4MP ପ୍ରୋ HD",
    opt_res_5mp: "5MP ଅଲ୍ଟ୍ରା HD",
    opt_res_6mp: "6MP ପ୍ରିମିୟମ୍",
    opt_res_8mp: "8MP ବୃତ୍ତିଗତ ଗ୍ରେଡ୍"
  }
};

let modifiedContent = content;

for (const [lang, keys] of Object.entries(newTranslations)) {
  let appendStr = '';
  for (const [key, val] of Object.entries(keys)) {
    appendStr += `    ${key}: "${val}",\n`;
  }
  
  const langRegex = new RegExp(`(\\b${lang}\\b\\s*:\\s*{.*?opt_wiring_conduit\\s*:\\s*".*?",\\s*)`, 's');
  modifiedContent = modifiedContent.replace(langRegex, `$1${appendStr}`);
}

const newTypeKeys = Object.keys(newTranslations.en).map(k => `  | "${k}"`).join('\n');
modifiedContent = modifiedContent.replace('  | "opt_wiring_conduit";', `  | "opt_wiring_conduit"\n${newTypeKeys};`);

fs.writeFileSync(filePath, modifiedContent);
console.log('Resolution translations appended successfully.');
