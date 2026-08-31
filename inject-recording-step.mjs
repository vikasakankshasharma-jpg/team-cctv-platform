import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

content = content.replace(
  /const totalSteps = 4;/,
  `const totalSteps = 5;`
);

const newStep4 = `        case 4:
          return (
            <div className="space-y-6 animate-in fade-in">
              <h2 className="text-3xl font-semibold mb-2">Recording & Backup</h2>
              <p className="text-gray-600 mb-6">How long do you want to keep the CCTV recordings?</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[15, 30, 45, 60].map(days => (
                  <button key={days} onClick={() => setReq(prev => ({ ...prev, recording_days: days }))}
                    className={\`p-4 rounded-xl border-2 text-center text-xl font-bold transition-all \${req.recording_days === days ? 'border-blue-600 bg-blue-50 text-blue-700' : 'hover:border-blue-300 hover:bg-gray-50 text-gray-700'}\`}>
                    {days} Days
                  </button>
                ))}
              </div>

              <h3 className="text-xl font-semibold mb-3">Recording Mode</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button onClick={() => setReq(prev => ({ ...prev, recording_mode: "continuous" }))}
                  className={\`p-5 rounded-xl border-2 text-left transition-all \${req.recording_mode === 'continuous' ? 'border-blue-600 bg-blue-50' : 'hover:border-gray-300'}\`}>
                  <span className="block font-bold text-gray-900 text-lg">24x7 Continuous</span>
                  <span className="block text-sm text-gray-500 mt-1">Records everything non-stop. Requires standard hard disk capacity.</span>
                </button>
                <button onClick={() => setReq(prev => ({ ...prev, recording_mode: "motion" }))}
                  className={\`p-5 rounded-xl border-2 text-left transition-all \${req.recording_mode === 'motion' ? 'border-green-500 bg-green-50 shadow-sm' : 'hover:border-gray-300'}\`}>
                  <span className="block font-bold text-gray-900 text-lg flex items-center">Smart Motion</span>
                  <span className="block text-sm text-gray-500 mt-1">Records only when movement is detected. <strong className="text-green-700">Saves up to 50% hard disk cost!</strong></span>
                </button>
              </div>
              
              <div className="pt-6">
                <Button onClick={() => handleNext()} className="w-full h-12 text-lg font-semibold">
                  Confirm Recording ?
                </Button>
              </div>
            </div>
          );
        case 5:`;

content = content.replace(/case 4:/, newStep4);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Injected Recording Step");
