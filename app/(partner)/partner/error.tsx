"use client";

import { AlertTriangle } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex h-full min-h-[50vh] w-full flex-col items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center justify-center rounded-3xl bg-white p-8 text-center shadow-sm ring-1 ring-gray-200">
        <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600">
          <AlertTriangle size={32} />
        </div>
        <h2 className="mb-2 font-black uppercase tracking-wider text-xl text-gray-900">
          Something went wrong
        </h2>
        <p className="mb-6 text-sm text-gray-500">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <button
          onClick={() => reset()}
          className="rounded-full bg-black px-6 py-2.5 text-sm font-bold uppercase tracking-wider text-white transition-colors hover:bg-gray-800"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
