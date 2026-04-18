import * as functions from "firebase-functions";

/**
 * Validatable Slab Type (matches our Zod schema)
 */
interface Slab {
  from: number;
  to: number | null;
  type: "flat" | "percent";
  value: number;
}

/**
 * Callable function to validate commission slabs before admin saves.
 * Enforces no gaps, no overlaps, and that 'from' starts at 0.
 * Can be called by the frontend admin panel on form submit.
 */
export const validateCommissionSlab = functions.https.onCall((data, context) => {
  // Ensure caller is at least a sales_staff or super_admin
  const role = context.auth?.token?.role;
  if (!context.auth || (role !== "super_admin" && role !== "sales_staff")) {
    throw new functions.https.HttpsError(
      "permission-denied",
      "Only admins can validate commission slabs."
    );
  }

  const slabs: Slab[] = data.slabs || [];
  
  if (slabs.length === 0) {
    return { valid: true };
  }

  // Sort by 'from' ascending ensures we check sequentially
  const sorted = [...slabs].sort((a, b) => a.from - b.from);

  if (sorted[0].from !== 0) {
    return { valid: false, error: "The first slab must start from 0." };
  }

  for (let i = 0; i < sorted.length; i++) {
    const slab = sorted[i];
    const isLast = i === sorted.length - 1;

    if (isLast) {
      if (slab.to !== null) {
        return { valid: false, error: "The last slab must have no upper limit (to = null)." };
      }
    } else {
      if (slab.to === null) {
        return { valid: false, error: "Only the last slab can have no upper limit." };
      }
      
      const nextSlab = sorted[i + 1];
      if (slab.to !== nextSlab.from) {
        return { 
          valid: false, 
          error: `Gap or overlap detected between slabs. Slab ends at ${slab.to}, next starts at ${nextSlab.from}.` 
        };
      }
    }
  }

  return { valid: true };
});
