const fs = require("fs");
let text = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

text = text.replace(
  /<span className="block font-black text-xl text-zinc-900 group-hover:text-black mb-2">?? Pro Builder \(Advanced\)<\/span>\s*<span className="block text-sm text-zinc-500 font-medium leading-relaxed">For installers, B2B clients, and tech-savvy users who want to manually browse the catalog and select every individual component.<\/span>/g,
  `<span className="block font-black text-xl text-zinc-900 group-hover:text-black mb-2">?? Custom Build (Advanced)</span>
                <span className="block text-sm text-zinc-500 font-medium leading-relaxed">I already know exactly what cameras and technical specifications I need. Let me build my own custom package from the catalog.</span>`
);

fs.writeFileSync("components/wizard/WizardClientV2.tsx", text);
