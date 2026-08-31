"use client";

import React, { useState, useEffect } from "react";
import { CCTVRequirement } from "@/types";
import { QuoteComparison } from "@/components/QuoteComparison";
import { EditConfigurationDrawer } from "@/components/EditConfigurationDrawer";
import { Button } from "@/components/ui/button";

export function WizardClientV2() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState(1);
  const totalSteps = 4;
  
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

  const handleSaveQuote = async (planType: string) => {
    const mobile = quoteResult.requirement.customer_mobile;
    const name = quoteResult.requirement.customer_name;
    
    if (!mobile) {
      alert("Mobile number is required. Please edit your configuration and provide it.");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/quote/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_mobile: mobile,
          customer_name: name,
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
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">Where do you need CCTV?</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { val: "Residential", label: "Home / Residential", desc: "House, Apartment, Villa" },
                { val: "Commercial", label: "Office / Shop", desc: "Retail, Workplace, Godown" },
                { val: "Industrial", label: "Factory / Warehouse", desc: "Large industrial premises" },
                { val: "Institutional", label: "School / Hospital", desc: "Campus, Clinics" },
                { val: "Outdoor", label: "Open Plot / Farm", desc: "Agriculture, Empty Land" }
              ].map((opt, i) => (
                <button key={i} onClick={() => updateReq({ property_type: opt.val as any })}
                  className="p-6 rounded-xl border-2 text-left hover:border-blue-500 hover:bg-blue-50 transition-all group">
                  <span className="block font-bold text-lg text-gray-900 group-hover:text-blue-700">{opt.label}</span>
                  <span className="block text-sm text-gray-500 mt-1">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">How many cameras total?</h2>
            <p className="text-gray-600 mb-6">Select the total number of cameras you need.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[2, 4, 6, 8, 12, 16, 24, 32].map(num => (
                <button key={num} onClick={() => updateReq({ camera_count: num })}
                  className="p-4 rounded-xl border-2 text-center text-xl font-bold hover:border-blue-500 hover:bg-blue-50 transition-all">
                  {num} Cameras
                </button>
              ))}
            </div>
          </div>
        );
      case 3:
        const totalCams = req.camera_count || 4;
        const currentOutdoor = req.outdoor_camera_count !== undefined ? req.outdoor_camera_count : Math.min(2, totalCams);
        const currentIndoor = Math.max(0, totalCams - currentOutdoor);

        return (
          <div className="space-y-6 animate-in fade-in">
            <div>
              <h2 className="text-3xl font-semibold mb-2">Camera Placement Split</h2>
              <p className="text-gray-600 text-sm">How many cameras will be installed Outdoors (weatherproof) vs Indoors (ceiling)?</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl border-2 border-gray-200 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-base text-gray-900">Outdoor Cameras</h3>
                    <p className="text-xs text-gray-500">Weatherproof Bullet</p>
                  </div>
                  <span className="text-2xl">???</span>
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="icon" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: Math.max(0, currentOutdoor - 1) }))} disabled={currentOutdoor === 0}>-</Button>
                  <span className="text-2xl font-bold w-12 text-center">{currentOutdoor}</span>
                  <Button variant="outline" size="icon" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: Math.min(totalCams, currentOutdoor + 1) }))} disabled={currentOutdoor === totalCams}>+</Button>
                </div>
              </div>

              <div className="p-5 rounded-2xl border-2 border-gray-200 bg-card">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-base text-gray-900">Indoor Cameras</h3>
                    <p className="text-xs text-gray-500">Ceiling Dome</p>
                  </div>
                  <span className="text-2xl">??</span>
                </div>
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="icon" disabled className="opacity-50">-</Button>
                  <span className="text-2xl font-bold w-12 text-center text-gray-400">{currentIndoor}</span>
                  <Button variant="outline" size="icon" disabled className="opacity-50">+</Button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={() => handleNext()} className="w-full h-12 text-sm font-semibold">
                Confirm Placement & Continue ?
              </Button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">Final Step: Get Your Quotation</h2>
            <p className="text-gray-600 mb-6">Please enter your details to view your personalized CCTV options instantly.</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Rahul Kumar" 
                  value={req.customer_name || ''} 
                  onChange={(e) => setReq(prev => ({ ...prev, customer_name: e.target.value }))} 
                  className="w-full p-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile Number *</label>
                <input 
                  type="tel" 
                  required
                  placeholder="10-digit mobile number" 
                  maxLength={10}
                  value={req.customer_mobile || ''} 
                  onChange={(e) => setReq(prev => ({ ...prev, customer_mobile: e.target.value.replace(/D/g, '') }))} 
                  className="w-full p-3.5 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>

            <Button 
              onClick={handleFinishWizard} 
              disabled={loading || !req.customer_name || !req.customer_mobile || req.customer_mobile.length < 10} 
              size="lg" 
              className="w-full text-lg h-14 mt-6"
            >
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
