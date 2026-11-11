/**
 * @file lib/whatsapp/indic-keywords.ts
 * @description Unicode-safe Indic numeral normalization & multi-script spoken keyword matchers
 * for all 11 supported Indian languages (en, hi, mr, gu, ta, te, kn, bn, ml, pa, or) plus
 * colloquial Romanized Hinglish / regional inputs.
 * Note: JavaScript regex word boundaries (`\b`) fail on non-ASCII Indic characters; every helper
 * here uses explicit Unicode-safe token/substring matching.
 */

const INDIC_DIGIT_BLOCKS: Array<[number, number]> = [
  [0x0966, 0x096f], // Devanagari (hi, mr)
  [0x09e6, 0x09ef], // Bengali
  [0x0a66, 0x0a6f], // Gurmukhi (pa)
  [0x0ae6, 0x0aef], // Gujarati
  [0x0b66, 0x0b6f], // Odia
  [0x0be6, 0x0bef], // Tamil
  [0x0c66, 0x0c6f], // Telugu
  [0x0ce6, 0x0cef], // Kannada
  [0x0d66, 0x0d6f], // Malayalam
];

/**
 * Converts regional Indic script digits (e.g., ४, ৪, ૪, ௪) into ASCII digits ('0'-'9').
 */
export function normalizeIndicDigits(input: string): string {
  if (!input) return "";
  let out = "";
  for (const ch of input) {
    const code = ch.codePointAt(0) ?? 0;
    let mapped = ch;
    for (const [start, end] of INDIC_DIGIT_BLOCKS) {
      if (code >= start && code <= end) {
        mapped = String(code - start);
        break;
      }
    }
    out += mapped;
  }
  return out;
}

/**
 * Boundary-aware ASCII word matcher (avoids partial hits like "no" inside "known").
 */
export function hasAsciiWord(textLower: string, words: readonly string[]): boolean {
  for (const w of words) {
    const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const rx = new RegExp(`(?:^|[\\s,.;:!?()'"*/-])${escaped}(?=$|[\\s,.;:!?()'"*/-])`, "i");
    if (rx.test(textLower)) return true;
  }
  return false;
}

/**
 * Unicode-safe substring matcher for multi-character Indic words & multi-word phrases.
 */
export function hasIndicOrPhrase(textLower: string, phrases: readonly string[]): boolean {
  return phrases.some((p) => textLower.includes(p));
}

export function matchesKeywords(
  textLower: string,
  asciiWords: readonly string[],
  indicOrMultiPhrases: readonly string[] = []
): boolean {
  return hasAsciiWord(textLower, asciiWords) || hasIndicOrPhrase(textLower, indicOrMultiPhrases);
}

const START_GREETING_INDIC = [
  "नमस्ते", "नमस्कार", "राम राम", "नया कोट", "शुरू करें",
  "नमस्कार", "सुरुवात", "નમસ્તે", "નમસ્કાર", "કેમ છો",
  "வணக்கம்", "నమస్కారం", "ನಮಸ್ಕಾರ", "নমস্কার", "ഹലോ", "നമസ്കാരം",
  "ਸਤ ਸ੍ਰੀ ਅਕਾਲ", "ਨਮਸਕਾਰ", "ନମସ୍କାର",
];

export function isGreetingOrRestartText(textLower: string): boolean {
  const trimmed = textLower.trim();
  if (/^(hi|hello|hey|start|restart|reset|menu)(?:\s|$)/i.test(trimmed)) return true;
  return START_GREETING_INDIC.some((g) => trimmed.startsWith(g) || trimmed === g);
}

export const LANG_CHANGE_ASCII = ["language", "bhasha", "boli", "zuban", "change language", "lang"];
export const LANG_CHANGE_INDIC = [
  "भाषा", "बोली", "भाषा बदलो", "भाषा बदलें", "ભાષા", "மொழி", "భాష",
  "ಭಾಷೆ", "ভাষা", "ഭാഷ", "ਭਾਸਾ", "ਭਾਸ਼ਾ", "ଭାଷା",
];

export const CALL_ASCII = [
  "call", "calling", "phone", "contact", "baat", "specialist", "executive",
  "agent", "talk", "dial", "karo", "batao", "call me", "phone pe", "callback",
];
export const CALL_INDIC = [
  "कॉल", "फोन", "बात करनी", "बात करो", "संपर्क", "ફોન", "કૉલ", "વાત",
  "போன்", "கால்", "பேசுங்க", "ఫోన్", "కాల్", "ಮಾತನಾಡಿ", "ಕಾಲ್", "ಫೋನ್",
  "কল", "ফোন", "കോള", "ഫോൺ", "ਕਾਲ", "ਫ਼ੋਨ", "ଗଲ", "ଫୋନ୍", "କଲ୍",
];

export const PRICE_ASCII = [
  "rate", "price", "cost", "kitna", "kitne", "discount", "offer", "offers",
  "sasta", "cheapest", "budget", "kam", "bhav", "paisa", "paise", "quote", "quotation",
];
export const PRICE_INDIC = [
  "रेट", "दाम", "कीमत", "भाव", "खर्च", "खर्चा", "बजट", "किंमत", "दर",
  "ભાવ", "ખર્ચ", "விலை", "ధర", "రేటు", "ಬೆಲೆ", "দাম", "খরচ", "വില",
  "ਰੇਟ", "ਕੀਮਤ", "ଦାମ୍", "ମୂଲ୍ୟ", "ଖର୍ଚ୍ଚ",
];

export const WARRANTY_ASCII = [
  "warranty", "guarantee", "kharab", "damage", "repair", "replace",
  "replacement", "service charge", "complaint",
];
export const WARRANTY_INDIC = [
  "वारंटी", "गारंटी", "खराब", "रिपेयर", "बदलाव", "वॉरंटी", "हमी",
  "ગેરંટી", "વોરંટી", "வாரண்டி", "வாரன்டி", "వారంటీ", "ವಾರಂಟಿ", "ওয়ারেন্টি",
  "വാറന്റി", "ਵਾਰੰਟੀ", "ୱାରେଣ୍ଟି",
];

export const LOCATION_ASCII = [
  "service area", "locations", "coverage", "kahan", "where", "office address", "head office",
];
export const LOCATION_INDIC = [
  "कहाँ", "कहां", "पता", "ऑफिस", "जगह", "शहर", "कोठे", "ક્યાં", "સરનામું",
  "எங்கே", "ముகவரி", "ఎక్కడ", "ಎಲ್ಲಿ", "ವಿಳಾಸ", "কোথায়", "ঠিকানা",
  "എവിടെ", "വിലാസം", "ਕਿੱਥੇ", "ਪਤਾ", "କେଉଁଠି", "ଠିକଣା",
];

export const RESET_PHRASES = [
  "reset", "restart", "start over", "shuru se", "clear", "naye se",
  "फिर से", "शुरू से", "रीसेट", "पुन्हा", "ફરીથી", "மீண்டும்", "మళ్ళీ",
  "ಮತ್ತೆ", "আবার", "വീണ്ടും", "ਦੁਬਾਰਾ", "ଆଉଥରେ",
];

export const HELP_ASCII = ["help", "madad", "stuck", "confused", "samajh", "kaise", "options", "menu"];
export const HELP_INDIC = [
  "मदद", "सहायता", "कैसे", "समझ", "मेनू", "मदत", "મદદ", "உதவி",
  "సహాయం", "ಸಹಾಯ", "সাহায্য", "സഹായം", "ਮਦਦ", "ସାହାଯ୍ୟ",
];

export const ZERO_NONE_ASCII = [
  "none", "zero", "no", "nahi", "ek bhi nahi", "kuch nahi", "nil", "skip",
  "na", "nako", "vendam", "illa", "ledu", "illai", "nai", "naa", "no outdoor", "no indoor", "no wifi",
];
export const ZERO_NONE_INDIC = [
  "नहीं", "कोई नहीं", "जीरो", "शून्य", "कुछ नहीं", "नाही", "नको",
  "નહીં", "કોઈ નહીં", "இல்லை", "வேண்டாம்", "లేదు", "వద్దు",
  "ಇಲ್ಲ", "ಬೇಡ", "না", "নাই", "কিছু না", "വേണ്ട", "ഇല്ല",
  "ਨਹੀਂ", "ਕੋਈ ਨਹੀਂ", "ନାହିଁ", "ଶୂନ୍ୟ",
];

export const DONE_PROCEED_ASCII = [
  "done", "proceed", "continue", "ok", "okay", "yes", "haan", "ha", "next",
  "aage", "theek", "thik", "chalo", "ho gaya", "wired only", "skip", "confirm",
];
export const DONE_PROCEED_INDIC = [
  "हाँ", "हां", "ठीक है", "ठीक", "आगे", "हो गया", "ओके", "आगे बढ़ें", "बढें",
  "होय", "पुढे", "ચાલો", "સારું", "બરાબર", "சரி", "ஆமாம்", "అవును", "సరే",
  "ಹೌದು", "ಸರಿ", "হ্যাঁ", "ঠিক", "ঠিক আছে", "അതെ", "ശരി", "ਹਾਂ", "ਠੀਕ", "ହଁ", "ଠିକ୍",
];

export const CHANGE_QTY_ASCII = [
  "change", "edit", "modify", "badlo", "kam", "zyada", "reset qty", "change qty",
  "change camera", "edit camera",
];
export const CHANGE_QTY_INDIC = [
  "बदलो", "बदलना", "बदल", "कम", "ज्यादा", "सुधार", "बदला", "ફેરફાર",
  "மாற்று", "మార్చు", "ಬದಲಿಸಿ", "বদল", "മാറ്റുക", "ਬਦਲੋ", "ବଦଳାନ୍ତୁ",
];

export const ADD_MORE_INDIC = [
  "और जोड़ें", "और कैमरा", "दुसरा", "बीजा", "மேலும்", "మరో", "ಮತ್ತೊಂದು",
  "আরো", "കൂടുതൽ", "ਹੋਰ", "ଆଉ",
];

export const INDIC_NAME_STOPWORDS = [
  "कीमत", "रेट", "दाम", "भाव", "पता", "मदद", "कॉल", "फोन", "नहीं", "जीरो",
  "रुपए", "कैमरा", "सीसीटीवी", "गारंटी", "वारंटी", "फोटो", "ऑफर", "कितना",
  "बताओ", "चाहिए", "बदलो", "ठीक", "हां", "हाँ", "नंबर", "पिनकोड",
  "விலை", "பணம்", "உதவி", "கால்", "వేరే", "ధర", "బెಲೆ", "দাম", "വില", "ਕੀਮਤ", "ଦାମ୍",
];

export const INSTALL_HYBRID_ASCII = [
  "hybrid",
  "both",
  "wired and wireless",
  "wired + wireless",
  "wired and wifi",
  "wired + wifi",
  "dvr and wifi",
  "nvr and wifi",
  "dono",
  "donon",
  "mix",
  "mixed",
];
export const INSTALL_HYBRID_INDIC = [
  "हाइब्रिड", "हायब्रिड", "હાઇબ્રિડ", "ஹைபிரிட்", "హైబ్రిడ్", "ಹೈಬ್ರಿಡ್", "হাইব্রিড", "ഹൈബ്രിഡ്", "ਹਾਈਬ੍ਰਿਡ", "ହାଇବ୍ରିଡ୍",
  "दोनों", "दोनो", "दोन्ही", "बंने", "बन्ने", "બંને", "இரண்டும்", "రెండూ",
  "ಎರಡೂ", "দুটোই", "উভয়", "രണ്ടും", "ਦੋਵੇਂ", "ଉଭୟ",
  "तार और वाईफाई", "तार और वायरलेस",
];

export const INSTALL_ADDON_INDIC = [
  "जोड़ना", "बढ़ाना", "पुराना", "मौजूदा", "अतिरिक्त", "जुने", "જૂના",
  "கூடுதல்", "పాత", "ಹಳೆಯ", "পুরানো", "പഴയ", "ਪੁਰਾਣੇ", "ପୁରୁଣା",
];
export const INSTALL_4G_INDIC = ["सोलर", "सिम", "સોલર", "சோலார்", "సోలార్", "ಸೋಲಾರ್", "সোলার", "സോളാർ", "ਸੋਲਰ", "ସୋଲାର"];
export const INSTALL_WIRELESS_INDIC = [
  "बिना तार", "वाईफाई", "वाई-फाई", "वायरलेस", "वाइफ़ाई", "વાયરલેસ", "વગર",
  "வயர்லெஸ்", "వైర్‌లెస్", "ವೈರ್‌ಲೆಸ್", "ওয়াইফাই", "വയർലെസ്", "ਵਾਇਰਲੈੱਸ", "ୱାୟାରଲେସ୍",
];
export const INSTALL_WIRED_INDIC = [
  "तार वाला", "नया सिस्टम", "वायर्ड", "नवीन", "નવું", "તાર", "புதிய", "కొత్త",
  "ಹೊಸ", "নতুন", "പുതിയ", "ਨਵਾਂ", "ନୂଆ",
];

export const TIMELINE_ASAP_INDIC = ["तुरंत", "आज", "कल", "अभी", "तात्काळ", "आजच", "તાત્કાલિક", "உடனே", "వెంటనే", "ತಕ್ಷಣ", "এখনই", "ഉടൻ", "ਤੁਰੰਤ", "ତୁରନ୍ତ"];
export const TIMELINE_WEEK_INDIC = ["हफ्ता", "सप्ताह", "आठवडा", "અઠવાડિયું", "வாரம்", "వారం", "ವಾರ", "সপ্তাহ", "ആഴ്ച", "ਹਫ਼ਤਾ", "ସପ୍ତାହ"];
export const TIMELINE_MONTH_INDIC = ["महीना", "महिना", "મહિનો", "மாதம்", "నెల", "ತಿಂಗಳು", "মাস", "മാസം", "ਮਹੀਨਾ", "ମାସ"];
export const TIMELINE_RESEARCH_INDIC = ["देख रहे", "अंदाजा", "पूछताछ", "बघत", "માહિતી", "பார்க்க", "సమాచారం", "ನೋಡುತ್ತ", "দেখছি", "നോക്ക", "ਦੇਖ", "ଦେଖୁ"];

export const MODE_MOTION_INDIC = ["मोशन", "हिलने", "चाल", "ચલન", "அசைவு", "కదలిక", "ಚಲನೆ", "নড়াচড়া", "ചലനം", "ਹਿੱਲਜੁੱਲ", "ଚଳନ"];
export const HEIGHT_HIGH_INDIC = ["ऊंचा", "ऊंची", "मंज़िल", "मजला", "ઊંચી", "உயரம்", "ఎత్తు", "ಎತ್ತರ", "উঁচু", "ഉയരം", "ਉੱਚੀ", "ଉଚ୍ଚ"];
export const SURFACE_CEILING_INDIC = ["फाल्स सीलिंग", "सीलिंग", "जिप्सम", "पीओपी", "पी.ओ.पी", "सीलिंग", "સીલિંગ", "சீலிங்", "సీలింగ్", "ಸೀಲಿಂಗ್", "সিলিং", "സീലിംഗ്", "ਸੀਲਿੰਗ", "ସିଲିଂ"];
export const CABLING_PREWIRED_INDIC = ["पहले से", "फिटिंग", "तार डला", "तयार", "તૈયાર", "முன்பே", "ముందే", "ಈಗಾಗಲೇ", "আগেই", "നേരത്തെ", "ਪਹਿਲਾਂ", "ଆଗରୁ"];
export const CABLING_CUSTOM_INDIC = ["मीटर", "मी.", "नाप", "કસ્ટમ", "மீட்டர்", "మీటర్", "ಮೀಟರ್", "মিটার", "മീറ്റർ", "ਮੀਟਰ", "ମିଟର"];
export const NET_OFFLINE_INDIC = ["बिना इंटरनेट", "टीवी", "ऑफलाइन", "इंटरनेट नहीं", "नेट नहीं", "इंटरनेट नाही", "ઇન્ટરનેટ નથી", "இணையம் இல்லை", "ఇంటర్నెట్ లేదు", "ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ", "ইন্টারনেট নেই", "ഇന്റർനെറ്റ് ഇല്ല", "ਇੰਟਰਨੈੱਟ ਨਹੀਂ", "ଇଣ୍ଟରନେଟ୍ ନାହିଁ"];
export const NET_EXTENDER_INDIC = ["रेंज", "कमज़ोर", "कमजोर", "एक्सटेंडर", "दूर", "દૂર", "தூரம்", "దూరం", "ದೂರ", "দূরে", "ദൂരം", "ਦੂਰ", "ଦୂର"];
export const NET_4G_FAR_INDIC = ["खेत", "फार्म", "अलग सिम", "शेत", "ખેતર", "பண்ணை", "పొలం", "ತೋಟ", "খামার", "ഫാം", "ਖੇਤ", "ଫାର୍ମ"];
