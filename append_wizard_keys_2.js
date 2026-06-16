const fs = require('fs');
const path = require('path');

const srcFile = path.resolve('lib/i18n/translations.ts');
let code = fs.readFileSync(srcFile, 'utf8');

const newKeys = {
  en: {
    "step_storage_desc": "How far back do you need to watch old recordings?",
    "step_features_desc": "Any special camera capabilities required?",
    "step_general_addons_desc": "Would you like to include any extra accessories?",
    "wiz_sel_all": "Select all that apply",
    "wiz_multi": "You can pick more than one option. Click Continue when done.",
    "No Storage Required": "No Storage Required",
    "3 Months": "3 Months"
  },
  hi: {
    "step_storage_desc": "आप पुरानी रिकॉर्डिंग कितने समय तक की देखना चाहते हैं?",
    "step_features_desc": "क्या कोई विशेष कैमरा सुविधाओं की आवश्यकता है?",
    "step_general_addons_desc": "क्या आप कोई अतिरिक्त सहायक उपकरण शामिल करना चाहेंगे?",
    "wiz_sel_all": "लागू होने वाले सभी चुनें",
    "wiz_multi": "आप एक से अधिक विकल्प चुन सकते हैं। हो जाने पर 'जारी रखें' पर क्लिक करें।",
    "No Storage Required": "कोई स्टोरेज आवश्यक नहीं",
    "3 Months": "3 महीने"
  },
  mr: {
    "step_storage_desc": "तुम्हाला किती जुने रेकॉर्डिंग पाहायचे आहे?",
    "step_features_desc": "काही विशेष कॅमेरा वैशिष्ट्ये आवश्यक आहेत का?",
    "step_general_addons_desc": "तुम्हाला कोणतेही अतिरिक्त ॲक्सेसरीज समाविष्ट करायला आवडेल का?",
    "wiz_sel_all": "लागू होणारे सर्व निवडा",
    "wiz_multi": "तुम्ही एकापेक्षा जास्त पर्याय निवडू शकता. पूर्ण झाल्यावर 'पुढे जा' वर क्लिक करा.",
    "No Storage Required": "स्टोरेजची आवश्यकता नाही",
    "3 Months": "3 महिने"
  },
  gu: {
    "step_storage_desc": "તમારે કેટલા જૂના રેકોર્ડિંગ્સ જોવાની જરૂર છે?",
    "step_features_desc": "શું કોઈ વિશેષ કેમેરા ક્ષમતાઓની જરૂર છે?",
    "step_general_addons_desc": "શું તમે કોઈ વધારાની એસેસરીઝ શામેલ કરવા માંગો છો?",
    "wiz_sel_all": "લાગુ પડતા તમામ પસંદ કરો",
    "wiz_multi": "તમે એક કરતા વધુ વિકલ્પ પસંદ કરી શકો છો. પૂર્ણ થાય ત્યારે 'ચાલુ રાખો' પર ક્લિક કરો.",
    "No Storage Required": "કોઈ સ્ટોરેજ જરૂરી નથી",
    "3 Months": "3 મહિના"
  }
};

const locales = ['en', 'hi', 'mr', 'gu'];
let lines = code.split('\n');

for (const locale of locales) {
  let startIndex = -1;
  let endIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === `${locale}: {`) {
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
  
  const blockLines = lines.slice(startIndex, endIndex);
  
  for (const [key, val] of Object.entries(newKeys[locale])) {
    let found = false;
    for (let j = 0; j < blockLines.length; j++) {
      if (blockLines[j].includes(`'${key}':`) || blockLines[j].includes(`"${key}":`)) {
        blockLines[j] = `      '${key}': ${JSON.stringify(val)},`;
        found = true;
        break;
      }
    }
    if (!found) {
      blockLines.push(`      '${key}': ${JSON.stringify(val)},`);
    }
  }
  
  lines = lines.slice(0, startIndex).concat(blockLines).concat(lines.slice(endIndex));
}

fs.writeFileSync(srcFile, lines.join('\n'), 'utf8');
console.log('Wizard keys appended to en, hi, mr, gu!');
