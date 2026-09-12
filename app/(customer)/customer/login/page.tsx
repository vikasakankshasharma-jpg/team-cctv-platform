import { CustomerLoginClient } from "@/components/customer/CustomerLoginClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Customer Login | TEAM CCTV Platform",
  description: "Secure OTP access for customers to view quotations, download invoices, and track installations.",
};

export default function CustomerLoginPage() {
  return <CustomerLoginClient />;
}
