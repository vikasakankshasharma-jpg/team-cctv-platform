const fs = require('fs');
const file = 'lib/i18n/translations.ts';
let lines = fs.readFileSync(file, 'utf8').split('\n');

for (let i = 0; i < lines.length - 1; i++) {
  const line = lines[i].trimRight();
  // If line ends with a double quote or single quote, and doesn't have a comma,
  // and it's inside the translations object
  if (line.endsWith('"') || line.endsWith("'")) {
    const nextLine = lines[i+1].trim();
    if (nextLine !== '}' && nextLine !== '},' && nextLine !== '') {
      lines[i] = lines[i] + ',';
    }
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('Commas fixed via script!');
