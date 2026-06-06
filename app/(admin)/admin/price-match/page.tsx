import { Metadata } from "next";
import PriceMatchHubClient from "./PriceMatchHubClient";

export const metadata: Metadata = {
  title: "Price Matching Hub | TEAM Admin",
  description: "Review and approve competitor price match requests from the sales team.",
};

export default function PriceMatchHubPage() {
  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-foreground tracking-tight">Price Matching Hub</h1>
        <p className="text-muted-foreground mt-1">Review competitor quotes and approve counter-offers to win deals.</p>
      </div>

      <PriceMatchHubClient />
    </div>
  );
}
