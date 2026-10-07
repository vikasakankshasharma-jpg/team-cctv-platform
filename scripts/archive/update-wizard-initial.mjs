import fs from "fs";
let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

content = content.replace(
  /const \[req, setReq\] = useState<Partial<CCTVRequirement>>\(\{/,
  `const [req, setReq] = useState<Partial<CCTVRequirement>>({
    installation_type: "new",`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Updated initial state");
