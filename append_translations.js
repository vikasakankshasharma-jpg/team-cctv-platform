const fs = require('fs');

const FILE_PATH = 'lib/i18n/translations.ts';
let code = fs.readFileSync(FILE_PATH, 'utf8');

const englishAdditions = `
    step_remote_viewing: "Remote Viewing",
    step_remote_viewing_desc: "Do you need to view your cameras remotely on your phone or laptop?",
    q_remote_viewing: "Remote View Capability:",
    q_broadband: "Internet Connection Setup:",
    opt_remote_yes: "Yes (Mobile & PC Access)",
    opt_remote_no: "No (Local Viewing Only)",
    opt_net_yes: "Yes, I have Broadband/WiFi",
    opt_net_no: "No, I'll arrange it myself",
    opt_net_sim: "No, include a 4G SIM Router",
`;

// Insert into English 'en' block
code = code.replace(/(en:\s*\{[^}]*step_general_addons:.*?)(,?\s*\})/, (match, p1, p2) => {
  return p1 + "," + englishAdditions + p2;
});

// Since other languages won't have translations yet, we can either copy English or just let the fallback handle it.
// The code uses a `t` function that usually falls back to the key name or we can insert the english text to all other locales.
// Let's insert the english text into ALL locales to prevent missing key errors if they use strict typing.
// The type TranslationKey must also be updated!

const typeAdditions = `
  | "step_remote_viewing"
  | "step_remote_viewing_desc"
  | "q_remote_viewing"
  | "q_broadband"
  | "opt_remote_yes"
  | "opt_remote_no"
  | "opt_net_yes"
  | "opt_net_no"
  | "opt_net_sim"`;

code = code.replace(/(export type TranslationKey =[^;]+)/, (match, p1) => {
  return match + typeAdditions;
});

// For non-English locales, we'll just inject the english additions so it compiles.
const locales = ['hi', 'mr', 'gu', 'ta', 'te', 'kn', 'bn', 'ml', 'pa', 'or'];
for (const loc of locales) {
  const regex = new RegExp("(" + loc + ":\\\\s*\\\\{[^}]*step_general_addons:.*?)(,?\\\\s*\\\\})");
  code = code.replace(regex, (match, p1, p2) => {
    return p1 + "," + englishAdditions + p2;
  });
}

fs.writeFileSync(FILE_PATH, code);
console.log("Successfully appended new translation keys.");
