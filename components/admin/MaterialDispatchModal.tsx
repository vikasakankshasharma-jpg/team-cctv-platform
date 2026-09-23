"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Truck, AlertTriangle, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface MaterialDispatchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteId: string;
  customerName: string;
  totalPayable: number;
}

export function MaterialDispatchModal({
  open,
  onOpenChange,
  quoteId,
  customerName,
  totalPayable,
}: MaterialDispatchModalProps) {
  const [deliveryMethod, setDeliveryMethod] = useState("");
  const [staffName, setStaffName] = useState("");
  const [staffPhone, setStaffPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const paymentAmount = (totalPayable - 500) * 0.9;

  const handleDispatch = async () => {
    if (!deliveryMethod || !staffName || !staffPhone) {
      toast.error("Please fill in all fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/delivery/dispatch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          quoteId,
          staffName,
          staffPhone,
          staffRole: deliveryMethod,
          deliveryMethod,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to dispatch material.");
      }

      toast.success("Material dispatched successfully!");
      onOpenChange(false);
      // Reset form
      setDeliveryMethod("");
      setStaffName("");
      setStaffPhone("");
    } catch (error) {
      toast.error("Failed to dispatch material. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Dispatch Material
          </DialogTitle>
          <DialogDescription>
            Dispatch material to {customerName}. Fill in the delivery details below.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="delivery-method">Delivery Method <span className="text-red-500">*</span></Label>
            <Select value={deliveryMethod} onValueChange={(val) => setDeliveryMethod(val || "")}>
              <SelectTrigger id="delivery-method">
                <SelectValue placeholder="Select delivery method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="installer">Installer (Self-carry)</SelectItem>
                <SelectItem value="salesperson">Salesperson</SelectItem>
                <SelectItem value="internal_staff">Internal Delivery Staff</SelectItem>
                <SelectItem value="third_party">Third-Party Courier (Porter, BlueDart, etc.)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="staff-name">Delivery Person Name <span className="text-red-500">*</span></Label>
            <Input
              id="staff-name"
              placeholder="Enter name"
              value={staffName}
              onChange={(e) => setStaffName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="staff-phone">Delivery Person Phone <span className="text-red-500">*</span></Label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm">
                +91
              </span>
              <Input
                id="staff-phone"
                className="rounded-l-none"
                placeholder="Enter 10-digit number"
                value={staffPhone}
                onChange={(e) => setStaffPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-2 space-y-3 bg-muted p-3 rounded-lg border">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">90% Payment Amount:</span>
              <Badge variant="outline" className="text-sm">
                ₹{paymentAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              This amount will be sent as a payment link to the customer.
            </p>
          </div>

          {deliveryMethod === "third_party" && (
            <div className="flex items-start gap-2 text-amber-600 bg-amber-500/10 p-3 rounded-md text-sm mt-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <p>Third-party courier requires mandatory online payment before delivery.</p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleDispatch} disabled={isSubmitting}>
            {isSubmitting ? "Dispatching..." : (
              <>
                <Truck className="w-4 h-4 mr-2" />
                Dispatch
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
