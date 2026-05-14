import type { Metadata } from "next";
import { DealerLoginClient } from "@/components/dealer/DealerLoginClient";

export const metadata: Metadata = {
  title: "Dealer Login | TEAM CCTV Partner Network",
  description: "Secure OTP access for TEAM CCTV franchise dealers.",
  robots: { index: false, follow: false },
};

export default function DealerLoginPage() {
  return <DealerLoginClient />;
}
