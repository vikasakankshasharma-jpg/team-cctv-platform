import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { ApiResponse } from "@/lib/api-response";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    if (!id) {
      return ApiResponse.badRequest("Vendor ID is required");
    }

    if (!adminDb) {
      return ApiResponse.error("Database not initialized", "INTERNAL_ERROR", 500);
    }

    await adminDb.collection("vendors").doc(id).delete();

    return ApiResponse.success({ message: "Vendor deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting vendor:", error);
    return ApiResponse.error(error.message, "INTERNAL_ERROR", 500);
  }
}
