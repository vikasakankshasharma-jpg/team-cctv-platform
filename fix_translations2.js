const fs = require('fs');
const path = require('path');

const file = path.join('c:/Users/hp/Documents/TEAM Website/secure-easy/lib/i18n/translations.ts');
let content = fs.readFileSync(file, 'utf8');

const additionsEn = `
    step_timeline_desc: "How soon do you need this system installed?",
    step_brand_desc: "Do you have a specific brand in mind?",
    step_amc_desc: "Would you like an Annual Maintenance Contract (AMC)?",
    progress_your: "Your Progress",
    progress_question: "Question",
    progress_of: "of",
    wizard_safe: "Your Data is Safe",
    wizard_smart: "Smart System Design"
`;

const additionsHi = `
    step_timeline_desc: "आपको यह सिस्टम कितनी जल्दी इंस्टॉल करवाना है?",
    step_brand_desc: "क्या आपके दिमाग में कोई विशिष्ट ब्रांड है?",
    step_amc_desc: "क्या आप वार्षिक रखरखाव अनुबंध (AMC) चाहेंगे?",
    progress_your: "आपकी प्रगति",
    progress_question: "प्रश्न",
    progress_of: "में से",
    wizard_safe: "आपका डेटा सुरक्षित है",
    wizard_smart: "स्मार्ट सिस्टम डिज़ाइन"
`;

const additionsMr = `
    step_timeline_desc: "तुम्हाला हे सिस्टम किती लवकर स्थापित करायचे आहे?",
    step_brand_desc: "तुमच्या मनात एखादा विशिष्ट ब्रँड आहे का?",
    step_amc_desc: "तुम्हाला वार्षिक देखभाल करार (AMC) हवा आहे का?",
    progress_your: "तुमची प्रगती",
    progress_question: "प्रश्न",
    progress_of: "पैकी",
    wizard_safe: "तुमचा डेटा सुरक्षित आहे",
    wizard_smart: "स्मार्ट सिस्टम डिझाइन"
`;

const additionsGu = `
    step_timeline_desc: "તમારે આ સિસ્ટમ કેટલી જલ્દી ઇન્સ્ટોલ કરવાની જરૂર છે?",
    step_brand_desc: "શું તમારા મનમાં કોઈ ચોક્કસ બ્રાન્ડ છે?",
    step_amc_desc: "શું તમે વાર્ષિક જાળવણી કરાર (AMC) ઈચ્છો છો?",
    progress_your: "તમારી પ્રગતિ",
    progress_question: "પ્રશ્ન",
    progress_of: "માંથી",
    wizard_safe: "તમારો ડેટા સુરક્ષિત છે",
    wizard_smart: "સ્માર્ટ સિસ્ટમ ડિઝાઇન"
`;

const replaceLastOccurrence = (str, search, replacement) => {
    const lastIndex = str.lastIndexOf(search);
    if (lastIndex === -1) return str;
    return str.substring(0, lastIndex) + replacement + str.substring(lastIndex + search.length);
};

const newTypes = `
  | "step_timeline_desc"
  | "step_brand_desc"
  | "step_amc_desc"
  | "progress_your"
  | "progress_question"
  | "progress_of"
  | "wizard_safe"
  | "wizard_smart";`;

if (!content.includes('step_timeline_desc')) {
  content = replaceLastOccurrence(content, 'footer_partner";', 'footer_partner"' + newTypes);

  content = content.replace(/fopt_amc_no: "No, I will manage it myself",(\\r?\\n)(.*?)(\\r?\\n)\\s*\\},/g, 'fopt_amc_no: "No, I will manage it myself",\\n$2,\\n' + additionsEn + '\\n  },');
  content = content.replace(/fopt_amc_no: "नहीं, मैं खुद संभाल लूंगा",(\\r?\\n)(.*?)(\\r?\\n)\\s*\\},/g, 'fopt_amc_no: "नहीं, मैं खुद संभाल लूंगा",\\n$2,\\n' + additionsHi + '\\n  },');
  content = content.replace(/fopt_amc_no: "नाही, मी स्वतः व्यवस्थापन करेन",(\\r?\\n)(.*?)(\\r?\\n)\\s*\\},/g, 'fopt_amc_no: "नाही, मी स्वतः व्यवस्थापन करेन",\\n$2,\\n' + additionsMr + '\\n  },');
  content = content.replace(/fopt_amc_no: "ના, હું જાતે મેનેજ કરીશ",(\\r?\\n)(.*?)(\\r?\\n)\\s*\\}/g, 'fopt_amc_no: "ના, હું જાતે મેનેજ કરીશ",\\n$2,\\n' + additionsGu + '\\n  }');

  fs.writeFileSync(file, content, 'utf8');
  console.log('done');
} else {
  console.log('Already added');
}
