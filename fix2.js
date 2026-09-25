const fs = require('fs');
['components/wizard/WizardClientV2.tsx', 'components/shared/PhoneCaptureModal.tsx'].forEach(f => {
  let content = fs.readFileSync(f, 'utf-8');
  content = content.replace(/\["", "", "", "", "", ""\]/g, '["", "", "", ""]');
  fs.writeFileSync(f, content);
});
