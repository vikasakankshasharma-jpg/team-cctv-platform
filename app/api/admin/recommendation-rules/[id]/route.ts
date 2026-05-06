import { verifySession } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import type { RecommendationRule } from "@/types";

export const dynamic = "force-dynamic";

/**
 * PUT /api/admin/recommendation-rules/[id]
 * Update an existing rule.
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();
  if (!session.isAuthenticated) return NextResponse.json({error: "Unauthorized"}, {status: 401});
  try {
    const { id } = await params;
    const rule: Partial<RecommendationRule> = await request.json();
    const docRef = adminDb.collection("recommendation_rules").doc(id);

    const updateData = {
      ...rule,
      updated_at: new Date()
    };

    await docRef.update(updateData);
    return NextResponse.json({ id, ...updateData });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/recommendation-rules/[id]
 * Soft-delete a rule.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await verifySession();
  if (!session.isAuthenticated) return NextResponse.json({error: "Unauthorized"}, {status: 401});
  try {
    const { id } = await params;
    const docRef = adminDb.collection("recommendation_rules").doc(id);

    await docRef.update({
      is_active: false,
      updated_at: new Date()
    });

    return NextResponse.json({ message: "Rule deactivated", id });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
