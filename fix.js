const fs = require("fs");
let text = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

text = text.replace(
/return \(\s*<div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">\s*<div className="bg-white rounded-2xl shadow-sm border p-8">([\s\S]*?)$/,
`return (
    <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6">
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        {step > 0 && (
          <div className="mb-8">
            <div className="h-2 bg-gray-100 rounded-full w-full overflow-hidden">
              <div className="h-2 bg-blue-600 rounded-full transition-all duration-300" style={{ width: \`\${(Math.min((req.installation_type === "new" && step === 5 ? 4 : step), totalSteps) / totalSteps) * 100}%\` }}></div>
            </div>
            <p className="text-sm text-gray-500 mt-2 text-right">Step {req.installation_type === "new" && step === 5 ? 4 : step} of {totalSteps}</p>
          </div>
        )}

        {renderStep()}

        {step > 0 && (
          <div className="mt-12 flex justify-between">
            <Button variant="outline" onClick={handlePrev} disabled={step <= 1 || loading}>
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}`
);
fs.writeFileSync("components/wizard/WizardClientV2.tsx", text);
