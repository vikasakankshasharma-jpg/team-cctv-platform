/**
 * @file lib/whatsapp/deduplication.ts
 * @description Webhook & Message Idempotency Engine for WhatsApp.
 * 
 * Prevents duplicate messages caused by:
 * 1. Provider HTTP timeout retries (MSG91 / Meta retry if response > 2s).
 * 2. Concurrency race conditions when user double-clicks or sends rapid messages.
 * 3. Inbound delivery/read status receipt collisions.
 */

// In-memory cache for fast, zero-latency deduplication across serverless worker lifecycles
const processedKeys = new Map<string, number>();

// Clean up expired keys every 3 minutes (TTL = 3 minutes)
const TTL_MS = 180000;

export function isDuplicateMessage(dedupeKey: string): boolean {
  if (!dedupeKey) return false;

  const now = Date.now();

  // Prune expired entries
  for (const [key, timestamp] of processedKeys.entries()) {
    if (now - timestamp > TTL_MS) {
      processedKeys.delete(key);
    }
  }

  if (processedKeys.has(dedupeKey)) {
    return true;
  }

  processedKeys.set(dedupeKey, now);
  return false;
}

/**
 * Builds a deterministic deduplication key for incoming payloads
 */
export function buildDedupeKey(
  phone: string, 
  rawId?: string, 
  incomingType?: string, 
  content?: any
): string {
  if (rawId && String(rawId).trim()) {
    return `msg_${String(rawId).trim()}`;
  }

  // Fallback to a 4-second time-bucketed fingerprint
  const cleanPhone = String(phone).replace(/\D/g, "");
  const contentSnippet = typeof content === "string" 
    ? content.slice(0, 40).trim().toLowerCase() 
    : JSON.stringify(content || "").slice(0, 40);
  const timeBucket = Math.floor(Date.now() / 4000);

  return `fingerprint_${cleanPhone}_${incomingType || "text"}_${contentSnippet}_${timeBucket}`;
}
