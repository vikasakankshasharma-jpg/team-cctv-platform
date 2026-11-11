import { adminDb } from "@/lib/firebase-admin";
import { sendAdminNotification } from "@/lib/notification-service";
import { Resend } from "resend";
import { cleanEnvVar, cleanPhoneEnvVar } from "@/lib/env-utils";

export interface ServiceCostBudget {
  // Budget Limits
  gcp_monthly_limit_inr: number;
  maps_monthly_requests_limit: number;
  resend_monthly_emails_limit: number;
  msg91_wallet_min_inr: number;
  gemini_monthly_uncredited_calls_limit: number;

  // Safeguards
  strict_zero_cost_mode: boolean;
  notifications_enabled: boolean;
  admin_alert_whatsapp: string;
  admin_alert_email: string;

  // Cooldown & Status tracking
  last_alerts: Record<string, string>; // service -> ISO timestamp of last alert
  updated_at?: string;
}

export interface ServiceUsageSummary {
  period: string; // YYYY-MM
  services: {
    gcp_genai_credits: {
      name: "Vertex AI Search & Conversation (GenAI App Builder Credit)";
      total_allocated_inr: number;
      used_inr: number;
      remaining_inr: number;
      expiry_date: string;
      status: "ACTIVE" | "EXPIRED" | "BILLING_SUSPENDED";
    };
    gcp_uncredited_spend: {
      name: "Google Cloud Pay-As-You-Go Spend";
      current_month_inr: number;
      limit_inr: number;
      is_breached: boolean;
    };
    google_maps_api: {
      name: "Google Maps Geocoding & Routing API";
      requests_count: number;
      free_tier_allowance: number;
      limit_requests: number;
      is_breached: boolean;
    };
    resend_email: {
      name: "Resend Quotation & Alert Emails";
      sent_count: number;
      monthly_free_tier: number;
      limit_emails: number;
      is_breached: boolean;
    };
    msg91_sms: {
      name: "MSG91 & Fast2SMS / WhatsApp Credits";
      estimated_balance_inr: number;
      min_threshold_inr: number;
      is_low: boolean;
    };
    gemini_ai_calls: {
      name: "Uncredited Gemini Direct API Calls";
      calls_count: number;
      limit_calls: number;
      is_breached: boolean;
    };
  };
  strict_zero_cost_mode: boolean;
}

export const DEFAULT_BUDGET_CONFIG: ServiceCostBudget = {
  gcp_monthly_limit_inr: 250,
  maps_monthly_requests_limit: 20000,
  resend_monthly_emails_limit: 2400, // 80% of 3,000 free tier
  msg91_wallet_min_inr: 100,
  gemini_monthly_uncredited_calls_limit: 50,
  strict_zero_cost_mode: true, // Default to strict safety
  notifications_enabled: true,
  admin_alert_whatsapp: cleanPhoneEnvVar(process.env.ADMIN_WHATSAPP_NUMBER, "917357612865"),
  admin_alert_email: cleanEnvVar(process.env.ADMIN_ALERT_EMAIL) || "sales@teamcctv.com",
  last_alerts: {},
};

const BUDGET_DOC_ID = "cost_budgets";
const USAGE_COLLECTION = "service_usage_monthly";

function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Retrieves the current Cost Budget & Alert configuration from Firestore.
 */
export async function getCostBudgetSettings(): Promise<ServiceCostBudget> {
  try {
    const doc = await adminDb.collection("settings").doc(BUDGET_DOC_ID).get();
    if (doc.exists) {
      return { ...DEFAULT_BUDGET_CONFIG, ...(doc.data() as ServiceCostBudget) };
    }
  } catch (err) {
    console.warn("⚠️ Failed to load cost budgets from Firestore, using defaults:", err);
  }
  return DEFAULT_BUDGET_CONFIG;
}

/**
 * Updates the Cost Budget & Alert configuration in Firestore.
 */
export async function updateCostBudgetSettings(
  partial: Partial<ServiceCostBudget>
): Promise<ServiceCostBudget> {
  const current = await getCostBudgetSettings();
  const updated: ServiceCostBudget = {
    ...current,
    ...partial,
    updated_at: new Date().toISOString(),
  };

  try {
    await adminDb.collection("settings").doc(BUDGET_DOC_ID).set(updated, { merge: true });
  } catch (err) {
    console.error("🔥 Failed to persist cost budgets:", err);
  }

  return updated;
}

/**
 * Records usage event for a specific chargeable service.
 */
export async function recordServiceUsage(
  service: "gcp_uncredited_spend" | "google_maps_api" | "resend_email" | "msg91_sms" | "gemini_ai_calls",
  units: number = 1
): Promise<void> {
  const period = getCurrentPeriod();
  const ref = adminDb.collection(USAGE_COLLECTION).doc(period);

  try {
    await adminDb.runTransaction(async (t) => {
      const snap = await t.get(ref);
      const current = snap.exists ? snap.data() || {} : {};
      const currentVal = Number(current[service] || 0);
      t.set(ref, {
        [service]: currentVal + units,
        updated_at: new Date().toISOString(),
      }, { merge: true });
    });

    // Check thresholds asynchronously
    checkAndNotifyThresholdBreaches().catch((e) =>
      console.error("Threshold check error:", e)
    );
  } catch (err) {
    console.error(`Failed to record usage for ${service}:`, err);
  }
}

/**
 * Retrieves aggregated service usage for the current billing period.
 */
export async function getServiceUsageSummary(): Promise<ServiceUsageSummary> {
  const period = getCurrentPeriod();
  const budget = await getCostBudgetSettings();

  let usageData: Record<string, number> = {};
  try {
    const doc = await adminDb.collection(USAGE_COLLECTION).doc(period).get();
    if (doc.exists) {
      usageData = (doc.data() as Record<string, number>) || {};
    }
  } catch (err) {
    console.warn("Failed to fetch monthly usage:", err);
  }

  const gcpSpend = Number(usageData.gcp_uncredited_spend || 0);
  const mapsReqs = Number(usageData.google_maps_api || 0);
  const resendEmails = Number(usageData.resend_email || 0);
  const msg91Spend = Number(usageData.msg91_sms || 0);
  const geminiCalls = Number(usageData.gemini_ai_calls || 0);

  return {
    period,
    services: {
      gcp_genai_credits: {
        name: "Vertex AI Search & Conversation (GenAI App Builder Credit)",
        total_allocated_inr: 91785.01,
        used_inr: Number(usageData.gcp_genai_credits_used || 0),
        remaining_inr: 91785.01 - Number(usageData.gcp_genai_credits_used || 0),
        expiry_date: "2026-12-31",
        status: "BILLING_SUSPENDED", // Re-activates when billing account is re-opened
      },
      gcp_uncredited_spend: {
        name: "Google Cloud Pay-As-You-Go Spend",
        current_month_inr: gcpSpend,
        limit_inr: budget.gcp_monthly_limit_inr,
        is_breached: gcpSpend >= budget.gcp_monthly_limit_inr,
      },
      google_maps_api: {
        name: "Google Maps Geocoding & Routing API",
        requests_count: mapsReqs,
        free_tier_allowance: 28500, // Approx $200 free tier
        limit_requests: budget.maps_monthly_requests_limit,
        is_breached: mapsReqs >= budget.maps_monthly_requests_limit,
      },
      resend_email: {
        name: "Resend Quotation & Alert Emails",
        sent_count: resendEmails,
        monthly_free_tier: 3000,
        limit_emails: budget.resend_monthly_emails_limit,
        is_breached: resendEmails >= budget.resend_monthly_emails_limit,
      },
      msg91_sms: {
        name: "MSG91 & Fast2SMS / WhatsApp Credits",
        estimated_balance_inr: Math.max(0, 500 - msg91Spend),
        min_threshold_inr: budget.msg91_wallet_min_inr,
        is_low: (500 - msg91Spend) <= budget.msg91_wallet_min_inr,
      },
      gemini_ai_calls: {
        name: "Uncredited Gemini Direct API Calls",
        calls_count: geminiCalls,
        limit_calls: budget.gemini_monthly_uncredited_calls_limit,
        is_breached: geminiCalls >= budget.gemini_monthly_uncredited_calls_limit,
      },
    },
    strict_zero_cost_mode: budget.strict_zero_cost_mode,
  };
}

/**
 * Checks all service limits and dispatches multi-channel alerts (WhatsApp + Email)
 * with a 24-hour cooldown to avoid notification spam.
 */
export async function checkAndNotifyThresholdBreaches(force: boolean = false): Promise<string[]> {
  const budget = await getCostBudgetSettings();
  if (!budget.notifications_enabled && !force) return [];

  const summary = await getServiceUsageSummary();
  const breaches: { service: string; message: string; current: string; limit: string }[] = [];

  // 1. GCP Spend
  if (summary.services.gcp_uncredited_spend.is_breached) {
    breaches.push({
      service: "gcp_uncredited_spend",
      message: `Google Cloud uncredited spend has reached ₹${summary.services.gcp_uncredited_spend.current_month_inr.toFixed(2)}, crossing your budget limit of ₹${budget.gcp_monthly_limit_inr}.`,
      current: `₹${summary.services.gcp_uncredited_spend.current_month_inr.toFixed(2)}`,
      limit: `₹${budget.gcp_monthly_limit_inr}`,
    });
  }

  // 2. Maps API
  if (summary.services.google_maps_api.is_breached) {
    breaches.push({
      service: "google_maps_api",
      message: `Google Maps API requests have reached ${summary.services.google_maps_api.requests_count}, crossing the threshold of ${budget.maps_monthly_requests_limit}.`,
      current: `${summary.services.google_maps_api.requests_count}`,
      limit: `${budget.maps_monthly_requests_limit}`,
    });
  }

  // 3. Resend Emails
  if (summary.services.resend_email.is_breached) {
    breaches.push({
      service: "resend_email",
      message: `Resend transactional email count reached ${summary.services.resend_email.sent_count} / 3000 free quota. Limit is ${budget.resend_monthly_emails_limit}.`,
      current: `${summary.services.resend_email.sent_count}`,
      limit: `${budget.resend_monthly_emails_limit}`,
    });
  }

  // 4. MSG91 / SMS Wallet Low
  if (summary.services.msg91_sms.is_low) {
    breaches.push({
      service: "msg91_sms",
      message: `MSG91 / WhatsApp wallet balance is estimated at ₹${summary.services.msg91_sms.estimated_balance_inr.toFixed(2)}, below the minimum safety threshold of ₹${budget.msg91_wallet_min_inr}.`,
      current: `₹${summary.services.msg91_sms.estimated_balance_inr.toFixed(2)}`,
      limit: `₹${budget.msg91_wallet_min_inr}`,
    });
  }

  // 5. Gemini Direct API Calls
  if (summary.services.gemini_ai_calls.is_breached) {
    breaches.push({
      service: "gemini_ai_calls",
      message: `Uncredited Gemini direct API calls reached ${summary.services.gemini_ai_calls.calls_count}, crossing the limit of ${budget.gemini_monthly_uncredited_calls_limit}.`,
      current: `${summary.services.gemini_ai_calls.calls_count}`,
      limit: `${budget.gemini_monthly_uncredited_calls_limit}`,
    });
  }

  if (breaches.length === 0) return [];

  const dispatchedServices: string[] = [];
  const now = new Date();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const updatedLastAlerts = { ...(budget.last_alerts || {}) };

  for (const b of breaches) {
    const lastAlertTime = updatedLastAlerts[b.service]
      ? new Date(updatedLastAlerts[b.service]).getTime()
      : 0;

    // Check 24-hr cooldown unless force is true
    if (!force && now.getTime() - lastAlertTime < ONE_DAY_MS) {
      console.log(`⏳ Cooldown active for service alert: ${b.service}`);
      continue;
    }

    const alertText = `🚨 *TEAM CCTV — BUDGET ALERT*\n\nService: *${b.service.toUpperCase()}*\nCurrent: *${b.current}* | Limit: *${b.limit}*\n\n${b.message}\n\nPlease check your Admin Cost Monitor: https://teamcctv.com/admin/finance/billing`;

    // 1. Send WhatsApp Alert to Admin
    try {
      await sendAdminNotification(alertText);
    } catch (e) {
      console.error(`Failed to send WhatsApp alert for ${b.service}:`, e);
    }

    // 2. Send Email Alert via Resend
    const resendApiKey = cleanEnvVar(process.env.RESEND_API_KEY);
    if (resendApiKey && budget.admin_alert_email) {
      try {
        const resend = new Resend(resendApiKey);
        await resend.emails.send({
          from: "TEAM CCTV Alerts <alerts@teamcctv.com>",
          to: budget.admin_alert_email,
          subject: `⚠️ Budget Threshold Exceeded: ${b.service}`,
          text: alertText,
        });
      } catch (e) {
        console.warn(`Resend alert email failed:`, e);
      }
    }

    // 3. Record in Admin Audit Log
    try {
      await adminDb.collection("audit_logs").add({
        action: "BUDGET_THRESHOLD_BREACHED",
        service: b.service,
        current: b.current,
        limit: b.limit,
        message: b.message,
        created_at: now.toISOString(),
      });
    } catch (e) {
      console.warn("Failed to log budget alert in audit_logs:", e);
    }

    updatedLastAlerts[b.service] = now.toISOString();
    dispatchedServices.push(b.service);
  }

  if (dispatchedServices.length > 0) {
    await updateCostBudgetSettings({ last_alerts: updatedLastAlerts });
  }

  return dispatchedServices;
}
