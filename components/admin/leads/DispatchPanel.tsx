"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Truck, CheckCircle, Package } from "lucide-react";
import { toast } from "sonner";

export default function DispatchPanel({ lead, onUpdate }: { lead: any, onUpdate: () => void }) {
  const [isDispatching, setIsDispatching] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffRole, setStaffRole] = useState<"internal" | "third_party">("third_party");

  const isCashOnDelivery = lead.payment_preference === "cash_on_delivery";

  const handleDispatch = async () => {
    if (!staffName || !staffPhone) {
      toast.error("Please provide staff name and phone.");
      return;
    }
    
    // Enforce internal staff for cash orders
    if (isCashOnDelivery && staffRole !== "internal") {
      toast.error("Cash collections must be assigned to internal staff.");
      return;
    }

    setIsDispatching(true);
    try {
      const res = await fetch("/api/delivery/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteId: lead.id,
          staffName,
          staffPhone,
          staffRole
        })
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success(`Dispatched! Customer OTP: ${data.deliveryOtp}`);
        onUpdate();
      } else {
        toast.error(data.error || "Dispatch failed");
      }
    } catch (e) {
      toast.error("Error dispatching material");
    } finally {
      setIsDispatching(false);
    }
  };

  if (lead.delivery_status === "DELIVERED") {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-emerald-800 text-sm font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4" /> Delivered & Handed Over
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-emerald-900 space-y-1">
          <p>Delivered by: <strong>{lead.assigned_delivery_staff?.name}</strong></p>
          {lead.cash_collection_status === "COLLECTED_BY_STAFF" && (
            <p className="font-bold text-amber-700">Cash With Staff: ₹{lead.cash_collected_amount}</p>
          )}
          {lead.cash_collection_status === "SETTLED_WITH_ADMIN" && (
            <p className="font-bold text-emerald-700">Cash Settled</p>
          )}
        </CardContent>
      </Card>
    );
  }

  if (lead.delivery_status === "DISPATCHED") {
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-amber-800 text-sm font-bold flex items-center gap-2">
            <Package className="w-4 h-4" /> Out For Delivery
          </CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-amber-900 space-y-2">
          <p>Assigned to: <strong>{lead.assigned_delivery_staff?.name}</strong> ({lead.assigned_delivery_staff?.phone})</p>
          <div className="bg-white p-2 rounded border border-amber-100 flex items-center justify-between">
            <span>Customer OTP:</span>
            <span className="font-mono font-bold text-lg">{lead.delivery_otp}</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">Waiting for delivery person to verify OTP via Magic Link.</p>
        </CardContent>
      </Card>
    );
  }

  // PENDING state
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold flex items-center gap-2">
          <Truck className="w-4 h-4 text-indigo-600" />
          Dispatch Material
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-2">
        {isCashOnDelivery ? (
          <div className="bg-rose-50 text-rose-800 p-2 text-xs rounded border border-rose-200 font-medium">
            ⚠️ Cash Collection Required (₹{lead.total_payable - 500}). You must assign internal staff.
          </div>
        ) : (
          <div className="bg-blue-50 text-blue-800 p-2 text-xs rounded border border-blue-200 font-medium">
            ℹ️ Payment Online. Can assign 3rd-party logistics.
          </div>
        )}

        <div className="space-y-2">
          <Input 
            placeholder="Delivery Person Name" 
            value={staffName} 
            onChange={e => setStaffName(e.target.value)} 
            className="text-xs h-8"
          />
          <Input 
            placeholder="Phone Number (for WhatsApp Link)" 
            value={staffPhone} 
            onChange={e => setStaffPhone(e.target.value)} 
            className="text-xs h-8"
          />
          <Select 
            value={isCashOnDelivery ? "internal" : staffRole} 
            onValueChange={(val: any) => setStaffRole(val)}
            disabled={isCashOnDelivery} // Lock if cash
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="internal">Internal Staff / Installer</SelectItem>
              <SelectItem value="third_party">Third Party (Porter/Dunzo)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          className="w-full h-8 text-xs font-bold" 
          onClick={handleDispatch}
          disabled={isDispatching}
        >
          {isDispatching ? "Dispatching..." : "Mark Dispatched"}
        </Button>
      </CardContent>
    </Card>
  );
}
