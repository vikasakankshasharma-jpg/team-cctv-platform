const fs = require('fs');
const path = 'components/MapplsBoundaryMap.tsx';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  /_mapplsSDKCallbacks: Array<\(\) => void>;/g,
  `_mapplsSDKCallbacks: Array<() => void>;\n    _didInitialZoneFit?: boolean;`
);

fs.writeFileSync(path, code);
console.log("Updated MapplsBoundaryMap.tsx");
