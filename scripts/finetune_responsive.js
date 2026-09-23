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

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Fix grid-cols-3 without responsive prefix → grid-cols-1 sm:grid-cols-3
  // Only match if there's no preceding sm:/md:/lg: breakpoint for grid-cols
  content = content.replace(
    /className="([^"]*)\bgrid grid-cols-3\b([^"]*)"/g,
    (match, before, after) => {
      // Skip if there's already a responsive grid-cols in the class
      if (/\b(sm|md|lg|xl):grid-cols-/.test(before + after)) return match;
      return `className="${before}grid grid-cols-1 sm:grid-cols-3${after}"`;
    }
  );

  // Fix grid-cols-2 without responsive prefix → grid-cols-1 sm:grid-cols-2
  // Be selective: only fix if they contain data display elements, not tight 2-col stat cards
  content = content.replace(
    /className="([^"]*)\bgrid grid-cols-2\b([^"]*)"/g,
    (match, before, after) => {
      if (/\b(sm|md|lg|xl):grid-cols-/.test(before + after)) return match;
      // Keep grid-cols-2 for things like OTP inputs, stat cards, etc.
      // where 2-col is appropriate even on mobile
      if (/gap-[01]/.test(before + after)) return match;
      return `className="${before}grid grid-cols-1 sm:grid-cols-2${after}"`;
    }
  );

  // Fix remaining large vertical paddings that were missed
  // py-12, py-16, py-20 without responsive prefix
  content = content.replace(
    /(?<!(sm|md|lg|xl|2xl):)\bpy-12\b/g,
    'py-6 md:py-12'
  );
  content = content.replace(
    /(?<!(sm|md|lg|xl|2xl):)\bpy-16\b/g,
    'py-8 md:py-16'
  );
  content = content.replace(
    /(?<!(sm|md|lg|xl|2xl):)\bpy-20\b/g,
    'py-10 md:py-20'
  );
  
  // Fix p-14 (login panel)
  content = content.replace(
    /(?<!(sm|md|lg|xl|2xl):)\bp-14\b/g,
    'p-6 md:p-14'
  );

  // Fix pb-12 → pb-6 md:pb-12
  content = content.replace(
    /(?<!(sm|md|lg|xl|2xl):)\bpb-12\b/g,
    'pb-6 md:pb-12'
  );

  // Fix text-3xl without responsive → text-2xl sm:text-3xl  
  // (only in h1/h2/heading contexts to avoid over-matching)

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    totalChanges++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`\nFine-tuning complete! Modified ${totalChanges} files.`);
