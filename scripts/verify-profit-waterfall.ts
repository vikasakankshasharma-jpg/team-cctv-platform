/**
 * Offline Unit & Mathematical Invariant Verification for:
 *  - classifyItem() category precedence (Cables & Camera Boxes separated from Cameras)
 *  - resolvePromoterCommission() & Referral Commission deducted inside Services bucket
 *  - Paid AMC & Promo Free AMC counted in Services (including deduplication)
 *  - Overheads Waterfall (PG MDR actual/est/cash, 1st-year warranty reserve, consumables)
 *
 * Run with: npx tsx scripts/verify-profit-waterfall.ts
 */

import assert from "node:assert/strict";
import { calculateQuotationProfitBreakup } from "../lib/quotation-profit";
import { resolvePromoterCommission } from "../lib/commission";
import { DEFAULT_APP_SETTINGS } from "../lib/cached-settings";

function runTests() {
  console.log("Running TEAM CCTV Profit Waterfall Verification Suite...\n");

  const basePricing = {
    net_taxable_amount: 18697,
    gst_amount: 3365,
    total_payable: 22062,
    items: [
      {
        product_id: "CAM-CP-2MP-4",
        display_name: "CP Plus 2MP HD Bullet Camera",
        qty: 4,
        unit_price: 1650,
        base_cost_at_quote: 1400,
        category: "camera",
      },
      {
        product_id: "CBL-3P1-65M",
        display_name: "3+1 HD Camera Cable (Copper)",
        qty: 65,
        unit_price: 37.23,
        base_cost_at_quote: 34.12,
      },
      {
        product_id: "ACC-JB-4",
        display_name: "Camera PVC Weatherproof Junction Box",
        qty: 4,
        unit_price: 32,
        base_cost_at_quote: 20,
      },
      {
        product_id: "DVR-4CH",
        display_name: "CP Plus 4Ch Digital Video Recorder (DVR)",
        qty: 1,
        unit_price: 3335,
        base_cost_at_quote: 2900,
      },
      {
        product_id: "HDD-1TB",
        display_name: "1TB Surveillance HDD WD Purple",
        qty: 1,
        unit_price: 3800,
        base_cost_at_quote: 3551,
      },
      {
        product_id: "PSU-4CH",
        display_name: "4Ch Regulated CCTV SMPS Power Supply",
        qty: 1,
        unit_price: 522,
        base_cost_at_quote: 418,
      },
      {
        product_id: "SVC-INST-4",
        display_name: "Standard HD Installation & Commissioning",
        qty: 4,
        unit_price: 400,
        base_cost_at_quote: 275,
        category: "service",
      },
      {
        product_id: "SVC-SETUP",
        display_name: "DVR Mobile App & Online Viewing Config",
        qty: 1,
        unit_price: 300,
        base_cost_at_quote: 200,
        category: "service",
      },
    ],
    addons: [],
    discount_amount: 0,
  };

  // TEST 1: ClassifyItem separation (Cameras = 4, Cables = 65, Accessories = 4)
  {
    const breakup = calculateQuotationProfitBreakup(basePricing, DEFAULT_APP_SETTINGS);
    const camCat = breakup.categories.find((c) => c.category === "camera");
    const cableCat = breakup.categories.find((c) => c.category === "cable");
    const accCat = breakup.categories.find((c) => c.category === "accessory");

    assert.equal(camCat?.item_count, 4, `Expected 4 cameras, got ${camCat?.item_count}`);
    assert.equal(cableCat?.item_count, 65, `Expected 65m cables, got ${cableCat?.item_count}`);
    assert.equal(accCat?.item_count, 4, `Expected 4 junction boxes in Accessories, got ${accCat?.item_count}`);
    assert.equal(breakup.services.referral_commission_cost, 0, "Zero referral code should yield 0 referral commission");
    console.log("  [PASS] 1. classifyItem separates Cameras (4), Cables (65), and Camera Junction Boxes (4)");
  }

  // TEST 2: B2B 2% Referral Commission counted inside Services bucket
  {
    const b2bPromoter = {
      id: "prom-b2b-1",
      user_type: "promoter",
      commission_slabs: [{ from: 0, to: null, type: "percent" as const, value: 2 }],
    };
    const resolvedComm = resolvePromoterCommission(18697, b2bPromoter, 2);
    assert.equal(resolvedComm.amount, Math.round(18697 * 0.02 * 100) / 100);

    const noRef = calculateQuotationProfitBreakup(basePricing, DEFAULT_APP_SETTINGS);
    const withB2BRef = calculateQuotationProfitBreakup(basePricing, DEFAULT_APP_SETTINGS, {
      referral_code: "B2BSHOP10",
      promoter_id: "prom-b2b-1",
      promoter: b2bPromoter,
    });

    assert.equal(withB2BRef.services.referral_commission_source, "projected");
    assert.ok((withB2BRef.services.referral_commission_cost ?? 0) > 370, "Expected ~374 referral commission");
    assert.equal(
      Math.round((noRef.services.profit - withB2BRef.services.profit) * 100) / 100,
      Math.round((withB2BRef.services.referral_commission_cost ?? 0) * 100) / 100,
      "Referral commission must deduct directly inside Services profit"
    );
    const commCat = withB2BRef.categories.find((c) => c.category === "commission");
    assert.equal(commCat?.is_service, true, "Commission category must belong to Service bucket");
    assert.ok((commCat?.profit ?? 0) < 0, "Commission category profit must be negative");
    console.log(
      `  [PASS] 2. B2B 2% Referral Commission (-₹${withB2BRef.services.referral_commission_cost}) deducted inside Services (Service profit: ₹${noRef.services.profit} -> ₹${withB2BRef.services.profit})`
    );
  }

  // TEST 3: B2C Refer & Earn Rs.500 flat vs Admin manual discount (Rs.0 referral commission)
  {
    const b2cPromoter = {
      id: "prom-b2c-1",
      promoter_incentive_type: "flat",
      commission_slabs: [{ from: 0, to: null, type: "flat" as const, value: 500 }],
    };
    const withB2CRef = calculateQuotationProfitBreakup(
      { ...basePricing, discount_amount: 500, net_taxable_amount: 18697 - 500 },
      DEFAULT_APP_SETTINGS,
      { referral_code: "REFER500", promoter: b2cPromoter }
    );
    const manualDiscountOnly = calculateQuotationProfitBreakup(
      { ...basePricing, discount_amount: 500, net_taxable_amount: 18697 - 500 },
      DEFAULT_APP_SETTINGS,
      {}
    );

    assert.equal(withB2CRef.services.referral_commission_cost, 500);
    assert.equal(manualDiscountOnly.services.referral_commission_cost, 0);
    console.log("  [PASS] 3. B2C Refer-and-Earn Rs.500 deducted in Services; manual discount without referral yields Rs.0");
  }

  // TEST 4: Paid AMC counted in Services + Deduplication when addon & linked subscription coexist
  {
    const withPaidAmcAddon = {
      ...basePricing,
      addons: [
        {
          addon_id: "amc_1yr",
          display_name: "1-Year Comprehensive AMC Plan",
          price: 2000,
          qty: 1,
          category: "service",
          base_cost_at_quote: 700, // 35% fulfillment cost
        },
      ],
    };

    const standaloneAmcSub = {
      id: "amc-sub-1",
      planName: "1-Year Comprehensive AMC Plan",
      amountPaid: 2360,
      exTaxAmount: 2000,
      isComplimentary: false,
      includedVisits: 2,
      usedVisits: 0,
      source: "quote_addon",
    };

    const breakupAddonOnly = calculateQuotationProfitBreakup(withPaidAmcAddon, DEFAULT_APP_SETTINGS);
    const breakupBothDedup = calculateQuotationProfitBreakup(withPaidAmcAddon, DEFAULT_APP_SETTINGS, {
      amc_subscriptions: [standaloneAmcSub],
    });
    const breakupStandaloneContract = calculateQuotationProfitBreakup(basePricing, DEFAULT_APP_SETTINGS, {
      amc_subscriptions: [
        {
          id: "amc-contract-99",
          planName: "Post-Install 1-Year AMC",
          amountPaid: 2360,
          exTaxAmount: 2000,
          isComplimentary: false,
          includedVisits: 2,
          usedVisits: 0,
          source: "amc_contracts",
        },
      ],
    });

    assert.equal(breakupAddonOnly.services.amc_revenue, 2000);
    assert.equal(breakupAddonOnly.services.amc_profit, 1300);
    assert.equal(breakupBothDedup.services.amc_revenue, 2000, "Must not double-count quote_addon AMC subscription");
    assert.equal(breakupStandaloneContract.services.amc_revenue, 2000);
    assert.equal(breakupStandaloneContract.services.amc_profit, 1300);
    console.log(
      `  [PASS] 4. Paid AMC counted cleanly in Services (+₹${breakupAddonOnly.services.amc_revenue} rev / +₹${breakupAddonOnly.services.amc_profit} net) with zero double-counting`
    );
  }

  // TEST 5: Promotional Free AMC tracks PM technician visit cost
  {
    const withPromoFreeAmc = {
      ...basePricing,
      addons: [
        {
          addon_id: "promo_free_amc",
          display_name: "Complimentary 1-Year AMC (Promo)",
          price: 0,
          qty: 1,
          category: "service",
          base_cost_at_quote: 0,
        },
      ],
    };
    const breakupPromo = calculateQuotationProfitBreakup(withPromoFreeAmc, DEFAULT_APP_SETTINGS);
    assert.equal(breakupPromo.services.amc_revenue, 0);
    assert.ok((breakupPromo.services.amc_cost ?? 0) > 0, "Promo Free AMC must carry technician PM fulfillment cost");
    assert.ok((breakupPromo.services.amc_profit ?? 0) < 0, "Promo Free AMC profit contribution must reflect PM cost liability");
    console.log(
      `  [PASS] 5. Promo Free AMC tracks technician PM visit cost (-₹${breakupPromo.services.amc_cost} inside Services)`
    );
  }

  // TEST 6: Operating Overheads Waterfall (Est PG MDR vs Actual Razorpay Fee vs Cash/UPI = Rs.0)
  {
    const estOnline = calculateQuotationProfitBreakup(basePricing, DEFAULT_APP_SETTINGS);
    const actualPg = calculateQuotationProfitBreakup(basePricing, DEFAULT_APP_SETTINGS, {
      actual_pg_fee: 448, // Razorpay fee is already inclusive of 18% GST (`tax`)
      actual_pg_tax: 68,
    });
    const cashPayment = calculateQuotationProfitBreakup(basePricing, DEFAULT_APP_SETTINGS, {
      payment_method: "cash",
    });

    assert.equal(estOnline.overheads.payment_gateway_is_actual, false);
    assert.ok(estOnline.overheads.payment_gateway_fee > 0);
    assert.equal(estOnline.overheads.warranty_reserve, Math.round(estOnline.products.revenue * 0.02));
    assert.equal(estOnline.overheads.logistics_consumables, 150);
    assert.ok(
      Math.abs((estOnline.overall.profit - estOnline.overheads.total_overheads) - estOnline.overheads.net_profit) < 0.01,
      "Net pocket profit must equal overall profit minus total overheads"
    );

    assert.equal(actualPg.overheads.payment_gateway_is_actual, true);
    assert.equal(actualPg.overheads.payment_gateway_fee, 448);

    assert.equal(cashPayment.overheads.payment_gateway_fee, 0);
    console.log(
      `  [PASS] 6. Overheads Waterfall verified (Est PG: ₹${estOnline.overheads.payment_gateway_fee}, Actual Razorpay: ₹${actualPg.overheads.payment_gateway_fee}, Cash: ₹${cashPayment.overheads.payment_gateway_fee}, True Net Pocket Profit: ₹${estOnline.overheads.net_profit})`
    );
  }

  console.log("\nALL 6 PROFIT WATERFALL ASSERTIONS PASSED!");
}

runTests();
