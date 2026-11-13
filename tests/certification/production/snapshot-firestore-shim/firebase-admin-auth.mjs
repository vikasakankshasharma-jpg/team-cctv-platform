export function getAuth(app) { return { app, currentUser: null }; }
export function initializeAuth(app) { return getAuth(app); }
export default { getAuth, initializeAuth };
