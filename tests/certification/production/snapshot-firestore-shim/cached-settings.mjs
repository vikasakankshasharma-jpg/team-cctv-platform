let snapshot = null;
export const DEFAULT_APP_SETTINGS = {};
export function __setSnapshot(value) { snapshot = value; }
export function getCachedAdminSettings() { return snapshot?.app_settings ?? DEFAULT_APP_SETTINGS; }
export function mergeAppSettings(...sources) { return Object.assign({}, ...sources.filter(Boolean)); }
export function getCachedSettings() { return getCachedAdminSettings(); }
export function getSettings() { return getCachedAdminSettings(); }
export async function loadCachedSettings() { return getCachedAdminSettings(); }
export default { getCachedAdminSettings, mergeAppSettings, DEFAULT_APP_SETTINGS, getCachedSettings, getSettings, loadCachedSettings };
