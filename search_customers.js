const fs = require('fs');
const glob = require('glob');
glob.sync('app/api/**/*.ts').forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  if (content.includes('collection("customers")') || content.includes("collection('customers')")) {
    console.log(f);
  }
});
