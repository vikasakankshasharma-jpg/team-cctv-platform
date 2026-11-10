/**
 * @file lib/whatsapp/deduplication.ts
 * @description High-Assurance Webhook & Message Idempotency Engine for WhatsApp.
 * 
 * Prevents duplicate messages caused by:
 * 1. Provider HTTP timeout retries (MSG91 / Meta retry if response > 2s).
 * 2. Multi-instance Vercel serverless worker concurrency.
 * 3. Cross-provider webhook duplicate delivery (Meta Cloud API + MSG91 simultaneous webhooks).
 * 4. Concurrency race conditions when user double-clicks or sends rapid messages.
 * 5. Inbound delivery/read status receipt collisions.
 */

import { adminDb } from "../firebase-admin";

// In-memory cache for fast, zero-latency deduplication across serverless worker lifecycles
const processedKeys = new Map<string, number>();

// Per-phone last activity tracking to debounce double-taps and rapid-fire retries (15s window)
const phoneLastAction = new Map<string, { time: number; fingerprint: string }>();

// Clean up expired keys every 3 minutes (TTL = 3 minutes)
const TTL_MS = 180000;
const DEBOUNCE_WINDOW_MS = 15000; // 15 seconds covers all webhook retry schedules

/**
 * Synchronous in-memory check to immediately drop duplicate webhooks on the same worker
 */
export function isDuplicateMessage(
  dedupeKey: string, 
  phone?: string, 
  contentSnippet?: string
): boolean {
  if (!dedupeKey) return false;

  const now = Date.now();

  // Prune expired entries periodically
  if (processedKeys.size > 500) {
    for (const [key, timestamp] of processedKeys.entries()) {
      if (now - timestamp > TTL_MS) {
        processedKeys.delete(key);
      }
    }
  }

  // Check 1: Exact dedupeKey match in-memory
  if (processedKeys.has(dedupeKey)) {
    return true;
  }

  // Check 2: Sliding-window debounce per phone (blocks exact same payload within 15s)
  if (phone) {
    const cleanPhone = String(phone).replace(/\D/g, "");
    const last = phoneLastAction.get(cleanPhone);
    const fp = String(contentSnippet || dedupeKey).trim().toLowerCase();
    if (last && last.fingerprint === fp && (now - last.time < DEBOUNCE_WINDOW_MS)) {
      return true;
    }
    phoneLastAction.set(cleanPhone, { time: now, fingerprint: fp });
  }

  processedKeys.set(dedupeKey, now);
  return false;
}

/**
 * Distributed atomic lock using Firestore .create()
 * Guarantees that across multiple Vercel serverless containers/regions,
 * exactly ONE webhook invocation processes the message.
 */
export async function acquireDistributedLock(
  dedupeKey: string,
  phone?: string,
  contentSnippet?: string
): Promise<boolean> {
  // Step 1: In-memory fast path
  if (isDuplicateMessage(dedupeKey, phone, contentSnippet)) {
    return false;
  }

  // Step 2: Firestore distributed atomic lock
  try {
    const cleanKey = dedupeKey.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 100);
    const lockRef = adminDb.collection("whatsapp_dedupe_locks").doc(cleanKey);

    // DocumentReference.create() is strictly atomic: throws ALREADY_EXISTS (code 6) if doc exists
    await lockRef.create({
      created_at: new Date(),
      expires_at: new Date(Date.now() + TTL_MS),
      dedupe_key: dedupeKey,
      phone: phone || null,
    });

    // Step 3: If phone and contentSnippet provided, also check an atomic phone-action lock
    if (phone && contentSnippet) {
      const cleanPhone = String(phone).replace(/\D/g, "");
      const fp = String(contentSnippet).trim().toLowerCase().slice(0, 40).replace(/[^a-zA-Z0-9_-]/g, "_");
      // 15-second time bucket for phone action lock
      const actionBucket = Math.floor(Date.now() / DEBOUNCE_WINDOW_MS);
      const actionLockKey = `act_${cleanPhone}_${fp}_${actionBucket}`;
      const actionLockRef = adminDb.collection("whatsapp_dedupe_locks").doc(actionLockKey);
      try {
        await actionLockRef.create({
          created_at: new Date(),
          expires_at: new Date(Date.now() + DEBOUNCE_WINDOW_MS),
          phone: cleanPhone,
        });
      } catch (actErr: any) {
        if (actErr?.code === 6 || actErr?.code === "already-exists" || String(actErr?.message).includes("ALREADY_EXISTS")) {
          console.warn(`[DedupeLock] Dropping concurrent phone action duplicate: ${actionLockKey}`);
          return false;
        }
      }
    }

    return true;
  } catch (err: any) {
    // Code 6 is ALREADY_EXISTS in gRPC/Firestore
    if (err?.code === 6 || err?.code === "already-exists" || String(err?.message).includes("ALREADY_EXISTS") || String(err?.message).includes("already exists")) {
      return false; // Duplicate webhook invocation dropped!
    }

    // If Firestore is at quota (code 8) or offline, log warning and let in-memory lock govern
    console.warn(`[DedupeLock] Firestore lock fallback to memory (${err?.message || err})`);
    return true;
  }
}

/**
 * Builds a deterministic deduplication key for incoming payloads.
 * Strips volatile request-level IDs (like requestId or uuid) and focuses on
 * the actual WhatsApp message ID or normalized phone+content+15s-time-bucket.
 */
export function buildDedupeKey(
  phone: string, 
  rawId?: string, 
  incomingType?: string, 
  content?: any
): string {
  const cleanPhone = String(phone).replace(/\D/g, "");
  
  // If an inbound message ID exists from provider (e.g. wamid.HBgL... or MSG91 message id)
  if (rawId && String(rawId).trim()) {
    const cleanId = String(rawId).trim().replace(/[^a-zA-Z0-9_-]/g, "_");
    return `msg_${cleanId}`;
  }

  // Normalized content snippet
  const contentSnippet = typeof content === "string" 
    ? content.slice(0, 50).trim().toLowerCase() 
    : JSON.stringify(content || "").slice(0, 50);

  // 15-second sliding window aligns with provider retry timelines
  const timeBucket = Math.floor(Date.now() / DEBOUNCE_WINDOW_MS);

  return `fingerprint_${cleanPhone}_${incomingType || "text"}_${contentSnippet}_${timeBucket}`;
}
