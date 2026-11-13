let snapshot = null;
export function __setSnapshot(value) { snapshot = value; }
export function getCachedProducts() { return snapshot?.products ?? []; }
export function getCachedAddons() { return snapshot?.addons ?? []; }
export function getCachedCatalog() { return getCachedProducts(); }
export function getCatalog() { return getCachedProducts(); }
export function getProducts() { return getCachedProducts(); }
export async function loadCachedCatalog() { return getCachedProducts(); }
export default { getCachedProducts, getCachedAddons, getCachedCatalog, getCatalog, getProducts, loadCachedCatalog };
