const fs = require('fs');
let code = fs.readFileSync('firestore.rules', 'utf8');

function replaceAll(str, find, replace) {
  return str.split(find).join(replace);
}

// First, for the customers collection itself
code = replaceAll(code,
  'match /customers/{customerId} {\n      allow read: if isSales() || isTech() || (isAuthenticated() && resource.data.firebase_uid == request.auth.uid);',
  'match /customers/{customerId} {\n      allow read: if isSales() || isTech() || (isAuthenticated() && resource.data.authUid == request.auth.uid);'
);

// Second, for all operational collections
const badAuth = '(isAuthenticated() && resource.data.customerId == request.auth.uid)';
const goodAuth = '(isAuthenticated() && get(/databases/$(database)/documents/customers/$(resource.data.customerId)).data.authUid == request.auth.uid)';

code = replaceAll(code, badAuth, goodAuth);

fs.writeFileSync('firestore.rules', code);
console.log('done');
