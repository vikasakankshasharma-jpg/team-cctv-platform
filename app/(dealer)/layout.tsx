export const metadata = {
  title: "Dealer Portal | TEAM CCTV",
  description: "Secure franchise dealer access for managing territory leads.",
};

export default function DealerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 selection:bg-blue-500/30 transition-colors duration-500">
      {children}
    </div>
  );
}
