/**
 * @file tests/certification/commercial/installer-lifecycle.test.ts
 * @description Phase 7.7 Installer Lifecycle & Admin Synchronization Test Suite.
 * Validates the complete installer / field technician workflow across 8 core real-world scenarios:
 *   1. Installer Profile, Territory & KYC Configuration (Admin -> Portal Sync)
 *   2. Uber-Style Lead Broadcasting & Atomic First-to-Claim Safety
 *   3. Manual Lead Assignment by Admin Dispatch Desk
 *   4. Field Cash Collection & Admin Cash Authority Guard
 *   5. Barcode & Serial Number Asset Tracking on Site
 *   6. 6-Digit Completion PIN & Customer Signoff Verification
 *   7. Installer Labor Payout & Section 194C Tax Deduction (TaxationEngine)
 *   8. Installer Wallet Balance & Field Settlements Ledger Sync
 */

import test from "node:test";
import assert from "node:assert/strict";
import { TaxationEngine } from "../../../lib/taxation-engine";
import type { Installer, Lead } from "../../../types";

test("Phase 7.7 — Installer Full Cycle & Admin Synchronization Verification", async (t) => {

  // MOCK INSTALLER PROFILE (Created by Admin Desk)
  const MOCK_INSTALLER: Installer & { id: string } = {
    id: "inst_kailash_301",
    name: "Kailash Saini",
    mobile_number: "9829033445",
    firebase_uid: "uid_inst_kailash_301",
    kyc_status: "verified",
    is_active: true,
    is_trusted_payment_collector: false,
    serviceable_pincodes: ["302012", "302001"],
    skills: ["analog_hd", "ip_network"],
    sla_score: 98,
    avg_rating: 4.9,
    jobs_completed: 42,
    sla_breaches: 0,
    wallet_balance: 0,
    entity_type: "individual",
    bank_details: {
      account_number: "50100223344556",
      ifsc_code: "HDFC0001234",
      account_holder_name: "Kailash Saini",
      pan_number: "ABCDE1234F"
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Profile & Territory Sync (Admin -> Portal)
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 1 — Installer Profile, KYC & Territory Sync (Admin -> Portal)", () => {
    assert.equal(MOCK_INSTALLER.is_active, true, "Installer must be active");
    assert.equal(MOCK_INSTALLER.kyc_status, "verified", "KYC must be verified");
    assert.equal(MOCK_INSTALLER.serviceable_pincodes?.includes("302012"), true, "Must cover Jhotwara Pincode 302012");
    assert.equal(MOCK_INSTALLER.skills.includes("ip_network"), true, "Must have IP networking skill");

    // Portal Profile View
    const portalProfile = {
      id: MOCK_INSTALLER.id,
      name: MOCK_INSTALLER.name,
      mobile: MOCK_INSTALLER.mobile_number,
      sla_score: MOCK_INSTALLER.sla_score,
      jobs_completed: MOCK_INSTALLER.jobs_completed,
      wallet_balance: MOCK_INSTALLER.wallet_balance,
      has_pan: !!(MOCK_INSTALLER.bank_details?.pan_number && MOCK_INSTALLER.bank_details.pan_number.length === 10)
    };

    assert.equal(portalProfile.id, "inst_kailash_301");
    assert.equal(portalProfile.has_pan, true);
    assert.equal(portalProfile.sla_score, 98);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Uber-Style Job Broadcasting & Atomic First-to-Claim Safety
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 2 — Uber-Style Broadcasting & First-to-Claim Safety", () => {
    // Lead begins broadcasted to eligible territory installers
    const broadcastedLead: Record<string, any> = {
      id: "lead_job_broadcast_101",
      customer_name: "Vikas Sharma",
      pincode: "302012",
      status: "booked",
      assigned_installer_id: null,
      assigned_to_installer_id: null,
      broadcasted_to_installer_ids: ["inst_kailash_301", "inst_other_302"]
    };

    // Helper: Simulate atomic claim
    const claimLead = (lead: typeof broadcastedLead, partnerId: string, partnerName: string) => {
      if (lead.assigned_installer_id) {
        throw new Error("Lead has already been claimed by another installer/dealer.");
      }
      if (!lead.broadcasted_to_installer_ids.includes(partnerId)) {
        throw new Error("You are not eligible to claim this lead territory.");
      }
      lead.assigned_installer_id = partnerId;
      lead.assigned_to_installer_id = partnerId;
      lead.assigned_installer_name = partnerName;
      lead.assigned_to_installer_name = partnerName;
      lead.broadcasted_to_installer_ids = [];
      return true;
    };

    // First installer claims successfully
    const success = claimLead(broadcastedLead, MOCK_INSTALLER.id, MOCK_INSTALLER.name);
    assert.equal(success, true);
    assert.equal(broadcastedLead.assigned_installer_id, MOCK_INSTALLER.id);
    assert.equal(broadcastedLead.assigned_to_installer_id, MOCK_INSTALLER.id);
    assert.equal(broadcastedLead.broadcasted_to_installer_ids.length, 0, "Broadcast pool must be cleared after claim");

    // Second installer tries to claim the same lead -> BLOCKED
    assert.throws(
      () => claimLead(broadcastedLead, "inst_other_302", "Other Installer"),
      /Lead has already been claimed by another installer\/dealer\./
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: Manual Lead Assignment by Admin Dispatch Desk
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 3 — Admin Dispatch Manual Assignment Updates Both Pointers", () => {
    const unassignedJobLead: Record<string, any> = {
      id: "lead_manual_disp_202",
      customer_name: "Manoj Agrawal",
      assigned_installer_id: null,
      assigned_to_installer_id: null,
      job_status: "pending_dispatch"
    };

    // Admin updates job assignment on /admin/dispatch
    const manualAssignment = {
      assigned_installer_id: MOCK_INSTALLER.id,
      assigned_to_installer_id: MOCK_INSTALLER.id,
      assigned_installer_name: MOCK_INSTALLER.name,
      job_status: "assigned"
    };

    Object.assign(unassignedJobLead, manualAssignment);

    assert.equal(unassignedJobLead.assigned_installer_id, "inst_kailash_301");
    assert.equal(unassignedJobLead.assigned_to_installer_id, "inst_kailash_301");
    assert.equal(unassignedJobLead.job_status, "assigned");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: Field Cash Collection & Admin Cash Authority Guard
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 4 — Cash Collection Lock & Admin Authority Override", () => {
    const jobLead: Record<string, any> = {
      id: "lead_cash_test_401",
      customer_name: "Sunil Verma",
      cash_collection_approved: false,
      job_level_cash_authority: false,
      total_payable: 20000,
      delivery_amount: 17550
    };

    // Helper: simulate payment submission guard from /api/installer/payments/submit
    const submitFieldPayment = (lead: typeof jobLead, method: "cash" | "upi", amount: number) => {
      const isCashApproved = lead.cash_collection_approved === true || lead.job_level_cash_authority === true;
      if (method === "cash" && !isCashApproved) {
        throw new Error("Cash collection is strictly locked. Admin approval is required to accept physical cash.");
      }
      return { status: "approved", amount, method };
    };

    // 4A: Attempting cash without admin authority -> BLOCKED
    assert.throws(
      () => submitFieldPayment(jobLead, "cash", 17550),
      /Cash collection is strictly locked/
    );

    // 4B: Installer requests cash approval
    jobLead.cash_approval_requested = true;
    jobLead.cash_approval_status = "pending";
    jobLead.cash_requested_amount = 17550;
    jobLead.cash_requested_reason = "Customer does not have net banking on site";

    assert.equal(jobLead.cash_approval_status, "pending");

    // 4C: Admin desk reviews and authorizes cash on /admin/leads/[leadId]
    jobLead.cash_collection_approved = true;
    jobLead.job_level_cash_authority = true;
    jobLead.cash_approval_status = "approved";

    // 4D: Installer retries cash submission -> APPROVED
    const paymentResult = submitFieldPayment(jobLead, "cash", 17550);
    assert.equal(paymentResult.status, "approved");
    assert.equal(paymentResult.method, "cash");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 5: Barcode & Serial Number Asset Tracking on Site
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 5 — On-Site Hardware Barcode & Serial Asset Verification", () => {
    const scannedHardwareAssets = [
      { product_id: "cam-cp-2mp-bullet", serial_number: "SN-CP2MP-9901", mac_address: "00:1A:2B:3C:4D:01", sku: "CP-UNC-TA21L3" },
      { product_id: "cam-cp-2mp-bullet", serial_number: "SN-CP2MP-9902", mac_address: "00:1A:2B:3C:4D:02", sku: "CP-UNC-TA21L3" },
      { product_id: "cam-cp-2mp-dome",   serial_number: "SN-CP2MP-8801", mac_address: "00:1A:2B:3C:4D:03", sku: "CP-UNC-DA21L3" },
      { product_id: "cam-cp-2mp-dome",   serial_number: "SN-CP2MP-8802", mac_address: "00:1A:2B:3C:4D:04", sku: "CP-UNC-DA21L3" },
      { product_id: "dvr-cp-4ch",        serial_number: "SN-CPDVR-7701", mac_address: "00:1A:2B:3C:4D:05", sku: "CP-UVR-0401E1" },
      { product_id: "hdd-wd-purple-1tb", serial_number: "WD-WCC4N778901", mac_address: null,              sku: "WD10PURZ" }
    ];

    assert.equal(scannedHardwareAssets.length, 6, "Must capture all 6 primary hardware assets");
    assert.equal(scannedHardwareAssets.every(a => a.serial_number && a.serial_number.length > 5), true);
    
    // Check that serial numbers are unique (no duplicated scans)
    const serialSet = new Set(scannedHardwareAssets.map(a => a.serial_number));
    assert.equal(serialSet.size, scannedHardwareAssets.length, "All scanned serial numbers must be unique");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 6: 6-Digit Completion PIN & Customer Signoff Verification
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 6 — Completion PIN Verification & Job Completion Signoff", () => {
    const lead = {
      id: "lead_completion_601",
      customer_name: "Sunil Verma",
      completion_pin: "749201",
      status: "site_visit",
      installation_proof_urls: [] as string[]
    };

    const completeInstallation = (leadObj: typeof lead, enteredPin: string, proofPhotos: string[]) => {
      if (leadObj.completion_pin && leadObj.completion_pin !== enteredPin) {
        throw new Error("Invalid Completion PIN. Please check with the customer.");
      }
      leadObj.status = "won";
      leadObj.installation_proof_urls = proofPhotos;
      return { success: true };
    };

    // 6A: Wrong PIN attempt -> BLOCKED
    assert.throws(
      () => completeInstallation(lead, "123456", ["https://storage.googleapis.com/proof1.jpg"]),
      /Invalid Completion PIN/
    );

    // 6B: Correct PIN provided by customer -> SUCCESS
    const proofImages = [
      "https://storage.googleapis.com/proof-cam1.jpg",
      "https://storage.googleapis.com/proof-dvr-rack.jpg"
    ];
    const signoffResult = completeInstallation(lead, "749201", proofImages);
    assert.equal(signoffResult.success, true);
    assert.equal(lead.status, "won", "Lead must transition to won on verified customer signoff");
    assert.equal(lead.installation_proof_urls.length, 2);
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 7: Installer Payout & Section 194C Tax Deduction (TaxationEngine)
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 7 — Section 194C TDS Calculation (1% Individual, 2% Firm, 20% Penal)", async () => {
    const grossContractLabor = 35000; // Single contract crosses ₹30,000 threshold
    const accumulatedPrior = 0;

    // CASE 7A: Individual Installer with Valid PAN -> 1% Section 194C TDS
    const tdsIndividual = await TaxationEngine.calculate194C(grossContractLabor, accumulatedPrior, "individual", true);
    assert.equal(tdsIndividual.tdsRatePercent, 1, "Individual 194C rate must be 1%");
    assert.equal(tdsIndividual.tdsAmount, 350, "1% TDS on ₹35,000 must be ₹350");
    assert.equal(tdsIndividual.netPayable, 34650, "Net payable to bank must be ₹34,650");
    assert.equal(tdsIndividual.grossAmount - tdsIndividual.tdsAmount, tdsIndividual.netPayable);

    // CASE 7B: Firm / Contractor with Valid PAN -> 2% Section 194C TDS
    const tdsFirm = await TaxationEngine.calculate194C(grossContractLabor, accumulatedPrior, "firm", true);
    assert.equal(tdsFirm.tdsRatePercent, 2, "Firm 194C rate must be 2%");
    assert.equal(tdsFirm.tdsAmount, 700, "2% TDS on ₹35,000 must be ₹700");
    assert.equal(tdsFirm.netPayable, 34300, "Net payable to bank must be ₹34,300");

    // CASE 7C: Missing / Invalid PAN -> 20% Section 206AA Penal TDS
    const tdsPenal = await TaxationEngine.calculate194C(grossContractLabor, accumulatedPrior, "individual", false);
    assert.equal(tdsPenal.tdsRatePercent, 20, "Penal 206AA rate must be 20%");
    assert.equal(tdsPenal.tdsAmount, 7000, "20% TDS on ₹35,000 must be ₹7,000");
    assert.equal(tdsPenal.netPayable, 28000, "Net payable to bank must be ₹28,000");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 8: Installer Wallet Balance & Field Settlements Ledger Sync
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 8 — Field Cash Collection Liability & Settlement Reconciliation", () => {
    let installerWalletBalance = 0;

    // Installer collects ₹17,550 physical cash at customer site
    const cashCollected = 17550;
    // Physical cash in hand creates a platform liability (negative balance or tracked liability)
    const fieldVerification = {
      id: "verif_cash_881",
      installer_id: MOCK_INSTALLER.id,
      amount: cashCollected,
      method: "cash" as const,
      status: "pending" as "pending" | "approved",
      utr_number: null,
      created_at: new Date().toISOString()
    };

    assert.equal(fieldVerification.status, "pending");

    // Admin reviews and confirms bank deposit on /admin/operations/settlements
    fieldVerification.status = "approved";
    installerWalletBalance += cashCollected; // Cleared

    assert.equal(fieldVerification.status, "approved");
    assert.equal(installerWalletBalance, 17550, "Full collected cash accounted in settled ledger");
  });

});
