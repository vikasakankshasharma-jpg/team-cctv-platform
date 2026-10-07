const fs = require('fs');
const path = 'app/(admin)/admin/salespersons/SalespersonsClient.tsx';
let code = fs.readFileSync(path, 'utf8');

const targetMapButton = `<button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setModalMapQuery({ type: 'pincode', query: p.pincode });
                                    setShowZoneMap(true);
                                  }}
                                  className="ml-2 px-2.5 py-1 bg-secondary text-foreground text-[10px] font-bold rounded-md hover:bg-primary/20 hover:text-primary transition-colors shrink-0 flex items-center gap-1"
                                >
                                  <MapIcon className="w-3 h-3" />
                                  MAP
                                </button>`;

code = code.replace(targetMapButton, '');

const targetAreasBlock = `{p.areas.length > 0 && (
                                <div className="pl-7 pr-2 pb-2 flex flex-col gap-1 border-t pt-2 mt-1">
                                  {p.areas.map((area: string) => {
                                    const areaCode = \`\${p.pincode}:\${area}\`;
                                    const isSelected = isParentSelected || (newZone.pincodes || []).includes(areaCode);
                                    
                                    return (
                                      <label key={areaCode} className={\`flex items-start gap-2 p-1.5 rounded-md cursor-pointer transition-all \${
                                        isSelected 
                                          ? 'bg-blue-50 text-blue-900 font-medium' 
                                          : 'hover:bg-muted/40 text-muted-foreground'
                                      }\`}>
                                        <input 
                                          type="checkbox" 
                                          checked={isSelected}
                                          disabled={isParentSelected}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setNewZone(prev => ({
                                                ...prev,
                                                pincodes: [...(prev.pincodes || []), areaCode]
                                              }));
                                            } else {
                                              setNewZone(prev => ({
                                                ...prev,
                                                pincodes: (prev.pincodes || []).filter(pin => pin !== areaCode)
                                              }));
                                            }
                                          }}
                                          className="mt-0.5 rounded border-input text-primary focus:ring-primary h-4 w-4" 
                                        />
                                        <div className="flex flex-col">
                                          <span className="text-sm font-semibold tracking-wide">{area}</span>
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}`;

const quadrantsHtml = `{(p.quadrants && p.quadrants.length > 0) ? (
                                <div className="pl-7 pr-2 pb-2 flex flex-col gap-1 border-t pt-2 mt-1">
                                  {p.quadrants.map((q: any) => {
                                    const areaCode = \`\${p.pincode}:\${q.zone}\`;
                                    const isSelected = isParentSelected || (newZone.pincodes || []).includes(areaCode);
                                    
                                    return (
                                      <label key={areaCode} className={\`flex items-start gap-2 p-1.5 rounded-md cursor-pointer transition-all \${
                                        isSelected 
                                          ? 'bg-blue-50 text-blue-900 font-medium' 
                                          : 'hover:bg-muted/40 text-muted-foreground'
                                      }\`}>
                                        <input 
                                          type="checkbox" 
                                          checked={isSelected}
                                          disabled={isParentSelected}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setNewZone(prev => ({
                                                ...prev,
                                                pincodes: [...(prev.pincodes || []), areaCode]
                                              }));
                                            } else {
                                              setNewZone(prev => ({
                                                ...prev,
                                                pincodes: (prev.pincodes || []).filter(pin => pin !== areaCode)
                                              }));
                                            }
                                          }}
                                          className="mt-0.5 rounded border-input text-blue-600 focus:ring-blue-500 h-3.5 w-3.5" 
                                        />
                                        <div className="flex flex-col">
                                          <span className="text-[11px] font-semibold leading-tight">{q.zone} <span className="opacity-70 font-normal">({q.anchor})</span></span>
                                          <span className="text-[9px] opacity-60 leading-tight mt-0.5">{q.coverage}</span>
                                        </div>
                                      </label>
                                    );
                                  })}
                                </div>
                              ) : p.areas.length > 0 && (
                                <div className="pl-7 pr-2 pb-2 flex flex-col gap-1 border-t pt-2 mt-1">
                                  {p.areas.map((area: string) => {
                                    const areaCode = \`\${p.pincode}:\${area}\`;
                                    const isSelected = isParentSelected || (newZone.pincodes || []).includes(areaCode);
                                    
                                    return (
                                      <label key={areaCode} className={\`flex items-start gap-2 p-1.5 rounded-md cursor-pointer transition-all \${
                                        isSelected 
                                          ? 'bg-blue-50 text-blue-900 font-medium' 
                                          : 'hover:bg-muted/40 text-muted-foreground'
                                      }\`}>
                                        <input 
                                          type="checkbox" 
                                          checked={isSelected}
                                          disabled={isParentSelected}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setNewZone(prev => ({
                                                ...prev,
                                                pincodes: [...(prev.pincodes || []), areaCode]
                                              }));
                                            } else {
                                              setNewZone(prev => ({
                                                ...prev,
                                                pincodes: (prev.pincodes || []).filter(pin => pin !== areaCode)
                                              }));
                                            }
                                          }}
                                          className="mt-0.5 rounded border-input text-blue-600 focus:ring-blue-500 h-3.5 w-3.5" 
                                        />
                                        <span className="text-xs">{area}</span>
                                      </label>
                                    );
                                  })}
                                </div>
                              )}`;

code = code.replace(targetAreasBlock, quadrantsHtml);

fs.writeFileSync(path, code);
console.log('Done replacement');
