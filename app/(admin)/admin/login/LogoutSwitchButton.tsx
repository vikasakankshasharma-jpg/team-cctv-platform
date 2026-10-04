"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LogoutSwitchButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    setLoading(true);
    try {
      await fetch("/api/customer/auth/logout", { method: "POST" });
      router.refresh(); // Refresh to trigger server-side re-evaluation of the session
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
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
