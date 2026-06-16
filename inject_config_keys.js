const fs = require('fs');
let code = fs.readFileSync('lib/i18n/translations.ts', 'utf8');

const keysToAdd = {
  en: {
    "build_own_title": "Build your own system.",
    "build_own_desc": "Adjust every detail of your security setup.",
    "config_tool": "Configuration Tool",
    "config_desc": "Select and pin components to build a fully customized setup.",
    "tab_tech": "Technology",
    "tab_cam": "Cameras",
    "tab_rec": "Recorders",
    "tab_sto": "Storage",
    "tab_pow": "Power",
    "tab_acc": "Accessories",
    "search_cam": "Search cameras...",
    "swipe_cmp": "Swipe to compare Base vs Custom"
  },
  hi: {
    "build_own_title": "अपना खुद का सिस्टम बनाएं।",
    "build_own_desc": "अपने सुरक्षा सेटअप के हर विवरण को एडजस्ट करें।",
    "config_tool": "कॉन्फ़िगरेशन टूल",
    "config_desc": "पूरी तरह से कस्टमाइज़्ड सेटअप बनाने के लिए कंपोनेंट चुनें और पिन करें।",
    "tab_tech": "तकनीक",
    "tab_cam": "कैमरे",
    "tab_rec": "रिकॉर्डर",
    "tab_sto": "स्टोरेज",
    "tab_pow": "पावर",
    "tab_acc": "एक्सेसरीज",
    "search_cam": "कैमरे खोजें...",
    "swipe_cmp": "बेस और कस्टम की तुलना करने के लिए स्वाइप करें"
  },
  mr: {
    "build_own_title": "आपली स्वतःची प्रणाली तयार करा.",
    "build_own_desc": "तुमच्या सुरक्षा सेटअपचे प्रत्येक तपशील समायोजित करा.",
    "config_tool": "कॉन्फिगरेशन टूल",
    "config_desc": "पूर्णपणे सानुकूलित सेटअप तयार करण्यासाठी घटक निवडा आणि पिन करा.",
    "tab_tech": "तंत्रज्ञान",
    "tab_cam": "कॅमेरे",
    "tab_rec": "रेकॉर्डर्स",
    "tab_sto": "स्टोरेज",
    "tab_pow": "पॉवर",
    "tab_acc": "अॅक्सेसरीज",
    "search_cam": "कॅमेरे शोधा...",
    "swipe_cmp": "बेस विरुद्ध कस्टमची तुलना करण्यासाठी स्वाइप करा"
  },
  gu: {
    "build_own_title": "તમારી પોતાની સિસ્ટમ બનાવો.",
    "build_own_desc": "તમારા સુરક્ષા સેટઅપની દરેક વિગતને સમાયોજિત કરો.",
    "config_tool": "કન્ફિગરેશન ટૂલ",
    "config_desc": "સંપૂર્ણ કસ્ટમાઇઝ્ડ સેટઅપ બનાવવા માટે ઘટકો પસંદ કરો અને પિન કરો.",
    "tab_tech": "ટેકનોલોજી",
    "tab_cam": "કેમેરા",
    "tab_rec": "રેકોર્ડર્સ",
    "tab_sto": "સ્ટોરેજ",
    "tab_pow": "પાવર",
    "tab_acc": "એસેસરીઝ",
    "search_cam": "કેમેરા શોધો...",
    "swipe_cmp": "બેઝ વિરુદ્ધ કસ્ટમની તુલના કરવા માટે સ્વાઇપ કરો"
  }
};

const langs = ['en', 'hi', 'mr', 'gu'];
for (const lang of langs) {
  const blockRegex = new RegExp(`^\\s*${lang}:\\s*\\{[\\s\\S]*?\\n\\s*\\},?$`, 'm');
  const match = code.match(blockRegex);
  if (match) {
    let block = match[0];
    let newEntries = "";
    for (const [k, v] of Object.entries(keysToAdd[lang])) {
      newEntries += `      '${k}': "${v}",\n`;
    }
    block = block.replace(/(\n\s*\},?$)/, `,\n${newEntries}$1`);
    code = code.replace(match[0], block);
  }
}

// Ensure the new keys are added to TranslationKey type
const typeMatch = code.match(/export type TranslationKey = \n([\s\S]*?);/);
if (typeMatch) {
  let typeBlock = typeMatch[1];
  for (const k of Object.keys(keysToAdd.en)) {
    if (!typeBlock.includes(`| "${k}"`)) {
      typeBlock += `\n  | "${k}"`;
    }
  }
  code = code.replace(typeMatch[1], typeBlock);
}

fs.writeFileSync('lib/i18n/translations.ts', code);
