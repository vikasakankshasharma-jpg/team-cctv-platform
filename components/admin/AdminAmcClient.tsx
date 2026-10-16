"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ShieldCheck, IndianRupee, Plus, Search, MessageSquare, Phone, RefreshCw, AlertTriangle, CheckCircle2, Gift, Clock, User, Wrench, ShieldAlert } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface AmcRecord {
  id: string;
  source: "amc_subscriptions" | "amc_contracts" | "warranties";
  customerId: string;
  quoteId?: string;
  leadId?: string;
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  siteAddress?: string;
  planName: string;
  planType: "COMPLIMENTARY" | "PAID";
  startDate: string;
  endDate: string;
  durationMonths: number;
  amountPaid: number;
  includedVisits: number;
  usedVisits: number;
  status: string;
  daysLeft: number;
  isComplimentary: boolean;
  createdAt?: string;
}

export function AdminAmcClient() {
  const [records, setRecords] = useState<AmcRecord[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "COMPLIMENTARY" | "EXPIRING_SOON" | "EXPIRED" | "PAID">("ALL");
  const [activeTab, setActiveTab] = useState<"subscriptions" | "plans">("subscriptions");

  // New Contract Dialog State
  const [isNewContractOpen, setIsNewContractOpen] = useState(false);
  const [newContractSaving, setNewContractSaving] = useState(false);
  const [newContract, setNewContract] = useState({
    customerName: "",
    customerMobile: "",
    customerEmail: "",
    siteAddress: "",
    quoteId: "",
    planType: "COMPLIMENTARY", // COMPLIMENTARY or PAID
    planName: "1st Year Complimentary Care (2 Visits)",
    durationMonths: 12,
    includedVisits: 2,
    price: 0,
    notes: ""
  });

  // Renewal Dialog State
  const [renewRecord, setRenewRecord] = useState<AmcRecord | null>(null);
  const [renewSaving, setRenewSaving] = useState(false);
  const [renewPlanName, setRenewPlanName] = useState("Year 2 Standard Care AMC (4 Visits)");
  const [renewPrice, setRenewPrice] = useState(2499);

  // New Plan form state
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    durationMonths: 12,
    price: 0,
    includedVisits: 2,
    emergencyVisits: 1,
    labourIncluded: true,
    consumablesIncluded: false,
    hardwareReplacementIncluded: false,
    remoteSupport: true,
    onsiteSupport: true,
    isActive: true
  });
  const [savingPlan, setSavingPlan] = useState(false);

  const loadData = async () => {
    try {
      const [subsRes, plansRes] = await Promise.all([
        fetch("/api/admin/amc-subscriptions").then(r => r.json()),
        fetch("/api/admin/amc-plans").then(r => r.json())
      ]);
      if (subsRes.success) setRecords(subsRes.data || []);
      if (plansRes.success) setPlans(plansRes.data || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load AMC data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Log a maintenance visit (decrement remaining visits)
  const handleLogVisit = async (record: AmcRecord) => {
    const remaining = record.includedVisits - record.usedVisits;
    if (remaining <= 0) {
      toast.error("All included maintenance visits have already been used for this contract!");
      return;
    }

    if (!confirm(`Log maintenance visit for ${record.customerName}? This will record 1 visit as completed.`)) {
      return;
    }

    try {
      const res = await fetch("/api/admin/amc-subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: record.id,
          source: record.source,
          action: "LOG_VISIT"
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Visit logged successfully!");
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Submit contract renewal
  const handleRenewContract = async () => {
    if (!renewRecord) return;
    setRenewSaving(true);
    try {
      const res = await fetch("/api/admin/amc-subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: renewRecord.id,
          source: renewRecord.source,
          action: "RENEW",
          renewalPrice: renewPrice,
          newPlanName: renewPlanName
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Contract renewed successfully for 1 Year!");
        setRenewRecord(null);
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setRenewSaving(false);
    }
  };

  // Create manual contract
  const handleCreateContract = async () => {
    if (!newContract.customerName || !newContract.customerMobile) {
      toast.error("Customer Name and Mobile Number are required");
      return;
    }
    setNewContractSaving(true);
    try {
      const res = await fetch("/api/admin/amc-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newContract,
          price: newContract.planType === "COMPLIMENTARY" ? 0 : Number(newContract.price || 0),
          isComplimentary: newContract.planType === "COMPLIMENTARY"
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("AMC Contract created successfully!");
        setIsNewContractOpen(false);
        setNewContract({
          customerName: "",
          customerMobile: "",
          customerEmail: "",
          siteAddress: "",
          quoteId: "",
          planType: "COMPLIMENTARY",
          planName: "1st Year Complimentary Care (2 Visits)",
          durationMonths: 12,
          includedVisits: 2,
          price: 0,
          notes: ""
        });
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setNewContractSaving(false);
    }
  };

  // Create new Plan template
  const handleCreatePlan = async () => {
    if (!newPlan.name || newPlan.durationMonths <= 0) {
      toast.error("Please fill all required fields correctly");
      return;
    }
    setSavingPlan(true);
    try {
      const res = await fetch("/api/admin/amc-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("AMC Package created successfully");
        setIsNewPlanOpen(false);
        setNewPlan({
          name: "",
          durationMonths: 12,
          price: 0,
          includedVisits: 2,
          emergencyVisits: 1,
          labourIncluded: true,
          consumablesIncluded: false,
          hardwareReplacementIncluded: false,
          remoteSupport: true,
          onsiteSupport: true,
          isActive: true
        });
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSavingPlan(false);
    }
  };

  const handleTogglePlanActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/admin/amc-plans/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Plan status updated");
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Seed default recommended plans if empty
  const handleSeedDefaultPlans = async () => {
    const defaultPackages = [
      {
        name: "1st Year Complimentary Care (2 Visits)",
        durationMonths: 12,
        price: 0,
        includedVisits: 2,
        emergencyVisits: 1,
        labourIncluded: true,
        consumablesIncluded: false,
        hardwareReplacementIncluded: false,
        remoteSupport: true,
        onsiteSupport: true,
        isActive: true
      },
      {
        name: "Standard Care AMC (4 Visits)",
        durationMonths: 12,
        price: 2499,
        includedVisits: 4,
        emergencyVisits: 2,
        labourIncluded: true,
        consumablesIncluded: false,
        hardwareReplacementIncluded: false,
        remoteSupport: true,
        onsiteSupport: true,
        isActive: true
      },
      {
        name: "Comprehensive Gold AMC (4 Visits + Parts)",
        durationMonths: 12,
        price: 4999,
        includedVisits: 4,
        emergencyVisits: 4,
        labourIncluded: true,
        consumablesIncluded: true,
        hardwareReplacementIncluded: true,
        remoteSupport: true,
        onsiteSupport: true,
        isActive: true
      }
    ];

    try {
      for (const p of defaultPackages) {
        await fetch("/api/admin/amc-plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(p)
        });
      }
      toast.success("Default AMC packages added!");
      loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  // Filtered Records
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        r.customerName.toLowerCase().includes(q) ||
        r.customerMobile.includes(q) ||
        (r.quoteId && r.quoteId.toLowerCase().includes(q)) ||
        r.planName.toLowerCase().includes(q) ||
        (r.siteAddress && r.siteAddress.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Status filter
      if (statusFilter === "ALL") return true;
      if (statusFilter === "ACTIVE") return r.status === "ACTIVE";
      if (statusFilter === "COMPLIMENTARY") return r.isComplimentary || r.planType === "COMPLIMENTARY";
      if (statusFilter === "PAID") return !r.isComplimentary && r.planType === "PAID";
      if (statusFilter === "EXPIRING_SOON") return r.status === "ACTIVE" && r.daysLeft <= 30 && r.daysLeft >= 0;
      if (statusFilter === "EXPIRED") return r.status === "EXPIRED" || r.daysLeft < 0;

      return true;
    });
  }, [records, searchQuery, statusFilter]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    const totalRev = records.reduce((sum, r) => sum + (r.amountPaid || 0), 0);
    const active = records.filter(r => r.status === "ACTIVE").length;
    const complimentary = records.filter(r => (r.isComplimentary || r.planType === "COMPLIMENTARY") && r.status === "ACTIVE").length;
    const expiringSoon = records.filter(r => r.status === "ACTIVE" && r.daysLeft <= 30 && r.daysLeft >= 0).length;
    return { totalRev, active, complimentary, expiringSoon };
  }, [records]);

  // Generate WhatsApp Renewal & Service URL
  const getWhatsAppUrl = (record: AmcRecord) => {
    const cleanPhone = (record.customerMobile || "").replace(/\D/g, "");
    if (!cleanPhone) return null;
    const remaining = Math.max(0, record.includedVisits - record.usedVisits);
    const endFormatted = record.endDate ? format(new Date(record.endDate), "dd MMM yyyy") : "soon";

    let message = "";
    if (record.isComplimentary) {
      message = `Hello ${record.customerName}! 👋 Greetings from TEAM CCTV.\n\nThis is a friendly update regarding your complimentary Year-1 AMC Protection (Quote #${record.quoteId ? record.quoteId.slice(-6) : "System"}).\n\n🛡️ Plan: ${record.planName}\n📅 Valid Until: ${endFormatted}\n🔧 Maintenance Visits Remaining: ${remaining}/${record.includedVisits}\n\n`;
      if (record.daysLeft <= 30 && record.daysLeft >= 0) {
        message += `⚠️ Your complimentary Year-1 coverage expires in ${record.daysLeft} days! Renew today to secure our early-bird rate for Year 2 and avoid technician visit charges.`;
      } else {
        message += `Need to schedule a preventive maintenance checkup or lens cleaning? Simply reply to this message!`;
      }
    } else {
      message = `Hello ${record.customerName}! 👋 Greetings from TEAM CCTV.\n\nThis is an update regarding your Annual Maintenance Contract (AMC).\n\n🛡️ Plan: ${record.planName}\n📅 Valid Until: ${endFormatted}\n🔧 Visits Remaining: ${remaining}/${record.includedVisits}\n\n`;
      if (record.daysLeft <= 30 && record.daysLeft >= 0) {
        message += `⚠️ Your AMC expires in ${record.daysLeft} days. Contact us to renew your plan for uninterrupted coverage!`;
      } else {
        message += `To book your scheduled maintenance visit, please reply here!`;
      }
    }

    return `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  if (loading && records.length === 0) {
    return (
      <div className="p-16 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground font-medium">Loading AMC contracts, warranties & subscriptions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 w-full">
      
      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Total Revenue */}
        <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
              <span>Paid AMC Revenue</span>
              <IndianRupee className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
              ₹{metrics.totalRev.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-600/80 mt-1">From renewal contracts & paid plans</p>
          </CardContent>
        </Card>

        {/* Metric 2: Active Contracts */}
        <Card className="bg-blue-500/10 border-blue-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 flex items-center justify-between">
              <span>Total Active Contracts</span>
              <ShieldCheck className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-700 dark:text-blue-300">
              {metrics.active}
            </div>
            <p className="text-xs text-blue-600/80 mt-1">Currently protected installations</p>
          </CardContent>
        </Card>

        {/* Metric 3: 1st Year Complimentary */}
        <Card className="bg-amber-500/10 border-amber-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center justify-between">
              <span>1st-Yr Free (2 Visits)</span>
              <Gift className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-700 dark:text-amber-300">
              {metrics.complimentary}
            </div>
            <p className="text-xs text-amber-600/80 mt-1">Future Year-2 renewal pipeline</p>
          </CardContent>
        </Card>

        {/* Metric 4: Expiring in 30 Days */}
        <Card className="bg-rose-500/10 border-rose-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center justify-between">
              <span>Expiring Soon (&lt;30d)</span>
              <Clock className="w-4 h-4" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-700 dark:text-rose-300">
              {metrics.expiringSoon}
            </div>
            <p className="text-xs text-rose-600/80 mt-1">Urgent follow-ups for Year-2 renewal</p>
          </CardContent>
        </Card>
      </div>

      {/* Tab Selector & Main Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Tab switcher */}
        <div className="flex rounded-xl bg-muted p-1 w-full md:w-96">
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`flex-1 rounded-lg py-2 px-3 text-sm font-bold transition-all ${
              activeTab === "subscriptions" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            Customer AMC Ledger ({records.length})
          </button>
          <button
            onClick={() => setActiveTab("plans")}
            className={`flex-1 rounded-lg py-2 px-3 text-sm font-bold transition-all ${
              activeTab === "plans" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:bg-muted/50"
            }`}
          >
            Manage AMC Plans ({plans.length})
          </button>
        </div>

        {/* Right side buttons */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          {activeTab === "subscriptions" && (
            <>
              <Button size="sm" className="font-bold" onClick={() => setIsNewContractOpen(true)}>
                <Plus className="w-4 h-4 mr-1.5" /> New Contract
              </Button>
              <Dialog open={isNewContractOpen} onOpenChange={setIsNewContractOpen}>
                <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Issue / Log AMC Contract</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label>Customer Full Name *</Label>
                    <Input
                      placeholder="e.g. Ramesh Kumar"
                      value={newContract.customerName}
                      onChange={e => setNewContract({ ...newContract, customerName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Mobile Number *</Label>
                      <Input
                        placeholder="e.g. 9876543210"
                        value={newContract.customerMobile}
                        onChange={e => setNewContract({ ...newContract, customerMobile: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Quote ID (Optional)</Label>
                      <Input
                        placeholder="e.g. QTE-1042"
                        value={newContract.quoteId}
                        onChange={e => setNewContract({ ...newContract, quoteId: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Site Address / City</Label>
                    <Input
                      placeholder="e.g. Vaishali Nagar, Jaipur"
                      value={newContract.siteAddress}
                      onChange={e => setNewContract({ ...newContract, siteAddress: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Contract Category</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewContract({
                          ...newContract,
                          planType: "COMPLIMENTARY",
                          planName: "1st Year Complimentary Care (2 Visits)",
                          includedVisits: 2,
                          price: 0
                        })}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-left ${
                          newContract.planType === "COMPLIMENTARY"
                            ? "border-amber-500 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-black"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        🎁 1st Year Free (2 Visits)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewContract({
                          ...newContract,
                          planType: "PAID",
                          planName: "Standard Care AMC (4 Visits)",
                          includedVisits: 4,
                          price: 2499
                        })}
                        className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all text-left ${
                          newContract.planType === "PAID"
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-black"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        💼 Paid Contract (Year 2+)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Plan Title</Label>
                    <Input
                      value={newContract.planName}
                      onChange={e => setNewContract({ ...newContract, planName: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Included Maintenance Visits</Label>
                      <Input
                        type="number"
                        value={newContract.includedVisits}
                        onChange={e => setNewContract({ ...newContract, includedVisits: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Price Collected (₹)</Label>
                      <Input
                        type="number"
                        value={newContract.price}
                        disabled={newContract.planType === "COMPLIMENTARY"}
                        onChange={e => setNewContract({ ...newContract, price: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsNewContractOpen(false)}>Cancel</Button>
                  <Button onClick={handleCreateContract} disabled={newContractSaving}>
                    {newContractSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Save Contract
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}

          {activeTab === "plans" && (
            <Button size="sm" onClick={() => setIsNewPlanOpen(true)} className="font-bold">
              <Plus className="w-4 h-4 mr-1.5" /> New Package
            </Button>
          )}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: CUSTOMER LEDGER                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "subscriptions" && (
        <Card className="border border-border/60">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-black">AMC Subscriptions & Warranties Ledger</CardTitle>
                <CardDescription>
                  Track all 1st-year complimentary 2-visit coverages, renewal contracts, and visit consumption.
                </CardDescription>
              </div>

              {/* Real-time search bar */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                <Input
                  placeholder="Search customer, phone, quote..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2 pt-3">
              {[
                { id: "ALL", label: `All (${records.length})` },
                { id: "ACTIVE", label: `Active (${metrics.active})` },
                { id: "COMPLIMENTARY", label: `🎁 1st Year Free (${metrics.complimentary})` },
                { id: "EXPIRING_SOON", label: `⚠️ Expiring Soon (${metrics.expiringSoon})` },
                { id: "PAID", label: `Paid Renewals (${records.filter(r => !r.isComplimentary && r.planType === "PAID").length})` },
                { id: "EXPIRED", label: `Expired (${records.filter(r => r.status === "EXPIRED" || r.daysLeft < 0).length})` },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id as any)}
                  className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                    statusFilter === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead className="font-bold text-xs">Customer & Site</TableHead>
                    <TableHead className="font-bold text-xs">Plan & Type</TableHead>
                    <TableHead className="font-bold text-xs">Visits Progress</TableHead>
                    <TableHead className="font-bold text-xs">Coverage Period</TableHead>
                    <TableHead className="font-bold text-xs">Renewal Status</TableHead>
                    <TableHead className="font-bold text-xs text-right">Revenue / Value</TableHead>
                    <TableHead className="font-bold text-xs text-center">Quick Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <ShieldAlert className="w-10 h-10 opacity-30 text-muted-foreground" />
                          <p className="font-bold text-foreground">No AMC contracts found</p>
                          <p className="text-xs max-w-sm">
                            {searchQuery ? "No records match your search query." : "As completed installation warranties and contracts are created, they will automatically appear here."}
                          </p>
                          <Button size="sm" variant="outline" className="mt-2 text-xs" onClick={() => setIsNewContractOpen(true)}>
                            <Plus className="w-3.5 h-3.5 mr-1" /> Issue First Contract
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecords.map((sub) => {
                      const isExpired = sub.daysLeft < 0 || sub.status === "EXPIRED";
                      const isExpiringSoon = !isExpired && sub.daysLeft <= 30;
                      const remainingVisits = Math.max(0, sub.includedVisits - sub.usedVisits);
                      const waLink = getWhatsAppUrl(sub);

                      return (
                        <TableRow key={sub.id} className="hover:bg-muted/30 transition-colors">
                          
                          {/* 1. Customer & Site */}
                          <TableCell className="align-top py-4">
                            <div className="space-y-1">
                              <div className="font-bold text-sm text-foreground flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span>{sub.customerName}</span>
                              </div>
                              {sub.customerMobile && (
                                <a 
                                  href={`tel:${sub.customerMobile}`} 
                                  className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 font-mono"
                                >
                                  <Phone className="w-3 h-3 text-muted-foreground" />
                                  {sub.customerMobile}
                                </a>
                              )}
                              {sub.siteAddress && (
                                <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[200px]">
                                  📍 {sub.siteAddress}
                                </p>
                              )}
                              {sub.quoteId && (
                                <div className="pt-0.5">
                                  <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0 bg-muted/40">
                                    Quote #{sub.quoteId.slice(-6).toUpperCase()}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </TableCell>

                          {/* 2. Plan & Type */}
                          <TableCell className="align-top py-4">
                            <div className="space-y-1.5">
                              <div className="font-bold text-xs text-foreground">
                                {sub.planName}
                              </div>
                              {sub.isComplimentary ? (
                                <Badge variant="outline" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 text-[10px] font-bold flex items-center gap-1 w-fit">
                                  <Gift className="w-3 h-3" /> Year-1 Complimentary
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold flex items-center gap-1 w-fit">
                                  <ShieldCheck className="w-3 h-3" /> Paid Renewal
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          {/* 3. Visits Progress Bar */}
                          <TableCell className="align-top py-4">
                            <div className="space-y-1.5 min-w-[140px]">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-foreground">
                                  {sub.usedVisits} / {sub.includedVisits} Visits
                                </span>
                                <span className={`text-[11px] font-bold ${remainingVisits > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                  {remainingVisits} left
                                </span>
                              </div>

                              {/* Segmented visit blocks */}
                              <div className="flex gap-1 h-2">
                                {Array.from({ length: Math.max(sub.includedVisits, 1) }).map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`flex-1 rounded-full ${
                                      idx < sub.usedVisits
                                        ? "bg-amber-400 dark:bg-amber-500"
                                        : "bg-emerald-500/80"
                                    }`}
                                  />
                                ))}
                              </div>

                              <p className="text-[10px] text-muted-foreground">
                                {remainingVisits === 0 ? "⚠️ Visits exhausted (labor chargeable)" : "Labor & parts covered"}
                              </p>
                            </div>
                          </TableCell>

                          {/* 4. Coverage Period */}
                          <TableCell className="align-top py-4 text-xs">
                            <div className="space-y-0.5">
                              <div className="text-muted-foreground text-[11px]">
                                From: {sub.startDate ? format(new Date(sub.startDate), "MMM d, yyyy") : "—"}
                              </div>
                              <div className="font-bold text-foreground">
                                Till: {sub.endDate ? format(new Date(sub.endDate), "MMM d, yyyy") : "—"}
                              </div>
                              <div className="text-[10px] text-muted-foreground">
                                ({sub.durationMonths || 12} Months Term)
                              </div>
                            </div>
                          </TableCell>

                          {/* 5. Renewal Urgency Status */}
                          <TableCell className="align-top py-4">
                            {isExpired ? (
                              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/20 text-[10px] font-bold">
                                EXPIRED
                              </Badge>
                            ) : isExpiringSoon ? (
                              <Badge variant="outline" className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[10px] font-black animate-pulse">
                                ⚠️ Expires in {sub.daysLeft}d
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold">
                                ACTIVE ({sub.daysLeft}d left)
                              </Badge>
                            )}
                          </TableCell>

                          {/* 6. Revenue / Value */}
                          <TableCell className="align-top py-4 text-right">
                            {sub.amountPaid > 0 ? (
                              <div className="font-black text-sm text-foreground">
                                ₹{sub.amountPaid.toLocaleString()}
                              </div>
                            ) : (
                              <div>
                                <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">₹0</span>
                                <div className="text-[10px] text-muted-foreground line-through">
                                  ₹2,500 value
                                </div>
                              </div>
                            )}
                          </TableCell>

                          {/* 7. Quick Actions */}
                          <TableCell className="align-top py-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              
                              {/* WhatsApp Reminder Button */}
                              {waLink && (
                                <a
                                  href={waLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="Send WhatsApp Renewal / Maintenance Notice"
                                  className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white flex items-center justify-center transition-all"
                                >
                                  <MessageSquare className="w-4 h-4" />
                                </a>
                              )}

                              {/* Log PM Visit Button */}
                              <button
                                onClick={() => handleLogVisit(sub)}
                                title="Log Completed Maintenance Visit (Deduct 1 visit)"
                                disabled={remainingVisits <= 0}
                                className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 hover:bg-blue-500 hover:text-white disabled:opacity-40 disabled:hover:bg-blue-500/10 disabled:hover:text-blue-600 flex items-center justify-center transition-all"
                              >
                                <Wrench className="w-4 h-4" />
                              </button>

                              {/* Renew Contract Button */}
                              <button
                                onClick={() => {
                                  setRenewRecord(sub);
                                  setRenewPlanName("Year 2 Standard Care AMC (4 Visits)");
                                  setRenewPrice(2499);
                                }}
                                title="Renew Contract for Year 2"
                                className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1 transition-all"
                              >
                                Renew
                              </button>
                            </div>
                          </TableCell>

                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: MANAGE AMC PLANS                                       */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "plans" && (
        <Card className="border border-border/60">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-black">AMC Packages & Pricing Templates</CardTitle>
              <CardDescription>
                Define the service levels, visit quotas, and pricing for your Annual Maintenance Contracts.
              </CardDescription>
            </div>
            {plans.length === 0 && (
              <Button size="sm" variant="outline" onClick={handleSeedDefaultPlans}>
                ⚡ Seed Recommended Packages
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="rounded-xl border border-border/60 overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="font-bold text-xs">Package Name</TableHead>
                    <TableHead className="font-bold text-xs">Term & Visits</TableHead>
                    <TableHead className="font-bold text-xs">Coverage Scope</TableHead>
                    <TableHead className="font-bold text-xs text-right">Price (₹)</TableHead>
                    <TableHead className="font-bold text-xs text-center">Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                        <p className="font-bold text-foreground">No AMC packages configured yet.</p>
                        <p className="text-xs text-muted-foreground mt-1 mb-3">Create your first package or click below to populate standard plans.</p>
                        <Button size="sm" onClick={handleSeedDefaultPlans}>
                          Add Standard 1st-Year & Renewal Packages
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : (
                    plans.map((plan) => (
                      <TableRow key={plan.id} className="hover:bg-muted/30">
                        <TableCell>
                          <div className="font-bold text-sm text-foreground">{plan.name}</div>
                          <div className="text-[11px] text-muted-foreground">ID: {plan.id}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-xs">{plan.durationMonths || 12} Months</div>
                          <div className="text-xs text-muted-foreground">
                            {plan.includedVisits || 0} Routine PM + {plan.emergencyVisits || 0} Emergency
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {plan.labourIncluded && (
                              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                Labour Covered
                              </Badge>
                            )}
                            {plan.hardwareReplacementIncluded ? (
                              <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-600 border-blue-500/20 font-bold">
                                Hardware / Parts Included
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground">
                                Parts Chargeable
                              </Badge>
                            )}
                            {plan.remoteSupport && (
                              <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-600 border-purple-500/20">
                                Remote Desk
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-black text-sm">
                          {plan.price === 0 ? (
                            <span className="text-emerald-600">FREE (Year 1)</span>
                          ) : (
                            `₹${Number(plan.price).toLocaleString()}`
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-input cursor-pointer accent-primary"
                            checked={plan.isActive}
                            onChange={() => handleTogglePlanActive(plan.id, plan.isActive)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* RENEWAL DIALOG                                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {renewRecord && (
        <Dialog open={!!renewRecord} onOpenChange={open => !open && setRenewRecord(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Renew Annual Maintenance Contract</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-xs space-y-1">
                <div><span className="font-bold">Customer:</span> {renewRecord.customerName}</div>
                <div><span className="font-bold">Mobile:</span> {renewRecord.customerMobile}</div>
                <div><span className="font-bold">Current Plan:</span> {renewRecord.planName}</div>
                <div><span className="font-bold">Current Status:</span> {renewRecord.daysLeft < 0 ? "Expired" : `${renewRecord.daysLeft} days left`}</div>
              </div>

              <div className="space-y-1.5">
                <Label>Renewal Plan Name</Label>
                <Input
                  value={renewPlanName}
                  onChange={e => setRenewPlanName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Renewal Price (₹)</Label>
                  <Input
                    type="number"
                    value={renewPrice}
                    onChange={e => setRenewPrice(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Included Visits</Label>
                  <Input
                    type="number"
                    disabled
                    value={4}
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Renewing extends coverage by 12 months from today and resets maintenance visits to 4.
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRenewRecord(null)}>Cancel</Button>
              <Button onClick={handleRenewContract} disabled={renewSaving}>
                {renewSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Confirm 1-Year Renewal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* NEW PLAN DIALOG                                               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <Dialog open={isNewPlanOpen} onOpenChange={setIsNewPlanOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create AMC Package Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Package Title *</Label>
              <Input
                placeholder="e.g. 1-Year Full Protection AMC"
                value={newPlan.name}
                onChange={e => setNewPlan({ ...newPlan, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Duration (Months)</Label>
                <Input
                  type="number"
                  value={newPlan.durationMonths}
                  onChange={e => setNewPlan({ ...newPlan, durationMonths: parseInt(e.target.value) || 12 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Package Price (₹)</Label>
                <Input
                  type="number"
                  value={newPlan.price}
                  onChange={e => setNewPlan({ ...newPlan, price: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Routine PM Visits</Label>
                <Input
                  type="number"
                  value={newPlan.includedVisits}
                  onChange={e => setNewPlan({ ...newPlan, includedVisits: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Emergency Breakdown Visits</Label>
                <Input
                  type="number"
                  value={newPlan.emergencyVisits}
                  onChange={e => setNewPlan({ ...newPlan, emergencyVisits: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border/60 space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Coverage Inclusions</Label>
              
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={newPlan.labourIncluded}
                    onChange={e => setNewPlan({ ...newPlan, labourIncluded: e.target.checked })}
                  />
                  <span>Technician Labour Included</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={newPlan.hardwareReplacementIncluded}
                    onChange={e => setNewPlan({ ...newPlan, hardwareReplacementIncluded: e.target.checked })}
                  />
                  <span>Hardware / Parts Replacement</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={newPlan.consumablesIncluded}
                    onChange={e => setNewPlan({ ...newPlan, consumablesIncluded: e.target.checked })}
                  />
                  <span>Cables & Consumables Included</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-primary"
                    checked={newPlan.remoteSupport}
                    onChange={e => setNewPlan({ ...newPlan, remoteSupport: e.target.checked })}
                  />
                  <span>24/7 Remote Desk Support</span>
                </label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewPlanOpen(false)}>Cancel</Button>
            <Button onClick={handleCreatePlan} disabled={savingPlan}>
              {savingPlan ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save Package
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
