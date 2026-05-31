"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, User, Building, Phone, Mail, ShieldCheck, Loader2 } from "lucide-react";
import Link from "next/link";

export default function PartnerOnboardingClient() {
  const [form, setForm] = useState({
    name: "",
    business_name: "",
    mobile_number: "",
    email: "",
    partner_type: "promoter",
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{ referral_code: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/partner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Registration failed");
      }
      const data = await res.json();
      setSuccessData({ referral_code: data.referral_code });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    return (
      <div className="bg-card border border-border rounded-3xl p-8 max-w-md w-full text-center space-y-6 shadow-xl animate-in zoom-in-95 duration-500">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-success" />
        </div>
        <h2 className="text-2xl font-black text-foreground">Welcome to the Team!</h2>
        <p className="text-muted-foreground text-sm">Your partner account has been created successfully.</p>
        
        <div className="p-4 bg-muted/50 rounded-2xl border border-border">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Your Unique Referral Code</p>
          <div className="text-3xl font-black tracking-widest text-primary">{successData.referral_code}</div>
        </div>

        <Link href="/partner/login" className="block w-full py-4 bg-primary text-primary-foreground font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform">
          Go to Partner Portal
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-8 max-w-md w-full space-y-6 shadow-xl animate-in fade-in duration-500">
      
      {/* Partner Type Selection */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button 
          type="button" 
          onClick={() => setForm(f => ({...f, partner_type: "promoter"}))}
          className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${form.partner_type === "promoter" ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted'}`}
        >
          <User className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Promoter</span>
        </button>
        <button 
          type="button" 
          onClick={() => setForm(f => ({...f, partner_type: "dealer"}))}
          className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${form.partner_type === "dealer" ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-muted/50 text-muted-foreground hover:bg-muted'}`}
        >
          <Building className="w-6 h-6" />
          <span className="text-xs font-bold uppercase tracking-wider">Franchise Dealer</span>
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5"><User className="w-3 h-3"/> Full Name</label>
          <input required value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Rahul Sharma" />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5"><Building className="w-3 h-3"/> Business Name</label>
          <input required value={form.business_name} onChange={e => setForm(f => ({...f, business_name: e.target.value}))} className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none" placeholder="Sharma Enterprises" />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5"><Phone className="w-3 h-3"/> Mobile Number</label>
          <input required type="tel" pattern="[0-9]{10}" value={form.mobile_number} onChange={e => setForm(f => ({...f, mobile_number: e.target.value}))} className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none" placeholder="10-digit mobile" />
        </div>
        <div>
          <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5 mb-1.5"><Mail className="w-3 h-3"/> Email Address</label>
          <input required type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="w-full px-4 py-3 rounded-2xl border border-input bg-background text-foreground focus:ring-2 focus:ring-primary focus:outline-none" placeholder="rahul@example.com" />
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs font-bold rounded-xl text-center">
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20">
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ShieldCheck className="w-5 h-5" /> Register Now</>}
      </button>

      <p className="text-center text-xs font-medium text-muted-foreground mt-4">
        Already a partner? <Link href="/partner/login" className="text-primary hover:underline">Log in here</Link>
      </p>
    </form>
  );
}
