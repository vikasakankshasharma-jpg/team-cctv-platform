const fs = require('fs');

const mrTranslations = {
  'select_plan': "योजना निवडा",
  'view_quote': "कोटेशन पहा",
  'book_visit': "भेट बुक करा",
  'build_own_title': "तुमची स्वतःची सिस्टम तयार करा",
  'build_own_desc': "तुमच्या सुरक्षा व्यवस्थेचे प्रत्येक तपशील कस्टमाइझ करा.",
  'swipe_cmp': "तुलना करण्यासाठी स्वाइप करा",
  'config_tool': "कॉन्फिगरेशन टूल",
  'config_desc': "संपूर्ण सानुकूलित सेटअप तयार करण्यासाठी घटक निवडा आणि पिन करा.",
  'search_cam': "कॅमेरे शोधा...",
  'quote_total': "एकूण रक्कम",
  'quote_download_pdf': "पीडीएफ डाउनलोड करा",
  'quote_schedule_visit': "साइट भेट बुक करा",
  'quote_summary': "कोटेशन सारांश",
  'quote_h1': "तुमची सुरक्षा,",
  'quote_h1_span': "सोपी केली.",
  'quote_prep': "खास तुमच्यासाठी तयार, ",
  'quote_rec': "खालील आमचे शिफारस केलेले",
  'quote_pkg': "पॅकेजेस पहा किंवा तुमचे स्वतःचे बनवा.",
  'quote_exp': "कोटेशन संपले",
  'quote_exp_desc': "हे कोटेशन ७ दिवसांपेक्षा जुने आहे. कॅमेऱ्याच्या भागांच्या किमती बदलत असतात, त्यामुळे आम्हाला तुमच्यासाठी एक नवीन कोटेशन बनवावे लागेल.",
  'quote_req_new': "नवीन कोटेशनची विनंती करा",
  'quote_awaiting': "मंजुरीच्या प्रतीक्षेत",
  'quote_accepted': "स्वीकृत",
  'quote_expired': "समाप्त",
  'quote_rejected': "नाकारले",
  'download_pdf': "पीडीएफ डाउनलोड करा",
  'quotation': "कोटेशन",
  'bill_of_materials': "साहित्याचे बिल",
  'total': "एकूण",
  'complete_your_order': "तुमची ऑर्डर पूर्ण करा",
  'complete_your_order_desc': "तुमच्यासाठी सर्वोत्तम असा पेमेंट पर्याय निवडा.",
  'full': "संपूर्ण",
  'advance': "अॅडव्हान्स",
  'processing': "प्रक्रिया सुरू आहे...",
  'pay_full_amount': "पूर्ण रक्कम भरा"
};

const taTranslations = {
  'select_plan': "திட்டத்தை தேர்ந்தெடுக்கவும்",
  'view_quote': "மேற்கோளை பார்க்கவும்",
  'book_visit': "பார்வையை பதிவு செய்யவும்",
  'build_own_title': "உங்கள் சொந்த அமைப்பை உருவாக்கவும்",
  'build_own_desc': "உங்கள் பாதுகாப்பு அமைப்பின் ஒவ்வொரு விவரத்தையும் தனிப்பயனாக்கவும்.",
  'swipe_cmp': "ஒப்பிட ஸ்வைப் செய்யவும்",
  'config_tool': "கட்டமைப்பு கருவி",
  'config_desc': "முழுமையான தனிப்பயனாக்கப்பட்ட அமைப்பை உருவாக்க கூறுகளை தேர்ந்தெடுத்து பின் செய்யவும்.",
  'search_cam': "கேமராக்களைத் தேடு...",
  'quote_total': "மொத்த தொகை",
  'quote_download_pdf': "PDF பதிவிறக்கவும்",
  'quote_schedule_visit': "தள வருகையை பதிவு செய்யவும்",
  'quote_summary': "மேற்கோள் சுருக்கம்",
  'quote_h1': "உங்கள் பாதுகாப்பு,",
  'quote_h1_span': "எளிதாக்கப்பட்டது.",
  'quote_prep': "உங்களுக்காக சிறப்பாக தயாரிக்கப்பட்டது, ",
  'quote_rec': "கீழே எங்கள் பரிந்துரைக்கப்பட்ட",
  'quote_pkg': "தொகுப்புகளை பார்க்கவும் அல்லது உங்கள் சொந்தத்தை உருவாக்கவும்.",
  'quote_exp': "மேற்கோள் காலாவதியானது",
  'quote_exp_desc': "இந்த மேற்கோள் 7 நாட்களுக்கு மேல் பழையது. கேமரா பாகங்களின் விலைகள் மாறும், எனவே உங்களுக்காக நாங்கள் புதிய ஒன்றை உருவாக்க வேண்டும்.",
  'quote_req_new': "புதிய மேற்கோளைக் கோரவும்",
  'quote_awaiting': "ஒப்புதலுக்காக காத்திருக்கிறது",
  'quote_accepted': "ஏற்றுக்கொள்ளப்பட்டது",
  'quote_expired': "காலாவதியானது",
  'quote_rejected': "நிராகரிக்கப்பட்டது",
  'download_pdf': "PDF பதிவிறக்கவும்",
  'quotation': "மேற்கோள்",
  'bill_of_materials': "பொருட்களின் பில்",
  'total': "மொத்தம்",
  'complete_your_order': "உங்கள் ஆர்டரை முடிக்கவும்",
  'complete_your_order_desc': "உங்களுக்கு மிகவும் பொருத்தமான கட்டண விருப்பத்தை தேர்வு செய்யவும்.",
  'full': "முழு",
  'advance': "முன்பணம்",
  'processing': "செயலாக்கப்படுகிறது...",
  'pay_full_amount': "முழு தொகையையும் செலுத்தவும்"
};

const file = 'lib/i18n/translations.ts';
let content = fs.readFileSync(file, 'utf8');

function updateLang(lang, dict) {
  const langRegex = new RegExp(`('${lang}':\\s*{[\\s\\S]*?)(};)`, 'm');
  const match = content.match(langRegex);
  
  if (match) {
    let block = match[1];
    
    for (const [key, val] of Object.entries(dict)) {
      const keyRegex = new RegExp(`('${key}'|${key}):\\s*".*?"`, 'g');
      if (block.match(keyRegex)) {
        block = block.replace(keyRegex, `'${key}': "${val}"`);
      } else {
        block = block.replace(/,\s*$/g, '') + `,\n      '${key}': "${val}"\n    `;
      }
    }
    content = content.replace(langRegex, block + '$2');
  }
}

updateLang('mr', mrTranslations);
updateLang('ta', taTranslations);

fs.writeFileSync(file, content);
console.log("Translations injected for mr and ta!");
