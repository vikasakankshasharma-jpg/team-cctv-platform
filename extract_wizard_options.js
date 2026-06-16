const fs = require('fs');
const code = fs.readFileSync('lib/queries.ts', 'utf8');

const regex = /{.*?id:\s*["']([^"']+)["'].*?label:\s*["']([^"']+)["']/g;
let match;
while ((match = regex.exec(code)) !== null) {
  console.log(match[1] + ':::' + match[2]);
}

const titleRegex = /id:\s*["']([^"']+)["'],\s*description:\s*["']([^"']+)["']/g;
while ((match = titleRegex.exec(code)) !== null) {
  console.log(match[1] + '_desc:::' + match[2]);
}
