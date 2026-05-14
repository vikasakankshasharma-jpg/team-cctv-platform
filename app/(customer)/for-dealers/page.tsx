import { CheckCircle2, ShieldCheck, TrendingUp, Users, ArrowRight, Building2, MapPin } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Join the TEAM CCTV Franchise Network | Grow Your CCTV Business",
  description: "Get high-quality, verified CCTV leads in your territory. Join India's fastest growing franchise network for security system integrators.",
};

export default function ForDealersPage() {
  const benefits = [
    {
      icon: <MapPin className="w-6 h-6" />,
      title: "Territory Exclusivity",
      description: "We route leads based on pincodes. When an inquiry comes from your area, it's exclusively yours."
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "Verified Leads",
      description: "Every lead is pre-qualified through our smart wizard. No more chasing cold or fake inquiries."
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: "Custom Pricing",
      description: "Control your own margins. Use our portal to override product costs and set your labor rates."
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Brand Authority",
      description: "Leverage the TEAM CCTV brand and our high-fidelity quotation system to close deals faster."
    }
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100">
      
      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-full pointer-events-none opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-600 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-6xl mx-auto px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest border border-blue-100 dark:border-blue-800/40 mb-8 animate-fade-in">
            <Building2 className="w-3 h-3" /> Now Onboarding Partners
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 tracking-tight leading-[1.1]">
            Scale Your CCTV Business <br /> <span className="text-blue-600">With Verified Territory Leads</span>
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-10 font-medium">
            Join India's most advanced franchise network for security integrators. Get a ready-to-use digital platform, territory exclusivity, and high-conversion leads.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link 
              href="/onboarding" 
              className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-2"
            >
              Apply to Join <ArrowRight className="w-4 h-4" />
            </Link>
            <Link 
              href="/dealer/login" 
              className="w-full sm:w-auto px-8 py-4 bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all"
            >
              Dealer Login
            </Link>
          </div>
        </div>
      </section>

      {/* Benefits Grid */}
      <section className="py-20 bg-zinc-50 dark:bg-zinc-900/50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-black mb-4">Why Partner With TEAM CCTV?</h2>
            <p className="text-zinc-500 font-medium">Everything you need to dominate your local security market.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((b, i) => (
              <div key={i} className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                  {b.icon}
                </div>
                <h3 className="text-lg font-black mb-3">{b.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-zinc-900 dark:bg-blue-600 rounded-[3rem] p-12 text-center text-white relative overflow-hidden">
            <h2 className="text-3xl font-black mb-6">Ready to claim your territory?</h2>
            <p className="text-blue-100/70 mb-10 font-medium max-w-lg mx-auto">
              We are currently selecting exclusive partners for major cities across India. Apply today to secure your area.
            </p>
            <Link 
              href="/onboarding" 
              className="inline-flex px-10 py-5 bg-white text-zinc-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-100 transition-all gap-2 items-center"
            >
              Start Application <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-100 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">TC</div>
            <span className="text-sm font-black tracking-widest uppercase">TEAM CCTV</span>
          </div>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">© 2026 cctvquotation.com | A product of TEAM CCTV</p>
          <div className="flex gap-6 text-xs font-black uppercase tracking-widest text-zinc-500">
             <Link href="/terms" className="hover:text-blue-600">Terms</Link>
             <Link href="/privacy" className="hover:text-blue-600">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
