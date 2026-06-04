import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function DELETE(request: Request) {
  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ success: false, error: "No IDs provided" }, { status: 400 });
    }

    const db = adminDb;
    const batch = db.batch();

    // Firebase batches can handle up to 500 operations at a time
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500);
      const chunkBatch = db.batch();
      
      chunk.forEach(id => {
        chunkBatch.delete(db.collection("products").doc(id));
        chunkBatch.delete(db.collection("addons").doc(id));
      });
      
      await chunkBatch.commit();
    }

    return NextResponse.json({ success: true, message: `Deleted ${ids.length} products` });
  } catch (error: any) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
