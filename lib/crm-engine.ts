import { LeadPriority } from "@/types";

export class CRMEngine {
  /**
   * Maps customer timeline response to Canonical CRM Priority.
   * "Immediately" -> HOT
   * "This week" -> HOT (treating as HOT/WARM hybrid based on user prompt, will use HOT to ensure faster SLA)
   * "This month" -> WARM
   * "Not decided" -> NURTURE
   * "Just looking" / "Cold inquiry" -> COLD
   */
  static mapTimelineToPriority(timelineStr?: string): LeadPriority {
    if (!timelineStr) return "NURTURE"; // Default safe fallback

    const lowerStr = timelineStr.toLowerCase();
    
    if (lowerStr.includes("immediately")) return "HOT";
    if (lowerStr.includes("this week")) return "HOT"; // Treating as HOT/WARM boundary
    if (lowerStr.includes("this month")) return "WARM";
    if (lowerStr.includes("not decided") || lowerStr.includes("later")) return "NURTURE";
    if (lowerStr.includes("cold") || lowerStr.includes("just looking")) return "COLD";

    return "NURTURE"; // Unmatched mappings default to NURTURE
  }

  /**
   * Calculates the Due Date/Time for a follow-up based on Priority SLA.
   */
  static calculateFollowUpSLA(priority: LeadPriority, baseDate: Date = new Date()): string {
    const due = new Date(baseDate.getTime());

    switch (priority) {
      case "HOT":
        due.setHours(due.getHours() + 1); // Follow up in 1 hour
        break;
      case "WARM":
        due.setHours(due.getHours() + 24); // Follow up in 24 hours
        break;
      case "NURTURE":
        due.setDate(due.getDate() + 3); // Follow up in 3 days
        break;
      case "COLD":
        due.setDate(due.getDate() + 7); // Follow up in 7 days
        break;
    }

    return due.toISOString();
  }

  /**
   * Defines standard campaign properties idempotently
   */
  static getInitialFollowUpId(leadId: string): string {
    return `FU-${leadId}-INITIAL`; // Strict idempotent key
  }
}
