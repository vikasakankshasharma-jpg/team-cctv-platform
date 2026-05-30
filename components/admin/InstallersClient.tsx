"use client";

import { useState } from "react";
import type { Installer } from "@/types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ShieldAlert, ShieldCheck, Banknote, Loader2, X, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function InstallersClient({ data }: { data: Installer[] }) {
  const [installers, setInstallers] = useState(data);
  const [search, setSearch] = useState("");
  
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

  const filtered = installers.filter(i => 
    i.name.toLowerCase().includes(search.toLowerCase()) || 
    i.mobile_number.includes(search)
  );

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
      
      if (!data.success) {
        throw new Error(data.error);
      }

      toast.success(`Bank details manually verified!`);
      
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
      
      if (!data.success) {
        throw new Error(data.error);
      }

      toast.success(`Manual Payout logged successfully!`);
      
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
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search installers by name or phone..." 
            className="pl-9 bg-black/20 border-border/50"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden bg-black/40">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead>Installer Info</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Performance</TableHead>
              <TableHead>Wallet / Cash</TableHead>
              <TableHead>Status & Bank</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow className="border-border/50">
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No installers found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((installer) => (
                <TableRow key={installer.id} className="border-border/50 hover:bg-muted/20">
                  <TableCell>
                    <div className="font-medium text-emerald-400">{installer.name}</div>
                    <div className="text-xs text-muted-foreground">{installer.mobile_number}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(installer.territory?.allowed_pincodes || installer.serviceable_pincodes || []).slice(0, 3).map((pin: string) => (
                        <Badge key={pin} variant="secondary" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">{pin}</Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground">SLA Score: <span className={(installer.sla_score ?? 0) > 90 ? "text-emerald-400" : "text-amber-400"}>{installer.sla_score ?? 0}/100</span></span>
                      <span className="text-xs text-muted-foreground">Jobs: {installer.jobs_completed ?? 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`font-mono text-sm ${(installer.wallet_balance ?? 0) < 0 ? "text-rose-400" : "text-emerald-400"}`}>
                      ₹ {(installer.wallet_balance ?? 0).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2 items-start">
                      {installer.kyc_status === "verified" ? (
                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 gap-1"><ShieldCheck className="w-3 h-3"/> KYC Done</Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500/50 text-amber-400 gap-1">Pending KYC</Badge>
                      )}
                      
                      {installer.bank_account_verified ? (
                        <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 gap-1"><Banknote className="w-3 h-3"/> Bank Verified</Badge>
                      ) : (
                        <Badge variant="outline" className="border-rose-500/50 text-rose-400 gap-1 cursor-pointer hover:bg-rose-500/10" onClick={() => handleOpenVerify(installer)}>
                           Verify Bank manually
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right flex justify-end gap-2">
                    {installer.bank_account_verified && (installer.wallet_balance ?? 0) > 0 && (
                      <Button 
                        variant="default" 
                        size="sm" 
                        className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700" 
                        onClick={() => handleOpenPayout(installer)}
                      >
                        <Banknote className="w-3 h-3 mr-1"/>
                        Log Payout ₹{installer.wallet_balance}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => handleOpenVerify(installer)}>Edit Bank</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Manual Verify Bank Modal */}
      {isVerifyModalOpen && selectedInstaller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Manual Bank Verification
              </h3>
              <button onClick={() => setIsVerifyModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground mb-6">
              Enter <b>{selectedInstaller.name}</b>'s bank details. You must verify these details offline (e.g. cancelled cheque) before approving.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Account Holder Name</label>
                <Input 
                  value={nameAtBank}
                  onChange={(e) => setNameAtBank(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="bg-black/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Account Number</label>
                <Input 
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  placeholder="e.g. 026291800001191"
                  className="bg-black/20"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">IFSC Code</label>
                <Input 
                  value={bankIfsc}
                  onChange={(e) => setBankIfsc(e.target.value)}
                  placeholder="e.g. YESB0000262"
                  className="bg-black/20"
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

      {/* Manual Payout Modal */}
      {isPayoutModalOpen && selectedInstaller && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-400" />
                Log Manual Payout
              </h3>
              <button onClick={() => setIsPayoutModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-lg mb-6">
              <p className="text-sm font-medium mb-2 text-emerald-400">Transfer ₹{selectedInstaller.wallet_balance?.toLocaleString()} to:</p>
              <div className="text-sm font-mono space-y-1">
                <div>Name: {selectedInstaller.bank_verified_name || selectedInstaller.name}</div>
                <div>A/C: {selectedInstaller.bank_account}</div>
                <div>IFSC: {selectedInstaller.bank_ifsc}</div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-4">
              Please transfer the funds using your banking app, then enter the UTR / Reference number below to clear their wallet balance in the system.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">UTR / Reference Number</label>
                <Input 
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="e.g. UTR1234567890"
                  className="bg-black/20"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" onClick={() => setIsPayoutModalOpen(false)} disabled={isProcessingPayout}>
                Cancel
              </Button>
              <Button onClick={handleManualPayout} disabled={isProcessingPayout} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
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
