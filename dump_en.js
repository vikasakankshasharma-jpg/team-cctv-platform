const { Project, SyntaxKind } = require('ts-morph');
const fs = require('fs');
const path = require('path');

const srcFile = path.resolve('c:/Users/hp/Documents/TEAM Website/secure-easy/lib/i18n/translations.ts');
const project = new Project();
const sourceFile = project.addSourceFileAtPath(srcFile);

const translationsDecl = sourceFile.getVariableDeclarationOrThrow('translations');
const translationsObj = translationsDecl.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

const enProp = translationsObj.getPropertyOrThrow('en');
const enObj = enProp.getInitializerIfKindOrThrow(SyntaxKind.ObjectLiteralExpression);

const dict = {};
enObj.getProperties().forEach(p => {
    if (p.isKind(SyntaxKind.PropertyAssignment)) {
        const key = p.getName().replace(/['"]/g, '');
        const val = p.getInitializer().getText().replace(/^['"`](.*)['"`]$/, '$1');
        dict[key] = val;
    }
});

fs.writeFileSync('c:/Users/hp/Documents/TEAM Website/secure-easy/en_dict.json', JSON.stringify(dict, null, 2));
console.log("Dumped " + Object.keys(dict).length + " keys.");
