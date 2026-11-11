"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Command, Bell, Settings } from "lucide-react";
import { useOmniSearchStore } from "@/store/omni-search";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useTranslation } from "@/hooks/useTranslation";

interface AdminHeaderProps {
  userEmail: string;
  userRole: string;
}

const ROUTE_TITLE_MAP: Record<string, [string, string]> = {
  "/admin": ["adm_hdr_dashboard", "Dashboard"],
  "/admin/analytics/funnel": ["adm_nav_funnel", "Quote Funnel"],
  "/admin/analytics/profitability": ["adm_nav_profitability", "Profitability Heatmaps"],
  "/admin/analytics": ["adm_nav_analytics", "Analytics Trends"],
  "/admin/leads": ["adm_nav_leads", "Leads Pipeline"],
  "/admin/bookings": ["adm_nav_bookings", "Site Visits & Surveys"],
  "/admin/amc": ["adm_nav_amc", "AMC Contracts"],
  "/admin/salespersons": ["adm_nav_salespersons", "Sales Representatives"],
  "/admin/pricing/matrices": ["adm_nav_matrices", "Quotation Matrices"],
  "/admin/pricing/geo-rules": ["adm_nav_geo_rules", "Geo-Surge & Pincodes"],
  "/admin/addons": ["adm_nav_addons", "Add-ons & Options"],
  "/admin/rules": ["adm_nav_rules", "Smart Suggestion Rules"],
  "/admin/compatibility": ["adm_nav_compatibility", "Compatibility Matrix"],
  "/admin/pricing": ["adm_nav_pricing", "Live Pricing Engine"],
  "/admin/products": ["adm_nav_products", "Product Master"],
  "/admin/products/health": ["adm_nav_catalog_health", "Catalog Quality Health"],
  "/admin/products/bulk": ["adm_hdr_seg_bulk", "Bulk Operations"],
  "/admin/products/enrich": ["adm_hdr_seg_enrich", "Product Enrich"],
  "/admin/products/manual-enrich": ["adm_hdr_seg_manual_enrich", "Manual Enrich"],
  "/admin/inventory": ["adm_nav_inventory", "Warehouse Stock & POs"],
  "/admin/vendor-import": ["adm_nav_vendor_import", "Vendor Price Import"],
  "/admin/dispatch": ["adm_nav_dispatch", "Dispatch & Live Jobs"],
  "/admin/installers": ["adm_nav_installers", "Verified Technicians"],
  "/admin/hubs": ["adm_nav_hubs", "City Inventory Hubs"],
  "/admin/beat-plans": ["adm_nav_beat_plans", "Territory Beat Plans"],
  "/admin/promoters": ["adm_nav_promoters", "Promoter Network"],
  "/admin/campaigns": ["adm_nav_campaigns", "Follow-Up Campaigns"],
  "/admin/marketing": ["adm_nav_marketing", "Marketing Collaterals"],
  "/admin/expansion": ["adm_nav_expansion", "Regional Expansion"],
  "/admin/finance": ["adm_nav_finance", "Accounts Payable"],
  "/admin/finance/billing": ["adm_nav_billing", "Cloud Costs & Budgets"],
  "/admin/reports": ["adm_nav_reports", "All Reports & Export"],
  "/admin/settings": ["adm_nav_settings", "Global Settings"],
  "/admin/staff": ["adm_nav_staff", "Staff & Audit Trail"],
};

const SEGMENT_TITLE_MAP: Record<string, [string, string]> = {
  new: ["adm_hdr_seg_new", "Create New"],
  edit: ["adm_hdr_seg_edit", "Edit"],
  deal: ["adm_hdr_seg_deal", "Deal Workspace"],
  "quote-builder": ["adm_hdr_seg_quote_builder", "Quote Builder"],
  "card-layouts": ["adm_hdr_seg_card_layouts", "Card Layouts"],
  bulk: ["adm_hdr_seg_bulk", "Bulk Operations"],
  enrich: ["adm_hdr_seg_enrich", "Product Enrich"],
  "manual-enrich": ["adm_hdr_seg_manual_enrich", "Manual Enrich"],
  logs: ["adm_hdr_seg_logs", "Audit Logs"],
  franchises: ["adm_hdr_seg_franchises", "Franchises"],
  health: ["adm_nav_catalog_health", "Catalog Quality Health"],
  profitability: ["adm_nav_profitability", "Profitability Heatmaps"],
  billing: ["adm_nav_billing", "Cloud Costs & Budgets"],
};

// ─── Live IST Date (Replaces LiveClock) ──────────────────────────────────────
function LiveDate() {
  const { locale } = useTranslation();
  const [dateStr, setDateStr] = useState("");

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      try {
        setDateStr(
          now.toLocaleDateString(`${locale || "en"}-IN`, {
            timeZone: "Asia/Kolkata",
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        );
      } catch {
        setDateStr(
          now.toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
            month: "short",
            day: "numeric",
            year: "numeric",
          })
        );
      }
    };
    tick();
    const id = setInterval(tick, 1000 * 60 * 60); // update every hour
    return () => clearInterval(id);
  }, [locale]);

  return (
    <div style={{ fontSize: "10.5px", color: "var(--dim)", background: "var(--surface)", border: "0.5px solid var(--border)", padding: "3px 8px", borderRadius: "4px", fontFamily: "var(--font-mono), monospace", whiteSpace: "nowrap" }}>
      {dateStr}
    </div>
  );
}

// ─── Breadcrumb Title ─────────────────────────────────────────────────────────
function PageTitle() {
  const pathname = usePathname();
  const { t } = useTranslation();

  const exact = ROUTE_TITLE_MAP[pathname];
  if (exact) {
    return <div className="tb-title leading-snug">{t(exact[0], exact[1])}</div>;
  }

  const segments = pathname.replace("/admin", "").split("/").filter(Boolean);
  if (segments.length === 0) {
    return <div className="tb-title leading-snug">{t("adm_hdr_dashboard", "Dashboard")}</div>;
  }

  const lastSeg = segments[segments.length - 1];
  const segMatch = SEGMENT_TITLE_MAP[lastSeg];
  if (segMatch) {
    return <div className="tb-title leading-snug">{t(segMatch[0], segMatch[1])}</div>;
  }

  return (
    <div className="tb-title capitalize leading-snug">
      {lastSeg.replace(/-/g, " ")}
    </div>
  );
}

// ─── MAIN HEADER ──────────────────────────────────────────────────────────────
export function AdminHeader({ userEmail: _userEmail, userRole: _userRole }: AdminHeaderProps) {
  const { setIsOpen } = useOmniSearchStore();
  const { t } = useTranslation();

  return (
    <div className="topbar">
      
      {/* LEFT — Title + Date */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
        <PageTitle />
        <LiveDate />
      </div>

      {/* RIGHT — Search + Language + Bell + Settings */}
      <div className="tb-right">
        {/* Search */}
        <div className="tb-search" onClick={() => setIsOpen(true)} style={{ cursor: "pointer" }}>
          <Search style={{ width: "13px", height: "13px", flexShrink: 0 }} />
          <input 
            placeholder={t("adm_hdr_search_ph", "Search leads, quotes...")}
            readOnly 
            style={{ cursor: "pointer" }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: "2px", fontSize: "10px", opacity: 0.6, flexShrink: 0 }}>
            <Command style={{ width: "10px", height: "10px" }} /> K
          </div>
        </div>

        {/* Language Switcher */}
        <LanguageSwitcher
          compact
          className="!bg-[var(--surface2)] !border-[var(--border2)] !text-[var(--text)] hover:!bg-[var(--surface3)] !py-1.5 !px-2.5 !text-xs !rounded-lg"
        />

        {/* Notification Bell */}
        <div className="tb-btn" title={t("adm_hdr_notifications", "Notifications")} aria-label={t("adm_hdr_notifications", "Notifications")}>
          <Bell style={{ width: "15px", height: "15px" }} />
          <span className="dot"></span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Settings */}
        <Link href="/admin/settings" className="tb-btn" title={t("adm_hdr_settings", "Settings")} aria-label={t("adm_hdr_settings", "Settings")}>
          <Settings style={{ width: "15px", height: "15px" }} />
        </Link>
      </div>
    </div>
  );
}
