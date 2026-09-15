const fs = require('fs');

function replaceFile(path, searchRegex, replacement) {
    let content = fs.readFileSync(path, 'utf8');
    content = content.replace(searchRegex, replacement);
    fs.writeFileSync(path, content);
}

replaceFile('lib/pricing-engine.ts', /settings\.default_cable_length_per_camera\s*\|\|\s*15/g, '15');
replaceFile('components/quotation/FullCustomizerPanel.tsx', /20\s*\*\s*\(selection\.camera_count/g, '15 * (selection.camera_count');
replaceFile('components/quotation/SpecCompareTable.tsx', /const metersPerCam = selection\.cable_length_meters\s*\|\|\s*20;/g, 'const metersPerCam = selection.cable_length_meters || 15;');

console.log("Patched defaults to 15 globally.");
