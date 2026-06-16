const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');
const path = require('path');

const srcFile = path.resolve('lib/i18n/translations.ts');
const project = new Project();
const sourceFile = project.addSourceFileAtPath(srcFile);

const realTranslations = {
  hi: {
    "how_it_works": "यह कैसे काम करता है",
    "easy_security": "सबके लिए आसान सुरक्षा।",
    "perfect_coverage": "पूरा कवरेज",
    "perfect_coverage_desc": "हम सुनिश्चित करते हैं कि आपकी संपत्ति का हर कोना सुरक्षित रहे और कोई भी हिस्सा नज़र से न बचे।",
    "right_cameras": "सही कैमरा",
    "right_cameras_desc": "हम आपकी आवश्यकता के अनुसार बेहतरीन कैमरा तकनीक का सुझाव देते हैं, चाहे वह छोटा घर हो या बड़ा गोदाम।",
    "clear_pricing": "पारदर्शी मूल्य निर्धारण",
    "clear_pricing_desc": "तीन आसान विकल्प (Value, Professional, Elite) ताकि आप अपने बजट के अनुसार चुन सकें।",
    "landing_subtitle": "बस 2 मिनट में अपने CCTV सेटअप की सही लागत जानें। आसान, भरोसेमंद और आपकी जरूरतों के अनुसार।",
    "protect_home": "अपने घर की सुरक्षा करें।",
    "keep_family_safe": "अपने परिवार को सुरक्षित रखें।",
    "welcome": "CCTV कोटेशन में आपका स्वागत है",
    "get_quote": "मुफ्त कोटेशन प्राप्त करें",
    "landing_hero_highlight": "सरल और विश्वसनीय CCTV सुरक्षा",
    "landing_free_quotes": "100% मुफ्त कोटेशन",
    "landing_secure_space": "अपने स्थान को सुरक्षित करें",
    "landing_today": "आज ही।",
    "landing_setup_subtitle": "2 मिनट में सेटअप। कोई छिपी हुई लागत नहीं। सभी प्लान में 18% GST शामिल।"
  },
  mr: {
    "how_it_works": "हे कसे कार्य करते",
    "easy_security": "सर्वांसाठी सोपी सुरक्षा.",
    "perfect_coverage": "संपूर्ण कव्हरेज",
    "perfect_coverage_desc": "तुमच्या मालमत्तेचा प्रत्येक कोपरा सुरक्षित राहील आणि कोणताही भाग नजरेतून सुटणार नाही याची आम्ही खात्री करतो.",
    "right_cameras": "योग्य कॅमेरे",
    "right_cameras_desc": "आम्ही तुमच्या गरजेनुसार सर्वोत्तम कॅमेरा तंत्रज्ञान सुचवतो, मग ते लहान घर असो वा मोठे गोदाम.",
    "clear_pricing": "पारदर्शक किंमत",
    "clear_pricing_desc": "तीन सोपे पर्याय (Value, Professional, Elite) जेणेकरून तुम्ही तुमच्या बजेटनुसार निवडू शकता.",
    "landing_subtitle": "फक्त २ मिनिटांत तुमच्या CCTV सेटअपची अचूक किंमत जाणून घ्या. सोपे, विश्वासार्ह आणि तुमच्या गरजेनुसार.",
    "protect_home": "तुमच्या घराचे रक्षण करा.",
    "keep_family_safe": "तुमच्या कुटुंबाला सुरक्षित ठेवा.",
    "welcome": "CCTV कोटेशन मध्ये आपले स्वागत आहे",
    "get_quote": "मोफत कोटेशन मिळवा",
    "landing_hero_highlight": "सोपी आणि विश्वसनीय CCTV सुरक्षा",
    "landing_free_quotes": "100% मोफत कोटेशन",
    "landing_secure_space": "तुमची जागा सुरक्षित करा",
    "landing_today": "आजच.",
    "landing_setup_subtitle": "२ मिनिटांत सेटअप. कोणताही लपलेला खर्च नाही. सर्व प्लॅनमध्ये १८% GST समाविष्ट."
  },
  gu: {
    "how_it_works": "આ કેવી રીતે કામ કરે છે",
    "easy_security": "દરેક માટે સરળ સુરક્ષા.",
    "perfect_coverage": "સંપૂર્ણ કવરેજ",
    "perfect_coverage_desc": "અમે ખાતરી કરીએ છીએ કે તમારી મિલકતનો દરેક ખૂણો સુરક્ષિત રહે અને કોઈ પણ ભાગ નજરથી બચે નહીં.",
    "right_cameras": "યોગ્ય કેમેરા",
    "right_cameras_desc": "અમે તમારી જરૂરિયાત મુજબ શ્રેષ્ઠ કેમેરા ટેકનોલોજી સૂચવીએ છીએ, ભલે તે નાનું ઘર હોય કે મોટું ગોડાઉન.",
    "clear_pricing": "સ્પષ્ટ કિંમત",
    "clear_pricing_desc": "ત્રણ સરળ વિકલ્પો (Value, Professional, Elite) જેથી તમે તમારા બજેટ મુજબ પસંદ કરી શકો.",
    "landing_subtitle": "માત્ર 2 મિનિટમાં તમારા CCTV સેટઅપની ચોક્કસ કિંમત જાણો. સરળ, વિશ્વસનીય અને તમારી જરૂરિયાત મુજબ.",
    "protect_home": "તમારા ઘરને સુરક્ષિત કરો.",
    "keep_family_safe": "તમારા પરિવારને સુરક્ષિત રાખો.",
    "welcome": "CCTV ક્વોટેશનમાં તમારું સ્વાગત છે",
    "get_quote": "મફત ક્વોટેશન મેળવો",
    "landing_hero_highlight": "સરળ અને વિશ્વસનીય CCTV સુરક્ષા",
    "landing_free_quotes": "100% મફત ક્વોટેશન",
    "landing_secure_space": "તમારી જગ્યા સુરક્ષિત કરો",
    "landing_today": "આજે જ.",
    "landing_setup_subtitle": "2 મિનિટમાં સેટઅપ. કોઈ છુપાયેલ ખર્ચ નથી. તમામ પ્લાનમાં 18% GST શામેલ છે."
  }
};

const enDict = JSON.parse(fs.readFileSync('en_dict.json', 'utf8'));

const translationsDecl = sourceFile.getVariableDeclarationOrThrow('translations');
const translationsObj = translationsDecl.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

const locales = ['hi', 'mr', 'gu'];
for (const locale of locales) {
  const localeProp = translationsObj.getPropertyOrThrow(locale);
  if (localeProp.isKind(SyntaxKind.PropertyAssignment)) {
    const localeObj = localeProp.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    
    // Get existing keys
    const existingKeys = new Set(localeObj.getProperties().map(p => {
      if (p.isKind(SyntaxKind.PropertyAssignment)) return p.getName().replace(/['"]/g, '');
      return '';
    }));
    
    // For every key in English dictionary
    for (const [key, defaultEnStr] of Object.entries(enDict)) {
      const val = realTranslations[locale][key] || `[${locale}] ${defaultEnStr}`;
      
      if (!existingKeys.has(key)) {
        localeObj.addPropertyAssignment({
          name: `'${key}'`,
          initializer: JSON.stringify(val)
        });
      } else {
        const prop = localeObj.getProperty(`'${key}'`) || localeObj.getProperty(`"${key}"`) || localeObj.getProperty(key);
        if (prop && prop.isKind(SyntaxKind.PropertyAssignment)) {
           // update if it exists but is just a placeholder and we have a real translation
           if (realTranslations[locale][key]) {
               prop.setInitializer(JSON.stringify(realTranslations[locale][key]));
           }
        }
      }
    }
  }
}

sourceFile.saveSync();
console.log('Full dictionary synchronized successfully.');
