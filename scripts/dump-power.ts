import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { adminDb } from "../lib/firebase-admin";

async function main() {
  const snap = await adminDb.collection('products').where('is_active', '==', true).get();
  const p = snap.docs.map(d => ({id: d.id, ...d.data()}));
  const power = p.filter((x: any) => x.category === 'power_device' || x.category === 'power' || String(x.display_name).toLowerCase().includes('power') || String(x.display_name).toLowerCase().includes('psu') || String(x.display_name).toLowerCase().includes('poe'));
  console.log('Power Devices:', power.length);
  power.forEach((d: any) => console.log(d.id, d.category, d.display_name, 'max:', d.max_cameras, 'ports:', d.ports));
}
main().then(()=>process.exit(0));
