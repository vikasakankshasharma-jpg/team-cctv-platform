import fs from "fs";
let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

const startIdx = content.indexOf("const renderStep = () => {");
const endIdx = content.indexOf("return (", startIdx + 1);

const newSwitch = `
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
                  onChange={(e) => setReq(prev => ({ ...prev, customer_mobile: e.target.value.replace(/\D/g, '') }))} 
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

  `;

content = content.substring(0, startIdx) + newSwitch + content.substring(endIdx);
fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Replaced renderStep switch completely");
