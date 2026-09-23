const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        filelist = walkSync(filepath, filelist);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      filelist.push(filepath);
    }
  }
  return filelist;
};

const appFiles = walkSync('./app');
const componentFiles = walkSync('./components');
const allFiles = [...appFiles, ...componentFiles];

const issues = {
  hardcodedWidth: [],
  largeMobilePadding: [],
  unresponsiveGrid: [],
  unresponsiveFlex: []
};

allFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  lines.forEach((line, index) => {
    // Check for hardcoded width
    if (/w-\[[0-9]{3,}px\]/.test(line)) {
      issues.hardcodedWidth.push(`${file}:${index + 1} - ${line.trim()}`);
    }
    
    // Check for large mobile padding (p-8, p-10, p-12, py-8, etc without sm: or md:)
    // Regex matches p-8, py-10, px-12 etc. but ensure it's not preceded by sm: md: lg: xl:
    const paddingMatch = line.match(/(?<!(sm|md|lg|xl|2xl):)\b(p|px|py|pt|pb|pl|pr)-(8|10|12|14|16|20)\b/);
    if (paddingMatch) {
       issues.largeMobilePadding.push(`${file}:${index + 1} - ${line.trim()}`);
    }
    
    // Check for unresponsive grids (grid-cols-2 or more without md:grid-cols-X)
    const gridMatch = line.match(/className=["'][^"']*grid-cols-([2-9]|1[0-2])/);
    if (gridMatch) {
      // If it doesn't also have a responsive grid modifier
      if (!line.match(/(sm|md|lg|xl|2xl):grid-cols-/)) {
        issues.unresponsiveGrid.push(`${file}:${index + 1} - ${line.trim()}`);
      }
    }
  });
});

console.log('=== HARDCODED WIDTHS (Potential Overflow) ===');
console.log(issues.hardcodedWidth.slice(0, 10).join('\n'));
console.log(`...and ${Math.max(0, issues.hardcodedWidth.length - 10)} more.\n`);

console.log('=== LARGE PADDING ON MOBILE ===');
console.log(issues.largeMobilePadding.slice(0, 10).join('\n'));
console.log(`...and ${Math.max(0, issues.largeMobilePadding.length - 10)} more.\n`);

console.log('=== UNRESPONSIVE GRIDS (Might squeeze content on mobile) ===');
console.log(issues.unresponsiveGrid.slice(0, 10).join('\n'));
console.log(`...and ${Math.max(0, issues.unresponsiveGrid.length - 10)} more.\n`);

