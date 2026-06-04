import { verifySession, SessionResult } from "../auth-server";

export type AIRoleContext = "ADMIN" | "USER" | "UNAUTHENTICATED";

export interface AISecurityContext {
  role: AIRoleContext;
  userId?: string;
  allowedActions: string[];
}

/**
 * Derives the security context for the current AI request based on the user's session.
 * Ensures strict boundaries for what the AI is allowed to do.
 */
export async function getAISecurityContext(): Promise<AISecurityContext> {
  const session: SessionResult = await verifySession();

  if (session.isAuthenticated && session.role === "super_admin") {
    return {
      role: "ADMIN",
      userId: session.user?.uid,
      allowedActions: ["*", "bypass_security", "read_all_data", "write_all_data"],
    };
  }

  // Add logic here if regular users have authenticated accounts,
  // currently we treat non-admins as regular users.
  return {
    role: "UNAUTHENTICATED", // or "USER" if you have a normal user auth scheme
    allowedActions: ["read_public_data", "ask_general_questions"],
  };
}

/**
 * Validates if the current AI session is allowed to perform a specific action.
 * Throws an error if unauthorized, preventing data leakage.
 */
export function enforceAIAction(context: AISecurityContext, action: string) {
  if (context.allowedActions.includes("*")) {
    return true; // Admin bypass
  }

  if (!context.allowedActions.includes(action)) {
    throw new Error(`AI Security Violation: Attempted unauthorized action '${action}' by role '${context.role}'.`);
  }

  return true;
}
