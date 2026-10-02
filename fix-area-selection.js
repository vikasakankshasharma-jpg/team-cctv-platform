const fs = require('fs');
const path = 'components/MapplsBoundaryMap.tsx';
let code = fs.readFileSync(path, 'utf8');

const regexStr = '/\\s+(S\\.O|B\\.O|H\\.O|G\\.P\\.O\\.|S\\.O\\.|B\\.O\\.|H\\.O\\.)(\\s+|$)/gi';
const parensRegexStr = '/\\s*\\([^)]*\\)/g';

const replacement = `
                    const isEntirePinSelected = dataObj.includes(pin);

                    const normalizeArea = (s) => {
                       if (!s) return '';
                       return s.replace(${regexStr}, ' ').replace(${parensRegexStr}, '').trim().toLowerCase();
                    };

                    // Draw sub-areas
                    for (const area of allAreas) {
                       const areaId = \`\${pin}:\${area}\`;
                       const isSelected = isEntirePinSelected || dataObj.some(selected => {
                          if (selected === areaId) return true;
                          if (selected.startsWith(pin + ':')) {
                             const sName = normalizeArea(selected.split(':')[1]);
                             const aName = normalizeArea(area);
                             return sName === aName || sName.includes(aName) || aName.includes(sName);
                          }
                          return false;
                       });
`;

const target = `const isEntirePinSelected = dataObj.includes(pin);

                    // Draw sub-areas
                    for (const area of allAreas) {
                       const areaId = \`\${pin}:\${area}\`;
                       const isSelected = isEntirePinSelected || dataObj.includes(areaId);`;

code = code.replace(target, replacement);
fs.writeFileSync(path, code);
console.log("Replaced!");
