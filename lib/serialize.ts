/**
 * @file lib/serialize.ts
 * @description Utility to convert Firestore objects into plain JSON for Next.js Server Components.
 * Fixes the "Only plain objects can be passed to Client Components" error.
 */

export function serializeDoc<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  // Handle Arrays
  if (Array.isArray(data)) {
    return data.map((item) => serializeDoc(item)) as unknown as T;
  }

  // Handle Objects
  if (typeof data === "object") {
    const obj = data as Record<string, unknown>;

    // 1. Handle Firestore Timestamp (check for toDate or _seconds)
    if (typeof obj.toDate === "function") {
      return (obj.toDate as () => Date)().toISOString() as unknown as T;
    }
    
    if (obj._seconds !== undefined) {
      // It's a raw timestamp from admin SDK
      return new Date((obj._seconds as number) * 1000).toISOString() as unknown as T;
    }

    // 2. Handle standard objects (deep serialize)
    const serialized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      serialized[key] = serializeDoc(value);
    }
    return serialized as T;
  }

  return data;
}
