const fs = require('fs');
const { Project, SyntaxKind } = require('ts-morph');
const path = require('path');

const srcDir = path.resolve(__dirname);

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory() && file !== 'node_modules' && file !== '.next') {
      findFiles(path.join(dir, file), fileList);
    } else if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.ts'))) {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files = findFiles(srcDir);
const keysFound = new Map();

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  
  const regexT = /t\(\s*['"]([^'"]+)['"]\s*,\s*(?:['"](.*?)['"]|`([^`]+)`)\s*\)/g;
  let match;
  while ((match = regexT.exec(content)) !== null) {
    const key = match[1];
    const def = match[2] || match[3] || '';
    if (!key.includes('${') && !key.includes('\'')) {
        keysFound.set(key, def);
    }
  }

  const regexTT = /<TranslatedText[^>]*tKey=['"]([^'"]+)['"][^>]*defaultText=['"](.*?)['"][^>]*>/g;
  while ((match = regexTT.exec(content)) !== null) {
    keysFound.set(match[1], match[2]);
  }
}

const newKeys = Array.from(keysFound.entries())
  .map(([key, val]) => ({ key, val }))
  .filter(k => !k.key.includes('Options') && !k.key.includes('-'));

const srcFile = path.resolve(srcDir, 'lib/i18n/translations.ts');
const project = new Project();
const sourceFile = project.addSourceFileAtPath(srcFile);

// 1. Update TranslationKey type
const typeAlias = sourceFile.getTypeAliasOrThrow('TranslationKey');
const currentTypeNode = typeAlias.getTypeNodeOrThrow();
const currentTypeStr = currentTypeNode.getText();

let typeStr = currentTypeStr;
for (const {key} of newKeys) {
  if (!typeStr.includes(`'${key}'`) && !typeStr.includes(`"${key}"`)) {
    typeStr += ` | '${key}'`;
  }
}
typeAlias.setType(typeStr);

// 2. Update translations object for en, hi, mr, gu
const translationsDecl = sourceFile.getVariableDeclarationOrThrow('translations');
const translationsObj = translationsDecl.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

const locales = ['en', 'hi', 'mr', 'gu'];
let addedCount = 0;

for (const locale of locales) {
  const localeProp = translationsObj.getPropertyOrThrow(locale);
  if (localeProp.isKind(SyntaxKind.PropertyAssignment)) {
    const localeObj = localeProp.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);
    const existingLocaleKeys = localeObj.getProperties().map(p => {
      if (p.isKind(SyntaxKind.PropertyAssignment)) return p.getName().replace(/['"]/g, '');
      return '';
    });
    
    for (const {key, val} of newKeys) {
      if (!existingLocaleKeys.includes(key)) {
        localeObj.addPropertyAssignment({
          name: `'${key}'`,
          initializer: JSON.stringify(locale === 'en' ? val : `[${locale}] ${val}`)
        });
        if (locale === 'en') addedCount++;
      }
    }
  }
}

sourceFile.saveSync();
console.log(`Successfully added ${addedCount} missing keys to translations.ts`);
