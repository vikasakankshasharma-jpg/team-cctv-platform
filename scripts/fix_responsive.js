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

const allFiles = [...walkSync('./app'), ...walkSync('./components')];

let totalChanges = 0;

const replacements = [
  { pattern: /(?<!(sm|md|lg|xl|2xl):)\bp-8\b/g, replace: 'p-4 md:p-8' },
  { pattern: /(?<!(sm|md|lg|xl|2xl):)\bp-10\b/g, replace: 'p-4 md:p-10' },
  { pattern: /(?<!(sm|md|lg|xl|2xl):)\bp-12\b/g, replace: 'p-5 md:p-12' },
  { pattern: /(?<!(sm|md|lg|xl|2xl):)\bpx-8\b/g, replace: 'px-4 md:px-8' },
  { pattern: /(?<!(sm|md|lg|xl|2xl):)\bpx-10\b/g, replace: 'px-4 md:px-10' },
  { pattern: /(?<!(sm|md|lg|xl|2xl):)\bpy-8\b/g, replace: 'py-4 md:py-8' },
  { pattern: /(?<!(sm|md|lg|xl|2xl):)\bpy-10\b/g, replace: 'py-4 md:py-10' },
  // Hardcoded widths that might overflow mobile screens (375px)
  { pattern: /\bw-\[400px\]\b/g, replace: 'w-full max-w-[400px]' },
  { pattern: /\bw-\[500px\]\b/g, replace: 'w-full max-w-[500px]' },
  { pattern: /\bw-\[600px\]\b/g, replace: 'w-full max-w-[600px]' },
  { pattern: /\bw-\[800px\]\b/g, replace: 'w-full max-w-[800px]' },
];

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  replacements.forEach(({ pattern, replace }) => {
    content = content.replace(pattern, (match, p1, offset, string) => {
       // A bit of context checking to avoid replacing things inside comments if possible, but JSX is mostly safe
       return replace;
    });
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    totalChanges++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`\nOptimization complete! Modified ${totalChanges} files.`);
