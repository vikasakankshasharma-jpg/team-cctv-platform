let context = { products: [], addons: [], app_settings: {} };
let writes = new Map();
let sequence = 0;

export function __setSnapshot(value) {
  context = value ?? context;
  writes = new Map();
  sequence = 0;
}
export function __resetWrites() { writes = new Map(); sequence = 0; }
export function __getWriteOverlay() { return Object.fromEntries([...writes.entries()].map(([k, v]) => [k, { ...v }])); }

function baseValuesFor(collection) {
  if (collection === "products") return context.products ?? [];
  if (collection === "addons") return context.addons ?? [];
  if (collection === "settings" && !context.settings) return context.app_settings ? [{ id: "app_config", ...context.app_settings }] : [];
  return context[collection] ?? [];
}
function keyFor(collection, id) { return `${collection}/${String(id)}`; }
function materialize(collection) {
  const base = baseValuesFor(collection).map((row, i) => ({ ...row, id: String(row?.id ?? row?.sku ?? i) }));
  const byId = new Map(base.map((row) => [String(row.id), row]));
  for (const [key, row] of writes.entries()) {
    if (!key.startsWith(`${collection}/`)) continue;
    const id = key.slice(collection.length + 1);
    if (row === null) byId.delete(id); else byId.set(id, { ...row, id });
  }
  return [...byId.values()];
}

function docRef(collection, id) {
  const wanted = String(id);
  return {
    id: wanted,
    async get() {
      const row = materialize(collection).find((r) => String(r.id) === wanted);
      return { id: wanted, exists: Boolean(row), data: () => row ? ({ ...row }) : undefined };
    },
    async set(data, opts = {}) {
      const existing = materialize(collection).find((r) => String(r.id) === wanted) ?? {};
      const next = opts?.merge ? { ...existing, ...data } : { ...data };
      writes.set(keyFor(collection, wanted), { ...next, id: wanted });
      return undefined;
    },
    async update(patch) {
      const existing = materialize(collection).find((r) => String(r.id) === wanted);
      if (!existing) throw new Error(`CERT_FIRESTORE_NOT_FOUND:${collection}/${wanted}`);
      writes.set(keyFor(collection, wanted), { ...existing, ...patch, id: wanted });
      return undefined;
    },
  };
}

class Query {
  constructor(collection, rows = materialize(collection)) { this.collectionName = collection; this.rows = rows; }
  where(field, op, value) {
    if (op !== "==" && op !== "in") throw new Error(`CERT_FIRESTORE_SHIM_UNSUPPORTED_OPERATOR:${op}`);
    const rows = op === "in"
      ? this.rows.filter((r) => Array.isArray(value) && (field === "__name__" ? value.map(String).includes(String(r?.id ?? r?.sku)) : value.includes(r?.[field])))
      : this.rows.filter((r) => r?.[field] === value);
    return new Query(this.collectionName, rows);
  }
  limit(n) { return new Query(this.collectionName, this.rows.slice(0, n)); }
  doc(id) { return docRef(this.collectionName, id); }
  async add(data) {
    const id = String(data?.id ?? data?.sku ?? `cert-${++sequence}`);
    const row = { ...data, id };
    writes.set(keyFor(this.collectionName, id), row);
    return { id, ...docRef(this.collectionName, id) };
  }
  async get() {
    const rows = this.rows;
    return { empty: rows.length === 0, size: rows.length, docs: rows.map((data) => ({ id: String(data?.id ?? data?.sku), exists: true, data: () => ({ ...data }) })) };
  }
}

class FirestoreShim { collection(name) { return new Query(name); } }
export function getFirestore() { return new FirestoreShim(); }
export const FieldPath = { documentId: () => "__name__" };
export const FieldValue = { serverTimestamp: () => ({ __cert_server_timestamp: true }) };
export const Timestamp = { now: () => ({ toDate: () => new Date() }) };
export class FieldPathShim {}
export default { getFirestore, FieldPath, FieldValue, Timestamp };
