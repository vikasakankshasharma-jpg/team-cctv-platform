import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

export interface FirestoreExportOptions {
  projectId?: string;
  collections: string[];
  appConfigCollections?: string[];
  serviceAccountJson?: string;
}

export interface FirestoreExportDocument {
  id: string;
  data: Record<string, unknown>;
}

export interface FirestoreSourceDocument {
  source_products: Record<string, unknown>[];
  products: Record<string, unknown>[];
  addons: Record<string, unknown>[];
  addon_rules: Record<string, unknown>[];
  geo_rules: Record<string, unknown>[];
  promoters: Record<string, unknown>[];
  app_settings: Record<string, unknown>;
  firestore_export: {
    project_id?: string;
    exported_at: string;
    collections: Record<string, number>;
  };
}

export interface FirebaseCredentialEnvironment {
  projectId?: string;
  clientEmail?: string;
  privateKey?: string;
  serviceAccountJson?: string;
}

const SECRET_KEY_PATTERN = /api_key|secret|token|password|private_key/i;
const PROMOTER_PII_KEYS = new Set([
  "email",
  "mobile_number",
  "phone",
  "address",
  "coordinates",
  "follow_up_notes",
  "name",
  "business_name",
]);

function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactSecrets).filter((child) => child !== undefined);
  }
  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(input)) {
      if (SECRET_KEY_PATTERN.test(key)) continue;
      const redactedChild = redactSecrets(child);
      if (redactedChild !== undefined) result[key] = redactedChild;
    }
    if (Object.keys(input).length > 0 && Object.keys(result).length === 0) return undefined;
    return result;
  }
  return value;
}

function redactPromoterPii(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactPromoterPii).filter((child) => child !== undefined);
  }
  if (value && typeof value === "object") {
    const input = value as Record<string, unknown>;
    const result: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(input)) {
      if (PROMOTER_PII_KEYS.has(key.toLowerCase())) continue;
      const redactedChild = redactPromoterPii(child);
      if (redactedChild !== undefined) result[key] = redactedChild;
    }
    if (Object.keys(input).length > 0 && Object.keys(result).length === 0) return undefined;
    return result;
  }
  return value;
}

export function redactCertificationData(source: FirestoreSourceDocument): FirestoreSourceDocument {
  const redactedAppSettings = redactSecrets(source.app_settings);
  return {
    ...source,
    app_settings: (redactedAppSettings ?? {}) as Record<string, unknown>,
    promoters: source.promoters
      .map((row) => redactPromoterPii(row))
      .filter((row): row is Record<string, unknown> => row !== undefined),
  };
}

function jsonSafe(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(jsonSafe);
  if (typeof value === "object") {
    const v = value as Record<string, any>;
    if (typeof v.toDate === "function") return v.toDate().toISOString();
    if (typeof v.path === "string" && typeof v.id === "string") return { _type: "DocumentReference", path: v.path, id: v.id };
    if (typeof v.latitude === "number" && typeof v.longitude === "number") return { _type: "GeoPoint", latitude: v.latitude, longitude: v.longitude };
    if (typeof v.toBase64 === "function") return { _type: "Bytes", base64: v.toBase64() };
    return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, jsonSafe(x)]));
  }
  return value;
}

export function parseServiceAccount(raw?: string): Record<string, unknown> | undefined {
  if (!raw) return undefined;
  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON must contain a JSON object.");
  return parsed as Record<string, unknown>;
}

export function parseCredentialEnvironment(env: Record<string, string | undefined> = process.env): FirebaseCredentialEnvironment {
  const projectId = env.FIREBASE_PROJECT_ID ?? env.GCLOUD_PROJECT;
  const clientEmail = env.FIREBASE_CLIENT_EMAIL;
  const privateKey = env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const serviceAccountJson = env.FIREBASE_SERVICE_ACCOUNT_JSON;
  return Object.fromEntries(Object.entries({ projectId, clientEmail, privateKey, serviceAccountJson }).filter(([, value]) => value !== undefined)) as FirebaseCredentialEnvironment;
}

function serviceAccountFromEnvironment(env: Record<string, string | undefined>): Record<string, unknown> | undefined {
  const parsed = parseServiceAccount(env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (parsed) return parsed;
  const credentials = parseCredentialEnvironment(env);
  if (credentials.clientEmail && credentials.privateKey) {
    return {
      project_id: credentials.projectId,
      client_email: credentials.clientEmail,
      private_key: credentials.privateKey,
    };
  }
  return undefined;
}

async function loadDotEnvFiles(): Promise<void> {
  const require = createRequire(import.meta.url);
  try {
    const dotenv = require("dotenv") as { config?: (options?: { path?: string; override?: boolean }) => unknown };
    if (typeof dotenv.config !== "function") return;
    dotenv.config({ path: resolve(".env.local"), override: false });
    dotenv.config({ path: resolve(".env"), override: false });
  } catch {
    // dotenv is optional for the harness itself; explicit environment variables still work.
  }
}

async function getFirestore(projectId?: string, serviceAccountJson?: string): Promise<{ db: any; projectId?: string }> {
  await loadDotEnvFiles();
  const require = createRequire(import.meta.url);
  const { getApps, initializeApp, cert, applicationDefault } = require("firebase-admin/app") as any;
  const { getFirestore: getAdminFirestore } = require("firebase-admin/firestore") as any;

  const apps = getApps();
  let app = apps[0];
  if (!app) {
    const resolvedProjectId = projectId ?? process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT;
    const serviceAccount = parseServiceAccount(serviceAccountJson ?? process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
      ?? serviceAccountFromEnvironment(process.env);
    if (serviceAccount) {
      app = initializeApp({ credential: cert(serviceAccount), projectId: resolvedProjectId });
    } else {
      app = initializeApp({ credential: applicationDefault(), projectId: resolvedProjectId });
    }
  }
  const db = getAdminFirestore(app);
  const actualProjectId = app.options?.projectId ?? projectId ?? process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT;
  return { db, projectId: actualProjectId };
}

async function readCollection(db: any, collection: string): Promise<FirestoreExportDocument[]> {
  const snapshot = await db.collection(collection).get();
  return snapshot.docs.map((doc: any) => ({ id: doc.id, data: jsonSafe(doc.data()) as Record<string, unknown> }));
}

function docsToRows(docs: FirestoreExportDocument[], defaultIsAddon = false): Record<string, unknown>[] {
  return docs.map(({ id, data }) => {
    const row: Record<string, unknown> = { id, ...data };
    const sku = String(row.sku ?? row.id ?? row.product_id ?? "").trim();
    if (sku && (row.sku === undefined || row.sku === null || String(row.sku).trim() === "")) row.sku = sku;
    if (row.is_addon === undefined && defaultIsAddon) row.is_addon = true;
    return row;
  });
}

function docData(doc: FirestoreExportDocument): Record<string, unknown> {
  return doc.data;
}

function settingsDocData(doc: FirestoreExportDocument): Record<string, unknown> {
  const data = docData(doc);
  if (data.settings && typeof data.settings === "object" && !Array.isArray(data.settings)) {
    return data.settings as Record<string, unknown>;
  }
  return data;
}

function resolveAppSettings(settingsDocs: FirestoreExportDocument[], explicitDocs: FirestoreExportDocument[]): Record<string, unknown> {
  const settingsAppConfig = settingsDocs.find((doc) => doc.id === "app_config");
  if (settingsAppConfig) return settingsDocData(settingsAppConfig);
  const explicit = explicitDocs.find((doc) => doc.id === "app_config");
  return explicit ? settingsDocData(explicit) : {};
}

export interface FirestoreCollectionMapInput {
  products?: FirestoreExportDocument[];
  addons?: FirestoreExportDocument[];
  addon_rules?: FirestoreExportDocument[];
  geo_pricing_rules?: FirestoreExportDocument[];
  geo_rules?: FirestoreExportDocument[];
  recommendation_rules?: FirestoreExportDocument[];
  coverage_zones?: FirestoreExportDocument[];
  promoters?: FirestoreExportDocument[];
  settings?: FirestoreExportDocument[];
  app_config?: FirestoreExportDocument[];
}

export function mapFirestoreCollections(raw: FirestoreCollectionMapInput): FirestoreSourceDocument {
  const productDocs = raw.products ?? [];
  const explicitAddonDocs = raw.addons ?? [];
  const productRows = docsToRows(productDocs);
  const explicitAddonRows: Record<string, unknown>[] = docsToRows(explicitAddonDocs, true).map(
    (row): Record<string, unknown> => ({ ...row, is_addon: row.is_addon !== false }),
  );

  const addonById = new Map<string, Record<string, unknown>>();
  for (const row of productRows.filter((row) => row.is_addon === true)) {
    const id = String(row.id ?? row.sku ?? "");
    if (id) addonById.set(id, { ...row, is_addon: true });
  }
  for (const row of explicitAddonRows) {
    const id = String(row.id ?? row.sku ?? "");
    if (id) addonById.set(id, row);
  }

  const products = productRows.filter((row) => row.is_addon !== true);
  const addons = [...addonById.values()];

  const geoRules = [
    ...(raw.geo_pricing_rules ?? []).map((doc) => ({ id: doc.id, ...doc.data, _source_collection: "geo_pricing_rules" })),
    ...(raw.geo_rules ?? []).map((doc) => ({ id: doc.id, ...doc.data, _source_collection: "geo_rules" })),
    ...(raw.recommendation_rules ?? []).map((doc) => ({ id: doc.id, ...doc.data, _source_collection: "recommendation_rules" })),
    ...(raw.coverage_zones ?? []).map((doc) => ({ id: doc.id, ...doc.data, _source_collection: "coverage_zones" })),
  ];

  const settingsDocs = raw.settings ?? [];
  const appSettings = resolveAppSettings(settingsDocs, raw.app_config ?? []);

  return redactCertificationData({
    source_products: products,
    products,
    addons,
    addon_rules: docsToRows(raw.addon_rules ?? []),
    geo_rules: geoRules,
    promoters: docsToRows(raw.promoters ?? []),
    app_settings: appSettings,
    firestore_export: {
      exported_at: new Date().toISOString(),
      collections: Object.fromEntries(Object.entries(raw).filter(([, docs]) => Array.isArray(docs)).map(([name, docs]) => [name, docs?.length ?? 0])),
    },
  });
}

export async function exportFirestoreSource(options: FirestoreExportOptions): Promise<FirestoreSourceDocument> {
  await loadDotEnvFiles();
  const { db, projectId } = await getFirestore(options.projectId, options.serviceAccountJson);
  const raw: Record<string, FirestoreExportDocument[]> = {};
  for (const collection of options.collections) raw[collection] = await readCollection(db, collection);

  const appConfigCollections = options.appConfigCollections ?? ["app_config", "settings"];
  for (const collection of appConfigCollections) {
    if (!raw[collection]) raw[collection] = await readCollection(db, collection);
  }

  const mapped = mapFirestoreCollections(raw);
  mapped.firestore_export.project_id = projectId;
  return mapped;
}

export async function writeFirestoreSource(source: FirestoreSourceDocument, outputFile: string): Promise<void> {
  await mkdir(dirname(resolve(outputFile)), { recursive: true });
  await writeFile(resolve(outputFile), JSON.stringify(source, null, 2) + "\n", "utf8");
}
