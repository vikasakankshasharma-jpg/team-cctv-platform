"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-zinc-950 text-white flex min-h-screen items-center justify-center p-8 font-sans">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-red-500/5">
            <span className="text-4xl">⚠️</span>
          </div>
          
          <h1 className="text-3xl font-black tracking-tight text-zinc-100">
            System Failure
          </h1>
          
          <p className="text-zinc-400 font-medium leading-relaxed">
            A critical error occurred at the highest level of the application. The system has automatically logged this incident.
          </p>

          <button
            onClick={() => reset()}
            className="w-full h-12 bg-white text-black font-bold rounded-xl hover:bg-zinc-200 active:scale-95 transition-all mt-8"
          >
            Attempt System Reboot
          </button>
        </div>
      </body>
    </html>
  );
}
