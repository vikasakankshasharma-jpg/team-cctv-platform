import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const db = adminDb;
    
    // 1. Fetch Specification Knowledge Base
    const specKnowledgeSnapshot = await db.collection('specification_knowledge').get();
    const learnedSpecs: { name: string, lowercaseName: string }[] = [];
    specKnowledgeSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.spec_name) {
            learnedSpecs.push({
                name: data.spec_name,
                lowercaseName: data.spec_name.toLowerCase()
            });
        }
    });

    if (learnedSpecs.length === 0) {
        return NextResponse.json({ success: true, suggestions: [] });
    }

    // 2. Fetch all live products
    const productsSnapshot = await db.collection("products").where("is_deleted", "==", false).get();
    
    const suggestions: any[] = [];

    productsSnapshot.forEach(doc => {
        const product = doc.data();
        if (!product.display_name) return;

        const titleLower = product.display_name.toLowerCase();
        const existingTechs = product.technologies || [];
        const missingTechs: string[] = [];

        for (const spec of learnedSpecs) {
            if (titleLower.includes(spec.lowercaseName)) {
                const alreadyExists = existingTechs.some((t: string) => t.toLowerCase() === spec.lowercaseName);
                if (!alreadyExists) {
                    missingTechs.push(spec.name);
                }
            }
        }

        if (missingTechs.length > 0) {
            suggestions.push({
                id: doc.id,
                display_name: product.display_name,
                category: product.category,
                existing_technologies: existingTechs,
                suggested_technologies: missingTechs,
                image_url: product.image_url
            });
        }
    });

    return NextResponse.json({ success: true, suggestions });
  } catch (error: any) {
    console.error("Error fetching optimization suggestions:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { updates } = body; // Array of { id, technologies: string[] }
    const db = adminDb;

    if (!Array.isArray(updates) || updates.length === 0) {
        return NextResponse.json({ success: false, error: "No updates provided" });
    }

    const batches = [];
    let batch = db.batch();
    let count = 0;

    for (const update of updates) {
        const ref = db.collection("products").doc(update.id);
        batch.update(ref, {
            technologies: update.technologies,
            updated_at: new Date().toISOString()
        });
        
        count++;
        if (count === 500) {
            batches.push(batch.commit());
            batch = db.batch();
            count = 0;
        }
    }

    if (count > 0) batches.push(batch.commit());
    await Promise.all(batches);

    return NextResponse.json({ success: true, updatedCount: updates.length });
  } catch (error: any) {
    console.error("Error applying spec optimizations:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
