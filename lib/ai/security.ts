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

  // If the user has a valid session cookie, they have completed the LeadGate/Chat OTP verification.
  if (session.isAuthenticated && session.user?.uid) {
    return {
      role: "USER", 
      userId: session.user.uid,
      allowedActions: ["read_public_data", "ask_general_questions", "access_pricing", "create_quote"],
    };
  }

  // Otherwise, they are an unauthenticated visitor
  return {
    role: "UNAUTHENTICATED",
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
