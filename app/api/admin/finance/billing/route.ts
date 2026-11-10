import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth-server";
import {
  getCostBudgetSettings,
  updateCostBudgetSettings,
  getServiceUsageSummary,
  checkAndNotifyThresholdBreaches,
  ServiceCostBudget,
} from "@/lib/billing/budget-tracker";
import { sendAdminNotification } from "@/lib/notification-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireAdmin();

    const [budgetSettings, summary] = await Promise.all([
      getCostBudgetSettings(),
      getServiceUsageSummary(),
    ]);

    return NextResponse.json({
      success: true,
      budgetSettings,
      summary,
    });
  } catch (error: any) {
    console.error("Admin Billing API GET error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch cost monitoring data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json();
    const { action, settings } = body;

    if (action === "UPDATE_BUDGETS") {
      const updated = await updateCostBudgetSettings(settings as Partial<ServiceCostBudget>);
      const summary = await getServiceUsageSummary();
      return NextResponse.json({
        success: true,
        message: "Budget limits & safety thresholds updated successfully.",
        budgetSettings: updated,
        summary,
      });
    }

    if (action === "TRIGGER_CHECK") {
      const dispatched = await checkAndNotifyThresholdBreaches(true);
      return NextResponse.json({
        success: true,
        dispatchedServices: dispatched,
        message:
          dispatched.length > 0
            ? `Alert notifications dispatched for: ${dispatched.join(", ")}`
            : "All services are currently within safe thresholds.",
      });
    }

    if (action === "TEST_NOTIFICATION") {
      const testMsg = `🧪 *TEAM CCTV — BUDGET ALERT TEST*\n\nThis is a verification test from your Cost & Budget Observatory.\n\nAll notification channels (WhatsApp & Email) are operational.\n\nTime: ${new Date().toLocaleString("en-IN")}`;
      await sendAdminNotification(testMsg);
      return NextResponse.json({
        success: true,
        message: "Test notification dispatched to Admin WhatsApp.",
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Admin Billing API POST error:", error);
    return NextResponse.json(
      { error: error.message || "Operation failed" },
      { status: 500 }
    );
  }
}
