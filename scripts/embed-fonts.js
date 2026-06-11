const fs = require('fs');
const regular  = fs.readFileSync('public/fonts/Inter-Regular.woff').toString('base64');
const semibold = fs.readFileSync('public/fonts/Inter-SemiBold.woff').toString('base64');
const bold     = fs.readFileSync('public/fonts/Inter-Bold.woff').toString('base64');

const content = [
  '// AUTO-GENERATED — Fonts embedded as base64 to avoid network requests during client-side PDF generation.',
  "export const FONT_REGULAR  = 'data:font/woff;base64," + regular  + "';",
  "export const FONT_SEMIBOLD = 'data:font/woff;base64," + semibold + "';",
  "export const FONT_BOLD     = 'data:font/woff;base64," + bold     + "';",
].join('\n') + '\n';

fs.writeFileSync('lib/pdf-fonts.ts', content);
console.log('Done. File size:', (content.length / 1024).toFixed(1), 'KB');
