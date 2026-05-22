const { execSync } = require('child_process');

const envVars = {
  "FIREBASE_PROJECT_ID": "team-cctv-live-8294",
  "FIREBASE_CLIENT_EMAIL": "firebase-adminsdk-fbsvc@team-cctv-live-8294.iam.gserviceaccount.com",
  "FIREBASE_STORAGE_BUCKET": "team-cctv-live-8294.firebasestorage.app",
  "NEXT_PUBLIC_APP_URL": "https://cctvquotation.com",
  "NEXT_PUBLIC_FIREBASE_API_KEY": "AIzaSyDAvp81yMXAI1kuz5XXzbG_us-Owcncuzc",
  "NEXT_PUBLIC_FIREBASE_APP_ID": "1:361687878258:web:2c2e94829557cc42e9d0eb",
  "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN": "team-cctv-live-8294.firebaseapp.com",
  "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID": "361687878258",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID": "team-cctv-live-8294",
  "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET": "team-cctv-live-8294.firebasestorage.app",
  "NEXT_PUBLIC_GA_ID": "G-310JGMQN50",
  "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY": "AIzaSyAPRR097NlrXF-8BiJ_sbnzzQw9NQYdtnA"
};

const privateKey = "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCardrSA+9Knnpb\nzDNx/TV1E3KGO8VTb1mxlRaAQs8R6BRoiCcoJhC0AacjEQVTJaz0k40xY+9lBTCw\n7d6+ZpvEQg9nzR/gv3qmVs6QCkOj/p3Hd8RNJnjZir4I2hXVYqY6swlSJGLcuSQm\nQwBkLOJ0V2PR03wSmZbjLs50dLIaKb9e8eon9be6PItSr8zuTSP7JFjAtYFjfdyZ\nEUI+LvCN9JlM2gMXY534cB8SPO87SzhiHu9M7JrpLe2R8vx93sK0/2o+6JEJeuLL\nluRd8kdHQXzA4D1ma4cU05aC3eY/Din+9x3ZZlJMyI4FucRK8ZATsjKtNDABC6oO\nLFx2PHgDAgMBAAECggEAIbZ61wNciFr6OD/Nhq61lArlDzS/0WuXlQj1mob1MuXu\nbMogHrQNN+6USyROkMzJYZU3VOh/KPl0n1t5DO64TJJJYUpoBEg3p0GMTACwtXGt\nWehUtKwJ8wA2Yx+FWrjhmjGjem/LzGfd5Sj9UNgnk0voybbaeANZy7JL9T3qA6F3\nAae9KDEasMFpYj0efnrK+m0f5+3dmn0xfbEByg8drYSftspUTiAZPGbmKA0EGj/5\n33yAOnjzvPDxP1kMOsjTqGNsKGCSWh6OUlLiRHEnQJi/Gn5Q1R5kdcCoTNeb00df\nwpT5KuzLKBAmsfT5pAwPijzf0Re6neER5nFi4USBwQKBgQDIVdrxY+DXg+i3w1mp\nrnIX9Y7huErYBB+gW2U6AQxZ9zzxiuw3m0hdrfd6jjaN5uY3cI2aaodEM5AZdejC\n3IaV8k+PRd1zeBpjg/tXKzGS0/lXxrn/Jy7y2FBrvXtE4R0HD/OJ3GLK7xEK6ldc\nI8zj3H0Li9V29zLevsP6f06d6wKBgQDFqGd/1BlpiMR7iFZ7pg9/NBufzgfGix6l\n27Najdca18T3oQ8TF/NCpczUtZOanzxs/Oxz8aT1ZOIJcM5xw/N683OgjNosyhD8\nk1xiIB/E+qFCPV4sHrQy88zTf8b7f91wdzWMrYwznlIYUyn+wJkaN2pPGOs82FDO\nCweUUGhQSQKBgQCOXmU/0skAn5+MqGlZ6rzuRfYKdxvJM/T90rW3aPNMJCXNSfrg\n8ZuV54HOOK6QXZ0RnQ0kxbvnPfWUAnUtteZ3PUJJAU+FNb8bJbpCklGilL3IIVQg\n/cmhjxRn3Lpzkr88O5vJRzN2IDsuVKdMtaxv6kt7Hx7OcpJWNZ+0rzBBjQKBgG5V\nVgj19YWCkeM/NL9q8AWaqbznvlFnASGmZRSsTqGuRkXQguCuotzWPmOSRCWws4NH\nIBqMjf9pY//PF35L2pMMaMP7PCJ6XUcQXyZrNjC3kuKt7O6F6SL0EqcREZr8Qjjw\nYlT332ZE/yCS88M/8Xa/7jje+RkKyvhpEb8Jr2D5AoGAWKaGhbVg4LUaz4SvPo8y\n8pJNXtplPkPoerUkFYfvAi9Qn4aIfVGiarv/aiT+yDjIeWRfPSlTGZXM57PaTHg5\n1V3cjNtDTo598p3zN8hlPdBoDKmXir1k8voFgoc3EXtTIeuGNSFPeryxMfcQvcYQ\n2Y85xmqXj50fbOaVwEHG9go=\n-----END PRIVATE KEY-----\n";

function setEnv(name, value) {
  try {
    console.log(`Setting ${name}...`);
    try { execSync(`npx vercel env rm ${name} production --yes`, { stdio: 'ignore' }); } catch (e) {}
    execSync(`npx vercel env add ${name} production`, { input: value });
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ Failed to set ${name}:`, err.message);
  }
}

console.log("=== Vercel Environment Variable Sync ===");
for (const [key, value] of Object.entries(envVars)) {
  setEnv(key, value);
}
setEnv("FIREBASE_PRIVATE_KEY", privateKey);
console.log("=== Done ===");
