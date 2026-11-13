let app = null;
function makeApp(options = {}, name = "[DEFAULT]") {
  const services = new Map();
  return {
    name,
    options,
    getOrInitService(identifier, initializer) {
      if (!services.has(identifier)) services.set(identifier, initializer());
      return services.get(identifier);
    },
  };
}
export function initializeApp(options = {}, name = "[DEFAULT]") { app ??= makeApp(options, name); return app; }
export function getApps() { return app ? [app] : []; }
export function getApp(name = "[DEFAULT]") { if (!app) app = makeApp({}, name); return app; }
export function cert(value) { return value; }
export function applicationDefault() { return {}; }
export default { initializeApp, getApps, getApp, cert, applicationDefault };
