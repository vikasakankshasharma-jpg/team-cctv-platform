const { Project, SyntaxKind } = require("ts-morph");

const project = new Project();
const sourceFile = project.addSourceFileAtPath("c:/Users/hp/Documents/TEAM Website/secure-easy/lib/i18n/translations.ts");

const newKeys = {
    // ServiceAreaModal
    sam_where: "Where do you need installation?",
    sam_enter: "Enter your Pincode or select City.",
    sam_tab_pin: "Use Pincode",
    sam_tab_city: "Select City",
    sam_lbl_pin: "Pincode",
    sam_lbl_state: "State",
    sam_lbl_city: "City / Town",
    sam_btn: "Get Quotation Now",
    sam_btn_pin: "Use Pincode Instead",
    sam_loading: "Loading...",
    sam_no_city: "No cities found.",
    sam_inv_pin: "Invalid Pincode or service unavailable...",
    sam_sel_state: "Select your state...",
    
    // PhoneCaptureModal
    pcm_exp: "Service Expansion",
    pcm_unlock: "Unlock Installation",
    pcm_mob: "Mobile Number",
    pcm_v_pin: "Verify Pincode",
    pcm_v_otp: "Verify OTP",
    pcm_conf: "Waitlist Confirmed!",

    // LanguageWelcomeModal
    lwm_title: "Choose your language",
    lwm_desc: "You can change this anytime from the top menu",

    // MobileStickyCtaBar
    mcta_btn: "Get Free CCTV Quote",

    // WhatsAppFloat
    wa_chat: "Chat with us",

    // WizardClient / General
    wiz_prep: "Preparing your plan...",
    wiz_wait: "Just a few more seconds",
    wiz_err: "Something went wrong",
    wiz_err_desc: "Could not load the configuration...",
    wiz_try: "Try Again",
    wiz_sel_all: "Select all that apply",
    wiz_sel: "Selected",
    wiz_multi: "You can pick more than one option...",
    wiz_add_cam: "Add Another Camera Group",
    wiz_b2b_hint: "For more than 16 cameras, we offer custom B2B pricing.",
    
    // B2BInfoStep
    b2b_comp: "Company Name",
    b2b_gst: "GST Number",
    b2b_type: "Business Type",
    
    // CompetitorQuoteUploader
    cqu_title: "Upload Competitor Quote",
    cqu_drop: "Drop file here",
    cqu_fmt: "Supported formats: PDF, JPG, PNG",
    
    // CityLandingPage
    clp_survey: "Same-Day Survey",
    clp_item1: "4x 2MP/5MP HD CP Plus Cameras",
    
    // Quote Page
    qp_hero: "Your security, made simple."
};

const newTranslated = {
  hi: {
    sam_where: "आपको इंस्टॉलेशन कहाँ चाहिए?",
    sam_enter: "अपना पिनकोड दर्ज करें या शहर चुनें।",
    sam_tab_pin: "पिनकोड का उपयोग करें",
    sam_tab_city: "शहर चुनें",
    sam_lbl_pin: "पिनकोड",
    sam_lbl_state: "राज्य",
    sam_lbl_city: "शहर / कस्बा",
    sam_btn: "अभी कोटेशन प्राप्त करें",
    sam_btn_pin: "इसके बजाय पिनकोड का उपयोग करें",
    sam_loading: "लोड हो रहा है...",
    sam_no_city: "कोई शहर नहीं मिला।",
    sam_inv_pin: "अमान्य पिनकोड या सेवा अनुपलब्ध...",
    sam_sel_state: "अपना राज्य चुनें...",
    pcm_exp: "सेवा विस्तार",
    pcm_unlock: "इंस्टॉलेशन अनलॉक करें",
    pcm_mob: "मोबाइल नंबर",
    pcm_v_pin: "पिनकोड सत्यापित करें",
    pcm_v_otp: "OTP सत्यापित करें",
    pcm_conf: "प्रतीक्षा सूची की पुष्टि हो गई!",
    lwm_title: "अपनी भाषा चुनें",
    lwm_desc: "आप इसे टॉप मेनू से कभी भी बदल सकते हैं",
    mcta_btn: "मुफ़्त CCTV कोट प्राप्त करें",
    wa_chat: "हमसे चैट करें",
    wiz_prep: "आपका प्लान तैयार किया जा रहा है...",
    wiz_wait: "बस कुछ सेकंड और",
    wiz_err: "कुछ गलत हो गया",
    wiz_err_desc: "कॉन्फ़िगरेशन लोड नहीं हो सका...",
    wiz_try: "पुनः प्रयास करें",
    wiz_sel_all: "लागू होने वाले सभी चुनें",
    wiz_sel: "चयनित",
    wiz_multi: "आप एक से अधिक विकल्प चुन सकते हैं...",
    wiz_add_cam: "एक और कैमरा समूह जोड़ें",
    wiz_b2b_hint: "16 से अधिक कैमरों के लिए, हम कस्टम B2B मूल्य निर्धारण प्रदान करते हैं।",
    b2b_comp: "कंपनी का नाम",
    b2b_gst: "GST नंबर",
    b2b_type: "व्यवसाय का प्रकार",
    cqu_title: "प्रतिस्पर्धी कोटेशन अपलोड करें",
    cqu_drop: "फ़ाइल यहाँ छोड़ें",
    cqu_fmt: "समर्थित प्रारूप: PDF, JPG, PNG",
    clp_survey: "उसी दिन सर्वेक्षण",
    clp_item1: "4x 2MP/5MP HD CP Plus कैमरे",
    qp_hero: "आपकी सुरक्षा, सरल बनाई गई।"
  },
  mr: {
    sam_where: "तुम्हाला इंस्टॉलेशन कुठे हवे आहे?",
    sam_enter: "तुमचा पिनकोड प्रविष्ट करा किंवा शहर निवडा.",
    sam_tab_pin: "पिनकोड वापरा",
    sam_tab_city: "शहर निवडा",
    sam_lbl_pin: "पिनकोड",
    sam_lbl_state: "राज्य",
    sam_lbl_city: "शहर / गाव",
    sam_btn: "आता कोटेशन मिळवा",
    sam_btn_pin: "याऐवजी पिनकोड वापरा",
    sam_loading: "लोड होत आहे...",
    sam_no_city: "कोणतीही शहरे आढळली नाहीत.",
    sam_inv_pin: "अवैध पिनकोड किंवा सेवा अनुपलब्ध...",
    sam_sel_state: "तुमचे राज्य निवडा...",
    pcm_exp: "सेवा विस्तार",
    pcm_unlock: "इंस्टॉलेशन अनलॉक करा",
    pcm_mob: "मोबाईल नंबर",
    pcm_v_pin: "पिनकोड सत्यापित करा",
    pcm_v_otp: "OTP सत्यापित करा",
    pcm_conf: "प्रतीक्षा यादी निश्चित केली!",
    lwm_title: "तुमची भाषा निवडा",
    lwm_desc: "तुम्ही हे वरच्या मेनूमधून कधीही बदलू शकता",
    mcta_btn: "मोफत CCTV कोट मिळवा",
    wa_chat: "आमच्याशी चॅट करा",
    wiz_prep: "तुमचा प्लान तयार करत आहे...",
    wiz_wait: "फक्त काही सेकंद",
    wiz_err: "काहीतरी चूक झाली",
    wiz_err_desc: "कॉन्फिगरेशन लोड होऊ शकले नाही...",
    wiz_try: "पुन्हा प्रयत्न करा",
    wiz_sel_all: "लागू होणारे सर्व निवडा",
    wiz_sel: "निवडलेले",
    wiz_multi: "तुम्ही एकापेक्षा जास्त पर्याय निवडू शकता...",
    wiz_add_cam: "आणखी एक कॅमेरा गट जोडा",
    wiz_b2b_hint: "१६ पेक्षा जास्त कॅमेऱ्यांसाठी, आम्ही कस्टम B2B किंमत ऑफर करतो.",
    b2b_comp: "कंपनीचे नाव",
    b2b_gst: "GST क्रमांक",
    b2b_type: "व्यवसायाचा प्रकार",
    cqu_title: "स्पर्धकांचे कोटेशन अपलोड करा",
    cqu_drop: "फाईल येथे सोडा",
    cqu_fmt: "समर्थित फॉरमॅट्स: PDF, JPG, PNG",
    clp_survey: "त्याच दिवशी सर्वेक्षण",
    clp_item1: "4x 2MP/5MP HD CP Plus कॅमेरे",
    qp_hero: "तुमची सुरक्षा, सोपी केली."
  },
  gu: {
    sam_where: "તમારે ઇન્સ્ટોલેશન ક્યાં જોઈએ છે?",
    sam_enter: "તમારો પિનકોડ દાખલ કરો અથવા શહેર પસંદ કરો.",
    sam_tab_pin: "પિનકોડનો ઉપયોગ કરો",
    sam_tab_city: "શહેર પસંદ કરો",
    sam_lbl_pin: "પિનકોડ",
    sam_lbl_state: "રાજ્ય",
    sam_lbl_city: "શહેર / નગર",
    sam_btn: "હમણાં ક્વોટેશન મેળવો",
    sam_btn_pin: "તેના બદલે પિનકોડનો ઉપયોગ કરો",
    sam_loading: "લોડ થઈ રહ્યું છે...",
    sam_no_city: "કોઈ શહેરો મળ્યાં નથી.",
    sam_inv_pin: "અમાન્ય પિનકોડ અથવા સેવા ઉપલબ્ધ નથી...",
    sam_sel_state: "તમારું રાજ્ય પસંદ કરો...",
    pcm_exp: "સેવા વિસ્તરણ",
    pcm_unlock: "ઇન્સ્ટોલેશન અનલૉક કરો",
    pcm_mob: "મોબાઇલ નંબર",
    pcm_v_pin: "પિનકોડ ચકાસો",
    pcm_v_otp: "OTP ચકાસો",
    pcm_conf: "વેઇટલિસ્ટ કન્ફર્મ થઈ!",
    lwm_title: "તમારી ભાષા પસંદ કરો",
    lwm_desc: "તમે આને ઉપરના મેનૂમાંથી કોઈપણ સમયે બદલી શકો છો",
    mcta_btn: "મફત CCTV ક્વોટ મેળવો",
    wa_chat: "અમારી સાથે ચેટ કરો",
    wiz_prep: "તમારો પ્લાન તૈયાર થઈ રહ્યો છે...",
    wiz_wait: "ફક્ત થોડીક સેકંડ",
    wiz_err: "કંઈક ખોટું થયું",
    wiz_err_desc: "રૂપરેખાંકન લોડ થઈ શક્યું નથી...",
    wiz_try: "ફરીથી પ્રયાસ કરો",
    wiz_sel_all: "લાગુ પડતા બધા પસંદ કરો",
    wiz_sel: "પસંદ કરેલ",
    wiz_multi: "તમે એક કરતાં વધુ વિકલ્પ પસંદ કરી શકો છો...",
    wiz_add_cam: "બીજું કૅમેરા જૂથ ઉમેરો",
    wiz_b2b_hint: "16 કરતાં વધુ કૅમેરા માટે, અમે કસ્ટમ B2B કિંમતો ઑફર કરીએ છીએ.",
    b2b_comp: "કંપનીનું નામ",
    b2b_gst: "GST નંબર",
    b2b_type: "વ્યાપાર પ્રકાર",
    cqu_title: "સ્પર્ધક ક્વોટેશન અપલોડ કરો",
    cqu_drop: "અહીં ફાઇલ મૂકો",
    cqu_fmt: "સપોર્ટેડ ફોર્મેટ્સ: PDF, JPG, PNG",
    clp_survey: "તે જ દિવસે સર્વેક્ષણ",
    clp_item1: "4x 2MP/5MP HD CP Plus કેમેરા",
    qp_hero: "તમારી સુરક્ષા, સરળ બની."
  }
};

// Also adding missing wizard keys if they are missing
const existingWizKeys = {
    step_timeline_desc: "How soon do you need the system installed?",
    step_brand_desc: "Do you have a specific brand in mind?",
    step_amc_desc: "Would you like an Annual Maintenance Contract (AMC)?",
    progress_your: "Your Progress",
    progress_question: "Question",
    progress_of: "of",
    wizard_safe: "Your Data is Safe",
    wizard_smart: "Smart System Design"
};

Object.assign(newKeys, existingWizKeys);

newTranslated.hi = Object.assign(newTranslated.hi, {
    step_timeline_desc: "आपको यह सिस्टम कितनी जल्दी इंस्टॉल करवाना है?",
    step_brand_desc: "क्या आपके दिमाग में कोई विशिष्ट ब्रांड है?",
    step_amc_desc: "क्या आप वार्षिक रखरखाव अनुबंध (AMC) चाहेंगे?",
    progress_your: "आपकी प्रगति",
    progress_question: "प्रश्न",
    progress_of: "में से",
    wizard_safe: "आपका डेटा सुरक्षित है",
    wizard_smart: "स्मार्ट सिस्टम डिज़ाइन"
});

newTranslated.mr = Object.assign(newTranslated.mr, {
    step_timeline_desc: "तुम्हाला ही सिस्टम किती लवकर इन्स्टॉल करायची आहे?",
    step_brand_desc: "तुमच्या मनात एखादा विशिष्ट ब्रँड आहे का?",
    step_amc_desc: "तुम्हाला वार्षिक देखभाल करार (AMC) हवा आहे का?",
    progress_your: "तुमची प्रगती",
    progress_question: "प्रश्न",
    progress_of: "पैकी",
    wizard_safe: "तुमचा डेटा सुरक्षित आहे",
    wizard_smart: "स्मार्ट सिस्टम डिझाइन"
});

newTranslated.gu = Object.assign(newTranslated.gu, {
    step_timeline_desc: "તમારે સિસ્ટમ કેટલી જલ્દી ઇન્સ્ટોલ કરવાની જરૂર છે?",
    step_brand_desc: "શું તમારા મનમાં કોઈ ચોક્કસ બ્રાન્ડ છે?",
    step_amc_desc: "શું તમે વાર્ષિક જાળવણી કરાર (AMC) ઈચ્છો છો?",
    progress_your: "તમારી પ્રગતિ",
    progress_question: "પ્રશ્ન",
    progress_of: "માંથી",
    wizard_safe: "તમારો ડેટા સુરક્ષિત છે",
    wizard_smart: "સ્માર્ટ સિસ્ટમ ડિઝાઇન"
});


const typeDecl = sourceFile.getTypeAliasOrThrow("TranslationKey");
const unionNode = typeDecl.getTypeNodeOrThrow();
let newUnionText = unionNode.getText();
for (const key of Object.keys(newKeys)) {
  if (!newUnionText.includes("'" + key + "'") && !newUnionText.includes('"' + key + '"')) {
     newUnionText += ' | "' + key + '"';
  }
}
unionNode.replaceWithText(newUnionText);

const translationsDecl = sourceFile.getVariableDeclarationOrThrow("translations");
const initObj = translationsDecl.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

for (const prop of initObj.getProperties()) {
  if (prop.getKind() === SyntaxKind.PropertyAssignment) {
    const locale = prop.getName();
    const localeObj = prop.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    
    // Add keys to this locale
    for (const [key, enValue] of Object.entries(newKeys)) {
      if (!localeObj.getProperty(key)) {
        let valueToSet = enValue;
        if (newTranslated[locale] && newTranslated[locale][key]) {
           valueToSet = newTranslated[locale][key];
        }
        localeObj.addPropertyAssignment({
          name: key,
          initializer: '"' + valueToSet.replace(/"/g, '\\"') + '"'
        });
      }
    }
  }
}

sourceFile.saveSync();
console.log('Successfully updated AST using ts-morph.');
