import Link from "next/link";
import { ArrowRight, Radio } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-8 transition-colors duration-500 overflow-hidden relative">

      {/* Decorative Orbs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/5 dark:bg-blue-600/10 rounded-full blur-[130px] animate-pulse" />
      </div>

      {/* Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.05] dark:opacity-[0.03]"
        style={{
          backgroundImage: "linear-gradient(rgba(0,0,0,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.1) 1px, transparent 1px)",
          backgroundSize: "40px 40px"
        }}
      />

      <div className="relative z-10 text-center max-w-md">

        {/* Signal Icon Wrapper */}
        <div className="relative w-32 h-32 mx-auto mb-10">
          <div className="absolute inset-0 bg-blue-600/10 dark:bg-blue-600/20 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-full h-full bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-[40px] shadow-2xl flex items-center justify-center">
            <Radio className="w-12 h-12 text-blue-600 dark:text-blue-500 animate-bounce" />

            {/* Ping rings */}
            <div className="absolute inset-0 rounded-[40px] border border-blue-500/30 animate-ping opacity-20" />
            <div className="absolute inset-0 rounded-[40px] border border-blue-500/30 animate-ping [animation-delay:0.5s] opacity-10" />
          </div>
        </div>

        <div className="space-y-4 mb-12">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.3em]">Status Code: 404</span>
          </div>
          <h1 className="text-5xl font-black text-zinc-900 dark:text-white tracking-tighter leading-none">
            Signal <span className="text-blue-600 dark:text-blue-500">Lost</span>.
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium text-lg leading-relaxed">
            The coordinates you requested are outside the mapped command territory.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 group px-6 py-3 bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl shadow-zinc-900/20 dark:shadow-blue-500/30"
          >
            Reconnect to Hub
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* System Signature */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-40 w-full">
          <div className="text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-[0.3em] whitespace-nowrap">CCTV Quotation Intelligence System v2.0</div>
          <div className="flex gap-4">
            <div className="w-1 h-1 rounded-full bg-red-500" />
            <div className="w-1 h-1 rounded-full bg-zinc-800" />
            <div className="w-1 h-1 rounded-full bg-zinc-800" />
          </div>
        </div>
      </div>
    </div>
  );
}
