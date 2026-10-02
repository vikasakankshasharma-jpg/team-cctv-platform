const fs = require('fs');
const path = 'app/(admin)/admin/salespersons/SalespersonsClient.tsx';
let code = fs.readFileSync(path, 'utf8');

// 1. Remove the MAP button block
const mapButtonRegex = /<button[\s\S]*?onClick=\{\(e\) => \{[\s\S]*?setModalMapQuery\(\{ type: 'pincode', query: p\.pincode \}\);[\s\S]*?setShowZoneMap\(true\);[\s\S]*?\}\}[\s\S]*?>[\s\S]*?<MapIcon className="w-3 h-3" \/>[\s\S]*?MAP[\s\S]*?<\/button>/;
code = code.replace(mapButtonRegex, '');

// 2. Replace the p.areas rendering block
const areasBlockRegex = /\{p\.areas\.length > 0 && \([\s\S]*?<div className="pl-7 pr-2 pb-2 flex flex-col gap-1 border-t pt-2 mt-1">[\s\S]*?\{p\.areas\.map\(\(area: string\) => \{[\s\S]*?const areaCode = `\$\{p\.pincode\}:\$\{area\}`;[\s\S]*?const isSelected = isParentSelected \|\| \(newZone\.pincodes \|\| \[\]\)\.includes\(areaCode\);[\s\S]*?return \([\s\S]*?<label key=\{areaCode\}[\s\S]*?className=\{`flex items-start gap-2 p-1\.5 rounded-md cursor-pointer transition-all \$\{[\s\S]*?isSelected[\s\S]*?\? 'bg-blue-50 text-blue-900 font-medium'[\s\S]*?: 'hover:bg-muted\/40 text-muted-foreground'[\s\S]*?\}`\}>[\s\S]*?<input[\s\S]*?type="checkbox"[\s\S]*?checked=\{isSelected\}[\s\S]*?disabled=\{isParentSelected\}[\s\S]*?onChange=\{\(e\) => \{[\s\S]*?if \(e\.target\.checked\) \{[\s\S]*?setNewZone\(prev => \(\{[\s\S]*?\.\.\.prev,[\s\S]*?pincodes: \[\.\.\.\(prev\.pincodes \|\| \[\]\), areaCode\][\s\S]*?\}\)\);[\s\S]*?\} else \{[\s\S]*?setNewZone\(prev => \(\{[\s\S]*?\.\.\.prev,[\s\S]*?pincodes: \(prev\.pincodes \|\| \[\]\)\.filter\(pin => pin !== areaCode\)[\s\S]*?\}\)\);[\s\S]*?\}[\s\S]*?\}\}[\s\S]*?className="mt-0\.5 rounded border-input text-blue-600 focus:ring-blue-500 h-3\.5 w-3\.5"[\s\S]*?\/>[\s\S]*?<span className="text-xs">\{area\}<\/span>[\s\S]*?<\/label>[\s\S]*?\);[\s\S]*?\}\)[\s\S]*?<\/div>[\s\S]*?\)\}/;

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

code = code.replace(areasBlockRegex, quadrantsHtml);

fs.writeFileSync(path, code);
console.log('Done replacement');
