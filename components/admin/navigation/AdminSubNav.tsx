"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LucideIcon } from "lucide-react";
import {
  Grid3x3, MapPin, Zap, Workflow, Link2, IndianRupee,
  Package, Database, FileSpreadsheet, HeartPulse,
  Users, Calendar, ShieldCheck, Navigation,
  TrendingUp, FileBox, LayoutGrid, BadgePercent,
  Truck, HardHat, Clock, Settings2
} from "lucide-react";

export interface SubNavItem {
  name: string;
  href: string;
  icon?: LucideIcon;
  badge?: string;
}

export function AdminSubNavStrip({ items }: { items: SubNavItem[] }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="w-full border-b border-border/70 bg-card/70 backdrop-blur-md sticky top-0 z-20 mb-6 -mt-2">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-2 px-1">
        {items.map((item) => {
          let isActive = false;
          if (item.href.includes("?")) {
            const [itemPath, itemQuery] = item.href.split("?");
            const urlQuery = searchParams.toString();
            isActive = pathname === itemPath && urlQuery.includes(itemQuery);
          } else {
            isActive = pathname === item.href;
          }

          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5" />}
              <span>{item.name}</span>
              {item.badge && (
                <span
                  className={`text-[9.5px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                    isActive
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// ─── 1. PRICING & MARGINS SUB-NAV ─────────────────────────────────────────────
export function PricingSubNav() {
  const items: SubNavItem[] = [
    { name: "Live Simulator", href: "/admin/pricing", icon: IndianRupee },
    { name: "Quotation Matrices", href: "/admin/pricing/matrices", icon: Grid3x3 },
    { name: "Geo-Surge & Pincodes", href: "/admin/pricing/geo-rules", icon: MapPin },
    { name: "Add-ons & Options", href: "/admin/addons", icon: Zap },
    { name: "Recommendation Logic", href: "/admin/rules", icon: Workflow },
    { name: "Comparison Layouts", href: "/admin/card-layouts", icon: LayoutGrid },
    { name: "Compatibility Matrix", href: "/admin/compatibility", icon: Link2 },
    { name: "Global Pricing Engine", href: "/admin/settings?tab=pricing", icon: BadgePercent },
  ];
  return <AdminSubNavStrip items={items} />;
}

// ─── 2. HARDWARE & CATALOG SUB-NAV ────────────────────────────────────────────
export function CatalogSubNav() {
  const items: SubNavItem[] = [
    { name: "Product Master", href: "/admin/products", icon: Package },
    { name: "Warehouse Stock & POs", href: "/admin/inventory", icon: Database },
    { name: "Vendor Price Import", href: "/admin/vendor-import", icon: FileSpreadsheet },
    { name: "Catalog Quality Health", href: "/admin/products/health", icon: HeartPulse },
    { name: "Brand & Tier Config", href: "/admin/settings?tab=catalog", icon: Grid3x3 },
  ];
  return <AdminSubNavStrip items={items} />;
}

// ─── 3. SALES & CRM SUB-NAV ───────────────────────────────────────────────────
export function CrmSubNav() {
  const items: SubNavItem[] = [
    { name: "Leads Pipeline", href: "/admin/leads", icon: Users },
    { name: "Site Visits & Surveys", href: "/admin/bookings", icon: Calendar },
    { name: "AMC Contracts", href: "/admin/amc", icon: ShieldCheck },
    { name: "Sales Representatives", href: "/admin/salespersons", icon: Navigation },
    { name: "Territory Beat Plans", href: "/admin/beat-plans", icon: Navigation },
  ];
  return <AdminSubNavStrip items={items} />;
}

// ─── 4. FINANCE & PROFITABILITY SUB-NAV ───────────────────────────────────────
export function FinanceSubNav() {
  const items: SubNavItem[] = [
    { name: "Profitability Heatmaps", href: "/admin/analytics/profitability", icon: TrendingUp },
    { name: "Accounts Payable", href: "/admin/finance", icon: IndianRupee },
    { name: "All Reports & Export", href: "/admin/reports", icon: FileBox },
    { name: "Security Audit Trail", href: "/admin/reports/logs", icon: ShieldCheck },
  ];
  return <AdminSubNavStrip items={items} />;
}

// ─── 5. OPERATIONS & EXPANSION SUB-NAV ────────────────────────────────────────
export function OperationsSubNav() {
  const items: SubNavItem[] = [
    { name: "Dispatch Center", href: "/admin/dispatch", icon: Truck },
    { name: "City Hubs & Expansion", href: "/admin/expansion", icon: MapPin },
    { name: "Verified Installers", href: "/admin/installers", icon: HardHat },
    { name: "Operating Hours & SLA", href: "/admin/settings?tab=sla", icon: Clock },
  ];
  return <AdminSubNavStrip items={items} />;
}
