const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../lib/i18n/translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

const newTranslations = {
  en: {
    step_wiring: "Wiring",
    step_wiring_desc: "Is your property already wired for CCTV?",
    dynamic_step_resolution_desc: "What image quality do you need?",
    step_timeline: "Timeline",
    step_timeline_desc: "How soon do you need this system installed?",
    q_timeline: "Select urgency:",
    fopt_t_asap: "ASAP (Today/Tomorrow)",
    fopt_t_week: "Within a week",
    fopt_t_month: "Next Month",
    fopt_t_research: "Just researching"
  },
  hi: {
    step_wiring: "वायरिंग",
    step_wiring_desc: "क्या आपकी प्रॉपर्टी में CCTV के लिए वायरिंग हो चुकी है?",
    dynamic_step_resolution_desc: "आपको किस छवि गुणवत्ता की आवश्यकता है?",
    step_timeline: "समयरेखा",
    step_timeline_desc: "आपको यह सिस्टम कितनी जल्दी स्थापित करने की आवश्यकता है?",
    q_timeline: "तात्कालिकता चुनें:",
    fopt_t_asap: "जितनी जल्दी हो सके (आज/कल)",
    fopt_t_week: "एक सप्ताह के भीतर",
    fopt_t_month: "अगले महीने",
    fopt_t_research: "केवल शोध कर रहे हैं"
  },
  mr: {
    step_wiring: "वायरिंग",
    step_wiring_desc: "तुमच्या प्रॉपर्टीवर आधीच CCTV वायरिंग झाली आहे का?",
    dynamic_step_resolution_desc: "तुम्हाला कोणत्या प्रतिमेच्या गुणवत्तेची आवश्यकता आहे?",
    step_timeline: "वेळापत्रक",
    step_timeline_desc: "तुम्हाला ही सिस्टम किती लवकर स्थापित करणे आवश्यक आहे?",
    q_timeline: "निकड निवडा:",
    fopt_t_asap: "लवकरात लवकर (आज/उद्या)",
    fopt_t_week: "एका आठवड्याच्या आत",
    fopt_t_month: "पुढच्या महिन्यात",
    fopt_t_research: "फक्त संशोधन करत आहे"
  },
  gu: {
    step_wiring: "વાયરિંગ",
    step_wiring_desc: "શું તમારી મિલકત પહેલેથી જ CCTV માટે વાયર થયેલ છે?",
    dynamic_step_resolution_desc: "તમારે કઈ છબી ગુણવત્તાની જરૂર છે?",
    step_timeline: "સમયરેખા",
    step_timeline_desc: "તમારે આ સિસ્ટમ કેટલી જલ્દી ઇન્સ્ટોલ કરવાની જરૂર છે?",
    q_timeline: "તાકીદ પસંદ કરો:",
    fopt_t_asap: "શક્ય તેટલું વહેલું (આજે/આવતીકાલે)",
    fopt_t_week: "એક અઠવાડિયાની અંદર",
    fopt_t_month: "આવતા મહિને",
    fopt_t_research: "ફક્ત સંશોધન કરી રહ્યા છીએ"
  },
  ta: {
    step_wiring: "வயரிங்",
    step_wiring_desc: "உங்கள் சொத்தில் ஏற்கனவே சிசிடிவி வயரிங் செய்யப்பட்டுள்ளதா?",
    dynamic_step_resolution_desc: "உங்களுக்கு என்ன படத் தரம் தேவை?",
    step_timeline: "காலவரிசை",
    step_timeline_desc: "இந்த அமைப்பை எவ்வளவு விரைவில் நிறுவ வேண்டும்?",
    q_timeline: "அவசரத்தைத் தேர்ந்தெடுக்கவும்:",
    fopt_t_asap: "கூடிய விரைவில் (இன்று/நாளை)",
    fopt_t_week: "ஒரு வாரத்திற்குள்",
    fopt_t_month: "அடுத்த மாதம்",
    fopt_t_research: "ஆராய்ச்சி மட்டுமே செய்கிறேன்"
  },
  te: {
    step_wiring: "వైరింగ్",
    step_wiring_desc: "మీ ఆస్తికి ఇప్పటికే సీసీటీవీ వైరింగ్ జరిగిందా?",
    dynamic_step_resolution_desc: "మీకు ఎలాంటి చిత్ర నాణ్యత కావాలి?",
    step_timeline: "కాలక్రమం",
    step_timeline_desc: "మీకు ఈ సిస్టమ్ ఎంత త్వరగా ఇన్‌స్టాల్ చేయబడాలి?",
    q_timeline: "అవసరాన్ని ఎంచుకోండి:",
    fopt_t_asap: "వీలైనంత త్వరగా (నేడు/రేపు)",
    fopt_t_week: "ఒక వారంలో",
    fopt_t_month: "వచ్చే నెల",
    fopt_t_research: "కేవలం పరిశోధిస్తున్నాను"
  },
  kn: {
    step_wiring: "ವೈರಿಂಗ್",
    step_wiring_desc: "ನಿಮ್ಮ ಆಸ್ತಿಗೆ ಈಗಾಗಲೇ ಸಿಸಿಟಿವಿ ವೈರಿಂಗ್ ಮಾಡಲಾಗಿದೆಯೇ?",
    dynamic_step_resolution_desc: "ನಿಮಗೆ ಯಾವ ಚಿತ್ರದ ಗುಣಮಟ್ಟ ಬೇಕು?",
    step_timeline: "ವೇಳಾಪಟ್ಟಿ",
    step_timeline_desc: "ನಿಮಗೆ ಈ ಸಿಸ್ಟಮ್ ಎಷ್ಟು ಬೇಗನೆ ಸ್ಥಾಪಿಸಬೇಕು?",
    q_timeline: "ತುರ್ತು ಆಯ್ಕೆಮಾಡಿ:",
    fopt_t_asap: "ಸಾಧ್ಯವಾದಷ್ಟು ಬೇಗ (ಇಂದು/ನಾಳೆ)",
    fopt_t_week: "ಒಂದು ವಾರದೊಳಗೆ",
    fopt_t_month: "ಮುಂದಿನ ತಿಂಗಳು",
    fopt_t_research: "ಕೇವಲ ಸಂಶೋಧನೆ ಮಾಡುತ್ತಿದ್ದೇನೆ"
  },
  bn: {
    step_wiring: "ওয়্যারিং",
    step_wiring_desc: "আপনার সম্পত্তিতে কি ইতিমধ্যে সিসিটিভির জন্য ওয়্যারিং করা আছে?",
    dynamic_step_resolution_desc: "আপনার কী মানের ছবি দরকার?",
    step_timeline: "সময়রেখা",
    step_timeline_desc: "আপনার এই সিস্টেমটি কত তাড়াতাড়ি ইনস্টল করা দরকার?",
    q_timeline: "জরুরী অবস্থা নির্বাচন করুন:",
    fopt_t_asap: "যত তাড়াতাড়ি সম্ভব (আজ/আগামীকাল)",
    fopt_t_week: "এক সপ্তাহের মধ্যে",
    fopt_t_month: "পরের মাসে",
    fopt_t_research: "শুধু গবেষণা করছি"
  },
  ml: {
    step_wiring: "വയറിംഗ്",
    step_wiring_desc: "നിങ്ങളുടെ പ്രോപ്പർട്ടിയിൽ ഇതിനകം സിസിടിവി വയറിംഗ് ചെയ്തിട്ടുണ്ടോ?",
    dynamic_step_resolution_desc: "നിങ്ങൾക്ക് ഏത് ഇമേജ് നിലവാരമാണ് വേണ്ടത്?",
    step_timeline: "സമയരേഖ",
    step_timeline_desc: "നിങ്ങൾക്ക് ഈ സിസ്റ്റം എത്ര വേഗം ഇൻസ്റ്റാൾ ചെയ്യണം?",
    q_timeline: "അടിയന്തരാവസ്ഥ തിരഞ്ഞെടുക്കുക:",
    fopt_t_asap: "കഴിയുന്നതും വേഗം (ഇന്ന്/നാളെ)",
    fopt_t_week: "ഒരാഴ്ചയ്ക്കുള്ളിൽ",
    fopt_t_month: "അടുത്ത മാസം",
    fopt_t_research: "ഗവേഷണം നടത്തുന്നു മാത്രം"
  },
  pa: {
    step_wiring: "ਵਾਇਰਿੰਗ",
    step_wiring_desc: "ਕੀ ਤੁਹਾਡੀ ਜਾਇਦਾਦ ਪਹਿਲਾਂ ਹੀ ਸੀਸੀਟੀਵੀ ਲਈ ਵਾਇਰ ਕੀਤੀ ਗਈ ਹੈ?",
    dynamic_step_resolution_desc: "ਤੁਹਾਨੂੰ ਕਿਸ ਚਿੱਤਰ ਗੁਣਵੱਤਾ ਦੀ ਲੋੜ ਹੈ?",
    step_timeline: "ਸਮਾਂ-ਰੇਖਾ",
    step_timeline_desc: "ਤੁਹਾਨੂੰ ਇਹ ਸਿਸਟਮ ਕਿੰਨੀ ਜਲਦੀ ਸਥਾਪਤ ਕਰਨ ਦੀ ਲੋੜ ਹੈ?",
    q_timeline: "ਜ਼ਰੂਰੀ ਚੁਣੋ:",
    fopt_t_asap: "ਜਿੰਨੀ ਜਲਦੀ ਹੋ ਸਕੇ (ਅੱਜ/ਕੱਲ੍ਹ)",
    fopt_t_week: "ਇੱਕ ਹਫ਼ਤੇ ਦੇ ਅੰਦਰ",
    fopt_t_month: "ਅਗਲੇ ਮਹੀਨੇ",
    fopt_t_research: "ਸਿਰਫ਼ ਖੋਜ ਕਰ ਰਿਹਾ ਹਾਂ"
  },
  or: {
    step_wiring: "ତାର",
    step_wiring_desc: "ଆପଣଙ୍କ ସମ୍ପତ୍ତିରେ ପୂର୍ବରୁ ସିସିଟିଭି ପାଇଁ ତାର ବିଛାଯାଇଛି କି?",
    dynamic_step_resolution_desc: "ଆପଣଙ୍କୁ କେଉଁ ଚିତ୍ର ଗୁଣବତ୍ତା ଆବଶ୍ୟକ?",
    step_timeline: "ସମୟରେଖା",
    step_timeline_desc: "ଆପଣଙ୍କୁ ଏହି ସିଷ୍ଟମ୍ କେତେ ଶୀଘ୍ର ସ୍ଥାପନ କରିବାକୁ ପଡିବ?",
    q_timeline: "ଜରୁରୀକାଳୀନତା ବାଛନ୍ତୁ:",
    fopt_t_asap: "ଯଥାଶୀଘ୍ର (ଆଜି/ଆସନ୍ତାକାଲି)",
    fopt_t_week: "ଗୋଟିଏ ସପ୍ତାହ ମଧ୍ୟରେ",
    fopt_t_month: "ଆସନ୍ତା ମାସରେ",
    fopt_t_research: "କେବଳ ଗବେଷଣା କରୁଛି"
  }
};

let modifiedContent = content;

for (const [lang, keys] of Object.entries(newTranslations)) {
  let appendStr = '';
  // The first key is step_wiring, which we want to use to OVERWRITE the existing step_wiring line.
  const regexWiring = new RegExp(`(\\b${lang}\\b\\s*:\\s*{.*?)(step_wiring\\s*:\\s*".*?",)(.*?)`, 's');
  
  const stepWiringReplacement = `step_wiring: "${keys.step_wiring}",\n    step_wiring_desc: "${keys.step_wiring_desc}",\n    dynamic_step_resolution_desc: "${keys.dynamic_step_resolution_desc}",`;
  
  modifiedContent = modifiedContent.replace(regexWiring, `$1${stepWiringReplacement}$3`);

  let appendTimelineStr = '';
  for (const key of ['step_timeline', 'step_timeline_desc', 'q_timeline', 'fopt_t_asap', 'fopt_t_week', 'fopt_t_month', 'fopt_t_research']) {
    appendTimelineStr += `    ${key}: "${keys[key]}",\n`;
  }
  
  const langRegex = new RegExp(`(\\b${lang}\\b\\s*:\\s*{.*?opt_res_8mp\\s*:\\s*".*?",\\s*)`, 's');
  modifiedContent = modifiedContent.replace(langRegex, `$1${appendTimelineStr}`);
}

const newTypeKeys = `  | "step_wiring_desc"\n  | "dynamic_step_resolution_desc"\n  | "step_timeline"\n  | "step_timeline_desc"\n  | "q_timeline"\n  | "fopt_t_asap"\n  | "fopt_t_week"\n  | "fopt_t_month"\n  | "fopt_t_research"`;
modifiedContent = modifiedContent.replace('  | "opt_res_8mp";', `  | "opt_res_8mp"\n${newTypeKeys};`);

fs.writeFileSync(filePath, modifiedContent);
console.log('Timeline translations appended successfully.');
