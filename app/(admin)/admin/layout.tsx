import { AdminHeader } from "@/components/admin/AdminHeader";
import { Sidebar } from "@/components/admin/Sidebar";
import { OmniSearch } from "@/components/admin/OmniSearch";
import { verifySession } from "@/lib/auth-server";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata = {
  manifest: "/manifest-admin.json",
  title: "Admin Portal | CCTVQuotation"
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await verifySession();
  
  if (!session.isAuthenticated) {
    return (
      <div className={`dark ${spaceGrotesk.variable} ${jetbrainsMono.variable} min-h-screen bg-[#0A0E1A] font-sans text-[#E8EDF5]`}>
        {children}
      </div>
    );
  }

  return (
    <div className={`dark ${spaceGrotesk.variable} ${jetbrainsMono.variable} flex h-screen overflow-hidden font-sans`}
      style={{
        backgroundColor: '#0A0E1A',
        color: '#E8EDF5',
        '--bg': '#0A0E1A',
        '--surface': '#111827',
        '--surface2': '#1A2234',
        '--surface3': '#212B3F',
        '--border': '#1E2D45',
        '--border2': '#263550',
        '--text': '#E8EDF5',
        '--muted': '#8A98B4',
        '--dim': '#4A5670',
        '--gold': '#D4953A',
        '--gold-dim': 'rgba(212,149,58,0.12)',
        '--gold-border': 'rgba(212,149,58,0.25)',
        '--blue': '#3B82F6',
        '--blue-dim': 'rgba(59,130,246,0.12)',
        '--green': '#10B981',
        '--green-dim': 'rgba(16,185,129,0.12)',
        '--red': '#EF4444',
        '--red-dim': 'rgba(239,68,68,0.12)',
        '--amber': '#F59E0B',
        '--amber-dim': 'rgba(245,158,11,0.12)',
        '--purple': '#8B5CF6',
        '--purple-dim': 'rgba(139,92,246,0.12)',
        '--r': '8px',
        '--r2': '12px'
      } as React.CSSProperties}
    >
      <OmniSearch />
      <Sidebar />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="hidden md:block">
          <AdminHeader 
            userEmail={session.user?.email || session.user?.phone_number || "Unknown"} 
            userRole={session.role || "admin"} 
          />
        </div>

        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 pt-18 md:pt-4 lg:pt-6 relative scrollbar-none bg-[var(--bg)]">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
