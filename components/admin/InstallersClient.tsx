"use client";

import { useState, useMemo } from "react";
import type { Installer, InstallerApplication } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  ShieldAlert, 
  ShieldCheck, 
  Banknote, 
  Loader2, 
  X, 
  CheckCircle2, 
  Plus, 
  Copy, 
  Check, 
  ExternalLink, 
  UserPlus, 
  Users, 
  MapPin, 
  Wrench, 
  AlertTriangle, 
  Building2, 
  Phone, 
  Briefcase,
  FileCheck2,
  SlidersHorizontal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PageHeader } from "@/components/admin/PageHeader";
import { 
  createInstaller, 
  updateInstaller, 
  toggleInstallerActive, 
  updateInstallerKyc, 
  approveInstallerApplication, 
  rejectInstallerApplication 
} from "@/app/actions/installers";

interface InstallersClientProps {
  initialInstallers?: Installer[];
  initialApplications?: InstallerApplication[];
  data?: Installer[]; // backward compatibility
}

const COMMON_SKILLS = [
  "cctv_installation",
  "ip_cameras",
  "analog_hd",
  "biometrics_access",
  "solar_cctv",
  "amc_maintenance",
  "structured_cabling"
];

export function InstallersClient({ 
  initialInstallers, 
  initialApplications = [], 
  data 
}: InstallersClientProps) {
  const [installers, setInstallers] = useState<Installer[]>(initialInstallers || data || []);
  const [applications, setApplications] = useState<InstallerApplication[]>(initialApplications);
  const [activeTab, setActiveTab] = useState<"network" | "applications">("network");
  
  // Search & Filter State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "pending_kyc" | "unverified_bank">("all");
  const [copiedLink, setCopiedLink] = useState(false);

  // Bank Verification State
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedInstaller, setSelectedInstaller] = useState<Installer | null>(null);
  const [bankAccount, setBankAccount] = useState("");
  const [bankIfsc, setBankIfsc] = useState("");
  const [nameAtBank, setNameAtBank] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Manual Payout State
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  // Add Installer State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newInstallerForm, setNewInstallerForm] = useState({
    name: "",
    mobile_number: "",
    email: "",
    entity_type: "individual" as "individual" | "firm",
    serviceable_pincodes_raw: "",
    pan_number: "",
    gst_number: "",
    skills: ["cctv_installation", "analog_hd", "ip_cameras"] as string[],
  });

  // Edit Installer State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingInstaller, setEditingInstaller] = useState<Installer | null>(null);
  const [editPincodesRaw, setEditPincodesRaw] = useState("");
  const [editSkills, setEditSkills] = useState<string[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);

  // Applications Processing State
  const [processingAppId, setProcessingAppId] = useState<string | null>(null);

  // Summary Metrics
  const activeCount = useMemo(() => installers.filter(i => i.is_active).length, [installers]);
  const inactiveCount = installers.length - activeCount;
  const pendingKycCount = useMemo(() => installers.filter(i => i.kyc_status === "pending").length, [installers]);
  const unverifiedBankCount = useMemo(() => installers.filter(i => !i.bank_account_verified).length, [installers]);
  const pendingApplicationsCount = useMemo(() => applications.filter(a => a.status === "pending").length, [applications]);
  const totalWalletHold = useMemo(() => installers.reduce((sum, i) => sum + (i.wallet_balance || 0), 0), [installers]);
  const totalUniquePincodes = useMemo(() => {
    const pins = new Set<string>();
    installers.forEach(i => {
      const list = i.territory?.allowed_pincodes || i.serviceable_pincodes || [];
      list.forEach(p => pins.add(p));
    });
    return pins.size;
  }, [installers]);

  // Filtered Installers
  const filteredInstallers = useMemo(() => {
    return installers.filter(i => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || 
        i.name.toLowerCase().includes(q) || 
        i.mobile_number.includes(q) ||
        (i.serviceable_pincodes || []).some(pin => pin.includes(q)) ||
        (i.territory?.allowed_pincodes || []).some(pin => pin.includes(q));

      if (!matchesSearch) return false;

      if (statusFilter === "active") return i.is_active;
      if (statusFilter === "inactive") return !i.is_active;
      if (statusFilter === "pending_kyc") return i.kyc_status === "pending";
      if (statusFilter === "unverified_bank") return !i.bank_account_verified;
      return true;
    });
  }, [installers, search, statusFilter]);

  // Copy registration link
  const handleCopyInviteLink = () => {
    const url = typeof window !== "undefined" 
      ? `${window.location.origin}/for-installers` 
      : "https://cctvquotation.com/for-installers";
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    toast.success("Technician application link copied to clipboard!");
    setTimeout(() => setCopiedLink(false), 3000);
  };

  // Open Edit Modal
  const handleOpenEdit = (installer: Installer) => {
    setEditingInstaller(installer);
    const pins = installer.territory?.allowed_pincodes || installer.serviceable_pincodes || [];
    setEditPincodesRaw(pins.join(", "));
    setEditSkills(installer.skills || ["cctv_installation"]);
    setIsEditModalOpen(true);
  };

  // Save Edit Modal
  const handleSaveEdit = async () => {
    if (!editingInstaller?.id) return;
    setIsUpdating(true);
    try {
      const pins = editPincodesRaw
        .split(",")
        .map(p => p.trim())
        .filter(p => p.length === 6);

      if (pins.length === 0) {
        toast.error("Please enter at least one valid 6-digit pincode.");
        setIsUpdating(false);
        return;
      }

      await updateInstaller(editingInstaller.id, {
        serviceable_pincodes: pins,
        skills: editSkills,
      });

      setInstallers(prev => prev.map(i => {
        if (i.id === editingInstaller.id) {
          return {
            ...i,
            serviceable_pincodes: pins,
            skills: editSkills,
          };
        }
        return i;
      }));

      toast.success("Installer profile updated successfully!");
      setIsEditModalOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update installer");
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle active status
  const handleToggleActive = async (installer: Installer) => {
    if (!installer.id) return;
    const newStatus = !installer.is_active;
    try {
      await toggleInstallerActive(installer.id, newStatus);
      setInstallers(prev => prev.map(i => i.id === installer.id ? { ...i, is_active: newStatus } : i));
      toast.success(`${installer.name} marked as ${newStatus ? "Active" : "Inactive"}`);
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  };

  // Update KYC status
  const handleUpdateKyc = async (installer: Installer, status: "pending" | "verified" | "suspended") => {
    if (!installer.id) return;
    try {
      await updateInstallerKyc(installer.id, status);
      setInstallers(prev => prev.map(i => i.id === installer.id ? { ...i, kyc_status: status } : i));
      toast.success(`KYC status updated to: ${status}`);
    } catch (err: any) {
      toast.error("Failed to update KYC status");
    }
  };

  // Create new installer
  const handleCreateInstaller = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstallerForm.name.trim() || !newInstallerForm.mobile_number.trim()) {
      toast.error("Name and 10-digit mobile number are required.");
      return;
    }

    const pins = newInstallerForm.serviceable_pincodes_raw
      .split(",")
      .map(p => p.trim())
      .filter(p => p.length === 6);

    if (pins.length === 0) {
      toast.error("Please enter at least one valid 6-digit serviceable pincode.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await createInstaller({
        name: newInstallerForm.name.trim(),
        mobile_number: newInstallerForm.mobile_number.trim(),
        email: newInstallerForm.email.trim() || null,
        entity_type: newInstallerForm.entity_type,
        serviceable_pincodes: pins,
        skills: newInstallerForm.skills,
        pan_number: newInstallerForm.pan_number.trim().toUpperCase() || undefined,
        gst_number: newInstallerForm.gst_number.trim().toUpperCase() || null,
      });

      if (res.success) {
        toast.success("Installer successfully added to network!");
        const newInst: Installer = {
          id: res.id,
          name: newInstallerForm.name.trim(),
          mobile_number: newInstallerForm.mobile_number.trim(),
          email: newInstallerForm.email.trim() || undefined,
          entity_type: newInstallerForm.entity_type,
          serviceable_pincodes: pins,
          skills: newInstallerForm.skills,
          kyc_status: "pending",
          is_active: true,
          sla_score: 100,
          avg_rating: 5.0,
          jobs_completed: 0,
          sla_breaches: 0,
          wallet_balance: 0,
        };
        setInstallers(prev => [newInst, ...prev]);
        setIsAddModalOpen(false);
        setNewInstallerForm({
          name: "",
          mobile_number: "",
          email: "",
          entity_type: "individual",
          serviceable_pincodes_raw: "",
          pan_number: "",
          gst_number: "",
          skills: ["cctv_installation", "analog_hd", "ip_cameras"],
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add installer");
    } finally {
      setIsCreating(false);
    }
  };

  // Inbound Application Approve
  const handleApproveApplication = async (app: InstallerApplication) => {
    if (!app.id) return;
    setProcessingAppId(app.id);
    try {
      const res = await approveInstallerApplication(app.id);
      if (res.success) {
        toast.success(`Approved ${app.name} into verified network!`);
        // Update applications list
        setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: "approved" } : a));
        // Add to installers list
        const newInst: Installer = {
          id: res.installerId,
          name: app.name,
          mobile_number: app.mobile_number,
          serviceable_pincodes: app.primary_pincode ? [app.primary_pincode] : [],
          skills: ["cctv_installation", "wiring", "mounting"],
          entity_type: app.gstin ? "firm" : "individual",
          kyc_status: "pending",
          is_active: true,
          sla_score: 100,
          avg_rating: 5.0,
          jobs_completed: 0,
          sla_breaches: 0,
          wallet_balance: 0,
        };
        setInstallers(prev => [newInst, ...prev]);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to approve application");
    } finally {
      setProcessingAppId(null);
    }
  };

  // Inbound Application Reject
  const handleRejectApplication = async (app: InstallerApplication) => {
    if (!app.id) return;
    if (!confirm(`Are you sure you want to reject the application from ${app.name}?`)) return;
    setProcessingAppId(app.id);
    try {
      await rejectInstallerApplication(app.id);
      toast.success(`Application from ${app.name} rejected.`);
      setApplications(prev => prev.map(a => a.id === app.id ? { ...a, status: "rejected" } : a));
    } catch (err: any) {
      toast.error(err.message || "Failed to reject application");
    } finally {
      setProcessingAppId(null);
    }
  };

  // Bank verify handlers
  const handleOpenVerify = (installer: Installer) => {
    setSelectedInstaller(installer);
    setBankAccount(installer.bank_account || "");
    setBankIfsc(installer.bank_ifsc || "");
    setNameAtBank(installer.bank_verified_name || installer.name);
    setIsVerifyModalOpen(true);
  };

  const handleVerifyBank = async () => {
    if (!selectedInstaller || !bankAccount || !bankIfsc || !nameAtBank) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsVerifying(true);
    try {
      const res = await fetch("/api/admin/installers/verify-bank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installerId: selectedInstaller.id,
          bank_account: bankAccount,
          ifsc: bankIfsc,
          name_at_bank: nameAtBank
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success("Bank details manually verified!");
      setInstallers(prev => prev.map(i => {
        if (i.id === selectedInstaller.id) {
          return {
            ...i,
            bank_account: bankAccount,
            bank_ifsc: bankIfsc,
            bank_account_verified: true,
            bank_verified_name: data.verifiedName
          };
        }
        return i;
      }));
      setIsVerifyModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to verify bank account");
    } finally {
      setIsVerifying(false);
    }
  };

  // Manual Payout handlers
  const handleOpenPayout = (installer: Installer) => {
    setSelectedInstaller(installer);
    setUtrNumber("");
    setIsPayoutModalOpen(true);
  };

  const handleManualPayout = async () => {
    if (!selectedInstaller) return;
    if (!utrNumber.trim()) {
      toast.error("Please enter the UTR / Reference number to log this payment.");
      return;
    }

    const amount = selectedInstaller.wallet_balance || 0;
    setIsProcessingPayout(true);
    try {
      const res = await fetch("/api/admin/payouts/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          installerId: selectedInstaller.id,
          amount: amount,
          utr_number: utrNumber
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success("Manual Payout logged successfully!");
      setInstallers(prev => prev.map(i => {
        if (i.id === selectedInstaller.id) {
          return { ...i, wallet_balance: 0 };
        }
        return i;
      }));
      setIsPayoutModalOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to log payout");
    } finally {
      setIsProcessingPayout(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Integrated Actions */}
      <PageHeader
        icon={ShieldCheck}
        title="Verified Installer Network"
        description="Manage the pincode-mapped independent technicians who execute surveys, installations, and AMCs."
        badge={`${activeCount} Active`}
        action={
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyInviteLink}
              className="gap-2 text-xs font-semibold border-border hover:bg-muted"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              {copiedLink ? "Link Copied!" : "Copy Onboarding Link"}
            </Button>
            
            <a 
              href="/for-installers" 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium px-2 py-1 rounded-md transition-colors"
            >
              <span>Public Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <Button
              size="sm"
              onClick={() => setIsAddModalOpen(true)}
              className="gap-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
            >
              <Plus className="w-4 h-4" />
              Onboard Installer
            </Button>
          </div>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Installers */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Technicians</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">{installers.length}</div>
          <div className="text-[11px] text-muted-foreground">
            <span className="text-emerald-500 font-semibold">{activeCount} active</span> • {inactiveCount} inactive
          </div>
        </div>

        {/* Coverage */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Coverage</span>
            <MapPin className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">{totalUniquePincodes}</div>
          <div className="text-[11px] text-muted-foreground">Pincodes mapped to network</div>
        </div>

        {/* Pending Verifications */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Verifications</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">{pendingKycCount + unverifiedBankCount}</div>
          <div className="text-[11px] text-muted-foreground">
            {pendingKycCount} KYC • {unverifiedBankCount} Bank pending
          </div>
        </div>

        {/* Field Cash / COD */}
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Field Cash</span>
            <Banknote className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-foreground">₹{totalWalletHold.toLocaleString()}</div>
          <div className="text-[11px] text-muted-foreground">Total COD cash held</div>
        </div>

        {/* Inbound Applications */}
        <div 
          onClick={() => setActiveTab("applications")}
          className="p-4 rounded-xl border border-border bg-card shadow-sm space-y-1 cursor-pointer hover:border-primary/50 transition-colors"
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Applications</span>
            <FileCheck2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-foreground">{pendingApplicationsCount}</div>
            {pendingApplicationsCount > 0 && (
              <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 text-[10px] font-bold">New</Badge>
            )}
          </div>
          <div className="text-[11px] text-indigo-500 font-medium">Click to review leads →</div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("network")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            activeTab === "network"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Verified Fleet ({installers.length})
        </button>
        <button
          onClick={() => setActiveTab("applications")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
            activeTab === "applications"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
        >
          <UserPlus className="w-4 h-4" />
          Inbound Applications
          {pendingApplicationsCount > 0 && (
            <span className="ml-1 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingApplicationsCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: Verified Network Fleet */}
      {activeTab === "network" && (
        <div className="space-y-4">
          {/* Search & Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-card p-4 rounded-xl border border-border shadow-sm">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone, or pincode..."
                className="pl-9 bg-background border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                aria-label="Filter installers by status"
                className="text-xs bg-background border border-border rounded-lg px-3 py-2 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">All Statuses ({installers.length})</option>
                <option value="active">Active Only ({activeCount})</option>
                <option value="inactive">Inactive Only ({inactiveCount})</option>
                <option value="pending_kyc">Pending KYC ({pendingKycCount})</option>
                <option value="unverified_bank">Unverified Bank ({unverifiedBankCount})</option>
              </select>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border">
                  <TableHead className="font-semibold text-xs">Installer Info</TableHead>
                  <TableHead className="font-semibold text-xs">Coverage</TableHead>
                  <TableHead className="font-semibold text-xs">Performance</TableHead>
                  <TableHead className="font-semibold text-xs">Wallet / Cash</TableHead>
                  <TableHead className="font-semibold text-xs">Status & Bank</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstallers.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={6} className="text-center py-16">
                      <div className="max-w-md mx-auto space-y-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                          <Wrench className="w-6 h-6" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-base font-semibold text-foreground">
                            {installers.length === 0 ? "No Verified Installers Yet" : "No Matching Technicians"}
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            {installers.length === 0
                              ? "You haven't onboarded any technicians yet. Onboard independent contractors or review inbound technician applications to start dispatching jobs."
                              : "No technicians match your current search query or status filter. Try clearing the filters."}
                          </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-3 pt-2">
                          <Button 
                            size="sm" 
                            onClick={() => setIsAddModalOpen(true)}
                            className="text-xs font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Onboard First Technician
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={handleCopyInviteLink}
                            className="text-xs font-semibold gap-1.5"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copy Application Link
                          </Button>
                          {pendingApplicationsCount > 0 && (
                            <Button 
                              variant="secondary" 
                              size="sm" 
                              onClick={() => setActiveTab("applications")}
                              className="text-xs font-semibold gap-1.5"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              Review Applications ({pendingApplicationsCount})
                            </Button>
                          )}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInstallers.map((installer) => {
                    const pincodes = installer.territory?.allowed_pincodes || installer.serviceable_pincodes || [];
                    return (
                      <TableRow key={installer.id} className="border-border hover:bg-muted/40 transition-colors">
                        {/* Installer Info */}
                        <TableCell>
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 uppercase">
                              {installer.name.slice(0, 2)}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                                {installer.name}
                                {installer.entity_type === "firm" && (
                                  <span className="text-[10px] bg-secondary text-secondary-foreground px-1.5 py-0.5 rounded font-normal">
                                    Firm
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                <Phone className="w-3 h-3" />
                                {installer.mobile_number}
                              </div>
                              {installer.email && (
                                <div className="text-[11px] text-muted-foreground">{installer.email}</div>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Coverage */}
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex flex-wrap gap-1 max-w-[220px]">
                              {pincodes.slice(0, 3).map((pin: string) => (
                                <Badge key={pin} variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-mono">
                                  {pin}
                                </Badge>
                              ))}
                              {pincodes.length > 3 && (
                                <Badge variant="outline" className="text-[10px] text-muted-foreground font-mono">
                                  +{pincodes.length - 3} more
                                </Badge>
                              )}
                              {pincodes.length === 0 && (
                                <span className="text-xs text-amber-500 italic">No pincodes mapped</span>
                              )}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {installer.skills?.slice(0, 2).join(", ") || "General CCTV"}
                            </div>
                          </div>
                        </TableCell>

                        {/* Performance */}
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-muted-foreground">
                              SLA Score:{" "}
                              <span className={`font-semibold ${(installer.sla_score ?? 0) >= 90 ? "text-emerald-500" : "text-amber-500"}`}>
                                {installer.sla_score ?? 100}/100
                              </span>
                            </span>
                            <span className="text-xs text-muted-foreground">
                              Jobs: <span className="font-medium text-foreground">{installer.jobs_completed ?? 0}</span>
                            </span>
                          </div>
                        </TableCell>

                        {/* Wallet / Cash */}
                        <TableCell>
                          <div className={`font-mono text-sm font-semibold ${(installer.wallet_balance ?? 0) < 0 ? "text-rose-500" : (installer.wallet_balance ?? 0) > 0 ? "text-emerald-500" : "text-muted-foreground"}`}>
                            ₹ {(installer.wallet_balance ?? 0).toLocaleString()}
                          </div>
                          <div className="text-[10px] text-muted-foreground">Cash in hand</div>
                        </TableCell>

                        {/* Status & Bank */}
                        <TableCell>
                          <div className="flex flex-col gap-1.5 items-start">
                            {/* Active Toggle Pill */}
                            <button
                              onClick={() => handleToggleActive(installer)}
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all ${
                                installer.is_active
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                  : "bg-zinc-500/10 text-zinc-500 border-zinc-500/30 hover:bg-zinc-500/20"
                              }`}
                            >
                              {installer.is_active ? "● Active on Field" : "○ Inactive"}
                            </button>

                            {/* KYC Status Dropdown / Badge */}
                            <div className="flex items-center gap-1">
                              <select
                                value={installer.kyc_status || "pending"}
                                onChange={(e) => handleUpdateKyc(installer, e.target.value as any)}
                                aria-label={`KYC status for ${installer.name}`}
                                className={`text-[10px] font-semibold rounded px-1.5 py-0.5 border cursor-pointer ${
                                  installer.kyc_status === "verified"
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                                    : installer.kyc_status === "suspended"
                                    ? "bg-rose-500/10 text-rose-500 border-rose-500/30"
                                    : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                                }`}
                              >
                                <option value="pending">KYC Pending</option>
                                <option value="verified">KYC Verified</option>
                                <option value="suspended">Suspended</option>
                              </select>
                            </div>

                            {/* Bank Status */}
                            {installer.bank_account_verified ? (
                              <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 gap-1 py-0">
                                <Banknote className="w-2.5 h-2.5" /> Bank Verified
                              </Badge>
                            ) : (
                              <Badge 
                                variant="outline" 
                                className="text-[10px] border-rose-500/30 text-rose-500 gap-1 py-0 cursor-pointer hover:bg-rose-500/10" 
                                onClick={() => handleOpenVerify(installer)}
                              >
                                Verify Bank
                              </Badge>
                            )}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-2">
                            {installer.bank_account_verified && (installer.wallet_balance ?? 0) > 0 && (
                              <Button 
                                variant="default" 
                                size="sm" 
                                className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium" 
                                onClick={() => handleOpenPayout(installer)}
                              >
                                <Banknote className="w-3 h-3 mr-1"/>
                                Pay ₹{installer.wallet_balance}
                              </Button>
                            )}
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 text-xs" 
                              onClick={() => handleOpenEdit(installer)}
                            >
                              Edit Profile
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs" 
                              onClick={() => handleOpenVerify(installer)}
                            >
                              Bank
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Tab 2: Inbound Applications */}
      {activeTab === "applications" && (
        <div className="space-y-4">
          <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-0.5">
              <h3 className="text-sm font-semibold text-foreground">Inbound Technician Applications</h3>
              <p className="text-xs text-muted-foreground">
                Technicians who registered via <span className="font-mono text-primary">/for-installers</span>. Review and approve them to add them to your active fleet.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyInviteLink}
              className="gap-2 text-xs font-semibold"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Recruitment URL
            </Button>
          </div>

          <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border">
                  <TableHead className="font-semibold text-xs">Applicant Name</TableHead>
                  <TableHead className="font-semibold text-xs">Contact & Entity</TableHead>
                  <TableHead className="font-semibold text-xs">Primary Pincode</TableHead>
                  <TableHead className="font-semibold text-xs">Experience & GSTIN</TableHead>
                  <TableHead className="font-semibold text-xs">Date Applied</TableHead>
                  <TableHead className="font-semibold text-xs">Status</TableHead>
                  <TableHead className="font-semibold text-xs text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applications.length === 0 ? (
                  <TableRow className="border-border">
                    <TableCell colSpan={7} className="text-center py-16">
                      <div className="max-w-md mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mx-auto">
                          <FileCheck2 className="w-6 h-6" />
                        </div>
                        <h4 className="text-base font-semibold text-foreground">No Inbound Applications</h4>
                        <p className="text-xs text-muted-foreground">
                          No independent technicians have submitted registration requests yet. Share the recruitment link on WhatsApp groups or distributor counters.
                        </p>
                        <Button 
                          size="sm" 
                          onClick={handleCopyInviteLink}
                          className="text-xs font-semibold gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          Copy Registration Link
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  applications.map((app) => (
                    <TableRow key={app.id} className="border-border hover:bg-muted/40">
                      <TableCell>
                        <div className="font-semibold text-sm text-foreground">{app.name}</div>
                        {app.company_name && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3" /> {app.company_name}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="text-xs text-foreground font-mono">{app.mobile_number}</div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">
                          {app.primary_pincode}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs text-foreground">{app.years_experience} yrs exp</div>
                        {app.gstin && (
                          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">GST: {app.gstin}</div>
                        )}
                      </TableCell>

                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {app.created_at ? new Date(app.created_at as any).toLocaleDateString() : "Recent"}
                        </div>
                      </TableCell>

                      <TableCell>
                        {app.status === "approved" ? (
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 text-[10px]">Approved</Badge>
                        ) : app.status === "rejected" ? (
                          <Badge variant="outline" className="border-rose-500/30 text-rose-500 text-[10px]">Rejected</Badge>
                        ) : (
                          <Badge variant="outline" className="border-amber-500/30 text-amber-500 text-[10px]">Pending Review</Badge>
                        )}
                      </TableCell>

                      <TableCell className="text-right">
                        {app.status === "pending" ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              disabled={processingAppId === app.id}
                              onClick={() => handleApproveApplication(app)}
                              className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium gap-1"
                            >
                              {processingAppId === app.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Check className="w-3 h-3" />
                              )}
                              Approve
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={processingAppId === app.id}
                              onClick={() => handleRejectApplication(app)}
                              className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic capitalize">{app.status}</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Modal 1: Onboard New Installer */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-lg w-full p-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-foreground">Onboard Technician</h3>
                  <p className="text-xs text-muted-foreground">Add an independent installer to your verified network</p>
                </div>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateInstaller} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Full Name *</label>
                  <Input
                    required
                    placeholder="e.g. Ramesh Sharma"
                    value={newInstallerForm.name}
                    onChange={(e) => setNewInstallerForm(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Mobile Number (10 digits) *</label>
                  <Input
                    required
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    value={newInstallerForm.mobile_number}
                    onChange={(e) => setNewInstallerForm(prev => ({ ...prev, mobile_number: e.target.value.replace(/\D/g, "") }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Email (Optional)</label>
                  <Input
                    type="email"
                    placeholder="e.g. ramesh@gmail.com"
                    value={newInstallerForm.email}
                    onChange={(e) => setNewInstallerForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">Entity Type</label>
                  <select
                    value={newInstallerForm.entity_type}
                    onChange={(e) => setNewInstallerForm(prev => ({ ...prev, entity_type: e.target.value as any }))}
                    className="w-full text-sm bg-background border border-border rounded-lg px-3 py-2 text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="individual">Individual Technician</option>
                    <option value="firm">Registered Firm / Agency</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Serviceable Pincodes * <span className="text-muted-foreground font-normal">(Comma-separated 6-digit codes)</span>
                </label>
                <Input
                  required
                  placeholder="e.g. 302001, 302012, 302017"
                  value={newInstallerForm.serviceable_pincodes_raw}
                  onChange={(e) => setNewInstallerForm(prev => ({ ...prev, serviceable_pincodes_raw: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">PAN Number (Optional)</label>
                  <Input
                    placeholder="e.g. ABCDE1234F"
                    maxLength={10}
                    value={newInstallerForm.pan_number}
                    onChange={(e) => setNewInstallerForm(prev => ({ ...prev, pan_number: e.target.value.toUpperCase() }))}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1 block">GSTIN (Optional)</label>
                  <Input
                    placeholder="e.g. 08ABCDE1234F1Z5"
                    maxLength={15}
                    value={newInstallerForm.gst_number}
                    onChange={(e) => setNewInstallerForm(prev => ({ ...prev, gst_number: e.target.value.toUpperCase() }))}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Skills & Capabilities</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SKILLS.map((skill) => {
                    const isSelected = newInstallerForm.skills.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => {
                          setNewInstallerForm(prev => ({
                            ...prev,
                            skills: isSelected
                              ? prev.skills.filter(s => s !== skill)
                              : [...prev.skills, skill]
                          }));
                        }}
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-md border transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted text-muted-foreground border-border hover:text-foreground"
                        }`}
                      >
                        {skill.replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={isCreating} 
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                >
                  {isCreating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Confirm Onboard
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Profile & Territory */}
      {isEditModalOpen && editingInstaller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">
                Edit {editingInstaller.name}
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">
                  Serviceable Pincodes (Comma-separated)
                </label>
                <Input
                  value={editPincodesRaw}
                  onChange={(e) => setEditPincodesRaw(e.target.value)}
                  placeholder="e.g. 302001, 302012"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Skills</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SKILLS.map((skill) => {
                    const isSelected = editSkills.includes(skill);
                    return (
                      <button
                        type="button"
                        key={skill}
                        onClick={() => {
                          setEditSkills(prev =>
                            isSelected ? prev.filter(s => s !== skill) : [...prev, skill]
                          );
                        }}
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition-all ${
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-muted text-muted-foreground border-border hover:text-foreground"
                        }`}
                      >
                        {skill.replace("_", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border">
                <Button variant="ghost" onClick={() => setIsEditModalOpen(false)} disabled={isUpdating}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit} disabled={isUpdating} className="gap-2">
                  {isUpdating && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Manual Verify Bank Details */}
      {isVerifyModalOpen && selectedInstaller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
              <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Manual Bank Verification
              </h3>
              <button onClick={() => setIsVerifyModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground mb-4">
              Enter <b>{selectedInstaller.name}</b>'s bank details. Ensure you have verified these details offline (e.g. passbook or cancelled cheque).
            </p>

            <div className="space-y-3 mb-6">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Account Holder Name</label>
                <Input 
                  value={nameAtBank}
                  onChange={(e) => setNameAtBank(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">Account Number</label>
                <Input 
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="e.g. 026291800001191"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">IFSC Code</label>
                <Input 
                  value={bankIfsc}
                  onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
                  placeholder="e.g. SBIN0001234"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setIsVerifyModalOpen(false)} disabled={isVerifying}>
                Cancel
              </Button>
              <Button onClick={handleVerifyBank} disabled={isVerifying} className="gap-2 bg-primary">
                {isVerifying && <Loader2 className="w-4 h-4 animate-spin" />}
                Approve Bank Details
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Manual Payout */}
      {isPayoutModalOpen && selectedInstaller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-border">
              <h3 className="text-base font-semibold flex items-center gap-2 text-foreground">
                <Banknote className="w-5 h-5 text-emerald-500" />
                Log Manual Payout
              </h3>
              <button onClick={() => setIsPayoutModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-lg mb-4">
              <p className="text-xs font-semibold mb-2 text-emerald-600 dark:text-emerald-400">
                Transfer ₹{selectedInstaller.wallet_balance?.toLocaleString()} to:
              </p>
              <div className="text-xs font-mono space-y-1 text-foreground">
                <div>Name: {selectedInstaller.bank_verified_name || selectedInstaller.name}</div>
                <div>A/C: {selectedInstaller.bank_account}</div>
                <div>IFSC: {selectedInstaller.bank_ifsc}</div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mb-4">
              Transfer funds via NEFT/IMPS/UPI from your banking app, then enter the UTR / Reference number below to clear their balance.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-medium text-foreground mb-1 block">UTR / Reference Number</label>
                <Input 
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. UTR1234567890"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setIsPayoutModalOpen(false)} disabled={isProcessingPayout}>
                Cancel
              </Button>
              <Button onClick={handleManualPayout} disabled={isProcessingPayout} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                {isProcessingPayout ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Confirm Payment Logged
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
