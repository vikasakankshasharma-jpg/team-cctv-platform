const fs = require('fs');
const path = 'app/(admin)/admin/salespersons/SalespersonsClient.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetRegex = /<div className="flex flex-col">\s*<span className="text-sm font-semibold tracking-wide">ALL OF \{p\.pincode\}<\/span>\s*<\/div>/g;

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

code = code.replace(targetRegex, buttonHtml);

fs.writeFileSync(path, code);
console.log('Replaced properly');
