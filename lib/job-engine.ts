import { JobStatus } from "@/types";

export class JobEngine {
  private static validTransitions: Record<JobStatus, JobStatus[]> = {
    "PENDING_DISPATCH": ["ASSIGNED", "CANCELLED"],
    "BACKORDERED": ["PENDING_DISPATCH", "CANCELLED"],
    "ASSIGNED": ["IN_PROGRESS", "CANCELLED"],
    "IN_PROGRESS": ["MATERIAL_SHORTAGE", "COMPLETED", "CANCELLED"],
    "MATERIAL_SHORTAGE": ["IN_PROGRESS", "CANCELLED"],
    "COMPLETED": [],
    "CANCELLED": []
  };

  /**
   * Evaluates if a transition is valid.
   */
  static isValidTransition(current: JobStatus, next: JobStatus): boolean {
    return this.validTransitions[current]?.includes(next) ?? false;
  }

  /**
   * Performs basic logic checks before allowing completion
   */
  static async validateCompletion(jobData: any): Promise<{ valid: boolean; reason?: string }> {
    // In future: verify all materials are accounted for, survey photos uploaded, etc.
    if (jobData.status !== "IN_PROGRESS") {
      return { valid: false, reason: "Job must be IN_PROGRESS to mark COMPLETED" };
    }
    
    // Check if there are any pending change orders
    // This would require DB lookup. The JobEngine might just do static state checks
    // and rely on the API layer to do DB checks.
    
    return { valid: true };
  }
}
