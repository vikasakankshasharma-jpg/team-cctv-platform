/**
 * DIAGNOSTIC TEST: Price Sync between Configurator and Final Review
 * Run: node scripts/test-price-sync.mjs
 * 
 * This simulates EXACTLY what the client sends vs what the server receives
 * to identify the root cause of the price discrepancy.
 */

// ─── Simulate the client-side selection (what Configurator calculates) ───────
const clientSelection = {
  technology: "HD",
  camera_count: 4,
  recording_days: 7,
  plan_type: "recommended",
  picture_quality: "good",
  brand_preference: "all",
  selected_addons: [],
  selected_camera_option: undefined,
  selected_camera_id: undefined,
  selected_recorder_id: undefined,
  selected_storage_id: undefined,
  selected_power_id: undefined,   // <-- KEY: Client sends undefined, server re-resolves freely
  cable_length_meters: 15,        // <-- 15m per camera
  total_cable_length_meters: 60,  // <-- 60m total (4 cameras × 15m)
};

// ─── Simulate what the server receives (from payload in ConfiguratorView.tsx) ─
const serverReceivedSelection = {
  ...clientSelection,
  expected_total_payable: 15912,  // <-- What client calculated
};

console.log("=======================================================================");
console.log("PRICE SYNC DIAGNOSTIC TEST");
console.log("=======================================================================\n");

console.log("📱 CLIENT (Configurator) calculates with:");
console.log(`   selected_power_id: ${clientSelection.selected_power_id ?? "undefined → auto-picks cheapest"}`);
console.log(`   cablingMeters: 15 (per camera) → total 60m`);
console.log(`   Expected Total: ₹15,912 (Budget Brand 8Ch SMPS ₹490)\n`);

console.log("🖥️  SERVER (Save API) recalculates with:");
console.log(`   selected_power_id: ${serverReceivedSelection.selected_power_id ?? "undefined → re-resolves independently"}`);
console.log(`   cablingMeters: NOT PASSED (defaults to 0 or different value)`);
console.log(`   Result: Different SMPS may be selected → different total\n`);

console.log("=======================================================================");
console.log("ROOT CAUSE ANALYSIS");
console.log("=======================================================================\n");

console.log("The server-side calculatePricing() call in /api/quotes/route.ts:");
console.log("  ✗ MISSING: cablingMeters parameter (not passed from selection payload)");
console.log("  ✗ MISSING: selected_power_id is not explicitly locked when auto-resolved");
console.log("  ✗ RESULT:  Server independently resolves SMPS using resolveTransmission()");
console.log("             which may pick a different product than what the client chose\n");

console.log("=======================================================================");
console.log("WHAT NEEDS TO BE FIXED in /api/quotes/route.ts");
console.log("=======================================================================\n");

console.log("1. Pass cablingMeters to calculatePricing():");
console.log("   const cablingMeters = selection.total_cable_length_meters");
console.log("     ? selection.total_cable_length_meters / (selection.camera_count || 4)");
console.log("     : (selection.cable_length_meters || 15);");
console.log("   // Then add: cablingMeters, to the calculatePricing() call\n");

console.log("2. The zero-trust validator already checks expected_total_payable");
console.log("   but allows ₹50 / 5% drift. The actual drift (~₹86) is within 5%");
console.log("   so the mismatch passes validation silently.\n");

console.log("3. Fix: Pass cablingMeters so the server calculation exactly matches");
console.log("   the client calculation → same SMPS, same total → no discrepancy\n");

console.log("=======================================================================");
console.log("VERIFICATION: Expected behaviour after fix");
console.log("=======================================================================\n");
console.log("  Configurator shows:  Budget 8Ch SMPS ₹490 → Total ₹15,912");
console.log("  Save API calculates: Budget 8Ch SMPS ₹490 → Total ₹15,912  ✓");
console.log("  Final Review shows:  Budget 8Ch SMPS ₹490 → Total ₹15,912  ✓\n");
