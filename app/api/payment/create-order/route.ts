import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { ApiResponse } from "@/lib/api-response";
// import Razorpay from "razorpay";

// Assuming 20% advance
const ADVANCE_PERCENTAGE = 0.20;

export async function POST(request: NextRequest) {
  try {
    // Handling form submission from the review page
    // Content-Type might be application/x-www-form-urlencoded or application/json
    let lead_id, quote_id;
    
    if (request.headers.get("content-type")?.includes("application/json")) {
      const body = await request.json();
      lead_id = body.lead_id;
      quote_id = body.quote_id;
    } else {
      const formData = await request.formData();
      lead_id = formData.get("lead_id") as string;
      quote_id = formData.get("quote_id") as string;
    }

    if (!lead_id || !quote_id) {
      return ApiResponse.badRequest("Missing lead_id or quote_id");
    }

    const leadRef = adminDb.collection("leads").doc(lead_id);
    const quoteRef = leadRef.collection("quotes").doc(quote_id);

    const [leadDoc, quoteDoc] = await Promise.all([leadRef.get(), quoteRef.get()]);

    if (!leadDoc.exists || !quoteDoc.exists) {
      return ApiResponse.error("Not found", "NOT_FOUND", 404);
    }

    const quote = quoteDoc.data();
    
    // Calculate Advance Payment Amount
    const totalPayable = quote?.total_payable || 0;
    const advanceAmount = Math.round(totalPayable * ADVANCE_PERCENTAGE);

    if (advanceAmount <= 0) {
      return ApiResponse.badRequest("Invalid quotation amount");
    }

    // Save advance amount intent to lead
    await leadRef.update({
      advance_payment_amount: advanceAmount,
      payment_status: "pending"
    });

    // MOCK RAZORPAY INSTANCE (Uncomment and configure actual razorpay in production)
    /*
    const instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await instance.orders.create({
      amount: advanceAmount * 100, // Amount in paise
      currency: "INR",
      receipt: `receipt_${lead_id}_${quote_id}`,
      notes: {
        lead_id,
        quote_id,
        type: "advance_booking"
      }
    });
    */

    const mockOrder = {
      id: `order_mock_${Date.now()}`,
      amount: advanceAmount * 100,
      currency: "INR",
    };

    // Return or redirect to a payment page that mounts the Razorpay checkout script
    // For now, redirect to a mock success page that calls our webhook or just returns JSON
    
    if (request.headers.get("accept")?.includes("text/html")) {
      // Temporary redirect to a mock payment checkout page, or we can just redirect straight to a success page to simulate payment
      // For testing workflow, we'll simulate an immediate success webhook call
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
      return Response.redirect(`${baseUrl}/api/payment/mock-success?lead_id=${lead_id}&quote_id=${quote_id}`);
    }

    return ApiResponse.success({ order: mockOrder, advanceAmount });

  } catch (error: any) {
    console.error("Create order error:", error);
    return ApiResponse.error("Internal Server Error", "INTERNAL_ERROR", 500, error.message);
  }
}
