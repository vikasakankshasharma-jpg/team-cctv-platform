const fs = require('fs');
let content = fs.readFileSync('c:/Users/hp/Documents/TEAM Website/secure-easy/lib/i18n/translations.ts', 'utf8');

const hiKeys = '\\r\\n    chat_require_otp: "चैट शुरू करने के लिए OTP की आवश्यकता है",\\r\\n    err_invalid_mobile: "अमान्य मोबाइल नंबर",';

const mrKeys = '\\r\\n    chat_require_otp: "चॅट सुरू करण्यासाठी OTP आवश्यक आहे",\\r\\n    err_invalid_mobile: "अवैध मोबाइल क्रमांक",';

content = content.replace(/(hi:\\s*\\{[\\s\\S]*?)(?=  mr:)/, (match, p1) => {
  return p1.replace(/wizard_smart: "स्मार्ट सिस्टम डिज़ाइन"/, 'wizard_smart: "स्मार्ट सिस्टम डिज़ाइन"' + hiKeys);
});

content = content.replace(/(mr:\\s*\\{[\\s\\S]*?)(?=  gu:)/, (match, p1) => {
  return p1.replace(/wizard_smart: "स्मार्ट सिस्टम डिझाइन"/, 'wizard_smart: "स्मार्ट सिस्टम डिझाइन"' + mrKeys);
});

fs.writeFileSync('c:/Users/hp/Documents/TEAM Website/secure-easy/lib/i18n/translations.ts', content, 'utf8');
