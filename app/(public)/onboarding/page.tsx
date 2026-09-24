import { OnboardingClient } from "@/components/auth/OnboardingClient";

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <OnboardingClient />
    </div>
  );
}
