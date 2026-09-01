"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Props {
  quoteId: string;
  paymentId: string;
}

export function PaymentSuccessClient({ quoteId, paymentId }: Props) {
  const [invoiceReady, setInvoiceReady] = useState(false);

  useEffect(() => {
    // Give webhook a moment to process
    const timer = setTimeout(() => setInvoiceReady(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const invoiceUrl = `/api/invoice/${quoteId}/download`;
  const whatsappUrl = `https://wa.me/919772699395?text=${encodeURIComponent(`Hi! I just made a payment for my CCTV installation. Quote ID: ${quoteId}, Payment ID: ${paymentId}. Please schedule my installation.`)}`;

  return (
    <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6">
      <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-10 text-center text-white">
          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h1 className="text-4xl font-black mb-3 tracking-tight">Payment Confirmed!</h1>
          <p className="text-green-100 text-lg font-medium">Your CCTV installation has been booked</p>
        </div>

        <div className="p-8 space-y-8">
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6">
            <h3 className="font-bold text-green-900 mb-4 text-lg">Transaction Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Quote Reference</span>
                <span className="font-mono font-bold text-green-900">{quoteId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Payment ID</span>
                <span className="font-mono font-bold text-green-900">{paymentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Status</span>
                <span className="font-bold text-green-600 bg-green-100 px-3 py-0.5 rounded-full text-xs uppercase tracking-wider">Paid</span>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <h3 className="font-bold text-blue-900 mb-3 text-lg">What Happens Next?</h3>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">1</div>
                <div>
                  <p className="font-bold text-blue-900">Engineer Assignment (Within 2 Hours)</p>
                  <p className="text-sm text-blue-700">Our nearest certified engineer will be assigned to your installation and will contact you on WhatsApp.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">2</div>
                <div>
                  <p className="font-bold text-blue-900">Site Survey & Scheduling (Within 24 Hours)</p>
                  <p className="text-sm text-blue-700">The engineer will conduct a free site survey and confirm the best camera placement for your property.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm">3</div>
                <div>
                  <p className="font-bold text-blue-900">Professional Installation (Within 48 Hours)</p>
                  <p className="text-sm text-blue-700">Complete installation with testing, handover, and a walkthrough of your new CCTV system.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {invoiceReady ? (
              <a href={invoiceUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-zinc-900 hover:bg-zinc-800 text-white py-4 rounded-xl font-black transition-all shadow-lg active:scale-95">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Download Tax Invoice (PDF)
              </a>
            ) : (
              <div className="flex items-center justify-center gap-2 w-full bg-gray-200 text-gray-500 py-4 rounded-xl font-bold animate-pulse">
                Generating Invoice...
              </div>
            )}
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 w-full bg-green-50 border-2 border-green-200 hover:border-green-300 text-green-800 py-4 rounded-xl font-black transition-all active:scale-95">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
              Chat with Us on WhatsApp
            </a>
            <Link href="/" className="flex items-center justify-center gap-2 w-full bg-gray-50 border hover:bg-gray-100 text-gray-700 py-3 rounded-xl font-bold transition-all text-sm">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
