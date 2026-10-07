const fs = require('fs');
const path = 'app/(admin)/admin/salespersons/SalespersonsClient.tsx';
let code = fs.readFileSync(path, 'utf8');

const replacement = `                            {p.quadrants && p.quadrants.length > 0 ? (
                              <div className="pl-7 pr-2 pb-2 flex flex-col gap-1 border-t pt-2 mt-1">
                                {p.quadrants.map((q) => {
                                  const areaCode = \`\${p.pincode}:\${q.zone}\`;
                                  const isSelected = isParentSelected || (newZone.pincodes || []).includes(areaCode);
                                  return (
                                    <label key={areaCode} className={\`flex items-start gap-2 p-1.5 rounded-md cursor-pointer transition-all \${
                                      isSelected ? 'bg-blue-50 text-blue-900 font-medium' : 'hover:bg-muted/40 text-muted-foreground'
                                    }\`}>
                                      <input 
                                        type="checkbox" 
                                        checked={isSelected}
                                        disabled={isParentSelected}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setNewZone(prev => ({...prev, pincodes: Array.from(new Set([...(prev.pincodes || []), areaCode]))}));
                                          } else {
                                            setNewZone(prev => ({...prev, pincodes: (prev.pincodes || []).filter(code => code !== areaCode)}));
                                          }
                                        }}
                                        className="mt-0.5 rounded border-blue-300 text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 disabled:opacity-50" 
                                      />
                                      <span className="text-xs leading-tight">
                                        <strong>{q.zone}</strong> <span className="text-muted-foreground">({q.anchor})</span>
                                        <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{q.coverage}</div>
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            ) : p.areas.length > 0 && (
                                <div className="pl-7 pr-2 pb-2 flex flex-col gap-1 border-t pt-2 mt-1">
                                  {p.areas.map((area: string) => {`;

const target = `{p.areas.length > 0 && (
                                <div className="pl-7 pr-2 pb-2 flex flex-col gap-1 border-t pt-2 mt-1">
                                  {p.areas.map((area: string) => {`;

code = code.replace(target, replacement);
fs.writeFileSync(path, code);
console.log('Replaced in SalespersonsClient.tsx');
