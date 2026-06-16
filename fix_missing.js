const fs = require('fs');

const file = 'c:/Users/hp/Documents/TEAM Website/secure-easy/lib/i18n/translations.ts';
let content = fs.readFileSync(file, 'utf8');

const missingKeys = {
    chat_require_otp: "To provide accurate pricing and custom quotes, please verify your mobile number first.",
    err_invalid_mobile: "Please enter a valid 10-digit mobile number.",
    keep_family_safe: "Keep your family safe.",
    landing_subtitle: "Professional CCTV Installation & Maintenance",
    track_installation: "Track Installation",
    track_order_num: "Order Number",
    track_secret_pin: "Secret PIN",
    track_pin_desc: "Enter your 4-digit secret PIN",
    track_installer_assigned: "Installer Assigned",
    track_step_1: "Order Confirmed",
    track_step_1_desc: "Your order has been received",
    track_step_2: "Installer Assigned",
    track_step_2_desc: "A professional has been assigned",
    track_step_3: "On the Way",
    track_step_3_desc: "Installer is on the way",
    track_step_4: "Installation Complete",
    track_step_4_desc: "System is active",
    track_service_address: "Service Address",
    track_address_not_provided: "Address not provided",
    track_need_help: "Need help? Contact support at",
    step_timeline: "Timeline",
    q_timeline: "Select urgency:",
    fopt_t_asap: "ASAP (Today/Tomorrow)",
    fopt_t_week: "Within a week",
    fopt_t_month: "Next Month",
    fopt_t_research: "Just researching",
    step_brand: "Brand",
    q_brand: "Select your preferred brand:",
    fopt_b_rec: "Recommend for me (Best value)",
    fopt_b_cp: "CP Plus",
    fopt_b_hik: "Hikvision",
    fopt_b_dah: "Dahua",
    step_amc: "Maintenance",
    q_amc: "Select AMC option:",
    fopt_amc_yes: "Yes, protect my system",
    fopt_amc_no: "No, I will manage it myself"
};

const gujaratiKeys = {
    step_timeline: "સમયરેખા",
    q_timeline: "તાકીદ પસંદ કરો:",
    fopt_t_asap: "ASAP (આજે/કાલે)",
    fopt_t_week: "એક અઠવાડિયાની અંદર",
    fopt_t_month: "આવતા મહિને",
    fopt_t_research: "માત્ર સંશોધન કરી રહ્યા છીએ",
    step_brand: "બ્રાન્ડ",
    q_brand: "તમારી મનપસંદ બ્રાન્ડ પસંદ કરો:",
    fopt_b_rec: "મારા માટે ભલામણ કરો (શ્રેષ્ઠ મૂલ્ય)",
    fopt_b_cp: "CP Plus",
    fopt_b_hik: "Hikvision",
    fopt_b_dah: "Dahua",
    step_amc: "જાળવણી",
    q_amc: "AMC વિકલ્પ પસંદ કરો:",
    fopt_amc_yes: "હા, મારી સિસ્ટમ સુરક્ષિત કરો",
    fopt_amc_no: "ના, હું જાતે મેનેજ કરીશ"
};

// We will literally just append string to the last line of the locale block.
function appendKeys(locale, keys) {
  let toAppend = '';
  for (const [k, v] of Object.entries(keys)) {
    toAppend += ',\\r\\n    ' + k + ': "' + v + '"';
  }
  
  // Find the exact line before the next locale
  const regex = new RegExp('(' + locale + ':\\s*\\{[\\s\\S]*?)(?=\\r?\\n\\s*\\}\\s*,?\\s*(?:[a-z]{2}:\\s*\\{|\\}$))');
  content = content.replace(regex, (match, p1) => {
    // Check if the keys are already there
    if (p1.includes(Object.keys(keys)[0])) return p1;
    let modified = p1.trimEnd();
    if (modified.endsWith(',')) modified = modified.slice(0, -1);
    return modified + toAppend;
  });
}

appendKeys('gu', Object.assign({}, missingKeys, gujaratiKeys));
const otherLocales = ['ta', 'te', 'kn', 'bn', 'ml', 'pa', 'or'];
for (const loc of otherLocales) {
  appendKeys(loc, missingKeys);
}

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed missing keys for all locales');
