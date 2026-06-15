const fs = require('fs');
const path = require('path');

const dict = {
  en: {
    step_prop_type: 'Property Type', step_install_type: 'Setup Type', step_cam_count: 'Camera Count', step_technology: 'Camera Technology', step_storage: 'Recording Storage', step_general_addons: 'Accessories', step_features: 'Special Features', step_site_overview: 'Site Overview',
    q_prop_type: 'Select property type:', q_install_type: 'Select setup type:', q_cam_count: 'Enter number of cameras:', q_tech: 'Select security level:', q_storage: 'Select recording duration:', q_general_addons: 'Select additional hardware (Optional):', q_features_q: 'Select features (Optional):', q_height: 'What is the approximate mounting height?', q_surface: 'What kind of surface will the cameras be mounted on?',
    opt_home: 'Home / Residential', opt_office: 'Office / Commercial', opt_shop: 'Shop / Retail', opt_factory: 'Factory / Warehouse',
    opt_ins_new: 'New Installation', opt_ins_upg: 'Upgrade Existing System',
    fopt_ip: 'IP Network Camera (Premium Digital Quality & Smart AI)', fopt_hd: 'HD Analog Camera (Cost-effective & Reliable)', opt_wifi: 'Wireless Camera (WiFi enabled, minimizes cabling)', opt_4g: '4G Cellular Camera (For remote areas without internet, requires SIM)',
    fopt_s_7: '1 Week (Standard for residential homes)', fopt_s_15: '15 Days (Recommended for small businesses)', fopt_s_30: '1 Month (Required for strict security compliance)',
    aopt_none: 'No extra accessories (View feeds on mobile/PC)', aopt_monitor: 'Dedicated Monitor Display (For constant live viewing)', aopt_ups: 'Power Backup UPS (Keeps recording during power cuts)', aopt_rack: 'Server Rack (Secure, lockable equipment cabinet)',
    opt_feat_none: 'None (Standard Features Only)', opt_feat_wdr: 'WDR (Clear faces against bright doors/windows)', opt_feat_audio: 'Built-in Mic (Audio Recording)', opt_feat_2way: 'Two-Way Audio (Mic + Speaker)', opt_feat_colorvu: 'Color Night Vision (ColorVu)', opt_feat_duallight: 'Smart Dual Light (Switches to color on motion)', opt_feat_starlight: 'Starlight Sensor (Excellent in very low light)', opt_feat_sdcard: 'SD Card Storage (Backup recording)', opt_feat_ptz: 'Pan-Tilt-Zoom (Optical Zoom & Motorized)', opt_feat_pt: 'Pan-Tilt (Motorized Rotation, No Optical Zoom)',
    hopt_std: 'Standard (Up to 10ft)', hopt_high: 'High (10ft - 15ft)', hopt_vhigh: 'Very High (15ft+)',
    sopt_brick: 'Concrete / Brick Wall', sopt_false: 'False Ceiling', sopt_marble: 'Marble / Stone', sopt_metal: 'Metal / Pole',
    leadgate_title: 'Unlock Your Proposal', leadgate_title_verify: 'Verify Your Number', leadgate_desc: 'Verify your phone number to view your itemized quote.', leadgate_desc_sent: 'We sent a 6-digit code to +91', contact_number: 'Contact Number *', full_name: 'Full Name *', area_pincode: 'Area Pincode *', send_verification_code: 'Send Verification Code', verify_view_quote: 'Verify & View Quote', resend_code: 'Resend Code', change_phone_number: 'Change Phone Number', secure_verification: 'Secure Verification',
    quote_summary: 'Quotation Summary', quote_total: 'Total Amount', quote_gst_included: '18% GST Included', quote_download_pdf: 'Download PDF', quote_book_installation: 'Book Installation', quote_validity: 'Quote valid for 7 days', quote_camera_system: 'Camera System', quote_accessories: 'Accessories & Add-ons', quote_installation: 'Professional Installation', quote_wiring: 'Wiring & Cabling (Estimated)', quote_schedule_visit: 'Schedule Site Visit'
  },
  hi: {
    step_prop_type: 'संपत्ति का प्रकार', step_install_type: 'सेटअप का प्रकार', step_cam_count: 'कैमरों की संख्या', step_technology: 'कैमरा टेक्नोलॉजी', step_storage: 'रिकॉर्डिंग स्टोरेज', step_general_addons: 'सहायक उपकरण', step_features: 'विशेष सुविधाएँ', step_site_overview: 'साइट का अवलोकन',
    q_prop_type: 'संपत्ति का प्रकार चुनें:', q_install_type: 'सेटअप का प्रकार चुनें:', q_cam_count: 'कैमरों की संख्या दर्ज करें:', q_tech: 'सुरक्षा स्तर चुनें:', q_storage: 'रिकॉर्डिंग अवधि चुनें:', q_general_addons: 'अतिरिक्त हार्डवेयर चुनें (वैकल्पिक):', q_features_q: 'सुविधाएँ चुनें (वैकल्पिक):', q_height: 'अनुमानित माउंटिंग ऊंचाई क्या है?', q_surface: 'कैमरे किस तरह की सतह पर लगाए जाएंगे?',
    opt_home: 'घर / आवासीय', opt_office: 'कार्यालय / व्यावसायिक', opt_shop: 'दुकान / रिटेल', opt_factory: 'कारखाना / गोदाम',
    opt_ins_new: 'नया इंस्टॉलेशन', opt_ins_upg: 'मौजूदा सिस्टम को अपग्रेड करें',
    fopt_ip: 'IP नेटवर्क कैमरा (प्रीमियम डिजिटल क्वालिटी और स्मार्ट AI)', fopt_hd: 'HD एनालॉग कैमरा (किफायती और विश्वसनीय)', opt_wifi: 'वायरलेस कैमरा (वाईफाई सक्षम, केबल कम करता है)', opt_4g: '4G सेलुलर कैमरा (इंटरनेट के बिना दूरदराज के क्षेत्रों के लिए, सिम की आवश्यकता है)',
    fopt_s_7: '1 सप्ताह (आवासीय घरों के लिए मानक)', fopt_s_15: '15 दिन (छोटे व्यवसायों के लिए अनुशंसित)', fopt_s_30: '1 महीना (सख्त सुरक्षा अनुपालन के लिए आवश्यक)',
    aopt_none: 'कोई अतिरिक्त सामान नहीं (मोबाइल/पीसी पर फीड देखें)', aopt_monitor: 'समर्पित मॉनिटर डिस्प्ले (लगातार लाइव देखने के लिए)', aopt_ups: 'पावर बैकअप यूपीएस (बिजली कटौती के दौरान रिकॉर्डिंग चालू रखता है)', aopt_rack: 'सर्वर रैक (सुरक्षित, लॉक करने योग्य उपकरण कैबिनेट)',
    opt_feat_none: 'कोई नहीं (केवल मानक सुविधाएँ)', opt_feat_wdr: 'WDR (उज्ज्वल दरवाजों/खिड़कियों के खिलाफ स्पष्ट चेहरे)', opt_feat_audio: 'अंतर्निर्मित माइक (ऑडियो रिकॉर्डिंग)', opt_feat_2way: 'टू-वे ऑडियो (माइक + स्पीकर)', opt_feat_colorvu: 'कलर नाइट विजन (कलरव्यू)', opt_feat_duallight: 'स्मार्ट डुअल लाइट (गति पर रंग में बदलता है)', opt_feat_starlight: 'स्टारलाइट सेंसर (बहुत कम रोशनी में उत्कृष्ट)', opt_feat_sdcard: 'एसडी कार्ड स्टोरेज (बैकअप रिकॉर्डिंग)', opt_feat_ptz: 'पैन-टिल्ट-ज़ूम (ऑप्टिकल ज़ूम और मोटराइज्ड)', opt_feat_pt: 'पैन-टिल्ट (मोटराइज्ड रोटेशन, कोई ऑप्टिकल ज़ूम नहीं)',
    hopt_std: 'मानक (10 फीट तक)', hopt_high: 'उच्च (10 फीट - 15 फीट)', hopt_vhigh: 'बहुत उच्च (15 फीट+)',
    sopt_brick: 'कंक्रीट / ईंट की दीवार', sopt_false: 'फाल्स सीलिंग', sopt_marble: 'संगमरमर / पत्थर', sopt_metal: 'धातु / पोल',
    leadgate_title: 'अपना प्रस्ताव अनलॉक करें', leadgate_title_verify: 'अपना नंबर सत्यापित करें', leadgate_desc: 'अपना विस्तृत कोटेशन देखने के लिए अपना फोन नंबर सत्यापित करें।', leadgate_desc_sent: 'हमने +91 पर 6 अंकों का कोड भेजा है', contact_number: 'संपर्क नंबर *', full_name: 'पूरा नाम *', area_pincode: 'क्षेत्र पिनकोड *', send_verification_code: 'सत्यापन कोड भेजें', verify_view_quote: 'सत्यापित करें और कोटेशन देखें', resend_code: 'कोड फिर से भेजें', change_phone_number: 'फ़ोन नंबर बदलें', secure_verification: 'सुरक्षित सत्यापन',
    quote_summary: 'कोटेशन सारांश', quote_total: 'कुल राशि', quote_gst_included: '18% GST शामिल', quote_download_pdf: 'पीडीएफ डाउनलोड करें', quote_book_installation: 'इंस्टॉलेशन बुक करें', quote_validity: 'कोट 7 दिनों के लिए वैध है', quote_camera_system: 'कैमरा सिस्टम', quote_accessories: 'एक्सेसरीज और एड-ऑन', quote_installation: 'व्यावसायिक इंस्टॉलेशन', quote_wiring: 'वायरिंग और केबलिंग (अनुमानित)', quote_schedule_visit: 'साइट विजिट शेड्यूल करें'
  },
  mr: {
    step_prop_type: 'मालमत्तेचा प्रकार', step_install_type: 'सेटअपचा प्रकार', step_cam_count: 'कॅमेऱ्यांची संख्या', step_technology: 'कॅमेरा तंत्रज्ञान', step_storage: 'रेकॉर्डिंग स्टोरेज', step_general_addons: 'ॲक्सेसरीज', step_features: 'विशेष वैशिष्ट्ये', step_site_overview: 'साइटचे विहंगावलोकन',
    q_prop_type: 'मालमत्तेचा प्रकार निवडा:', q_install_type: 'सेटअपचा प्रकार निवडा:', q_cam_count: 'कॅमेऱ्यांची संख्या प्रविष्ट करा:', q_tech: 'सुरक्षा स्तर निवडा:', q_storage: 'रेकॉर्डिंग कालावधी निवडा:', q_general_addons: 'अतिरिक्त हार्डवेअर निवडा (पर्यायी):', q_features_q: 'वैशिष्ट्ये निवडा (पर्यायी):', q_height: 'अंदाजे माउंटिंग उंची किती आहे?', q_surface: 'कॅमेरे कोणत्या प्रकारच्या पृष्ठभागावर लावले जातील?',
    opt_home: 'घर / निवासी', opt_office: 'कार्यालय / व्यावसायिक', opt_shop: 'दुकान / रिटेल', opt_factory: 'कारखाना / गोदाम',
    opt_ins_new: 'नवीन इन्स्टॉलेशन', opt_ins_upg: 'विद्यमान प्रणाली अपग्रेड करा',
    fopt_ip: 'आयपी नेटवर्क कॅमेरा (प्रीमियम डिजिटल गुणवत्ता आणि स्मार्ट एआय)', fopt_hd: 'एचडी ॲनालॉग कॅमेरा (किफायतशीर आणि विश्वासार्ह)', opt_wifi: 'वायरलेस कॅमेरा (वायफाय सक्षम, केबलिंग कमी करतो)', opt_4g: '4G सेल्युलर कॅमेरा (इंटरनेट नसलेल्या दुर्गम भागांसाठी, सिम आवश्यक आहे)',
    fopt_s_7: '१ आठवडा (निवासी घरांसाठी मानक)', fopt_s_15: '१५ दिवस (लहान व्यवसायांसाठी शिफारस केलेले)', fopt_s_30: '१ महिना (कठोर सुरक्षा अनुपालनासाठी आवश्यक)',
    aopt_none: 'कोणतीही अतिरिक्त ॲक्सेसरीज नाही (मोबाईल/पीसीवर फीड पहा)', aopt_monitor: 'समर्पित मॉनिटर डिस्प्ले (सतत लाईव्ह पाहण्यासाठी)', aopt_ups: 'पॉवर बॅकअप युपीएस (पॉवर कट दरम्यान रेकॉर्डिंग चालू ठेवते)', aopt_rack: 'सर्व्हर रॅक (सुरक्षित, लॉक करण्यायोग्य उपकरणे कॅबिनेट)',
    opt_feat_none: 'काहीही नाही (फक्त मानक वैशिष्ट्ये)', opt_feat_wdr: 'WDR (तेजस्वी दारे/खिडक्यांच्या पार्श्वभूमीवर स्पष्ट चेहरे)', opt_feat_audio: 'बिल्ट-इन माइक (ऑडिओ रेकॉर्डिंग)', opt_feat_2way: 'टू-वे ऑडिओ (माइक + स्पीकर)', opt_feat_colorvu: 'कलर नाईट व्हिजन (ColorVu)', opt_feat_duallight: 'स्मार्ट ड्युअल लाइट (मोशनवर रंगात बदलते)', opt_feat_starlight: 'स्टारलाइट सेन्सर (अतिशय कमी प्रकाशात उत्कृष्ट)', opt_feat_sdcard: 'एसडी कार्ड स्टोरेज (बॅकअप रेकॉर्डिंग)', opt_feat_ptz: 'पॅन-टिल्ट-झूम (ऑप्टिकल झूम आणि मोटराइज्ड)', opt_feat_pt: 'पॅन-टिल्ट (मोटराइज्ड रोटेशन, कोणतेही ऑप्टिकल झूम नाही)',
    hopt_std: 'मानक (१० फूट पर्यंत)', hopt_high: 'उच्च (१० फूट - १५ फूट)', hopt_vhigh: 'खूप उच्च (१५ फूट+)',
    sopt_brick: 'काँक्रीट / विटांची भिंत', sopt_false: 'फाल्स सीलिंग', sopt_marble: 'संगमरमर / दगड', sopt_metal: 'धातू / पोल',
    leadgate_title: 'तुमचा प्रस्ताव अनलॉक करा', leadgate_title_verify: 'तुमचा नंबर पडताळा', leadgate_desc: 'तुमचे तपशीलवार कोटेशन पाहण्यासाठी तुमचा फोन नंबर पडताळून पहा.', leadgate_desc_sent: 'आम्ही +91 वर 6 अंकी कोड पाठवला आहे', contact_number: 'संपर्क क्रमांक *', full_name: 'पूर्ण नाव *', area_pincode: 'क्षेत्र पिनकोड *', send_verification_code: 'पडताळणी कोड पाठवा', verify_view_quote: 'पडताळा आणि कोटेशन पहा', resend_code: 'कोड पुन्हा पाठवा', change_phone_number: 'फोन नंबर बदला', secure_verification: 'सुरक्षित पडताळणी',
    quote_summary: 'कोटेशन सारांश', quote_total: 'एकूण रक्कम', quote_gst_included: '१८% GST समाविष्ट', quote_download_pdf: 'पीडीएफ डाउनलोड करा', quote_book_installation: 'इन्स्टॉलेशन बुक करा', quote_validity: 'कोट ७ दिवसांसाठी वैध आहे', quote_camera_system: 'कॅमेरा प्रणाली', quote_accessories: 'ॲक्सेसरीज आणि ॲड-ऑन्स', quote_installation: 'व्यावसायिक इन्स्टॉलेशन', quote_wiring: 'वायरिंग आणि केबलिंग (अंदाजे)', quote_schedule_visit: 'साइट भेट शेड्युल करा'
  },
  gu: {
    step_prop_type: 'મિલકતનો પ્રકાર', step_install_type: 'સેટઅપનો પ્રકાર', step_cam_count: 'કેમેરાની સંખ્યા', step_technology: 'કેમેરા ટેકનોલોજી', step_storage: 'રેકોર્ડિંગ સ્ટોરેજ', step_general_addons: 'એસેસરીઝ', step_features: 'વિશેષ સુવિધાઓ', step_site_overview: 'સાઇટનું વિહંગાવલોકન',
    q_prop_type: 'મિલકતનો પ્રકાર પસંદ કરો:', q_install_type: 'સેટઅપનો પ્રકાર પસંદ કરો:', q_cam_count: 'કેમેરાની સંખ્યા દાખલ કરો:', q_tech: 'સુરક્ષા સ્તર પસંદ કરો:', q_storage: 'રેકોર્ડિંગ અવધિ પસંદ કરો:', q_general_addons: 'વધારાના હાર્ડવેર પસંદ કરો (વૈકલ્પિક):', q_features_q: 'સુવિધાઓ પસંદ કરો (વૈકલ્પિક):', q_height: 'અંદાજિત માઉન્ટિંગ ઊંચાઈ કેટલી છે?', q_surface: 'કેમેરા કયા પ્રકારની સપાટી પર માઉન્ટ કરવામાં આવશે?',
    opt_home: 'ઘર / રહેણાંક', opt_office: 'ઓફિસ / વ્યાવસાયિક', opt_shop: 'દુકાન / રિટેલ', opt_factory: 'ફેક્ટરી / વેરહાઉસ',
    opt_ins_new: 'નવું ઇન્સ્ટોલેશન', opt_ins_upg: 'હાલની સિસ્ટમ અપગ્રેડ કરો',
    fopt_ip: 'IP નેટવર્ક કેમેરા (પ્રીમિયમ ડિજિટલ ક્વોલિટી અને સ્માર્ટ AI)', fopt_hd: 'HD એનાલોગ કેમેરા (ખર્ચ અસરકારક અને વિશ્વસનીય)', opt_wifi: 'વાયરલેસ કેમેરા (વાઇફાઇ સક્ષમ, કેબલિંગ ઘટાડે છે)', opt_4g: '4G સેલ્યુલર કેમેરા (ઇન્ટરનેટ વિનાના દૂરના વિસ્તારો માટે, સિમ જરૂરી છે)',
    fopt_s_7: '1 અઠવાડિયું (રહેણાંક ઘરો માટે પ્રમાણભૂત)', fopt_s_15: '15 દિવસ (નાના વ્યવસાયો માટે ભલામણ કરેલ)', fopt_s_30: '1 મહિનો (કડક સુરક્ષા પાલન માટે જરૂરી)',
    aopt_none: 'કોઈ વધારાની એસેસરીઝ નથી (મોબાઇલ/પીસી પર ફીડ જુઓ)', aopt_monitor: 'ડેડિકેટેડ મોનિટર ડિસ્પ્લે (સતત લાઇવ જોવા માટે)', aopt_ups: 'પાવર બેકઅપ UPS (પાવર કટ દરમિયાન રેકોર્ડિંગ ચાલુ રાખે છે)', aopt_rack: 'સર્વર રેક (સુરક્ષિત, લોક કરી શકાય તેવું સાધન કેબિનેટ)',
    opt_feat_none: 'કોઈ નહિ (ફક્ત માનક સુવિધાઓ)', opt_feat_wdr: 'WDR (તેજસ્વી દરવાજા/બારીઓ સામે સ્પષ્ટ ચહેરા)', opt_feat_audio: 'બિલ્ટ-ઇન માઇક (ઓડિયો રેકોર્ડિંગ)', opt_feat_2way: 'ટુ-વે ઓડિયો (માઇક + સ્પીકર)', opt_feat_colorvu: 'કલર નાઇટ વિઝન (ColorVu)', opt_feat_duallight: 'સ્માર્ટ ડ્યુઅલ લાઇટ (મોશન પર રંગમાં બદલાય છે)', opt_feat_starlight: 'સ્ટારલાઇટ સેન્સર (ખૂબ ઓછા પ્રકાશમાં ઉત્તમ)', opt_feat_sdcard: 'SD કાર્ડ સ્ટોરેજ (બેકઅપ રેકોર્ડિંગ)', opt_feat_ptz: 'પાન-ટિલ્ટ-ઝૂમ (ઓપ્ટિકલ ઝૂમ અને મોટરાઇઝ્ડ)', opt_feat_pt: 'પાન-ટિલ્ટ (મોટરાઇઝ્ડ રોટેશન, કોઈ ઓપ્ટિકલ ઝૂમ નથી)',
    hopt_std: 'માનક (10 ફૂટ સુધી)', hopt_high: 'ઉચ્ચ (10 ફૂટ - 15 ફૂટ)', hopt_vhigh: 'ખૂબ ઉચ્ચ (15 ફૂટ+)',
    sopt_brick: 'કોંક્રિટ / ઈંટની દિવાલ', sopt_false: 'ફોલ્સ સીલિંગ', sopt_marble: 'આરસ / પથ્થર', sopt_metal: 'ધાતુ / પોલ',
    leadgate_title: 'તમારો પ્રસ્તાવ અનલોક કરો', leadgate_title_verify: 'તમારો નંબર ચકાસો', leadgate_desc: 'તમારું વિગતવાર ક્વોટેશન જોવા માટે તમારો ફોન નંબર ચકાસો.', leadgate_desc_sent: 'અમે +91 પર 6 અંકોનો કોડ મોકલ્યો છે', contact_number: 'સંપર્ક નંબર *', full_name: 'પૂરું નામ *', area_pincode: 'વિસ્તાર પિનકોડ *', send_verification_code: 'ચકાસણી કોડ મોકલો', verify_view_quote: 'ચકાસો અને ક્વોટેશન જુઓ', resend_code: 'કોડ ફરીથી મોકલો', change_phone_number: 'ફોન નંબર બદલો', secure_verification: 'સુરક્ષિત ચકાસણી',
    quote_summary: 'ક્વોટેશન સારાંશ', quote_total: 'કુલ રકમ', quote_gst_included: '18% GST શામેલ છે', quote_download_pdf: 'પીડીએફ ડાઉનલોડ કરો', quote_book_installation: 'ઇન્સ્ટોલેશન બુક કરો', quote_validity: 'ક્વોટ 7 દિવસ માટે માન્ય છે', quote_camera_system: 'કેમેરા સિસ્ટમ', quote_accessories: 'એસેસરીઝ અને એડ-ઓન્સ', quote_installation: 'વ્યાવસાયિક ઇન્સ્ટોલેશન', quote_wiring: 'વાયરિંગ અને કેબલિંગ (અંદાજિત)', quote_schedule_visit: 'સાઇટ મુલાકાત શેડ્યૂલ કરો'
  }
};

const filePath = path.join(__dirname, '../lib/i18n/translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

const keys = Object.keys(dict.en);

// Extract the type TranslationKey block
let typeDefMatch = content.match(/export type TranslationKey =([\s\S]*?);/);
if (typeDefMatch) {
  let typeDef = typeDefMatch[1];
  for (const k of keys) {
    if (!typeDef.includes(`| '${k}'`)) {
      typeDef += `\n  | '${k}'`;
    }
  }
  content = content.replace(/export type TranslationKey =([\s\S]*?);/, `export type TranslationKey =${typeDef};`);
}

// Inject new keys into each locale block
const langs = ['en', 'hi', 'mr', 'gu'];
for (const lang of langs) {
  // Find the block for this language: `lang: { ... }`
  const blockRegex = new RegExp(`(\\s*${lang}:\\s*\\{[\\s\\S]*?)(\\n\\s*\\}(,|\\n))`);
  const match = content.match(blockRegex);
  if (match) {
    let blockContent = match[1];
    for (const [k, v] of Object.entries(dict[lang])) {
      if (!blockContent.includes(`${k}:`)) {
        blockContent += `,\n    ${k}: "${v}"`;
      }
    }
    content = content.replace(match[0], blockContent + match[2]);
  }
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Translations updated successfully!");
