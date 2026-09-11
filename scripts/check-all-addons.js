const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({ projectId: "team-cctv-live-8294" });
}
const db = admin.firestore();

async function checkAllAddons() {
  const allAddons = await db.collection("addons").get();
  console.log("Total addons in DB:", allAddons.size);
  allAddons.forEach(d => console.log(d.id, d.data()));
}
checkAllAddons().catch(console.error);
