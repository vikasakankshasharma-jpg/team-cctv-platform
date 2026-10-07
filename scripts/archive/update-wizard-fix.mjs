import fs from "fs";

let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

content = content.replace(
  /const totalSteps = req\.installation_type === "new" \? 4 : 5;\r?\n/,
  ""
);

content = content.replace(
  /const \[req, setReq\] = useState<Partial<CCTVRequirement>>\(\{\r?\n\s*installation_type: "new",\r?\n\s*camera_count: 4,/,
  `const [req, setReq] = useState<Partial<CCTVRequirement>>({
    installation_type: "new",
    camera_count: 4,`
);

content = content.replace(
  /const \[isEditDrawerOpen, setIsEditDrawerOpen\] = useState\(false\);/,
  `const totalSteps = req.installation_type === "new" ? 4 : 5;
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", content);
console.log("Fixed totalSteps position");
