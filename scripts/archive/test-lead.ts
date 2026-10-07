import fs from "fs";
import admin from "firebase-admin";

const envStr = fs.readFileSync(".env.local", "utf8");
const envVars: any = {};
envStr.split("\n").forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    let val = match[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) {
      val = val.substring(1, val.length - 1);
    }
    envVars[match[1]] = val.replace(/\\n/g, '\n');
  }
});

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: envVars.FIREBASE_PROJECT_ID,
    clientEmail: envVars.FIREBASE_CLIENT_EMAIL,
    privateKey: envVars.FIREBASE_PRIVATE_KEY,
  })
});

async function main() {
  const db = admin.firestore();
  const lead = await db.collection("leads").doc("gO4AGdjmi8w4hqxnCmRP").get();
  console.log(JSON.stringify(lead.data(), null, 2));
  process.exit(0);
}

main();
