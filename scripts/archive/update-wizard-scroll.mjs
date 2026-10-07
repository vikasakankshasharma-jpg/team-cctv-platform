import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

content = content.replace(
  /const handleNext = \(\) => \{\r?\n\s*if \(req\.installation_type === "new" && step === 3\) \{/,
  `const handleNext = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (req.installation_type === "new" && step === 3) {`
);

content = content.replace(
  /const handlePrev = \(\) => \{\r?\n\s*if \(req\.installation_type === "new" && step === 5\) \{/,
  `const handlePrev = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (req.installation_type === "new" && step === 5) {`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Updated scrolling on WizardClientV2.tsx");
