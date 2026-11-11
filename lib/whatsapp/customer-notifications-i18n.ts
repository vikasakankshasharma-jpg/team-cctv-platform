/**
 * @file lib/whatsapp/customer-notifications-i18n.ts
 * @description Localized Routine Spoken Indian customer WhatsApp notifications across all 11 languages
 * plus Firestore-backed customer locale resolution.
 */

import { ALL_11_LANGUAGES, LocaleCode } from "../i18n/mapping";
import { normalizePhoneNumber } from "./deduplication";

export function normalizeLocaleCode(raw: unknown): LocaleCode | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toLowerCase() as LocaleCode;
  return ALL_11_LANGUAGES.some((l) => l.code === code) ? code : null;
}

/**
 * Resolves customer preferred locale across explicit payload, lead/quote docs, and WhatsApp session.
 */
export async function resolveCustomerLocale(opts: {
  preferredLanguage?: unknown;
  quoteData?: Record<string, any> | null;
  leadData?: Record<string, any> | null;
  leadId?: string | null;
  phone?: string | null;
  cookieLocale?: unknown;
}): Promise<LocaleCode> {
  const direct =
    normalizeLocaleCode(opts.preferredLanguage) ||
    normalizeLocaleCode(opts.quoteData?.preferred_language) ||
    normalizeLocaleCode(opts.quoteData?.language) ||
    normalizeLocaleCode(opts.leadData?.preferred_language) ||
    normalizeLocaleCode(opts.leadData?.wizard_answers?.locale) ||
    normalizeLocaleCode(opts.leadData?.wizard_answers?.preferred_language) ||
    normalizeLocaleCode(opts.quoteData?.configurationSnapshot?.locale);

  if (direct) return direct;

  try {
    const { adminDb } = await import("@/lib/firebase-admin");
    const targetLeadId = opts.leadId || opts.quoteData?.lead_id || opts.quoteData?.leadId;
    if (adminDb && targetLeadId && !opts.leadData) {
      const leadSnap = await adminDb.collection("leads").doc(String(targetLeadId)).get();
      if (leadSnap.exists) {
        const lData = leadSnap.data() || {};
        const fromLead =
          normalizeLocaleCode(lData.preferred_language) ||
          normalizeLocaleCode(lData.wizard_answers?.locale) ||
          normalizeLocaleCode(lData.wizard_answers?.preferred_language);
        if (fromLead) return fromLead;
      }
    }

    const rawPhone =
      opts.phone ||
      opts.quoteData?.customer_mobile ||
      opts.quoteData?.mobile_number ||
      opts.leadData?.mobile_number;
    if (adminDb && rawPhone) {
      const canonical = normalizePhoneNumber(String(rawPhone));
      if (canonical) {
        const sessSnap = await adminDb.collection("whatsapp_sessions").doc(canonical).get();
        if (sessSnap.exists) {
          const fromSess = normalizeLocaleCode(sessSnap.data()?.language);
          if (fromSess) return fromSess;
        }
      }
    }
  } catch (err) {
    console.warn("[resolveCustomerLocale] Lookup fallback to en:", err);
  }

  return normalizeLocaleCode(opts.cookieLocale) || "en";
}

interface NotificationBundle {
  quoteReady: (p: { name: string; link: string }) => string;
  installerAssigned: (p: { name: string; installerName: string; trackingUrl: string }) => string;
  completionPinReminder: (p: { name: string; pin: string }) => string;
  deliveryDispatched: (p: { name: string; amount: string; paymentUrl: string; allowCash: boolean }) => string;
  deliveryConfirmedStartOtp: (p: { otp: string }) => string;
  installerSignoffRequest: (p: { balance: string; balanceNum: number; paymentLink: string; otp: string }) => string;
  installerCompletedPayFinal: (p: { amount: string; paymentUrl: string }) => string;
  installerCompletedWarrantySoon: () => string;
  paymentReminderLink: (p: { name: string; stageName: string; amount: string; paymentUrl: string }) => string;
  stageBooking: string;
  stageDelivery90: string;
  stageFinal10: string;
  bookingPaidConfirmed: (p: { quoteId: string; jobId: string; trackingUrl: string }) => string;
  deliveryPaidOtp: (p: { amount: string; otp: string }) => string;
  finalPaidCompleted: (p: { amount: string }) => string;
  refundProcessed: (p: { amount: string; quoteId: string }) => string;
  referEarnWelcome: (p: { name: string; code: string; portalUrl: string }) => string;
  partnerWelcome: (p: { name: string; code: string; portalUrl: string }) => string;
}

const NOTIF_STRINGS: Record<LocaleCode, NotificationBundle> = {
  en: {
    quoteReady: ({ name, link }) =>
      `👋 Hi ${name},\n\nYour custom CCTV quotes are ready! 🎥🛡️\n\nCompare brands & customize your setup here:\n${link}\n\n- TEAM CCTV`,
    installerAssigned: ({ name, installerName, trackingUrl }) =>
      `✅ *Technician Assigned!*\n\nHi ${name},\nYour CCTV technician, *${installerName}*, has been assigned and will arrive soon.\n\n*Track status & check your Completion PIN here:*\n${trackingUrl}\n\nShare the PIN only after work finishes.`,
    completionPinReminder: ({ name, pin }) =>
      `🔔 *Work Check & Closing PIN*\n\nHi ${name},\nYour technician is at the site. Once cameras work to your satisfaction, share this Completion PIN: *${pin}*\n\nThank you for choosing TEAM CCTV! 🛡️`,
    deliveryDispatched: ({ name, amount, paymentUrl, allowCash }) =>
      `📦 Hi ${name}, your CCTV kit has left our hub!\nPay ₹${amount} online to unlock your Delivery OTP:\n${paymentUrl}` +
      (allowCash ? `\n\nOr you can pay cash to the delivery person.` : ``),
    deliveryConfirmedStartOtp: ({ otp }) =>
      `✅ Material handover confirmed! Your technician will reach out soon.\n\nShare this Start OTP when installation begins: *${otp}*`,
    installerSignoffRequest: ({ balance, balanceNum, paymentLink, otp }) =>
      balanceNum > 0
        ? `🎉 Installation work is complete!\nPay balance *₹${balance}* online here: ${paymentLink}\n(Or pay cash to technician)\n\nAfter payment, share your Final OTP: *${otp}* to close the job.`
        : `🎉 Installation work is complete!\nShare your Final OTP *${otp}* with the technician to close the job.`,
    installerCompletedPayFinal: ({ amount, paymentUrl }) =>
      `🎉 Installation Complete! Pay final ₹${amount} here to get your Warranty Certificate:\n${paymentUrl}`,
    installerCompletedWarrantySoon: () =>
      `🎉 Installation Complete! Your CCTV system is ready. Your Warranty Certificate will arrive on WhatsApp shortly. 🛡️`,
    paymentReminderLink: ({ name, stageName, amount, paymentUrl }) =>
      `Hello ${name},\n\nPayment due for *${stageName}*\nAmount: *₹${amount}*\n\nPay safely here:\n${paymentUrl}\n\n- TEAM CCTV`,
    stageBooking: "Booking Token (₹500)",
    stageDelivery90: "Delivery Payment (90%)",
    stageFinal10: "Final Payment (10%)",
    bookingPaidConfirmed: ({ quoteId, jobId, trackingUrl }) =>
      `🎉 Booking Confirmed!\n\nQuote ID: ${quoteId}\nJob ID: ${jobId}\n\nTrack live progress here:\n${trackingUrl}\n\n- TEAM CCTV`,
    deliveryPaidOtp: ({ amount, otp }) =>
      `✅ ₹${amount} received!\n\nYour Delivery OTP: *${otp}*\n\nShare this OTP only after checking all boxes & cameras. 🛡️`,
    finalPaidCompleted: ({ amount }) =>
      `🎉 Final payment ₹${amount} received!\n\nYour CCTV setup is complete. Warranty Certificate will follow shortly. 🛡️`,
    refundProcessed: ({ amount, quoteId }) =>
      `Hi, your ₹${amount} refund (Quote ID: ${quoteId}) is processed. It may take 5–7 bank days to credit.`,
    referEarnWelcome: ({ name, code, portalUrl }) =>
      `🎉 Welcome ${name} to TEAM CCTV Refer & Earn!\n\nYour Referral Code: *${code}*\n\nShare with friends — they get ₹500 off and you earn ₹500 cash per setup!\nLogin: ${portalUrl}`,
    partnerWelcome: ({ name, code, portalUrl }) =>
      `🎉 Welcome ${name} to TEAM CCTV Partner Network!\n\nYour Partner Code: *${code}*\n\nOpen your dashboard here:\n${portalUrl}`,
  },

  hi: {
    quoteReady: ({ name, link }) =>
      `👋 नमस्ते ${name} जी,\n\nआपका CCTV रेट लिस्ट (Quote) तैयार है! 🎥🛡️\n\nब्रांड देखें और अपना पैकेज चुनें:\n${link}\n\n- TEAM CCTV`,
    installerAssigned: ({ name, installerName, trackingUrl }) =>
      `✅ *टेक्नीशियन तय हो गया!*\n\nनमस्ते ${name} जी,\nआपके CCTV टेक्नीशियन *${installerName}* जल्दी ही साइट पर पहुंचेंगे।\n\n*लाइव स्टेटस व काम पूरा होने का PIN यहां देखें:*\n${trackingUrl}\n\nकाम पूरा चेक करने के बाद ही PIN बताएं।`,
    completionPinReminder: ({ name, pin }) =>
      `🔔 *काम पूरा होने का PIN*\n\nनमस्ते ${name} जी,\nटेक्नीशियन साइट पर हैं। सभी कैमरे सही चलने के बाद यह PIN बताएं: *${pin}*\n\n- TEAM CCTV 🛡️`,
    deliveryDispatched: ({ name, amount, paymentUrl, allowCash }) =>
      `📦 नमस्ते ${name} जी, आपका CCTV सामान निकल चुका है!\nसामान लेने के लिए *₹${amount}* पेमेंट करके Delivery OTP पाएं:\n${paymentUrl}` +
      (allowCash ? `\n\nया आप डिलीवरी वाले भैया को कैश भी दे सकते हैं।` : ``),
    deliveryConfirmedStartOtp: ({ otp }) =>
      `✅ सामान मिल गया! हमारे टेक्नीशियन जल्दी आपसे संपर्क करेंगे।\n\nफिटिंग शुरू करने के लिए यह Start OTP बताएं: *${otp}*`,
    installerSignoffRequest: ({ balance, balanceNum, paymentLink, otp }) =>
      balanceNum > 0
        ? `🎉 CCTV फिटिंग पूरी हो गई है!\nबाकी *₹${balance}* यहां ऑनलाइन जमा करें: ${paymentLink}\n(या टेक्नीशियन को कैश दें)\n\nपेमेंट के बाद काम बंद करने के लिए Final OTP बताएं: *${otp}*`
        : `🎉 CCTV फिटिंग पूरी हो गई है!\nकाम पूरा करने के लिए टेक्नीशियन को Final OTP बताएं: *${otp}*`,
    installerCompletedPayFinal: ({ amount, paymentUrl }) =>
      `🎉 फिटिंग पूरी हुई! अपना वारंटी कार्ड (Warranty Certificate) पाने के लिए बाकी ₹${amount} जमा करें:\n${paymentUrl}`,
    installerCompletedWarrantySoon: () =>
      `🎉 फिटिंग पूरी हुई! आपका CCTV चालू है। वारंटी कार्ड (Warranty) अभी थोड़ी देर में WhatsApp पर आ जाएगा। 🛡️`,
    paymentReminderLink: ({ name, stageName, amount, paymentUrl }) =>
      `नमस्ते ${name} जी,\n\n*${stageName}* का पेमेंट बाकी है।\nराशि: *₹${amount}*\n\nसुरक्षित लिंक से पेमेंट करें:\n${paymentUrl}\n\n- TEAM CCTV`,
    stageBooking: "बुकिंग टोकन (₹500)",
    stageDelivery90: "डिलीवरी पेमेंट (90%)",
    stageFinal10: "आखिरी पेमेंट (10%)",
    bookingPaidConfirmed: ({ quoteId, jobId, trackingUrl }) =>
      `🎉 पेमेंट मिल गया — बुकिंग पक्की!\n\nQuote ID: ${quoteId}\nJob ID: ${jobId}\n\nकाम का स्टेटस यहां देखें:\n${trackingUrl}\n\n- TEAM CCTV`,
    deliveryPaidOtp: ({ amount, otp }) =>
      `✅ ₹${amount} पेमेंट मिल गया!\n\nआपका Delivery OTP: *${otp}*\n\nसारे कैमरे और बॉक्स चेक करने के बाद ही यह OTP बताएं। 🛡️`,
    finalPaidCompleted: ({ amount }) =>
      `🎉 आखिरी पेमेंट ₹${amount} मिल गया!\n\nआपकी CCTV फिटिंग पूरी हुई। वारंटी सर्टिफिकेट अभी WhatsApp पर भेजा जा रहा है। 🛡️`,
    refundProcessed: ({ amount, quoteId }) =>
      `नमस्ते, Quote ID ${quoteId} का ₹${amount} रिफंड भेज दिया गया है। 5–7 बैंकिंग दिनों में खाते में आ जाएगा।`,
    referEarnWelcome: ({ name, code, portalUrl }) =>
      `🎉 TEAM CCTV रेफर एंड अर्न में स्वागत है, ${name} जी!\n\nआपका कोड: *${code}*\n\nदोस्तों को शेयर करें — उन्हें ₹500 की छूट और आपको हर फिटिंग पर ₹500 कैश मिलेगा!\nडैशबोर्ड: ${portalUrl}`,
    partnerWelcome: ({ name, code, portalUrl }) =>
      `🎉 TEAM CCTV पार्टनर नेटवर्क में स्वागत है, ${name} जी!\n\nआपका पार्टनर कोड: *${code}*\n\nपार्टनर पोर्टल खोलें:\n${portalUrl}`,
  },

  mr: {
    quoteReady: ({ name, link }) =>
      `👋 नमस्कार ${name},\n\nतुमचा CCTV दरपत्रक (Quote) तयार आहे! 🎥🛡️\n\nब्रँड तपासा आणि पॅकेज निवडा:\n${link}\n\n- TEAM CCTV`,
    installerAssigned: ({ name, installerName, trackingUrl }) =>
      `✅ *टेक्निशियन ठरला आहे!*\n\nनमस्कार ${name},\nतुमचे CCTV टेक्निशियन *${installerName}* लवकरच येतील.\n\n*स्टेटस व कामाचा PIN येथे पहा:*\n${trackingUrl}\n\nकाम पूर्ण तपासल्यावरच PIN सांगा.`,
    completionPinReminder: ({ name, pin }) =>
      `🔔 *काम पूर्ण झाल्याचा PIN*\n\nनमस्कार ${name},\nटेक्निशियन साईटवर आहेत. सर्व कॅमेरे तपासून झाल्यावर हा PIN द्या: *${pin}*\n\n- TEAM CCTV 🛡️`,
    deliveryDispatched: ({ name, amount, paymentUrl, allowCash }) =>
      `📦 नमस्कार ${name}, तुमचे CCTV साहित्य निघाले आहे!\n*₹${amount}* भरून Delivery OTP मिळवा:\n${paymentUrl}` +
      (allowCash ? `\n\nकिंवा तुम्ही डिलिव्हरी व्यक्तीकडे रोख देऊ शकता.` : ``),
    deliveryConfirmedStartOtp: ({ otp }) =>
      `✅ साहित्य मिळाले! आमचे टेक्निशियन लवकरच संपर्क करतील.\n\nकाम सुरू करताना हा Start OTP द्या: *${otp}*`,
    installerSignoffRequest: ({ balance, balanceNum, paymentLink, otp }) =>
      balanceNum > 0
        ? `🎉 CCTV फिटिंग पूर्ण झाले!\nउर्वरित *₹${balance}* ऑनलाइन भरा: ${paymentLink}\n(किंवा टेक्निशियनकडे रोख द्या)\n\nपेमेंटनंतर Final OTP द्या: *${otp}*`
        : `🎉 CCTV फिटिंग पूर्ण झाले!\nकाम बंद करण्यासाठी टेक्निशियनला Final OTP सांगा: *${otp}*`,
    installerCompletedPayFinal: ({ amount, paymentUrl }) =>
      `🎉 फिटिंग पूर्ण! वॉरंटी कार्ड मिळवण्यासाठी ₹${amount} भरा:\n${paymentUrl}`,
    installerCompletedWarrantySoon: () =>
      `🎉 फिटिंग पूर्ण! तुमचे वॉरंटी कार्ड थोड्याच वेळात WhatsApp वर येईल. 🛡️`,
    paymentReminderLink: ({ name, stageName, amount, paymentUrl }) =>
      `नमस्कार ${name},\n\n*${stageName}* चे पेमेंट बाकी आहे.\nरक्कम: *₹${amount}*\n\nयेथे भरा:\n${paymentUrl}\n\n- TEAM CCTV`,
    stageBooking: "बुकिंग टोकन (₹500)",
    stageDelivery90: "डिलिव्हरी पेमेंट (90%)",
    stageFinal10: "अंतिम पेमेंट (10%)",
    bookingPaidConfirmed: ({ quoteId, jobId, trackingUrl }) =>
      `🎉 बुकिंग पक्के झाले!\n\nQuote ID: ${quoteId}\nJob ID: ${jobId}\n\nयेथे ट्रॅक करा:\n${trackingUrl}\n\n- TEAM CCTV`,
    deliveryPaidOtp: ({ amount, otp }) =>
      `✅ ₹${amount} मिळाले!\n\nतुमचा Delivery OTP: *${otp}*\n\nसाहित्य तपासूनच OTP सांगा. 🛡️`,
    finalPaidCompleted: ({ amount }) =>
      `🎉 अंतिम ₹${amount} मिळाले! तुमचे वॉरंटी प्रमाणपत्र लवकरच येईल. 🛡️`,
    refundProcessed: ({ amount, quoteId }) =>
      `नमस्कार, Quote ID ${quoteId} साठी ₹${amount} रिफंड पाठवला आहे (5–7 बँक दिवस).`,
    referEarnWelcome: ({ name, code, portalUrl }) =>
      `🎉 स्वागत आहे ${name}! तुमचा रेफरल कोड: *${code}*\nमित्रांना ₹500 सूट व तुम्हाला ₹500 रोख!\nलॉगिन: ${portalUrl}`,
    partnerWelcome: ({ name, code, portalUrl }) =>
      `🎉 TEAM CCTV मध्ये स्वागत आहे, ${name}!\nतुमचा कोड: *${code}*\nपोर्टल: ${portalUrl}`,
  },

  gu: {
    quoteReady: ({ name, link }) =>
      `👋 નમસ્તે ${name},\n\nતમારું CCTV ક્વોટેશન (ભાવપત્રક) તૈયાર છે! 🎥🛡️\n\nઅહીં જુઓ અને પસંદ કરો:\n${link}\n\n- TEAM CCTV`,
    installerAssigned: ({ name, installerName, trackingUrl }) =>
      `✅ *ટેકનિશિયન નક્કી થઈ ગયા!*\n\nનમસ્તે ${name},\n*${installerName}* ટૂંક સમયમાં આવશે.\n\n*લાઇવ સ્ટેટસ અને PIN અહીં જુઓ:*\n${trackingUrl}\n\nકામ ચેક કર્યા પછી જ PIN આપશો.`,
    completionPinReminder: ({ name, pin }) =>
      `🔔 *કામ પૂરું થયાનો PIN*\n\nનમસ્તે ${name},\nબધા કેમેરા ચેક કર્યા પછી આ PIN આપો: *${pin}*\n\n- TEAM CCTV 🛡️`,
    deliveryDispatched: ({ name, amount, paymentUrl, allowCash }) =>
      `📦 નમસ્તે ${name}, તમારો CCTV સામાન નીકળી ગયો છે!\n*₹${amount}* ભરીને Delivery OTP મેળવો:\n${paymentUrl}` +
      (allowCash ? `\n\nઅથવા તમે ડિલિવરી ભાઈને રોકડા પણ આપી શકો છો.` : ``),
    deliveryConfirmedStartOtp: ({ otp }) =>
      `✅ સામાન મળી ગયો! કામ શરૂ થાય ત્યારે આ Start OTP આપો: *${otp}*`,
    installerSignoffRequest: ({ balance, balanceNum, paymentLink, otp }) =>
      balanceNum > 0
        ? `🎉 ફિટિંગ પૂરું થયું!\nબાકી *₹${balance}* ઓનલાઇન ભરો: ${paymentLink}\n\nપછી Final OTP આપો: *${otp}*`
        : `🎉 ફિટિંગ પૂરું થયું! કામ બંધ કરવા આ Final OTP આપો: *${otp}*`,
    installerCompletedPayFinal: ({ amount, paymentUrl }) =>
      `🎉 કામ પૂરું થયું! વોરંટી કાર્ડ માટે ₹${amount} ભરો:\n${paymentUrl}`,
    installerCompletedWarrantySoon: () =>
      `🎉 કામ પૂરું થયું! તમારું વોરંટી કાર્ડ હમણાં જ WhatsApp પર આવશે. 🛡️`,
    paymentReminderLink: ({ name, stageName, amount, paymentUrl }) =>
      `નમસ્તે ${name},\n\n*${stageName}* નું પેમેન્ટ બાકી છે: *₹${amount}*\nઅહીં ભરો:\n${paymentUrl}\n\n- TEAM CCTV`,
    stageBooking: "બુકિંગ ટોકન (₹500)",
    stageDelivery90: "ડિલિવરી પેમેન્ટ (90%)",
    stageFinal10: "છેલ્લું પેમેન્ટ (10%)",
    bookingPaidConfirmed: ({ quoteId, jobId, trackingUrl }) =>
      `🎉 બુકિંગ પાક્કું થયું!\nQuote ID: ${quoteId} | Job: ${jobId}\nટ્રેક કરો: ${trackingUrl}`,
    deliveryPaidOtp: ({ amount, otp }) =>
      `✅ ₹${amount} મળી ગયા!\nતમારો Delivery OTP: *${otp}*\nસામાન ચેક કરીને જ OTP આપો. 🛡️`,
    finalPaidCompleted: ({ amount }) =>
      `🎉 છેલ્લું પેમેન્ટ ₹${amount} મળી ગયું! વોરંટી કાર્ડ હમણાં મોકલાશે. 🛡️`,
    refundProcessed: ({ amount, quoteId }) =>
      `નમસ્તે, Quote ID ${quoteId} નો ₹${amount} રિફંડ મોકલી દેવાયો છે (5–7 બેંક દિવસ).`,
    referEarnWelcome: ({ name, code, portalUrl }) =>
      `🎉 સ્વાગત છે ${name}! તમારો કોડ: *${code}*\nમિત્રોને ₹500 ડિસ્કાઉન્ટ અને તમને ₹500 કેશ! ${portalUrl}`,
    partnerWelcome: ({ name, code, portalUrl }) =>
      `🎉 TEAM CCTV પાર્ટનર સ્વાગત, ${name}! કોડ: *${code}*\n${portalUrl}`,
  },

  ta: {
    quoteReady: ({ name, link }) =>
      `👋 வணக்கம் ${name},\n\nஉங்கள் CCTV விலை விவரம் (Quote) தயாராக உள்ளது! 🎥🛡️\n\nபிராண்டுகளைப் பார்த்து தேர்வு செய்யவும்:\n${link}\n\n- TEAM CCTV`,
    installerAssigned: ({ name, installerName, trackingUrl }) =>
      `✅ *டெக்னீஷியன் நியமிக்கப்பட்டார்!*\n\nவணக்கம் ${name},\n*${installerName}* விரைவில் உங்கள் இடத்திற்கு வருவார்.\n\n*நிலை & PIN பார்க்க:*\n${trackingUrl}\n\nவேலை முடிந்த பிறகே PIN சொல்லவும்.`,
    completionPinReminder: ({ name, pin }) =>
      `🔔 *வேலை முடிந்த PIN*\n\nவணக்கம் ${name},\nகேமராக்கள் சரியாக இயங்கியதும் இந்த PIN-ஐக் கொடுக்கவும்: *${pin}* 🛡️`,
    deliveryDispatched: ({ name, amount, paymentUrl, allowCash }) =>
      `📦 வணக்கம் ${name}, உங்கள் CCTV பொருள்கள் புறப்பட்டுவிட்டன!\nDelivery OTP பெற *₹${amount}* செலுத்தவும்:\n${paymentUrl}` +
      (allowCash ? `\n\nஅல்லது டெலிவரியின் போது ரொக்கமாகக் கொடுக்கலாம்.` : ``),
    deliveryConfirmedStartOtp: ({ otp }) =>
      `✅ பொருள்கள் கிடைத்துவிட்டன! வேலை தொடங்கும் போது இந்த Start OTP-ஐ சொல்லவும்: *${otp}*`,
    installerSignoffRequest: ({ balance, balanceNum, paymentLink, otp }) =>
      balanceNum > 0
        ? `🎉 ஃபிட்டிங் முடிந்தது!\nமீதி *₹${balance}* செலுத்தவும்: ${paymentLink}\n\nபிறகு Final OTP சொல்லவும்: *${otp}*`
        : `🎉 ஃபிட்டிங் முடிந்தது! வேலையை முடிக்க Final OTP சொல்லவும்: *${otp}*`,
    installerCompletedPayFinal: ({ amount, paymentUrl }) =>
      `🎉 வேலை முடிந்தது! வாரண்டி சான்றிதழ் பெற ₹${amount} செலுத்தவும்:\n${paymentUrl}`,
    installerCompletedWarrantySoon: () =>
      `🎉 வேலை முடிந்தது! உங்கள் வாரண்டி சான்றிதழ் விரைவில் WhatsApp-ல் வரும். 🛡️`,
    paymentReminderLink: ({ name, stageName, amount, paymentUrl }) =>
      `வணக்கம் ${name},\n\n*${stageName}* தொகை: *₹${amount}*\nஇங்கே செலுத்தவும்:\n${paymentUrl}\n\n- TEAM CCTV`,
    stageBooking: "முன்பதிவு (₹500)",
    stageDelivery90: "டெலிவரி தொகை (90%)",
    stageFinal10: "இறுதி தொகை (10%)",
    bookingPaidConfirmed: ({ quoteId, jobId, trackingUrl }) =>
      `🎉 புக்கிங் உறுதி! Quote: ${quoteId} | Job: ${jobId}\nபார்க்க: ${trackingUrl}`,
    deliveryPaidOtp: ({ amount, otp }) =>
      `✅ ₹${amount} பெறப்பட்டது!\nஉங்கள் Delivery OTP: *${otp}*\nபொருள்களைச் சரிபார்த்த பின் OTP சொல்லவும். 🛡️`,
    finalPaidCompleted: ({ amount }) =>
      `🎉 இறுதி தொகை ₹${amount} பெறப்பட்டது! வாரண்டி விரைவில் வரும். 🛡️`,
    refundProcessed: ({ amount, quoteId }) =>
      `வணக்கம், Quote ${quoteId}-க்கான ₹${amount} ரீஃபண்ட் அனுப்பப்பட்டது (5–7 வங்கி நாட்கள்).`,
    referEarnWelcome: ({ name, code, portalUrl }) =>
      `🎉 வணக்கம் ${name}! உங்கள் ரெஃபரல் கோட்: *${code}*\nநண்பர்களுக்கு ₹500 தள்ளுபடி, உங்களுக்கு ₹500 கேஷ்! ${portalUrl}`,
    partnerWelcome: ({ name, code, portalUrl }) =>
      `🎉 TEAM CCTV பார்ட்னர் வரவேற்பு ${name}! கோட்: *${code}*\n${portalUrl}`,
  },

  te: {
    quoteReady: ({ name, link }) =>
      `👋 నమస్కారం ${name},\n\nమీ CCTV ధర వివరాలు (Quote) సిద్ధంగా ఉన్నాయి! 🎥🛡️\n\nఇక్కడ చూడండి:\n${link}\n\n- TEAM CCTV`,
    installerAssigned: ({ name, installerName, trackingUrl }) =>
      `✅ *టెక్నీషియన్ ఖరారయ్యారు!*\n\nనమస్కారం ${name},\n*${installerName}* త్వరలో వస్తారు.\n\n*స్టేటస్ & PIN ఇక్కడ చూడండి:*\n${trackingUrl}`,
    completionPinReminder: ({ name, pin }) =>
      `🔔 *పని పూర్తయిన PIN*\n\nనమస్కారం ${name},\nకెమెరాలు చూసిన తర్వాతే ఈ PIN చెప్పండి: *${pin}* 🛡️`,
    deliveryDispatched: ({ name, amount, paymentUrl, allowCash }) =>
      `📦 నమస్కారం ${name}, మీ CCTV సామాగ్రి బయలుదేరింది!\nDelivery OTP కోసం ₹${amount} చెల్లించండి:\n${paymentUrl}` +
      (allowCash ? `\n\nలేదా డెలివరీ సమయానికి నగదు ఇవ్వచ్చు.` : ``),
    deliveryConfirmedStartOtp: ({ otp }) =>
      `✅ డెలివరీ పూర్తయింది! ఫిట్టింగ్ మొదలుపెట్టడానికి Start OTP చెప్పండి: *${otp}*`,
    installerSignoffRequest: ({ balance, balanceNum, paymentLink, otp }) =>
      balanceNum > 0
        ? `🎉 ఫిట్టింగ్ పూర్తయింది!\nమిగిలిన *₹${balance}* చెల్లించండి: ${paymentLink}\n\nతర్వాత Final OTP చెప్పండి: *${otp}*`
        : `🎉 ఫిట్టింగ్ పూర్తయింది! Final OTP చెప్పండి: *${otp}*`,
    installerCompletedPayFinal: ({ amount, paymentUrl }) =>
      `🎉 ఫిట్టింగ్ పూర్తయింది! వారంటీ కోసం ₹${amount} చెల్లించండి:\n${paymentUrl}`,
    installerCompletedWarrantySoon: () =>
      `🎉 పని పూర్తయింది! మీ వారంటీ కార్డు త్వరలో WhatsApp కు వస్తుంది. 🛡️`,
    paymentReminderLink: ({ name, stageName, amount, paymentUrl }) =>
      `నమస్కారం ${name},\n\n*${stageName}* మొత్తం: *₹${amount}*\nఇక్కడ చెల్లించండి:\n${paymentUrl}`,
    stageBooking: "బుకింగ్ టోకెన్ (₹500)",
    stageDelivery90: "డెలివరీ పేమెంట్ (90%)",
    stageFinal10: "చివరి పేమెంట్ (10%)",
    bookingPaidConfirmed: ({ quoteId, jobId, trackingUrl }) =>
      `🎉 బుకింగ్ కన్ఫర్మ్ అయింది!\nQuote: ${quoteId} | Job: ${jobId}\nట్రాక్ చేయండి: ${trackingUrl}`,
    deliveryPaidOtp: ({ amount, otp }) =>
      `✅ ₹${amount} అందింది!\nమీ Delivery OTP: *${otp}* (బాక్సులు చెక్ చేశాక చెప్పండి). 🛡️`,
    finalPaidCompleted: ({ amount }) =>
      `🎉 చివరి ₹${amount} అందింది! వారంటీ కార్డు త్వరలో వస్తుంది. 🛡️`,
    refundProcessed: ({ amount, quoteId }) =>
      `నమస్కారం, Quote ${quoteId} కు ₹${amount} రీఫండ్ పూర్తయింది (5–7 బ్యాంకు రోజులు).`,
    referEarnWelcome: ({ name, code, portalUrl }) =>
      `🎉 స్వాగతం ${name}! మీ కోడ్: *${code}*\nమిత్రులకు ₹500 తగ్గింపు, మీకు ₹500 క్యాష్! ${portalUrl}`,
    partnerWelcome: ({ name, code, portalUrl }) =>
      `🎉 TEAM CCTV పార్ట్‌నర్ స్వాగతం ${name}! కోడ్: *${code}*\n${portalUrl}`,
  },

  kn: {
    quoteReady: ({ name, link }) =>
      `👋 ನಮಸ್ಕಾರ ${name},\n\nನಿಮ್ಮ CCTV ದರ ಪಟ್ಟಿ (Quote) ಸಿದ್ಧವಾಗಿದೆ! 🎥🛡️\n\nಇಲ್ಲಿ ನೋಡಿ:\n${link}\n\n- TEAM CCTV`,
    installerAssigned: ({ name, installerName, trackingUrl }) =>
      `✅ *ಟೆಕ್ನಿಷಿಯನ್ ನಿಗದಿಯಾಗಿದ್ದಾರೆ!*\n\nನಮಸ್ಕಾರ ${name},\n*${installerName}* ಶೀಘ್ರದಲ್ಲೇ ಬರುತ್ತಾರೆ.\n\n*ಸ್ಥಿತಿ ಮತ್ತು PIN ನೋಡಿ:*\n${trackingUrl}`,
    completionPinReminder: ({ name, pin }) =>
      `🔔 *ಕೆಲಸ ಮುಗಿದ PIN*\n\nನಮಸ್ಕಾರ ${name},\nಕ್ಯಾಮೆರಾ ಪರಿಶೀಲಿಸಿದ ನಂತರ ಈ PIN ಕೊಡಿ: *${pin}* 🛡️`,
    deliveryDispatched: ({ name, amount, paymentUrl, allowCash }) =>
      `📦 ನಮಸ್ಕಾರ ${name}, ನಿಮ್ಮ CCTV ಸಾಮಗ್ರಿ ಹೊರಟಿದೆ!\nOTP ಪಡೆಯಲು ₹${amount} ಪಾವತಿಸಿ:\n${paymentUrl}` +
      (allowCash ? `\n\nಅಥವಾ ಡೆಲಿವರಿ ಸಮಯದಲ್ಲಿ ನಗದು ನೀಡಬಹುದು.` : ``),
    deliveryConfirmedStartOtp: ({ otp }) =>
      `✅ ಡೆಲಿವರಿ ದೃಢಪಟ್ಟಿದೆ! ಕೆಲಸ ಪ್ರಾರಂಭಿಸಲು Start OTP ಕೊಡಿ: *${otp}*`,
    installerSignoffRequest: ({ balance, balanceNum, paymentLink, otp }) =>
      balanceNum > 0
        ? `🎉 ಫಿಟ್ಟಿಂಗ್ ಮುಗಿದಿದೆ!\nಬಾಕಿ *₹${balance}* ಪಾವತಿಸಿ: ${paymentLink}\n\nನಂತರ Final OTP ಕೊಡಿ: *${otp}*`
        : `🎉 ಫಿಟ್ಟಿಂಗ್ ಮುಗಿದಿದೆ! Final OTP ಕೊಡಿ: *${otp}*`,
    installerCompletedPayFinal: ({ amount, paymentUrl }) =>
      `🎉 ಕೆಲಸ ಮುಗಿದಿದೆ! ವಾರಂಟಿಗಾಗಿ ₹${amount} ಪಾವತಿಸಿ:\n${paymentUrl}`,
    installerCompletedWarrantySoon: () =>
      `🎉 ಕೆಲಸ ಮುಗಿದಿದೆ! ನಿಮ್ಮ ವಾರಂಟಿ ಶೀಘ್ರದಲ್ಲೇ WhatsApp ಗೆ ಬರುತ್ತದೆ. 🛡️`,
    paymentReminderLink: ({ name, stageName, amount, paymentUrl }) =>
      `ನಮಸ್ಕಾರ ${name},\n\n*${stageName}* ಬಾಕಿ: *₹${amount}*\nಇಲ್ಲಿ ಪಾವತಿಸಿ:\n${paymentUrl}`,
    stageBooking: "ಬುಕಿಂಗ್ ಟೋಕನ್ (₹500)",
    stageDelivery90: "ಡೆಲಿವರಿ ಪಾವತಿ (90%)",
    stageFinal10: "ಅಂತಿಮ ಪಾವತಿ (10%)",
    bookingPaidConfirmed: ({ quoteId, jobId, trackingUrl }) =>
      `🎉 ಬುಕಿಂಗ್ ಖಚಿತವಾಗಿದೆ! Quote: ${quoteId} | Job: ${jobId}\nಟ್ರ್ಯಾಕ್: ${trackingUrl}`,
    deliveryPaidOtp: ({ amount, otp }) =>
      `✅ ₹${amount} ಪಾವತಿಯಾಗಿದೆ!\nDelivery OTP: *${otp}* (ಸಾಮಗ್ರಿ ಪರಿಶೀಲಿಸಿದ ನಂತರ ಕೊಡಿ). 🛡️`,
    finalPaidCompleted: ({ amount }) =>
      `🎉 ಅಂತಿಮ ₹${amount} ಪಾವತಿಯಾಗಿದೆ! ವಾರಂಟಿ ಶೀಘ್ರದಲ್ಲೇ ಬರುತ್ತದೆ. 🛡️`,
    refundProcessed: ({ amount, quoteId }) =>
      `ನಮಸ್ಕಾರ, Quote ${quoteId} ಗೆ ₹${amount} ರೀಫಂಡ್ ಕಳುಹಿಸಲಾಗಿದೆ (5–7 ಬ್ಯಾಂಕ್ ದಿನಗಳು).`,
    referEarnWelcome: ({ name, code, portalUrl }) =>
      `🎉 ಸ್ವಾಗತ ${name}! ನಿಮ್ಮ ಕೋಡ್: *${code}*\nಸ್ನೇಹಿತರಿಗೆ ₹500 ರಿಯಾಯಿತಿ, ನಿಮಗೆ ₹500 ಕ್ಯಾಶ್! ${portalUrl}`,
    partnerWelcome: ({ name, code, portalUrl }) =>
      `🎉 TEAM CCTV ಪಾರ್ಟ್ನರ್ ಸ್ವಾಗತ ${name}! ಕೋಡ್: *${code}*\n${portalUrl}`,
  },

  bn: {
    quoteReady: ({ name, link }) =>
      `👋 নমস্কার ${name},\n\nআপনার CCTV রেট লিস্ট (Quote) তৈরি! 🎥🛡️\n\nব্র্যান্ড ও দাম এখানে দেখুন:\n${link}\n\n- TEAM CCTV`,
    installerAssigned: ({ name, installerName, trackingUrl }) =>
      `✅ *টেকনিশিয়ান ঠিক হয়েছে!*\n\nনমস্কার ${name},\n*${installerName}* শীঘ্রই আসছেন।\n\n*স্ট্যাটাস ও PIN এখানে দেখুন:*\n${trackingUrl}\n\nকাজ পুরো দেখে তবেই PIN দিন।`,
    completionPinReminder: ({ name, pin }) =>
      `🔔 *কাজ শেষের PIN*\n\nনমস্কার ${name},\nসব ক্যামেরা চেক করার পর এই PIN দিন: *${pin}* 🛡️`,
    deliveryDispatched: ({ name, amount, paymentUrl, allowCash }) =>
      `📦 নমস্কার ${name}, আপনার CCTV জিনিসপত্র বেরিয়ে গেছে!\n*₹${amount}* পেমেন্ট করে Delivery OTP নিন:\n${paymentUrl}` +
      (allowCash ? `\n\nঅথবা ডেলিভারির সময় নগদেও দিতে পারেন।` : ``),
    deliveryConfirmedStartOtp: ({ otp }) =>
      `✅ ডেলিভারি হয়ে গেছে! ফিটিং শুরু করতে এই Start OTP দিন: *${otp}*`,
    installerSignoffRequest: ({ balance, balanceNum, paymentLink, otp }) =>
      balanceNum > 0
        ? `🎉 ফিটিং শেষ হয়েছে!\nবাকি *₹${balance}* অনলাইনে দিন: ${paymentLink}\n\nতারপর Final OTP দিন: *${otp}*`
        : `🎉 ফিটিং শেষ হয়েছে! কাজ শেষ করতে Final OTP দিন: *${otp}*`,
    installerCompletedPayFinal: ({ amount, paymentUrl }) =>
      `🎉 ফিটিং শেষ! ওয়ারেন্টি কার্ড পেতে বাকি ₹${amount} দিন:\n${paymentUrl}`,
    installerCompletedWarrantySoon: () =>
      `🎉 ফিটিং শেষ! আপনার ওয়ারেন্টি কার্ড একটু পরেই WhatsApp-এ চলে আসবে। 🛡️`,
    paymentReminderLink: ({ name, stageName, amount, paymentUrl }) =>
      `নমস্কার ${name},\n\n*${stageName}* বাকি আছে: *₹${amount}*\nএখানে পেমেন্ট করুন:\n${paymentUrl}\n\n- TEAM CCTV`,
    stageBooking: "বুকিং টোকেন (₹500)",
    stageDelivery90: "ডেলিভারি পেমেন্ট (90%)",
    stageFinal10: "শেষ পেমেন্ট (10%)",
    bookingPaidConfirmed: ({ quoteId, jobId, trackingUrl }) =>
      `🎉 বুকিং কনফার্ম!\nQuote: ${quoteId} | Job: ${jobId}\nট্র্যাক করুন: ${trackingUrl}`,
    deliveryPaidOtp: ({ amount, otp }) =>
      `✅ ₹${amount} পাওয়া গেছে!\nDelivery OTP: *${otp}* (বক্স দেখে তবেই OTP দেবেন). 🛡️`,
    finalPaidCompleted: ({ amount }) =>
      `🎉 শেষ ₹${amount} পাওয়া গেছে! ওয়ারেন্টি সার্টিফিকেট শীঘ্রই আসছে। 🛡️`,
    refundProcessed: ({ amount, quoteId }) =>
      `নমস্কার, Quote ${quoteId}-এর ₹${amount} রিফান্ড পাঠানো হয়েছে (5–7 ব্যাংক দিন)।`,
    referEarnWelcome: ({ name, code, portalUrl }) =>
      `🎉 স্বাগতম ${name}! আপনার কোড: *${code}*\nবন্ধুদের ₹500 ছাড় ও আপনার ₹500 ক্যাশ! ${portalUrl}`,
    partnerWelcome: ({ name, code, portalUrl }) =>
      `🎉 TEAM CCTV পার্টনার স্বাগতম ${name}! কোড: *${code}*\n${portalUrl}`,
  },

  ml: {
    quoteReady: ({ name, link }) =>
      `👋 നമസ്കാരം ${name},\n\nനിങ്ങളുടെ CCTV വില വിവരങ്ങൾ (Quote) തയ്യാറാണ്! 🎥🛡️\n\nഇവിടെ നോക്കൂ:\n${link}\n\n- TEAM CCTV`,
    installerAssigned: ({ name, installerName, trackingUrl }) =>
      `✅ *ടെക്നീഷ്യനെ നിയോഗിച്ചു!*\n\nനമസ്കാരം ${name},\n*${installerName}* ഉടൻ എത്തും.\n\n*സ്റ്റാറ്റസും PIN-ഉം ഇവിടെ കാണാം:*\n${trackingUrl}`,
    completionPinReminder: ({ name, pin }) =>
      `🔔 *ജോലി പൂർത്തിയായ PIN*\n\nനമസ്കാരം ${name},\nക്യാമറകൾ പരിശോധിച്ച ശേഷം മാത്രം ഈ PIN നൽകുക: *${pin}* 🛡️`,
    deliveryDispatched: ({ name, amount, paymentUrl, allowCash }) =>
      `📦 നമസ്കാരം ${name}, നിങ്ങളുടെ CCTV സാധനങ്ങൾ പുറപ്പെട്ടു!\nDelivery OTP ലഭിക്കാൻ ₹${amount} അടയ്ക്കുക:\n${paymentUrl}` +
      (allowCash ? `\n\nഅല്ലെങ്കിൽ ഡെലിവറി സമയത്ത് പണമായി നൽകാം.` : ``),
    deliveryConfirmedStartOtp: ({ otp }) =>
      `✅ ഡെലിവറി പൂർത്തിയായി! പണി തുടങ്ങാൻ Start OTP നൽകുക: *${otp}*`,
    installerSignoffRequest: ({ balance, balanceNum, paymentLink, otp }) =>
      balanceNum > 0
        ? `🎉 ഫിറ്റിംഗ് പൂർത്തിയായി!\nബാക്കി *₹${balance}* അടയ്ക്കുക: ${paymentLink}\n\nശേഷം Final OTP നൽകുക: *${otp}*`
        : `🎉 ഫിറ്റിംഗ് പൂർത്തിയായി! Final OTP നൽകുക: *${otp}*`,
    installerCompletedPayFinal: ({ amount, paymentUrl }) =>
      `🎉 ജോലി പൂർത്തിയായി! വാറന്റി ലഭിക്കാൻ ₹${amount} അടയ്ക്കുക:\n${paymentUrl}`,
    installerCompletedWarrantySoon: () =>
      `🎉 ജോലി പൂർത്തിയായി! നിങ്ങളുടെ വാറന്റി ഉടൻ WhatsApp-ൽ എത്തും. 🛡️`,
    paymentReminderLink: ({ name, stageName, amount, paymentUrl }) =>
      `നമസ്കാരം ${name},\n\n*${stageName}* തുക: *₹${amount}*\nഇവിടെ അടയ്ക്കുക:\n${paymentUrl}`,
    stageBooking: "ബുക്കിംഗ് ടോക്കൺ (₹500)",
    stageDelivery90: "ഡെലിവറി പേയ്മെന്റ് (90%)",
    stageFinal10: "അവസാന പേയ്മെന്റ് (10%)",
    bookingPaidConfirmed: ({ quoteId, jobId, trackingUrl }) =>
      `🎉 ബുക്കിംഗ് ഉറപ്പായി! Quote: ${quoteId} | Job: ${jobId}\nട്രാക്ക് ചെയ്യുക: ${trackingUrl}`,
    deliveryPaidOtp: ({ amount, otp }) =>
      `✅ ₹${amount} ലഭിച്ചു!\nDelivery OTP: *${otp}* (സാധനങ്ങൾ നോക്കിയ ശേഷം നൽകുക). 🛡️`,
    finalPaidCompleted: ({ amount }) =>
      `🎉 അവസാന ₹${amount} ലഭിച്ചു! വാറന്റി ഉടൻ എത്തും. 🛡️`,
    refundProcessed: ({ amount, quoteId }) =>
      `നമസ്കാരം, Quote ${quoteId} റീഫണ്ട് ₹${amount} അയച്ചു (5–7 പ്രവൃത്തി ദിവസങ്ങൾ).`,
    referEarnWelcome: ({ name, code, portalUrl }) =>
      `🎉 സ്വാഗതം ${name}! കോഡ്: *${code}*\nസുഹൃത്തുക്കൾക്ക് ₹500 കിഴിവ്, നിങ്ങൾക്ക് ₹500 ക്യാഷ്! ${portalUrl}`,
    partnerWelcome: ({ name, code, portalUrl }) =>
      `🎉 TEAM CCTV പാർട്ണർ സ്വാഗതം ${name}! കോഡ്: *${code}*\n${portalUrl}`,
  },

  pa: {
    quoteReady: ({ name, link }) =>
      `👋 ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ${name} ਜੀ,\n\nਤੁਹਾਡਾ CCTV ਰੇਟ ਲਿਸਟ (Quote) ਤਿਆਰ ਹੈ! 🎥🛡️\n\nਇੱਥੇ ਦੇਖੋ:\n${link}\n\n- TEAM CCTV`,
    installerAssigned: ({ name, installerName, trackingUrl }) =>
      `✅ *ਟੈਕਨੀਸ਼ੀਅਨ ਤੈਅ ਹੋ ਗਿਆ!*\n\n${name} ਜੀ, *${installerName}* ਜਲਦੀ ਆਉਣਗੇ।\n\n*ਸਟੇਟਸ ਤੇ PIN ਇੱਥੇ ਦੇਖੋ:*\n${trackingUrl}`,
    completionPinReminder: ({ name, pin }) =>
      `🔔 *ਕੰਮ ਪੂਰਾ ਹੋਣ ਦਾ PIN*\n\n${name} ਜੀ, ਕੈਮਰੇ ਚੈੱਕ ਕਰਨ ਤੋਂ ਬਾਅਦ ਹੀ ਇਹ PIN ਦਿਓ: *${pin}* 🛡️`,
    deliveryDispatched: ({ name, amount, paymentUrl, allowCash }) =>
      `📦 ${name} ਜੀ, ਤੁਹਾਡਾ CCTV ਸਮਾਨ ਨਿਕਲ ਗਿਆ ਹੈ!\nOTP ਲਈ ₹${amount} ਭਰੋ:\n${paymentUrl}` +
      (allowCash ? `\n\nਜਾਂ ਡਿਲੀਵਰੀ ਵੇਲੇ ਕੈਸ਼ ਵੀ ਦੇ ਸਕਦੇ ਹੋ।` : ``),
    deliveryConfirmedStartOtp: ({ otp }) =>
      `✅ ਸਮਾਨ ਮਿਲ ਗਿਆ! ਕੰਮ ਸ਼ੁਰੂ ਕਰਨ ਲਈ Start OTP ਦੱਸੋ: *${otp}*`,
    installerSignoffRequest: ({ balance, balanceNum, paymentLink, otp }) =>
      balanceNum > 0
        ? `🎉 ਫਿਟਿੰਗ ਪੂਰੀ ਹੋ ਗਈ!\nਬਾਕੀ *₹${balance}* ਇੱਥੇ ਭਰੋ: ${paymentLink}\n\nਫਿਰ Final OTP ਦਿਓ: *${otp}*`
        : `🎉 ਫਿਟਿੰਗ ਪੂਰੀ ਹੋ ਗਈ! Final OTP ਦਿਓ: *${otp}*`,
    installerCompletedPayFinal: ({ amount, paymentUrl }) =>
      `🎉 ਕੰਮ ਪੂਰਾ! ਵਾਰੰਟੀ ਲਈ ₹${amount} ਭਰੋ:\n${paymentUrl}`,
    installerCompletedWarrantySoon: () =>
      `🎉 ਕੰਮ ਪੂਰਾ! ਤੁਹਾਡਾ ਵਾਰੰਟੀ ਕਾਰਡ ਹੁਣੇ WhatsApp 'ਤੇ ਆ ਜਾਵੇਗਾ। 🛡️`,
    paymentReminderLink: ({ name, stageName, amount, paymentUrl }) =>
      `${name} ਜੀ,\n\n*${stageName}* ਬਾਕੀ: *₹${amount}*\nਇੱਥੇ ਭਰੋ:\n${paymentUrl}`,
    stageBooking: "ਬੁਕਿੰਗ ਟੋਕਨ (₹500)",
    stageDelivery90: "ਡਿਲੀਵਰੀ ਪੇਮੈਂਟ (90%)",
    stageFinal10: "ਆਖਰੀ ਪੇਮੈਂਟ (10%)",
    bookingPaidConfirmed: ({ quoteId, jobId, trackingUrl }) =>
      `🎉 ਬੁਕਿੰਗ ਪੱਕੀ! Quote: ${quoteId} | Job: ${jobId}\nਟਰੈਕ ਕਰੋ: ${trackingUrl}`,
    deliveryPaidOtp: ({ amount, otp }) =>
      `✅ ₹${amount} ਮਿਲ ਗਏ! Delivery OTP: *${otp}* (ਸਮਾਨ ਦੇਖ ਕੇ ਹੀ ਦਿਓ). 🛡️`,
    finalPaidCompleted: ({ amount }) =>
      `🎉 ਆਖਰੀ ₹${amount} ਮਿਲ ਗਏ! ਵਾਰੰਟੀ ਕਾਰਡ ਜਲਦੀ ਆਵੇਗਾ। 🛡️`,
    refundProcessed: ({ amount, quoteId }) =>
      `Quote ${quoteId} ਦਾ ₹${amount} ਰਿਫੰਡ ਭੇਜ ਦਿੱਤਾ ਗਿਆ ਹੈ (5–7 ਬੈਂਕ ਦਿਨ)।`,
    referEarnWelcome: ({ name, code, portalUrl }) =>
      `🎉 ਜੀ ਆਇਆਂ ਨੂੰ ${name}! ਕੋਡ: *${code}*\nਦੋਸਤਾਂ ਨੂੰ ₹500 ਛੋਟ ਤੇ ਤੁਹਾਨੂੰ ₹500 ਕੈਸ਼! ${portalUrl}`,
    partnerWelcome: ({ name, code, portalUrl }) =>
      `🎉 TEAM CCTV ਪਾਰਟਨਰ ਜੀ ਆਇਆਂ ਨੂੰ ${name}! ਕੋਡ: *${code}*\n${portalUrl}`,
  },

  or: {
    quoteReady: ({ name, link }) =>
      `👋 ନମସ୍କାର ${name},\n\nଆପଣଙ୍କ CCTV ରେଟ୍ ଲିଷ୍ଟ (Quote) ପ୍ରସ୍ତୁତ ଅଛି! 🎥🛡️\n\nଏଠାରେ ଦେଖନ୍ତୁ:\n${link}\n\n- TEAM CCTV`,
    installerAssigned: ({ name, installerName, trackingUrl }) =>
      `✅ *ଟେକ୍ନିସିଆନ୍ ସ୍ଥିର ହୋଇଗଲେ!*\n\nନମସ୍କାର ${name},\n*${installerName}* ଶୀଘ୍ର ଆସିବେ।\n\n*ଷ୍ଟାଟସ୍ ଓ PIN ଏଠାରେ ଦେଖନ୍ତୁ:*\n${trackingUrl}`,
    completionPinReminder: ({ name, pin }) =>
      `🔔 *କାମ ସରିବାର PIN*\n\nନମସ୍କାର ${name},\nସବୁ କ୍ୟାମେରା ଭଲ ଭାବରେ ଚେକ୍ କରିବା ପରେ ଏହି PIN ଦିଅନ୍ତୁ: *${pin}* 🛡️`,
    deliveryDispatched: ({ name, amount, paymentUrl, allowCash }) =>
      `📦 ନମସ୍କାର ${name}, ଆପଣଙ୍କ CCTV ସାମଗ୍ରୀ ବାହାରିଲାଣି!\nOTP ପାଇଁ ₹${amount} ଦିଅନ୍ତୁ:\n${paymentUrl}` +
      (allowCash ? `\n\nକିମ୍ବା ଡେଲିଭରି ସମୟରେ କ୍ୟାସ୍ ଦେଇପାରିବେ।` : ``),
    deliveryConfirmedStartOtp: ({ otp }) =>
      `✅ ସାମଗ୍ରୀ ମିଳିଗଲା! କାମ ଆରମ୍ଭ ପାଇଁ Start OTP କୁହନ୍ତୁ: *${otp}*`,
    installerSignoffRequest: ({ balance, balanceNum, paymentLink, otp }) =>
      balanceNum > 0
        ? `🎉 ଫିଟିଂ ସରିଗଲା!\nବାକି *₹${balance}* ଦିଅନ୍ତୁ: ${paymentLink}\n\nତା'ପରେ Final OTP କୁହନ୍ତୁ: *${otp}*`
        : `🎉 ଫିଟିଂ ସରିଗଲା! Final OTP କୁହନ୍ତୁ: *${otp}*`,
    installerCompletedPayFinal: ({ amount, paymentUrl }) =>
      `🎉 କାମ ସରିଗଲା! ୱାରେଣ୍ଟି ପାଇଁ ₹${amount} ଦିଅନ୍ତୁ:\n${paymentUrl}`,
    installerCompletedWarrantySoon: () =>
      `🎉 କାମ ସରିଗଲା! ଆପଣଙ୍କ ୱାରେଣ୍ଟି କାର୍ଡ ଶୀଘ୍ର WhatsApp ରେ ଆସିବ। 🛡️`,
    paymentReminderLink: ({ name, stageName, amount, paymentUrl }) =>
      `ନମସ୍କାର ${name},\n\n*${stageName}* ବାକି: *₹${amount}*\nଏଠାରେ ଦିଅନ୍ତୁ:\n${paymentUrl}`,
    stageBooking: "ବୁକିଂ ଟୋକେନ୍ (₹500)",
    stageDelivery90: "ଡେଲିଭରି ପେମେଣ୍ଟ (90%)",
    stageFinal10: "ଶେଷ ପେମେଣ୍ଟ (10%)",
    bookingPaidConfirmed: ({ quoteId, jobId, trackingUrl }) =>
      `🎉 ବୁକିଂ ପକ୍କା ହେଲା! Quote: ${quoteId} | Job: ${jobId}\nଟ୍ରାକ୍: ${trackingUrl}`,
    deliveryPaidOtp: ({ amount, otp }) =>
      `✅ ₹${amount} ମିଳିଲା! Delivery OTP: *${otp}* (ସାମଗ୍ରୀ ଦେଖିସାରିବା ପରେ ଦିଅନ୍ତୁ). 🛡️`,
    finalPaidCompleted: ({ amount }) =>
      `🎉 ଶେଷ ₹${amount} ମିଳିଲା! ୱାରେଣ୍ଟି କାର୍ଡ ଶୀଘ୍ର ଆସିବ। 🛡️`,
    refundProcessed: ({ amount, quoteId }) =>
      `ନମସ୍କାର, Quote ${quoteId} ର ₹${amount} ରିଫଣ୍ଡ ପଠାଯାଇଛି (5–7 ବ୍ୟାଙ୍କ ଦିନ)।`,
    referEarnWelcome: ({ name, code, portalUrl }) =>
      `🎉 ସ୍ୱାଗତ ${name}! ଆପଣଙ୍କ କୋଡ୍: *${code}*\nସାଙ୍ଗମାନଙ୍କୁ ₹500 ରିହାତି ଓ ଆପଣଙ୍କୁ ₹500 କ୍ୟାସ୍! ${portalUrl}`,
    partnerWelcome: ({ name, code, portalUrl }) =>
      `🎉 TEAM CCTV ପାର୍ଟନର ସ୍ୱାଗତ ${name}! କୋଡ୍: *${code}*\n${portalUrl}`,
  },
};

export function getCustomerNotifications(locale: LocaleCode): NotificationBundle {
  return NOTIF_STRINGS[locale] || NOTIF_STRINGS.en;
}
