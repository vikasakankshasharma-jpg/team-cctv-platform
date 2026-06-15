const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../lib/i18n/translations.ts');
let content = fs.readFileSync(filePath, 'utf8');

// The new injected keys had `q_cam_count` which conflicts with the original `q_cam_count`
// We will replace all occurrences of `q_cam_count: "How many cameras do you need?",`
// And their equivalents in other languages that we just added.
const newTranslations = {
  en: 'How many cameras do you need?',
  hi: 'आपको कितने कैमरों की आवश्यकता है?',
  mr: 'तुम्हाला किती कॅमेरे हवे आहेत?',
  gu: 'તમારે કેટલા કેમેરાની જરૂર છે?',
  ta: 'உங்களுக்கு எத்தனை கேமராக்கள் தேவை?',
  te: 'మీకు ఎన్ని కెమెరాలు కావాలి?',
  kn: 'ನಿಮಗೆ ಎಷ್ಟು ಕ್ಯಾಮೆರಾಗಳು ಬೇಕು?',
  bn: 'আপনার কতগুলো ক্যামেরা দরকার?',
  ml: 'നിങ്ങൾക്ക് എത്ര ക്യാമറകൾ വേണം?',
  pa: 'ਤੁਹਾਨੂੰ ਕਿੰਨੇ ਕੈਮਰੇ ਚਾਹੀਦੇ ਹਨ?',
  or: 'ଆପଣଙ୍କୁ କେତୋଟି କ୍ୟାମେରା ଦରକାର?'
};

for (const [lang, val] of Object.entries(newTranslations)) {
  // We added them at the end. We'll search for them near feat_4g and remove them.
  // The line is: `q_cam_count: "..."`
  // We'll replace the second occurrence or just find the one we added.
  const regex = new RegExp(`\\s*q_cam_count:\\s*"${val.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}",`, 'g');
  content = content.replace(regex, '');
}

fs.writeFileSync(filePath, content);
console.log('Removed duplicate q_cam_count keys');
