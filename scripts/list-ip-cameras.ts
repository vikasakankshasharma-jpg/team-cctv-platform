import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { adminDb } from "../lib/firebase-admin";

async function run() {
  const snap = await adminDb.collection("products")
    .where("category", "==", "cctv_camera")
    .where("is_active", "==", true)
    .get();
  
  const ipCameras: string[] = [];
  snap.forEach(doc => {
    const data = doc.data();
    if (data.technologies && data.technologies.some((t: string) => t.toLowerCase() === 'ip')) {
      ipCameras.push(data.name);
    }
  });
  console.log(`Found ${ipCameras.length} IP Cameras:`);
  ipCameras.forEach(c => console.log("- " + c));
  process.exit(0);
}

run().catch(console.error);
