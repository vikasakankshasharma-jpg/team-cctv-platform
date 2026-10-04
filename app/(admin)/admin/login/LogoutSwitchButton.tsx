"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutSwitchButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      // 1. Clear backend session cookies across all roles
      await fetch("/api/auth/session", { method: "DELETE" });
      await fetch("/api/customer/auth/logout", { method: "POST" });
      
      // 2. Clear Firebase client auth if initialized
      try {
        const { auth } = await import("@/lib/firebase-client");
        if (auth) await auth.signOut();
      } catch (e) {
        // Firebase client not initialized or offline
      }

      // 3. Clear local storage/session storage tokens if any
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {}

      // 4. Force hard reload to reset Next.js router cache and service worker state
      window.location.href = "/admin/login";
    } catch (e) {
      console.error(e);
      window.location.reload();
    }
  };

  return (
    <button 
      onClick={handleLogout}
      disabled={loading}
      className="px-6 py-3 bg-[var(--gold)] text-[#0A0E1A] font-bold rounded-xl mt-4 ml-4"
    >
      {loading ? "Logging out..." : "Logout & Switch Account"}
    </button>
  );
}
