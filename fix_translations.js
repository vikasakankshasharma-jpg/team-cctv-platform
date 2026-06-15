const fs = require('fs');
const path = require('path');
const file = path.join('c:/Users/hp/Documents/TEAM Website/secure-easy/lib/i18n/translations.ts');
let content = fs.readFileSync(file, 'utf8');

const newKeys = [
  'step_timeline', 'q_timeline', 'fopt_t_asap', 'fopt_t_week', 'fopt_t_month', 'fopt_t_research',
  'step_brand', 'q_brand', 'fopt_b_rec', 'fopt_b_cp', 'fopt_b_hik', 'fopt_b_dah',
  'step_amc', 'q_amc', 'fopt_amc_yes', 'fopt_amc_no'
];

// Add to TranslationKey type
const typeEndRegex = /(export type TranslationKey =[\s\S]*?)(?=;)/;
const match = content.match(typeEndRegex);
if (match) {
  const newTypeLines = newKeys.map(k => '  | "' + k + '"').join('\n');
  content = content.replace(typeEndRegex, match[1] + '\n' + newTypeLines);
}

// Translations data
const newDictEntries = {
  step_timeline: { en: 'Timeline', hi: 'समयरेखा', mr: 'वेळ', gu: 'સમયરેખા', ta: 'நேரவரிசை', te: 'సమయపాలన', kn: 'ಸಮಯಸೂಚಿ', ml: 'ടൈംലൈൻ', bn: 'সময়রেখা', pa: 'ਸਮਾਂ-ਰੇਖਾ', or: 'ସମୟରେଖା' },
  q_timeline: { en: 'Select urgency:', hi: 'तात्कालिकता चुनें:', mr: 'तात्कालिकता निवडा:', gu: 'તાકીદ પસંદ કરો:', ta: 'அவசரத்தைத் தேர்ந்தெடுக்கவும்:', te: 'ఆవశ్యకతను ఎంచుకోండి:', kn: 'ತುರ್ತು ಆಯ್ಕೆಮಾಡಿ:', ml: 'അടിയന്തരത തിരഞ്ഞെടുക്കുക:', bn: 'জরুরীতা নির্বাচন করুন:', pa: 'ਜ਼ਰੂਰੀ ਚੁਣੋ:', or: 'ଜରୁରୀକାଳୀନତା ବାଛନ୍ତୁ:' },
  fopt_t_asap: { en: 'ASAP (Today/Tomorrow)', hi: 'जल्द से जल्द (आज/कल)', mr: 'लवकरात लवकर (आज/उद्या)', gu: 'જલ્દીથી જલ્દી (આજે/આવતીકાલે)', ta: 'விரைவில் (இன்று/நாளை)', te: 'వీలైనంత త్వరగా (నేడు/రేపు)', kn: 'ಸಾಧ್ಯವಾದಷ್ಟು ಬೇಗ (ಇಂದು/ನಾಳೆ)', ml: 'കഴിയുന്നതും വേഗം (ഇന്ന്/നാളെ)', bn: 'যত তাড়াতাড়ি সম্ভব (আজ/আগামীকাল)', pa: 'ਜਿੰਨੀ ਜਲਦੀ ਹੋ ਸਕੇ (ਅੱਜ/ਕੱਲ੍ਹ)', or: 'ଯଥାଶୀଘ୍ର (ଆଜି/ଆସନ୍ତାକାଲି)' },
  fopt_t_week: { en: 'Within a week', hi: 'एक सप्ताह के भीतर', mr: 'एका आठवड्यात', gu: 'એક અઠવાડિયામાં', ta: 'ஒரு வாரத்திற்குள்', te: 'ఒక వారంలో', kn: 'ಒಂದು ವಾರದೊಳಗೆ', ml: 'ഒരാഴ്ചയ്ക്കുള്ളിൽ', bn: 'এক সপ্তাহের মধ্যে', pa: 'ਇੱਕ ਹਫ਼ਤੇ ਦੇ ਅੰਦਰ', or: 'ଏକ ସପ୍ତାହ ମଧ୍ୟରେ' },
  fopt_t_month: { en: 'Next Month', hi: 'अगले महीने', mr: 'पुढच्या महिन्यात', gu: 'આવતા મહિને', ta: 'அடுத்த மாதம்', te: 'వచ్చే నెల', kn: 'ಮುಂದಿನ ತಿಂಗಳು', ml: 'അടുത്ത മാസം', bn: 'আগামী মাসে', pa: 'ਅਗਲੇ ਮਹੀਨੇ', or: 'ଆସନ୍ତା ମାସରେ' },
  fopt_t_research: { en: 'Just researching', hi: 'बस रिसर्च कर रहे हैं', mr: 'फक्त माहिती घेत आहे', gu: 'ફક્ત માહિતી મેળવી રહ્યા છીએ', ta: 'ஆராய்ச்சி செய்கிறேன்', te: 'కేవలం పరిశోధిస్తున్నాను', kn: 'ಕೇವಲ ಸಂಶೋಧನೆ ಮಾಡುತ್ತಿದ್ದೇನೆ', ml: 'വെറുതെ അന്വേഷിക്കുന്നു', bn: 'শুধু গবেষণা করছি', pa: 'ਸਿਰਫ਼ ਖੋਜ ਕਰ ਰਹੇ ਹਾਂ', or: 'କେବଳ ଅନୁସନ୍ଧାନ କରୁଛୁ' },
  
  step_brand: { en: 'Brand', hi: 'ब्रांड', mr: 'ब्रँड', gu: 'બ્રાન્ડ', ta: 'பிராண்ட்', te: 'బ్రాండ్', kn: 'ಬ್ರಾండ్', ml: 'ബ്രാൻഡ്', bn: 'ব্র্যান্ড', pa: 'ਬ੍ਰਾਂਡ', or: 'ବ୍ରାଣ୍ଡ' },
  q_brand: { en: 'Select brand preference:', hi: 'ब्रांड वरीयता चुनें:', mr: 'ब्रँड प्राधान्य निवडा:', gu: 'બ્રાન્ડ પસંદગી પસંદ કરો:', ta: 'பிராண்ட் விருப்பத்தைத் தேர்ந்தெடுக்கவும்:', te: 'బ్రాండ్ ప్రాధాన్యతను ఎంచుకోండి:', kn: 'ಬ್ರಾಂಡ್ ಆದ್ಯತೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:', ml: 'ബ്രാൻഡ് മുൻഗണന തിരഞ്ഞെടുക്കുക:', bn: 'ব্র্যান্ড পছন্দ নির্বাচন করুন:', pa: 'ਬ੍ਰਾਂਡ ਤਰਜੀਹ ਚੁਣੋ:', or: 'ବ୍ରାଣ୍ଡ ପସନ୍ଦ ବାଛନ୍ତୁ:' },
  fopt_b_rec: { en: 'Unsure, please recommend', hi: 'निश्चित नहीं, कृपया सुझाव दें', mr: 'निश्चित नाही, कृपया सुचवा', gu: 'ચોક્કસ નથી, કૃપા કરીને સૂચવો', ta: 'உறுதியாக தெரியவில்லை, பரிந்துரைக்கவும்', te: 'ఖచ్చితంగా తెలియదు, దయచేసి సూచించండి', kn: 'ಖಚಿತವಾಗಿಲ್ಲ, ದಯವಿಟ್ಟು ಸೂಚಿಸಿ', ml: 'ഉറപ്പില്ല, దയവായി നിർദ്ദേശിക്കുക', bn: 'নিশ্চিত নয়, অনুগ্রহ করে সুপারিশ করুন', pa: 'ਯਕੀਨਨ ਨਹੀਂ, ਕਿਰਪਾ ਕਰਕੇ ਸੁਝਾਅ ਦਿਓ', or: 'ନିଶ୍ଚିତ ନୁହେଁ, ଦୟାକରି ପରାମର୍ଶ ଦିଅନ୍ତୁ' },
  fopt_b_cp: { en: 'CP Plus', hi: 'CP Plus', mr: 'CP Plus', gu: 'CP Plus', ta: 'CP Plus', te: 'CP Plus', kn: 'CP Plus', ml: 'CP Plus', bn: 'CP Plus', pa: 'CP Plus', or: 'CP Plus' },
  fopt_b_hik: { en: 'Hikvision', hi: 'Hikvision', mr: 'Hikvision', gu: 'Hikvision', ta: 'Hikvision', te: 'Hikvision', kn: 'Hikvision', ml: 'Hikvision', bn: 'Hikvision', pa: 'Hikvision', or: 'Hikvision' },
  fopt_b_dah: { en: 'Dahua', hi: 'Dahua', mr: 'Dahua', gu: 'Dahua', ta: 'Dahua', te: 'Dahua', kn: 'Dahua', ml: 'Dahua', bn: 'Dahua', pa: 'Dahua', or: 'Dahua' },

  step_amc: { en: 'Maintenance', hi: 'रखरखाव', mr: 'देखभाल', gu: 'જાળવણી', ta: 'பராமரிப்பு', te: 'నిర్వహణ', kn: 'ನಿರ್ವಹಣೆ', ml: 'പരിപാലനം', bn: 'রক্ষণাবেক্ষণ', pa: 'ਰੱਖ-ਰਖਾਅ', or: 'ରକ୍ଷଣାବେକ୍ଷଣ' },
  q_amc: { en: 'Select AMC option:', hi: 'AMC विकल्प चुनें:', mr: 'AMC पर्याय निवडा:', gu: 'AMC વિકલ્પ પસંદ કરો:', ta: 'AMC விருப்பத்தைத் தேர்ந்தெடுக்கவும்:', te: 'AMC ఎంపికను ఎంచుకోండి:', kn: 'AMC ಆಯ್ಕೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:', ml: 'AMC ഓപ്ഷൻ തിരഞ്ഞെടുക്കുക:', bn: 'AMC বিকল্প নির্বাচন করুন:', pa: 'AMC ਵਿਕਲਪ ਚੁਣੋ:', or: 'AMC ବିକଳ୍ପ ବାଛନ୍ତୁ:' },
  fopt_amc_yes: { en: 'Yes, protect my system', hi: 'हाँ, मेरे सिस्टम की सुरक्षा करें', mr: 'होय, माझ्या सिस्टमचे रक्षण करा', gu: 'હા, મારી સિસ્ટમનું રક્ષણ કરો', ta: 'ஆம், எனது கணினியைப் பாதுகாக்கவும்', te: 'అవును, నా సిస్టమ్‌ను రక్షించండి', kn: 'ಹೌದು, ನನ್ನ ಸಿಸ್ಟಮ್ ಅನ್ನು ರಕ್ಷಿಸಿ', ml: 'അതെ, എന്റെ സിസ്റ്റം സംരക്ഷിക്കുക', bn: 'হ্যাঁ, আমার সিস্টেম রক্ষা করুন', pa: 'ਹਾਂ, ਮੇਰੇ ਸਿਸਟਮ ਦੀ ਰੱਖਿਆ ਕਰੋ', or: 'ହଁ, ମୋ ସିଷ୍ଟମ୍ ରକ୍ଷା କରନ୍ତୁ' },
  fopt_amc_no: { en: "No, I will manage it myself", hi: "नहीं, मैं खुद संभाल लूंगा", mr: "नाही, मी स्वतः व्यवस्थापित करेन", gu: "ના, હું જાતે જ સંભાળી લઈશ", ta: "இல்லை, நானே நிர்வகிப்பேன்", te: "లేదు, నేను నేనే నిర్వహిస్తాను", kn: "ಇಲ್ಲ, ನಾನು ನಾನೇ ನಿರ್ವಹಿಸುತ್ತೇನೆ", ml: "ഇല്ല, ഞാൻ തന്നെ നോക്കിക്കോളാം", bn: "না, আমি নিজেই পরিচালনা করব", pa: "ਨਹੀਂ, ਮੈਂ ਖੁਦ ਸੰਭਾਲਾਂਗਾ", or: "ନା, ମୁଁ ନିଜେ ପରିଚାଳନା କରିବି" }
};

const locales = ['en', 'hi', 'mr', 'gu', 'ta', 'te', 'kn', 'ml', 'bn', 'pa', 'or'];

for (const loc of locales) {
  // We look for a line that starts with `  loc: {` and then find its matching closing brace
  const blockStartRegex = new RegExp('  ' + loc + ': \\{');
  const blockStartMatch = content.match(blockStartRegex);
  if (!blockStartMatch) continue;
  
  const startIndex = blockStartMatch.index + blockStartMatch[0].length;
  // find the NEXT line that starts with `  },` or `};`
  const blockEndRegex = /  (?:},|};)/g;
  blockEndRegex.lastIndex = startIndex;
  const blockEndMatch = blockEndRegex.exec(content);
  if (!blockEndMatch) continue;

  const endIndex = blockEndMatch.index;
  
  let newLines = ',\n';
  for (const [key, langs] of Object.entries(newDictEntries)) {
    const val = langs[loc] || langs['en']; // fallback
    newLines += '    ' + key + ': "' + val.replace(/"/g, '\\\\"') + '",\n';
  }
  // remove trailing comma and newline for the very last entry
  newLines = newLines.trimEnd().replace(/,$/, '') + '\n';
  
  content = content.slice(0, endIndex) + newLines + content.slice(endIndex);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Translations updated successfully for Locale blocks.');
