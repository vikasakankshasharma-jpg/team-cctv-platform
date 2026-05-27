export const metadata = {
  manifest: "/manifest-dealer.json",
  title: "Dealer Portal | TEAM CCTV",
  description: "Secure franchise dealer access for managing territory leads.",
};

export default function DealerRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-[#030303] font-sans text-white selection:bg-blue-500/30 transition-colors duration-500">
      {children}
    </div>
  );
}
