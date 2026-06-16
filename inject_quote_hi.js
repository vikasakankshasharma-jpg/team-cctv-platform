const fs = require('fs');

const hiTranslations = {
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
  'pay_full_amount': "पूरी राशि का भुगतान करें"
};

const guTranslations = {
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
  'pay_full_amount': "પૂરી રકમ ચૂકવો"
};

const file = 'lib/i18n/translations.ts';
let content = fs.readFileSync(file, 'utf8');

// Function to update translations
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
        // If key doesn't exist, append it before the end of the block
        // Wait, block usually ends with a lot of stuff, let's append at the end
        // Actually, just find the last comma or newline and add it
        block = block.replace(/,\s*$/g, '') + `,\n      '${key}': "${val}"\n    `;
      }
    }
    content = content.replace(langRegex, block + '$2');
  }
}

updateLang('hi', hiTranslations);
updateLang('gu', guTranslations);

fs.writeFileSync(file, content);
console.log("Translations injected!");
