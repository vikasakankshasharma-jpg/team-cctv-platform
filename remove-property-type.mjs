import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

// Remove the entire "Where do you need the CCTV" block
const startMatch = `{req.installation_type === "new" && (`;
const startIndex = content.indexOf(startMatch);

if (startIndex !== -1) {
  // Find the end of this block
  const endMatch = `</div>\r?\n              )}`
  const regex = new RegExp(`\\{req\\.installation_type === "new" && \\([\\s\\S]*?</div>\\s*\\)\\}`);
  content = content.replace(regex, "");
}

// Modify updateReq so it DOES NOT automatically handleNext
// because we should explicitly call handleNext when appropriate to avoid double jumps.
content = content.replace(
  /const updateReq = \(updates: Partial<CCTVRequirement>\) => \{\r?\n\s*setReq\(prev => \(\{ \.\.\.prev, \.\.\.updates \}\)\);\r?\n\s*handleNext\(\);\r?\n\s*\};/,
  `const updateReq = (updates: Partial<CCTVRequirement>) => {
    setReq(prev => ({ ...prev, ...updates }));
  };`
);

// Add handleNext to the main buttons in Step 1
content = content.replace(
  /onClick=\{\(\) => updateReq\(\{ installation_type: "new", property_type: "Residential" \}\)\}/,
  `onClick={() => { updateReq({ installation_type: "new", property_type: "Residential" }); handleNext(); }}`
);

// We shouldn't auto-next for Add-on because it expands options to ask "Do you know technical specs"
// Wait, if it expands options in the same step, then updateReq without handleNext is correct!
content = content.replace(
  /onClick=\{\(\) => updateReq\(\{ installation_type: "addon", existing_system_known: undefined \}\)\}/,
  `onClick={() => { updateReq({ installation_type: "addon", existing_system_known: undefined }); }}`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Updated Step 1");
