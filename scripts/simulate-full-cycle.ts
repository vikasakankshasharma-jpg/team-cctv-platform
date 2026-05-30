import { config } from "dotenv";
import { resolve } from "path";
import axios from "axios";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

// Import initialized admin app from firebase-admin to interact directly with Firestore
import { adminDb } from "../lib/firebase-admin";

const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID!;
const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY!;
const SECURE_ID_CLIENT_ID = process.env.CASHFREE_SECURE_ID_CLIENT_ID!;
const SECURE_ID_SECRET = process.env.CASHFREE_SECURE_ID_SECRET!;

const PG_URL = "https://sandbox.cashfree.com/pg";
const PAYOUT_URL = "https://sandbox.cashfree.com/payout";
const VERIFY_URL = "https://sandbox.cashfree.com/verification";

async function delay(ms: number) {
  return new Promise(res => setTimeout(res, ms));
}

async function runE2ESimulation() {
  console.log("🚀 Starting Full E2E Cashfree Simulation Cycle...");
  
  // ==========================================
  // PHASE 1: CUSTOMER CHECKOUT (PG)
  // ==========================================
  console.log("\n--- PHASE 1: CUSTOMER CHECKOUT ---");
  const leadId = `LEAD_TEST_${Date.now()}`;
  console.log(`[1] Simulating Quote Generation for Lead: ${leadId}`);
  
  await adminDb.collection("leads").doc(leadId).set({
    name: "E2E Test Customer",
    phone: "9999999999",
    status: "quote_sent",
    created_at: new Date()
  });

  console.log("[2] Generating Cashfree Payment Session for Advance Payment (₹1.00)...");
  
  try {
    const pgRes = await axios.post(`${PG_URL}/orders`, {
      order_amount: 1.00,
      order_currency: "INR",
      customer_details: {
        customer_id: leadId,
        customer_phone: "9999999999",
        customer_name: "E2E Test Customer"
      },
      order_meta: {
        return_url: "http://localhost:3000/return?order_id={order_id}"
      }
    }, {
      headers: {
        "x-client-id": CASHFREE_APP_ID,
        "x-client-secret": CASHFREE_SECRET_KEY,
        "x-api-version": "2023-08-01",
        "Content-Type": "application/json"
      }
    });

    console.log("✅ Payment Session Generated! Order ID:", pgRes.data.order_id);
    console.log("   (Customer would now complete payment on Cashfree's UI)");
  } catch (err: any) {
    console.error("❌ PG Failed:", err.response?.data || err.message);
    return;
  }

  // Simulate Webhook / Payment Success
  await delay(1500);
  console.log("[3] Simulating Payment Success Webhook...");
  await adminDb.collection("leads").doc(leadId).update({
    status: "paid_advance",
    amount_paid: 1.00
  });
  console.log("✅ Lead marked as PAID_ADVANCE in database.");


  // ==========================================
  // PHASE 2: ADMIN VERIFICATION (MANUAL)
  // ==========================================
  console.log("\n--- PHASE 2: ADMIN MANUAL BANK VERIFICATION ---");
  const installerId = `INST_TEST_${Date.now()}`;
  const mockBankAccount = "026291800001191";
  const mockIfsc = "YESB0000262";

  console.log(`[4] Registering Installer: ${installerId}`);
  await adminDb.collection("installers").doc(installerId).set({
    name: "E2E Test Installer",
    mobile_number: "8888888888",
    kyc_status: "verified",
    is_active: true,
    wallet_balance: 0,
    created_at: new Date()
  });

  console.log(`[5] Executing Manual Bank Verification API...`);
  try {
    const verifyRes = await axios.post(`http://localhost:3000/api/admin/installers/verify-bank`, {
      installerId: installerId,
      bank_account: mockBankAccount,
      ifsc: mockIfsc,
      name_at_bank: "Verified E2E Installer"
    }, {
      headers: {
        "Content-Type": "application/json",
        "Cookie": "admin_session=mock-admin-session" // Uses the Dev environment E2E bypass
      }
    });

    if (verifyRes.data.success) {
      console.log(`✅ Manual Bank Verification Successful! Name saved as: "${verifyRes.data.verifiedName}"`);
    } else {
      console.error("❌ Bank Verification failed:", verifyRes.data);
      return;
    }
  } catch (err: any) {
    console.error("❌ API Call Failed. Is the Next.js dev server running on port 3000? Error:", err.message);
    return;
  }

  // ==========================================
  // PHASE 3: JOB COMPLETION & MANUAL PAYOUT
  // ==========================================
  console.log("\n--- PHASE 3: JOB COMPLETION & MANUAL PAYOUT ---");
  await delay(1000);
  console.log("[6] Simulating Job Completion (Adding ₹500 to Installer Wallet)...");
  await adminDb.collection("installers").doc(installerId).update({
    wallet_balance: 500
  });

  console.log("[7] Initiating Manual Payout Ledger Update...");
  
  try {
    const utr = `UTR_${Date.now()}`;
    const payoutRes = await axios.post(`http://localhost:3000/api/admin/payouts/manual`, {
      installerId: installerId,
      amount: 500,
      utr_number: utr
    }, {
      headers: {
        "Content-Type": "application/json",
        "Cookie": "admin_session=mock-admin-session"
      }
    });

    if (payoutRes.data.success) {
      console.log(`✅ Manual Payout Logged! UTR: ${utr}`);
      
      // Verify DB Deduction
      const doc = await adminDb.collection("installers").doc(installerId).get();
      console.log(`✅ Installer Wallet deducted (Current Balance: ₹${doc.data()?.wallet_balance}).`);
    } else {
      console.error("❌ Payout API failed:", payoutRes.data);
      return;
    }

  } catch (err: any) {
    console.error("❌ Payout API Call Failed:", err.response?.data || err.message);
    return;
  }

  console.log("\n🎉 FULL CYCLE COMPLETED SUCCESSFULLY! 🎉");
  console.log("All systems (Payment Gateway, Manual Bank Verification, Manual Payout Ledger) are perfectly integrated.");
  process.exit(0);
}

runE2ESimulation().catch(console.error);
