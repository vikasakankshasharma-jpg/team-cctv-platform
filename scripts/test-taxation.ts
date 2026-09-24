import { TaxationEngine } from '../lib/taxation-engine';

// Override the DB fetch for testing
TaxationEngine.getTaxSettings = async () => ({
  tds_194c_individual_rate: 1,
  tds_194c_firm_rate: 2,
  tds_194c_single_threshold: 30000,
  tds_194c_annual_threshold: 100000,
  tds_194h_rate: 5,
  tds_194h_annual_threshold: 15000,
  tds_penal_rate: 20,
});

async function runTests() {
  console.log("Running Taxation Engine Tests...");
  let passed = true;

  try {
    // Test 1: 194C Individual, below threshold
    const t1 = await TaxationEngine.calculate194C(25000, 50000, "individual", true);
    if (t1.tdsAmount !== 0) { console.error("Test 1 Failed", t1); passed = false; }

    // Test 2: 194C Individual, single threshold crossed (35k > 30k)
    const t2 = await TaxationEngine.calculate194C(35000, 50000, "individual", true);
    if (t2.tdsRatePercent !== 1 || t2.tdsAmount !== 350) { console.error("Test 2 Failed", t2); passed = false; }

    // Test 3: 194C Firm, annual threshold crossed (110k total)
    const t3 = await TaxationEngine.calculate194C(20000, 95000, "firm", true);
    if (t3.tdsRatePercent !== 2 || t3.tdsAmount !== 400) { console.error("Test 3 Failed", t3); passed = false; }

    // Test 4: 194C No PAN Penal Rate
    const t4 = await TaxationEngine.calculate194C(40000, 0, "individual", false);
    if (t4.tdsRatePercent !== 20 || t4.tdsAmount !== 8000) { console.error("Test 4 Failed", t4); passed = false; }

    // Test 5: 194H Promoter, crosses threshold (16k)
    const t5 = await TaxationEngine.calculate194H(5000, 12000, true);
    if (t5.tdsRatePercent !== 5 || t5.tdsAmount !== 250) { console.error("Test 5 Failed", t5); passed = false; }

    if (passed) console.log("All Taxation Engine Tests Passed Successfully! ✅");
  } catch(e) {
    console.error("Error running tests:", e);
  }
}

runTests();
