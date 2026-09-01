"use client";

import React, { useState, useEffect } from "react";
import { CCTVRequirement } from "@/types";
import { QuoteComparison } from "@/components/QuoteComparison";
import { CameraCustomizer } from "@/components/CameraCustomizer";
import { EditConfigurationDrawer } from "@/components/EditConfigurationDrawer";
import { Button } from "@/components/ui/button";

const formatPrice = (p: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p || 0);

export function WizardClientV2() {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState(0);
    
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
    installation_type: "new",
    camera_count: 4,
    recording_days: 7,
    recording_mode: "motion",
    technology_preference: "IP",
    wants_remote_viewing: true
  });
  
  const [loading, setLoading] = useState(false);
  const [quoteResult, setQuoteResult] = useState<any>(null);
  const totalSteps = req.installation_type === "new" ? 4 : 5;
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [customizerPlanId, setCustomizerPlanId] = useState<string | null>(null);

  const handleNext = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (req.installation_type === "new" && step === 3) {
      setStep(5);
    } else {
      setStep(s => Math.min(s + 1, 5));
    }
  };
  const handlePrev = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (req.installation_type === "new" && step === 5) {
      setStep(3);
    } else {
      setStep(s => Math.max(s - 1, 1));
    }
  };

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
  const [finalPlan, setFinalPlan] = useState<any>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleUpdateQuote = (newReq: CCTVRequirement) => {
    setReq(newReq);
    generateQuote(newReq);
    setIsEditDrawerOpen(false);
  };

  const updateReq = (updates: Partial<CCTVRequirement>) => {
    setReq(prev => ({ ...prev, ...updates }));
  };

  
  const handleSelectBasePlan = (planId: string) => {
    setCustomizerPlanId(planId);
  };

  const handleConfirmCustomizer = async (planType: string, modifiedPricingSnapshot?: any) => {
    const mobile = quoteResult.requirement.customer_mobile;
    const name = quoteResult.requirement.customer_name;
    
    if (!mobile) {
      alert("Mobile number is required.");
      return;
    }
    
    setLoading(true);
    try {
      const pricingToSave = modifiedPricingSnapshot || quoteResult.plans[planType];
        setFinalPlan(pricingToSave);
      const res = await fetch("/api/quote/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_mobile: mobile,
          customer_name: name,
          requirementSnapshot: quoteResult.requirement,
          configurationSnapshot: quoteResult.configuration,
          pricingSnapshot: pricingToSave,
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

  const handleSendWhatsApp = () => {
    if (!savedQuoteId) return;
    const salesNumber = "919772699395";
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cctvquotation.com';
    const pdfLink = `${baseUrl}/api/quote/${savedQuoteId}/download`;
    const message = `Hi team! ??\n\nI just generated a CCTV Quotation on your website.\n*Quote ID:* ${savedQuoteId}\n\nHere is my PDF link:\n${pdfLink}\n\nPlease review it and let me know the next steps.`;
    const whatsappUrl = `https://wa.me/${salesNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (savedQuoteId) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
        <div className="bg-white rounded-2xl shadow-sm border p-8 text-center">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          </div>
          
          <h2 className="text-3xl font-bold mb-2">Your Quotation is Ready!</h2>
          <p className="text-gray-600 mb-6">Quote ID: {savedQuoteId}</p>

          {finalPlan && (
            <div className="bg-gray-50 border rounded-xl p-6 text-left mb-8 max-w-lg mx-auto shadow-sm">
              <h3 className="font-bold text-lg border-b pb-3 mb-4 text-gray-800">Final System Configuration</h3>
              <ul className="space-y-3 text-sm">
                {finalPlan.items.map((item: any, index: number) => (
                  <li key={index} className="flex justify-between items-start mb-2 pb-2 border-b border-gray-100 last:border-0">
                    <span className="text-gray-700 pr-4">
                      {item.display_name} <span className="text-gray-400 text-xs ml-1">x{item.qty}</span>
                    </span>
                    <span className="font-medium text-gray-900 whitespace-nowrap">{formatPrice(item.line_total)}</span>
                  </li>
                ))}
                <li className="flex justify-between border-t pt-3 mt-3">
                  <span className="text-gray-600">GST (18%)</span>
                  <span className="font-semibold text-gray-900">{formatPrice(finalPlan.gst_amount)}</span>
                </li>
                <li className="flex justify-between border-t pt-3 mt-3 text-lg">
                  <span className="font-bold text-gray-900">Total Quotation</span>
                  <span className="font-bold text-primary">{formatPrice(finalPlan.total_payable)}</span>
                </li>
              </ul>
            </div>
          )}

          <div className="space-y-4 max-w-sm mx-auto">

            <Button variant="outline" onClick={() => { setSavedQuoteId(null); setFinalPlan(null); setCustomizerPlanId(null); setStep(1); }} className="w-full">
              Modify My Setup
            </Button>
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

  if (customizerPlanId && quoteResult) {
    return (
      <CameraCustomizer
        basePlanId={customizerPlanId}
        basePlan={quoteResult.plans[customizerPlanId]}
        requirement={quoteResult.requirement}
        availableAddons={quoteResult.addons || []}
        storageDrives={quoteResult.storageDrives || []}
        onBack={() => setCustomizerPlanId(null)}
        onConfirm={(modifiedPlan) => handleConfirmCustomizer(customizerPlanId, modifiedPlan)}
        isSaving={loading}
      />
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
            onSelectPlan={handleSelectBasePlan}
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
      case 0:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2 text-center text-slate-900">How would you like to build your quote?</h2>
            <p className="text-center text-slate-500 mb-8 max-w-lg mx-auto">Choose between our easy guided setup or our advanced professional builder for custom configurations.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => setStep(1)}
                className="p-8 rounded-2xl border-2 text-left hover:border-blue-500 transition-all group bg-blue-50/50 border-blue-100 shadow-sm hover:shadow-md">
                <span className="block font-black text-xl text-blue-900 group-hover:text-blue-700 mb-2">? Guided Setup (Recommended)</span>
                <span className="block text-sm text-blue-700/80 font-medium leading-relaxed">Answer a few simple questions about your property, and our AI will calculate the perfect, most compatible CCTV package for you instantly.</span>
              </button>
              
              <button onClick={() => window.location.href = '/pro-builder'}
                className="p-8 rounded-2xl border-2 text-left hover:border-zinc-900 transition-all group bg-white border-zinc-200 shadow-sm hover:shadow-md">
                <span className="block font-black text-xl text-zinc-900 group-hover:text-black mb-2">?? Custom Build (Advanced)</span>
                <span className="block text-sm text-zinc-500 font-medium leading-relaxed">I already know exactly what cameras and technical specifications I need. Let me build my own custom package from the catalog.</span>
              </button>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">What kind of installation do you need?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => { updateReq({ installation_type: "new", property_type: "Residential" }); handleNext(); }}
                className={`p-6 rounded-xl border-2 text-left hover:border-blue-500 transition-all group ${req.installation_type === "new" ? "border-blue-500 bg-blue-50" : "bg-white"}`}>
                <span className="block font-bold text-lg text-gray-900 group-hover:text-blue-700">Completely New System</span>
                <span className="block text-sm text-gray-500 mt-1">I don't have any CCTV cameras installed right now.</span>
              </button>
              <button onClick={() => { updateReq({ installation_type: "addon", existing_system_known: undefined }); }}
                className={`p-6 rounded-xl border-2 text-left hover:border-blue-500 transition-all group ${req.installation_type === "addon" ? "border-blue-500 bg-blue-50" : "bg-white"}`}>
                <span className="block font-bold text-lg text-gray-900 group-hover:text-blue-700">Add to Existing System</span>
                <span className="block text-sm text-gray-500 mt-1">I already have a CCTV system and want to add more cameras.</span>
              </button>
            </div>
            
            {req.installation_type === "addon" && (
              <div className="mt-8 p-6 bg-yellow-50 rounded-xl border border-yellow-200 animate-in fade-in">
                <h3 className="font-semibold text-lg text-yellow-900 mb-4">Do you know the technical specifications of your existing system?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button onClick={() => handleNext()}
                    className="p-4 rounded-xl border border-yellow-300 bg-white hover:bg-yellow-100 text-left transition-all">
                    <span className="block font-bold text-gray-900">Yes, I know</span>
                    <span className="block text-xs text-gray-500 mt-1">I know my DVR channels and technology.</span>
                  </button>
                  <button onClick={() => updateReq({ existing_system_known: false })}
                    className="p-4 rounded-xl border border-yellow-300 bg-white hover:bg-yellow-100 text-left transition-all">
                    <span className="block font-bold text-gray-900">No, I don't know</span>
                    <span className="block text-xs text-gray-500 mt-1">Help me check compatibility.</span>
                  </button>
                </div>
              </div>
            )}
            
            {req.installation_type === "addon" && req.existing_system_known === false && (
              <div className="mt-6 p-6 border rounded-xl bg-white shadow-sm animate-in fade-in">
                <h3 className="font-bold text-xl mb-2 text-blue-900">We need to check your system's compatibility!</h3>
                <p className="text-gray-600 mb-4">Since you already have a system, our engineer needs to check your existing DVR compatibility before adding new cameras.</p>
                <div className="space-y-4 mb-4">
                  <input type="text" placeholder="Your Name" value={req.customer_name || ''} onChange={(e) => setReq(prev => ({ ...prev, customer_name: e.target.value }))} className="w-full p-3 border rounded-xl" />
                  <input type="tel" placeholder="Mobile Number" value={req.customer_mobile || ''} onChange={(e) => setReq(prev => ({ ...prev, customer_mobile: e.target.value.replace(/\D/g, '') }))} className="w-full p-3 border rounded-xl" maxLength={10} />
                </div>
                <Button onClick={handleFinishWizard} disabled={loading || !req.customer_name || !req.customer_mobile || req.customer_mobile.length < 10} className="w-full h-12">
                  Request a Free Callback
                </Button>
              </div>
            )}
            
            
          </div>
        );
      case 2:
        if (req.installation_type === "addon") {
           return (
             <div className="space-y-6 animate-in fade-in">
               <h2 className="text-3xl font-semibold mb-2">Existing System Details</h2>
               <p className="text-gray-600 mb-6">Tell us about your current recorder so we can calculate compatibility.</p>
               
               <h3 className="font-semibold text-lg">1. Technology</h3>
               <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setReq(prev => ({ ...prev, existing_technology: "HD" }))} className={`p-4 rounded-xl border-2 text-center font-bold ${req.existing_technology === 'HD' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white'}`}>Analog HD (BNC Wire)</button>
                  <button onClick={() => setReq(prev => ({ ...prev, existing_technology: "IP" }))} className={`p-4 rounded-xl border-2 text-center font-bold ${req.existing_technology === 'IP' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white'}`}>IP / Network (CAT6 Wire)</button>
               </div>
               
               <h3 className="font-semibold text-lg mt-6">2. Existing Recorder Channels</h3>
               <div className="grid grid-cols-4 gap-2">
                  {[4, 8, 16, 32].map(ch => (
                    <button key={ch} onClick={() => setReq(prev => ({ ...prev, existing_recorder_channels: ch }))} className={`p-4 rounded-xl border-2 text-center font-bold ${req.existing_recorder_channels === ch ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white hover:border-blue-300'}`}>{ch} Ch</button>
                  ))}
               </div>
               
               <h3 className="font-semibold text-lg mt-6">3. Currently Working Cameras</h3>
               <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" onClick={() => setReq(prev => ({ ...prev, existing_working_cameras: Math.max(0, (prev.existing_working_cameras || 0) - 1) }))}>-</Button>
                  <span className="text-2xl font-bold w-12 text-center">{req.existing_working_cameras || 0}</span>
                  <Button variant="outline" size="icon" onClick={() => setReq(prev => ({ ...prev, existing_working_cameras: (prev.existing_working_cameras || 0) + 1 }))}>+</Button>
               </div>
               
               <div className="pt-6">
                 <Button onClick={handleNext} disabled={!req.existing_technology || !req.existing_recorder_channels} className="w-full h-12">Next Step</Button>
               </div>
             </div>
           );
        } else {
           const currentOutdoor = req.outdoor_camera_count !== undefined ? req.outdoor_camera_count : 2;
           const currentIndoor = req.indoor_camera_count !== undefined ? req.indoor_camera_count : 2;
           const totalCams = currentOutdoor + currentIndoor;

           return (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-3xl font-semibold mb-2">How many cameras do you need?</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="p-5 rounded-2xl border-2 border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Outdoor Cameras</h3>
                      <p className="text-xs text-gray-500">Weatherproof Bullet</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border">
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-2 hover:bg-gray-100" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: Math.max(0, currentOutdoor - 1), camera_count: Math.max(0, currentOutdoor - 1) + currentIndoor }))} disabled={currentOutdoor === 0}>-</Button>
                    <span className="text-2xl font-bold w-12 text-center text-blue-800">{currentOutdoor}</span>
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-2 hover:bg-blue-50" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: currentOutdoor + 1, camera_count: currentOutdoor + 1 + currentIndoor }))}>+</Button>
                  </div>
                </div>
  
                <div className="p-5 rounded-2xl border-2 border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Indoor Cameras</h3>
                      <p className="text-xs text-gray-500">Ceiling Dome</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border">
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-2 hover:bg-gray-100" onClick={() => setReq(prev => ({ ...prev, indoor_camera_count: Math.max(0, currentIndoor - 1), camera_count: currentOutdoor + Math.max(0, currentIndoor - 1) }))} disabled={currentIndoor === 0}>-</Button>
                    <span className="text-2xl font-bold w-12 text-center text-blue-800">{currentIndoor}</span>
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-2 hover:bg-blue-50" onClick={() => setReq(prev => ({ ...prev, indoor_camera_count: currentIndoor + 1, camera_count: currentOutdoor + currentIndoor + 1 }))}>+</Button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center border border-blue-100">
                <span className="font-semibold text-blue-900">Total Cameras:</span>
                <span className="text-2xl font-black text-blue-700">{totalCams}</span>
              </div>
  
              <div className="pt-2">
                <Button onClick={handleNext} disabled={totalCams === 0} className="w-full h-12 text-sm font-semibold">Confirm Cameras</Button>
              </div>
            </div>
          );
        }
      case 3:
        if (req.installation_type === "addon") {
           const currentOutdoor = req.outdoor_camera_count || 0;
           const currentIndoor = req.indoor_camera_count || 0;
           const newTotal = currentOutdoor + currentIndoor;
           const existingTotal = req.existing_working_cameras || 0;
           const combinedTotal = newTotal + existingTotal;
           const maxChannels = req.existing_recorder_channels || 4;
           
           const needsNewRecorder = combinedTotal > maxChannels;

           return (
             <div className="space-y-6 animate-in fade-in">
               <h2 className="text-3xl font-semibold mb-2">Add New Cameras</h2>
               <p className="text-gray-600 mb-6">Select how many cameras you want to add.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div className="p-4 rounded-xl border-2 bg-white">
                   <h3 className="font-bold mb-3">New Outdoor</h3>
                   <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border">
                     <Button variant="outline" size="icon" className="bg-white border-2" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: Math.max(0, currentOutdoor - 1), camera_count: Math.max(0, currentOutdoor - 1) + currentIndoor }))}>-</Button>
                     <span className="text-2xl font-bold w-12 text-center text-blue-800">{currentOutdoor}</span>
                     <Button variant="outline" size="icon" className="bg-white border-2 hover:bg-blue-50" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: currentOutdoor + 1, camera_count: currentOutdoor + 1 + currentIndoor }))}>+</Button>
                   </div>
                 </div>
                 <div className="p-4 rounded-xl border-2 bg-white">
                   <h3 className="font-bold mb-3">New Indoor</h3>
                   <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border">
                     <Button variant="outline" size="icon" className="bg-white border-2" onClick={() => setReq(prev => ({ ...prev, indoor_camera_count: Math.max(0, currentIndoor - 1), camera_count: currentOutdoor + Math.max(0, currentIndoor - 1) }))}>-</Button>
                     <span className="text-2xl font-bold w-12 text-center text-blue-800">{currentIndoor}</span>
                     <Button variant="outline" size="icon" className="bg-white border-2 hover:bg-blue-50" onClick={() => setReq(prev => ({ ...prev, indoor_camera_count: currentIndoor + 1, camera_count: currentOutdoor + currentIndoor + 1 }))}>+</Button>
                   </div>
                 </div>
               </div>
               
               {newTotal > 0 && (
                 <div className={`p-4 rounded-xl border ${needsNewRecorder ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                   {needsNewRecorder ? (
                     <>
                       <h4 className="font-bold text-red-800 mb-1">Recorder Upgrade Required</h4>
                       <p className="text-sm text-red-700">Your total active cameras ({combinedTotal}) exceed your {maxChannels}-channel DVR limit. We will automatically quote a new upgraded DVR.</p>
                     </>
                   ) : (
                     <>
                       <h4 className="font-bold text-green-800 mb-1">DVR Compatible!</h4>
                       <p className="text-sm text-green-700">Your total active cameras ({combinedTotal}) fit perfectly within your {maxChannels}-channel DVR limit. You save money!</p>
                     </>
                   )}
                 </div>
               )}
               
               <div className="pt-4">
                 <Button onClick={handleNext} disabled={newTotal === 0} className="w-full h-12">Next Step</Button>
               </div>
             </div>
           );
        } else {
           return (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-3xl font-semibold mb-2">Recording & Storage Backup</h2>
              <p className="text-gray-600 mb-6">How long do you want to keep the CCTV recordings?</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {[0, 7, 15, 30, 45, 60].map(days => (
                  <button key={days} onClick={() => setReq(prev => ({ ...prev, recording_days: days }))}
                    className={`p-4 rounded-xl border-2 text-center text-xl font-bold transition-all ${req.recording_days === days ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:border-blue-300 hover:bg-gray-50 text-gray-700'}`}>
                    {days === 0 ? "No Recording" : `${days} Days`}
                  </button>
                ))}
              </div>

              <h3 className="text-xl font-semibold mb-3">Recording Mode</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setReq(prev => ({ ...prev, recording_mode: "continuous" }))}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${req.recording_mode === 'continuous' ? 'border-blue-600 bg-blue-50' : 'hover:border-gray-300'}`}>
                  <span className="block font-bold text-gray-900 text-lg">24x7 Continuous</span>
                  <span className="block text-sm text-gray-500 mt-1">Records everything non-stop. Requires standard hard disk capacity.</span>
                </button>
                <button onClick={() => setReq(prev => ({ ...prev, recording_mode: "motion" }))}
                  className={`p-5 rounded-xl border-2 text-left transition-all ${req.recording_mode === 'motion' ? 'border-green-500 bg-green-50 shadow-sm' : 'hover:border-gray-300'}`}>
                  <span className="block font-bold text-gray-900 text-lg flex items-center">Smart Motion</span>
                  <span className="block text-sm text-gray-500 mt-1">Records only when movement is detected. <strong className="text-green-700">Saves up to 50% hard disk cost!</strong></span>
                </button>
              </div>
              
              <div className="pt-6">
                <Button onClick={handleNext} className="w-full h-12 text-lg font-semibold">
                  Confirm Recording
                </Button>
              </div>
            </div>
          );
        }
      case 4:
        if (req.installation_type === "addon") {
           return (
             <div className="space-y-6 animate-in fade-in">
               <h2 className="text-3xl font-semibold mb-2">Storage Update</h2>
               <p className="text-gray-600 mb-6">Adding new cameras will reduce how many days your existing Hard Disk can store recordings.</p>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 <button onClick={() => setReq(prev => ({ ...prev, retain_existing_storage: true, recording_days: 7 }))} className={`p-5 rounded-xl border-2 text-left ${req.retain_existing_storage ? 'border-blue-600 bg-blue-50' : 'bg-white hover:border-blue-300'}`}>
                   <span className="block font-bold text-lg text-gray-900">Keep Existing Hard Disk</span>
                   <span className="block text-sm text-gray-500 mt-1">Don't buy a new one. (Saves money)</span>
                 </button>
                 <button onClick={() => setReq(prev => ({ ...prev, retain_existing_storage: false }))} className={`p-5 rounded-xl border-2 text-left ${!req.retain_existing_storage ? 'border-blue-600 bg-blue-50' : 'bg-white hover:border-blue-300'}`}>
                   <span className="block font-bold text-lg text-gray-900">Buy New Hard Disk</span>
                   <span className="block text-sm text-gray-500 mt-1">Upgrade storage capacity.</span>
                 </button>
               </div>
               
               {!req.retain_existing_storage && (
                 <div className="animate-in fade-in bg-gray-50 p-6 rounded-xl border">
                   <h3 className="font-semibold mb-4 text-gray-900">Target Recording Days</h3>
                   <div className="grid grid-cols-3 gap-3 mb-4">
                     {[7, 15, 30].map(days => (
                       <button key={days} onClick={() => setReq(prev => ({ ...prev, recording_days: days }))} className={`p-3 rounded-xl border-2 text-center font-bold ${req.recording_days === days ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white hover:border-blue-300'}`}>{days} Days</button>
                     ))}
                   </div>
                   <h3 className="font-semibold mb-3 text-gray-900 mt-4">Recording Mode</h3>
                   <div className="grid grid-cols-2 gap-4">
                     <button onClick={() => setReq(prev => ({ ...prev, recording_mode: "continuous" }))} className={`p-3 rounded-xl border-2 ${req.recording_mode === 'continuous' ? 'border-blue-600 bg-blue-50' : 'bg-white'}`}>24x7 Continuous</button>
                     <button onClick={() => setReq(prev => ({ ...prev, recording_mode: "motion" }))} className={`p-3 rounded-xl border-2 ${req.recording_mode === 'motion' ? 'border-green-500 bg-green-50' : 'bg-white'}`}>Smart Motion</button>
                   </div>
                 </div>
               )}
               
               <div className="pt-6">
                 <Button onClick={handleNext} className="w-full h-12">Confirm & Proceed</Button>
               </div>
             </div>
           );
        } else {
            return null;
        }
      case 5:
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
        {step > 0 && (
          <div className="mb-8">
            <div className="h-2 bg-gray-100 rounded-full w-full overflow-hidden">
              <div className="h-2 bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${(Math.min((req.installation_type === "new" && step === 5 ? 4 : step), totalSteps) / totalSteps) * 100}%` }}></div>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-right">Step {req.installation_type === "new" && step === 5 ? 4 : step} of {totalSteps}</p>
          </div>
        )}

        {renderStep()}

        {step > 0 && (
          <div className="mt-12 flex justify-between">
            <Button variant="outline" onClick={handlePrev} disabled={step <= 1 || loading}>
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
