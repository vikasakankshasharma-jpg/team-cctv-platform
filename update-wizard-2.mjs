import fs from "fs";
let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

content = content.replace(
  /const handleNext = \(\) => setStep\(s => Math\.min\(s \+ 1, totalSteps \+ 1\)\);/,
  `const handleNext = () => {
    if (req.installation_type === "new" && step === 3) {
      setStep(5);
    } else {
      setStep(s => Math.min(s + 1, 5));
    }
  };`
);

content = content.replace(
  /const handlePrev = \(\) => setStep\(s => Math\.max\(s - 1, 1\)\);/,
  `const handlePrev = () => {
    if (req.installation_type === "new" && step === 5) {
      setStep(3);
    } else {
      setStep(s => Math.max(s - 1, 1));
    }
  };`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Updated handleNext and handlePrev");
