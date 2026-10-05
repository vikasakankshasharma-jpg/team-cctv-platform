import type { Metadata } from "next";
import { MarketingClient } from "@/components/admin/MarketingClient";

export const metadata: Metadata = {
  title: "Marketing Hub | Admin",
  description: "Manage EDM templates for partners",
};

export default function MarketingPage() {
  return <MarketingClient />;
}
