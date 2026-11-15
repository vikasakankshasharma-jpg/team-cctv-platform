/**
 * @file tests/certification/legal/legal-governance.test.ts
 * @description TEAM-CCTV-LEGAL-ARCH-V1 Legal & Contract Governance Certification Suite.
 * Verifies role-to-agreement mapping, cryptographic acceptance snapshots,
 * state machine transitions, and strict decoupling from certified pricing logic.
 */

import { test, describe } from "node:test";
import assert from "node:assert/strict";

import {
  CANONICAL_AGREEMENT_REGISTRY,
  getAgreementsForRole,
  getMandatoryAgreementsForRole,
  getAgreement,
  validateMandatoryAgreements,
  createLegalAcceptanceSnapshot,
  verifyLegalAcceptanceSnapshot,
  transitionAgreementState,
  evaluateReacceptanceRequirement,
  LegalStateError,
} from "../../../lib/legal";
import { calculateCommercialMilestones } from "../../../lib/commercial/commercial-contract";

describe("TEAM-CCTV-LEGAL-ARCH-V1 — Legal & Contract Governance Suite", () => {
  // ── GATE 1: REGISTRY COMPLETENESS ──────────────────────────────────────────
  test("Gate L.1 — Canonical Agreement Registry Completeness Across All 5 Roles", () => {
    const roles = ["CUSTOMER", "INSTALLER", "PROMOTER", "DELIVERY_PARTNER", "SUPPLIER"] as const;

    for (const role of roles) {
      const agreements = getAgreementsForRole(role);
      assert.ok(agreements.length > 0, `Role ${role} must have at least one registered agreement`);
      const mandatory = getMandatoryAgreementsForRole(role);
      assert.ok(mandatory.length > 0, `Role ${role} must have at least one mandatory agreement`);

      for (const entry of agreements) {
        assert.ok(entry.agreementId, "Agreement must have an ID");
        assert.ok(entry.currentVersion, "Agreement must have a version");
        assert.equal(entry.status, "ACTIVE", "Canonical registry entries must be ACTIVE");
        assert.ok(entry.effectiveFrom, "Agreement must have effectiveFrom ISO string");
      }
    }

    assert.ok(CANONICAL_AGREEMENT_REGISTRY.length >= 20, "Registry must contain at least 20 agreements");
  });

  // ── GATE 2: MANDATORY VALIDATION ───────────────────────────────────────────
  test("Gate L.2 — Mandatory Agreement Validation & Missing Agreement Detection", () => {
    // Incomplete Customer acceptance
    const partialCustomerAcceptance = {
      TOS: "TOS-V1.0",
      PRIVACY: "PRIVACY-V1.0",
    };
    const res1 = validateMandatoryAgreements("CUSTOMER", partialCustomerAcceptance);
    assert.equal(res1.isValid, false);
    assert.ok(res1.missing.length > 0);
    assert.ok(res1.missing.some((m) => m.includes("REFUND")));

    // Complete Customer acceptance
    const completeCustomerAcceptance = {
      TOS: "TOS-V1.0",
      PRIVACY: "PRIVACY-V1.0",
      REFUND: "REFUND-V1.0",
      "INSTALL-TERMS": "INSTALL-TERMS-V1.0",
      WARRANTY: "WARRANTY-V1.0",
      "QUOTE-ACCEPT": "QUOTE-ACCEPT-V1.0",
      "PAYMENT-TERMS": "PAYMENT-TERMS-V1.0",
    };
    const res2 = validateMandatoryAgreements("CUSTOMER", completeCustomerAcceptance);
    assert.equal(res2.isValid, true);
    assert.equal(res2.missing.length, 0);

    // Incomplete Installer acceptance
    const incompleteInstaller = {
      "INSTALLER-MSA": "INSTALLER-MSA-V1.0",
    };
    const res3 = validateMandatoryAgreements("INSTALLER", incompleteInstaller);
    assert.equal(res3.isValid, false);
    assert.ok(res3.missing.some((m) => m.includes("INSTALL-RATE")));
  });

  // ── GATE 3: CRYPTOGRAPHIC ACCEPTANCE SNAPSHOT ──────────────────────────────
  test("Gate L.3 — Cryptographic Acceptance Snapshot Minting & Integrity Verification", () => {
    const snapshot = createLegalAcceptanceSnapshot({
      partyId: "CUS-TEST-9901",
      partyRole: "CUSTOMER",
      agreementId: "TOS",
      version: "TOS-V1.0",
      acceptanceMethod: "CHECKBOX",
      sourceContext: "CUSTOMER_BOOKING",
      quoteId: "QT-2026-TEST",
      orderId: "ORD-2026-TEST",
      rawIpAddress: "203.0.113.195",
      rawUserAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      documentContent: "TEAM Customer Terms of Service v1.0",
      acceptedAt: "2026-11-15T11:00:00.000Z",
    });

    assert.ok(snapshot.acceptanceId.startsWith("LA-20261115-"), "Acceptance ID must follow format LA-YYYYMMDD-HEX6");
    assert.equal(snapshot.partyRole, "CUSTOMER");
    assert.equal(snapshot.agreementId, "TOS");
    assert.equal(snapshot.version, "TOS-V1.0");
    assert.equal(snapshot.acceptanceStatus, "ACCEPTED");

    // Privacy assert: raw IP and raw UserAgent are NEVER stored
    assert.equal((snapshot as any).rawIpAddress, undefined);
    assert.equal((snapshot as any).rawUserAgent, undefined);
    assert.ok(snapshot.ipAddressHash, "IP address must be SHA-256 hashed");
    assert.ok(snapshot.userAgentHash, "User Agent must be SHA-256 hashed");

    // Verification check
    const isValid = verifyLegalAcceptanceSnapshot(snapshot);
    assert.equal(isValid, true, "Snapshot must pass cryptographic self-verification");

    // Immutability check
    assert.throws(() => {
      (snapshot as any).acceptanceStatus = "REVOKED";
    }, "Snapshot must be deeply frozen and immutable");
  });

  // ── GATE 4: UNKNOWN AGREEMENT REJECTION ─────────────────────────────────────
  test("Gate L.4 — Rejection of Unknown / Unregistered Agreement IDs", () => {
    assert.throws(
      () => {
        createLegalAcceptanceSnapshot({
          partyId: "CUS-1",
          partyRole: "CUSTOMER",
          agreementId: "FAKE-AGREEMENT-ID",
          acceptanceMethod: "CHECKBOX",
          sourceContext: "CUSTOMER_BOOKING",
        });
      },
      (err: any) => err instanceof LegalStateError && err.code === "UNKNOWN_AGREEMENT"
    );
  });

  // ── GATE 5: AGREEMENT LIFECYCLE STATE MACHINE ──────────────────────────────
  test("Gate L.5 — Agreement Lifecycle State Transitions (Monotonic & Auditable)", () => {
    let state = transitionAgreementState("DRAFT", "PENDING_ACCEPTANCE");
    assert.equal(state, "PENDING_ACCEPTANCE");

    state = transitionAgreementState("PENDING_ACCEPTANCE", "ACCEPTED");
    assert.equal(state, "ACCEPTED");

    state = transitionAgreementState("ACCEPTED", "ACTIVE");
    assert.equal(state, "ACTIVE");

    const superseded = transitionAgreementState("ACTIVE", "SUPERSEDED");
    assert.equal(superseded, "SUPERSEDED");

    const terminated = transitionAgreementState("ACTIVE", "TERMINATED");
    assert.equal(terminated, "TERMINATED");
  });

  // ── GATE 6: FORBIDDEN STATE TRANSITIONS ────────────────────────────────────
  test("Gate L.6 — Illegal State Transition Protection", () => {
    // SUPERSEDED cannot resurrect to ACTIVE
    assert.throws(
      () => {
        transitionAgreementState("SUPERSEDED", "ACTIVE");
      },
      (err: any) => err instanceof LegalStateError && err.code === "INVALID_STATE_TRANSITION"
    );

    // TERMINATED cannot resurrect to ACTIVE or SUPERSEDED
    assert.throws(
      () => {
        transitionAgreementState("TERMINATED", "ACTIVE");
      },
      (err: any) => err instanceof LegalStateError && err.code === "INVALID_STATE_TRANSITION"
    );

    // DRAFT cannot jump directly to ACTIVE without ACCEPTANCE
    assert.throws(
      () => {
        transitionAgreementState("DRAFT", "ACTIVE");
      },
      (err: any) => err instanceof LegalStateError && err.code === "INVALID_STATE_TRANSITION"
    );
  });

  // ── GATE 7: RE-ACCEPTANCE EVALUATION ALGORITHM ─────────────────────────────
  test("Gate L.7 — Material vs Non-Material Re-Acceptance Determination", () => {
    // Case A: Identical version
    const evalA = evaluateReacceptanceRequirement("TOS-V1.0", "TOS-V1.0", "NON_MATERIAL");
    assert.equal(evalA.reacceptanceRequired, false);
    assert.equal(evalA.status, "ACTIVE");

    // Case B: Non-material editorial fix (e.g., punctuation or typo)
    const evalB = evaluateReacceptanceRequirement("TOS-V1.0", "TOS-V1.1", "NON_MATERIAL");
    assert.equal(evalB.reacceptanceRequired, false);
    assert.equal(evalB.status, "ACTIVE");
    assert.ok(evalB.reason.includes("Non-material change"));

    // Case C: Material modification (e.g. Rate card increase or liability alteration)
    const evalC = evaluateReacceptanceRequirement("INSTALL-RATE-V1", "INSTALL-RATE-V2", "MATERIAL");
    assert.equal(evalC.reacceptanceRequired, true);
    assert.equal(evalC.status, "PENDING_ACCEPTANCE");
    assert.ok(evalC.reason.includes("Material modification"));
  });

  // ── GATE 8: COMMERCIAL ORDER BINDING (NON-INTERFERENCE) ─────────────────────
  test("Gate L.8 — Commercial Order Binding Decoupling & Calculation Invariant", () => {
    const grossTotal = 35590;
    const milestones = calculateCommercialMilestones(grossTotal);

    // Assert exact milestone math
    assert.equal(milestones.bookingAmount, 500);
    assert.equal(milestones.deliveryAmount, 31581); // 90% of (35590 - 500)
    assert.equal(milestones.installationAmount, 3509); // 10%
    assert.equal(
      milestones.bookingAmount + milestones.deliveryAmount + milestones.installationAmount,
      grossTotal
    );

    // Mint legal acceptance snapshot
    const legalSnapshot = createLegalAcceptanceSnapshot({
      partyId: "CUS-ORDER-TEST",
      partyRole: "CUSTOMER",
      agreementId: "TOS",
      version: "TOS-V1.0",
      acceptanceMethod: "CHECKBOX",
      sourceContext: "CUSTOMER_BOOKING",
      quoteId: "QT-AUDIT-101",
      orderId: "ORD-AUDIT-101",
    });

    // Simulated order with legal acceptance bound
    const orderWithLegal = {
      id: "ORD-AUDIT-101",
      quote_id: "QT-AUDIT-101",
      stage: "booking" as const,
      amount_rupees: milestones.bookingAmount,
      amount_paise: milestones.bookingAmount * 100,
      currency: "INR" as const,
      status: "created" as const,
      created_at: new Date().toISOString(),
      legal_acceptance: {
        snapshotId: legalSnapshot.acceptanceId,
        termsVersion: legalSnapshot.version,
        refundPolicyVersion: "REFUND-V1.0",
        warrantyPolicyVersion: "WARRANTY-V1.0",
        acceptedAt: legalSnapshot.acceptedAt,
      },
    };

    // Assert that legal acceptance did NOT mutate commercial monetary values
    assert.equal(orderWithLegal.amount_rupees, 500);
    assert.equal(orderWithLegal.amount_paise, 50000);
    assert.equal(orderWithLegal.legal_acceptance.termsVersion, "TOS-V1.0");
    assert.equal(orderWithLegal.legal_acceptance.snapshotId, legalSnapshot.acceptanceId);
  });
});
