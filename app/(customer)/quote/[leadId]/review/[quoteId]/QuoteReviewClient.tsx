"use client";

import { useState } from "react";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "@/lib/firebase-client";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LineItem {
  id: string;
  name: string;
  description: string;
  badge?: { label: string; color?: string };
  quantity: number;
  unitPrice: number;
}

export interface QuoteData {
  id: string;
  leadId: string;
  quoteNumber: string;
  status: "pending" | "accepted" | "expired" | "rejected";
  issuedAt: string;
  validUntil: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  installationAddress: string;
  propertyType: string;
  propertyDetail: string;
  siteVisitDate?: string;
  lineItems: LineItem[];
  gstPercent: number;
  notes?: string;
  advancePercent: number;
  companyGstin: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86_400_000));
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: QuoteData["status"] }) {
  const map = {
    pending:  { label: "Awaiting Approval", bg: "#FFF4E0", color: "#A05F00", border: "#F5D080", dot: "#C8922A" },
    accepted: { label: "Accepted",          bg: "#E8F5F0", color: "#0A7A5A", border: "#A3D9C6", dot: "#0A7A5A" },
    expired:  { label: "Expired",           bg: "#FDF0EE", color: "#C0392B", border: "#F0B8B3", dot: "#C0392B" },
    rejected: { label: "Rejected",          bg: "#F5F5F5", color: "#6B7380", border: "#D4D4D0", dot: "#6B7380" },
  };
  const s = map[status] || map.pending;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 14px",
        borderRadius: 100,
        fontSize: 12.5,
        fontWeight: 600,
        letterSpacing: ".03em",
        background: s.bg,
        color: s.color,
        border: `1px solid ${s.border}`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: s.dot,
          flexShrink: 0,
        }}
      />
      {s.label}
    </span>
  );
}

function TermCard({
  icon,
  iconBg,
  title,
  body,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  body: string;
}) {
  return (
    <div
      style={{
        background: "#F7F7F3",
        border: "1px solid #E4E4DC",
        borderRadius: 8,
        padding: "14px 14px 12px",
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <div
        style={{
          width: 30,
          height: 30,
          borderRadius: 7,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
          background: iconBg,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#1C1C28", marginBottom: 2 }}>{title}</div>
        <div style={{ fontSize: 11.5, color: "#6B7380", lineHeight: 1.5 }}>{body}</div>
      </div>
    </div>
  );
}

// ─── Main Client Component ───────────────────────────────────────────────────

export function QuoteReviewClient({ quote }: { quote: QuoteData }) {
  const [accepted, setAccepted] = useState(quote.status === "accepted");
  const [isAccepting, setIsAccepting] = useState(false);

  const subtotal = quote.lineItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const halfGst  = (subtotal * quote.gstPercent) / 200;
  const total    = subtotal + halfGst * 2;
  const advance  = Math.round(total * quote.advancePercent / 100);
  const daysLeft = daysUntil(quote.validUntil);

  const NAVY  = "#0F1F3D";
  const GOLD  = "#C8922A";

  async function handleAccept() {
    setIsAccepting(true);
    try {
      await updateDoc(
        doc(db, "leads", quote.leadId, "quotes", quote.id),
        {
          status: "accepted",
          accepted_at: serverTimestamp(),
          accepted_by_uid: auth.currentUser?.uid || "anonymous",
        }
      );
      setAccepted(true);
      toast.success("Quote accepted successfully! We will contact you soon.");
    } catch (err) {
      console.error(err);
      toast.error("Could not save your acceptance. Please try again.");
    } finally {
      setIsAccepting(false);
    }
  }

  const handleDownloadPDF = async () => {
    try {
      toast.info("Generating your PDF...");
      const pdfRes = await fetch(`/api/v1/leads/${quote.leadId}/quotes/${quote.id}/pdf`);
      if (pdfRes.ok) {
        const contentType = pdfRes.headers.get("Content-Type");
        if (contentType === "application/pdf") {
          const blob = await pdfRes.blob();
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, "_blank");
        } else {
          const { url } = await pdfRes.json();
          if (url) {
            window.open(url, "_blank");
          }
        }
      } else {
         toast.error("Failed to generate PDF.");
      }
    } catch (error) {
      console.error("PDF download failed", error);
      toast.error("An error occurred while downloading the PDF.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FAFAF7",
        fontFamily: "'DM Sans', system-ui, sans-serif",
        padding: "24px 16px 80px",
      }}
    >
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* ── Status bar ─────────────────────────────────────────────── */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
          <StatusPill status={accepted ? "accepted" : quote.status} />
          {!accepted && (
            <span
              style={{
                fontSize: 12,
                color: "#6B7380",
                background: "white",
                border: "1px solid #E4E4DC",
                padding: "5px 12px",
                borderRadius: 100,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              ⏱ Valid until {formatDate(quote.validUntil)}
              {daysLeft > 0 && (
                <strong style={{ color: daysLeft <= 3 ? "#C0392B" : "#A05F00" }}>
                  &nbsp;· {daysLeft}d left
                </strong>
              )}
              {daysLeft === 0 && <strong style={{ color: "#C0392B" }}>&nbsp;· Expires today</strong>}
            </span>
          )}
        </div>

        {/* ── Main card ─────────────────────────────────────────────── */}
        <div
          style={{
            background: "white",
            borderRadius: 10,
            boxShadow: "0 12px 40px rgba(15,31,61,.13)",
            overflow: "hidden",
            border: "1px solid rgba(228,228,220,.6)",
          }}
        >

          {/* ── Header ──────────────────────────────────────────────── */}
          <div
            style={{
              background: NAVY,
              padding: "32px 36px 28px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* decorative circles */}
            <div style={{ position: "absolute", top: -60, right: -60, width: 220, height: 220, borderRadius: "50%", background: "rgba(200,146,42,.07)", pointerEvents: "none" }} />
            <div style={{ position: "absolute", bottom: -40, left: -30, width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,.03)", pointerEvents: "none" }} />

            {/* brand + quote number */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, position: "relative", zIndex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, background: GOLD, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 7 16 12l7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                  </svg>
                </div>
                <div>
                  <div style={{ color: "white", fontFamily: "'Playfair Display', serif", fontSize: 20, fontWeight: 700, lineHeight: 1.1 }}>TEAM CCTV</div>
                  <div style={{ color: "rgba(255,255,255,.45)", fontSize: 11, fontWeight: 400, marginTop: 2, letterSpacing: ".04em", textTransform: "uppercase" }}>Smart Security Solutions · Jaipur</div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "rgba(255,255,255,.4)", fontSize: 10.5, fontWeight: 500, letterSpacing: ".1em", textTransform: "uppercase" }}>Quotation</div>
                <div style={{ color: GOLD, fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, letterSpacing: ".02em", marginTop: 3 }}>
                  #{quote.quoteNumber}
                </div>
              </div>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid rgba(255,255,255,.08)", margin: "22px 0", position: "relative" }} />

            {/* meta row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, position: "relative", zIndex: 1 }}>
              {[
                ["Date Issued", formatDate(quote.issuedAt)],
                ["Prepared For", quote.customer.name],
                ["Lead Reference", quote.leadId.substring(0, 12) + "…"],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ color: "rgba(255,255,255,.38)", fontSize: 10, fontWeight: 600, letterSpacing: ".09em", textTransform: "uppercase", marginBottom: 5 }}>{label}</div>
                  <div style={{ color: "rgba(255,255,255,.9)", fontSize: 13.5, fontWeight: 500 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Body ──────────────────────────────────────────────────── */}
          <div style={{ padding: "32px 36px" }}>

            {/* Bill to / install site */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>
              {[
                {
                  label: "Bill To",
                  name: quote.customer.name,
                  detail: <>{quote.customer.phone}<br/>{quote.customer.email}</>,
                  address: quote.installationAddress,
                  addressExtra: null,
                },
                {
                  label: "Installation Site",
                  name: quote.propertyType,
                  detail: <>{quote.propertyDetail}</>,
                  address: "Same as billing address",
                  addressExtra: quote.siteVisitDate ? `Site visit confirmed — ${formatDate(quote.siteVisitDate)}` : null,
                },
              ].map((b) => (
                <div key={b.label}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "#6B7380", display: "block", marginBottom: 8 }}>{b.label}</div>
                  <div style={{ fontSize: 15.5, fontWeight: 600, color: "#1C1C28", lineHeight: 1.3, marginBottom: 3 }}>{b.name}</div>
                  <div style={{ fontSize: 13, color: "#6B7380", lineHeight: 1.6 }}>{b.detail}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "flex-start", marginTop: 10, padding: "10px 12px", background: "#F6F6F3", borderRadius: 7, border: "1px solid #E4E4DC" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0, marginTop: 1 }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    <div style={{ fontSize: 12.5, color: "#6B7380", lineHeight: 1.55 }}>
                      {b.address}
                      {b.addressExtra && <><br/>{b.addressExtra}</>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Section label */}
            {/* What Happens Next Section */}
            <div style={{ marginBottom: 32 }}>
               <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2C5F8A" strokeWidth="2.5" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "#1C1C28" }}>What Happens Next?</div>
               </div>
               
               <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                 {[
                   { title: "Site Survey", desc: "Book a visit for a precise wiring measurement." },
                   { title: "Installation", desc: "Professional setup by our certified team." },
                   { title: "Go Live", desc: "System handover with mobile app setup." }
                 ].map((step, i) => (
                   <div key={i} style={{ padding: 12, borderRadius: 10, background: "#F7F7F3", border: "1px solid #E4E4DC" }}>
                     <div style={{ fontSize: 9, fontWeight: 800, color: "#2C5F8A", textTransform: "uppercase", letterSpacing: ".05em", marginBottom: 4 }}>STEP 0{i+1}</div>
                     <div style={{ fontSize: 12.5, fontWeight: 700, color: "#1C1C28", marginBottom: 2 }}>{step.title}</div>
                     <div style={{ fontSize: 10.5, color: "#6B7380", lineHeight: 1.4 }}>{step.desc}</div>
                   </div>
                 ))}
               </div>
            </div>

            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "#6B7380", marginBottom: 12 }}>
              Detailed Bill of Materials
            </div>

            {/* Line items table */}
            <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 4 }}>
              <thead>
                <tr style={{ borderBottom: `1.5px solid ${NAVY}` }}>
                  {[["Item / Description", "46%", "left"], ["Qty", "10%", "center"], ["Unit Price", "18%", "right"], ["Amount", "18%", "right"]].map(([h, w, align]) => (
                    <th
                      key={h as string}
                      style={{ width: w as string, textAlign: align as "left"|"center"|"right", fontSize: 10.5, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: NAVY, padding: "0 0 10px" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {quote.lineItems.map((item) => {
                  const amount = item.quantity * item.unitPrice;
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid #E4E4DC" }}>
                      <td style={{ padding: "13px 0", verticalAlign: "top", fontSize: 13.5 }}>
                        <div style={{ fontWeight: 600, color: "#1C1C28", marginBottom: 2 }}>{item.name}</div>
                        <div style={{ fontSize: 11.5, color: "#6B7380", fontWeight: 400 }}>{item.description}</div>
                        {item.badge && (
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 10,
                            fontWeight: 600,
                            background: item.badge.color ?? NAVY,
                            color: "white",
                            padding: "2px 7px",
                            borderRadius: 4,
                            marginTop: 4,
                            letterSpacing: ".03em",
                          }}>
                            {item.badge.label}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "13px 0", textAlign: "center", verticalAlign: "top" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 32, height: 24, background: "#F0F0EA", borderRadius: 5, fontSize: 13, fontWeight: 600, color: "#1C1C28" }}>
                          {item.quantity}
                        </span>
                      </td>
                      <td style={{ padding: "13px 0", textAlign: "right", verticalAlign: "top", fontSize: 13.5 }}>{formatINR(item.unitPrice)}</td>
                      <td style={{ padding: "13px 0", textAlign: "right", verticalAlign: "top", fontSize: 13.5 }}>
                        <strong>{formatINR(amount)}</strong>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, marginBottom: 28 }}>
              <div style={{ width: 260 }}>
                {[
                  { label: "Subtotal", value: formatINR(subtotal), muted: true },
                  { label: `CGST @ ${quote.gstPercent / 2}%`, value: formatINR(halfGst), muted: true, small: true },
                  { label: `SGST @ ${quote.gstPercent / 2}%`, value: formatINR(halfGst), muted: true, small: true },
                ].map((row) => (
                  <div
                    key={row.label}
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderBottom: "1px solid #E4E4DC", fontSize: row.small ? 12.5 : 13.5 }}
                  >
                    <span style={{ color: "#6B7380" }}>{row.label}</span>
                    <span style={{ color: row.muted ? "#6B7380" : "#1C1C28", fontWeight: row.muted ? 400 : 600 }}>{row.value}</span>
                  </div>
                ))}
                <div
                  style={{ background: NAVY, borderRadius: 8, padding: "13px 14px", marginTop: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}
                >
                  <span style={{ color: "rgba(255,255,255,.6)", fontSize: 11, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>Total Payable</span>
                  <span style={{ color: GOLD, fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700 }}>{formatINR(total)}</span>
                </div>
              </div>
            </div>

            {/* Trust term cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 28 }}>
              <TermCard
                iconBg="#F5E6C8"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.2" strokeLinecap="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>}
                title="1-Year Warranty"
                body="All equipment + labour covered. Free replacement if defective."
              />
              <TermCard
                iconBg="#E8F5F0"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0A7A5A" strokeWidth="2.2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
                title={`${quote.advancePercent}% Advance`}
                body={`${formatINR(advance)} advance to confirm. Balance on completion.`}
              />
              <TermCard
                iconBg="#E8EDF5"
                icon={<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={NAVY} strokeWidth="2.2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.79 19.79 0 0 1 11.37 19a19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>}
                title="Support Included"
                body="Free remote support for 12 months. On-site within 24 hours."
              />
            </div>

            {/* Notes */}
            {quote.notes && (
              <div
                style={{
                  background: "#F5F9FF",
                  border: "1px solid #D0E3F8",
                  borderLeft: `3px solid ${NAVY}`,
                  borderRadius: "0 8px 8px 0",
                  padding: "14px 16px",
                  marginBottom: 28,
                  fontSize: 13,
                  color: "#2C3E6B",
                  lineHeight: 1.6,
                }}
              >
                <strong style={{ fontWeight: 600, display: "block", marginBottom: 3, fontSize: 12, textTransform: "uppercase", letterSpacing: ".05em", color: NAVY }}>
                  Important Note
                </strong>
                {quote.notes} GSTIN: {quote.companyGstin}
              </div>
            )}

            <hr style={{ border: "none", borderTop: "1px solid #E4E4DC", margin: "0 0 28px" }} />

            {/* ── Visual Intelligence Comparison ────────────────────────── */}
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".09em", textTransform: "uppercase", color: "#6B7380", marginBottom: 16 }}>
                Visual Intelligence: Resolution Comparison
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #E4E4DC" }}>
                  <img 
                    src="/comparisons/2mp.png" 
                    alt="2MP View" 
                    style={{ width: "100%", display: "block", aspectRatio: "16/9", objectFit: "cover" }} 
                  />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 12px", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", color: "white" }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>2MP Full HD (1080p)</div>
                    <div style={{ fontSize: 9, opacity: 0.8 }}>Standard identification range: 10-15ft</div>
                  </div>
                </div>

                <div style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: "1px solid #C8922A" }}>
                  <img 
                    src="/comparisons/5mp.png" 
                    alt="5MP View" 
                    style={{ width: "100%", display: "block", aspectRatio: "16/9", objectFit: "cover" }} 
                  />
                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 12px", background: "rgba(200,146,42,0.9)", color: "white" }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>5MP Ultra 3K HD</div>
                    <div style={{ fontSize: 9, opacity: 0.9 }}>Advanced identification range: 25-30ft</div>
                  </div>
                  <div style={{ position: "absolute", top: 8, right: 8, background: "#C8922A", color: "white", fontSize: 8, fontWeight: 900, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>Recommended</div>
                </div>
              </div>
              
              <p style={{ fontSize: 11.5, color: "#6B7380", marginTop: 12, lineHeight: 1.5, fontStyle: "italic" }}>
                * Images are simulated for comparative purposes. 5MP resolution provides 2.5x more detail than standard 2MP cameras, crucial for facial recognition and license plate capture at longer distances.
              </p>
            </div>

            <hr style={{ border: "none", borderTop: "1px solid #E4E4DC", margin: "0 0 24px" }} />

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {!accepted ? (
                <button
                  onClick={handleAccept}
                  disabled={isAccepting}
                  style={{
                    flex: 1,
                    minWidth: 160,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "13px 24px",
                    borderRadius: 8,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: isAccepting ? "not-allowed" : "pointer",
                    border: "none",
                    background: NAVY,
                    color: "white",
                    transition: "all .18s",
                    opacity: isAccepting ? 0.7 : 1,
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  {isAccepting ? "Accepting..." : "Accept This Quote"}
                </button>
              ) : (
                <div
                  style={{
                    flex: 1,
                    minWidth: 160,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "13px 24px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    background: "#0A7A5A",
                    color: "white",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Quote Accepted!
                </div>
              )}

              <button
                onClick={handleDownloadPDF}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 24px",
                  borderRadius: 8,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  border: "none",
                  background: GOLD,
                  color: "white",
                  transition: "all .18s",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Download PDF
              </button>

              <button
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "13px 24px",
                  borderRadius: 8,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  background: "white",
                  color: "#1C1C28",
                  border: "1.5px solid #E4E4DC",
                  transition: "all .18s",
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                Book Site Visit
              </button>
            </div>

          </div>{/* /body */}

          {/* Footer */}
          <div
            style={{
              background: "#F5F5F0",
              borderTop: "1px solid #E4E4DC",
              padding: "18px 36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div style={{ fontSize: 12, color: "#6B7380" }}>
              <strong style={{ color: "#1C1C28", fontWeight: 600 }}>TEAM CCTV</strong>
              {" "}· GSTIN: {quote.companyGstin}
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              {[
                { icon: "📞", label: "+91 98290 00000" },
                { icon: "✉", label: "support@cctvquotation.com" },
              ].map((c) => (
                <span key={c.label} style={{ fontSize: 12, color: "#6B7380", display: "flex", alignItems: "center", gap: 5 }}>
                  {c.icon} {c.label}
                </span>
              ))}
            </div>
          </div>

        </div>{/* /card */}
      </div>
    </div>
  );
}
