const fs = require('fs');
const path = require('path');

const OLD_PHONE_REGEX = /97726[\s-]?99395/g;
const OLD_RAW = "9772699395";
const NEW_RAW = "7357612865";
const NEW_FORMATTED = "73576 12865";

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.match(/\.(tsx|ts|js|jsx|json|md)$/)) {
        results.push(file);
      }
    }
  });
  return results;
}

const directories = ['app', 'components', 'lib'];

directories.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) return;
  
  const files = walk(dirPath);
  files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;
    
    // Replace standard format
    content = content.replace(OLD_PHONE_REGEX, match => {
      if (match.includes(" ")) return "73576 12865";
      if (match.includes("-")) return "73576-12865";
      return NEW_RAW;
    });

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Updated ${file}`);
    }
  });
});
