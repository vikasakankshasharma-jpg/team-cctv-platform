import { verifySession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { CustomerAmcClient } from "@/components/customer/CustomerAmcClient";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "My Warranties & AMC | TEAM CCTV",
};

export const dynamic = "force-dynamic";

export default async function CustomerAmcPage() {
  const session = await verifySession();
  if (!session.isAuthenticated || session.role !== "customer") {
    redirect("/customer/login");
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20 pt-6 px-4 md:px-8">
      
      <div className="flex items-center gap-4">
        <Link href="/customer/dashboard" className="w-10 h-10 flex items-center justify-center bg-muted/50 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </Link>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground flex items-center gap-3">
            <ShieldCheck className="w-7 h-7 text-primary" />
            Warranties & Coverage
          </h1>
          <p className="text-muted-foreground mt-1">View active hardware warranties and renew Annual Maintenance Contracts.</p>
        </div>
      </div>
      
      <CustomerAmcClient />
    </div>
  );
}
