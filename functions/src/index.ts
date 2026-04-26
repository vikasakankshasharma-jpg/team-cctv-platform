/**
 * @file functions/src/index.ts
 * @description Main export file for Firebase Cloud Functions.
 */

import { onLeadStatusWon } from "./onLeadStatusWon";
import { onBookingCreated } from "./onBookingCreated";
import { validateCommissionSlab } from "./validateCommissionSlab";
import { onLeadCreated } from "./onLeadCreated";

export {
  onLeadStatusWon,
  onBookingCreated,
  validateCommissionSlab,
  onLeadCreated
};
