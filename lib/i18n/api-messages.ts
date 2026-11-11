import type { NextRequest } from "next/server";
import type { LocaleCode } from "./mapping";
import { getServerLocale, isValidLocale, LOCALE_COOKIE_NAME } from "./server-locale";

export type ApiMessageKey =
  | "too_many_requests"
  | "too_many_attempts"
  | "internal_error"
  | "unauthorized"
  | "forbidden"
  | "system_maintenance"
  | "missing_fields"
  | "phone_required"
  | "phone_invalid"
  | "email_invalid"
  | "name_mobile_required"
  | "phone_otp_required"
  | "otp_not_found"
  | "otp_expired"
  | "otp_incorrect"
  | "otp_invalid_method"
  | "otp_invalid_token"
  | "otp_sent_whatsapp"
  | "otp_sent_sms"
  | "otp_sent_email"
  | "otp_service_error"
  | "account_not_registered"
  | "partner_not_found"
  | "partner_already_registered"
  | "profile_update_failed"
  | "booking_missing_fields"
  | "lead_not_found"
  | "booking_forbidden"
  | "booking_success"
  | "survey_failed"
  | "lead_validation_failed"
  | "lead_created_success"
  | "build_no_products"
  | "build_no_recorder"
  | "build_recorder_capacity"
  | "build_no_hdd_warning"
  | "build_hdd_days_note"
  | "build_no_sd_warning"
  | "build_sd_count_note"
  | "quote_missing_snapshot"
  | "quote_save_failed"
  | "referral_required"
  | "referral_invalid"
  | "referral_applied"
  | "referral_applied_flat"
  | "referral_failed"
  | "waitlist_confirm_failed";

type ApiDict = Record<ApiMessageKey, string>;

const EN: ApiDict = {
  too_many_requests: "Too many requests. Please try again later.",
  too_many_attempts: "Too many attempts. Please wait a minute and try again.",
  internal_error: "Something went wrong. Please try again shortly.",
  unauthorized: "Please log in to continue.",
  forbidden: "You do not have permission for this action.",
  system_maintenance: "System is under maintenance. Please try again shortly.",
  missing_fields: "Please fill in all required details.",
  phone_required: "Mobile number is required.",
  phone_invalid: "Please enter a valid 10-digit Indian mobile number.",
  email_invalid: "Please enter a valid email address.",
  name_mobile_required: "Full name and mobile number are required.",
  phone_otp_required: "Mobile number and OTP are required.",
  otp_not_found: "OTP expired or not found. Please request a new one.",
  otp_expired: "OTP has expired. Please request a new one.",
  otp_incorrect: "Incorrect OTP code. Please check and try again.",
  otp_invalid_method: "Invalid verification method.",
  otp_invalid_token: "Invalid OTP code or verification token.",
  otp_sent_whatsapp: "OTP sent on WhatsApp.",
  otp_sent_sms: "OTP sent to your mobile number.",
  otp_sent_email: "OTP sent to your email.",
  otp_service_error: "Could not send OTP right now. Please try again.",
  account_not_registered: "This mobile number is not registered in our system.",
  partner_not_found: "No active partner account found with this mobile number.",
  partner_already_registered: "You are already registered! Please log in to your dashboard.",
  profile_update_failed: "Could not update profile. Please try again.",
  booking_missing_fields: "Please select your quote and enter site address.",
  lead_not_found: "Quote record not found.",
  booking_forbidden: "You do not have permission to book for this enquiry.",
  booking_success: "Site visit booked successfully!",
  survey_failed: "Could not book site visit. Please check your details and try again.",
  lead_validation_failed: "Please check your details and try again.",
  lead_created_success: "Quote request submitted successfully!",
  build_no_products: "Please select at least one camera or product.",
  build_no_recorder: "Compatibility error: Wired cameras need a DVR/NVR recorder. Please select a recorder.",
  build_recorder_capacity:
    "Compatibility error: Selected recorder supports {channels} wired cameras, but you selected {cameras}. Please choose a bigger recorder.",
  build_no_hdd_warning:
    "You haven't selected a Hard Disk (HDD). Wired cameras will only show live view without recording.",
  build_hdd_days_note:
    "Your {tb}TB HDD will give about {days} days of recording for {cameras} wired cameras.",
  build_no_sd_warning:
    "You haven't selected a MicroSD card. Wi-Fi cameras will only show live view without local recording.",
  build_sd_count_note:
    "You selected {sd} MicroSD card(s) for {cameras} wireless cameras (1 card per camera is best).",
  quote_missing_snapshot: "Quote requirements are missing. Please try generating again.",
  quote_save_failed: "Could not save quote. Please try again.",
  referral_required: "Please enter a referral code.",
  referral_invalid: "Invalid or inactive referral code.",
  referral_applied: "Referral code applied successfully!",
  referral_applied_flat: "Referral code applied! Flat ₹{discount} off on orders of ₹{minOrder} or more.",
  referral_failed: "Could not verify referral code. Please try again.",
  waitlist_confirm_failed: "Could not confirm waitlist entry. Please try again.",
};

const API_MESSAGES: Record<LocaleCode, ApiDict> = {
  en: EN,
  hi: {
    too_many_requests: "बहुत ज़्यादा कोशिशें हो गई हैं। कृपया थोड़ी देर बाद फिर प्रयास करें।",
    too_many_attempts: "बहुत ज़्यादा बार कोशिश की गई। कृपया 1 मिनट रुककर फिर प्रयास करें।",
    internal_error: "कुछ तकनीकी दिक्कत आ गई है। कृपया थोड़ी देर बाद फिर कोशिश करें।",
    unauthorized: "आगे बढ़ने के लिए कृपया लॉगिन करें।",
    forbidden: "आपको यह काम करने की अनुमति नहीं है।",
    system_maintenance: "सिस्टम अपडेट हो रहा है। कृपया कुछ ही मिनटों में फिर कोशिश करें।",
    missing_fields: "कृपया सभी ज़रूरी जानकारी भरें।",
    phone_required: "मोबाइल नंबर डालना ज़रूरी है।",
    phone_invalid: "कृपया सही 10-अंकों का मोबाइल नंबर डालें।",
    email_invalid: "कृपया सही ईमेल पता डालें।",
    name_mobile_required: "पूरा नाम और मोबाइल नंबर दोनों ज़रूरी हैं।",
    phone_otp_required: "मोबाइल नंबर और OTP दोनों ज़रूरी हैं।",
    otp_not_found: "OTP की समय सीमा खत्म हो गई है या नहीं मिला। कृपया नया OTP मँगवाएं।",
    otp_expired: "OTP की समय सीमा खत्म हो गई है। कृपया नया OTP मँगवाएं।",
    otp_incorrect: "गलत OTP डाला गया है। कृपया जांचकर फिर डालें।",
    otp_invalid_method: "सत्यापन का तरीका सही नहीं है।",
    otp_invalid_token: "गलत OTP कोड या सेशन टोकन।",
    otp_sent_whatsapp: "WhatsApp पर OTP भेज दिया गया है।",
    otp_sent_sms: "आपके मोबाइल नंबर पर OTP भेज दिया गया है।",
    otp_sent_email: "आपके ईमेल पर OTP भेज दिया गया है।",
    otp_service_error: "अभी OTP भेजने में दिक्कत आ रही है। कृपया फिर कोशिश करें।",
    account_not_registered: "यह मोबाइल नंबर हमारे सिस्टम में रजिस्टर्ड नहीं है।",
    partner_not_found: "इस मोबाइल नंबर से कोई एक्टिव पार्टनर अकाउंट नहीं मिला।",
    partner_already_registered: "आप पहले से रजिस्टर्ड हैं! कृपया अपने डैशबोर्ड में लॉगिन करें।",
    profile_update_failed: "प्रोफाइल अपडेट नहीं हो पाई। कृपया फिर कोशिश करें।",
    booking_missing_fields: "कृपया कोटेशन चुनें और पूरा पता लिखें।",
    lead_not_found: "यह कोटेशन रिकॉर्ड नहीं मिला।",
    booking_forbidden: "आपको इस इंक्वायरी के लिए बुकिंग करने की अनुमति नहीं है।",
    booking_success: "साइट विज़िट की बुकिंग पक्की हो गई है!",
    survey_failed: "साइट विज़िट बुक नहीं हो पाई। कृपया जानकारी जांचकर फिर कोशिश करें।",
    lead_validation_failed: "कृपया अपनी भरी हुई जानकारी जांचें और फिर कोशिश करें।",
    lead_created_success: "आपका कोटेशन अनुरोध भेज दिया गया है!",
    build_no_products: "कृपया कम से कम एक कैमरा या प्रोडक्ट चुनें।",
    build_no_recorder: "सिस्टम मिलान त्रुटि: तार वाले कैमरों के लिए DVR/NVR रिकॉर्डर ज़रूरी है। कृपया रिकॉर्डर चुनें।",
    build_recorder_capacity:
      "सिस्टम मिलान त्रुटि: चुना गया रिकॉर्डर केवल {channels} तार वाले कैमरे सपोर्ट करता है, लेकिन आपने {cameras} चुने हैं। कृपया बड़ा रिकॉर्डर चुनें।",
    build_no_hdd_warning: "आपने Hard Disk (HDD) नहीं चुनी है — तार वाले कैमरे बिना रिकॉर्डिंग के केवल लाइव दिखेंगे।",
    build_hdd_days_note: "आपकी {tb}TB HDD में {cameras} तार वाले कैमरों की लगभग {days} दिन की रिकॉर्डिंग होगी।",
    build_no_sd_warning: "आपने MicroSD कार्ड नहीं चुना है — Wi-Fi कैमरे बिना लोकल रिकॉर्डिंग के केवल लाइव चलेंगे।",
    build_sd_count_note: "आपने {cameras} वायरलेस कैमरों के लिए {sd} MicroSD कार्ड चुने हैं (हर कैमरे के लिए 1 कार्ड सही रहता है)।",
    quote_missing_snapshot: "कोटेशन की जानकारी अधूरी है। कृपया फिर से कोटेशन बनाएं।",
    quote_save_failed: "कोटेशन सेव नहीं हो पाया। कृपया फिर कोशिश करें।",
    referral_required: "कृपया रेफरल कोड डालें।",
    referral_invalid: "यह रेफरल कोड गलत है या अभी बंद है।",
    referral_applied: "रेफरल कोड सफलतापूर्वक लागू हो गया!",
    referral_applied_flat: "रेफरल कोड लागू हो गया! ₹{minOrder} या उससे ऊपर के ऑर्डर पर ₹{discount} की सीधी छूट।",
    referral_failed: "रेफरल कोड की जांच नहीं हो पाई। कृपया फिर कोशिश करें।",
    waitlist_confirm_failed: "वेटलिस्ट की पुष्टि नहीं हो पाई। कृपया फिर कोशिश करें।",
  },
  mr: {
    too_many_requests: "खूप जास्त वेळा प्रयत्न केले आहेत. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.",
    too_many_attempts: "खूप वेळा प्रयत्न झाले आहेत. कृपया १ मिनिट थांबून पुन्हा प्रयत्न करा.",
    internal_error: "काहीतरी तांत्रिक अडचण आली आहे. कृपया थोड्या वेळाने पुन्हा प्रयत्न करा.",
    unauthorized: "पुढे जाण्यासाठी कृपया लॉगिन करा.",
    forbidden: "तुम्हाला ही कृती करण्याची परवानगी नाही.",
    system_maintenance: "सिस्टम अपडेट सुरू आहे. कृपया थोड्याच वेळात पुन्हा प्रयत्न करा.",
    missing_fields: "कृपया सर्व आवश्यक माहिती भरा.",
    phone_required: "मोबाईल नंबर टाकणे आवश्यक आहे.",
    phone_invalid: "कृपया योग्य १०-अंकी मोबाईल नंबर टाका.",
    email_invalid: "कृपया योग्य ईमेल पत्ता टाका.",
    name_mobile_required: "पूर्ण नाव आणि मोबाईल नंबर दोन्ही आवश्यक आहेत.",
    phone_otp_required: "मोबाईल नंबर आणि OTP दोन्ही आवश्यक आहेत.",
    otp_not_found: "OTP ची वेळ संपली आहे किंवा सापडला नाही. कृपया नवीन OTP मागवा.",
    otp_expired: "OTP ची वेळ संपली आहे. कृपया नवीन OTP मागवा.",
    otp_incorrect: "चुकीचा OTP टाकला आहे. कृपया तपासून पुन्हा टाका.",
    otp_invalid_method: "पडताळणीची पद्धत योग्य नाही.",
    otp_invalid_token: "चुकीचा OTP कोड किंवा टोकन.",
    otp_sent_whatsapp: "WhatsApp वर OTP पाठवला आहे.",
    otp_sent_sms: "तुमच्या मोबाईल नंबरवर OTP पाठवला आहे.",
    otp_sent_email: "तुमच्या ईमेलवर OTP पाठवला आहे.",
    otp_service_error: "सध्या OTP पाठवताना अडचण येत आहे. कृपया पुन्हा प्रयत्न करा.",
    account_not_registered: "हा मोबाईल नंबर आमच्या सिस्टममध्ये नोंदलेला नाही.",
    partner_not_found: "या मोबाईल नंबरवर कोणतेही सक्रिय पार्टनर खाते सापडले नाही.",
    partner_already_registered: "तुम्ही आधीच नोंदणी केली आहे! कृपया तुमच्या डॅशबोर्डवर लॉगिन करा.",
    profile_update_failed: "प्रोफाइल अपडेट होऊ शकले नाही. कृपया पुन्हा प्रयत्न करा.",
    booking_missing_fields: "कृपया कोटेशन निवडा आणि पत्ता भरा.",
    lead_not_found: "हे कोटेशन सापडले नाही.",
    booking_forbidden: "तुम्हाला या चौकशीसाठी बुकिंग करण्याची परवानगी नाही.",
    booking_success: "साइट व्हिजिट बुकिंग पक्की झाली आहे!",
    survey_failed: "साइट व्हिजिट बुक होऊ शकली नाही. कृपया माहिती तपासून पुन्हा प्रयत्न करा.",
    lead_validation_failed: "कृपया भरलेली माहिती तपासा आणि पुन्हा प्रयत्न करा.",
    lead_created_success: "तुमची कोटेशन विनंती पाठवली आहे!",
    build_no_products: "कृपया किमान एक कॅमेरा किंवा प्रॉडक्ट निवडा.",
    build_no_recorder: "सुसंगतता त्रुटी: वायर्ड कॅमेऱ्यांसाठी DVR/NVR रेकॉर्डर आवश्यक आहे. कृपया रेकॉर्डर निवडा.",
    build_recorder_capacity:
      "सुसंगतता त्रुटी: निवडलेला रेकॉर्डर फक्त {channels} वायर्ड कॅमेरे सपोर्ट करतो, पण तुम्ही {cameras} निवडले आहेत. कृपया मोठा रेकॉर्डर निवडा.",
    build_no_hdd_warning: "तुम्ही Hard Disk (HDD) निवडलेली नाही — वायर्ड कॅमेरे रेकॉर्डिंगशिवाय फक्त लाईव्ह दिसतील.",
    build_hdd_days_note: "तुमच्या {tb}TB HDD मध्ये {cameras} वायर्ड कॅमेऱ्यांचे साधारण {days} दिवसांचे रेकॉर्डिंग राहील.",
    build_no_sd_warning: "तुम्ही MicroSD कार्ड निवडलेले नाही — Wi-Fi कॅमेरे लोकल रेकॉर्डिंगशिवाय फक्त लाईव्ह चालतील.",
    build_sd_count_note: "तुम्ही {cameras} वायरलेस कॅमेऱ्यांसाठी {sd} MicroSD कार्ड निवडले आहेत (प्रत्येक कॅमेऱ्यासाठी १ कार्ड उत्तम).",
    quote_missing_snapshot: "कोटेशनची माहिती अपूर्ण आहे. कृपया पुन्हा कोटेशन तयार करा.",
    quote_save_failed: "कोटेशन सेव्ह होऊ शकले नाही. कृपया पुन्हा प्रयत्न करा.",
    referral_required: "कृपया रेफरल कोड टाका.",
    referral_invalid: "हा रेफरल कोड चुकीचा आहे किंवा बंद आहे.",
    referral_applied: "रेफरल कोड यशस्वीरित्या लागू झाला!",
    referral_applied_flat: "रेफरल कोड लागू झाला! ₹{minOrder} किंवा त्यावरील ऑर्डरवर ₹{discount} थेट सूट.",
    referral_failed: "रेफरल कोड तपासता आला नाही. कृपया पुन्हा प्रयत्न करा.",
    waitlist_confirm_failed: "वेटलिस्ट निश्चित करता आली नाही. कृपया पुन्हा प्रयत्न करा.",
  },
  gu: {
    too_many_requests: "ઘણા બધા પ્રયત્નો થઈ ગયા છે. કૃપા કરીને થોડી વાર પછી ફરી પ્રયાસ કરો.",
    too_many_attempts: "ઘણી વાર પ્રયાસ થઈ ગયો છે. કૃપા કરીને ૧ મિનિટ રાહ જોઈને ફરી પ્રયાસ કરો.",
    internal_error: "કોઈ તકનીકી ખામી આવી છે. કૃપા કરીને થોડી વાર પછી ફરી પ્રયાસ કરો.",
    unauthorized: "આગળ વધવા માટે કૃપા કરીને લોગિન કરો.",
    forbidden: "તમને આ કામ કરવાની પરવાનગી નથી.",
    system_maintenance: "સિસ્ટમ અપડેટ ચાલી રહી છે. કૃપા કરીને થોડી જ મિનિટોમાં ફરી પ્રયાસ કરો.",
    missing_fields: "કૃપા કરીને બધી જરૂરી માહિતી ભરો.",
    phone_required: "મોબાઇલ નંબર નાખવો જરૂરી છે.",
    phone_invalid: "કૃપા કરીને સાચો ૧૦-અંકનો મોબાઇલ નંબર નાખો.",
    email_invalid: "કૃપા કરીને સાચું ઈમેલ એડ્રેસ નાખો.",
    name_mobile_required: "પૂરું નામ અને મોબાઇલ નંબર બંને જરૂરી છે.",
    phone_otp_required: "મોબાઇલ નંબર અને OTP બંને જરૂરી છે.",
    otp_not_found: "OTP ની સમય મર્યાદા પૂરી થઈ ગઈ છે અથવા મળ્યો નથી. કૃપા કરીને નવો OTP મંગાવો.",
    otp_expired: "OTP નો સમય પૂરો થઈ ગયો છે. કૃપા કરીને નવો OTP મંગાવો.",
    otp_incorrect: "ખોટો OTP નાખ્યો છે. કૃપા કરીને તપાસીને ફરી નાખો.",
    otp_invalid_method: "ચકાસણીની રીત સાચી નથી.",
    otp_invalid_token: "ખોટો OTP કોડ અથવા ટોકન.",
    otp_sent_whatsapp: "WhatsApp પર OTP મોકલી દેવામાં આવ્યો છે.",
    otp_sent_sms: "તમારા મોબાઇલ નંબર પર OTP મોકલી દેવામાં આવ્યો છે.",
    otp_sent_email: "તમારા ઈમેલ પર OTP મોકલી દેવામાં આવ્યો છે.",
    otp_service_error: "અત્યારે OTP મોકલવામાં મુશ્કેલી આવી રહી છે. કૃપા કરીને ફરી પ્રયાસ કરો.",
    account_not_registered: "આ મોબાઇલ નંબર અમારી સિસ્ટમમાં રજિસ્ટર નથી.",
    partner_not_found: "આ મોબાઇલ નંબર સાથે કોઈ એક્ટિવ પાર્ટનર એકાઉન્ટ મળ્યું નથી.",
    partner_already_registered: "તમે પહેલેથી રજિસ્ટર છો! કૃપા કરીને તમારા ડેશબોર્ડમાં લોગિન કરો.",
    profile_update_failed: "પ્રોફાઇલ અપડેટ થઈ શકી નથી. કૃપા કરીને ફરી પ્રયાસ કરો.",
    booking_missing_fields: "કૃપા કરીને ક્વોટેશન પસંદ કરો અને સરનામું ભરો.",
    lead_not_found: "આ ક્વોટેશન રેકોર્ડ મળ્યો નથી.",
    booking_forbidden: "તમને આ પૂછપરછ માટે બુકિંગ કરવાની પરવાનગી નથી.",
    booking_success: "સાઇટ વિઝિટનું બુકિંગ પાક્કું થઈ ગયું છે!",
    survey_failed: "સાઇટ વિઝિટ બુક થઈ શકી નથી. કૃપા કરીને વિગતો તપાસીને ફરી પ્રયાસ કરો.",
    lead_validation_failed: "કૃપા કરીને ભરેલી વિગતો તપાસો અને ફરી પ્રયાસ કરો.",
    lead_created_success: "તમારી ક્વોટેશન વિનંતી મોકલી દેવામાં આવી છે!",
    build_no_products: "કૃપા કરીને ઓછામાં ઓછો એક કેમેરા અથવા પ્રોડક્ટ પસંદ કરો.",
    build_no_recorder: "સુસંગતતા ભૂલ: વાયર્ડ કેમેરા માટે DVR/NVR રેકોર્ડર જરૂરી છે. કૃપા કરીને રેકોર્ડર પસંદ કરો.",
    build_recorder_capacity:
      "સુસંગતતા ભૂલ: પસંદ કરેલ રેકોર્ડર ફક્ત {channels} વાયર્ડ કેમેરા સપોર્ટ કરે છે, પણ તમે {cameras} પસંદ કર્યા છે. કૃપા કરીને મોટું રેકોર્ડર પસંદ કરો.",
    build_no_hdd_warning: "તમે Hard Disk (HDD) પસંદ કરી નથી — વાયર્ડ કેમેરા રેકોર્ડિંગ વગર ફક્ત લાઈવ દેખાશે.",
    build_hdd_days_note: "તમારી {tb}TB HDD માં {cameras} વાયર્ડ કેમેરાનું અંદાજે {days} દિવસનું રેકોર્ડિંગ થશે.",
    build_no_sd_warning: "તમે MicroSD કાર્ડ પસંદ કર્યું નથી — Wi-Fi કેમેરા લોકલ રેકોર્ડિંગ વગર ફક્ત લાઈવ ચાલશે.",
    build_sd_count_note: "તમે {cameras} વાયરલેસ કેમેરા માટે {sd} MicroSD કાર્ડ પસંદ કર્યા છે (દરેક કેમેરા માટે ૧ કાર્ડ શ્રેષ્ઠ છે).",
    quote_missing_snapshot: "ક્વોટેશનની માહિતી અધૂરી છે. કૃપા કરીને ફરીથી ક્વોટેશન બનાવો.",
    quote_save_failed: "ક્વોટેશન સેવ થઈ શક્યું નથી. કૃપા કરીને ફરી પ્રયાસ કરો.",
    referral_required: "કૃપા કરીને રેફરલ કોડ નાખો.",
    referral_invalid: "આ રેફરલ કોડ ખોટો છે અથવા બંધ છે.",
    referral_applied: "રેફરલ કોડ સફળતાપૂર્વક લાગુ થઈ ગયો!",
    referral_applied_flat: "રેફરલ કોડ લાગુ થઈ ગયો! ₹{minOrder} કે તેથી વધુના ઓર્ડર પર ₹{discount} નું સીધું ડિસ્કાઉન્ટ.",
    referral_failed: "રેફરલ કોડ તપાસી શકાયો નથી. કૃપા કરીને ફરી પ્રયાસ કરો.",
    waitlist_confirm_failed: "વેઇટલિસ્ટ કન્ફર્મ થઈ શકી નથી. કૃપા કરીને ફરી પ્રયાસ કરો.",
  },
  ta: {
    too_many_requests: "அதிக முயற்சிகள் செய்யப்பட்டுள்ளன. தயவுசெய்து சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.",
    too_many_attempts: "அதிக முறை முயற்சிக்கப்பட்டது. தயவுசெய்து 1 நிமிடம் கழித்து மீண்டும் முயற்சிக்கவும்.",
    internal_error: "சிறிய தொழில்நுட்ப கோளாறு ஏற்பட்டுள்ளது. தயவுசெய்து சிறிது நேரம் கழித்து முயற்சிக்கவும்.",
    unauthorized: "தொடர தயவுசெய்து உள்நுழையவும் (Login).",
    forbidden: "இந்த செயலைச் செய்ய உங்களுக்கு அனுமதி இல்லை.",
    system_maintenance: "சிஸ்டம் பராமரிப்பில் உள்ளது. தயவுசெய்து சிறிது நேரத்தில் மீண்டும் முயற்சிக்கவும்.",
    missing_fields: "தயவுசெய்து தேவையான அனைத்து விவரங்களையும் நிரப்பவும்.",
    phone_required: "மொபைல் எண் கட்டாயம் தேவை.",
    phone_invalid: "தயவுசெய்து சரியான 10-இலக்க இந்திய மொபைல் எண்ணை உள்ளிடவும்.",
    email_invalid: "தயவுசெய்து சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.",
    name_mobile_required: "முழு பெயர் மற்றும் மொபைல் எண் இரண்டும் தேவை.",
    phone_otp_required: "மொபைல் எண் மற்றும் OTP இரண்டும் தேவை.",
    otp_not_found: "OTP காலாவதியாகிவிட்டது அல்லது கிடைக்கவில்லை. புதிய OTP கேட்கவும்.",
    otp_expired: "OTP காலாவதியாகிவிட்டது. புதிய OTP கேட்கவும்.",
    otp_incorrect: "தவறான OTP எண். தயவுசெய்து சரிபார்த்து மீண்டும் உள்ளிடவும்.",
    otp_invalid_method: "சரிபார்ப்பு முறை தவறானது.",
    otp_invalid_token: "தவறான OTP குறியீடு அல்லது டோக்கன்.",
    otp_sent_whatsapp: "WhatsApp-இல் OTP அனுப்பப்பட்டுள்ளது.",
    otp_sent_sms: "உங்கள் மொபைல் எண்ணுக்கு OTP அனுப்பப்பட்டுள்ளது.",
    otp_sent_email: "உங்கள் மின்னஞ்சலுக்கு OTP அனுப்பப்பட்டுள்ளது.",
    otp_service_error: "தற்போது OTP அனுப்ப முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    account_not_registered: "இந்த மொபைல் எண் எங்கள் சிஸ்டத்தில் பதிவு செய்யப்படவில்லை.",
    partner_not_found: "இந்த மொபைல் எண்ணில் செயலில் உள்ள பார்ட்னர் கணக்கு எதுவும் இல்லை.",
    partner_already_registered: "நீங்கள் ஏற்கனவே பதிவு செய்துள்ளீர்கள்! உங்கள் டேஷ்போர்டில் உள்நுழையவும்.",
    profile_update_failed: "சுயவிவரத்தை புதுப்பிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    booking_missing_fields: "தயவுசெய்து கொட்டேஷனைத் தேர்ந்தெடுத்து முகவரியை உள்ளிடவும்.",
    lead_not_found: "இந்த கொட்டேஷன் பதிவு கிடைக்கவில்லை.",
    booking_forbidden: "இந்த விசாரணைக்கு முன்பதிவு செய்ய உங்களுக்கு அனுமதி இல்லை.",
    booking_success: "இடப் பார்வை (Site Visit) முன்பதிவு வெற்றிகரமாக முடிந்தது!",
    survey_failed: "இடப் பார்வை முன்பதிவு செய்ய முடியவில்லை. விவரங்களைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
    lead_validation_failed: "தயவுசெய்து உங்கள் விவரங்களைச் சரிபார்த்து மீண்டும் முயற்சிக்கவும்.",
    lead_created_success: "உங்கள் கொட்டேஷன் கோரிக்கை வெற்றிகரமாக அனுப்பப்பட்டது!",
    build_no_products: "தயவுசெய்து குறைந்தபட்சம் ஒரு கேமரா அல்லது பொருளைத் தேர்ந்தெடுக்கவும்.",
    build_no_recorder: "இணைப்புப் பிழை: வயர்டு கேமராக்களுக்கு DVR/NVR ரெக்கார்டர் தேவை. தயவுசெய்து ரெக்கார்டரைத் தேர்ந்தெடுக்கவும்.",
    build_recorder_capacity:
      "இணைப்புப் பிழை: தேர்ந்தெடுத்த ரெக்கார்டர் {channels} வயர்டு கேமராக்களை மட்டுமே ஆதரிக்கும், ஆனால் நீங்கள் {cameras} தேர்ந்தெடுத்துள்ளீர்கள். பெரிய ரெக்கார்டரைத் தேர்ந்தெடுக்கவும்.",
    build_no_hdd_warning: "நீங்கள் Hard Disk (HDD) தேர்ந்தெடுக்கவில்லை — வயர்டு கேமராக்கள் ரெக்கார்டிங் இல்லாமல் லைவ் மட்டுமே காட்டும்.",
    build_hdd_days_note: "உங்கள் {tb}TB HDD-இல் {cameras} வயர்டு கேமராக்களுக்கு சுமார் {days} நாட்கள் ரெக்கார்டிங் இருக்கும்.",
    build_no_sd_warning: "நீங்கள் MicroSD கார்டு தேர்ந்தெடுக்கவில்லை — Wi-Fi கேமராக்கள் ரெக்கார்டிங் இல்லாமல் லைவ் மட்டுமே காட்டும்.",
    build_sd_count_note: "{cameras} வயர்லெஸ் கேமராக்களுக்கு {sd} MicroSD கார்டு(கள்) தேர்ந்தெடுத்துள்ளீர்கள் (ஒரு கேமராவுக்கு 1 கார்டு சிறந்தது).",
    quote_missing_snapshot: "கொட்டேஷன் விவரங்கள் இல்லை. தயவுசெய்து மீண்டும் உருவாக்கவும்.",
    quote_save_failed: "கொட்டேஷனைச் சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    referral_required: "தயவுசெய்து ரெஃபரல் குறியீட்டை உள்ளிடவும்.",
    referral_invalid: "தவறான அல்லது செயலில் இல்லாத ரெஃபரல் குறியீடு.",
    referral_applied: "ரெஃபரல் குறியீடு வெற்றிகரமாகப் பயன்படுத்தப்பட்டது!",
    referral_applied_flat: "ரெஃபரல் குறியீடு பயன்படுத்தப்பட்டது! ₹{minOrder} மற்றும் அதற்கு மேற்பட்ட ஆர்டர்களுக்கு ₹{discount} தள்ளுபடி.",
    referral_failed: "ரெஃபரல் குறியீட்டைச் சரிபார்க்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
    waitlist_confirm_failed: "வெயிட்லிஸ்ட் பதிவை உறுதி செய்ய முடியவில்லை. மீண்டும் முயற்சிக்கவும்.",
  },
  te: {
    too_many_requests: "చాలాసార్లు ప్రయత్నించారు. దయచేసి కాసేపటి తర్వాత మళ్లీ ప్రయత్నించండి.",
    too_many_attempts: "ఎక్కువ సార్లు ప్రయత్నించారు. దయచేసి 1 నిమిషం ఆగి మళ్లీ ప్రయత్నించండి.",
    internal_error: "ఏదో సాంకేతిక సమస్య వచ్చింది. దయచేసి కాసేపటి తర్వాత ప్రయత్నించండి.",
    unauthorized: "ముందుకు వెళ్లడానికి దయచేసి లాగిన్ చేయండి.",
    forbidden: "ఈ పని చేయడానికి మీకు అనుమతి లేదు.",
    system_maintenance: "సిస్టమ్ అప్‌డేట్ అవుతోంది. దయచేసి కొద్ది నిమిషాల్లో మళ్లీ ప్రయత్నించండి.",
    missing_fields: "దయచేసి అవసరమైన అన్ని వివరాలు నమోదు చేయండి.",
    phone_required: "మొబైల్ నంబర్ తప్పనిసరి.",
    phone_invalid: "దయచేసి సరైన 10-అంకెల భారత మొబైల్ నంబర్ నమోదు చేయండి.",
    email_invalid: "దయచేసి సరైన ఇమెయిల్ చిరునామా నమోదు చేయండి.",
    name_mobile_required: "పూర్తి పేరు మరియు మొబైల్ నంబర్ రెండూ అవసరం.",
    phone_otp_required: "మొబైల్ నంబర్ మరియు OTP రెండూ అవసరం.",
    otp_not_found: "OTP గడువు ముగిసింది లేదా కనుగొనబడలేదు. దయచేసి కొత్త OTP అడగండి.",
    otp_expired: "OTP గడువు ముగిసింది. దయచేసి కొత్త OTP అడగండి.",
    otp_incorrect: "తప్పు OTP కోడ్. దయచేసి సరిచూసుకొని మళ్లీ నమోదు చేయండి.",
    otp_invalid_method: "తనిఖీ పద్ధతి సరైనది కాదు.",
    otp_invalid_token: "తప్పు OTP కోడ్ లేదా సెషన్ టోకెన్.",
    otp_sent_whatsapp: "WhatsApp ద్వారా OTP పంపబడింది.",
    otp_sent_sms: "మీ మొబైల్ నంబర్‌కు OTP పంపబడింది.",
    otp_sent_email: "మీ ఇమెయిల్‌కు OTP పంపబడింది.",
    otp_service_error: "ప్రస్తుతం OTP పంపడం సాధ్యపడలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.",
    account_not_registered: "ఈ మొబైల్ నంబర్ మా సిస్టమ్‌లో రిజిస్టర్ కాలేదు.",
    partner_not_found: "ఈ మొబైల్ నంబర్‌తో యాక్టివ్ పార్ట్‌నర్ ఖాతా కనుగొనబడలేదు.",
    partner_already_registered: "మీరు ఇప్పటికే రిజిస్టర్ అయ్యారు! దయచేసి మీ డ్యాష్‌బోర్డ్‌లోకి లాగిన్ అవ్వండి.",
    profile_update_failed: "ప్రొఫైల్ అప్‌డేట్ చేయడం సాధ్యపడలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.",
    booking_missing_fields: "దయచేసి కొటేషన్ ఎంచుకొని పూర్తి చిరునామా ఇవ్వండి.",
    lead_not_found: "ఈ కొటేషన్ వివరాలు కనుగొనబడలేదు.",
    booking_forbidden: "ఈ ఎంక్వైరీ కోసం బుకింగ్ చేయడానికి మీకు అనుమతి లేదు.",
    booking_success: "సైట్ విజిట్ బుకింగ్ విజయవంతమైంది!",
    survey_failed: "సైట్ విజిట్ బుక్ చేయడం సాధ్యపడలేదు. దయచేసి వివరాలు సరిచూసి మళ్లీ ప్రయత్నించండి.",
    lead_validation_failed: "దయచేసి మీరు ఇచ్చిన వివరాలను సరిచూసి మళ్లీ ప్రయత్నించండి.",
    lead_created_success: "మీ కొటేషన్ అభ్యర్థన పంపబడింది!",
    build_no_products: "దయచేసి కనీసం ఒక కెమెరా లేదా ప్రొడక్ట్ ఎంచుకోండి.",
    build_no_recorder: "సిస్టమ్ లోపం: వైర్డ్ కెమెరాలకు DVR/NVR రికార్డర్ అవసరం. దయచేసి రికార్డర్‌ను ఎంచుకోండి.",
    build_recorder_capacity:
      "సిస్టమ్ లోపం: ఎంచుకున్న రికార్డర్ కేవలం {channels} వైర్డ్ కెమెరాలకు మాత్రమే సరిపోతుంది, కానీ మీరు {cameras} ఎంచుకున్నారు. దయచేసి పెద్ద రికార్డర్‌ను ఎంచుకోండి.",
    build_no_hdd_warning: "మీరు Hard Disk (HDD) ఎంచుకోలేదు — వైర్డ్ కెమెరాలు రికార్డింగ్ లేకుండా కేవలం లైవ్ మాత్రమే చూపిస్తాయి.",
    build_hdd_days_note: "మీ {tb}TB HDD లో {cameras} వైర్డ్ కెమెరాలకు దాదాపు {days} రోజుల రికార్డింగ్ వస్తుంది.",
    build_no_sd_warning: "మీరు MicroSD కార్డ్ ఎంచుకోలేదు — Wi-Fi కెమెరాలు లోకల్ రికార్డింగ్ లేకుండా లైవ్ మాత్రమే చూపిస్తాయి.",
    build_sd_count_note: "{cameras} వైర్‌లెస్ కెమెరాల కోసం మీరు {sd} MicroSD కార్డ్‌(లు) ఎంచుకున్నారు (ఒక కెమెరాకు 1 కార్డ్ ఉత్తమం).",
    quote_missing_snapshot: "కొటేషన్ వివరాలు లేవు. దయచేసి మళ్లీ కొటేషన్ తయారు చేయండి.",
    quote_save_failed: "కొటేషన్ సేవ్ చేయడం సాధ్యపడలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.",
    referral_required: "దయచేసి రిఫరల్ కోడ్ నమోదు చేయండి.",
    referral_invalid: "తప్పు లేదా యాక్టివ్‌లో లేని రిఫరల్ కోడ్.",
    referral_applied: "రిఫరల్ కోడ్ విజయవంతంగా వర్తించింది!",
    referral_applied_flat: "రిఫరల్ కోడ్ వర్తించింది! ₹{minOrder} లేదా అంతకంటే ఎక్కువ ఆర్డర్లపై ₹{discount} తగ్గింపు.",
    referral_failed: "రిఫరల్ కోడ్ తనిఖీ చేయడం సాధ్యపడలేదు. మళ్లీ ప్రయత్నించండి.",
    waitlist_confirm_failed: "వెయిట్‌లిస్ట్ నిర్ధారించడం సాధ్యపడలేదు. దయచేసి మళ్లీ ప్రయత్నించండి.",
  },
  kn: {
    too_many_requests: "ಹೆಚ್ಚು ಬಾರಿ ಪ್ರಯತ್ನಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    too_many_attempts: "ಹಲವು ಬಾರಿ ಪ್ರಯತ್ನಿಸಲಾಗಿದೆ. ದಯವಿಟ್ಟು 1 ನಿಮಿಷ ಕಾದು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    internal_error: "ತಾಂತ್ರಿಕ ತೊಂದರೆ ಕಾಣಿಸಿಕೊಂಡಿದೆ. ದಯವಿಟ್ಟು ಸ್ವಲ್ಪ ಸಮಯದ ನಂತರ ಪ್ರಯತ್ನಿಸಿ.",
    unauthorized: "ಮುಂದುವರಿಯಲು ದಯವಿಟ್ಟು ಲಾಗಿನ್ ಮಾಡಿ.",
    forbidden: "ಈ ಕೆಲಸ ಮಾಡಲು ನಿಮಗೆ ಅನುಮತಿ ಇಲ್ಲ.",
    system_maintenance: "ಸಿಸ್ಟಮ್ ಅಪ್‌ಡೇಟ್ ಆಗುತ್ತಿದೆ. ದಯವಿಟ್ಟು ಕೆಲವೇ ನಿಮಿಷಗಳಲ್ಲಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    missing_fields: "ದಯವಿಟ್ಟು ಅಗತ್ಯವಿರುವ ಎಲ್ಲಾ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.",
    phone_required: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಅಗತ್ಯವಿದೆ.",
    phone_invalid: "ದಯವಿಟ್ಟು ಸರಿಯಾದ 10-ಅಂಕಿಯ ಭಾರತೀಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯನ್ನು ನಮೂದಿಸಿ.",
    email_invalid: "ದಯವಿಟ್ಟು ಸರಿಯಾದ ಇಮೇಲ್ ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.",
    name_mobile_required: "ಪೂರ್ಣ ಹೆಸರು ಮತ್ತು ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಎರಡೂ ಅಗತ್ಯವಿದೆ.",
    phone_otp_required: "ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮತ್ತು OTP ಎರಡೂ ಅಗತ್ಯವಿದೆ.",
    otp_not_found: "OTP ಅವಧಿ ಮುಗಿದಿದೆ ಅಥವಾ ಸಿಕ್ಕಿಲ್ಲ. ದಯವಿಟ್ಟು ಹೊಸ OTP ಕೇಳಿ.",
    otp_expired: "OTP ಅವಧಿ ಮುಗಿದಿದೆ. ದಯವಿಟ್ಟು ಹೊಸ OTP ಕೇಳಿ.",
    otp_incorrect: "ತಪ್ಪು OTP ಕೋಡ್. ದಯವಿಟ್ಟು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ನಮೂದಿಸಿ.",
    otp_invalid_method: "ಪರಿಶೀಲನಾ ವಿಧಾನ ಸರಿಯಾಗಿಲ್ಲ.",
    otp_invalid_token: "ತಪ್ಪು OTP ಕೋಡ್ ಅಥವಾ ಟೋಕನ್.",
    otp_sent_whatsapp: "WhatsApp ಗೆ OTP ಕಳುಹಿಸಲಾಗಿದೆ.",
    otp_sent_sms: "ನಿಮ್ಮ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಗೆ OTP ಕಳುಹಿಸಲಾಗಿದೆ.",
    otp_sent_email: "ನಿಮ್ಮ ಇಮೇಲ್‌ಗೆ OTP ಕಳುಹಿಸಲಾಗಿದೆ.",
    otp_service_error: "ಈಗ OTP ಕಳುಹಿಸಲು ಸಾಧ್ಯವಾಗುತ್ತಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    account_not_registered: "ಈ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ನಮ್ಮ ಸಿಸ್ಟಮ್‌ನಲ್ಲಿ ನೋಂದಾಯಿಸಲ್ಪಟ್ಟಿಲ್ಲ.",
    partner_not_found: "ಈ ಮೊಬೈಲ್ ಸಂಖ್ಯೆಯಲ್ಲಿ ಯಾವುದೇ ಸಕ್ರಿಯ ಪಾರ್ಟ್‌ನರ್ ಖಾತೆ ಕಂಡುಬಂದಿಲ್ಲ.",
    partner_already_registered: "ನೀವು ಈಗಾಗಲೇ ನೋಂದಾಯಿಸಿಕೊಂಡಿದ್ದೀರಿ! ದಯವಿಟ್ಟು ನಿಮ್ಮ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ಗೆ ಲಾಗಿನ್ ಮಾಡಿ.",
    profile_update_failed: "ಪ್ರೊಫೈಲ್ ಅಪ್‌ಡೇಟ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    booking_missing_fields: "ದಯವಿಟ್ಟು ಕೊಟೇಶನ್ ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು ವಿಳಾಸವನ್ನು ನಮೂದಿಸಿ.",
    lead_not_found: "ಕೊಟೇಶನ್ ದಾಖಲೆ ಕಂಡುಬಂದಿಲ್ಲ.",
    booking_forbidden: "ಈ ವಿಚಾರಣೆಗಾಗಿ ಬುಕಿಂಗ್ ಮಾಡಲು ನಿಮಗೆ ಅನುಮತಿ ಇಲ್ಲ.",
    booking_success: "ಸೈಟ್ ವಿಸಿಟ್ ಬುಕಿಂಗ್ ಯಶಸ್ವಿಯಾಗಿ ಪೂರ್ಣಗೊಂಡಿದೆ!",
    survey_failed: "ಸೈಟ್ ವಿಸಿಟ್ ಬುಕ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    lead_validation_failed: "ದಯವಿಟ್ಟು ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    lead_created_success: "ನಿಮ್ಮ ಕೊಟೇಶನ್ ವಿನಂತಿಯನ್ನು ಕಳುಹಿಸಲಾಗಿದೆ!",
    build_no_products: "ದಯವಿಟ್ಟು ಕನಿಷ್ಠ ಒಂದು ಕ್ಯಾಮೆರಾ ಅಥವಾ ಉತ್ಪನ್ನವನ್ನು ಆಯ್ಕೆಮಾಡಿ.",
    build_no_recorder: "ಹೊಂದಾಣಿಕೆ ದೋಷ: ವೈರ್ಡ್ ಕ್ಯಾಮೆರಾಗಳಿಗೆ DVR/NVR ರೆಕಾರ್ಡರ್ ಅಗತ್ಯವಿದೆ. ದಯವಿಟ್ಟು ರೆಕಾರ್ಡರ್ ಆಯ್ಕೆಮಾಡಿ.",
    build_recorder_capacity:
      "ಹೊಂದಾಣಿಕೆ ದೋಷ: ಆಯ್ಕೆ ಮಾಡಿದ ರೆಕಾರ್ಡರ್ ಕೇವಲ {channels} ವೈರ್ಡ್ ಕ್ಯಾಮೆರಾಗಳನ್ನು ಮಾತ್ರ ಬೆಂಬಲಿಸುತ್ತದೆ, ಆದರೆ ನೀವು {cameras} ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ. ದಯವಿಟ್ಟು ದೊಡ್ಡ ರೆಕಾರ್ಡರ್ ಆಯ್ಕೆಮಾಡಿ.",
    build_no_hdd_warning: "ನೀವು Hard Disk (HDD) ಆಯ್ಕೆ ಮಾಡಿಲ್ಲ — ವೈರ್ಡ್ ಕ್ಯಾಮೆರಾಗಳು ರೆಕಾರ್ಡಿಂಗ್ ಇಲ್ಲದೆ ಕೇವಲ ಲೈವ್ ಮಾತ್ರ ತೋರಿಸುತ್ತವೆ.",
    build_hdd_days_note: "ನಿಮ್ಮ {tb}TB HDD ಯಲ್ಲಿ {cameras} ವೈರ್ಡ್ ಕ್ಯಾಮೆರಾಗಳಿಗೆ ಸುಮಾರು {days} ದಿನಗಳ ರೆಕಾರ್ಡಿಂಗ್ ಸಿಗುತ್ತದೆ.",
    build_no_sd_warning: "ನೀವು MicroSD ಕಾರ್ಡ್ ಆಯ್ಕೆ ಮಾಡಿಲ್ಲ — Wi-Fi ಕ್ಯಾಮೆರಾಗಳು ಸ್ಥಳೀಯ ರೆಕಾರ್ಡಿಂಗ್ ಇಲ್ಲದೆ ಲೈವ್ ಮಾತ್ರ ತೋರಿಸುತ್ತವೆ.",
    build_sd_count_note: "{cameras} ವೈರ್‌ಲೆಸ್ ಕ್ಯಾಮೆರಾಗಳಿಗಾಗಿ ನೀವು {sd} MicroSD ಕಾರ್ಡ್(ಗಳನ್ನು) ಆಯ್ಕೆ ಮಾಡಿದ್ದೀರಿ (ಪ್ರತಿ ಕ್ಯಾಮೆರಾಗೆ 1 ಕಾರ್ಡ್ ಉತ್ತಮ).",
    quote_missing_snapshot: "ಕೊಟೇಶನ್ ವಿವರಗಳು ಕಾಣೆಯಾಗಿವೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ತಯಾರಿಸಿ.",
    quote_save_failed: "ಕೊಟೇಶನ್ ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    referral_required: "ದಯವಿಟ್ಟು ರೆಫರಲ್ ಕೋಡ್ ನಮೂದಿಸಿ.",
    referral_invalid: "ತಪ್ಪಾದ ಅಥವಾ ನಿಷ್ಕ್ರಿಯ ರೆಫರಲ್ ಕೋಡ್.",
    referral_applied: "ರೆಫರಲ್ ಕೋಡ್ ಯಶಸ್ವಿಯಾಗಿ ಅನ್ವಯಿಸಲಾಗಿದೆ!",
    referral_applied_flat: "ರೆಫರಲ್ ಕೋಡ್ ಅನ್ವಯಿಸಲಾಗಿದೆ! ₹{minOrder} ಅಥವಾ ಹೆಚ್ಚಿನ ಆರ್ಡರ್‌ಗಳ ಮೇಲೆ ₹{discount} ನೇರ ರಿಯಾಯಿತಿ.",
    referral_failed: "ರೆಫರಲ್ ಕೋಡ್ ಪರಿಶೀಲಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
    waitlist_confirm_failed: "ವೇಟ್‌ಲಿಸ್ಟ್ ದೃಢೀಕರಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.",
  },
  bn: {
    too_many_requests: "অনেক বেশি বার চেষ্টা করা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।",
    too_many_attempts: "অনেক বার চেষ্টা হয়েছে। অনুগ্রহ করে ১ মিনিট অপেক্ষা করে আবার চেষ্টা করুন।",
    internal_error: "একটি প্রযুক্তিগত সমস্যা হয়েছে। অনুগ্রহ করে কিছুক্ষণ পর আবার চেষ্টা করুন।",
    unauthorized: "এগিয়ে যেতে অনুগ্রহ করে লগইন করুন।",
    forbidden: "আপনার এই কাজটি করার অনুমতি নেই।",
    system_maintenance: "সিস্টেম আপডেট চলছে। অনুগ্রহ করে কয়েক মিনিট পর আবার চেষ্টা করুন।",
    missing_fields: "অনুগ্রহ করে সব প্রয়োজনীয় তথ্য পূরণ করুন।",
    phone_required: "মোবাইল নম্বর দেওয়া আবশ্যক।",
    phone_invalid: "অনুগ্রহ করে সঠিক ১০-অঙ্কের মোবাইল নম্বর দিন।",
    email_invalid: "অনুগ্রহ করে সঠিক ইমেল ঠিকানা দিন।",
    name_mobile_required: "পুরো নাম এবং মোবাইল নম্বর দুটোই প্রয়োজন।",
    phone_otp_required: "মোবাইল নম্বর এবং OTP দুটোই প্রয়োজন।",
    otp_not_found: "OTP-এর মেয়াদ শেষ হয়ে গেছে বা পাওয়া যায়নি। অনুগ্রহ করে নতুন OTP চান।",
    otp_expired: "OTP-এর মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে নতুন OTP চান।",
    otp_incorrect: "ভুল OTP দেওয়া হয়েছে। অনুগ্রহ করে পরীক্ষা করে আবার দিন।",
    otp_invalid_method: "যাচাই করার পদ্ধতি সঠিক নয়।",
    otp_invalid_token: "ভুল OTP কোড বা সেশন টোকেন।",
    otp_sent_whatsapp: "WhatsApp-এ OTP পাঠানো হয়েছে।",
    otp_sent_sms: "আপনার মোবাইল নম্বরে OTP পাঠানো হয়েছে।",
    otp_sent_email: "আপনার ইমেলে OTP পাঠানো হয়েছে।",
    otp_service_error: "এই মুহূর্তে OTP পাঠানো যাচ্ছে না। অনুগ্রহ করে আবার চেষ্টা করুন।",
    account_not_registered: "এই মোবাইল নম্বরটি আমাদের সিস্টেমে রেজিস্টার করা নেই।",
    partner_not_found: "এই মোবাইল নম্বরে কোনো সক্রিয় পার্টনার অ্যাকাউন্ট পাওয়া যায়নি।",
    partner_already_registered: "আপনি আগেই রেজিস্টার করেছেন! অনুগ্রহ করে আপনার ড্যাশবোর্ডে লগইন করুন।",
    profile_update_failed: "প্রোফাইল আপডেট করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
    booking_missing_fields: "অনুগ্রহ করে কোটেশন বেছে নিন এবং ঠিকানা লিখুন।",
    lead_not_found: "এই কোটেশন রেকর্ড পাওয়া যায়নি।",
    booking_forbidden: "এই এনকোয়ারির জন্য বুকিং করার অনুমতি আপনার নেই।",
    booking_success: "সাইট ভিজিট বুকিং সফল হয়েছে!",
    survey_failed: "সাইট ভিজিট বুক করা যায়নি। অনুগ্রহ করে তথ্য যাচাই করে আবার চেষ্টা করুন।",
    lead_validation_failed: "অনুগ্রহ করে আপনার তথ্য পরীক্ষা করে আবার চেষ্টা করুন।",
    lead_created_success: "আপনার কোটেশন অনুরোধ পাঠানো হয়েছে!",
    build_no_products: "অনুগ্রহ করে অন্তত একটি ক্যামেরা বা প্রোডাক্ট বেছে নিন।",
    build_no_recorder: "সিস্টেম ত্রুটি: তারযুক্ত (Wired) ক্যামেরার জন্য DVR/NVR রেকর্ডার প্রয়োজন। অনুগ্রহ করে একটি রেকর্ডার বেছে নিন।",
    build_recorder_capacity:
      "সিস্টেম ত্রুটি: নির্বাচিত রেকর্ডারটি কেবল {channels}টি তারযুক্ত ক্যামেরা সাপোর্ট করে, কিন্তু আপনি {cameras}টি বেছে নিয়েছেন। অনুগ্রহ করে বড় রেকর্ডার বেছে নিন।",
    build_no_hdd_warning: "আপনি কোনো Hard Disk (HDD) বেছে নেননি — তারযুক্ত ক্যামেরা রেকর্ডিং ছাড়া শুধু লাইভ দেখাবে।",
    build_hdd_days_note: "আপনার {tb}TB HDD-তে {cameras}টি তারযুক্ত ক্যামেরার প্রায় {days} দিনের রেকর্ডিং থাকবে।",
    build_no_sd_warning: "আপনি কোনো MicroSD কার্ড বেছে নেননি — Wi-Fi ক্যামেরা লোকাল রেকর্ডিং ছাড়া শুধু লাইভ চলবে।",
    build_sd_count_note: "{cameras}টি ওয়্যারলেস ক্যামেরার জন্য আপনি {sd}টি MicroSD কার্ড বেছে নিয়েছেন (প্রতি ক্যামেরার জন্য ১টি কার্ড ভালো)।",
    quote_missing_snapshot: "কোটেশনের তথ্য অসম্পূর্ণ। অনুগ্রহ করে আবার তৈরি করুন।",
    quote_save_failed: "কোটেশন সেভ করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
    referral_required: "অনুগ্রহ করে রেফারেল কোড লিখুন।",
    referral_invalid: "ভুল বা বন্ধ থাকা রেফারেল কোড।",
    referral_applied: "রেফারেল কোড সফলভাবে প্রয়োগ হয়েছে!",
    referral_applied_flat: "রেফারেল কোড প্রয়োগ হয়েছে! ₹{minOrder} বা তার বেশি অর্ডারে ₹{discount} সরাসরি ছাড়।",
    referral_failed: "রেফারেল কোড যাচাই করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
    waitlist_confirm_failed: "ওয়েটলিস্ট নিশ্চিত করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।",
  },
  ml: {
    too_many_requests: "നിരവധി തവണ ശ്രമിച്ചു. ദയവായി കുറച്ച് സമയത്തിന് ശേഷം വീണ്ടും ശ്രമിക്കുക.",
    too_many_attempts: "കൂടുതൽ തവണ ശ്രമിച്ചു. ദയവായി 1 മിനിറ്റ് കാത്തിരുന്ന് വീണ്ടും ശ്രമിക്കുക.",
    internal_error: "ചെറിയ സാങ്കേതിക തടസ്സമുണ്ട്. ദയവായി കുറച്ച് കഴിഞ്ഞ് വീണ്ടും ശ്രമിക്കുക.",
    unauthorized: "തുടരാൻ ദയവായി ലോഗിൻ ചെയ്യുക.",
    forbidden: "ഈ പ്രവൃത്തി ചെയ്യാൻ നിങ്ങൾക്ക് അനുമതിയില്ല.",
    system_maintenance: "സിസ്റ്റം അപ്ഡേറ്റ് നടക്കുകയാണ്. കുറച്ച് മിനിറ്റിന് ശേഷം വീണ്ടും ശ്രമിക്കുക.",
    missing_fields: "ദയവായി ആവശ്യമായ എല്ലാ വിവരങ്ങളും നൽകുക.",
    phone_required: "മൊബൈൽ നമ്പർ ആവശ്യമാണ്.",
    phone_invalid: "ദയവായി ശരിയായ 10-അക്ക ഇന്ത്യൻ മൊബൈൽ നമ്പർ നൽകുക.",
    email_invalid: "ദയവായി ശരിയായ ഇമെയിൽ വിലാസം നൽകുക.",
    name_mobile_required: "മുഴുവൻ പേരും മൊബൈൽ നമ്പറും ആവശ്യമാണ്.",
    phone_otp_required: "മൊബൈൽ നമ്പറും OTP-യും ആവശ്യമാണ്.",
    otp_not_found: "OTP സമയം കഴിഞ്ഞു അല്ലെങ്കിൽ കണ്ടെത്തിയില്ല. പുതിയ OTP ആവശ്യപ്പെടുക.",
    otp_expired: "OTP സമയം കഴിഞ്ഞു. ദയവായി പുതിയ OTP ആവശ്യപ്പെടുക.",
    otp_incorrect: "തെറ്റായ OTP കോഡ്. ദയവായി പരിശോധിച്ച് വീണ്ടും നൽകുക.",
    otp_invalid_method: "പരിശോധനാ രീതി ശരിയല്ല.",
    otp_invalid_token: "തെറ്റായ OTP കോഡ് അല്ലെങ്കിൽ ടോക്കൺ.",
    otp_sent_whatsapp: "WhatsApp-ലേക്ക് OTP അയച്ചിട്ടുണ്ട്.",
    otp_sent_sms: "നിങ്ങളുടെ മൊബൈൽ നമ്പറിലേക്ക് OTP അയച്ചിട്ടുണ്ട്.",
    otp_sent_email: "നിങ്ങളുടെ ഇമെയിലിലേക്ക് OTP അയച്ചിട്ടുണ്ട്.",
    otp_service_error: "ഇപ്പോൾ OTP അയക്കാൻ സാധിച്ചില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
    account_not_registered: "ഈ മൊബൈൽ നമ്പർ ഞങ്ങളുടെ സിസ്റ്റത്തിൽ രജിസ്റ്റർ ചെയ്തിട്ടില്ല.",
    partner_not_found: "ഈ മൊബൈൽ നമ്പറിൽ സജീവമായ പാർട്ണർ അക്കൗണ്ട് ഒന്നും കണ്ടെത്തിയില്ല.",
    partner_already_registered: "നിങ്ങൾ ഇതിനകം രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട്! ദയവായി ഡാഷ്‌ബോർഡിൽ ലോഗിൻ ചെയ്യുക.",
    profile_update_failed: "പ്രൊഫൈൽ അപ്‌ഡേറ്റ് ചെയ്യാൻ സാധിച്ചില്ല. വീണ്ടും ശ്രമിക്കുക.",
    booking_missing_fields: "ദയവായി ക്വട്ടേഷൻ തിരഞ്ഞെടുത്ത് വിലാസം നൽകുക.",
    lead_not_found: "ഈ ക്വട്ടേഷൻ രേഖ കണ്ടെത്തിയില്ല.",
    booking_forbidden: "ഈ അന്വേഷണത്തിന് ബുക്കിംഗ് നടത്താൻ നിങ്ങൾക്ക് അനുമതിയില്ല.",
    booking_success: "സൈറ്റ് വിസിറ്റ് ബുക്കിംഗ് വിജയകരമായി പൂർത്തിയായി!",
    survey_failed: "സൈറ്റ് വിസിറ്റ് ബുക്ക് ചെയ്യാൻ സാധിച്ചില്ല. വിവരങ്ങൾ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.",
    lead_validation_failed: "ദയവായി നൽകിയ വിവരങ്ങൾ പരിശോധിച്ച് വീണ്ടും ശ്രമിക്കുക.",
    lead_created_success: "നിങ്ങളുടെ ക്വട്ടേഷൻ അഭ്യർത്ഥന അയച്ചിട്ടുണ്ട്!",
    build_no_products: "ദയവായി കുറഞ്ഞത് ഒരു ക്യാമറയോ ഉൽപ്പന്നമോ തിരഞ്ഞെടുക്കുക.",
    build_no_recorder: "പൊരുത്തക്കേട്: വയർഡ് ക്യാമറകൾക്ക് DVR/NVR റെക്കോർഡർ ആവശ്യമാണ്. ദയവായി റെക്കോർഡർ തിരഞ്ഞെടുക്കുക.",
    build_recorder_capacity:
      "പൊരുത്തക്കേട്: തിരഞ്ഞെടുത്ത റെക്കോർഡർ {channels} വയർഡ് ക്യാമറകളെ മാത്രമേ പിന്തുണയ്ക്കൂ, എന്നാൽ നിങ്ങൾ {cameras} തിരഞ്ഞെടുത്തു. വലിയ റെക്കോർഡർ തിരഞ്ഞെടുക്കുക.",
    build_no_hdd_warning: "നിങ്ങൾ Hard Disk (HDD) തിരഞ്ഞെടുത്തിട്ടില്ല — വയർഡ് ക്യാമറകൾ റെക്കോർഡിംഗ് ഇല്ലാതെ ലൈവ് മാത്രമേ കാണിക്കൂ.",
    build_hdd_days_note: "നിങ്ങളുടെ {tb}TB HDD-യിൽ {cameras} വയർഡ് ക്യാമറകൾക്ക് ഏകദേശം {days} ദിവസത്തെ റെക്കോർഡിംഗ് ലഭിക്കും.",
    build_no_sd_warning: "നിങ്ങൾ MicroSD കാർഡ് തിരഞ്ഞെടുത്തിട്ടില്ല — Wi-Fi ക്യാമറകൾ ലോക്കൽ റെക്കോർഡിംഗ് ഇല്ലാതെ ലൈവ് മാത്രമേ കാണിക്കൂ.",
    build_sd_count_note: "{cameras} വയർലെസ് ക്യാമറകൾക്കായി നിങ്ങൾ {sd} MicroSD കാർഡ്(കൾ) തിരഞ്ഞെടുത്തു (ഒരു ക്യാമറയ്ക്ക് 1 കാർഡ് ഉചിതമാണ്).",
    quote_missing_snapshot: "ക്വട്ടേഷൻ വിവരങ്ങൾ പൂർണ്ണമല്ല. ദയവായി വീണ്ടും ഉണ്ടാക്കുക.",
    quote_save_failed: "ക്വട്ടേഷൻ സേവ് ചെയ്യാൻ സാധിച്ചില്ല. ദയവായി വീണ്ടും ശ്രമിക്കുക.",
    referral_required: "ദയവായി റഫറൽ കോഡ് നൽകുക.",
    referral_invalid: "തെറ്റായതോ പ്രവർത്തനരഹിതമായതോ ആയ റഫറൽ കോഡ്.",
    referral_applied: "റഫറൽ കോഡ് വിജയകരമായി ചേർത്തു!",
    referral_applied_flat: "റഫറൽ കോഡ് ചേർത്തു! ₹{minOrder} അല്ലെങ്കിൽ അതിൽ കൂടുതലുള്ള ഓർഡറുകൾക്ക് ₹{discount} കിഴിവ്.",
    referral_failed: "റഫറൽ കോഡ് പരിശോധിക്കാൻ സാധിച്ചില്ല. വീണ്ടും ശ്രമിക്കുക.",
    waitlist_confirm_failed: "വെയ്റ്റ്‌ലിസ്റ്റ് സ്ഥിരീകരിക്കാൻ സാധിച്ചില്ല. വീണ്ടും ശ്രമിക്കുക.",
  },
  pa: {
    too_many_requests: "ਬਹੁਤ ਜ਼ਿਆਦਾ ਕੋਸ਼ਿਸ਼ਾਂ ਹੋ ਗਈਆਂ ਹਨ। ਕਿਰਪਾ ਕਰਕੇ ਥੋੜ੍ਹੀ ਦੇਰ ਬਾਅਦ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    too_many_attempts: "ਬਹੁਤ ਵਾਰ ਕੋਸ਼ਿਸ਼ ਕੀਤੀ ਗਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ 1 ਮਿੰਟ ਰੁਕ ਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    internal_error: "ਕੋਈ ਤਕਨੀਕੀ ਦਿੱਕਤ ਆ ਗਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਥੋੜ੍ਹੀ ਦੇਰ ਬਾਅਦ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    unauthorized: "ਅੱਗੇ ਵਧਣ ਲਈ ਕਿਰਪਾ ਕਰਕੇ ਲੌਗਇਨ ਕਰੋ।",
    forbidden: "ਤੁਹਾਨੂੰ ਇਹ ਕੰਮ ਕਰਨ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਹੈ।",
    system_maintenance: "ਸਿਸਟਮ ਅੱਪਡੇਟ ਹੋ ਰਿਹਾ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਕੁਝ ਮਿੰਟਾਂ ਵਿੱਚ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    missing_fields: "ਕਿਰਪਾ ਕਰਕੇ ਸਾਰੀ ਜ਼ਰੂਰੀ ਜਾਣਕਾਰੀ ਭਰੋ।",
    phone_required: "ਮੋਬਾਈਲ ਨੰਬਰ ਪਾਉਣਾ ਜ਼ਰੂਰੀ ਹੈ।",
    phone_invalid: "ਕਿਰਪਾ ਕਰਕੇ ਸਹੀ 10-ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਪਾਓ।",
    email_invalid: "ਕਿਰਪਾ ਕਰਕੇ ਸਹੀ ਈਮੇਲ ਪਤਾ ਪਾਓ।",
    name_mobile_required: "ਪੂਰਾ ਨਾਮ ਅਤੇ ਮੋਬਾਈਲ ਨੰਬਰ ਦੋਵੇਂ ਜ਼ਰੂਰੀ ਹਨ।",
    phone_otp_required: "ਮੋਬਾਈਲ ਨੰਬਰ ਅਤੇ OTP ਦੋਵੇਂ ਜ਼ਰੂਰੀ ਹਨ।",
    otp_not_found: "OTP ਦੀ ਮਿਆਦ ਖਤਮ ਹੋ ਗਈ ਹੈ ਜਾਂ ਮਿਲਿਆ ਨਹੀਂ। ਕਿਰਪਾ ਕਰਕੇ ਨਵਾਂ OTP ਮੰਗਵਾਓ।",
    otp_expired: "OTP ਦੀ ਮਿਆਦ ਖਤਮ ਹੋ ਗਈ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਨਵਾਂ OTP ਮੰਗਵਾਓ।",
    otp_incorrect: "ਗਲਤ OTP ਪਾਇਆ ਗਿਆ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਜਾਂਚ ਕੇ ਦੁਬਾਰਾ ਪਾਓ।",
    otp_invalid_method: "ਜਾਂਚ ਦਾ ਤਰੀਕਾ ਸਹੀ ਨਹੀਂ ਹੈ।",
    otp_invalid_token: "ਗਲਤ OTP ਕੋਡ ਜਾਂ ਟੋਕਨ।",
    otp_sent_whatsapp: "WhatsApp 'ਤੇ OTP ਭੇਜ ਦਿੱਤਾ ਗਿਆ ਹੈ।",
    otp_sent_sms: "ਤੁਹਾਡੇ ਮੋਬਾਈਲ ਨੰਬਰ 'ਤੇ OTP ਭੇਜ ਦਿੱਤਾ ਗਿਆ ਹੈ।",
    otp_sent_email: "ਤੁਹਾਡੇ ਈਮੇਲ 'ਤੇ OTP ਭੇਜ ਦਿੱਤਾ ਗਿਆ ਹੈ।",
    otp_service_error: "ਇਸ ਵੇਲੇ OTP ਭੇਜਣ ਵਿੱਚ ਦਿੱਕਤ ਆ ਰਹੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    account_not_registered: "ਇਹ ਮੋਬਾਈਲ ਨੰਬਰ ਸਾਡੇ ਸਿਸਟਮ ਵਿੱਚ ਰਜਿਸਟਰ ਨਹੀਂ ਹੈ।",
    partner_not_found: "ਇਸ ਮੋਬਾਈਲ ਨੰਬਰ 'ਤੇ ਕੋਈ ਐਕਟਿਵ ਪਾਰਟਨਰ ਖਾਤਾ ਨਹੀਂ ਮਿਲਿਆ।",
    partner_already_registered: "ਤੁਸੀਂ ਪਹਿਲਾਂ ਹੀ ਰਜਿਸਟਰ ਹੋ! ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੇ ਡੈਸ਼ਬੋਰਡ ਵਿੱਚ ਲੌਗਇਨ ਕਰੋ।",
    profile_update_failed: "ਪ੍ਰੋਫਾਈਲ ਅੱਪਡੇਟ ਨਹੀਂ ਹੋ ਸਕੀ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    booking_missing_fields: "ਕਿਰਪਾ ਕਰਕੇ ਕੋਟੇਸ਼ਨ ਚੁਣੋ ਅਤੇ ਪੂਰਾ ਪਤਾ ਲਿਖੋ।",
    lead_not_found: "ਇਹ ਕੋਟੇਸ਼ਨ ਰਿਕਾਰਡ ਨਹੀਂ ਮਿਲਿਆ।",
    booking_forbidden: "ਤੁਹਾਨੂੰ ਇਸ ਪੁੱਛਗਿੱਛ ਲਈ ਬੁਕਿੰਗ ਕਰਨ ਦੀ ਇਜਾਜ਼ਤ ਨਹੀਂ ਹੈ।",
    booking_success: "ਸਾਈਟ ਵਿਜ਼ਿਟ ਬੁਕਿੰਗ ਪੱਕੀ ਹੋ ਗਈ ਹੈ!",
    survey_failed: "ਸਾਈਟ ਵਿਜ਼ਿਟ ਬੁੱਕ ਨਹੀਂ ਹੋ ਸਕੀ। ਕਿਰਪਾ ਕਰਕੇ ਜਾਣਕਾਰੀ ਜਾਂਚ ਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    lead_validation_failed: "ਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਭਰੀ ਹੋਈ ਜਾਣਕਾਰੀ ਜਾਂਚੋ ਅਤੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    lead_created_success: "ਤੁਹਾਡੀ ਕੋਟੇਸ਼ਨ ਬੇਨਤੀ ਭੇਜ ਦਿੱਤੀ ਗਈ ਹੈ!",
    build_no_products: "ਕਿਰਪਾ ਕਰਕੇ ਘੱਟੋ-ਘੱਟ ਇੱਕ ਕੈਮਰਾ ਜਾਂ ਪ੍ਰੋਡਕਟ ਚੁਣੋ।",
    build_no_recorder: "ਸਿਸਟਮ ਗਲਤੀ: ਤਾਰ ਵਾਲੇ ਕੈਮਰਿਆਂ ਲਈ DVR/NVR ਰਿਕਾਰਡਰ ਜ਼ਰੂਰੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਰਿਕਾਰਡਰ ਚੁਣੋ।",
    build_recorder_capacity:
      "ਸਿਸਟਮ ਗਲਤੀ: ਚੁਣਿਆ ਗਿਆ ਰਿਕਾਰਡਰ ਸਿਰਫ਼ {channels} ਤਾਰ ਵਾਲੇ ਕੈਮਰੇ ਸਪੋਰਟ ਕਰਦਾ ਹੈ, ਪਰ ਤੁਸੀਂ {cameras} ਚੁਣੇ ਹਨ। ਕਿਰਪਾ ਕਰਕੇ ਵੱਡਾ ਰਿਕਾਰਡਰ ਚੁਣੋ।",
    build_no_hdd_warning: "ਤੁਸੀਂ Hard Disk (HDD) ਨਹੀਂ ਚੁਣੀ — ਤਾਰ ਵਾਲੇ ਕੈਮਰੇ ਬਿਨਾਂ ਰਿਕਾਰਡਿੰਗ ਦੇ ਸਿਰਫ਼ ਲਾਈਵ ਦਿਸਣਗੇ।",
    build_hdd_days_note: "ਤੁਹਾਡੀ {tb}TB HDD ਵਿੱਚ {cameras} ਤਾਰ ਵਾਲੇ ਕੈਮਰਿਆਂ ਦੀ ਲਗਭਗ {days} ਦਿਨਾਂ ਦੀ ਰਿਕਾਰਡਿੰਗ ਹੋਵੇਗੀ।",
    build_no_sd_warning: "ਤੁਸੀਂ MicroSD ਕਾਰਡ ਨਹੀਂ ਚੁਣਿਆ — Wi-Fi ਕੈਮਰੇ ਬਿਨਾਂ ਲੋਕਲ ਰਿਕਾਰਡਿੰਗ ਦੇ ਸਿਰਫ਼ ਲਾਈਵ ਚੱਲਣਗੇ।",
    build_sd_count_note: "ਤੁਸੀਂ {cameras} ਵਾਇਰਲੈੱਸ ਕੈਮਰਿਆਂ ਲਈ {sd} MicroSD ਕਾਰਡ ਚੁਣੇ ਹਨ (ਹਰ ਕੈਮਰੇ ਲਈ 1 ਕਾਰਡ ਵਧੀਆ ਰਹਿੰਦਾ ਹੈ)।",
    quote_missing_snapshot: "ਕੋਟੇਸ਼ਨ ਦੀ ਜਾਣਕਾਰੀ ਅਧੂਰੀ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਬਣਾਓ।",
    quote_save_failed: "ਕੋਟੇਸ਼ਨ ਸੇਵ ਨਹੀਂ ਹੋ ਸਕਿਆ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    referral_required: "ਕਿਰਪਾ ਕਰਕੇ ਰੈਫਰਲ ਕੋਡ ਪਾਓ।",
    referral_invalid: "ਗਲਤ ਜਾਂ ਬੰਦ ਰੈਫਰਲ ਕੋਡ।",
    referral_applied: "ਰੈਫਰਲ ਕੋਡ ਸਫਲਤਾਪੂਰਵਕ ਲਾਗੂ ਹੋ ਗਿਆ!",
    referral_applied_flat: "ਰੈਫਰਲ ਕੋਡ ਲਾਗੂ ਹੋ ਗਿਆ! ₹{minOrder} ਜਾਂ ਵੱਧ ਦੇ ਆਰਡਰ 'ਤੇ ₹{discount} ਦੀ ਸਿੱਧੀ ਛੋਟ।",
    referral_failed: "ਰੈਫਰਲ ਕੋਡ ਦੀ ਜਾਂਚ ਨਹੀਂ ਹੋ ਸਕੀ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
    waitlist_confirm_failed: "ਵੇਟਲਿਸਟ ਦੀ ਪੁਸ਼ਟੀ ਨਹੀਂ ਹੋ ਸਕੀ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।",
  },
  or: {
    too_many_requests: "ଅତ୍ୟଧିକ ଥର ଚେଷ୍ଟା ହୋଇସାରିଛି। ଦୟାକରି କିଛି ସମୟ ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    too_many_attempts: "ଅଧିକ ଥର ଚେଷ୍ଟା ହୋଇଛି। ଦୟାକରି ୧ ମିନିଟ୍ ଅପେକ୍ଷା କରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    internal_error: "କିଛି ଯାନ୍ତ୍ରିକ ତ୍ରୁଟି ଦେଖାଦେଇଛି। ଦୟାକରି କିଛି ସମୟ ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    unauthorized: "ଆଗକୁ ବଢ଼ିବା ପାଇଁ ଦୟାକରି ଲଗଇନ୍ କରନ୍ତୁ।",
    forbidden: "ଆପଣଙ୍କୁ ଏହି କାର୍ଯ୍ୟ କରିବାକୁ ଅନୁମତି ନାହିଁ।",
    system_maintenance: "ସିଷ୍ଟମ୍ ଅପଡେଟ୍ ଚାଲିଛି। ଦୟାକରି କିଛି ମିନିଟ୍ ପରେ ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    missing_fields: "ଦୟାକରି ସମସ୍ତ ଆବଶ୍ୟକୀୟ ତଥ୍ୟ ପୂରଣ କରନ୍ତୁ।",
    phone_required: "ମୋବାଇଲ୍ ନମ୍ବର ଦେବା ଆବଶ୍ୟକ।",
    phone_invalid: "ଦୟାକରି ସଠିକ୍ ୧୦-ଅଙ୍କ ବିଶିଷ୍ଟ ଭାରତୀୟ ମୋବାଇଲ୍ ନମ୍ବର ଦିଅନ୍ତୁ।",
    email_invalid: "ଦୟାକରି ସଠିକ୍ ଇମେଲ୍ ଠିକଣା ଦିଅନ୍ତୁ।",
    name_mobile_required: "ପୂରା ନାମ ଏବଂ ମୋବାଇଲ୍ ନମ୍ବର ଉଭୟ ଆବଶ୍ୟକ।",
    phone_otp_required: "ମୋବାଇଲ୍ ନମ୍ବର ଏବଂ OTP ଉଭୟ ଆବଶ୍ୟକ।",
    otp_not_found: "OTP ସମୟ ଶେଷ ହୋଇଯାଇଛି କିମ୍ବା ମିଳିଲା ନାହିଁ। ଦୟାକରି ନୂଆ OTP ମଗାନ୍ତୁ।",
    otp_expired: "OTP ସମୟ ଶେଷ ହୋଇଯାଇଛି। ଦୟାକରି ନୂଆ OTP ମଗାନ୍ତୁ।",
    otp_incorrect: "ଭୁଲ୍ OTP କୋଡ୍। ଦୟାକରି ଯାଞ୍ଚ କରି ପୁଣି ଦିଅନ୍ତୁ।",
    otp_invalid_method: "ଯାଞ୍ଚ କରିବାର ପଦ୍ଧତି ସଠିକ୍ ନୁହେଁ।",
    otp_invalid_token: "ଭୁଲ୍ OTP କୋଡ୍ କିମ୍ବା ଟୋକେନ୍।",
    otp_sent_whatsapp: "WhatsApp ରେ OTP ପଠାଯାଇଛି।",
    otp_sent_sms: "ଆପଣଙ୍କ ମୋବାଇଲ୍ ନମ୍ବରକୁ OTP ପଠାଯାଇଛି।",
    otp_sent_email: "ଆପଣଙ୍କ ଇମେଲକୁ OTP ପଠାଯାଇଛି।",
    otp_service_error: "ଏବେ OTP ପଠାଇବା ସମ୍ଭବ ହେଲା ନାହିଁ। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    account_not_registered: "ଏହି ମୋବାଇଲ୍ ନମ୍ବର ଆମ ସିଷ୍ଟମରେ ପଞ୍ଜୀକୃତ ନୁହେଁ।",
    partner_not_found: "ଏହି ମୋବାଇଲ୍ ନମ୍ବରରେ କୌଣସି ସକ୍ରିୟ ପାର୍ଟନର ଆକାଉଣ୍ଟ ମିଳିଲା ନାହିଁ।",
    partner_already_registered: "ଆପଣ ଆଗରୁ ପଞ୍ଜୀକୃତ ଅଛନ୍ତି! ଦୟାକରି ଆପଣଙ୍କ ଡ୍ୟାଶବୋର୍ଡରେ ଲଗଇନ୍ କରନ୍ତୁ।",
    profile_update_failed: "ପ୍ରୋଫାଇଲ୍ ଅପଡେଟ୍ ହୋଇପାରିଲା ନାହିଁ। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    booking_missing_fields: "ଦୟାକରି କୋଟେସନ୍ ବାଛନ୍ତୁ ଏବଂ ଠିକଣା ଦିଅନ୍ତୁ।",
    lead_not_found: "ଏହି କୋଟେସନ୍ ତଥ୍ୟ ମିଳିଲା ନାହିଁ।",
    booking_forbidden: "ଏହି ଅନୁସନ୍ଧାନ ପାଇଁ ବୁକିଂ କରିବାକୁ ଆପଣଙ୍କୁ ଅନୁମତି ନାହିଁ।",
    booking_success: "ସାଇଟ୍ ଭିଜିଟ୍ ବୁକିଂ ସଫଳ ହୋଇଛି!",
    survey_failed: "ସାଇଟ୍ ଭିଜିଟ୍ ବୁକ୍ ହୋଇପାରିଲା ନାହିଁ। ଦୟାକରି ତଥ୍ୟ ଯାଞ୍ଚ କରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    lead_validation_failed: "ଦୟାକରି ଆପଣଙ୍କ ତଥ୍ୟ ଯାଞ୍ଚ କରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    lead_created_success: "ଆପଣଙ୍କ କୋଟେସନ୍ ଅନୁରୋଧ ପଠାଯାଇଛି!",
    build_no_products: "ଦୟାକରି ଅତି କମରେ ଗୋଟିଏ କ୍ୟାମେରା କିମ୍ବା ପ୍ରଡକ୍ଟ ବାଛନ୍ତୁ।",
    build_no_recorder: "ସିଷ୍ଟମ୍ ତ୍ରୁଟି: ତାର ଯୁକ୍ତ (Wired) କ୍ୟାମେରା ପାଇଁ DVR/NVR ରେକର୍ଡର ଆବଶ୍ୟକ। ଦୟାକରି ରେକର୍ଡର ବାଛନ୍ତୁ।",
    build_recorder_capacity:
      "ସିଷ୍ଟମ୍ ତ୍ରୁଟି: ବଛାଯାଇଥିବା ରେକର୍ଡର କେବଳ {channels}ଟି ତାର ଯୁକ୍ତ କ୍ୟାମେରା ସପୋର୍ଟ କରେ, କିନ୍ତୁ ଆପଣ {cameras}ଟି ବାଛିଛନ୍ତି। ଦୟାକରି ବଡ଼ ରେକର୍ଡର ବାଛନ୍ତୁ।",
    build_no_hdd_warning: "ଆପଣ Hard Disk (HDD) ବାଛି ନାହାନ୍ତି — ତାର ଯୁକ୍ତ କ୍ୟାମେରା ରେକର୍ଡିଂ ବିନା କେବଳ ଲାଇଭ୍ ଦେଖାଇବ।",
    build_hdd_days_note: "ଆପଣଙ୍କ {tb}TB HDD ରେ {cameras}ଟି ତାର ଯୁକ୍ତ କ୍ୟାମେରାର ପ୍ରାୟ {days} ଦିନର ରେକର୍ଡିଂ ରହିବ।",
    build_no_sd_warning: "ଆପଣ MicroSD କାର୍ଡ ବାଛି ନାହାନ୍ତି — Wi-Fi କ୍ୟାମେରା ଲୋକାଲ୍ ରେକର୍ଡିଂ ବିନା କେବଳ ଲାଇଭ୍ ଚାଲିବ।",
    build_sd_count_note: "{cameras}ଟି ୱାୟାରଲେସ୍ କ୍ୟାମେରା ପାଇଁ ଆପଣ {sd}ଟି MicroSD କାର୍ଡ ବାଛିଛନ୍ତି (ପ୍ରତି କ୍ୟାମେରା ପାଇଁ ୧ଟି କାର୍ଡ ଉତ୍ତମ)।",
    quote_missing_snapshot: "କୋଟେସନ୍ ତଥ୍ୟ ଅସମ୍ପୂର୍ଣ୍ଣ। ଦୟାକରି ପୁଣି ତିଆରି କରନ୍ତୁ।",
    quote_save_failed: "କୋଟେସନ୍ ସେଭ୍ ହୋଇପାରିଲା ନାହିଁ। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    referral_required: "ଦୟାକରି ରେଫରାଲ୍ କୋଡ୍ ଦିଅନ୍ତୁ।",
    referral_invalid: "ଭୁଲ୍ କିମ୍ବା ବନ୍ଦ ଥିବା ରେଫରାଲ୍ କୋଡ୍।",
    referral_applied: "ରେଫରାଲ୍ କୋଡ୍ ସଫଳତାର ସହ ଲାଗୁ ହୋଇଛି!",
    referral_applied_flat: "ରେଫରାଲ୍ କୋଡ୍ ଲାଗୁ ହୋଇଛି! ₹{minOrder} କିମ୍ବା ଅଧିକ ଅର୍ଡରରେ ₹{discount} ସିଧାସଳଖ ରିହାତି।",
    referral_failed: "ରେଫରାଲ୍ କୋଡ୍ ଯାଞ୍ଚ ହୋଇପାରିଲା ନାହିଁ। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
    waitlist_confirm_failed: "ୱେଟଲିଷ୍ଟ ନିଶ୍ଚିତ ହୋଇପାରିଲା ନାହିଁ। ଦୟାକରି ପୁଣି ଚେଷ୍ଟା କରନ୍ତୁ।",
  },
};

function parseCookieHeader(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    if (k === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

export function resolveRequestLocale(
  req?: Request | NextRequest | null,
  body?: Record<string, any> | null
): LocaleCode {
  const candidates = [
    body?.preferred_language,
    body?.locale,
    body?.language,
    body?.wizard_answers?.preferred_language,
    body?.wizard_answers?.locale,
    req?.headers?.get("x-locale"),
  ];

  if (req && "nextUrl" in req && req.nextUrl) {
    candidates.push(req.nextUrl.searchParams.get("lang"), req.nextUrl.searchParams.get("locale"));
    candidates.push(req.cookies?.get?.(LOCALE_COOKIE_NAME)?.value);
  } else if (req?.url) {
    try {
      const url = new URL(req.url);
      candidates.push(url.searchParams.get("lang"), url.searchParams.get("locale"));
    } catch {
      // Ignore invalid relative URLs in tests
    }
  }

  if (req?.headers) {
    candidates.push(parseCookieHeader(req.headers.get("cookie"), LOCALE_COOKIE_NAME));
  }

  for (const raw of candidates) {
    if (typeof raw === "string") {
      const normalized = raw.trim().toLowerCase();
      if (isValidLocale(normalized)) return normalized;
    }
  }

  return "en";
}

export function getApiMessage(
  locale: LocaleCode,
  key: ApiMessageKey,
  params?: Record<string, string | number>
): string {
  const dict = API_MESSAGES[locale] || API_MESSAGES.en;
  let str = dict[key] || API_MESSAGES.en[key] || key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}

export async function getActionLocale(explicit?: unknown): Promise<LocaleCode> {
  if (typeof explicit === "string") {
    const normalized = explicit.trim().toLowerCase();
    if (isValidLocale(normalized)) return normalized;
  }
  return getServerLocale();
}
