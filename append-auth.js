const fs = require('fs');
let code = fs.readFileSync('lib/auth-server.ts', 'utf8');

code += `
/**
 * Strict Role Enforcement for APIs.
 * Pass an array of allowed roles. Throws if unauthorized.
 */
export async function requireRoleApi(allowedRoles: string[]): Promise<SessionResult> {
  const session = await verifySession();
  if (!session.isAuthenticated || !session.role || !allowedRoles.includes(session.role)) {
    throw new Error("Unauthorized");
  }
  return session;
}
`;

fs.writeFileSync('lib/auth-server.ts', code);
