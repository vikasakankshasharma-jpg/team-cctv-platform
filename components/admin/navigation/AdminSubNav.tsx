"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { LucideIcon } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Grid3x3, MapPin, Zap, Workflow, Link2, IndianRupee,
  Package, Database, FileSpreadsheet, HeartPulse,
  Users, Calendar, ShieldCheck, Navigation,
  TrendingUp, FileBox, LayoutGrid, BadgePercent,
  Truck, HardHat, Clock, Settings2, CreditCard
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
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap leading-snug transition-all shrink-0 active:scale-95 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
              }`}
            >
              {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
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
  const { t } = useTranslation();
  const items: SubNavItem[] = [
    { name: t("adm_sub_live_sim", "Live Simulator"), href: "/admin/pricing", icon: IndianRupee },
    { name: t("adm_nav_matrices", "Quotation Matrices"), href: "/admin/pricing/matrices", icon: Grid3x3 },
    { name: t("adm_nav_geo_rules", "Geo-Surge & Pincodes"), href: "/admin/pricing/geo-rules", icon: MapPin },
    { name: t("adm_nav_addons", "Add-ons & Options"), href: "/admin/addons", icon: Zap },
    { name: t("adm_nav_rules", "Smart Suggestion Rules"), href: "/admin/rules", icon: Workflow },
    { name: t("adm_sub_comp_layouts", "Comparison Layouts"), href: "/admin/card-layouts", icon: LayoutGrid },
    { name: t("adm_nav_compatibility", "Compatibility Matrix"), href: "/admin/compatibility", icon: Link2 },
    { name: t("adm_sub_global_pricing", "Global Pricing Engine"), href: "/admin/settings?tab=pricing", icon: BadgePercent },
  ];
  return <AdminSubNavStrip items={items} />;
}

// ─── 2. HARDWARE & CATALOG SUB-NAV ────────────────────────────────────────────
export function CatalogSubNav() {
  const { t } = useTranslation();
  const items: SubNavItem[] = [
    { name: t("adm_nav_products", "Product Master"), href: "/admin/products", icon: Package },
    { name: t("adm_nav_inventory", "Warehouse Stock & POs"), href: "/admin/inventory", icon: Database },
    { name: t("adm_nav_vendor_import", "Vendor Price Import"), href: "/admin/vendor-import", icon: FileSpreadsheet },
    { name: t("adm_nav_catalog_health", "Catalog Quality Health"), href: "/admin/products/health", icon: HeartPulse },
    { name: t("adm_sub_brand_matrix", "Brand & Matrix Config"), href: "/admin/settings?tab=catalog", icon: Grid3x3 },
  ];
  return <AdminSubNavStrip items={items} />;
}

// ─── 3. SALES & CRM SUB-NAV ───────────────────────────────────────────────────
export function CrmSubNav() {
  const { t } = useTranslation();
  const items: SubNavItem[] = [
    { name: t("adm_nav_leads", "Leads Pipeline"), href: "/admin/leads", icon: Users },
    { name: t("adm_nav_bookings", "Site Visits & Surveys"), href: "/admin/bookings", icon: Calendar },
    { name: t("adm_nav_amc", "AMC Contracts"), href: "/admin/amc", icon: ShieldCheck },
    { name: t("adm_nav_salespersons", "Sales Representatives"), href: "/admin/salespersons", icon: Navigation },
    { name: t("adm_nav_beat_plans", "Territory Beat Plans"), href: "/admin/beat-plans", icon: Navigation },
  ];
  return <AdminSubNavStrip items={items} />;
}

// ─── 4. FINANCE & PROFITABILITY SUB-NAV ───────────────────────────────────────
export function FinanceSubNav() {
  const { t } = useTranslation();
  const items: SubNavItem[] = [
    { name: t("adm_nav_profitability", "Profitability Heatmaps"), href: "/admin/analytics/profitability", icon: TrendingUp },
    { name: t("adm_nav_finance", "Accounts Payable"), href: "/admin/finance", icon: IndianRupee },
    { name: t("adm_nav_billing", "Cloud Costs & Budgets"), href: "/admin/finance/billing", icon: CreditCard },
    { name: t("adm_nav_reports", "All Reports & Export"), href: "/admin/reports", icon: FileBox },
    { name: t("adm_sub_audit_trail", "Security Audit Trail"), href: "/admin/reports/logs", icon: ShieldCheck },
  ];
  return <AdminSubNavStrip items={items} />;
}

// ─── 5. OPERATIONS & EXPANSION SUB-NAV ────────────────────────────────────────
export function OperationsSubNav() {
  const { t } = useTranslation();
  const items: SubNavItem[] = [
    { name: t("adm_sub_dispatch_ctr", "Dispatch Center"), href: "/admin/dispatch", icon: Truck },
    { name: t("adm_nav_installers", "Verified Technicians"), href: "/admin/installers", icon: HardHat },
    { name: t("adm_nav_hubs", "City Inventory Hubs"), href: "/admin/hubs", icon: Database },
    { name: t("adm_nav_beat_plans", "Territory Beat Plans"), href: "/admin/beat-plans", icon: Navigation },
    { name: t("adm_nav_expansion", "Regional Expansion"), href: "/admin/expansion", icon: MapPin },
    { name: t("adm_sub_hours_sla", "Operating Hours & SLA"), href: "/admin/settings?tab=sla", icon: Clock },
  ];
  return <AdminSubNavStrip items={items} />;
}

// ─── 6. OVERVIEW & PIPELINE SUB-NAV ───────────────────────────────────────────
export function PipelineSubNav() {
  const { t } = useTranslation();
  const items: SubNavItem[] = [
    { name: t("adm_nav_dashboard", "Executive Dashboard"), href: "/admin", icon: TrendingUp },
    { name: t("adm_nav_funnel", "Quote Funnel"), href: "/admin/analytics/funnel", icon: Zap },
    { name: t("adm_nav_analytics", "Analytics Trends"), href: "/admin/analytics", icon: TrendingUp },
  ];
  return <AdminSubNavStrip items={items} />;
}

// ─── 7. PROMOTERS & GROWTH SUB-NAV ────────────────────────────────────────────
export function GrowthSubNav() {
  const { t } = useTranslation();
  const items: SubNavItem[] = [
    { name: t("adm_nav_promoters", "Promoter Network"), href: "/admin/promoters", icon: BadgePercent },
    { name: t("adm_nav_campaigns", "Follow-Up Campaigns"), href: "/admin/campaigns", icon: Zap },
    { name: t("adm_nav_marketing", "Marketing Collaterals"), href: "/admin/marketing", icon: FileBox },
    { name: t("adm_nav_expansion", "Regional Expansion"), href: "/admin/expansion", icon: MapPin },
  ];
  return <AdminSubNavStrip items={items} />;
}
