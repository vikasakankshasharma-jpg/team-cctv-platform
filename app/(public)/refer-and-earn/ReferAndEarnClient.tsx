"use client";

import React, { useState } from "react";
import { ArrowRight, Gift, IndianRupee, Users, CheckCircle, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReferAndEarnClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [loading, setLoading] = useState(false);

  const [successCode, setSuccessCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || mobile.length !== 10) return;
    setLoading(true);
    setErrorMsg("");
    
    try {
      const res = await fetch("/api/refer-and-earn/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, mobile_number: mobile })
      });
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error?.message || data.message || "Failed to register");
      }
      
      setSuccessCode(data.data.referral_code);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (successCode) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600"></div>
          <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle size={40} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">You're In, {name}!</h2>
          <p className="text-slate-600 mb-6">Your unique referral code is ready. A WhatsApp confirmation has been sent to your number.</p>
          
          <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl p-6 mb-8">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Your Referral Code</p>
            <div className="text-4xl font-black text-blue-600 tracking-widest">{successCode}</div>
          </div>
          
          <button 
            onClick={() => router.push("/partner/login")}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
          >
            Go to Partner Dashboard <ArrowRight size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-900 text-white py-16 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 transform translate-x-1/4 -translate-y-1/4">
          <Gift size={400} />
        </div>
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-6">
            Refer & Earn ₹500
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Share your code. They install CCTV. You earn ₹500 cash. Simple.
          </p>
          <div className="inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 px-6 py-3 rounded-full font-bold shadow-lg">
            <CheckCircle size={20} />
            <span>Plus, your friends get ₹500 Discount!</span>
          </div>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-12">How It Works</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">1. Register</h3>
            <p className="text-slate-600">Enter your name and mobile number below to instantly get your unique referral code.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">2. Share Posters</h3>
            <p className="text-slate-600">Download your personalized EDM posters and share them on your WhatsApp status.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <IndianRupee size={32} />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">3. Earn Cash</h3>
            <p className="text-slate-600">Get flat ₹500 in your bank account for every successful CCTV installation you refer.</p>
          </div>
        </div>
      </div>

      {/* Registration Form */}
      <div className="max-w-xl mx-auto px-4 pb-20">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-slate-100 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-green-500"></div>
          
          <h2 className="text-2xl font-bold text-slate-800 mb-6 text-center">Join the Program Instantly</h2>
          
          <form onSubmit={handleJoin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Your Full Name</label>
              <input 
                type="text" 
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Rahul Sharma"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Mobile Number</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-slate-400 font-medium">+91</span>
                <input 
                  type="tel" 
                  value={mobile}
                  onChange={e => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="9876543210"
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                  required
                />
              </div>
            </div>
            
            {errorMsg && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                {errorMsg}
              </div>
            )}
            
            <button 
              type="submit"
              disabled={loading || mobile.length !== 10 || !name}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              {loading ? "Please wait..." : "Get My Referral Code"}
              {!loading && <ArrowRight size={20} />}
            </button>
          </form>
          
          <p className="text-center text-sm text-slate-500 mt-6">
            Already a partner? <a href="/partner/login" className="text-blue-600 font-semibold hover:underline">Login here</a>
          </p>
        </div>
      </div>
    </div>
  );
}
