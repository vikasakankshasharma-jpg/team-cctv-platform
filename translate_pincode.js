const fs = require('fs');
const path = require('path');

const srcFile = path.resolve('lib/i18n/translations.ts');
let code = fs.readFileSync(srcFile, 'utf8');

const keys = {
  hi: {
    "enter_pincode_placeholder": "पिनकोड दर्ज करें",
    "check_area": "क्षेत्र जांचें"
  },
  mr: {
    "enter_pincode_placeholder": "पिनकोड प्रविष्ट करा",
    "check_area": "क्षेत्र तपासा"
  },
  gu: {
    "enter_pincode_placeholder": "પિનકોડ દાખલ કરો",
    "check_area": "વિસ્તાર ચકાસો"
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
    for (const [key, val] of Object.entries(keys[locale])) {
      if (line.includes(`'${key}':`) || line.includes(`"${key}":`)) {
        lines[i] = `      '${key}': ${JSON.stringify(val)},`;
      }
    }
  }
}

fs.writeFileSync(srcFile, lines.join('\n'), 'utf8');
console.log('Pincode keys updated!');
