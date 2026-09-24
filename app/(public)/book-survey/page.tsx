import { BookSurveyClient } from "@/components/public/BookSurveyClient";

export const metadata = {
  title: "Book a Free Site Survey | TEAM CCTV",
  description: "Schedule a free site survey with our expert CCTV engineers.",
};

export default function BookSurveyPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 py-12">
      <div className="max-w-4xl w-full bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side Branding */}
        <div className="w-full md:w-1/3 bg-zinc-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl font-black mb-4">Secure Your Property.</h2>
            <p className="text-zinc-400 font-medium leading-relaxed mb-8">
              Book a free, no-obligation site survey. Our expert engineers will visit your location and design the perfect surveillance architecture.
            </p>
            <ul className="space-y-4">
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">✓</div>
                <span className="text-sm font-bold">100% Free Assessment</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">✓</div>
                <span className="text-sm font-bold">Exact Pricing Quote</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">✓</div>
                <span className="text-sm font-bold">Expert Camera Placement</span>
              </li>
            </ul>
          </div>
          
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-20"></div>
        </div>

        {/* Right Side Form */}
        <div className="w-full md:w-2/3 p-8">
          <BookSurveyClient />
        </div>

      </div>
    </div>
  );
}
