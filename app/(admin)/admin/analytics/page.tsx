import { AnalyticsClient } from "@/components/admin/AnalyticsClient";

export const metadata = {
  title: "Analytics | Admin | TEAM CCTV",
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-gray-500 font-medium mt-1">Real-time overview of business performance.</p>
        </div>
      </div>
      
      <AnalyticsClient />
    </div>
  );
}
