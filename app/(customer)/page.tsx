"use client";

import Link from "next/link";
import { 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Target, 
  Cpu, 
  Layers, 
  ChevronRight,
  Shield,
  Star,
  Award,
  Globe
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-zinc-950 transition-colors duration-500">
      
      {/* 1. Elite Hero Hub */}
      <section className="relative px-6 pt-32 pb-40 md:pt-48 md:pb-60 overflow-hidden">
        {/* Background Depth Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 bg-zinc-50 dark:bg-zinc-950">
          <div className="absolute top-[-10%] right-[-10%] w-[800px] h-[800px] bg-blue-200/40 dark:bg-blue-600/10 blur-[120px] rounded-full animate-pulse" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-200/20 dark:bg-indigo-600/5 blur-[100px] rounded-full" />
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] bg-[radial-gradient(#000_1px,transparent_1px)] dark:bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:32px_32px]" />
        </div>

        <div className="max-w-7xl mx-auto flex flex-col items-center lg:items-start text-center lg:text-left relative">
          
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-[10px] font-black uppercase tracking-[0.2em] mb-12 shadow-2xl backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-500" />
            <span>CCTV Quotation Home</span>
            <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            <span className="text-blue-600 dark:text-emerald-500">Live Status Active</span>
          </div>

          <h1 className="text-6xl md:text-8xl lg:text-9xl font-black text-zinc-900 dark:text-white tracking-tighter max-w-5xl mb-10 leading-[0.85] animate-in fade-in slide-in-from-bottom-8 duration-1000">
            High-Quality Security. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-blue-800 dark:from-blue-400 dark:via-blue-500 dark:to-indigo-500 italic">No Hidden Costs.</span>
          </h1>

          <p className="text-lg md:text-2xl text-zinc-500 dark:text-zinc-400 max-w-2xl mb-16 font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
             CCTV Quotation helps you plan your home or office security in seconds. No complex technical words. Just high-quality camera systems made simple for you.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 items-center w-full sm:w-auto animate-in fade-in slide-in-from-bottom-16 duration-1000 delay-300">
            <Link 
              href="/wizard"
              className="group relative inline-flex justify-center items-center gap-5 px-12 py-6 bg-zinc-900 dark:bg-blue-600 hover:bg-blue-700 dark:hover:bg-blue-500 text-white rounded-[32px] font-black text-xl transition-all shadow-2xl shadow-zinc-900/30 dark:shadow-blue-500/40 hover:-translate-y-2 active:scale-95"
            >
              Get Free Quote
              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>
            
            <div className="flex flex-col text-left px-4">
                <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Instant Analysis</span>
                <span className="text-sm font-bold text-zinc-900 dark:text-zinc-300">Created in seconds</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Architecture Philosophy Section */}
      <section className="bg-zinc-950 py-32 md:py-48 px-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-900 to-transparent" />
        
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            
            <div className="space-y-12">
               <div>
                  <h2 className="text-blue-500 font-black text-xs uppercase tracking-[0.4em] mb-6">How It Works</h2>
                  <h3 className="text-5xl md:text-6xl font-black text-white tracking-tighter leading-tight">Smart Security <br/> Made for You.</h3>
               </div>
               
               <div className="space-y-8">
                 {[
                   { icon: Target, title: "Perfect View", desc: "Our system looks at your building to make sure every corner is covered with no blind spots." },
                   { icon: Cpu, title: "Best Technology", desc: "Instantly compare different camera types like HD and IP based on what you need." },
                   { icon: Layers, title: "Simple Plans", desc: "Get three clear options (Budget, Normal, and Best) made specifically for your building." }
                 ].map((item, i) => (
                   <div key={i} className="flex gap-6 group">
                      <div className="w-14 h-14 rounded-[20px] bg-white/5 border border-white/10 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xl">
                        <item.icon className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xl font-black text-white mb-2">{item.title}</h4>
                        <p className="text-zinc-500 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                   </div>
                 ))}
               </div>
            </div>

            <div className="relative">
               <div className="aspect-square bg-gradient-to-br from-blue-600/20 to-indigo-600/20 rounded-[80px] border border-white/10 p-12 relative overflow-hidden group hover:border-blue-500/30 transition-all duration-700">
                  <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-3xl -z-10" />
                  
                  {/* Mock UI Element: System Status */}
                  <div className="bg-black/60 border border-white/10 p-8 rounded-[40px] shadow-2xl space-y-8 h-full flex flex-col justify-center">
                     <div className="space-y-2">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">System Quality</span>
                           <span className="text-emerald-500 font-black text-xs">99.9%</span>
                        </div>
                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500 w-[99.9%]" />
                        </div>
                     </div>
                     <div className="space-y-6">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-500"><Globe className="w-5 h-5"/></div>
                           <div>
                              <div className="text-sm font-black text-white">Multi-Location Sync</div>
                              <div className="text-[10px] font-bold text-zinc-500">Working in all rooms</div>
                           </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500"><Zap className="w-5 h-5"/></div>
                           <div>
                              <div className="text-sm font-black text-white">Instant Power Delivery</div>
                              <div className="text-[10px] font-bold text-zinc-500">Easy one-wire installation</div>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. Final Deployment CTA */}
      <section className="py-32 px-6 relative overflow-hidden text-center bg-white dark:bg-zinc-950 transition-colors">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
            <div className="w-24 h-24 bg-blue-50 dark:bg-blue-600/10 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-500 mb-12 animate-bounce">
                <Zap className="w-10 h-10 fill-current" />
            </div>
            <h2 className="text-6xl md:text-8xl font-black text-zinc-900 dark:text-white tracking-tighter mb-8 leading-[0.85]">Secure your space <br className="hidden md:block"/> today.</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xl md:text-2xl mb-16 font-medium max-w-2xl text-center">Join thousands of people who made their home and business safe with CCTV Quotation.</p>
            
            <Link 
              href="/wizard"
              className="group relative flex items-center gap-6 bg-zinc-900 dark:bg-blue-600 hover:bg-zinc-800 dark:hover:bg-blue-500 text-white px-14 py-8 rounded-[36px] font-black text-2xl transition-all shadow-[0_32px_64px_rgba(0,0,0,0.15)] dark:shadow-blue-500/30 hover:-translate-y-2"
            >
              Get Free Quote
              <ChevronRight className="w-8 h-8 group-hover:translate-x-2 transition-transform duration-300" />
            </Link>

            <div className="mt-20 flex items-center gap-8 grayscale opacity-50 dark:opacity-30">
               <Shield className="w-12 h-12" />
               <Star className="w-12 h-12" />
               <Award className="w-12 h-12" />
            </div>
        </div>
      </section>
    </div>
  );
}
