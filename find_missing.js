const fs = require('fs');

const file = 'c:/Users/hp/Documents/TEAM Website/secure-easy/lib/i18n/translations.ts';
let content = fs.readFileSync(file, 'utf8');

// A very hacky way to extract the translations object since we can't require it directly
const match = content.match(/export const translations: Record<LocaleCode, Partial<Record<TranslationKey, string>>> = (\{[\s\S]*?\});/);

if (match) {
  const objStr = match[1]
    .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
    .replace(/'/g, '"')
    // We can't simply parse it if it has variables or trailing commas.
    // Let's just use string replacement on the file content.
}
