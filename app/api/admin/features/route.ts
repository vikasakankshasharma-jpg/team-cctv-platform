import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { FeatureTag } from "@/types";

/**
 * GET: Fetch all feature tags
 */
export async function GET(req: NextRequest) {
  try {
    const snapshot = await adminDb.collection("feature_tags").get();
    const tags: FeatureTag[] = [];
    
    snapshot.forEach(doc => {
      tags.push({ id: doc.id, ...doc.data() } as FeatureTag);
    });

    // Sort by label
    tags.sort((a, b) => a.customer_label.localeCompare(b.customer_label));

    return NextResponse.json({ success: true, tags });
  } catch (error) {
    console.error("Error fetching feature tags:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch feature tags" }, { status: 500 });
  }
}

/**
 * POST: Create a new feature tag
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const tag: FeatureTag = {
      ...body,
      is_active: body.is_active ?? true,
      created_at: new Date(),
      updated_at: new Date()
    };

    let docRef;
    if (tag.id) {
      docRef = adminDb.collection("feature_tags").doc(tag.id);
      const docId = tag.id;
      delete tag.id;
      await docRef.set(tag);
      tag.id = docId;
    } else {
      docRef = await adminDb.collection("feature_tags").add(tag);
      tag.id = docRef.id;
    }

    return NextResponse.json({ success: true, tag });
  } catch (error) {
    console.error("Error creating feature tag:", error);
    return NextResponse.json({ success: false, error: "Failed to create feature tag" }, { status: 500 });
  }
}

/**
 * PATCH: Update a feature tag
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "Tag ID is required" }, { status: 400 });
    }

    updates.updated_at = new Date();

    const docRef = adminDb.collection("feature_tags").doc(id);
    await docRef.update(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating feature tag:", error);
    return NextResponse.json({ success: false, error: "Failed to update feature tag" }, { status: 500 });
  }
}
