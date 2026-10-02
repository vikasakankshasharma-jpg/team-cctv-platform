const fs = require('fs');
let code = fs.readFileSync('components/landing/PincodeWidget.tsx', 'utf8');

code = code.replace(/isHero[\s\S]*?\?[\s\S]*?"px-4 md:px-8 py-4 sm:py-5\.5 bg-zinc-900.*?"[\s\S]*?:[\s\S]*?"px-6 py-3\.5 bg-zinc-900.*?"/,
  'isHero\n              ? "px-4 md:px-8 py-4 sm:py-5.5 bg-blue-600 hover:bg-blue-500 shadow-blue-500/30 hover:shadow-blue-500/50 text-white"\n              : "px-6 py-3.5 bg-blue-600 hover:bg-blue-500 shadow-blue-500/30 hover:shadow-blue-500/50 text-white"');

fs.writeFileSync('components/landing/PincodeWidget.tsx', code);
console.log('Updated classes');
