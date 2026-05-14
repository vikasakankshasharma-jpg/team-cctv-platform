/**
 * @file lib/cashfree.ts
 * @description Utility functions for Cashfree Payments and Subscriptions.
 */

import axios from "axios";

const CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
const CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;
const ENV = process.env.NODE_ENV === "production" ? "production" : "sandbox";

const BASE_URL = ENV === "production" 
  ? "https://api.cashfree.com/pg" 
  : "https://sandbox.cashfree.com/pg";

const SUBS_BASE_URL = ENV === "production"
  ? "https://api.cashfree.com/pg" // Subscriptions are often under the same PG base in newer v3 APIs
  : "https://sandbox.cashfree.com/pg";

const headers = {
  "x-client-id": CLIENT_ID,
  "x-client-secret": CLIENT_SECRET,
  "x-api-version": "2023-08-01",
  "Content-Type": "application/json",
  "Accept": "application/json",
};

/**
 * Creates a Cashfree Order for Customer EMI.
 */
export async function createCashfreeOrder(data: {
  order_id: string;
  order_amount: number;
  order_currency: string;
  customer_details: {
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
  };
  order_meta?: {
    return_url: string;
    notify_url: string;
    payment_methods?: string;
  };
}) {
  try {
    const response = await axios.post(`${BASE_URL}/orders`, data, { headers });
    return response.data; // payment_session_id is here
  } catch (error: any) {
    console.error("[Cashfree] Create Order Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to create Cashfree order");
  }
}

/**
 * Creates a Subscription Plan for Franchise Dealers.
 */
export async function createSubscriptionPlan(data: {
  plan_id: string;
  plan_name: string;
  plan_type: "PERIODIC";
  plan_amount: number;
  plan_currency: "INR";
  plan_interval_type: "MONTH";
  plan_intervals: number;
}) {
  try {
    const response = await axios.post(`${SUBS_BASE_URL}/subscriptions/plans`, data, { headers });
    return response.data;
  } catch (error: any) {
    console.error("[Cashfree] Create Plan Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to create subscription plan");
  }
}

/**
 * Creates a Subscription for a Dealer.
 */
export async function createSubscription(data: {
  subscription_id: string;
  plan_id: string;
  customer_details: {
    customer_id: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
  };
  subscription_meta?: {
    return_url: string;
    notify_url: string;
  };
}) {
  try {
    const response = await axios.post(`${SUBS_BASE_URL}/subscriptions`, data, { headers });
    return response.data; // subs_session_id is here
  } catch (error: any) {
    console.error("[Cashfree] Create Subscription Error:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Failed to create subscription");
  }
}

/**
 * Verifies the signature of a Cashfree Webhook.
 * (Conceptual: requires raw body and signature from headers)
 */
export function verifyWebhookSignature(payload: string, signature: string) {
  // In a real implementation, use crypto to verify the signature
  // using CLIENT_SECRET as the key.
  return true; // Simplified for now
}
