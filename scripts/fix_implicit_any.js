const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        filelist = walkSync(filepath, filelist);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      filelist.push(filepath);
    }
  }
  return filelist;
};

const allFiles = [...walkSync('./app'), ...walkSync('./components'), ...walkSync('./lib')];
let totalChanges = 0;

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Fix Object.values(...).map((param, ...) => where param lacks type
  // Pattern: .map((word) =>   or  .map((word, idx) =>  without : any
  content = content.replace(
    /\.map\((\(?)(\w+)(\)?\s*=>)/g,
    (match, paren1, param, rest) => {
      // Skip if already typed
      if (match.includes(': ')) return match;
      // Skip common already-typed patterns
      if (param === 'any') return match;
      return `.map((${param}: any)${rest.startsWith(')') ? rest.slice(1) : ' =>'}`;
    }
  );

  // Fix .map((word, idx) => without types
  content = content.replace(
    /\.map\((\w+)\s*=>/g,
    (match, param) => {
      if (match.includes(': ')) return match;
      return `.map((${param}: any) =>`;
    }
  );

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalChanges++;
    console.log(`Fixed implicit any in: ${file}`);
  }
});

console.log(`\nDone! Fixed ${totalChanges} files.`);
