"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CCTVRequirement } from "@/types";
import { QuoteComparison } from "@/components/QuoteComparison";
import { CameraCustomizer } from "@/components/CameraCustomizer";
import { EditConfigurationDrawer } from "@/components/EditConfigurationDrawer";
import { Button } from "@/components/ui/button";
import { LeadGate } from "./LeadGate";
import { toast } from "sonner";



export function WizardClientV2() {
  const router = useRouter();
  const [sessionId] = useState(() => crypto.randomUUID());
  const [step, setStep] = useState(0);
  const [showLeadGate, setShowLeadGate] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
    
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
        toast.error("Error generating quote");
      }
    } catch (e: any) {
      console.error(e);
      toast.error("Error generating quote");
    }
    setLoading(false);
  };

  const handleFinishWizard = () => {
    setShowLeadGate(true);
  };



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

  const handleConfirmCustomizer = async (planType: string, modifiedPricingSnapshot?: any, updatedRequirement?: CCTVRequirement) => {
    const mobile = quoteResult.requirement.customer_mobile;
    const name = quoteResult.requirement.customer_name;
    
    if (!mobile) {
      toast.error("Mobile number is required.");
      return;
    }
    
    setLoading(true);
    try {
      const pricingToSave = modifiedPricingSnapshot || quoteResult.plans[planType];
      const reqToSave = updatedRequirement || quoteResult.requirement;
      const res = await fetch("/api/quote/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: leadId,
          customer_mobile: mobile,
          customer_name: name,
          requirementSnapshot: reqToSave,
          configurationSnapshot: quoteResult.configuration,
          pricingSnapshot: pricingToSave,
          selectedPlan: planType
        })
      });
      const data = await res.json();
      if (data.success) {
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

        // Redirect to unified rich quotation and comparison experience
        const targetId = data.leadId || data.quoteId;
        router.push(`/quote/${targetId}`);
        return;
      } else {
        toast.error(data.message || "Failed to save quote.");
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };







    if (customizerPlanId && quoteResult) {
    return (
      <CameraCustomizer
        basePlanId={customizerPlanId}
        basePlan={quoteResult.plans[customizerPlanId]}
        requirement={quoteResult.requirement}
        availableAddons={quoteResult.addons || []}
        storageDrives={quoteResult.storageDrives || []}
        onBack={() => setCustomizerPlanId(null)}
        onConfirm={(modifiedPlan, updatedReq) => handleConfirmCustomizer(customizerPlanId, modifiedPlan, updatedReq)}
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

      {/* OTP Lead Gate Modal */}
      {showLeadGate && (
        <LeadGate
          mode="partial"
          answersPayload={req}
          onSuccess={(newLeadId, verifiedMobile, verifiedName) => {
            setShowLeadGate(false);
            setLeadId(newLeadId);
            const updatedReq = {
              ...req,
              customer_mobile: verifiedMobile || req.customer_mobile || "",
              customer_name: verifiedName || req.customer_name || "",
            } as CCTVRequirement;
            setReq(updatedReq);
            generateQuote(updatedReq);
          }}
        />
      )}
    </div>
  );
}
