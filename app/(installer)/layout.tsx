export const metadata = {
  title: "Field Operations | TEAM CCTV",
  description: "Secure installer access for managing field jobs and wallet.",
};

export default function InstallerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans text-zinc-900 dark:text-zinc-100 selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-100 transition-colors duration-500">
      {children}
    </div>
  );
}
