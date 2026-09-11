const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({ projectId: "demo-project" });
}

// Wait, I can just modify the seed-live-catalog.ts script and run it again.
