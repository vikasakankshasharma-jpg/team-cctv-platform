import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { sendAdminNotification } from "@/lib/notification-service";

/**
 * POST /api/leads/storage-overflow
 * Auto-captures a lead when storage requirements exceed available HDD capacity.
 * Fires automatically from the quotation page — no user action needed.
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      lead_id, phone, customer_name,
      required_tb, available_tb, shortfall_tb,
      camera_count, recording_days, recording_mode,
      technology, plan_type, daily_gb_per_camera
    } = data;

    if (!lead_id && !phone) {
      return NextResponse.json({ error: "Missing lead_id or phone" }, { status: 400 });
    }

    // If we have a lead_id, tag the existing lead with overflow info
    if (lead_id) {
      const leadRef = adminDb.collection("leads").doc(lead_id);
      await leadRef.update({
        storage_overflow: true,
        storage_overflow_info: {
          required_tb,
          available_tb,
          shortfall_tb,
          camera_count,
          recording_days,
          recording_mode,
          daily_gb_per_camera,
          technology,
          plan_type,
          flagged_at: new Date()
        },
        needs_custom_bom: true,
        updated_at: new Date()
      });
    }

    // Also create an entry in industrial_leads for admin dashboard visibility
    const docRef = adminDb.collection("industrial_leads").doc();
    await docRef.set({
      id: docRef.id,
      source: "storage_overflow",
      lead_id: lead_id || null,
      phone: phone || "N/A",
      customer_name: customer_name || "N/A",
      requested_camera_count: camera_count,
      required_storage_tb: required_tb,
      available_storage_tb: available_tb,
      shortfall_tb,
      recording_days,
      recording_mode,
      technology,
      plan_type,
      status: "new",
      created_at: new Date()
    });

    // Notify admin
    await sendAdminNotification(
      `📦 Storage Overflow Lead!\n` +
      `Customer: ${customer_name || phone || "Unknown"}\n` +
      `Need: ${required_tb}TB (have max ${available_tb}TB)\n` +
      `Setup: ${camera_count} × ${technology} cameras, ${recording_mode} recording, ${recording_days} days\n` +
      `Action: Custom BOM required`
    );

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    const err = error as Error;
    console.error("Storage overflow lead capture error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
