const fs = require('fs');
const ts = require('typescript');

const file = 'c:/Users/hp/Documents/TEAM Website/secure-easy/lib/i18n/translations.ts';
const content = fs.readFileSync(file, 'utf8');

let jsContent = ts.transpileModule(content, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;

fs.writeFileSync('temp_translations.js', jsContent);

const { translations } = require('./temp_translations.js');

const englishKeys = Object.keys(translations['en']);
console.log('Total English keys:', englishKeys.length);

const locales = Object.keys(translations);
for (const locale of locales) {
  if (locale === 'en') continue;
  const localeKeys = Object.keys(translations[locale]);
  const missing = englishKeys.filter(k => !localeKeys.includes(k));
  if (missing.length > 0) {
    console.log('Locale ' + locale + ' is missing ' + missing.length + ' keys: ' + missing.join(', '));
  } else {
    console.log('Locale ' + locale + ' is complete.');
  }
}
