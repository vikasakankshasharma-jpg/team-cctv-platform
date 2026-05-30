"use client";

import { useEffect, useState } from "react";
import { signInWithCustomToken } from "firebase/auth";
import { auth } from "@/lib/firebase-client";
import { useRouter, useSearchParams } from "next/navigation";

export default function TestLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("Initializing E2E Auth...");

  useEffect(() => {
    const role = searchParams.get("role") || "admin";
    const redirectTo = searchParams.get("redirect") || (role === "dealer" ? "/dealer" : "/admin");

    async function login() {
      try {
        setStatus(`Minting custom token for role: ${role}...`);
        
        const res = await fetch("/api/test-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role }),
        });
        
        if (!res.ok) throw new Error("Failed to fetch custom token");
        const { customToken } = await res.json();

        setStatus("Signing into Firebase Client...");
        await signInWithCustomToken(auth, customToken);

        setStatus("Establishing secure HTTP Session...");
        const idToken = await auth.currentUser?.getIdToken(true);
        const sessionRes = await fetch(role === "dealer" ? "/api/partner/auth/session" : "/api/auth/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ idToken }), 
        });

        if (!sessionRes.ok) throw new Error("Failed to create session cookie");

        setStatus("Success! Redirecting...");
        setTimeout(() => {
          router.push(redirectTo);
        }, 500);

      } catch (err: any) {
        setStatus(`Error: ${err.message}`);
        console.error("E2E Login Failed", err);
      }
    }

    login();
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-green-400 font-mono text-sm">
      <div className="p-8 border border-green-500/30 rounded bg-green-950/20">
        <h1 className="text-xl font-bold mb-4 text-white">E2E Automation Login</h1>
        <p data-testid="e2e-status">{status}</p>
      </div>
    </div>
  );
}
