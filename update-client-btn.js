const fs = require('fs');
const path = 'app/(admin)/admin/salespersons/SalespersonsClient.tsx';
let code = fs.readFileSync(path, 'utf8');

if (!code.includes('generatingPins')) {
  code = code.replace(
    'const [isGeocoding, setIsGeocoding] = useState(false);',
    'const [isGeocoding, setIsGeocoding] = useState(false);\n  const [generatingPins, setGeneratingPins] = useState<Set<string>>(new Set());'
  );
}

if (!code.includes('handleGenerateQuadrants')) {
  const func = `
  const handleGenerateQuadrants = async (e: React.MouseEvent, pin: string) => {
    e.preventDefault();
    e.stopPropagation();
    setGeneratingPins(prev => new Set(prev).add(pin));
    try {
      const res = await fetch(\`/api/pincode/\${pin}\`);
      if (res.ok) {
        if (selectedState && selectedDistrict) {
          await handleSelectDistrict(selectedDistrict.slug, selectedDistrict.name);
        }
      }
    } catch(err) {
      console.error(err);
    } finally {
      setGeneratingPins(prev => {
        const next = new Set(prev);
        next.delete(pin);
        return next;
      });
    }
  };`;
  
  code = code.replace(
    'const handleSelectDistrict = (slug: string, name: string) => {',
    func + '\n\n  const handleSelectDistrict = (slug: string, name: string) => {'
  );
}

const target = `<div className="flex flex-col">
                                      <span className="text-sm font-semibold tracking-wide">ALL OF {p.pincode}</span>
                                    </div>`;

const buttonHtml = `<div className="flex flex-col">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-semibold tracking-wide">ALL OF {p.pincode}</span>
                                        {(!p.quadrants || p.quadrants.length === 0) && (
                                          <button
                                            type="button"
                                            onClick={(e) => handleGenerateQuadrants(e, p.pincode)}
                                            disabled={generatingPins.has(p.pincode)}
                                            className="text-[10px] bg-indigo-50 text-indigo-600 hover:bg-indigo-100 px-2 py-0.5 rounded-full border border-indigo-200 transition-colors flex items-center gap-1"
                                          >
                                            {generatingPins.has(p.pincode) ? <Loader2 className="w-3 h-3 animate-spin" /> : "✨"} Gen Quadrants
                                          </button>
                                        )}
                                      </div>
                                    </div>`;

code = code.replace(target, buttonHtml);

fs.writeFileSync(path, code);
console.log('Replaced');
