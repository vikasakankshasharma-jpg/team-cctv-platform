import { UnifiedLoginClient } from "@/components/auth/UnifiedLoginClient";

export const metadata = {
  title: "Login | TEAM CCTV",
  description: "Secure login for customers, staff, and partners.",
};

export default function UnifiedLoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>
        
        <UnifiedLoginClient />
      </div>
    </div>
  );
}
