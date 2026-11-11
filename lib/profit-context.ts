import { adminDb } from "@/lib/firebase-admin";
import { getCachedAdminSettings } from "@/lib/cached-settings";
import type { ProfitBreakupAmcSubscription, ProfitBreakupContext } from "@/lib/quotation-profit";

function toLast10Digits(phone: any): string {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Extracts Payment Gateway fee & payment method hints from quote/lead payment_history.
 */
export function extractPaymentGatewayMeta(
  quoteData: any,
  leadData: any
): Pick<ProfitBreakupContext, "actual_pg_fee" | "actual_pg_tax" | "payment_method"> {
  const histories: any[] = [];
  if (Array.isArray(quoteData?.payment_history)) histories.push(...quoteData.payment_history);
  if (Array.isArray(leadData?.payment_history)) histories.push(...leadData.payment_history);

  // Deduplicate payment_history entries by payment_id
  const seenPayments = new Set<string>();
  let totalPgFee = 0;
  let totalPgTax = 0;
  let hasRecordedFee = false;

  for (const p of histories) {
    if (!p) continue;
    const pid = String(p.payment_id || p.id || "");
    if (pid && seenPayments.has(pid)) continue;
    if (pid) seenPayments.add(pid);

    if (typeof p.razorpay_fee === "number" && p.razorpay_fee >= 0) {
      totalPgFee += p.razorpay_fee;
      hasRecordedFee = true;
    }
    if (typeof p.razorpay_tax === "number" && p.razorpay_tax >= 0) {
      totalPgTax += p.razorpay_tax;
    }
  }

  const rawMethod = String(
    quoteData?.payment_method ||
    leadData?.payment_method ||
    (quoteData?.cash_collection_approved || leadData?.cash_collection_approved ? "cash" : "")
  ).toLowerCase();

  return {
    actual_pg_fee: hasRecordedFee ? Math.round(totalPgFee) : undefined,
    actual_pg_tax: hasRecordedFee ? Math.round(totalPgTax) : undefined,
    payment_method: rawMethod || undefined,
  };
}

/**
 * Normalizes a raw Firestore document from `amc_subscriptions` or `amc_contracts`
 * into a unified ProfitBreakupAmcSubscription record.
 */
export function mapAmcDocToSubscription(id: string, d: any): ProfitBreakupAmcSubscription {
  const rawPaid = Number(d.amountPaid ?? d.agreedPrice ?? 0);
  return {
    id,
    planName: d.planName || d.plan_name || "AMC Service Contract",
    amountPaid: rawPaid,
    isComplimentary: Boolean(d.isComplimentary) || rawPaid <= 0,
    includedVisits: d.includedVisits ?? 2,
    usedVisits: d.visitsUsed ?? d.usedVisits ?? 0,
    source: d.source || (d.paymentId ? "portal" : "admin"),
  };
}

/**
 * Fetches full ProfitBreakupContext for a single lead/quote detail page or CRM quote API:
 * - Global AppSettings (labor payouts, AMC fulfillment %, PG MDR %, warranty %, consumables)
 * - Linked Promoter (by promoter_id or referral_code / referral_code_used)
 * - Linked Salesperson (if assigned)
 * - Actual Commission Records (`commission_records` and `commissions` for installer bonuses)
 * - Linked Paid/Complimentary AMC contracts (`amc_subscriptions` + `amc_contracts`)
 * - Razorpay PG fee & tax from `payment_history`
 */
export async function fetchSingleQuoteProfitContext(params: {
  leadId?: string;
  quoteId?: string;
  quoteData?: any;
  leadData?: any;
}): Promise<{ settings: any; context: ProfitBreakupContext }> {
  const { leadId, quoteId, quoteData, leadData } = params;

  const promoterId = quoteData?.promoter_id || leadData?.promoter_id || null;
  const referralCode =
    quoteData?.referral_code_used ||
    quoteData?.referral_code ||
    leadData?.referral_code ||
    quoteData?.pricingSnapshot?.referral_code ||
    null;
  const salespersonId =
    leadData?.assigned_to_salesperson_id ||
    leadData?.assigned_salesperson_id ||
    quoteData?.assigned_salesperson_id ||
    null;
  const customerId = quoteData?.customer_id || leadData?.customer_id || leadData?.firebase_uid || null;
  const mobile10 = toLast10Digits(quoteData?.customer_mobile || leadData?.mobile_number);

  const safeGet = async (fn: () => Promise<any>) => {
    try {
      return await fn();
    } catch {
      return null;
    }
  };

  const [
    settings,
    commRecsSnap,
    installerCommsSnap,
    promoterByIdDoc,
    promoterByCodeSnap,
    salespersonDoc,
    amcSubsByQuote,
    amcSubsByLead,
    amcContractsByQuote,
    amcContractsByLead,
  ] = await Promise.all([
    safeGet(() => getCachedAdminSettings()),
    leadId ? safeGet(() => adminDb.collection("commission_records").where("lead_id", "==", leadId).get()) : null,
    leadId ? safeGet(() => adminDb.collection("commissions").where("lead_id", "==", leadId).get()) : null,
    promoterId ? safeGet(() => adminDb.collection("promoters").doc(String(promoterId)).get()) : null,
    !promoterId && referralCode
      ? safeGet(() => adminDb.collection("promoters").where("referral_code", "==", String(referralCode)).limit(1).get())
      : null,
    salespersonId ? safeGet(() => adminDb.collection("salespersons").doc(String(salespersonId)).get()) : null,
    quoteId ? safeGet(() => adminDb.collection("amc_subscriptions").where("quoteId", "==", quoteId).get()) : null,
    leadId ? safeGet(() => adminDb.collection("amc_subscriptions").where("leadId", "==", leadId).get()) : null,
    quoteId ? safeGet(() => adminDb.collection("amc_contracts").where("quoteId", "==", quoteId).get()) : null,
    leadId ? safeGet(() => adminDb.collection("amc_contracts").where("dealId", "==", leadId).get()) : null,
  ]);

  let promoter: any = null;
  if (promoterByIdDoc?.exists) {
    promoter = { id: promoterByIdDoc.id, ...promoterByIdDoc.data() };
  } else if (promoterByCodeSnap && !promoterByCodeSnap.empty) {
    const doc = promoterByCodeSnap.docs[0];
    promoter = { id: doc.id, ...doc.data() };
  }

  const salesperson = salespersonDoc?.exists ? { id: salespersonDoc.id, ...salespersonDoc.data() } : null;

  const actualCommissions: ProfitBreakupContext["actual_commissions"] = [];
  if (commRecsSnap?.docs) {
    for (const d of commRecsSnap.docs) {
      const c = d.data();
      actualCommissions.push({
        id: d.id,
        user_type: c.user_type || "promoter",
        commission_amount: Number(c.commission_amount || 0),
        status: c.status || "pending",
        source: "commission_records",
      });
    }
  }
  if (installerCommsSnap?.docs) {
    for (const d of installerCommsSnap.docs) {
      const c = d.data();
      actualCommissions.push({
        id: d.id,
        user_type: c.user_type || "installer",
        commission_amount: Number(c.commission_amount || 0),
        status: c.status || "pending",
        source: "commissions",
      });
    }
  }

  // Deduplicate AMC contracts & subscriptions across quote/lead
  const amcMap = new Map<string, ProfitBreakupAmcSubscription>();
  const ingestAmcSnap = (snap: any) => {
    if (!snap?.docs) return;
    for (const doc of snap.docs) {
      if (!amcMap.has(doc.id)) {
        amcMap.set(doc.id, mapAmcDocToSubscription(doc.id, doc.data()));
      }
    }
  };
  ingestAmcSnap(amcSubsByQuote);
  ingestAmcSnap(amcSubsByLead);
  ingestAmcSnap(amcContractsByQuote);
  ingestAmcSnap(amcContractsByLead);

  // Also check customerId/mobile match if none matched by quote/lead directly
  if (amcMap.size === 0 && (customerId || mobile10)) {
    const [byCustSubs, byMobSubs] = await Promise.all([
      customerId ? safeGet(() => adminDb.collection("amc_contracts").where("customerId", "==", customerId).get()) : null,
      mobile10 ? safeGet(() => adminDb.collection("amc_subscriptions").where("customerMobile", "==", mobile10).get()) : null,
    ]);
    ingestAmcSnap(byCustSubs);
    ingestAmcSnap(byMobSubs);
  }

  const pgMeta = extractPaymentGatewayMeta(quoteData, leadData);

  return {
    settings: settings || {},
    context: {
      referral_code: referralCode,
      promoter_id: promoter?.id || promoterId,
      promoter,
      salesperson,
      actual_commissions: actualCommissions,
      amc_subscriptions: Array.from(amcMap.values()),
      ...pgMeta,
    },
  };
}
