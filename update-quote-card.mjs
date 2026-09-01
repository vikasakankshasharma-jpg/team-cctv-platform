import fs from "fs";

let content = fs.readFileSync("components/QuoteComparison.tsx", "utf8");

// Extract total cameras correctly
content = content.replace(
  /const mp = key\.split\("_"\)\[1\];/,
  `const keyParts = key.split("_");
             const mp = keyParts.length > 2 ? keyParts[2] : keyParts[1];
             const totalCams = requirement.installation_type === "addon" ? (requirement.indoor_camera_count || 0) + (requirement.outdoor_camera_count || 0) : requirement.camera_count || 0;
             
             // Extract storage string
             const storageItem = plan.items.find(i => i.category === "storage");
             const storageDisplay = storageItem ? storageItem.display_name.match(/\d+TB|\d+GB/)?.[0] || "Included" : "None";
             
             // Extract recorder string
             const recorderItem = plan.items.find(i => i.category === "recorder");
             const recorderDisplay = recorderItem ? (recorderItem.display_name.includes("8 Ch") ? "8-Channel" : recorderItem.display_name.includes("16 Ch") ? "16-Channel" : recorderItem.display_name.includes("32 Ch") ? "32-Channel" : "4-Channel") : "Existing";`
);

// Update rendering
content = content.replace(
  /<li className="flex justify-between"><span>Cameras<\/span> <span className="font-medium">\{requirement\.camera_count\}x \{activeTech\}<\/span><\/li>/,
  `<li className="flex justify-between"><span>Cameras</span> <span className="font-medium">{totalCams}x {activeTech}</span></li>`
);

content = content.replace(
  /<li className="flex justify-between"><span>Recording<\/span> <span className="font-medium">\{requirement\.recording_days \|\| 15\} Days<\/span><\/li>/,
  `<li className="flex justify-between"><span>Storage</span> <span className="font-medium">{storageDisplay} ({requirement.recording_days || 0} Days)</span></li>
                        <li className="flex justify-between"><span>Recorder</span> <span className="font-medium">{recorderDisplay}</span></li>`
);

fs.writeFileSync("components/QuoteComparison.tsx", content);
console.log("Updated QuoteComparison.tsx with brief details");
