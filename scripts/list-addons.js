const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp({ projectId: "team-cctv-live-8294" });
}
const db = admin.firestore();

async function listAddons() {
  const addonsSnap = await db.collection("addons").where("is_active", "==", true).get();
  console.log("Found active addons in DB:", addonsSnap.size);
  addonsSnap.forEach(d => {
    const data = d.data();
    console.log(d.id, "=>", data.display_name || data.name, "| price:", data.price, "| category:", data.category);
  });

  const productsSnap = await db.collection("products").where("category", "in", ["rack", "network", "display"]).get();
  console.log("Found accessories in products:", productsSnap.size);
  productsSnap.forEach(d => {
    const data = d.data();
    console.log(d.id, "=>", data.display_name, "| price:", data.unit_price, "| category:", data.category);
  });
}
listAddons().catch(console.error);
