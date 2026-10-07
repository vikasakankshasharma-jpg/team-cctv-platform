import { adminDb } from "./lib/firebase-admin";

async function run() {
  const snap = await adminDb.collection("products")
    .where("is_active", "==", true)
    .where("category", "==", "cctv_camera")
    .where("brand", "==", "Budget Brand")
    .get();
  
  const items = snap.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.display_name,
      tech: data.technical_name,
      technologies: data.technologies,
      technology: data.technology,
      res: data.resolution_mp || data.resolution,
      price: data.unit_price,
      features: data.features
    };
  });
  
  console.log(JSON.stringify(items, null, 2));
}

run().catch(console.error);
