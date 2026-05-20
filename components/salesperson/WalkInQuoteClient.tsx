"use client";

import { useState } from "react";
import { FileText, ArrowRight, Copy, Check, MessageSquare, User, Phone, MapPin, Home, Camera } from "lucide-react";

const PROPERTY_TYPES = [
  { value: "home",      label: "Home / Flat" },
  { value: "bungalow",  label: "Bungalow / Villa" },
  { value: "office",    label: "Office / Shop" },
  { value: "warehouse", label: "Warehouse / Factory" },
];

export default function WalkInQuoteClient() {
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    city: "Jaipur",
    property_type: "home",
    camera_count: 4,
  });
  const [loading, setLoading] = useState(false);
  const [quoteUrl, setQuoteUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setQuoteUrl(null);

    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name:     form.name,
          mobile_number:     form.mobile,
          property_type:     form.property_type,
          technology_choice: "HD",
          cabling_done:      false,
          detected_city:     form.city,
          source:            "walk_in",
          wizard_answers: {
            camera_count:  form.camera_count,
            property_type: form.property_type,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to create lead");
      }

      const { leadId } = await res.json();
      const url = `${window.location.origin}/quote/${leadId}`;
      setQuoteUrl(url);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!quoteUrl) return;
    await navigator.clipboard.writeText(quoteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!quoteUrl) return;
    const msg = encodeURIComponent(
      `Namaste ${form.name} ji! 🙏\n\nYour personalised CCTV quotation is ready.\n\n👉 ${quoteUrl}\n\nReview karo aur confirm karo — hum installation plan karenge.\n\n- TEAM CCTV`
    );
    window.open(`https://wa.me/91${form.mobile}?text=${msg}`, "_blank");
  };

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="max-w-2xl space-y-8 animate-in fade-in duration-500">
      {!quoteUrl ? (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-6 shadow-sm">
          <div>
            <h2 className="text-xl font-black text-zinc-900 dark:text-white mb-1">Walk-In Customer Details</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Fill in the customer's basic info to generate an instant quotation link.</p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <User className="w-3 h-3" /> Customer Name
            </label>
            <input
              required
              value={form.name}
              onChange={e => set("name", e.target.value)}
              placeholder="e.g. Ramesh Sharma"
              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400"
            />
          </div>

          {/* Mobile */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Phone className="w-3 h-3" /> Mobile Number
            </label>
            <input
              required
              type="tel"
              pattern="[0-9]{10}"
              value={form.mobile}
              onChange={e => set("mobile", e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-zinc-400"
            />
          </div>

          {/* City + Property Type — side by side */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <MapPin className="w-3 h-3" /> City
              </label>
              <input
                required
                value={form.city}
                onChange={e => set("city", e.target.value)}
                placeholder="e.g. Jaipur"
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Home className="w-3 h-3" /> Property Type
              </label>
              <select
                value={form.property_type}
                onChange={e => set("property_type", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              >
                {PROPERTY_TYPES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Camera Count */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
              <Camera className="w-3 h-3" /> Camera Count — <span className="text-blue-500">{form.camera_count} cameras</span>
            </label>
            <input
              type="range"
              min={1} max={16} step={1}
              value={form.camera_count}
              onChange={e => set("camera_count", parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-[9px] font-bold text-zinc-400">
              {[1,2,4,6,8,12,16].map(n => <span key={n}>{n}</span>)}
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-700 dark:text-red-400 text-sm font-bold">
              ⚠ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-500/30 hover:-translate-y-0.5 active:translate-y-0 group"
          >
            {loading ? "Generating…" : "Generate Quote Link"}
            {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8 space-y-6 shadow-sm animate-in fade-in zoom-in-95 duration-500">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-xl shadow-emerald-500/30">
              <Check className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">Quote Ready!</h2>
              <p className="text-sm text-zinc-500">Share this link with <span className="font-bold text-zinc-700 dark:text-zinc-300">{form.name}</span></p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <p className="text-sm font-mono text-zinc-600 dark:text-zinc-300 flex-1 truncate">{quoteUrl}</p>
            <button onClick={handleCopy} className={`p-2 rounded-xl transition-all ${copied ? "bg-emerald-500 text-white" : "bg-zinc-200 dark:bg-zinc-700 hover:bg-blue-500 hover:text-white"}`}>
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleWhatsApp}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
            >
              <MessageSquare className="w-4 h-4" /> Send on WhatsApp
            </button>
            <button
              onClick={() => { setQuoteUrl(null); setForm({ name: "", mobile: "", city: "Jaipur", property_type: "home", camera_count: 4 }); }}
              className="flex items-center justify-center gap-2 px-6 py-3.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all"
            >
              New Quote
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
