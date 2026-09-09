import React from "react";
import BuilderClient from "@/components/build/BuilderClient";
import { TranslatedText } from "@/components/shared/TranslatedText";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build Your CCTV System | CCTVQuotation by TEAM",
  description: "Already know what you need? Select your cameras, recorder, storage, and accessories to get an instant quotation.",
};

export default function BuildPage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] dark:bg-black transition-colors duration-500">
      <div className="bg-[#1d1d1f] dark:bg-[#0d0d0d] text-white py-12 sm:py-16 px-4 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight mb-4">
          <TranslatedText tKey="build_page_title" defaultText="Build Your CCTV System" />
        </h1>
        <p className="text-lg sm:text-xl text-[#a1a1a6] max-w-2xl mx-auto font-normal leading-relaxed">
          <TranslatedText tKey="build_page_subtitle" defaultText="Already know what you need? Select your cameras, recorder, storage, and accessories to get an instant quotation." />
        </p>
      </div>
      <BuilderClient />
    </main>
  );
}
