import type { Metadata } from "next";
import PartnerOnboardingClient from "@/components/partner/PartnerOnboardingClient";

export const metadata: Metadata = {
  title: "Partner Registration | TEAM CCTV",
  description: "Join the TEAM CCTV network as a Promoter or Franchise Dealer.",
};

export default function PartnerOnboardingPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-blue-500/30 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#030303] to-[#030303] -z-10" />
      <div className="w-full max-w-lg mb-8 text-center">
        <h1 className="text-4xl font-black tracking-tight mb-3">Partner with Us</h1>
        <p className="text-zinc-400 font-medium">Register as a Promoter or Franchise Dealer to start earning.</p>
      </div>
      <PartnerOnboardingClient />
    </div>
  );
}
