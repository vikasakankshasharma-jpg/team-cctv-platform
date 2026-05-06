import { verifySession } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { RecommendationRule } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/recommendation-rules
 * Fetch all recommendation rules, sorted by priority.
 */
export async function GET() {
  const session = await verifySession();
  if (!session.isAuthenticated) return NextResponse.json({error: "Unauthorized"}, {status: 401});
  try {
    const snapshot = await adminDb
      .collection("recommendation_rules")
      .orderBy("priority", "asc")
      .get();

    const rules = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as RecommendationRule[];

    return NextResponse.json(rules);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/recommendation-rules
 * Create a new rule.
 */
export async function POST(request: Request) {
  const session = await verifySession();
  if (!session.isAuthenticated) return NextResponse.json({error: "Unauthorized"}, {status: 401});
  try {
    const rule: RecommendationRule = await request.json();
    const docRef = adminDb.collection("recommendation_rules").doc();
    
    const newRule = {
      ...rule,
      id: docRef.id,
      created_at: new Date(),
      updated_at: new Date()
    };

    await docRef.set(newRule);
    return NextResponse.json(newRule);
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
