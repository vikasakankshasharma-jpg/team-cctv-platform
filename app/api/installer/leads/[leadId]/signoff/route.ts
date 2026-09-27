import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { requireRoleApi } from "@/lib/auth-server";

export async function POST(request: Request, context: { params: Promise<{ leadId: string }> }) {
  try {
    const session = await requireRoleApi(["installer", "super_admin"]);
    const params = await context.params;
    const leadId = params.leadId;
    
    const { signature, serials, photos, note } = await request.json();

    const leadRef = adminDb.collection("leads").doc(leadId);
    
    await adminDb.runTransaction(async (transaction) => {
      const doc = await transaction.get(leadRef);
      if (!doc.exists) throw new Error("Lead not found");
      const leadData = doc.data()!;

      // Verify assignment
      if (session.role === "installer" && leadData.assigned_installer_id !== session.user?.uid) {
        throw new Error("Unauthorized to complete this job");
      }

      // Update lead
      transaction.update(leadRef, {
        status: "won",
        installation_proof_urls: photos || [],
        customer_signature_url: signature || null,
        installation_note: note || "",
        updated_at: new Date().toISOString()
      });

      // Save serial assets
      const dealId = leadData.deal_id || leadId; // fallback
      
      for (const [productId, codes] of Object.entries(serials as Record<string, string[]>)) {
        for (const code of codes) {
          const serialRef = adminDb.collection("serial_assets").doc();
          transaction.set(serialRef, {
            id: serialRef.id,
            jobId: leadId, // Legacy mapping
            dealId: dealId,
            customerId: leadData.customer_id || leadId,
            productId: productId,
            serialNumber: code,
            skuId: productId,
            productName: `Product ${productId}`, // Fallback
            installedAt: new Date().toISOString(),
            status: "INSTALLED",
            warrantyMonths: 12
          });
        }
      }

      // Generate Installer Commission
      if (session.role === "installer" && session.user?.uid) {
        const commissionRef = adminDb.collection("commissions").doc();
        transaction.set(commissionRef, {
          id: commissionRef.id,
          lead_id: leadId,
          quote_id: leadData.converted_quote_id || "direct",
          user_id: session.user.uid,
          user_type: "installer",
          customer_name: leadData.customer_name || "Customer",
          ex_tax_amount: leadData.final_amount_ex_tax || leadData.final_amount || 0,
          commission_amount: 1500, // Flat fee for installers for now, could be derived from config
          status: "pending",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });

    // We can also trigger the warranty API directly here
    // For now, we'll just return success so the client can show the completion.
    
    return NextResponse.json({ success: true, message: "Job completed and signed off!" });

  } catch (error: any) {
    console.error("Signoff Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
