import { requireAdmin } from "@/lib/auth-server";
import SalespersonsClient from "./SalespersonsClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Salesforce CRM | Intelligence Hub",
  description: "Manage geographic lead assignments and sales staff credentials.",
};

export default async function SalespersonsPage() {
  // Ensure only authorized admins can access
  await requireAdmin();
  
  return <SalespersonsClient />;
}
