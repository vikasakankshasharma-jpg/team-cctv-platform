import { adminDb } from "./firebase-admin";

export type EntityType = "individual" | "firm";

export interface TDSCalculationResult {
  grossAmount: number;
  tdsRatePercent: number;
  tdsAmount: number;
  netPayable: number;
  section: "194C" | "194H" | "NONE";
  remarks: string;
}

export class TaxationEngine {
  // We can fetch this from the database or pass it in.
  // We'll build a helper to fetch current global settings.
  static async getTaxSettings() {
    const snap = await adminDb.collection("settings").doc("global").get();
    const data = snap.data() || {};
    return {
      tds_194c_individual_rate: data.tds_194c_individual_rate ?? 1,
      tds_194c_firm_rate: data.tds_194c_firm_rate ?? 2,
      tds_194c_single_threshold: data.tds_194c_single_threshold ?? 30000,
      tds_194c_annual_threshold: data.tds_194c_annual_threshold ?? 100000,
      tds_194h_rate: data.tds_194h_rate ?? 5,
      tds_194h_annual_threshold: data.tds_194h_annual_threshold ?? 15000,
      tds_penal_rate: data.tds_penal_rate ?? 20,
    };
  }

  /**
   * Determine the current Financial Year (e.g., "FY26-27")
   * Resets April 1st.
   */
  static getCurrentFinancialYear(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth(); // 0 = Jan, 3 = Apr
    if (month >= 3) {
      return \`FY\${year.toString().slice(2)}-\${(year + 1).toString().slice(2)}\`;
    } else {
      return \`FY\${(year - 1).toString().slice(2)}-\${year.toString().slice(2)}\`;
    }
  }

  /**
   * Calculate 194C TDS for Installers (Labor / Contracts)
   */
  static async calculate194C(
    grossAmount: number,
    accumulatedFYAmount: number,
    entityType: EntityType,
    hasValidPan: boolean
  ): Promise<TDSCalculationResult> {
    const settings = await this.getTaxSettings();

    // Check thresholds
    const crossesSingleThreshold = grossAmount > settings.tds_194c_single_threshold;
    const crossesAnnualThreshold = (accumulatedFYAmount + grossAmount) > settings.tds_194c_annual_threshold;

    if (!crossesSingleThreshold && !crossesAnnualThreshold) {
      return {
        grossAmount,
        tdsRatePercent: 0,
        tdsAmount: 0,
        netPayable: grossAmount,
        section: "NONE",
        remarks: "Below 194C thresholds (Single & Annual)."
      };
    }

    let rate = 0;
    if (!hasValidPan) {
      rate = settings.tds_penal_rate; // 20%
    } else {
      rate = entityType === "firm" ? settings.tds_194c_firm_rate : settings.tds_194c_individual_rate;
    }

    const tdsAmount = Math.round((grossAmount * rate) / 100);
    return {
      grossAmount,
      tdsRatePercent: rate,
      tdsAmount,
      netPayable: grossAmount - tdsAmount,
      section: "194C",
      remarks: !hasValidPan ? "Penal rate applied due to missing PAN." : "Standard 194C deduction applied."
    };
  }

  /**
   * Calculate 194H TDS for Promoters (Commission / Brokerage)
   */
  static async calculate194H(
    grossAmount: number,
    accumulatedFYAmount: number,
    hasValidPan: boolean
  ): Promise<TDSCalculationResult> {
    const settings = await this.getTaxSettings();

    const crossesAnnualThreshold = (accumulatedFYAmount + grossAmount) > settings.tds_194h_annual_threshold;

    if (!crossesAnnualThreshold) {
      return {
        grossAmount,
        tdsRatePercent: 0,
        tdsAmount: 0,
        netPayable: grossAmount,
        section: "NONE",
        remarks: "Below 194H annual threshold."
      };
    }

    const rate = !hasValidPan ? settings.tds_penal_rate : settings.tds_194h_rate;
    const tdsAmount = Math.round((grossAmount * rate) / 100);
    
    return {
      grossAmount,
      tdsRatePercent: rate,
      tdsAmount,
      netPayable: grossAmount - tdsAmount,
      section: "194H",
      remarks: !hasValidPan ? "Penal rate applied due to missing PAN." : "Standard 194H deduction applied."
    };
  }
}
