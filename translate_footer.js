const fs = require('fs');
const path = require('path');

const srcFile = path.resolve('lib/i18n/translations.ts');
let code = fs.readFileSync(srcFile, 'utf8');

const footerKeys = {
  hi: {
    "footer_secure": "सुरक्षित और सत्यापित प्लेटफ़ॉर्म",
    "footer_serving": "संपूर्ण भारत में सेवाएँ",
    "footer_privacy": "गोपनीयता नीति",
    "footer_terms": "सेवा की शर्तें",
    "footer_partner": "पार्टनर लॉगिन",
    "footer_desc": "भारत की सर्वश्रेष्ठ CCTV इंस्टॉलेशन सर्विस"
  },
  mr: {
    "footer_secure": "सुरक्षित आणि सत्यापित प्लॅटफॉर्म",
    "footer_serving": "संपूर्ण भारतात सेवा",
    "footer_privacy": "गोपनीयता धोरण",
    "footer_terms": "सेवा अटी",
    "footer_partner": "पार्टनर लॉगिन",
    "footer_desc": "भारताची सर्वोत्तम CCTV इन्स्टॉलेशन सर्व्हिस"
  },
  gu: {
    "footer_secure": "સુરક્ષિત અને ચકાસાયેલ પ્લેટફોર્મ",
    "footer_serving": "સમગ્ર ભારતમાં સેવાઓ",
    "footer_privacy": "ગોપનીયતા નીતિ",
    "footer_terms": "સેવાની શરતો",
    "footer_partner": "પાર્ટનર લોગિન",
    "footer_desc": "ભારતની શ્રેષ્ઠ CCTV ઇન્સ્ટોલેશન સર્વિસ"
  }
};

const locales = ['hi', 'mr', 'gu'];
let lines = code.split('\n');

for (const locale of locales) {
  let startIndex = -1;
  let endIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`  ${locale}: {`)) {
      startIndex = i;
      break;
    }
  }
  
  if (startIndex === -1) continue;
  
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (lines[i].includes(`  },`) || lines[i].includes(`};`)) {
      endIndex = i;
      break;
    }
    if (lines[i].includes(`  hi: {`) || lines[i].includes(`  mr: {`) || lines[i].includes(`  gu: {`)) {
      endIndex = i - 1;
      break;
    }
  }
  if (endIndex === -1) endIndex = lines.length;
  
  for (let i = startIndex; i < endIndex; i++) {
    const line = lines[i];
    for (const [key, val] of Object.entries(footerKeys[locale])) {
      if (line.includes(`'${key}':`) || line.includes(`"${key}":`)) {
        lines[i] = `      '${key}': ${JSON.stringify(val)},`;
      }
    }
  }
}

fs.writeFileSync(srcFile, lines.join('\n'), 'utf8');
console.log('Footer keys updated!');
