const fs = require('fs');
const file = 'c:/Users/hp/Documents/TEAM Website/secure-easy/lib/i18n/translations.ts';
let content = fs.readFileSync(file, 'utf8');

const enKeys = ',\\r\\n    step_timeline_desc: "How soon do you need the system installed?",\\r\\n    step_brand_desc: "Do you have a specific brand in mind?",\\r\\n    step_amc_desc: "Would you like an Annual Maintenance Contract (AMC)?",\\r\\n    progress_your: "Your Progress",\\r\\n    progress_question: "Question",\\r\\n    progress_of: "of",\\r\\n    wizard_safe: "Your Data is Safe",\\r\\n    wizard_smart: "Smart System Design"';

const hiKeys = ',\\r\\n    step_timeline_desc: "आपको यह सिस्टम कितनी जल्दी इंस्टॉल करवाना है?",\\r\\n    step_brand_desc: "क्या आपके दिमाग में कोई विशिष्ट ब्रांड है?",\\r\\n    step_amc_desc: "क्या आप वार्षिक रखरखाव अनुबंध (AMC) चाहेंगे?",\\r\\n    progress_your: "आपकी प्रगति",\\r\\n    progress_question: "प्रश्न",\\r\\n    progress_of: "में से",\\r\\n    wizard_safe: "आपका डेटा सुरक्षित है",\\r\\n    wizard_smart: "स्मार्ट सिस्टम डिज़ाइन"';

const mrKeys = ',\\r\\n    step_timeline_desc: "तुम्हाला ही सिस्टम किती लवकर इन्स्टॉल करायची आहे?",\\r\\n    step_brand_desc: "तुमच्या मनात एखादा विशिष्ट ब्रँड आहे का?",\\r\\n    step_amc_desc: "तुम्हाला वार्षिक देखभाल करार (AMC) हवा आहे का?",\\r\\n    progress_your: "तुमची प्रगती",\\r\\n    progress_question: "प्रश्न",\\r\\n    progress_of: "पैकी",\\r\\n    wizard_safe: "तुमचा डेटा सुरक्षित आहे",\\r\\n    wizard_smart: "स्मार्ट सिस्टम डिझाइन"';

const guKeys = ',\\r\\n    step_timeline_desc: "તમારે સિસ્ટમ કેટલી જલ્દી ઇન્સ્ટોલ કરવાની જરૂર છે?",\\r\\n    step_brand_desc: "શું તમારા મનમાં કોઈ ચોક્કસ બ્રાન્ડ છે?",\\r\\n    step_amc_desc: "શું તમે વાર્ષિક જાળવણી કરાર (AMC) ઈચ્છો છો?",\\r\\n    progress_your: "તમારી પ્રગતિ",\\r\\n    progress_question: "પ્રશ્ન",\\r\\n    progress_of: "માંથી",\\r\\n    wizard_safe: "તમારો ડેટા સુરક્ષિત છે",\\r\\n    wizard_smart: "સ્માર્ટ સિસ્ટમ ડિઝાઇન"';

function append(locale, appendStr) {
  const regex = new RegExp('(' + locale + ':\\s*\\{[\\s\\S]*?)(?=\\r?\\n\\s*\\}\\s*,?\\s*(?:[a-z]{2}:\\s*\\{|\\}$))');
  content = content.replace(regex, (match, p1) => {
    if (p1.includes("wizard_smart")) return p1;
    let modified = p1.trimEnd();
    if (modified.endsWith(',')) modified = modified.slice(0, -1);
    return modified + appendStr;
  });
}

append('en', enKeys);
append('hi', hiKeys);
append('mr', mrKeys);
append('gu', guKeys);

const otherLocales = ['ta', 'te', 'kn', 'bn', 'ml', 'pa', 'or'];
for (const loc of otherLocales) {
  append(loc, enKeys);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Appended progress & description keys to all locales.');
