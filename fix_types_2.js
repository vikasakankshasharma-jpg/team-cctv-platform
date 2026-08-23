const fs = require('fs');
const file = 'lib/i18n/translations.ts';
let code = fs.readFileSync(file, 'utf8');

const missingKeys = [
  'select_plan', 'view_quote', 'book_visit', 'build_own_title', 'build_own_desc',
  'swipe_cmp', 'config_tool', 'config_desc', 'search_cam', 'quote_total',
  'quote_download_pdf', 'quote_schedule_visit', 'quote_summary', 'quote_h1',
  'quote_h1_span', 'quote_prep', 'quote_rec', 'quote_pkg', 'quote_exp',
  'quote_exp_desc', 'quote_req_new', 'quote_awaiting', 'quote_accepted',
  'quote_expired', 'quote_rejected', 'download_pdf', 'quotation',
  'bill_of_materials', 'total', 'complete_your_order', 'complete_your_order_desc',
  'full', 'advance', 'processing', 'pay_full_amount', 'price_match',
  'price_match_desc', 'price_match_btn', 'upload_quote', 'uploading',
  'submit_price_match', 'submitting', 'price_match_success', 'price_match_success_desc',
  'tab_tech', 'tab_cam', 'tab_rec', 'tab_sto', 'tab_pow', 'tab_acc',
  'step_storage_desc', 'step_features_desc', 'step_general_addons_desc',
  'wiz_sel_all', 'wiz_multi', 'No Storage Required', '3 Months'
];

let unionAppend = "";
for (const key of missingKeys) {
  if (!code.includes(`| "${key}"`)) {
    unionAppend += `\n  | "${key}"`;
  }
}

// Find the end of the union type, right before "export const translations:"
code = code.replace(/(export type TranslationKey =[\s\S]*?)(\nexport const translations)/, `$1${unionAppend}$2`);

fs.writeFileSync(file, code);
console.log("Missing keys added to TranslationKey.");
