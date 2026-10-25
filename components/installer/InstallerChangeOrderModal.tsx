"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Plus, 
  Minus, 
  QrCode, 
  Banknote, 
  Lock, 
  Loader2, 
  ShieldAlert, 
  CheckCircle2, 
  IndianRupee,
  ReceiptText,
  FileSpreadsheet
} from "lucide-react";
import { toast } from "sonner";
import { DynamicOnScreenQRCodeModal } from "@/components/shared/DynamicOnScreenQRCodeModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  quoteId: string;
  jobId?: string;
  isCashApproved?: boolean;
  onSuccess?: () => void;
}

interface ChangeOrderItem {
  id: string;
  name: string;
  unit: string;
  unitPrice: number;
  qty: number;
}

const PRESET_ADDONS = [
  { id: "cat6_cable", name: "Cat6 Pure Copper Network Cable", unit: "m", defaultRate: 20 },
  { id: "cctv_cable", name: "3+1 CCTV Shielded Cable", unit: "m", defaultRate: 15 },
  { id: "pvc_conduit", name: "PVC Heavy Conduit Casing", unit: "m", defaultRate: 35 },
  { id: "junction_box", name: "Waterproof PVC Junction Box 4x4", unit: "pc", defaultRate: 90 },
  { id: "camera_bracket", name: "Heavy Duty Metal Camera Bracket", unit: "pc", defaultRate: 180 },
  { id: "extra_labor_point", name: "Extra Drilling & Wiring Labor", unit: "point", defaultRate: 250 },
];

export function InstallerChangeOrderModal({
  isOpen,
  onClose,
  leadId,
  quoteId,
  jobId,
  isCashApproved = false,
  onSuccess
}: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [customItems, setCustomItems] = useState<ChangeOrderItem[]>([]);
  const [customName, setCustomName] = useState("");
  const [customRate, setCustomRate] = useState("");
  const [customQty, setCustomQty] = useState("1");
  const [reason, setReason] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"qr_upi" | "cash">("qr_upi");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingCash, setIsRequestingCash] = useState(false);
  const [cashApprovalRequested, setCashApprovalRequested] = useState(false);

  // Dynamic QR Modal State
  const [activeChangeOrderId, setActiveChangeOrderId] = useState<string | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Compute selected items
  const selectedPresetItems: ChangeOrderItem[] = PRESET_ADDONS
    .filter(addon => (quantities[addon.id] || 0) > 0)
    .map(addon => ({
      id: addon.id,
      name: addon.name,
      unit: addon.unit,
      unitPrice: addon.defaultRate,
      qty: quantities[addon.id] || 0,
    }));

  const allItems = [...selectedPresetItems, ...customItems];

  // Calculate Subtotal & 18% GST deterministically
  const subtotal = allItems.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
  const gstAmount = Math.round(subtotal * 0.18);
  const totalPayable = subtotal + gstAmount;

  const handleQtyChange = (id: string, delta: number) => {
    setQuantities(prev => {
      const current = prev[id] || 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleAddCustomItem = () => {
    if (!customName.trim()) {
      toast.error("Please enter item name");
      return;
    }
    const rate = Number(customRate);
    const qty = Number(customQty);
    if (!rate || rate <= 0 || !qty || qty <= 0) {
      toast.error("Please enter a valid rate and quantity");
      return;
    }

    setCustomItems(prev => [
      ...prev,
      {
        id: `custom_${Date.now()}`,
        name: customName.trim(),
        unit: "unit",
        unitPrice: rate,
        qty: qty,
      }
    ]);
    setCustomName("");
    setCustomRate("");
    setCustomQty("1");
  };

  const handleRemoveCustomItem = (id: string) => {
    setCustomItems(prev => prev.filter(item => item.id !== id));
  };

  const handleRequestCashApproval = async () => {
    if (totalPayable <= 0) {
      toast.error("Please add at least one item first");
      return;
    }
    setIsRequestingCash(true);
    try {
      const res = await fetch("/api/installer/cash-approval/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          quoteId,
          amount: totalPayable,
          reason: reason || "On-site extra materials/change order payment in cash"
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCashApprovalRequested(true);
        toast.success("Cash approval requested from Admin desk!");
      } else {
        toast.error(data.error || "Failed to request cash approval");
      }
    } catch {
      toast.error("Network error requesting cash approval");
    } finally {
      setIsRequestingCash(false);
    }
  };

  const handleSubmit = async () => {
    if (allItems.length === 0) {
      toast.error("Please add at least one material or labor item.");
      return;
    }

    if (paymentMethod === "cash" && !isCashApproved) {
      toast.error("Cash collection is locked. Admin staff approval is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        base_invoice_id: quoteId,
        base_job_id: jobId || "job_default",
        lead_id: leadId,
        reason: reason.trim() || "On-site extra requirements discovered during installation",
        created_by: "installer",
        payment_method: paymentMethod,
        items_to_add: allItems.map(item => ({
          product_id: item.id,
          display_name: item.name,
          qty: item.qty,
          unit_price: item.unitPrice,
          base_cost_at_quote: Math.round(item.unitPrice * 0.75), // default margin back-calculation
          category: "accessory"
        }))
      };

      const res = await fetch("/api/invoice/change-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to create change order");
      }

      const createdOrder = data.changeOrder;
      setActiveChangeOrderId(createdOrder.id);

      if (paymentMethod === "qr_upi") {
        // Open the On-Screen Dynamic QR Modal immediately!
        setIsQrModalOpen(true);
      } else {
        // Cash was approved and collected
        toast.success(`Change Order ${createdOrder.id} confirmed via Cash!`);
        if (onSuccess) onSuccess();
        onClose();
      }
    } catch (err: any) {
      toast.error(err.message || "Error submitting Change Order");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white dark:bg-zinc-900 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 my-8"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <ReceiptText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                    Site Add-On / Change Order
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Quote #{quoteId.slice(0, 8)} • GST Supplementary
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose} 
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Notice */}
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/40 rounded-2xl p-3.5 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
                <FileSpreadsheet className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <strong className="font-bold">GST Section 15 Compliant:</strong> Extra materials are billed via an official Supplementary Tax Invoice. Original quote stays locked.
                </div>
              </div>

              {/* Standard Add-Ons Selection */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-500">
                  Select Additional Materials / Labor
                </label>
                <div className="space-y-2.5">
                  {PRESET_ADDONS.map(addon => {
                    const count = quantities[addon.id] || 0;
                    return (
                      <div 
                        key={addon.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          count > 0 
                            ? "bg-amber-50/50 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50" 
                            : "bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                            {addon.name}
                          </p>
                          <p className="text-[11px] text-zinc-500 mt-0.5">
                            ₹{addon.defaultRate} / {addon.unit}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleQtyChange(addon.id, -1)}
                            disabled={count <= 0}
                            className="w-7 h-7 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 disabled:opacity-30 disabled:pointer-events-none"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-8 text-center text-xs font-black text-zinc-900 dark:text-white">
                            {count}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQtyChange(addon.id, 1)}
                            className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center hover:opacity-90"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Item Row */}
              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/50 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-400">
                  + Add Custom Material / Work
                </label>
                <div className="grid grid-cols-12 gap-2">
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Item description (e.g. HDMI Extender)"
                    className="col-span-6 px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    value={customRate}
                    onChange={(e) => setCustomRate(e.target.value)}
                    placeholder="Rate ₹"
                    className="col-span-3 px-3 py-2 text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="col-span-3 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Add
                  </button>
                </div>
                {customItems.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    {customItems.map(item => (
                      <div key={item.id} className="flex items-center justify-between text-xs bg-white dark:bg-zinc-900 p-2 rounded-lg border border-zinc-200 dark:border-zinc-800">
                        <span className="font-medium text-zinc-800 dark:text-zinc-200">{item.name} (x{item.qty})</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold">₹{item.unitPrice * item.qty}</span>
                          <button onClick={() => handleRemoveCustomItem(item.id)} className="text-red-500 hover:text-red-700 text-xs">×</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reason / Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-500">
                  Reason for Site Add-On
                </label>
                <textarea
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Back wall distance required extra 25m cable and 1 outdoor casing box"
                  className="w-full px-3.5 py-2.5 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Cost Calculation Summary */}
              <div className="bg-zinc-50 dark:bg-zinc-950/70 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                  <span>Materials &amp; Work Subtotal:</span>
                  <span className="font-bold">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-xs text-zinc-600 dark:text-zinc-400">
                  <span>GST (18%):</span>
                  <span className="font-bold">₹{gstAmount.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center text-sm font-black text-zinc-900 dark:text-white">
                  <span>Total Supplementary Due:</span>
                  <span className="text-base text-emerald-600 dark:text-emerald-400">
                    ₹{totalPayable.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2.5">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-500">
                  Handover Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* On-Screen UPI QR (Primary) */}
                  <label className={`flex flex-col p-3 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === "qr_upi" 
                      ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-300 ring-2 ring-emerald-500/20" 
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <QrCode className="w-5 h-5 text-emerald-600" />
                      <input 
                        type="radio" 
                        name="change_payment_method" 
                        checked={paymentMethod === "qr_upi"} 
                        onChange={() => setPaymentMethod("qr_upi")}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                    </div>
                    <span className="text-xs font-bold">On-Screen UPI QR</span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">Instant 3s verification</span>
                  </label>

                  {/* Physical Cash (Admin Gated) */}
                  <label className={`flex flex-col p-3 rounded-2xl border cursor-pointer transition-all ${
                    !isCashApproved ? "opacity-60 bg-zinc-100 dark:bg-zinc-900/50 cursor-not-allowed" :
                    paymentMethod === "cash" 
                      ? "border-amber-500 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 ring-2 ring-amber-500/20" 
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950"
                  }`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Banknote className="w-5 h-5 text-amber-600" />
                        {!isCashApproved && <Lock className="w-3.5 h-3.5 text-red-500" />}
                      </div>
                      <input 
                        type="radio" 
                        name="change_payment_method" 
                        checked={paymentMethod === "cash"} 
                        disabled={!isCashApproved}
                        onChange={() => setPaymentMethod("cash")}
                        className="text-amber-600 focus:ring-amber-500"
                      />
                    </div>
                    <span className="text-xs font-bold">Physical Cash</span>
                    <span className="text-[10px] text-zinc-500 mt-0.5">
                      {isCashApproved ? "Admin Approved" : "Admin Lock Active"}
                    </span>
                  </label>
                </div>

                {/* If cash locked */}
                {!isCashApproved && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-xl text-xs text-red-800 dark:text-red-300 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                      <span>Cash requires Admin desk authority</span>
                    </div>
                    {cashApprovalRequested ? (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                        Requested
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleRequestCashApproval}
                        disabled={isRequestingCash || totalPayable <= 0}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold text-[10px] rounded-lg transition-all"
                      >
                        {isRequestingCash ? <Loader2 className="w-3 h-3 animate-spin" /> : "Request Approval"}
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || allItems.length === 0 || (paymentMethod === "cash" && !isCashApproved)}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black rounded-2xl shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Processing Change Order...</span>
                  </>
                ) : paymentMethod === "qr_upi" ? (
                  <>
                    <QrCode className="w-5 h-5" />
                    <span>Show Dynamic UPI QR (₹{totalPayable.toLocaleString('en-IN')})</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Confirm Cash Collected (₹{totalPayable.toLocaleString('en-IN')})</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Embedded Dynamic QR Modal for the generated Change Order */}
      {activeChangeOrderId && (
        <DynamicOnScreenQRCodeModal
          isOpen={isQrModalOpen}
          onClose={() => {
            setIsQrModalOpen(false);
            if (onSuccess) onSuccess();
            onClose();
          }}
          quoteId={activeChangeOrderId}
          leadId={leadId}
          amount={totalPayable}
          paymentType="change_order"
          title="Change Order Supplementary Payment"
          onSuccess={() => {
            setIsQrModalOpen(false);
            toast.success("Supplementary payment confirmed! Tax Invoice sent to customer WhatsApp.");
            if (onSuccess) onSuccess();
            onClose();
          }}
        />
      )}
    </>
  );
}
