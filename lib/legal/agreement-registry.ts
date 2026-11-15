/**
 * @file lib/legal/agreement-registry.ts
 * @description TEAM-CCTV-LEGAL-ARCH-V1 Canonical Legal Agreement Registry.
 * Central governance registry mapping all stakeholders (Customer, Installer, Promoter,
 * Delivery Partner, Supplier) to their versioned agreements.
 */

import type { AgreementRegistryEntry, PartyRole } from "./legal-types";

export const CANONICAL_AGREEMENT_REGISTRY: readonly AgreementRegistryEntry[] = Object.freeze([
  // ── 1. CUSTOMER ─────────────────────────────────────────────────────────────
  {
    agreementId: "TOS",
    agreementType: "CUSTOMER_TERMS",
    role: "CUSTOMER",
    currentVersion: "TOS-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Customer Terms of Service",
    isMandatory: true,
  },
  {
    agreementId: "PRIVACY",
    agreementType: "DATA_PROTECTION",
    role: "CUSTOMER",
    currentVersion: "PRIVACY-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Privacy & Data Protection Policy (DPDP Act & Rules 2025)",
    isMandatory: true,
  },
  {
    agreementId: "REFUND",
    agreementType: "REFUND_CANCELLATION",
    role: "CUSTOMER",
    currentVersion: "REFUND-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Refund & Cancellation Policy (E-Commerce Rules 2020)",
    isMandatory: true,
  },
  {
    agreementId: "INSTALL-TERMS",
    agreementType: "INSTALLATION_TERMS",
    role: "CUSTOMER",
    currentVersion: "INSTALL-TERMS-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "On-Site Installation & Physical Survey Terms",
    isMandatory: true,
  },
  {
    agreementId: "WARRANTY",
    agreementType: "WARRANTY_TERMS",
    role: "CUSTOMER",
    currentVersion: "WARRANTY-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Manufacturer Hardware & 1-Year Workmanship Warranty",
    isMandatory: true,
  },
  {
    agreementId: "QUOTE-ACCEPT",
    agreementType: "COMMERCIAL_QUOTE_ACCEPTANCE",
    role: "CUSTOMER",
    currentVersion: "QUOTE-ACCEPT-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Provisional Quotation Acceptance",
    isMandatory: true,
  },
  {
    agreementId: "PAYMENT-TERMS",
    agreementType: "PAYMENT_MILESTONE_TERMS",
    role: "CUSTOMER",
    currentVersion: "PAYMENT-TERMS-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Milestone Payment Slabs & Token Booking Terms",
    isMandatory: true,
  },

  // ── 2. INSTALLER ────────────────────────────────────────────────────────────
  {
    agreementId: "INSTALLER-MSA",
    agreementType: "PARTNER_MSA",
    role: "INSTALLER",
    currentVersion: "INSTALLER-MSA-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Installer Master Service Agreement (Independent Contractor)",
    isMandatory: true,
  },
  {
    agreementId: "INSTALL-RATE",
    agreementType: "RATE_CARD",
    role: "INSTALLER",
    currentVersion: "INSTALL-RATE-V1",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Certified Installation Rate Card (Jaipur Pilot V1)",
    isMandatory: true,
  },
  {
    agreementId: "INSTALL-SAFETY",
    agreementType: "SAFETY_POLICY",
    role: "INSTALLER",
    currentVersion: "INSTALL-SAFETY-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Field PPE, Ladder Safety & Electrical Precautions Policy",
    isMandatory: true,
  },
  {
    agreementId: "INSTALL-CONDUCT",
    agreementType: "CODE_OF_CONDUCT",
    role: "INSTALLER",
    currentVersion: "INSTALL-CONDUCT-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Technician On-Site Conduct & Zero Direct Cash Solicitation",
    isMandatory: true,
  },
  {
    agreementId: "PARTNER-DATA",
    agreementType: "DATA_CONFIDENTIALITY",
    role: "INSTALLER",
    currentVersion: "PARTNER-DATA-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Customer PII & CCTV Layout Confidentiality Agreement",
    isMandatory: true,
  },
  {
    agreementId: "INSTALL-PAYMENT",
    agreementType: "PARTNER_PAYMENT_TERMS",
    role: "INSTALLER",
    currentVersion: "INSTALL-PAYMENT-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Installer Payout Settlement & QC Completion Terms",
    isMandatory: true,
  },

  // ── 3. PROMOTER ─────────────────────────────────────────────────────────────
  {
    agreementId: "PROMOTER-MSA",
    agreementType: "AFFILIATE_MSA",
    role: "PROMOTER",
    currentVersion: "PROMOTER-MSA-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Promoter & Referral Affiliate Partner Agreement",
    isMandatory: true,
  },
  {
    agreementId: "PROMO-COMMISSION",
    agreementType: "COMMISSION_SCHEDULE",
    role: "PROMOTER",
    currentVersion: "PROMO-COMMISSION-V1",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Standard Commission Slabs & Conversion Schedule",
    isMandatory: true,
  },
  {
    agreementId: "PROMO-REFERRAL",
    agreementType: "REFERRAL_POLICY",
    role: "PROMOTER",
    currentVersion: "PROMO-REFERRAL-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Lead Attribution, Deduplication & Conversion Policy",
    isMandatory: true,
  },
  {
    agreementId: "PROMO-BRAND",
    agreementType: "BRAND_GUIDELINES",
    role: "PROMOTER",
    currentVersion: "PROMO-BRAND-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Marketing Guidelines & Anti-Spam Brand Protection Policy",
    isMandatory: true,
  },
  {
    agreementId: "PROMO-ANTI-FRAUD",
    agreementType: "ANTI_FRAUD_POLICY",
    role: "PROMOTER",
    currentVersion: "PROMO-ANTI-FRAUD-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Anti-Self Referral & Fictitious Lead Prevention Policy",
    isMandatory: true,
  },

  // ── 4. DELIVERY PARTNER ─────────────────────────────────────────────────────
  {
    agreementId: "DELIVERY-MSA",
    agreementType: "LOGISTICS_MSA",
    role: "DELIVERY_PARTNER",
    currentVersion: "DELIVERY-MSA-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Logistics & Local Hardware Transit Agreement",
    isMandatory: true,
  },
  {
    agreementId: "DELIVERY-POD",
    agreementType: "PROOF_OF_DELIVERY",
    role: "DELIVERY_PARTNER",
    currentVersion: "DELIVERY-POD-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Electronic Handover Challan & Delivery OTP Policy",
    isMandatory: true,
  },
  {
    agreementId: "DELIVERY-LIABILITY",
    agreementType: "TRANSIT_LIABILITY",
    role: "DELIVERY_PARTNER",
    currentVersion: "DELIVERY-LIABILITY-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Transit Loss, Box Tampering & Damage Liability Policy",
    isMandatory: true,
  },

  // ── 5. SUPPLIER / DEALER ────────────────────────────────────────────────────
  {
    agreementId: "SUPPLIER-MSA",
    agreementType: "VENDOR_MSA",
    role: "SUPPLIER",
    currentVersion: "SUPPLIER-MSA-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Hardware Vendor Procurement & Supply Agreement",
    isMandatory: true,
  },
  {
    agreementId: "SUPPLIER-WARRANTY",
    agreementType: "WARRANTY_PASS_THROUGH",
    role: "SUPPLIER",
    currentVersion: "SUPPLIER-WARRANTY-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "7-Day DOA Swap & Manufacturer RMA Pass-Through",
    isMandatory: true,
  },
  {
    agreementId: "PRODUCT-AUTH",
    agreementType: "PRODUCT_AUTHENTICITY",
    role: "SUPPLIER",
    currentVersion: "PRODUCT-AUTH-V1.0",
    status: "ACTIVE",
    effectiveFrom: "2026-11-15T00:00:00+05:30",
    title: "Genuine Brand Serial & Anti-Counterfeit Declaration",
    isMandatory: true,
  },
]);

/**
 * Returns all registered agreements for a specific party role.
 */
export function getAgreementsForRole(role: PartyRole): readonly AgreementRegistryEntry[] {
  return CANONICAL_AGREEMENT_REGISTRY.filter((entry) => entry.role === role);
}

/**
 * Returns all mandatory agreements for a specific party role.
 */
export function getMandatoryAgreementsForRole(role: PartyRole): readonly AgreementRegistryEntry[] {
  return CANONICAL_AGREEMENT_REGISTRY.filter((entry) => entry.role === role && entry.isMandatory);
}

/**
 * Finds an agreement by its unique ID.
 */
export function getAgreement(agreementId: string): AgreementRegistryEntry | undefined {
  return CANONICAL_AGREEMENT_REGISTRY.find((entry) => entry.agreementId === agreementId);
}

/**
 * Validates whether all mandatory agreements for a role are satisfied by accepted version map.
 */
export function validateMandatoryAgreements(
  role: PartyRole,
  acceptedVersionMap: Record<string, string>
): { isValid: boolean; missing: string[] } {
  const mandatory = getMandatoryAgreementsForRole(role);
  const missing: string[] = [];

  for (const m of mandatory) {
    const acceptedVersion = acceptedVersionMap[m.agreementId];
    if (!acceptedVersion) {
      missing.push(`${m.agreementId} (${m.currentVersion})`);
    }
  }

  return {
    isValid: missing.length === 0,
    missing,
  };
}
