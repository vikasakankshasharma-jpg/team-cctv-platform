import { NextResponse } from "next/server";
import { adminDb, adminStorage, serverTimestamp } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snap = await adminDb.collection("marketing_templates").orderBy("created_at", "desc").get();
    const templates = snap.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        created_at: (data.created_at as any)?.toDate?.()?.toISOString() || null,
      };
    });
    return NextResponse.json({ templates });
  } catch (error: any) {
    console.error("[Marketing API GET]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    let imageUrl = body.imageUrl;

    // Handle base64 image upload
    if (body.imageBase64) {
      const base64Data = body.imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const ext = body.imageBase64.substring("data:image/".length, body.imageBase64.indexOf(";base64"));
      const fileName = `marketing_templates/${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      
      const bucket = adminStorage.bucket();
      const file = bucket.file(fileName);
      
      await file.save(buffer, {
        metadata: { contentType: `image/${ext}` },
      });
      
      // Make it public and get URL
      await file.makePublic();
      imageUrl = file.publicUrl();
    }

    const docRef = adminDb.collection("marketing_templates").doc();
    const templateData = {
      id: docRef.id,
      name: body.name || "Untitled Template",
      badge: body.badge || "Standard",
      type: "image",
      imageUrl: imageUrl || "",
      textColor: body.textColor || "#ffffff",
      accentColor: body.accentColor || "#fbbf24",
      title: body.title || "UPGRADE YOUR HOME SECURITY",
      subtitle: body.subtitle || "Get professional CCTV installation.",
      offerText: body.offerText || "CLAIM ₹500 OFF TODAY",
      is_active: true,
      created_at: serverTimestamp(),
    };

    await docRef.set(templateData);

    return NextResponse.json({ success: true, template: templateData });
  } catch (error: any) {
    console.error("[Marketing API POST]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, is_active } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await adminDb.collection("marketing_templates").doc(id).update({
      is_active,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await adminDb.collection("marketing_templates").doc(id).delete();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
