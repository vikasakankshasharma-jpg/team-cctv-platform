import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";
import type { FrozenContext } from "../types/certification.ts";
import { calculateOraclePricing } from "./pricing-oracle.ts";
import { calculateOracleBom } from "./bom-oracle.ts";
import { calculateOracleAddons } from "./addon-oracle.ts";
import { calculateOracleSurcharges } from "./surcharge-oracle.ts";
import { validateOracleInvariants } from "./invariants.ts";

export function runOracle(requirement: CanonicalRequirement, snapshot: FrozenContext): unknown {
  const pricing = calculateOraclePricing(requirement, snapshot);
  return {
    ...pricing,
    bom: calculateOracleBom(requirement, snapshot),
    addons: pricing.lines.filter((line) => snapshot.addons.some((addon) => addon.sku === line.sku)),
    oracle_addons: calculateOracleAddons(requirement, snapshot),
    surcharges: calculateOracleSurcharges(requirement, {}, snapshot.app_settings),
    invariants: validateOracleInvariants(requirement, snapshot.products),
  };
}
