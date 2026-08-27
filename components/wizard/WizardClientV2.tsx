"use client";

import React, { useState, useEffect } from "react";
import { CCTVRequirement } from "@/types";
import { QuoteComparison } from "@/components/QuoteComparison";
import { EditConfigurationDrawer } from "@/components/EditConfigurationDrawer";
import { Button } from "@/components/ui/button";

export function WizardClientV2() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState(1);
  const totalSteps = 10;
  
  useEffect(() => {
    // Send session start
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        source: "wizard",
        eventType: "SESSION_START",
        step: 1
      })
    }).catch(console.error);
  }, [sessionId]);

  useEffect(() => {
    if (step > 1) {
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          source: "wizard",
          eventType: "STEP_VIEWED",
          step
        })
      }).catch(console.error);
    }
  }, [step, sessionId]);

  const [req, setReq] = useState<Partial<CCTVRequirement>>({
    camera_count: 4,
    recording_days: 15,
    recording_mode: "continuous",
    technology_preference: "IP",
    wants_remote_viewing: true
  });
  
  const [loading, setLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState<any>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);

  const handleNext = () => setStep(s => Math.min(s + 1, totalSteps + 1));
  const handlePrev = () => setStep(s => Math.max(s - 1, 1));

  const generateQuote = async (finalReq: CCTVRequirement) => {
    setLoading(true);
    try {
      const res = await fetch("/api/quote/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalReq)
      });
      const data = await res.json();
      if (data.success) {
        setQuoteResult(data);
      } else {
        alert("Error generating quote");
      }
    } catch (e) {
      console.error(e);
      alert("Error generating quote");
    }
    setLoading(false);
  };

  const handleFinishWizard = () => {
    generateQuote(req as CCTVRequirement);
  };

  const [savedQuoteId, setSavedQuoteId] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleUpdateQuote = (newReq: CCTVRequirement) => {
    setReq(newReq);
    generateQuote(newReq);
    setIsEditDrawerOpen(false);
  };

  const updateReq = (updates: Partial<CCTVRequirement>) => {
    setReq(prev => ({ ...prev, ...updates }));
    handleNext();
  };

  const handleSaveQuote = async (planType: "budget" | "recommended" | "premium") => {
    const mobile = prompt("Please enter your mobile number to save and receive the quotation:");
    if (!mobile) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/quote/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_mobile: mobile,
          requirementSnapshot: quoteResult.requirement,
          configurationSnapshot: quoteResult.configuration,
          pricingSnapshot: quoteResult.plans[planType],
          selectedPlan: planType
        })
      });
      const data = await res.json();
      if (data.success) {
        setSavedQuoteId(data.quoteId);
        
        fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            source: "wizard",
            eventType: "QUOTE_GENERATED",
            metadata: { quoteId: data.quoteId }
          })
        }).catch(console.error);

        // Automatically generate PDF
        const pdfRes = await fetch(`/api/quote/${data.quoteId}/pdf`);
        const pdfData = await pdfRes.json();
        if (pdfData.success) {
          setPdfUrl(pdfData.url);
        }
      } else {
        alert("Failed to save quote.");
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleSendWhatsApp = async () => {
    if (!savedQuoteId || !pdfUrl) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/quote/${savedQuoteId}/whatsapp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfUrl })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.idempotent ? "WhatsApp already sent previously." : "WhatsApp sent successfully!");
      } else {
        alert("Failed to send WhatsApp.");
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  if (savedQuoteId) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          <h2 className="text-3xl font-bold mb-2">Your Quotation is Ready!</h2>
          <p className="text-gray-600 mb-8">Quote ID: {savedQuoteId}</p>

          <div className="space-y-4 max-w-sm mx-auto">
            {pdfUrl ? (
              <>
                <a href={pdfUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center w-full py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                  Download PDF
                </a>
                <button onClick={handleSendWhatsApp} disabled={loading} className="flex items-center justify-center w-full py-3 px-4 border border-green-600 rounded-full shadow-sm text-sm font-medium text-green-600 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 00-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                  {loading ? 'Sending...' : 'Send on WhatsApp'}
                </button>
              </>
            ) : (
              <div className="py-4 text-gray-500 animate-pulse">Generating your PDF...</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (quoteResult) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Your CCTV Options</h1>
          <p className="text-gray-600">Select the plan that best fits your needs, or edit the configuration to instantly update pricing.</p>
        </div>
        
        <QuoteComparison 
          plans={quoteResult.plans}
          requirement={quoteResult.requirement}
          onSelectPlan={handleSaveQuote}
          onEditConfiguration={() => setIsEditDrawerOpen(true)}
        />

        <EditConfigurationDrawer 
          isOpen={isEditDrawerOpen}
          onClose={() => setIsEditDrawerOpen(false)}
          currentRequirement={quoteResult.requirement}
          onUpdate={handleUpdateQuote}
          isUpdating={loading}
        />
      </div>
    );
  }

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">Where do you need CCTV?</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['Home', 'Shop', 'Office', 'Warehouse', 'School', 'Factory'].map(opt => (
                <button key={opt} onClick={() => updateReq({ property_type: opt.toLowerCase() as any })}
                  className="p-6 rounded-xl border-2 text-center hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <span className="block font-bold text-lg">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">How many cameras do you need?</h2>
            <p className="text-gray-600">Estimate the count. You can adjust this later.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[2, 4, 6, 8, 12, 16].map(num => (
                <button key={num} onClick={() => updateReq({ camera_count: num })}
                  className={`p-6 rounded-xl border-2 text-center hover:border-blue-500 transition-all ${req.camera_count === num ? 'border-blue-600 bg-blue-50 text-blue-700' : ''}`}>
                  <span className="text-2xl font-bold">{num}</span>
                  <span className="block text-sm">Cameras</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">Indoor or Outdoor?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Mostly Indoor', 'Mostly Outdoor', 'Both'].map(opt => (
                <button key={opt} onClick={() => handleNext()}
                  className="p-6 rounded-xl border-2 text-center hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <span className="block font-bold text-lg">{opt}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">Camera Quality?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { val: "HD", label: "Basic (2MP)", desc: "Good for general monitoring" },
                { val: "IP", label: "Recommended (5MP)", desc: "Better detail & identification" },
                { val: "IP", label: "Premium (8MP)", desc: "Maximum detail" }
              ].map((opt, i) => (
                <button key={i} onClick={() => updateReq({ technology_preference: opt.val as any })}
                  className="p-6 rounded-xl border-2 text-left hover:border-blue-500 hover:bg-blue-50 transition-all">
                  <span className="block font-bold text-lg">{opt.label}</span>
                  <span className="block text-sm text-gray-500 mt-2">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 5:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">Night Vision?</h2>
            <div className="grid grid-cols-1 gap-4">
              {['Basic (Clear B&W)', 'Better (Improved low-light)', 'Colour Night Vision'].map(opt => (
                <button key={opt} onClick={() => handleNext()}
                  className="p-4 rounded-xl border-2 text-left hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold">
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 6:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">Do you need sound?</h2>
            <div className="grid grid-cols-1 gap-4">
              {['No Audio', 'I want to hear (Built-in Mic)', 'I want to hear + talk (Two-way audio)'].map(opt => (
                <button key={opt} onClick={() => handleNext()}
                  className="p-4 rounded-xl border-2 text-left hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold">
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 7:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">How long should recordings be kept?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { val: 0, label: "Live View Only", desc: "No recording" },
                { val: 7, label: "7 Days", desc: "Standard for homes" },
                { val: 15, label: "15 Days", desc: "Recommended for businesses" },
                { val: 30, label: "30 Days", desc: "Maximum security compliance" }
              ].map(opt => (
                <button key={opt.val} onClick={() => updateReq({ recording_days: opt.val, recording_mode: opt.val === 0 ? "live_only" : "continuous" })}
                  className={`p-6 rounded-xl border-2 text-left hover:border-blue-500 transition-all ${req.recording_days === opt.val ? 'border-blue-600 bg-blue-50' : ''}`}>
                  <span className="block font-bold text-lg">{opt.label}</span>
                  <span className="block text-sm text-gray-500 mt-2">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 8:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">Where do you want to watch?</h2>
            <div className="grid grid-cols-1 gap-4">
              {[
                { val: true, label: "Mobile Phone (Internet Required)" },
                { val: false, label: "TV / Monitor Only" }
              ].map((opt, i) => (
                <button key={i} onClick={() => updateReq({ wants_remote_viewing: opt.val })}
                  className="p-4 rounded-xl border-2 text-left hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold">
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        );
      case 9:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">Existing Infrastructure?</h2>
            <div className="grid grid-cols-1 gap-4">
              {['No, New Installation', 'I have cameras', 'I have a DVR/NVR', 'I have wiring'].map(opt => (
                <button key={opt} onClick={() => handleNext()}
                  className="p-4 rounded-xl border-2 text-left hover:border-blue-500 hover:bg-blue-50 transition-all font-semibold">
                  {opt}
                </button>
              ))}
            </div>
          </div>
        );
      case 10:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">Almost Done!</h2>
            <p className="text-gray-600 mb-6">We have gathered your requirements. Click below to generate your personalized CCTV options.</p>
            <Button onClick={handleFinishWizard} disabled={loading} size="lg" className="w-full text-lg h-14">
              {loading ? "Analyzing Requirement..." : "View My CCTV Options"}
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <div className="mb-8">
          <div className="h-2 bg-gray-100 rounded-full w-full">
            <div className="h-2 bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
          </div>
          <p className="text-sm text-gray-500 mt-2 text-right">Step {step} of {totalSteps}</p>
        </div>

        {renderStep()}

        <div className="mt-12 flex justify-between">
          <Button variant="outline" onClick={handlePrev} disabled={step === 1 || loading}>
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
