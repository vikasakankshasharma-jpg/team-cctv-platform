"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ShieldCheck, IndianRupee, Settings, Plus, Pencil, Trash } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function AdminAmcClient() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Plan form state
  const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    durationMonths: 12,
    price: 0,
    includedVisits: 0,
    isActive: true
  });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subsRes, plansRes] = await Promise.all([
        fetch("/api/admin/amc-subscriptions").then(r => r.json()),
        fetch("/api/admin/amc-plans").then(r => r.json())
      ]);
      if (subsRes.success) setSubscriptions(subsRes.data);
      if (plansRes.success) setPlans(plansRes.data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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

  const handleCreatePlan = async () => {
    if (!newPlan.name || newPlan.price <= 0 || newPlan.durationMonths <= 0) {
      toast.error("Please fill all fields correctly");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/amc-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan)
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Plan created successfully");
        setIsNewPlanOpen(false);
        setNewPlan({ name: "", durationMonths: 12, price: 0, includedVisits: 0, isActive: true });
        loadData();
      } else {
        toast.error(data.message);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && subscriptions.length === 0) return <div className="p-10 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  const activeCount = subscriptions.filter(s => s.status === "ACTIVE").length;
  const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.amountPaid || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <IndianRupee className="w-4 h-4" /> AMC Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-700 dark:text-emerald-300">
              ₹{totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-emerald-600/70 mt-1">Total revenue collected from AMC renewals</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/10 border-blue-500/20 shadow-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-600 dark:text-blue-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" /> Active Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-700 dark:text-blue-300">
              {activeCount}
            </div>
            <p className="text-xs text-blue-600/70 mt-1">Currently active Annual Maintenance Contracts</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="subscriptions" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="subscriptions">Customer Subscriptions</TabsTrigger>
          <TabsTrigger value="plans">Manage AMC Plans</TabsTrigger>
        </TabsList>
        
        <TabsContent value="subscriptions">
          <Card>
            <CardHeader>
              <CardTitle>AMC Subscriptions Ledger</CardTitle>
              <CardDescription>Track all customer AMC purchases and coverage dates.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Customer ID</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead>End Date</TableHead>
                      <TableHead className="text-right">Revenue</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No AMC subscriptions found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscriptions.map((sub) => {
                        const isExpired = new Date(sub.endDate) < new Date();
                        return (
                          <TableRow key={sub.id} className="hover:bg-muted/30">
                            <TableCell className="font-mono text-xs text-muted-foreground">{sub.customerId.slice(0,8)}...</TableCell>
                            <TableCell className="font-medium">{sub.planName}</TableCell>
                            <TableCell>{format(new Date(sub.startDate), "MMM d, yyyy")}</TableCell>
                            <TableCell>{format(new Date(sub.endDate), "MMM d, yyyy")}</TableCell>
                            <TableCell className="text-right font-medium">₹{sub.amountPaid}</TableCell>
                            <TableCell className="text-right">
                              <Badge variant="outline" className={isExpired ? "bg-red-500/10 text-red-600 border-red-500/20" : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"}>
                                {isExpired ? "EXPIRED" : "ACTIVE"}
                              </Badge>
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
        </TabsContent>

        <TabsContent value="plans">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>AMC Packages & Pricing</CardTitle>
                <CardDescription>Create and manage the AMC packages that customers can purchase.</CardDescription>
              </div>
              <Dialog open={isNewPlanOpen} onOpenChange={setIsNewPlanOpen}>
                <DialogTrigger asChild>
                  <Button size="sm"><Plus className="w-4 h-4 mr-2" /> New Package</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create AMC Package</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Package Name</Label>
                      <Input placeholder="e.g. 1-Year Full Protection" value={newPlan.name} onChange={e => setNewPlan({...newPlan, name: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Duration (Months)</Label>
                        <Input type="number" value={newPlan.durationMonths} onChange={e => setNewPlan({...newPlan, durationMonths: parseInt(e.target.value) || 0})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Price (₹)</Label>
                        <Input type="number" value={newPlan.price} onChange={e => setNewPlan({...newPlan, price: parseInt(e.target.value) || 0})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Included Maintenance Visits</Label>
                      <Input type="number" value={newPlan.includedVisits} onChange={e => setNewPlan({...newPlan, includedVisits: parseInt(e.target.value) || 0})} />
                    </div>
                    <div className="flex items-center justify-between pt-2">
                      <Label>Active (Visible to Customers)</Label>
                      <Switch checked={newPlan.isActive} onCheckedChange={c => setNewPlan({...newPlan, isActive: c})} />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsNewPlanOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreatePlan} disabled={saving}>{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Save Package</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="rounded-xl border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead>Package Name</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Included Visits</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-center">Active</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {plans.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No AMC packages created yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      plans.map((plan) => (
                        <TableRow key={plan.id} className="hover:bg-muted/30">
                          <TableCell className="font-bold">{plan.name}</TableCell>
                          <TableCell>{plan.durationMonths} Months</TableCell>
                          <TableCell>{plan.includedVisits} Visits</TableCell>
                          <TableCell className="text-right font-medium">₹{plan.price.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <Switch 
                              checked={plan.isActive} 
                              onCheckedChange={() => handleTogglePlanActive(plan.id, plan.isActive)} 
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
