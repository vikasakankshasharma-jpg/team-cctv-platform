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
    // 1. Handle Firestore Timestamp (check for toDate or _seconds)
    if ((data as any).toDate && typeof (data as any).toDate === "function") {
      return (data as any).toDate().toISOString() as unknown as T;
    }
    
    if ((data as any)._seconds !== undefined) {
      // It's a raw timestamp from admin SDK
      return new Date((data as any)._seconds * 1000).toISOString() as unknown as T;
    }

    // 2. Handle standard objects (deep serialize)
    const serialized: any = {};
    for (const [key, value] of Object.entries(data)) {
      serialized[key] = serializeDoc(value);
    }
    return serialized as T;
  }

  return data;
}
