"use client";

import { useState } from "react";
import { BadgeDollarSign, Plus, UserX, Settings2, Phone, QrCode, Copy, Download, ExternalLink, Check } from "lucide-react";
import type { Promoter } from "@/types";
import { PromoterModal } from "./PromoterModal";
import { PageHeader } from "./PageHeader";
import { createPromoter, updatePromoter, banPromoter } from "@/app/actions/promoters";
import { toast } from "sonner";
import { calculateInactivityAging } from "@/lib/inactivity-tracker";
import { QRCodeSVG } from "qrcode.react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface PromotersClientProps {
  initialPromoters: Promoter[];
  availableLayouts?: { id: string; name: string }[];
}

export function PromotersClient({ initialPromoters, availableLayouts = [] }: PromotersClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromoter, setEditingPromoter] = useState<Promoter | null>(null);

  // QR Modal State
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null);
  const [copied, setCopied] = useState(false);

  const WA_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "917357612865";

  const handleCreateNew = () => {
    setEditingPromoter(null);
    setIsModalOpen(true);
  };

  const handleEdit = (promoter: Promoter) => {
    setEditingPromoter(promoter);
    setIsModalOpen(true);
  };

  const handleOpenQR = (promoter: Promoter) => {
    setSelectedPromoter(promoter);
    setCopied(false);
    setQrModalOpen(true);
  };

  const handleBan = async (id: string, name: string) => {
    if (!window.confirm(`Disable ${name}? They will no longer receive new leads.`)) return;
    try {
      await banPromoter(id);
      toast.success(`${name} has been disabled`);
    } catch (error) {
      console.error("Failed to disable promoter:", error);
      toast.error("Failed to disable promoter");
    }
  };

  const handleSave = async (data: any) => {
    if (editingPromoter?.id) {
      await updatePromoter(editingPromoter.id, data);
    } else {
      await createPromoter(data);
    }
    setIsModalOpen(false);
  };

  const activeCount = initialPromoters.filter(p => p.is_active).length;

  const getWaLink = (promoter: Promoter) => {
    const code = promoter.referral_code;
    const msg = `Hi ${code} I want a CCTV quotation`;
    return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("WhatsApp Referral Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQRCard = () => {
    if (!selectedPromoter) return;
    const svg = document.getElementById("promoter-qr-svg");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    // High res canvas
    canvas.width = 600;
    canvas.height = 800;

    img.onload = () => {
      if (!ctx) return;
      // Background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, 600, 800);

      // Top Header
      ctx.fillStyle = "#1e3a8a"; // Blue 900
      ctx.fillRect(0, 0, 600, 140);

      // Header Text
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("TEAM CCTV QUOTATION", 300, 60);

      ctx.fillStyle = "#93c5fd";
      ctx.font = "16px sans-serif";
      ctx.fillText("Instant Automated Quotation on WhatsApp", 300, 95);

      // Partner Info Box
      ctx.fillStyle = "#f8fafc";
      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 2;
      ctx.roundRect(40, 160, 520, 90, 16);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText(selectedPromoter.name.toUpperCase(), 300, 195);

      ctx.fillStyle = "#d97706";
      ctx.font = "bold 16px monospace";
      ctx.fillText(`REFERRAL CODE: ${selectedPromoter.referral_code}`, 300, 225);

      // Draw QR in center
      ctx.drawImage(img, 150, 280, 300, 300);

      // Bottom Call to Action
      ctx.fillStyle = "#059669";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("Scan with Camera / WhatsApp", 300, 630);

      ctx.fillStyle = "#64748b";
      ctx.font = "15px sans-serif";
      ctx.fillText("Get all brand prices & instant quotation in 60s", 300, 665);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "13px sans-serif";
      ctx.fillText("cctvquotation.com | Helpline: +91 73576 12865", 300, 740);

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${selectedPromoter.name.replace(/\s+/g, '_')}_WhatsApp_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("Printable QR card downloaded!");
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <>
      <PageHeader
        icon={BadgeDollarSign}
        title="Promoter & Partner Network"
        description="Manage referral partners (commission & flat discount), generate trackable WhatsApp QR codes, and monitor leads."
        badge={`${activeCount} Active`}
        action={
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Partner
          </button>
        }
      />

      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-md dark:shadow-md transition-all">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-400 dark:text-zinc-600 uppercase text-[10px] tracking-[0.2em] font-black">
              <tr>
                <th className="px-4 md:px-8 py-6">Partner</th>
                <th className="px-4 md:px-8 py-6 text-center">Referral Code</th>
                <th className="px-4 md:px-8 py-6 text-center">Commission / Discount</th>
                <th className="px-4 md:px-8 py-6 text-right">Total Business</th>
                <th className="px-4 md:px-8 py-6 text-center">Status</th>
                <th className="px-4 md:px-8 py-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/40 text-zinc-500 dark:text-zinc-400 font-medium">
              {initialPromoters.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 md:px-8 py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-[24px] bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 flex items-center justify-center shadow-inner">
                        <BadgeDollarSign className="w-8 h-8 text-zinc-300 dark:text-zinc-700" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-zinc-900 dark:text-white font-black text-xl uppercase tracking-widest leading-none">No Partners Yet</p>
                        <p className="text-zinc-400 dark:text-zinc-600 text-xs font-medium">Add your first referral agent or shop partner to start tracking leads.</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                initialPromoters.map((agent) => (
                  <tr key={agent.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/20 transition-all group/row">
                    <td className="px-4 md:px-8 py-6">
                      <div className="font-black text-zinc-900 dark:text-white text-base leading-tight group-hover/row:text-blue-600 dark:group-hover/row:text-blue-500 transition-colors uppercase tracking-tight">{agent.name}</div>
                      {(agent as any).business_name && (
                        <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">{(agent as any).business_name}</div>
                      )}
                      {(() => {
                        const lastTouch = (agent as any).last_contacted_at || (agent as any).last_visited_at || (agent as any).created_at;
                        const aging = calculateInactivityAging(lastTouch, (agent as any).visit_frequency_days || 14);
                        return (
                          <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mt-1.5 border ${aging.badge_color}`}>
                            {aging.badge_text}
                          </span>
                        );
                      })()}
                      {agent.mobile_number && (
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 dark:text-zinc-600 font-bold mt-2 uppercase tracking-widest">
                          <Phone className="w-3.5 h-3.5 text-zinc-300 dark:text-zinc-700" />
                          +91 {agent.mobile_number}
                        </div>
                      )}
                    </td>
                    <td className="px-4 md:px-8 py-6 text-center">
                      <span className="bg-amber-50 dark:bg-amber-500/5 text-amber-700 dark:text-amber-500 px-5 py-2 rounded-2xl font-mono font-black text-xs tracking-[0.3em] border border-amber-100 dark:border-amber-500/10 shadow-inner group-hover/row:bg-amber-100 dark:group-hover/row:bg-amber-500/10 transition-colors">
                        {agent.referral_code}
                      </span>
                    </td>
                    <td className="px-4 md:px-8 py-6 text-center text-xs">
                      {agent.discount_type === "percent" ? (
                        <span className="font-semibold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-lg">
                          {agent.discount_value || 3}% Discount + Comm
                        </span>
                      ) : (
                        <span className="font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-lg">
                          ₹{agent.discount_value || 500} Flat Reward / Disc
                        </span>
                      )}
                    </td>
                    <td className="px-4 md:px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className="font-black text-zinc-900 dark:text-white text-base">₹{(agent.total_ex_tax_business || 0).toLocaleString('en-IN')}</span>
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest mt-1 italic">Total business</span>
                      </div>
                    </td>
                    <td className="px-4 md:px-8 py-6 text-center">
                      {agent.is_active ? (
                        <span className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-500/20 shadow-inner">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-red-100 dark:border-red-500/20 shadow-inner">
                          <UserX className="w-3.5 h-3.5" />
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-4 md:px-8 py-6">
                      <div className="flex items-center justify-center gap-2">
                        {/* WhatsApp QR & Link Generator Button */}
                        <button
                          onClick={() => handleOpenQR(agent)}
                          className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 flex items-center gap-1.5 font-bold text-xs transition-all shadow-sm active:scale-95"
                          title="Generate WhatsApp QR & Link"
                        >
                          <QrCode className="w-4 h-4 text-emerald-600" />
                          <span>QR & Link</span>
                        </button>

                        <button
                          onClick={() => handleEdit(agent)}
                          className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-blue-600 flex items-center justify-center transition-all shadow-inner active:scale-90"
                          title="Edit partner"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                        {agent.is_active && (
                          <button
                            onClick={() => agent.id && handleBan(agent.id, agent.name)}
                            className="w-9 h-9 rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-red-500 flex items-center justify-center transition-all shadow-inner active:scale-90"
                            title="Disable partner"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WHATSAPP QR CODE & LINK DIALOG */}
      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-zinc-900 rounded-3xl p-6 border border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <QrCode className="w-6 h-6 text-emerald-600" />
              WhatsApp Lead Generation QR
            </DialogTitle>
            <DialogDescription className="text-sm text-zinc-500">
              When customers scan this QR or click the link, their WhatsApp will open with the partner's referral code pre-filled. The automated quotation engine will immediately attribute the lead and apply eligible discounts!
            </DialogDescription>
          </DialogHeader>

          {selectedPromoter && (
            <div className="space-y-4 py-2">
              {/* Partner Badge */}
              <div className="bg-slate-50 dark:bg-zinc-800/60 p-3 rounded-2xl flex items-center justify-between border border-slate-200 dark:border-zinc-700">
                <div>
                  <p className="font-bold text-sm text-zinc-900 dark:text-white">{selectedPromoter.name}</p>
                  <p className="text-xs text-zinc-500 font-mono">Code: {selectedPromoter.referral_code}</p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-1 rounded-full">
                  Partner QR
                </span>
              </div>

              {/* QR Code Container */}
              <div className="flex justify-center p-4 bg-white rounded-2xl border border-slate-200 shadow-inner">
                <QRCodeSVG
                  id="promoter-qr-svg"
                  value={getWaLink(selectedPromoter)}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>

              {/* Shareable Link Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">Pre-filled WhatsApp Link:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={getWaLink(selectedPromoter)}
                    className="flex-1 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl px-3 py-2 text-xs font-mono text-zinc-700 dark:text-zinc-300 outline-none"
                  />
                  <Button
                    onClick={() => copyLink(getWaLink(selectedPromoter))}
                    variant="outline"
                    className="shrink-0 rounded-xl flex items-center gap-1.5 text-xs font-bold"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex sm:justify-between items-center gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setQrModalOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Close
            </Button>
            <Button
              onClick={downloadQRCard}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20"
            >
              <Download className="w-4 h-4" />
              Download Printable Poster Card
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <PromoterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        promoter={editingPromoter}
        onSave={handleSave}
        availableLayouts={availableLayouts}
      />
    </>
  );
}
