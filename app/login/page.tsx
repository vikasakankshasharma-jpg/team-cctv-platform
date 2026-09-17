import { UnifiedLoginClient } from "@/components/auth/UnifiedLoginClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Company Login | Team CCTV",
  description: "Secure gateway for Team CCTV staff and partners.",
};

export default function LoginPage() {
  return <UnifiedLoginClient />;
}
