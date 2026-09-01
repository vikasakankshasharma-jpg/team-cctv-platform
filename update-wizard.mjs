import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

const oldRenderStep = content.substring(
  content.indexOf("const renderStep = () => {"),
  content.indexOf("return (", content.indexOf("const renderStep = () => {"))
);

const newRenderStep = `const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">What kind of installation do you need?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => updateReq({ installation_type: "new", property_type: "Residential" })}
                className="p-6 rounded-xl border-2 text-left hover:border-blue-500 hover:bg-blue-50 transition-all group">
                <span className="block font-bold text-lg text-gray-900 group-hover:text-blue-700">Completely New System</span>
                <span className="block text-sm text-gray-500 mt-1">I don't have any CCTV cameras installed right now.</span>
              </button>
              <button onClick={() => updateReq({ installation_type: "addon", existing_system_known: undefined })}
                className="p-6 rounded-xl border-2 text-left hover:border-blue-500 hover:bg-blue-50 transition-all group">
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
                  <input type="tel" placeholder="Mobile Number" value={req.customer_mobile || ''} onChange={(e) => setReq(prev => ({ ...prev, customer_mobile: e.target.value.replace(/\\D/g, '') }))} className="w-full p-3 border rounded-xl" maxLength={10} />
                </div>
                <Button onClick={handleFinishWizard} disabled={loading || !req.customer_name || !req.customer_mobile || req.customer_mobile.length < 10} className="w-full">
                  Request a Free Callback
                </Button>
              </div>
            )}
            
            {req.installation_type === "new" && (
              <div className="mt-8">
                 <h3 className="text-xl font-semibold mb-4">Where do you need the CCTV?</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { val: "Residential", label: "Home / Residential", desc: "House, Apartment, Villa" },
                      { val: "Commercial", label: "Office / Shop", desc: "Retail, Workplace, Godown" },
                      { val: "Industrial", label: "Factory / Warehouse", desc: "Large industrial premises" },
                      { val: "Institutional", label: "School / Hospital", desc: "Campus, Clinics" }
                    ].map((opt, i) => (
                      <button key={i} onClick={() => { updateReq({ property_type: opt.val as any }); handleNext(); }}
                        className={\`p-4 rounded-xl border-2 text-left hover:border-blue-500 transition-all \${req.property_type === opt.val ? 'border-blue-500 bg-blue-50' : 'bg-white'}\`}>
                        <span className="block font-bold text-gray-900">{opt.label}</span>
                      </button>
                    ))}
                 </div>
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
                  <button onClick={() => setReq(prev => ({ ...prev, existing_technology: "HD" }))} className={\`p-4 rounded-xl border-2 text-center \${req.existing_technology === 'HD' ? 'border-blue-600 bg-blue-50' : 'bg-white'}\`}>Analog HD (BNC Wire)</button>
                  <button onClick={() => setReq(prev => ({ ...prev, existing_technology: "IP" }))} className={\`p-4 rounded-xl border-2 text-center \${req.existing_technology === 'IP' ? 'border-blue-600 bg-blue-50' : 'bg-white'}\`}>IP / Network (CAT6 Wire)</button>
               </div>
               
               <h3 className="font-semibold text-lg mt-6">2. Existing Recorder Channels</h3>
               <div className="grid grid-cols-4 gap-2">
                  {[4, 8, 16, 32].map(ch => (
                    <button key={ch} onClick={() => setReq(prev => ({ ...prev, existing_recorder_channels: ch }))} className={\`p-4 rounded-xl border-2 text-center font-bold \${req.existing_recorder_channels === ch ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white'}\`}>{ch} Ch</button>
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
           // New System Camera Count
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
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-2" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: Math.max(0, currentOutdoor - 1), camera_count: Math.max(0, currentOutdoor - 1) + currentIndoor }))} disabled={currentOutdoor === 0}>-</Button>
                    <span className="text-2xl font-bold w-12 text-center text-blue-800">{currentOutdoor}</span>
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-2" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: currentOutdoor + 1, camera_count: currentOutdoor + 1 + currentIndoor }))}>+</Button>
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
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-2" onClick={() => setReq(prev => ({ ...prev, indoor_camera_count: Math.max(0, currentIndoor - 1), camera_count: currentOutdoor + Math.max(0, currentIndoor - 1) }))} disabled={currentIndoor === 0}>-</Button>
                    <span className="text-2xl font-bold w-12 text-center text-blue-800">{currentIndoor}</span>
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-2" onClick={() => setReq(prev => ({ ...prev, indoor_camera_count: currentIndoor + 1, camera_count: currentOutdoor + currentIndoor + 1 }))}>+</Button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center border border-blue-100">
                <span className="font-semibold text-blue-900">Total Cameras:</span>
                <span className="text-2xl font-black text-blue-700">{totalCams}</span>
              </div>
  
              <div className="pt-2">
                <Button onClick={() => handleNext()} disabled={totalCams === 0} className="w-full h-12">Confirm Cameras</Button>
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
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                 <div className="p-4 rounded-xl border-2 bg-white">
                   <h3 className="font-bold mb-3">New Outdoor</h3>
                   <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border">
                     <Button variant="outline" size="icon" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: Math.max(0, currentOutdoor - 1), camera_count: Math.max(0, currentOutdoor - 1) + currentIndoor }))}>-</Button>
                     <span className="text-2xl font-bold w-12 text-center">{currentOutdoor}</span>
                     <Button variant="outline" size="icon" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: currentOutdoor + 1, camera_count: currentOutdoor + 1 + currentIndoor }))}>+</Button>
                   </div>
                 </div>
                 <div className="p-4 rounded-xl border-2 bg-white">
                   <h3 className="font-bold mb-3">New Indoor</h3>
                   <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border">
                     <Button variant="outline" size="icon" onClick={() => setReq(prev => ({ ...prev, indoor_camera_count: Math.max(0, currentIndoor - 1), camera_count: currentOutdoor + Math.max(0, currentIndoor - 1) }))}>-</Button>
                     <span className="text-2xl font-bold w-12 text-center">{currentIndoor}</span>
                     <Button variant="outline" size="icon" onClick={() => setReq(prev => ({ ...prev, indoor_camera_count: currentIndoor + 1, camera_count: currentOutdoor + currentIndoor + 1 }))}>+</Button>
                   </div>
                 </div>
               </div>
               
               {newTotal > 0 && (
                 <div className={\`p-4 rounded-xl border \${needsNewRecorder ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}\`}>
                   {needsNewRecorder ? (
                     <>
                       <h4 className="font-bold text-red-800">Recorder Upgrade Required</h4>
                       <p className="text-sm text-red-700">Your total active cameras ({combinedTotal}) exceed your {maxChannels}-channel DVR limit. We will automatically quote a new upgraded DVR.</p>
                     </>
                   ) : (
                     <>
                       <h4 className="font-bold text-green-800">DVR Compatible!</h4>
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
           // New System Recording
           return (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-3xl font-semibold mb-2">Recording & Storage Backup</h2>
              <p className="text-gray-600 mb-6">How long do you want to keep the CCTV recordings?</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                {[0, 7, 15, 30, 45, 60].map(days => (
                  <button key={days} onClick={() => setReq(prev => ({ ...prev, recording_days: days }))}
                    className={\`p-4 rounded-xl border-2 text-center text-xl font-bold \${req.recording_days === days ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white'}\`}>
                    {days === 0 ? "No Recording" : \`\${days} Days\`}
                  </button>
                ))}
              </div>
              <h3 className="text-xl font-semibold mb-3">Recording Mode</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setReq(prev => ({ ...prev, recording_mode: "continuous" }))} className={\`p-5 rounded-xl border-2 \${req.recording_mode === 'continuous' ? 'border-blue-600 bg-blue-50' : 'bg-white'}\`}>24x7 Continuous</button>
                <button onClick={() => setReq(prev => ({ ...prev, recording_mode: "motion" }))} className={\`p-5 rounded-xl border-2 \${req.recording_mode === 'motion' ? 'border-green-500 bg-green-50' : 'bg-white'}\`}>Smart Motion</button>
              </div>
              <div className="pt-6">
                <Button onClick={handleNext} className="w-full h-12">Confirm Recording</Button>
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
                 <button onClick={() => setReq(prev => ({ ...prev, retain_existing_storage: true, recording_days: 7 }))} className={\`p-5 rounded-xl border-2 \${req.retain_existing_storage ? 'border-blue-600 bg-blue-50' : 'bg-white'}\`}>
                   <span className="block font-bold">Keep Existing Hard Disk</span>
                   <span className="block text-sm text-gray-500 mt-1">Don't buy a new one. (Saves money)</span>
                 </button>
                 <button onClick={() => setReq(prev => ({ ...prev, retain_existing_storage: false }))} className={\`p-5 rounded-xl border-2 \${!req.retain_existing_storage ? 'border-blue-600 bg-blue-50' : 'bg-white'}\`}>
                   <span className="block font-bold">Buy New Hard Disk</span>
                   <span className="block text-sm text-gray-500 mt-1">Upgrade storage capacity.</span>
                 </button>
               </div>
               
               {!req.retain_existing_storage && (
                 <div className="animate-in fade-in">
                   <h3 className="font-semibold mb-3">Target Recording Days</h3>
                   <div className="grid grid-cols-3 gap-3">
                     {[7, 15, 30].map(days => (
                       <button key={days} onClick={() => setReq(prev => ({ ...prev, recording_days: days }))} className={\`p-3 rounded-xl border-2 text-center font-bold \${req.recording_days === days ? 'border-blue-600 bg-blue-50 text-blue-700' : 'bg-white'}\`}>{days} Days</button>
                     ))}
                   </div>
                 </div>
               )}
               
               <div className="pt-6">
                 <Button onClick={handleNext} className="w-full h-12">Confirm & Proceed</Button>
               </div>
             </div>
           );
        } else {
           // Skip to case 5 logic, but for New System, case 4 IS the final step.
           // So for New System, we should render the final form here.
           // To keep it simple, we will always render final form on case 5,
           // and New System will just skip case 4 -> 5 automatically in handleNext.
           // Actually, let's just make both end at the same place.
           
           // We will handle this in handleNext. For New System, if step === 3, next is 5.
        }
        // Fallthrough intentional for new system if step logic is missed
      case 5:
        return (
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-3xl font-semibold mb-2">Final Step: Get Your Quotation</h2>
            <div className="space-y-4">
              <input type="text" required placeholder="Your Name" value={req.customer_name || ''} onChange={(e) => setReq(prev => ({ ...prev, customer_name: e.target.value }))} className="w-full p-3.5 border rounded-xl" />
              <input type="tel" required placeholder="Mobile Number" maxLength={10} value={req.customer_mobile || ''} onChange={(e) => setReq(prev => ({ ...prev, customer_mobile: e.target.value.replace(/\\D/g, '') }))} className="w-full p-3.5 border rounded-xl" />
            </div>
            <Button onClick={handleFinishWizard} disabled={loading || !req.customer_name || !req.customer_mobile || req.customer_mobile.length < 10} size="lg" className="w-full text-lg h-14 mt-6">
              {loading ? "Analyzing Requirement..." : "View My CCTV Options"}
            </Button>
          </div>
        );
    }
  };

  // Modify handleNext to skip step 4 for New Systems
  const handleNextFixed = () => {
    if (req.installation_type === "new" && step === 3) {
      setStep(5);
    } else {
      setStep(s => Math.min(s + 1, 5));
    }
  };
  
  const handlePrevFixed = () => {
    if (req.installation_type === "new" && step === 5) {
      setStep(3);
    } else {
      setStep(s => Math.max(s - 1, 1));
    }
  };`;

content = content.replace(oldRenderStep, newRenderStep);
content = content.replace(/const handleNext = \(\) => {[\s\S]*?};/, `const handleNext = handleNextFixed;`);
content = content.replace(/const handlePrev = \(\) => {[\s\S]*?};/, `const handlePrev = handlePrevFixed;`);

content = content.replace(
  `onClick={() => handleNext()}`,
  `onClick={handleNext}`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Updated WizardClientV2.tsx");
