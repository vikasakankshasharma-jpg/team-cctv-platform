const fs = require('fs');
const files = [
  'app/(admin)/admin/login/LoginForm.tsx',
  'components/installer/InstallerLoginClient.tsx',
  'components/partner/PartnerLoginClient.tsx',
  'components/shared/PhoneCaptureModal.tsx',
  'components/wizard/WizardClientV2.tsx'
];

files.forEach(f => {
  let content = fs.readFileSync(f, 'utf-8');
  content = content.replace(/useState\(\["", "", "", "", "", ""\]\)/g, 'useState(["", "", "", ""])');
  content = content.replace(/setOtp\(\["","","","","",""\]\)/g, 'setOtp(["","","",""])');
  content = content.replace(/\.length === 6/g, '.length === 4');
  content = content.replace(/\.slice\(0, 6\)/g, '.slice(0, 4)');
  content = content.replace(/current\[5\]\?/g, 'current[3]?');
  content = content.replace(/Math\.min\(digits\.length, 5\)/g, 'Math.min(digits.length, 3)');
  fs.writeFileSync(f, content);
});
