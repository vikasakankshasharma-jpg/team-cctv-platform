"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase-client";
import { GoogleAuthProvider, signInWithPopup, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { Loader2, Phone, Mail, UserCircle2, Briefcase } from "lucide-react";
import { toast } from "sonner";

export function UnifiedLoginClient() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"customer" | "staff">("customer");
  
  // States
  const [isLoading, setIsLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  
  // Google Sign-In (Staff Only)
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      
      // Send to our Universal Identity Router
      const res = await fetch("/api/auth/unified/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken, authMethod: "google" }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        // Sign them out of Firebase if backend rejects them
        await auth.signOut();
        toast.error(data.error || "Unauthorized access.");
        return;
      }
      
      toast.success("Login successful!");
      router.push(data.redirectUrl || "/");
      
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || "Failed to sign in with Google.");
    } finally {
      setIsLoading(false);
    }
  };

  // Generic OTP Flow Placeholder (for demo/wiring)
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // In production, wire up Firebase Phone Auth or Resend Email OTP here.
    // We simulate success for now to reach the verification step.
    setTimeout(() => {
      setOtpSent(true);
      setIsLoading(false);
      toast.success("OTP Sent! (Use 123456 for demo)");
    }, 1000);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Simulation of Universal Router via mock token
      const res = await fetch("/api/auth/unified/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          idToken: "mock-jwt-token", // In production, pass the real Firebase ID Token
          authMethod: "otp",
          identifier,
          roleContext: activeTab
        }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Verification failed.");
        return;
      }
      
      toast.success("Login successful!");
      router.push(data.redirectUrl || "/");
    } catch (e: any) {
      toast.error("Failed to verify OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border overflow-hidden animate-in fade-in zoom-in-95 duration-500">
      {/* Tabs */}
      <div className="flex border-b">
        <button 
          onClick={() => { setActiveTab("customer"); setOtpSent(false); }}
          className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === "customer" ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <UserCircle2 className="w-4 h-4" /> Customer
        </button>
        <button 
          onClick={() => { setActiveTab("staff"); setOtpSent(false); }}
          className={`flex-1 py-4 font-bold text-sm flex items-center justify-center gap-2 transition-colors ${activeTab === "staff" ? "text-gray-900 border-b-2 border-gray-900 bg-gray-50" : "text-gray-500 hover:bg-gray-50"}`}
        >
          <Briefcase className="w-4 h-4" /> Staff & Partner
        </button>
      </div>

      <div className="p-6 sm:p-8">
        {activeTab === "staff" && !otpSent && (
          <div className="mb-6 space-y-4">
            <button 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-50"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign in with Google
            </button>
            
            <div className="flex items-center gap-4">
              <div className="h-px bg-gray-200 flex-1"></div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Or</span>
              <div className="h-px bg-gray-200 flex-1"></div>
            </div>
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                {activeTab === "customer" ? "Mobile Number" : "Email or Mobile"}
              </label>
              <div className="relative">
                <div className="absolute left-4 top-3.5 text-gray-400">
                  {activeTab === "customer" ? <Phone className="w-5 h-5" /> : <Mail className="w-5 h-5" />}
                </div>
                <input 
                  type="text" 
                  required
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                  placeholder={activeTab === "customer" ? "Enter your 10-digit mobile" : "name@company.com"}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all font-medium text-gray-900"
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === "customer" ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30" : "bg-gray-900 text-white hover:bg-gray-800 shadow-lg shadow-gray-900/20"} disabled:opacity-50`}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Login Code"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-6 animate-in slide-in-from-right-4">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-2">
                <Mail className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900">Enter Verification Code</h3>
              <p className="text-sm text-gray-500">We sent a secure code to <br/><span className="font-medium text-gray-900">{identifier}</span></p>
            </div>
            
            <input 
              type="text" 
              required
              maxLength={6}
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\\D/g, ''))}
              placeholder="0 0 0 0 0 0"
              className="w-full text-center tracking-[0.5em] text-2xl font-black py-4 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-all"
            />
            
            <button 
              type="submit" 
              disabled={isLoading || otpCode.length < 6}
              className={`w-full font-bold py-3.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === "customer" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-900 text-white hover:bg-gray-800"} disabled:opacity-50`}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Sign In"}
            </button>

            <button type="button" onClick={() => setOtpSent(false)} className="w-full text-sm font-bold text-gray-400 hover:text-gray-600">
              ← Back to start
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
