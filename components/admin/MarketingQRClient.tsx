"use client";

import { useState } from "react";
import { Plus, Link as LinkIcon, QrCode, Trash2, ExternalLink, Activity, Users, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { QRCodeSVG } from "qrcode.react";

export default function MarketingQRClient({ initialCampaigns }: { initialCampaigns: any[] }) {
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: "",
    medium: "flyer",
    keyword: ""
  });

  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedQRLink, setSelectedQRLink] = useState("");
  const [selectedQRTitle, setSelectedQRTitle] = useState("");

  const handleAddCampaign = async () => {
    if (!formData.title || !formData.keyword) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/marketing-campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Optimistic addition
      const newCampaign = {
        id: data.id,
        ...formData,
        keyword: formData.keyword.toUpperCase(),
        wa_link: `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919024097475"}?text=Hi ${formData.keyword.toUpperCase()}`,
        is_active: true,
        total_leads: 0,
        created_at: new Date().toISOString()
      };
      
      setCampaigns([newCampaign, ...campaigns]);
      setIsAddOpen(false);
      setFormData({ title: "", medium: "flyer", keyword: "" });
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
      await fetch("/api/admin/marketing-campaigns", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_active: !current })
      });
    } catch (err) {
      // Revert on error
      setCampaigns(prev => prev.map(c => c.id === id ? { ...c, is_active: current } : c));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign link?")) return;
    try {
      await fetch(`/api/admin/marketing-campaigns?id=${id}`, { method: "DELETE" });
      setCampaigns(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const openQR = (link: string, title: string) => {
    setSelectedQRLink(link);
    setSelectedQRTitle(title);
    setQrModalOpen(true);
  };

  const downloadQR = () => {
    const svg = document.getElementById("marketing-qr-svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `${selectedQRTitle.replace(/\s+/g, '_')}_QR.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-[var(--text)]">Campaign Links</h3>
        <Button onClick={() => setIsAddOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New Campaign
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((camp) => (
          <div key={camp.id} className="admin-card overflow-hidden flex flex-col">
            <div className="p-5 border-b border-[var(--border2)] flex justify-between items-start">
              <div>
                <h4 className="font-semibold text-base mb-1 text-[var(--text)]">{camp.title}</h4>
                <div className="flex items-center gap-2 text-xs text-[var(--muted)]">
                  <span className="uppercase tracking-wider px-2 py-0.5 rounded bg-[var(--surface2)]">{camp.medium}</span>
                  <span>Keyword: <strong className="text-[var(--text)]">{camp.keyword}</strong></span>
                </div>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <button 
                  onClick={() => handleToggleActive(camp.id, camp.is_active)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors ${camp.is_active ? 'bg-[var(--gold)]' : 'bg-[var(--surface2)]'}`}
                >
                  <span className="sr-only">Toggle</span>
                  <span className={`pointer-events-none absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${camp.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
            
            <div className="p-5 bg-[var(--surface)] flex-1 flex flex-col justify-center">
              <div className="flex gap-4">
                <div 
                  onClick={() => openQR(camp.wa_link, camp.title)}
                  className="w-20 h-20 bg-white p-1 rounded-xl shadow-sm border border-[var(--border)] cursor-pointer hover:scale-105 transition-transform"
                >
                  <QRCodeSVG value={camp.wa_link} size={70} />
                </div>
                <div className="flex flex-col justify-center space-y-2 flex-1">
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)] truncate">
                    <LinkIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{camp.wa_link.substring(0, 30)}...</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[var(--muted)]">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>{camp.total_leads} Leads Generated</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[var(--surface2)] flex justify-between gap-2 border-t border-[var(--border2)]">
              <Button variant="ghost" size="sm" className="flex-1 gap-2" onClick={() => window.open(camp.wa_link, '_blank')}>
                <ExternalLink className="w-3.5 h-3.5" /> Open
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 gap-2" onClick={() => openQR(camp.wa_link, camp.title)}>
                <QrCode className="w-3.5 h-3.5" /> View QR
              </Button>
              <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 px-3" onClick={() => handleDelete(camp.id)}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {campaigns.length === 0 && (
          <div className="col-span-full py-6 md:py-12 text-center text-[var(--muted)] border-2 border-dashed border-[var(--border2)] rounded-2xl">
            <QrCode className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium">No marketing campaigns yet.</p>
            <p className="text-sm mt-1 mb-4">Create your first trackable QR code for a flyer or ad.</p>
            <Button onClick={() => setIsAddOpen(true)}>Create Campaign</Button>
          </div>
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>New Offline Campaign</DialogTitle>
            <DialogDescription>
              Create a trackable WhatsApp link & QR code for offline marketing.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">Campaign Title</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. August Times of India Insert"
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)]"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Marketing Medium</label>
              <select
                value={formData.medium}
                onChange={(e) => setFormData({ ...formData, medium: e.target.value })}
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)]"
              >
                <option value="flyer">Printed Flyer</option>
                <option value="newspaper">Newspaper Insert</option>
                <option value="poster">Poster / Hoarding</option>
                <option value="facebook_ad">Facebook / Insta Ad (CTWA)</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-sm font-medium">Secret Keyword</label>
              <p className="text-xs text-[var(--muted)]">Customers will scan the QR code and send "Hi [Keyword]". E.g. "NEWS24".</p>
              <input
                value={formData.keyword}
                onChange={(e) => setFormData({ ...formData, keyword: e.target.value.toUpperCase().replace(/\s/g, '') })}
                placeholder="e.g. NEWS24"
                className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--gold)] uppercase"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
            <Button onClick={handleAddCampaign} disabled={loading || !formData.title || !formData.keyword}>
              {loading ? "Creating..." : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
        <DialogContent className="sm:max-w-[400px] flex flex-col items-center text-center p-4 md:p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-center">{selectedQRTitle}</DialogTitle>
            <DialogDescription className="text-center">Scan to test or download for print</DialogDescription>
          </DialogHeader>
          <div className="bg-white p-4 rounded-2xl shadow-sm border mb-6 inline-block">
            <QRCodeSVG id="marketing-qr-svg" value={selectedQRLink} size={240} level="M" />
          </div>
          <p className="text-xs text-[var(--muted)] mb-6 bg-[var(--surface2)] p-2 rounded-lg break-all">
            {selectedQRLink}
          </p>
          <Button onClick={downloadQR} className="w-full gap-2" size="lg">
            <Download className="w-4 h-4" /> Download QR Code (PNG)
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
