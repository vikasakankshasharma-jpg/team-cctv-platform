const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');
const path = require('path');

const srcFile = path.resolve('lib/i18n/translations.ts');
const project = new Project();
const sourceFile = project.addSourceFileAtPath(srcFile);

const toAdd = {
  en: {
    "perfect_coverage": "Perfect Coverage",
    "perfect_coverage_desc": "We make sure every corner of your property is covered, leaving no blind spots for complete peace of mind.",
    "right_cameras": "Right Cameras",
    "right_cameras_desc": "We'll suggest the best camera technology for your specific needs, whether it's a small home or a large warehouse.",
    "clear_pricing": "Clear Pricing",
    "clear_pricing_desc": "Get three easy-to-understand price options (Value, Professional, and Elite) so you can choose what fits your budget.",
    "how_it_works": "How It Works",
    "easy_security": "Easy Security For Everyone."
  },
  hi: {
    "perfect_coverage": "पूरा कवरेज",
    "perfect_coverage_desc": "हम सुनिश्चित करते हैं कि आपकी संपत्ति का हर कोना सुरक्षित रहे और कोई भी हिस्सा नज़र से न बचे।",
    "right_cameras": "सही कैमरा",
    "right_cameras_desc": "हम आपकी आवश्यकता के अनुसार बेहतरीन कैमरा तकनीक का सुझाव देते हैं, चाहे वह छोटा घर हो या बड़ा गोदाम।",
    "clear_pricing": "पारदर्शी मूल्य निर्धारण",
    "clear_pricing_desc": "तीन आसान विकल्प (Value, Professional, Elite) ताकि आप अपने बजट के अनुसार चुन सकें।",
    "how_it_works": "यह कैसे काम करता है",
    "easy_security": "सबके लिए आसान सुरक्षा।"
  },
  mr: {
    "perfect_coverage": "संपूर्ण कव्हरेज",
    "perfect_coverage_desc": "तुमच्या मालमत्तेचा प्रत्येक कोपरा सुरक्षित राहील आणि कोणताही भाग नजरेतून सुटणार नाही याची आम्ही खात्री करतो.",
    "right_cameras": "योग्य कॅमेरे",
    "right_cameras_desc": "आम्ही तुमच्या गरजेनुसार सर्वोत्तम कॅमेरा तंत्रज्ञान सुचवतो, मग ते लहान घर असो वा मोठे गोदाम.",
    "clear_pricing": "पारदर्शक किंमत",
    "clear_pricing_desc": "तीन सोपे पर्याय (Value, Professional, Elite) जेणेकरून तुम्ही तुमच्या बजेटनुसार निवडू शकता.",
    "how_it_works": "हे कसे कार्य करते",
    "easy_security": "सर्वांसाठी सोपी सुरक्षा."
  },
  gu: {
    "perfect_coverage": "સંપૂર્ણ કવરેજ",
    "perfect_coverage_desc": "અમે ખાતરી કરીએ છીએ કે તમારી મિલકતનો દરેક ખૂણો સુરક્ષિત રહે અને કોઈ પણ ભાગ નજરથી બચે નહીં.",
    "right_cameras": "યોગ્ય કેમેરા",
    "right_cameras_desc": "અમે તમારી જરૂરિયાત મુજબ શ્રેષ્ઠ કેમેરા ટેકનોલોજી સૂચવીએ છીએ, ભલે તે નાનું ઘર હોય કે મોટું ગોડાઉન.",
    "clear_pricing": "સ્પષ્ટ કિંમત",
    "clear_pricing_desc": "ત્રણ સરળ વિકલ્પો (Value, Professional, Elite) જેથી તમે તમારા બજેટ મુજબ પસંદ કરી શકો.",
    "how_it_works": "આ કેવી રીતે કામ કરે છે",
    "easy_security": "દરેક માટે સરળ સુરક્ષા."
  }
};

const translationsDecl = sourceFile.getVariableDeclarationOrThrow('translations');
const translationsObj = translationsDecl.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

const locales = ['en', 'hi', 'mr', 'gu'];

for (const locale of locales) {
  const localeProp = translationsObj.getPropertyOrThrow(locale);
  if (localeProp.isKind(SyntaxKind.PropertyAssignment)) {
    const localeObj = localeProp.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    
    for (const [key, val] of Object.entries(toAdd[locale])) {
      const existingProp = localeObj.getProperty(`'${key}'`) || localeObj.getProperty(`"${key}"`) || localeObj.getProperty(key);
      if (existingProp && existingProp.isKind(SyntaxKind.PropertyAssignment)) {
        existingProp.setInitializer(JSON.stringify(val));
      } else {
        localeObj.addPropertyAssignment({
          name: `'${key}'`,
          initializer: JSON.stringify(val)
        });
      }
    }
  }
}

sourceFile.saveSync();
console.log('Force-added missing dynamic keys to all locales.');
