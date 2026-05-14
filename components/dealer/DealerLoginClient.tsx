"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Phone, ArrowRight, Shield, RotateCcw } from "lucide-react";

type Step = "phone" | "otp";

export function DealerLoginClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [mobile, setMobile] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  };

  const handleSendOtp = async () => {
    setError("");
    if (!/^\d{10}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/dealer/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_number: mobile, action: "send" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setStep("otp");
      startCountdown();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError("");
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/dealer/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile_number: mobile, action: "verify", otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "OTP verification failed");

      // Create session
      const sessionRes = await fetch("/api/dealer/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id_token: data.id_token }),
      });
      if (!sessionRes.ok) throw new Error("Session creation failed");

      router.push("/dealer/dashboard");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0F1F3D 0%, #1a3260 60%, #0F1F3D 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'DM Sans', system-ui, sans-serif",
    }}>
      {/* Decorative circles */}
      <div style={{ position: "fixed", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%", background: "rgba(200,146,42,0.06)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -120, left: -80, width: 350, height: 350, borderRadius: "50%", background: "rgba(59,130,246,0.05)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        {/* Brand */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 64, height: 64, background: "rgba(200,146,42,0.15)", border: "1.5px solid rgba(200,146,42,0.3)", borderRadius: 18, marginBottom: 16 }}>
            <Building2 size={28} color="#C8922A" />
          </div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>TEAM CCTV</div>
          <h1 style={{ color: "white", fontSize: 24, fontWeight: 800, margin: 0, lineHeight: 1.2 }}>Dealer Portal</h1>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 13.5, marginTop: 6, margin: "8px 0 0" }}>Sign in to manage your territory leads</p>
        </div>

        {/* Card */}
        <div style={{ background: "white", borderRadius: 20, padding: "36px 32px", boxShadow: "0 32px 80px rgba(0,0,0,0.3)" }}>

          {step === "phone" ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B7380", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  Registered Mobile Number
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", border: "1.5px solid #E4E4DC", borderRadius: 12, background: "#FAFAF7" }}>
                  <Phone size={16} color="#6B7380" style={{ flexShrink: 0 }} />
                  <div style={{ color: "#6B7380", fontSize: 13.5, fontWeight: 600, flexShrink: 0 }}>+91</div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value.replace(/\D/g, ""))}
                    onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                    placeholder="9XXXXXXXXX"
                    autoFocus
                    style={{ flex: 1, border: "none", outline: "none", background: "transparent", fontSize: 15, fontWeight: 700, color: "#1C1C28", letterSpacing: "0.04em" }}
                  />
                </div>
                <p style={{ fontSize: 11.5, color: "#6B7380", marginTop: 8, lineHeight: 1.5 }}>
                  Use the mobile number registered with TEAM CCTV as a franchise dealer.
                </p>
              </div>

              {error && (
                <div style={{ background: "#FDF0EE", border: "1px solid #F0B8B3", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#C0392B", fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleSendOtp}
                disabled={loading || mobile.length !== 10}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 24px", background: loading || mobile.length !== 10 ? "#D4D4D0" : "#0F1F3D", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading || mobile.length !== 10 ? "not-allowed" : "pointer", transition: "all .2s" }}
              >
                {loading ? "Sending…" : "Send OTP"} {!loading && <ArrowRight size={16} />}
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 8 }}>
                <button onClick={() => { setStep("phone"); setOtp(""); setError(""); }} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#6B7380", background: "none", border: "none", cursor: "pointer", padding: 0, marginBottom: 20, fontWeight: 600 }}>
                  ← Change number
                </button>
                <div style={{ background: "#E8F5F0", border: "1px solid #A3D9C6", borderRadius: 10, padding: "10px 14px", marginBottom: 20, fontSize: 13, color: "#0A7A5A", fontWeight: 600 }}>
                  ✓ OTP sent to +91 {mobile}
                </div>

                <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "#6B7380", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                  Enter 6-Digit OTP
                </label>
                <input
                  type="tel"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp()}
                  placeholder="------"
                  autoFocus
                  style={{ width: "100%", boxSizing: "border-box", padding: "14px 16px", border: "1.5px solid #E4E4DC", borderRadius: 12, background: "#FAFAF7", fontSize: 22, fontWeight: 800, letterSpacing: "0.3em", textAlign: "center", outline: "none", color: "#1C1C28" }}
                />
              </div>

              {error && (
                <div style={{ background: "#FDF0EE", border: "1px solid #F0B8B3", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#C0392B", fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length !== 6}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px 24px", background: loading || otp.length !== 6 ? "#D4D4D0" : "#0F1F3D", color: "white", border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: loading || otp.length !== 6 ? "not-allowed" : "pointer", transition: "all .2s", marginBottom: 12 }}
              >
                {loading ? "Verifying…" : "Verify & Sign In"} {!loading && <Shield size={15} />}
              </button>

              <button
                onClick={() => { if (countdown === 0) { setOtp(""); handleSendOtp(); }}}
                disabled={countdown > 0}
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", background: "none", border: "none", fontSize: 13, fontWeight: 600, color: countdown > 0 ? "#D4D4D0" : "#6B7380", cursor: countdown > 0 ? "not-allowed" : "pointer" }}
              >
                <RotateCcw size={13} /> {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
              </button>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 11.5, marginTop: 20 }}>
          Not a registered dealer? Contact TEAM CCTV admin.
        </p>
      </div>
    </div>
  );
}
