const fs = require('fs');
const p = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = p.resolve(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if(!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      if(file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(file, 'utf8');
        const regex = /tKey=["']([^"']+)["']|t\(["']([^"']+)["']/g;
        let match;
        while ((match = regex.exec(content)) !== null) {
          if (match[1]) results.push(match[1]);
          if (match[2]) results.push(match[2]);
        }
      }
    }
  });
  return results;
}

const keys1 = walk('components/quotation');
const keys2 = walk('app/(customer)/quote');
const allKeys = [...new Set([...keys1, ...keys2])];
console.log(allKeys.join(', '));
