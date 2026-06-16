const fs = require('fs');
const path = require('path');

const srcFile = path.resolve('lib/i18n/translations.ts');
let code = fs.readFileSync(srcFile, 'utf8');

const replacements = [
  // Hindi
  { old: "'invalid_pincode_err': \"[hi] Please enter a valid 6-digit pincode.\",", new: "'invalid_pincode_err': \"कृपया एक वैध 6-अंकीय पिनकोड दर्ज करें।\"," },
  { old: "'placeholder_mobile': \"[hi] Enter mobile number\",", new: "'placeholder_mobile': \"मोबाइल नंबर दर्ज करें\"," },
  { old: "'placeholder_name': \"[hi] Enter full name\",", new: "'placeholder_name': \"पूरा नाम दर्ज करें\"," },
  { old: "'placeholder_pincode': \"[hi] 6-digit pincode\",", new: "'placeholder_pincode': \"6-अंकों का पिनकोड\"," },
  
  // Marathi
  { old: "'invalid_pincode_err': \"[mr] Please enter a valid 6-digit pincode.\",", new: "'invalid_pincode_err': \"कृपया योग्य ६-अंकी पिनकोड टाका.\"," },
  { old: "'placeholder_mobile': \"[mr] Enter mobile number\",", new: "'placeholder_mobile': \"मोबाईल नंबर टाका\"," },
  { old: "'placeholder_name': \"[mr] Enter full name\",", new: "'placeholder_name': \"पूर्ण नाव टाका\"," },
  { old: "'placeholder_pincode': \"[mr] 6-digit pincode\",", new: "'placeholder_pincode': \"६ अंकी पिनकोड\"," },

  // Gujarati
  { old: "'invalid_pincode_err': \"[gu] Please enter a valid 6-digit pincode.\",", new: "'invalid_pincode_err': \"કૃપા કરીને માન્ય 6-અંકનો પિનકોડ દાખલ કરો.\"," },
  { old: "'placeholder_mobile': \"[gu] Enter mobile number\",", new: "'placeholder_mobile': \"મોબાઇલ નંબર દાખલ કરો\"," },
  { old: "'placeholder_name': \"[gu] Enter full name\",", new: "'placeholder_name': \"પૂરું નામ દાખલ કરો\"," },
  { old: "'placeholder_pincode': \"[gu] 6-digit pincode\",", new: "'placeholder_pincode': \"6-અંકનો પિનકોડ\"," }
];

for (const rep of replacements) {
  code = code.replace(rep.old, rep.new);
}

fs.writeFileSync(srcFile, code, 'utf8');
console.log("Replaced placeholder strings successfully.");
