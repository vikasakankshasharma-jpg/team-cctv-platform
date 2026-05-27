export const metadata = {
  manifest: "/manifest-partner.json",
  title: "Partner Portal | TEAM CCTV",
  description: "Secure partner access for managing referrals and commissions.",
};

export default function PartnerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 selection:bg-amber-500/30 selection:text-amber-900 dark:selection:text-amber-100 transition-colors duration-500">
      {children}
    </div>
  );
}
