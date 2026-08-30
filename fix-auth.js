const fs = require('fs');
let code = fs.readFileSync('lib/auth-server.ts', 'utf8');

const replacement = `
export async function verifySession(): Promise<SessionResult> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("admin_session")?.value;

  if (!sessionCookie) {
    return { isAuthenticated: false, user: null, role: null };
  }

  try {
    if (sessionCookie.startsWith("mock_session_") && process.env.NODE_ENV !== "production") {
      const parts = sessionCookie.replace("mock_session_", "").split("_UID_");
      const role = parts[0];
      const uid = parts.length > 1 ? parts[1] : \`mock-\${role}-id\`;
      return { isAuthenticated: true, user: { uid } as any, role };
    }

    const decodedToken = await adminAuth.verifySessionCookie(sessionCookie, true);
    const role = (decodedToken.role as "super_admin" | "sales_staff" | "installer" | undefined) || null;
    return { isAuthenticated: true, user: decodedToken, role };
  } catch (error) {
    console.error("Session verification failed:", error);
    return { isAuthenticated: false, user: null, role: null };
  }
}
`;

code = code.replace(/export async function verifySession\(\)[\s\S]*?catch \(error\) \{[\s\S]*?return \{ isAuthenticated: false, user: null, role: null \};\s*\}\s*\}/, replacement.trim());
fs.writeFileSync('lib/auth-server.ts', code);
