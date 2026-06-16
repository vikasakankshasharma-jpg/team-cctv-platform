const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');

const srcFile = path.resolve('lib/i18n/translations.ts');
const project = new Project();
const sourceFile = project.addSourceFileAtPath(srcFile);

const allFound = [
  { key: "quote_h1", val: "Your security," },
  { key: "quote_h1_span", val: "made simple." },
  { key: "quote_prep", val: "Prepared just for " },
  { key: "quote_rec", val: "Look at our recommended" },
  { key: "quote_pkg", val: "packages below or build your own." },
  { key: "quote_exp", val: "Quotation Expired" },
  { key: "quote_exp_desc", val: "This quote is over 7 days old. Prices for camera parts change, so we need to make a new one for you." },
  { key: "quote_req_new", val: "Request Re-quote" },
  { key: "landing_same_day", val: "Same-Day Survey" },
  { key: "feat_res_1", val: "4x 2MP/5MP HD {brand} Cameras" },
  { key: "feat_res_2", val: "4-Channel DVR + HDD" },
  { key: "feat_res_3", val: "Power Supply & Connectors" },
  { key: "feat_res_4", val: "Complete Installation Labor" },
  { key: "feat_com_1", val: "Network/IP {brand} Cameras" },
  { key: "feat_com_2", val: "High-Capacity NVR System" },
  { key: "feat_com_3", val: "Structured Cabling" },
  { key: "feat_com_4", val: "Advanced Remote Viewing Setup" },
  { key: "up_quote_rcvd", val: "Quote Received" },
  { key: "up_quote_msg", val: "We've received your quote. Our team will review it and get back to you within 24 hours with a guaranteed best price." },
  { key: "up_comp_quote", val: "Competitor Quotation" },
  { key: "up_drop", val: "Drop your quote here or click to browse" },
  { key: "up_pdf_max", val: "PDF, JPG, PNG up to 10MB" },
  { key: "up_name", val: "Your Name" },
  { key: "up_name_ph", val: "Enter your full name" },
  { key: "up_comp_name", val: "Competitor Name" },
  { key: "up_comp_ph", val: "e.g., CP Plus Dealer, Local CCTV Shop" },
  { key: "up_total", val: "Their Quoted Total (₹)" },
  { key: "up_notes", val: "Additional Notes" },
  { key: "up_notes_ph", val: "Anything else you'd like us to know..." },
  { key: "up_cancel", val: "Cancel" },
  { key: "up_submit", val: "Submit for Price Match" },
  { key: "lwm_subtitle", val: "अपनी पसंदीदा भाषा चुनें | तुमची आवडती भाषा निवडा" },
  { key: "pcm_desc_1", val: "Enter your mobile number to authorize the lookup for PIN-code" },
  { key: "pcm_otp_desc", val: "Enter verification code sent to" },
  { key: "pcm_allow", val: "Tap 'Allow' on pop-up to auto-fill" },
  { key: "pcm_resend", val: "Resend Security Code" },
  { key: "pcm_change", val: "Change Contact Details" },
  { key: "pcm_wait_desc", val: "We are not actively serving PIN-code" },
  { key: "wa_message", val: "Hi CCTVQuotation Team! 👋 I'd like a free quotation for CCTV installation at my property. Please help me." },
  { key: "b2b_title", val: "Corporate Installation Detected" },
  { key: "b2b_subtitle_suffix", val: "cameras — business-grade setup" },
  { key: "b2b_desc1", val: "We'll generate your" },
  { key: "b2b_desc2", val: "full corporate quote" },
  { key: "b2b_desc3", val: "instantly. Optionally add your company details for a" },
  { key: "b2b_desc4", val: "GST invoice" },
  { key: "b2b_desc5", val: "— you can always add these later." },
  { key: "b2b_company", val: "Company / Firm Name" },
  { key: "b2b_opt", val: "(optional)" },
  { key: "b2b_gst_opt", val: "(optional — for GST invoice)" },
  { key: "b2b_btn", val: "Generate Corporate Quote" },
  { key: "b2b_skip", val: "Skip — I'm an individual" },
  { key: "err_enter_name", val: "Please enter your full name." },
  { key: "err_invalid_pincode", val: "Enter a valid 6-digit area pincode." },
  { key: "secure_verification", val: "Secure Verification" },
  { key: "leadgate_title_verify", val: "Verify Your Number" },
  { key: "leadgate_title", val: "Unlock Your Proposal" },
  { key: "leadgate_desc_sent", val: "We sent a 6-digit code to +91" },
  { key: "leadgate_desc", val: "Verify your phone number to view your itemized quote." },
  { key: "contact_number", val: "Contact Number *" },
  { key: "full_name", val: "Full Name *" },
  { key: "area_pincode", val: "Area Pincode *" },
  { key: "send_verification_code", val: "Send Verification Code" },
  { key: "verify_view_quote", val: "Verify & View Quote" },
  { key: "resend_code", val: "Resend Code" },
  { key: "change_phone_number", val: "Change Phone Number" },
  { key: "wiz_err_quote", val: "Error generating quote. Please try again." },
  { key: "wiz_err_sel", val: "Please select an option to continue." },
  { key: "wiz_err_cam_min", val: "Please select at least 1 camera to continue." },
  { key: "wizard_lbl_environment", val: "Environment" },
  { key: "wizard_opt_indoor", val: "Indoor Area" },
  { key: "wizard_opt_outdoor", val: "Outdoor Area" },
  { key: "wizard_lbl_quantity", val: "Quantity" },
  { key: "wizard_lbl_special_features", val: "Special Features" },
  { key: "wizard_lbl_optional", val: "(Optional)" },
  { key: "wiz_err_cam_max", val: "Max cameras available for this tech. Please contact us for larger installations." },
  { key: "wiz_b2b_hint_1", val: "For more than 16 cameras (limit), our team will reach out for a custom industrial quote. Above 16 cameras, a corporate quote is generated automatically." }
];

const newKeys = allFound.filter(k => !k.key.includes('Options') && !k.key.includes('-'));

// 1. Update TranslationKey type
const typeAlias = sourceFile.getTypeAliasOrThrow('TranslationKey');
const currentTypeNode = typeAlias.getTypeNodeOrThrow();
const currentTypeStr = currentTypeNode.getText();

let typeStr = currentTypeStr;
for (const {key} of newKeys) {
  if (!typeStr.includes(`'${key}'`) && !typeStr.includes(`"${key}"`)) {
    typeStr += ` | '${key}'`;
  }
}
typeAlias.setType(typeStr);

// 2. Update translations object for en, hi, mr, gu
const translationsDecl = sourceFile.getVariableDeclarationOrThrow('translations');
const translationsObj = translationsDecl.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

const locales = ['en', 'hi', 'mr', 'gu'];
for (const locale of locales) {
  const localeProp = translationsObj.getPropertyOrThrow(locale);
  if (localeProp.isKind(SyntaxKind.PropertyAssignment)) {
    const localeObj = localeProp.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    const existingLocaleKeys = localeObj.getProperties().map(p => {
      if (p.isKind(SyntaxKind.PropertyAssignment)) return p.getName().replace(/['"]/g, '');
      return '';
    });
    
    for (const {key, val} of newKeys) {
      if (!existingLocaleKeys.includes(key)) {
        localeObj.addPropertyAssignment({
          name: `'${key}'`,
          initializer: JSON.stringify(locale === 'en' ? val : `[${locale}] ${val}`)
        });
      }
    }
  }
}

sourceFile.saveSync();
console.log('Successfully added keys to translations.ts');
