import { NextRequest } from "next/server";
import { adminDb, serverTimestamp } from "@/lib/firebase-admin";
import { ApiResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    if (!adminDb) {
      return ApiResponse.error("Database not initialized", "INTERNAL_ERROR", 500);
    }

    const snapshot = await adminDb.collection("vendors").orderBy("name").get();
    const vendors = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return ApiResponse.success({ vendors });
  } catch (error: any) {
    console.error("Error fetching vendors:", error);
    return ApiResponse.error(error.message, "INTERNAL_ERROR", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, prefix } = await request.json();

    if (!name || !prefix) {
      return ApiResponse.badRequest("Name and prefix are required");
    }

    if (!adminDb) {
      return ApiResponse.error("Database not initialized", "INTERNAL_ERROR", 500);
    }

    const docRef = await adminDb.collection("vendors").add({
      name,
      prefix: prefix.toUpperCase(),
      created_at: serverTimestamp()
    });

    return ApiResponse.success({ 
      vendor: {
        id: docRef.id,
        name,
        prefix: prefix.toUpperCase()
      }
    });
  } catch (error: any) {
    console.error("Error creating vendor:", error);
    return ApiResponse.error(error.message, "INTERNAL_ERROR", 500);
  }
}
