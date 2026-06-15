const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../lib/i18n/translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

const keys = [
  "landing_hero_highlight", "landing_free_quotes", "protect_home", "keep_family_safe", "landing_exact_quote",
  "landing_gst_bill", "landing_installs", "how_it_works", "easy_security", "perfect_coverage",
  "perfect_coverage_desc", "right_cameras", "right_cameras_desc", "clear_pricing", "clear_pricing_desc",
  "landing_secure_space", "landing_today", "landing_setup_subtitle", "trusted_partners", "preferred_platform",
  "invalid_pincode_err", "area_not_served", "whatsapp_us", "check_expansion", "failed_check_availability",
  "enter_pincode_placeholder", "check_area", "err_invalid_mobile", "err_enter_name", "err_invalid_pincode",
  "placeholder_mobile", "placeholder_name", "placeholder_pincode", "quote_awaiting", "quote_accepted",
  "quote_expired", "quote_rejected", "download_pdf", "quotation", "bill_of_materials", "total",
  "complete_your_order", "complete_your_order_desc", "pay_full_amount", "processing"
];

// Append keys to the TranslationKey type
const typeEndRegex = /export const translations/;
if (!content.includes('  | "landing_hero_highlight"')) {
    const keysString = keys.map(k => `  | "${k}"`).join('\\n') + '\\n\\n';
    content = content.replace(typeEndRegex, keysString + 'export const translations');
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Appended to TranslationKey type');
}
