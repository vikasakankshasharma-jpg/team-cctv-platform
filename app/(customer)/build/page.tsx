import React from "react";
import BuilderClient from "@/components/build/BuilderClient";

export default function BuildPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-slate-900 text-white py-12 px-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Build Your CCTV System</h1>
        <p className="text-xl text-slate-300 max-w-2xl mx-auto">
          Already know what you need? Select your cameras, recorder, storage, and accessories to get an instant quotation.
        </p>
      </div>
      <BuilderClient />
    </main>
  );
}
