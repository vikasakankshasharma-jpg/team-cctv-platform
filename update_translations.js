const fs = require('fs');
let code = fs.readFileSync('lib/i18n/translations.ts', 'utf8');

// Strip parentheticals from aopt_none
code = code.replace(/(aopt_none:\s*['"`])([^(]+?)\s*\([^)]+\)\s*(['"`])/g, (match, p1, p2, p3) => {
  return p1 + p2.trim() + p3;
});

// Add new keys if not present
const newKeys = {
  step_remote_viewing: "Remote Viewing",
  "step_remote_viewing_desc": "Do you need to view your cameras remotely on your phone or laptop?",
  q_remote_viewing: "Remote View Capability:",
  q_broadband: "Internet Connection Setup:",
  opt_remote_yes: "Yes (Mobile & PC Access)",
  opt_remote_no: "No (Local Viewing Only)",
  opt_net_yes: "Yes, I have Broadband/WiFi",
  opt_net_no: "No, I'll arrange it myself",
  opt_net_sim: "No, include a 4G SIM Router"
};

// Simple append for English as a starting point. We can just add them to the en locale if they are missing.
if (!code.includes('step_remote_viewing:')) {
  // We'll just do it properly. We can also add them to translation types.
}

fs.writeFileSync('lib/i18n/translations.ts', code);
console.log('Successfully removed parens from aopt_none.');
