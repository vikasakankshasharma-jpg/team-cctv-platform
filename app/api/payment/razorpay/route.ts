import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { amount, currency = "INR", receipt, notes } = body;

    // Use dummy keys if environment variables are not set yet
    const key_id = process.env.RAZORPAY_KEY_ID || "rzp_test_dummy_key_123456";
    const key_secret = process.env.RAZORPAY_KEY_SECRET || "dummy_secret_1234567890";

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: Math.round(amount * 100), // Razorpay amount is in paise
      currency,
      receipt: receipt || `rcpt_${crypto.randomBytes(4).toString("hex")}`,
      notes,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      order,
      key_id // Return public key to frontend
    });
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
