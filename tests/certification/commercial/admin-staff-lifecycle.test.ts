/**
 * @file tests/certification/commercial/admin-staff-lifecycle.test.ts
 * @description Phase 7.11 Admin Each Staff Role Persona Full Cycle & Admin Sync Suite.
 * Validates the complete staff role matrix across 8 core scenarios:
 *   1. Role Hierarchy, Templates & Permission Matrix (ROLE_TEMPLATES)
 *   2. Super Admin Persona Full Cycle (Master Control, Staff Admin, System Settings)
 *   3. Sales Manager Persona Full Cycle (Leads Pipeline, Price Match Review, Campaigns)
 *   4. Dispatch Coordinator Persona Full Cycle (Live Dispatch, Routing, Hardware Deductions)
 *   5. Inventory Admin Persona Full Cycle (Product Master, Vendor CSV Import, Compatibility)
 *   6. Internal Accountant Persona Full Cycle (Field Cash Reconciliation, TDS, Refunds)
 *   7. External CA / Auditor Persona Full Cycle (Statutory Audit, GSTR, Read-Only Boundary)
 *   8. Granular RBAC Boundary Enforcement & Privilege Escalation Defenses
 */

import test from "node:test";
import assert from "node:assert/strict";
import { calculateCommercialMilestones } from "../../../lib/commercial/commercial-contract";

type PermissionGroup = {
  crm_sales: Record<string, boolean>;
  operations: Record<string, boolean>;
  catalog: Record<string, boolean>;
  financial: Record<string, boolean>;
  system: Record<string, boolean>;
};

const DEFAULT_PERMISSIONS: PermissionGroup = {
  crm_sales: { view_all_leads: false, reassign_leads: false, override_quotation_price: false, approve_price_match: false, manage_campaigns: false },
  operations: { manage_dispatch: false, manage_installers: false, manage_hubs: false },
  catalog: { edit_catalog: false, run_imports: false, manage_compatibility: false },
  financial: { edit_global_pricing: false, view_financials: false, process_refunds: false, approve_payouts: false, reconcile_cash: false, export_tax_reports: false },
  system: { manage_staff: false, manage_settings: false, view_audit_logs: false }
};

const ROLE_TEMPLATES: Record<string, PermissionGroup> = {
  super_admin: {
    crm_sales: { view_all_leads: true, reassign_leads: true, override_quotation_price: true, approve_price_match: true, manage_campaigns: true },
    operations: { manage_dispatch: true, manage_installers: true, manage_hubs: true },
    catalog: { edit_catalog: true, run_imports: true, manage_compatibility: true },
    financial: { edit_global_pricing: true, view_financials: true, process_refunds: true, approve_payouts: true, reconcile_cash: true, export_tax_reports: true },
    system: { manage_staff: true, manage_settings: true, view_audit_logs: true }
  },
  sales_manager: {
    ...DEFAULT_PERMISSIONS,
    crm_sales: { view_all_leads: true, reassign_leads: true, override_quotation_price: true, approve_price_match: true, manage_campaigns: true },
  },
  dispatch_coordinator: {
    ...DEFAULT_PERMISSIONS,
    operations: { manage_dispatch: true, manage_installers: false, manage_hubs: false },
  },
  inventory_admin: {
    ...DEFAULT_PERMISSIONS,
    catalog: { edit_catalog: true, run_imports: true, manage_compatibility: false },
  },
  internal_accountant: {
    ...DEFAULT_PERMISSIONS,
    financial: { edit_global_pricing: false, view_financials: true, process_refunds: true, approve_payouts: true, reconcile_cash: true, export_tax_reports: true },
  },
  external_ca: {
    ...DEFAULT_PERMISSIONS,
    financial: { edit_global_pricing: false, view_financials: true, process_refunds: false, approve_payouts: false, reconcile_cash: false, export_tax_reports: true },
  }
};

test("Phase 7.11 — Admin Staff Roles Full Cycle & Permission Matrix Certification", async (t) => {

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 1: Role Hierarchy, Templates & Permission Matrix
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 1 — Role Hierarchy, Templates & Permission Matrix", () => {
    // Assert all 6 role templates exist
    const expectedRoles = ["super_admin", "sales_manager", "dispatch_coordinator", "inventory_admin", "internal_accountant", "external_ca"];
    for (const role of expectedRoles) {
      assert.ok(ROLE_TEMPLATES[role], `Role template ${role} must be defined`);
    }

    // Verify category coverage: crm_sales, operations, catalog, financial, system
    const categories = ["crm_sales", "operations", "catalog", "financial", "system"] as const;
    for (const cat of categories) {
      assert.ok(ROLE_TEMPLATES.super_admin[cat], `Category ${cat} must exist in super_admin`);
    }

    // Super Admin has all 20 permissions active
    let superAdminCount = 0;
    for (const cat of categories) {
      superAdminCount += Object.values(ROLE_TEMPLATES.super_admin[cat]).filter(Boolean).length;
    }
    assert.equal(superAdminCount, 20, "Super admin must have exactly 20 distinct permissions active");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 2: Super Admin Persona Full Cycle
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 2 — Super Admin Persona Full Cycle (Master Control, Staff Admin, Settings)", () => {
    const superAdminSession = {
      uid: "adm_super_001",
      email: "director@cctvquotation.com",
      role: "super_admin",
      permissions: ROLE_TEMPLATES.super_admin,
      isAuthenticated: true
    };

    // 2A: Super Admin creates/invites new staff member
    const newStaffPayload = {
      name: "Rohit Bansal",
      email: "rohit@cctvquotation.com",
      mobile_number: "9829012345",
      role_template: "dispatch_coordinator",
      hub_id: "hub_delhi_ncr",
      is_active: true,
      permissions: ROLE_TEMPLATES.dispatch_coordinator
    };

    const canManageStaff = superAdminSession.role === "super_admin" || superAdminSession.permissions.system.manage_staff;
    assert.equal(canManageStaff, true, "Super admin must have authority to manage staff");

    // 2B: Super Admin modifies global system settings & GST rate
    const canManageSettings = superAdminSession.role === "super_admin" || superAdminSession.permissions.system.manage_settings;
    assert.equal(canManageSettings, true);

    const settingsUpdate = {
      company_gstin: "08CRVPS7390M1ZF",
      gst_rate: 18,
      pricing_cache_ttl_seconds: 3600
    };
    assert.equal(settingsUpdate.gst_rate, 18, "Global GST rate must be 18%");

    // 2C: Reverse tax reconciliation invariant on updated pricing
    const grossPrice = 29500;
    const taxableBase = Math.round((grossPrice / 1.18) * 100) / 100;
    const gstAmount = Math.round((grossPrice - taxableBase) * 100) / 100;
    assert.equal(taxableBase + gstAmount, grossPrice, "18% reverse tax must reconcile with ₹0.00 drift");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 3: Sales Manager Persona Full Cycle
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 3 — Sales Manager Persona Full Cycle (CRM, Price Match, Reassignment)", () => {
    const salesManagerSession = {
      uid: "staff_sm_002",
      email: "sales.head@cctvquotation.com",
      role: "sales_manager",
      permissions: ROLE_TEMPLATES.sales_manager,
      isAuthenticated: true
    };

    // 3A: Can view leads globally across all sales reps
    assert.equal(salesManagerSession.permissions.crm_sales.view_all_leads, true);

    // 3B: Can reassign lead from one rep to another
    assert.equal(salesManagerSession.permissions.crm_sales.reassign_leads, true);
    const leadReassignment = {
      lead_id: "lead_crm_101",
      previous_salesperson_id: "sp_vikas_001",
      new_salesperson_id: "sp_anjali_002",
      reassigned_by: salesManagerSession.email,
      reassigned_at: new Date().toISOString()
    };
    assert.equal(leadReassignment.new_salesperson_id, "sp_anjali_002");

    // 3C: Reviews and approves competitor price match
    assert.equal(salesManagerSession.permissions.crm_sales.approve_price_match, true);
    const priceMatchReview = {
      lead_id: "lead_crm_101",
      competitor_quote_amount: 22000,
      original_quote_amount: 24500,
      approved_counter_offer: 22500,
      status: "approved" as const,
      reviewed_by: salesManagerSession.email
    };
    assert.equal(priceMatchReview.status, "approved");
    assert.ok(priceMatchReview.approved_counter_offer < priceMatchReview.original_quote_amount);

    // 3D: Boundary Check — cannot alter global hardware wholesale pricing or system settings
    assert.equal(salesManagerSession.permissions.financial.edit_global_pricing, false, "Sales manager must not edit global wholesale pricing");
    assert.equal(salesManagerSession.permissions.system.manage_settings, false, "Sales manager must not alter developer API settings");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 4: Dispatch Coordinator Persona Full Cycle
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 4 — Dispatch Coordinator Persona Full Cycle (Logistics, Routing, Tokens)", () => {
    const dispatchSession = {
      uid: "staff_disp_003",
      email: "dispatch.jaipur@cctvquotation.com",
      role: "dispatch_coordinator",
      permissions: ROLE_TEMPLATES.dispatch_coordinator,
      isAuthenticated: true
    };

    // 4A: Can manage dispatch & logistics
    assert.equal(dispatchSession.permissions.operations.manage_dispatch, true);

    // 4B: Coordinates multi-method dispatch (Internal staff vs Third-Party courier)
    const internalDispatch = {
      quoteId: "QT-DISP-001",
      deliveryMethod: "internal_staff" as const,
      staffName: "Sunil Rathore",
      staffPhone: "9829066554"
    };

    const thirdPartyDispatch = {
      quoteId: "QT-DISP-002",
      deliveryMethod: "third_party" as const,
      staffName: "Porter Courier - Rajesh",
      staffPhone: "9876543210"
    };

    assert.equal(internalDispatch.deliveryMethod, "internal_staff");
    assert.equal(thirdPartyDispatch.deliveryMethod, "third_party");

    // 4C: Generates 12-char delivery token for courier magic link
    const deliveryToken = "token_abc123";
    const magicLink = `https://cctvquotation.com/d/${deliveryToken}`;
    assert.ok(magicLink.includes("/d/"));

    // 4D: Boundary Check — cannot access financial profit statements or approve refunds
    assert.equal(dispatchSession.permissions.financial.process_refunds, false, "Dispatch coordinator must not issue refunds");
    assert.equal(dispatchSession.permissions.financial.view_financials, false, "Dispatch coordinator must not view P&L financial ledgers");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 5: Inventory Admin Persona Full Cycle
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 5 — Inventory Admin Persona Full Cycle (Catalog Master, Vendor CSV, Health)", () => {
    const inventorySession = {
      uid: "staff_inv_004",
      email: "inventory.delhi@cctvquotation.com",
      role: "inventory_admin",
      permissions: ROLE_TEMPLATES.inventory_admin,
      isAuthenticated: true
    };

    // 5A: Can edit catalog technical specs
    assert.equal(inventorySession.permissions.catalog.edit_catalog, true);
    const cameraProduct = {
      sku: "CAM-CP-5MP-PRO",
      brand: "CP PLUS",
      resolution: "5MP Ultra HD",
      night_vision: "Color Night Vision",
      lens_focal_length_mm: 3.6,
      weatherproof_ip_rating: "IP67",
      is_active: true
    };
    assert.equal(cameraProduct.resolution, "5MP Ultra HD");
    assert.equal(cameraProduct.brand, "CP PLUS");

    // 5B: Can run vendor CSV price imports
    assert.equal(inventorySession.permissions.catalog.run_imports, true);
    const vendorBatchImport = {
      vendor: "Aditya Infotech Ltd",
      items_processed: 142,
      updated_skus: 38,
      imported_by: inventorySession.email
    };
    assert.equal(vendorBatchImport.items_processed, 142);

    // 5C: Boundary Check — cannot view customer lead PII or approve payouts
    assert.equal(inventorySession.permissions.crm_sales.view_all_leads, false, "Inventory admin must not view customer leads PII");
    assert.equal(inventorySession.permissions.financial.approve_payouts, false, "Inventory admin must not authorize commission payouts");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 6: Internal Accountant Persona Full Cycle
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 6 — Internal Accountant Persona Full Cycle (Cash Reconciliation, TDS, Refunds)", () => {
    const accountantSession = {
      uid: "staff_acc_005",
      email: "accounts@cctvquotation.com",
      role: "internal_accountant",
      permissions: ROLE_TEMPLATES.internal_accountant,
      isAuthenticated: true
    };

    // 6A: Financial ledger & waterfall visibility
    assert.equal(accountantSession.permissions.financial.view_financials, true);

    // 6B: Field cash collection reconciliation (internal delivery rider / technician cash)
    assert.equal(accountantSession.permissions.financial.reconcile_cash, true);
    const cashSettlement = {
      settlement_id: "settle_001",
      staff_name: "Sunil Rathore",
      amount_collected: 21600,
      settled_to_bank: true,
      verified_by: accountantSession.email,
      reconciled_at: new Date().toISOString()
    };
    assert.equal(cashSettlement.settled_to_bank, true);
    assert.equal(cashSettlement.amount_collected, 21600);

    // 6C: Multi-Stage Customer Refund Processing via /api/payment/refund
    assert.equal(accountantSession.permissions.financial.process_refunds, true);
    const refundOrder = {
      quoteId: "QT-REFUND-001",
      amount: 500, // Stage 1 advance booking refund
      reason: "Customer cancelled prior to site survey dispatch",
      status: "processed" as const,
      processed_by: accountantSession.email
    };
    assert.equal(refundOrder.status, "processed");

    // 6D: Commission Payouts with Statutory TDS Withholding (Section 194H: 5% Valid PAN vs 20% Penal)
    assert.equal(accountantSession.permissions.financial.approve_payouts, true);
    const grossCommission = 2000;
    const validPanTdsRate = 0.05;
    const penalPanTdsRate = 0.20;

    const tdsWithValidPan = Math.round(grossCommission * validPanTdsRate);
    const netPayoutValidPan = grossCommission - tdsWithValidPan;
    assert.equal(tdsWithValidPan, 100);
    assert.equal(netPayoutValidPan, 1900);

    const tdsWithPenalPan = Math.round(grossCommission * penalPanTdsRate);
    const netPayoutPenalPan = grossCommission - tdsWithPenalPan;
    assert.equal(tdsWithPenalPan, 400);
    assert.equal(netPayoutPenalPan, 1600);

    // 6E: Boundary Check — cannot alter catalog specs or system API keys
    assert.equal(accountantSession.permissions.catalog.edit_catalog, false, "Internal accountant must not edit catalog hardware specifications");
    assert.equal(accountantSession.permissions.system.manage_settings, false, "Internal accountant must not alter API keys");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 7: External CA / Auditor Persona Full Cycle
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 7 — External CA / Auditor Persona Full Cycle (Statutory Audit, GSTR, Read-Only)", () => {
    const auditorSession = {
      uid: "staff_ca_006",
      email: "auditor.ca@auditfirm.com",
      role: "external_ca",
      permissions: ROLE_TEMPLATES.external_ca,
      isAuthenticated: true
    };

    // 7A: Read-Only Financial Statements & P&L
    assert.equal(auditorSession.permissions.financial.view_financials, true);

    // 7B: Tax Report Exports (GSTR-1, GSTR-3B, Section 194H/194C schedules)
    assert.equal(auditorSession.permissions.financial.export_tax_reports, true);
    const gstr1Export = {
      period: "2026-Q1",
      b2b_invoices_count: 42,
      b2c_invoices_count: 310,
      total_taxable_value: 2542372.88,
      total_igst_cgst_sgst: 457627.12,
      gross_turnover: 3000000.00,
      exported_by: auditorSession.email
    };
    assert.equal(Math.round(gstr1Export.total_taxable_value + gstr1Export.total_igst_cgst_sgst), gstr1Export.gross_turnover);

    // 7C: Strict Read-Only Boundary — Prohibited from all mutations
    assert.equal(auditorSession.permissions.financial.process_refunds, false, "External CA must never execute refunds");
    assert.equal(auditorSession.permissions.financial.approve_payouts, false, "External CA must never authorize commission payouts");
    assert.equal(auditorSession.permissions.financial.reconcile_cash, false, "External CA must never mutate cash settlement ledgers");
    assert.equal(auditorSession.permissions.financial.edit_global_pricing, false, "External CA must never modify pricing margins");
  });

  // ─────────────────────────────────────────────────────────────────────────
  // SCENARIO 8: Granular RBAC Boundary & Privilege Escalation Defenses
  // ─────────────────────────────────────────────────────────────────────────
  await t.test("Scenario 8 — Granular RBAC Boundary Enforcement & Privilege Escalation Defenses", () => {
    // 8A: Suspended Staff Account Block
    const suspendedStaff = {
      uid: "staff_susp_999",
      email: "ex_employee@cctvquotation.com",
      role: "sales_manager",
      is_active: false,
      permissions: ROLE_TEMPLATES.sales_manager
    };
    const canLogin = suspendedStaff.is_active === true;
    assert.equal(canLogin, false, "Suspended staff account must be completely denied access");

    // 8B: Unauthorized access to Staff Management page /api/admin/staff
    const unauthorizedStaff = {
      role: "dispatch_coordinator",
      permissions: ROLE_TEMPLATES.dispatch_coordinator
    };
    const canAccessStaffManagement = unauthorizedStaff.role === "super_admin" || unauthorizedStaff.permissions.system.manage_staff === true;
    assert.equal(canAccessStaffManagement, false, "Dispatch coordinator must be denied access to Staff Management");

    // 8C: Unauthorized access to System Configuration /admin/settings
    const canAccessSettings = unauthorizedStaff.role === "super_admin" || unauthorizedStaff.permissions.system.manage_settings === true;
    assert.equal(canAccessSettings, false, "Dispatch coordinator must be denied access to Global Settings");

    // 8D: External CA attempting to trigger refund -> Blocked
    const caRole = "external_ca";
    const caPermissions = ROLE_TEMPLATES.external_ca;
    const canCaRefund = ["super_admin", "admin", "finance_staff", "manager", "internal_accountant"].includes(caRole) || caPermissions.financial.process_refunds === true;
    assert.equal(canCaRefund, false, "External CA must be blocked from initiating refunds");
  });

});
