const fs = require('fs');
const file = 'lib/i18n/translations.ts';
let code = fs.readFileSync(file, 'utf8');

const dicts = {
  hi: {
    'select_plan': "योजना चुनें",
    'view_quote': "कोटेशन देखें",
    'book_visit': "विज़िट बुक करें",
    'build_own_title': "अपना खुद का सिस्टम बनाएं",
    'build_own_desc': "अपनी सुरक्षा व्यवस्था के हर विवरण को कस्टमाइज़ करें।",
    'swipe_cmp': "तुलना करने के लिए स्वाइप करें",
    'config_tool': "कॉन्फ़िगरेशन टूल",
    'config_desc': "पूरी तरह से अनुकूलित सेटअप बनाने के लिए घटकों का चयन करें और पिन करें।",
    'search_cam': "कैमरे खोजें...",
    'quote_total': "कुल राशि",
    'quote_download_pdf': "पीडीएफ डाउनलोड करें",
    'quote_schedule_visit': "साइट विज़िट बुक करें",
    'quote_summary': "कोटेशन सारांश",
    'quote_h1': "आपकी सुरक्षा,",
    'quote_h1_span': "सरल बना दी गई।",
    'quote_prep': "खासकर आपके लिए तैयार, ",
    'quote_rec': "नीचे हमारे अनुशंसित",
    'quote_pkg': "पैकेज देखें या अपना खुद का बनाएं।",
    'quote_exp': "कोटेशन की अवधि समाप्त",
    'quote_exp_desc': "यह कोटेशन 7 दिनों से अधिक पुराना है। कैमरे के पुर्जों की कीमतें बदलती रहती हैं, इसलिए हमें आपके लिए एक नया कोटेशन बनाना होगा।",
    'quote_req_new': "नए कोटेशन का अनुरोध करें",
    'quote_awaiting': "अनुमोदन की प्रतीक्षा में",
    'quote_accepted': "स्वीकृत",
    'quote_expired': "समाप्त",
    'quote_rejected': "अस्वीकृत",
    'download_pdf': "पीडीएफ डाउनलोड करें",
    'quotation': "कोटेशन",
    'bill_of_materials': "सामग्री का बिल",
    'total': "कुल",
    'complete_your_order': "अपना ऑर्डर पूरा करें",
    'complete_your_order_desc': "भुगतान विकल्प चुनें जो आपके लिए सबसे अच्छा हो।",
    'full': "पूरा",
    'advance': "एडवांस",
    'processing': "प्रोसेसिंग...",
    'pay_full_amount': "पूरी राशि का भुगतान करें",
    'price_match': "प्राइस मैच गारंटी",
    'price_match_desc': "बेहतर कीमत मिली? कोट अपलोड करें और हम उससे बेहतर कीमत देंगे।",
    'price_match_btn': "प्रतियोगी कोटेशन अपलोड करें",
    'upload_quote': "कोट अपलोड करें",
    'uploading': "अपलोड हो रहा है...",
    'submit_price_match': "प्राइस मैच के लिए सबमिट करें",
    'submitting': "सबमिट हो रहा है...",
    'price_match_success': "कोट सफलतापूर्वक सबमिट किया गया",
    'price_match_success_desc': "हमारी टीम प्रतियोगी कोटेशन की समीक्षा करेगी और 24 घंटे के भीतर बेहतर कीमत के साथ आपसे संपर्क करेगी।"
  },
  gu: {
    'select_plan': "પ્લાન પસંદ કરો",
    'view_quote': "ક્વોટેશન જુઓ",
    'book_visit': "મુલાકાત બુક કરો",
    'build_own_title': "તમારી પોતાની સિસ્ટમ બનાવો",
    'build_own_desc': "તમારી સુરક્ષા વ્યવસ્થાની દરેક વિગતોને કસ્ટમાઇઝ કરો.",
    'swipe_cmp': "સરખામણી કરવા માટે સ્વાઇપ કરો",
    'config_tool': "રૂપરેખાંકન સાધન",
    'config_desc': "સંપૂર્ણ કસ્ટમાઇઝ્ડ સેટઅપ બનાવવા માટે ઘટકો પસંદ કરો અને પિન કરો.",
    'search_cam': "કેમેરા શોધો...",
    'quote_total': "કુલ રકમ",
    'quote_download_pdf': "પીડીએફ ડાઉનલોડ કરો",
    'quote_schedule_visit': "સાઇટ મુલાકાત બુક કરો",
    'quote_summary': "ક્વોટેશન સારાંશ",
    'quote_h1': "તમારી સુરક્ષા,",
    'quote_h1_span': "સરળ બનાવી.",
    'quote_prep': "ખાસ તમારા માટે તૈયાર, ",
    'quote_rec': "નીચે અમારા ભલામણ કરેલ",
    'quote_pkg': "પેકેજો જુઓ અથવા તમારું પોતાનું બનાવો.",
    'quote_exp': "ક્વોટેશનની મુદત પૂરી થઈ ગઈ",
    'quote_exp_desc': "આ ક્વોટેશન 7 દિવસથી વધુ જૂનું છે. કેમેરાના ભાગોના ભાવ બદલાતા રહે છે, તેથી અમારે તમારા માટે નવું ક્વોટેશન બનાવવું પડશે.",
    'quote_req_new': "નવા ક્વોટેશનની વિનંતી કરો",
    'quote_awaiting': "મંજૂરીની રાહ જોવાય છે",
    'quote_accepted': "સ્વીકૃત",
    'quote_expired': "સમાપ્ત",
    'quote_rejected': "નકારવામાં આવ્યું",
    'download_pdf': "પીડીએફ ડાઉનલોડ કરો",
    'quotation': "ક્વોટેશન",
    'bill_of_materials': "સામગ્રીનું બિલ",
    'total': "કુલ",
    'complete_your_order': "તમારો ઓર્ડર પૂર્ણ કરો",
    'complete_your_order_desc': "ચુકવણી વિકલ્પ પસંદ કરો જે તમારા માટે શ્રેષ્ઠ હોય.",
    'full': "સંપૂર્ણ",
    'advance': "એડવાન્સ",
    'processing': "પ્રક્રિયા ચાલુ છે...",
    'pay_full_amount': "પૂરી રકમ ચૂકવો",
    'price_match': "પ્રાઇસ મેચ ગેરંટી",
    'price_match_desc': "વધુ સારી કિંમત મળી? ક્વોટ અપલોડ કરો અને અમે તેનાથી સારી કિંમત આપીશું.",
    'price_match_btn': "પ્રતિસ્પર્ધી ક્વોટેશન અપલોડ કરો",
    'upload_quote': "ક્વોટ અપલોડ કરો",
    'uploading': "અપલોડ થઈ રહ્યું છે...",
    'submit_price_match': "પ્રાઇસ મેચ માટે સબમિટ કરો",
    'submitting': "સબમિટ થઈ રહ્યું છે...",
    'price_match_success': "ક્વોટ સફળતાપૂર્વક સબમિટ કરવામાં આવ્યું",
    'price_match_success_desc': "અમારી ટીમ પ્રતિસ્પર્ધી ક્વોટેશનની સમીક્ષા કરશે અને 24 કલાકમાં વધુ સારી કિંમત સાથે તમારો સંપર્ક કરશે."
  },
  mr: {
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
    'pay_full_amount': "पूर्ण रक्कम भरा",
    'price_match': "प्राइस मॅच गॅरंटी",
    'price_match_desc': "चांगली किंमत मिळाली? कोट अपलोड करा आणि आम्ही त्याहून चांगली किंमत देऊ.",
    'price_match_btn': "प्रतिस्पर्धी कोटेशन अपलोड करा",
    'upload_quote': "कोट अपलोड करा",
    'uploading': "अपलोड होत आहे...",
    'submit_price_match': "प्राइस मॅचसाठी सबमिट करा",
    'submitting': "सबमिट होत आहे...",
    'price_match_success': "कोट यशस्वीरित्या सबमिट केले",
    'price_match_success_desc': "आमची टीम प्रतिस्पर्धी कोटेशनचे पुनरावलोकन करेल आणि 24 तासांच्या आत चांगल्या किंमतीसह तुमच्याशी संपर्क साधेल."
  },
  ta: {
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
    'pay_full_amount': "முழு தொகையையும் செலுத்தவும்",
    'price_match': "விலை பொருத்த உத்தரவாதம்",
    'price_match_desc': "சிறந்த விலையைக் கண்டுபிடித்தீர்களா? மேற்கோளைப் பதிவேற்றவும், நாங்கள் அதை விட சிறந்த விலையை வழங்குவோம்.",
    'price_match_btn': "போட்டியாளர் மேற்கோளை பதிவேற்றவும்",
    'upload_quote': "மேற்கோளை பதிவேற்றவும்",
    'uploading': "பதிவேற்றப்படுகிறது...",
    'submit_price_match': "விலை பொருத்தத்திற்கு சமர்ப்பிக்கவும்",
    'submitting': "சமர்ப்பிக்கப்படுகிறது...",
    'price_match_success': "மேற்கோள் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது",
    'price_match_success_desc': "எங்கள் குழு போட்டியாளரின் மேற்கோளை மதிப்பாய்வு செய்து 24 மணி நேரத்திற்குள் சிறந்த விலையுடன் உங்களைத் தொடர்புகொள்ளும்."
  }
};

const missingKeys = Object.keys(dicts.hi);
// Also append missing ones like tab_cam from previous attempt
const moreKeys = ['tab_tech', 'tab_cam', 'tab_rec', 'tab_sto', 'tab_pow', 'tab_acc', 'step_storage_desc', 'step_features_desc', 'step_general_addons_desc', 'wiz_sel_all', 'wiz_multi', 'No Storage Required', '3 Months'];
missingKeys.push(...moreKeys);

// Step 1: Update TranslationKey union
let unionAppend = "";
for (const key of missingKeys) {
  if (!code.includes(`| "${key}"`) && !code.includes(`| '${key}'`)) {
    unionAppend += `\n  | "${key}"`;
  }
}
code = code.replace(/(export type TranslationKey =[\s\S]*?)(\nexport const translations)/, `$1${unionAppend}$2`);

// Step 2: Inject Translations
const lines = code.split('\n');

const boundaries = [];
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('hi: {')) boundaries.push({ lang: 'hi', start: i });
  if (lines[i].includes('mr: {')) boundaries.push({ lang: 'mr', start: i });
  if (lines[i].includes('gu: {')) boundaries.push({ lang: 'gu', start: i });
  if (lines[i].includes('ta: {')) boundaries.push({ lang: 'ta', start: i });
}

for (let i = 0; i < boundaries.length; i++) {
  boundaries[i].end = boundaries[i + 1] ? boundaries[i + 1].start - 1 : lines.length - 1;
}

for (const b of boundaries) {
  const lang = b.lang;
  const dict = dicts[lang];
  for (let i = b.start; i <= b.end; i++) {
    for (const [key, val] of Object.entries(dict)) {
      const keyRegex = new RegExp(`^\\s*['"]?${key}['"]?:\\s*".*?"\\s*,?\\s*$`);
      if (keyRegex.test(lines[i])) {
        lines[i] = lines[i].replace(/:\s*".*?"/, `: "${val}"`);
        delete dict[key];
      }
    }
  }
  const remainingKeys = Object.keys(dict);
  if (remainingKeys.length > 0) {
    let endIdx = b.end;
    while (endIdx > b.start && !lines[endIdx].includes('},')) {
      endIdx--;
    }
    const newLines = remainingKeys.map(k => `      '${k}': "${dict[k]}",`);
    lines.splice(endIdx, 0, ...newLines);
    for (let j = 0; j < boundaries.length; j++) {
      if (boundaries[j].start > endIdx) boundaries[j].start += newLines.length;
      if (boundaries[j].end > endIdx) boundaries[j].end += newLines.length;
    }
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log("Translations and Types fixed completely.");
