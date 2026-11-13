export function getStorage(app) { return { app, bucket: () => ({ name: "certification-shim" }) }; }
export function getDownloadURL(ref) { return Promise.resolve(String(ref?.name ?? "")); }
export default { getStorage, getDownloadURL };
