import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

// We need to drop step 2, and shift 3,4,5 to 2,3,4.
// Total steps becomes 4.

const totalStepsRegex = /const totalSteps = 5;/;
content = content.replace(totalStepsRegex, "const totalSteps = 4;");

// Find the case switch block and replace steps 2, 3, 4, 5.
// We can use regex to replace the entire switch statement content up to the end of the component, but it's risky.
// Better to do targeted replacements.

const case2Regex = /case 2:[\s\S]*?case 3:/;
const newCase2 = `case 2:
          const currentOutdoor = req.outdoor_camera_count !== undefined ? req.outdoor_camera_count : 2;
          const currentIndoor = req.indoor_camera_count !== undefined ? req.indoor_camera_count : 2;
          const totalCams = currentOutdoor + currentIndoor;
  
          return (
            <div className="space-y-6 animate-in fade-in">
              <div>
                <h2 className="text-3xl font-semibold mb-2">How many cameras do you need?</h2>
                <p className="text-gray-600 text-sm">Select the exact number of indoor and outdoor cameras.</p>
              </div>
  
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl border-2 border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Outdoor Cameras</h3>
                      <p className="text-xs text-gray-500">Weatherproof Bullet</p>
                    </div>
                    <span className="text-2xl">???</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border">
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-2 hover:bg-gray-100" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: Math.max(0, currentOutdoor - 1), camera_count: Math.max(0, currentOutdoor - 1) + currentIndoor }))} disabled={currentOutdoor === 0}>-</Button>
                    <span className="text-2xl font-bold w-12 text-center text-blue-800">{currentOutdoor}</span>
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" onClick={() => setReq(prev => ({ ...prev, outdoor_camera_count: currentOutdoor + 1, camera_count: currentOutdoor + 1 + currentIndoor }))}>+</Button>
                  </div>
                </div>
  
                <div className="p-5 rounded-2xl border-2 border-gray-200 bg-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">Indoor Cameras</h3>
                      <p className="text-xs text-gray-500">Ceiling Dome</p>
                    </div>
                    <span className="text-2xl">??</span>
                  </div>
                  <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border">
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-2 hover:bg-gray-100" onClick={() => setReq(prev => ({ ...prev, indoor_camera_count: Math.max(0, currentIndoor - 1), camera_count: currentOutdoor + Math.max(0, currentIndoor - 1) }))} disabled={currentIndoor === 0}>-</Button>
                    <span className="text-2xl font-bold w-12 text-center text-blue-800">{currentIndoor}</span>
                    <Button variant="outline" size="icon" className="h-10 w-10 bg-white border-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" onClick={() => setReq(prev => ({ ...prev, indoor_camera_count: currentIndoor + 1, camera_count: currentOutdoor + currentIndoor + 1 }))}>+</Button>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl flex justify-between items-center border border-blue-100">
                <span className="font-semibold text-blue-900">Total Cameras:</span>
                <span className="text-2xl font-black text-blue-700">{totalCams}</span>
              </div>
  
              <div className="pt-2">
                <Button onClick={() => handleNext()} disabled={totalCams === 0} className="w-full h-12 text-sm font-semibold">
                  Confirm Cameras & Continue ?
                </Button>
              </div>
            </div>
          );
        case 999:`; // dummy to catch the end

content = content.replace(case2Regex, newCase2);

// Now case 4 becomes case 3, and case 5 becomes case 4.
content = content.replace(/case 4:/g, "case 3:");
content = content.replace(/case 5:/g, "case 4:");

// Remove the old case 3 which is now orphaned.
const oldCase3Regex = /case 999:[\s\S]*?case 3:/;
content = content.replace(oldCase3Regex, "case 3:");

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Combined Step 2 and 3");
