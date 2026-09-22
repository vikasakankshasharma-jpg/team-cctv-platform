import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { renderToStream } from "@react-pdf/renderer";
import { WarrantyPDF } from "@/lib/pdf/warranty-pdf";
import React from "react";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ certId: string }> }
) {
  try {
    const { certId } = await params;
    
    // 1. Fetch Warranty Certificate
    const certRef = adminDb.collection("warranty_certificates").doc(certId);
    const certDoc = await certRef.get();
    
    if (!certDoc.exists) {
      return new NextResponse("Warranty Certificate not found", { status: 404 });
    }
    
    const certificate = certDoc.data()!;
    
    // 2. Fetch Customer Details
    let customerName = "Valued Customer";
    let customerPhone = "";
    let customerAddress = "";
    
    if (certificate.customerId) {
      const customerDoc = await adminDb.collection("users").doc(certificate.customerId).get();
      if (customerDoc.exists) {
        const data = customerDoc.data()!;
        customerName = data.displayName || data.name || "Customer";
        customerPhone = data.phoneNumber || data.phone || "";
      }
    } else if (certificate.jobId) {
      // Fallback to job info if customerId is missing or doesn't resolve
      const jobDoc = await adminDb.collection("jobs").doc(certificate.jobId).get();
      if (jobDoc.exists) {
        const job = jobDoc.data()!;
        customerName = job.customer?.name || "Customer";
        customerPhone = job.customer?.mobile || "";
        customerAddress = typeof job.address === 'string' ? job.address : (job.address?.full_address || "");
      }
    }
    
    // 3. Render PDF
    const stream = await renderToStream(
      <WarrantyPDF 
        certificate={certificate} 
        customerName={customerName}
        customerPhone={customerPhone}
        customerAddress={customerAddress}
      />
    );
    
    // 4. Return as PDF stream
    return new NextResponse(stream as any, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Warranty-Certificate-${certificate.certNumber}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Warranty PDF Generation Error:", error);
    return new NextResponse(`Error generating PDF: ${error.message}`, { status: 500 });
  }
}
