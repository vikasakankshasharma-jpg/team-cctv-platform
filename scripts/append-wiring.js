const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../lib/i18n/translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

const newTranslations = {
  en: {
    step_wiring: "Is your property already wired for CCTV?",
    q_wiring: "Select cabling status:",
    opt_wired_yes: "Yes - Cabling is already done",
    opt_wired_no: "No - Full installation required",
    q_wiring_type: "Type of wiring required:",
    opt_wiring_open: "Open Wiring",
    opt_wiring_conduit: "Conduit Flat Pipe"
  },
  hi: {
    step_wiring: "क्या आपकी प्रॉपर्टी में CCTV के लिए वायरिंग हो चुकी है?",
    q_wiring: "केबलिंग की स्थिति चुनें:",
    opt_wired_yes: "हाँ - केबलिंग पहले ही हो चुकी है",
    opt_wired_no: "नहीं - पूरी स्थापना की आवश्यकता है",
    q_wiring_type: "वायरिंग का प्रकार:",
    opt_wiring_open: "खुली वायरिंग",
    opt_wiring_conduit: "कंड्यूट / फ्लैट पाइप"
  },
  mr: {
    step_wiring: "तुमच्या प्रॉपर्टीवर आधीच CCTV वायरिंग झाली आहे का?",
    q_wiring: "केबलिंगची स्थिती निवडा:",
    opt_wired_yes: "होय - केबलिंग आधीच झाली आहे",
    opt_wired_no: "नाही - संपूर्ण इंस्टॉलेशन आवश्यक आहे",
    q_wiring_type: "वायरिंगचा प्रकार:",
    opt_wiring_open: "ओपन वायरिंग",
    opt_wiring_conduit: "कंड्युट / फ्लॅट पाईप"
  },
  gu: {
    step_wiring: "શું તમારી મિલકત પહેલેથી જ CCTV માટે વાયર થયેલ છે?",
    q_wiring: "કેબલિંગની સ્થિતિ પસંદ કરો:",
    opt_wired_yes: "હા - કેબલિંગ પહેલેથી જ થઈ ગઈ છે",
    opt_wired_no: "ના - સંપૂર્ણ ઇન્સ્ટોલેશન જરૂરી છે",
    q_wiring_type: "વાયરિંગનો પ્રકાર:",
    opt_wiring_open: "ઓપન વાયરિંગ",
    opt_wiring_conduit: "કન્ડ્યુટ / ફ્લેટ પાઇપ"
  },
  ta: {
    step_wiring: "உங்கள் சொத்தில் ஏற்கனவே சிசிடிவி வயரிங் செய்யப்பட்டுள்ளதா?",
    q_wiring: "கேபிளிங் நிலையைத் தேர்ந்தெடுக்கவும்:",
    opt_wired_yes: "ஆம் - கேபிளிங் ஏற்கனவே செய்யப்பட்டுள்ளது",
    opt_wired_no: "இல்லை - முழுமையான நிறுவல் தேவை",
    q_wiring_type: "தேவையான வயரிங் வகை:",
    opt_wiring_open: "திறந்த வயரிங்",
    opt_wiring_conduit: "கான்ட்யூட் / பிளாட் பைப்"
  },
  te: {
    step_wiring: "మీ ఆస్తికి ఇప్పటికే సీసీటీవీ వైరింగ్ జరిగిందా?",
    q_wiring: "కేబులింగ్ స్థితిని ఎంచుకోండి:",
    opt_wired_yes: "అవును - కేబులింగ్ ఇప్పటికే పూర్తయింది",
    opt_wired_no: "లేదు - పూర్తి ఇన్‌స్టాలేషన్ అవసరం",
    q_wiring_type: "అవసరమైన వైరింగ్ రకం:",
    opt_wiring_open: "ఓపెన్ వైరింగ్",
    opt_wiring_conduit: "కండ్యూట్ / ఫ్లాట్ పైప్"
  },
  kn: {
    step_wiring: "ನಿಮ್ಮ ಆಸ್ತಿಗೆ ಈಗಾಗಲೇ ಸಿಸಿಟಿವಿ ವೈರಿಂಗ್ ಮಾಡಲಾಗಿದೆಯೇ?",
    q_wiring: "ಕೇಬಲಿಂಗ್ ಸ್ಥಿತಿಯನ್ನು ಆಯ್ಕೆಮಾಡಿ:",
    opt_wired_yes: "ಹೌದು - ಕೇಬಲಿಂಗ್ ಈಗಾಗಲೇ ಮುಗಿದಿದೆ",
    opt_wired_no: "ಇಲ್ಲ - ಪೂರ್ಣ ಸ್ಥಾಪನೆ ಅಗತ್ಯವಿದೆ",
    q_wiring_type: "ಅಗತ್ಯವಿರುವ ವೈರಿಂಗ್ ಪ್ರಕಾರ:",
    opt_wiring_open: "ಓಪನ್ ವೈರಿಂಗ್",
    opt_wiring_conduit: "ಕಂಡ್ಯೂಟ್ / ಫ್ಲಾಟ್ ಪೈಪ್"
  },
  bn: {
    step_wiring: "আপনার সম্পত্তিতে কি ইতিমধ্যে সিসিটিভির জন্য ওয়্যারিং করা আছে?",
    q_wiring: "ক্যাবলিং স্ট্যাটাস নির্বাচন করুন:",
    opt_wired_yes: "হ্যাঁ - ক্যাবলিং ইতিমধ্যেই করা হয়েছে",
    opt_wired_no: "না - সম্পূর্ণ ইনস্টলেশন প্রয়োজন",
    q_wiring_type: "প্রয়োজনীয় ওয়্যারিংয়ের ধরন:",
    opt_wiring_open: "ওপেন ওয়্যারিং",
    opt_wiring_conduit: "কনডুইট / ফ্ল্যাট পাইপ"
  },
  ml: {
    step_wiring: "നിങ്ങളുടെ പ്രോപ്പർട്ടിയിൽ ഇതിനകം സിസിടിവി വയറിംഗ് ചെയ്തിട്ടുണ്ടോ?",
    q_wiring: "കേബിളിംഗ് നില തിരഞ്ഞെടുക്കുക:",
    opt_wired_yes: "അതെ - കേബിളിംഗ് ഇതിനകം കഴിഞ്ഞു",
    opt_wired_no: "അല്ല - പൂർണ്ണ ഇൻസ്റ്റലേഷൻ ആവശ്യമാണ്",
    q_wiring_type: "ആവശ്യമായ വയറിംഗ് തരം:",
    opt_wiring_open: "ഓപ്പൺ വയറിംഗ്",
    opt_wiring_conduit: "കൺഡ്യൂട്ട് / ഫ്ലാറ്റ് പൈപ്പ്"
  },
  pa: {
    step_wiring: "ਕੀ ਤੁਹਾਡੀ ਜਾਇਦਾਦ ਪਹਿਲਾਂ ਹੀ ਸੀਸੀਟੀਵੀ ਲਈ ਵਾਇਰ ਕੀਤੀ ਗਈ ਹੈ?",
    q_wiring: "ਕੇਬਲਿੰਗ ਸਥਿਤੀ ਚੁਣੋ:",
    opt_wired_yes: "ਹਾਂ - ਕੇਬਲਿੰਗ ਪਹਿਲਾਂ ਹੀ ਹੋ ਚੁੱਕੀ ਹੈ",
    opt_wired_no: "ਨਹੀਂ - ਪੂਰੀ ਇੰਸਟਾਲੇਸ਼ਨ ਦੀ ਲੋੜ ਹੈ",
    q_wiring_type: "ਲੋੜੀਂਦੀ ਵਾਇਰਿੰਗ ਦੀ ਕਿਸਮ:",
    opt_wiring_open: "ਓਪਨ ਵਾਇਰਿੰਗ",
    opt_wiring_conduit: "ਕੰਡਿਊਟ / ਫਲੈਟ ਪਾਈਪ"
  },
  or: {
    step_wiring: "ଆପଣଙ୍କ ସମ୍ପତ୍ତିରେ ପୂର୍ବରୁ ସିସିଟିଭି ପାଇଁ ତାର ବିଛାଯାଇଛି କି?",
    q_wiring: "କେବୁଲିଂ ସ୍ଥିତି ଚୟନ କରନ୍ତୁ:",
    opt_wired_yes: "ହଁ - କେବୁଲିଂ ପୂର୍ବରୁ ହୋଇସାରିଛି",
    opt_wired_no: "ନା - ସମ୍ପୂର୍ଣ୍ଣ ସ୍ଥାପନ ଆବଶ୍ୟକ",
    q_wiring_type: "ଆବଶ୍ୟକ ତାରର ପ୍ରକାର:",
    opt_wiring_open: "ଖୋଲା ତାର",
    opt_wiring_conduit: "କଣ୍ଡୁଇଟ୍ / ଫ୍ଲାଟ୍ ପାଇପ୍"
  }
};

let modifiedContent = content;

// Append safely right before quote_schedule_visit to make sure we are inside the object
for (const [lang, keys] of Object.entries(newTranslations)) {
  let appendStr = '';
  for (const [key, val] of Object.entries(keys)) {
    appendStr += `    ${key}: "${val}",\n`;
  }
  
  const langRegex = new RegExp(`(\\b${lang}\\b\\s*:\\s*{.*?quote_schedule_visit\\s*:\\s*".*?",\\s*)`, 's');
  modifiedContent = modifiedContent.replace(langRegex, `$1${appendStr}`);
}

// Add the new keys to the TranslationKey type
const newTypeKeys = Object.keys(newTranslations.en).map(k => `  | "${k}"`).join('\n');
modifiedContent = modifiedContent.replace('  | "feat_4g";', `  | "feat_4g"\n${newTypeKeys};`);


fs.writeFileSync(filePath, modifiedContent);
console.log('Wiring translations appended successfully.');
