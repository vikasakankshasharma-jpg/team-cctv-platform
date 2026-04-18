"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Mail, ShieldAlert, ShieldCheck, Eye, EyeOff, Zap, BarChart2, Users } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/admin";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) throw new Error("Failed to create secure session");

      router.push(redirectTo);
      router.refresh();
      
    } catch (err: any) {
      setError("Invalid credentials or unauthorized access.");
      await auth.signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-zinc-50 dark:bg-zinc-950 overflow-hidden transition-colors duration-500">

      {/* ── LEFT BRANDING PANEL ─────────────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative flex-col justify-between p-14 overflow-hidden bg-white dark:bg-zinc-950 border-r border-zinc-100 dark:border-zinc-900/50 shadow-2xl z-20">
        
        {/* Animated background orbs */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[130px] animate-pulse" />
          <div className="absolute bottom-[-30%] right-[-20%] w-[500px] h-[500px] bg-indigo-600/5 dark:bg-indigo-600/10 rounded-full blur-[120px] animate-pulse [animation-delay:2s]" />
        </div>

        {/* Top Logo/Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/30">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em]">TEAM CCTV</p>
              <p className="text-sm font-black text-zinc-900 dark:text-white leading-none">Command Centre</p>
            </div>
          </div>
        </div>

        {/* Main Headline */}
        <div className="relative z-10">
          <h1 className="text-6xl font-black text-zinc-900 dark:text-white tracking-tighter leading-[0.88] mb-8">
            Intelligence<br/>
            <span className="text-blue-600 dark:text-blue-500 border-b-8 border-blue-600/10">Command</span><br/>
            Platform.
          </h1>
          <p className="text-zinc-400 dark:text-zinc-500 font-medium text-lg leading-relaxed max-w-xs">
            Real-time CRM, AI-assisted quotations, and sales analytics — all in one secured environment.
          </p>
        </div>

        {/* Feature Indicators */}
        <div className="relative z-10 space-y-4">
          {[
            { icon: BarChart2, label: "Live Sales Intelligence", sub: "Real-time KPIs and trend analytics" },
            { icon: Users, label: "Referral Network CRM", sub: "Full promoter commission pipeline" },
            { icon: Zap, label: "Automated Quote Engine", sub: "IP & HD hardware topology calculator" },
          ].map(({ icon: Icon, label, sub }) => (
            <div key={label} className="flex items-center gap-4 group">
              <div className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center group-hover:border-blue-500/30 transition-colors shrink-0 shadow-inner">
                <Icon className="w-4 h-4 text-blue-600 dark:text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] font-black text-zinc-500 dark:text-zinc-300 uppercase tracking-widest leading-tight">{label}</p>
                <p className="text-[10px] font-medium text-zinc-300 dark:text-zinc-600 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT FORM PANEL ────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-8 relative">
        
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(0,0,0,.15) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />

        <div className="w-full max-w-sm relative z-10">
          
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-6">
               <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-600/20 flex items-center justify-center border border-blue-100 dark:border-blue-500/20 shadow-inner">
                  <Lock className="w-4 h-4 text-blue-600 dark:text-blue-500" />
               </div>
               <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.3em]">Staff Access Portal</span>
            </div>
            <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter leading-tight mb-2">Secure<br/>Sign In</h2>
            <p className="text-zinc-400 dark:text-zinc-500 font-medium text-sm">Authorized personnel only. All sessions are audited.</p>
          </div>

          {error && (
            <div className="bg-red-500/5 border border-red-500/20 text-red-500 dark:text-red-400 px-5 py-4 rounded-2xl flex items-start gap-3 mb-8 animate-in fade-in slide-in-from-top-4">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="text-sm font-bold">{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 text-zinc-900 dark:text-white rounded-2xl pl-11 pr-5 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium placeholder:text-zinc-300 dark:placeholder:text-zinc-700 shadow-sm"
                  placeholder="admin@team-cctv.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em] ml-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600" />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-blue-500/50 text-zinc-900 dark:text-white rounded-2xl pl-11 pr-12 py-4 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all text-sm font-medium placeholder:text-zinc-300 dark:placeholder:text-zinc-700 shadow-sm"
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-600 hover:text-blue-500 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="group relative w-full h-16 bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-[11px] tracking-[0.3em] rounded-3xl transition-all disabled:opacity-40 disabled:cursor-not-allowed mt-6 overflow-hidden shadow-2xl shadow-blue-600/20 active:scale-[0.98] active:shadow-none"
            >
              <span className="relative z-10 flex items-center justify-center gap-3">
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Verifying Identity
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Secure Sign In
                  </>
                )}
              </span>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </form>

          <p className="text-center text-[10px] font-bold text-zinc-300 dark:text-zinc-700 uppercase tracking-widest mt-8">
            End-to-end encrypted · Firebase Auth · Session-gated
          </p>
        </div>
      </div>
    </div>
  );
}

