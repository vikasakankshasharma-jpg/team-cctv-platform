import { adminDb } from "./firebase-admin";

/**
 * KYC Service connecting to Razorpay Validation APIs (or fallback mock for local dev)
 * In production, this uses Razorpay /v1/verification/pan and /v1/verification/gst
 */
export class KycService {
  private static getHeaders() {
    const keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!keyId || !keySecret) {
      throw new Error("Razorpay credentials missing");
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    return {
      "Content-Type": "application/json",
      "Authorization": `Basic ${auth}`
    };
  }

  /**
   * Verifies a PAN number with Govt databases via Razorpay.
   */
  static async verifyPAN(pan: string, expectedName?: string): Promise<{ valid: boolean; registeredName?: string; message?: string }> {
    try {
      const isTestMode = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").includes("test_");
      
      if (isTestMode) {
        // MOCK FOR LOCAL/TEST MODE
        console.log("[KYC Service] MOCK PAN Validation for:", pan);
        if (pan === "ABCDE1234F") { // Example known fake
          return { valid: false, message: "Invalid PAN format or not found in DB" };
        }
        return { valid: true, registeredName: expectedName || "TEST USER" };
      }

      // PROD: Razorpay PAN Validation Endpoint
      const res = await fetch("https://api.razorpay.com/v1/verification/pan", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          pan: pan,
          consent: "Y",
          reason: "Tax compliance (TDS) verification for partner payouts"
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.description || "Validation API failed");
      }

      const data = await res.json();
      
      // Expected Razorpay Response: { status: "active", registered_name: "JOHN DOE" }
      const valid = data.status === "active";
      
      return {
        valid: valid,
        registeredName: data.registered_name,
        message: valid ? "PAN is valid" : "PAN is inactive or invalid"
      };

    } catch (e: any) {
      console.error("[KYC Service Error]:", e);
      throw new Error(e.message || "Failed to verify PAN");
    }
  }

  /**
   * Verifies a GSTIN with Govt databases via Razorpay.
   */
  static async verifyGST(gstin: string): Promise<{ valid: boolean; legalName?: string; tradeName?: string; address?: string; message?: string }> {
    try {
      const isTestMode = (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "").includes("test_");
      
      if (isTestMode) {
        console.log("[KYC Service] MOCK GST Validation for:", gstin);
        return { 
          valid: true, 
          legalName: "MOCK ENTERPRISES PVT LTD", 
          tradeName: "Mock Traders",
          address: "123 Test St, Delhi, 110001" 
        };
      }

      // PROD: Razorpay GSTIN Validation Endpoint
      const res = await fetch("https://api.razorpay.com/v1/verification/gstin", {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify({
          gstin: gstin,
          consent: "Y",
          reason: "B2B Vendor onboarding verification"
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error?.description || "Validation API failed");
      }

      const data = await res.json();
      
      const valid = data.status === "active";
      
      return {
        valid: valid,
        legalName: data.legal_name,
        tradeName: data.trade_name,
        address: data.principal_place_of_business?.address,
        message: valid ? "GSTIN is valid" : "GSTIN is inactive"
      };

    } catch (e: any) {
      console.error("[KYC Service Error]:", e);
      throw new Error(e.message || "Failed to verify GSTIN");
    }
  }
}
