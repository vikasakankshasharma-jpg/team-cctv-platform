"use client";

import { CheckCircle2, XCircle } from "lucide-react";

export default function WaterfallVisualizer({ currentRules }: { currentRules: any }) {
  // A visual representation of how rules cascade
  return (
    <div className="bg-white p-6 rounded-lg border shadow-sm">
      <h2 className="font-semibold text-lg mb-4 text-gray-800 border-b pb-2">Waterfall Engine Flow</h2>
      <p className="text-sm text-gray-500 mb-6">This is how the system determines the price for any product in the catalog.</p>

      <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
        
        {/* Step 1 */}
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
            1
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-800">Product Override</h3>
            </div>
            <p className="text-sm text-gray-500">If a specific SKU has a custom markup, it is applied immediately. Other rules are ignored.</p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
            2
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-800">Brand Rule</h3>
            </div>
            <p className="text-sm text-gray-500">If no product override exists, the system checks if the product's brand has a specific markup (e.g., CP Plus = 20%).</p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
            3
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border shadow-sm">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-gray-800">Category Rule</h3>
            </div>
            <p className="text-sm text-gray-500">If no brand rule matches, the system checks the category (e.g., Storage = 10%).</p>
          </div>
        </div>

        {/* Step 4 */}
        <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-100 text-blue-500 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
            4
          </div>
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border shadow-sm border-blue-200 bg-blue-50">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-semibold text-blue-800">Global Default</h3>
            </div>
            <p className="text-sm text-blue-600">The ultimate fallback. Currently set to {currentRules?.GLOBAL_DEFAULT || 20}%.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
