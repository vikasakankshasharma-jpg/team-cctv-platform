const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\components\\admin\\support\\SupportTicketsClient.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Add state for 3rd party
if (!content.includes('isThirdParty')) {
  content = content.replace(
    /const \[assigneeId, setAssigneeId\] = useState\(""\);/,
    `const [assigneeId, setAssigneeId] = useState("");
  const [isThirdParty, setIsThirdParty] = useState(false);
  const [tpName, setTpName] = useState("");
  const [tpPhone, setTpPhone] = useState("");`
  );
}

// Update handleStatusUpdate call to accept the new params
content = content.replace(
  /body: JSON\.stringify\(\{ status: newStatus, assigned_installer_id: assignId \|\| null \}\)/,
  `body: JSON.stringify({ 
          status: newStatus, 
          assigned_installer_id: assignId || null,
          is_third_party: isThirdParty,
          third_party_name: tpName,
          third_party_phone: tpPhone
        })`
);

// Update the Dispatch UI
const oldDispatchUI = `
                  {selectedTicket.status === "open" && (
                    <div className="space-y-2">
                      <select 
                        value={assigneeId}
                        onChange={e => setAssigneeId(e.target.value)}
                        className="w-full text-sm p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 bg-white font-medium"
                      >
                        <option value="">Select Installer to Assign...</option>
                        {availableInstallers.map(inst => (
                          <option key={inst.id} value={inst.id}>{inst.name} ({inst.phone})</option>
                        ))}
                      </select>
                      <button 
                        disabled={!assigneeId || isUpdating}
                        onClick={() => handleStatusUpdate(selectedTicket.id, "assigned", assigneeId)}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        Assign Installer & Move to Progress
                      </button>
                    </div>
                  )}
`;

const newDispatchUI = `
                  {selectedTicket.status === "open" && (
                    <div className="space-y-4">
                      
                      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                        <button 
                          onClick={() => setIsThirdParty(false)}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isThirdParty ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          Internal Staff
                        </button>
                        <button 
                          onClick={() => setIsThirdParty(true)}
                          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isThirdParty ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          3rd Party / Freelancer
                        </button>
                      </div>

                      {!isThirdParty ? (
                        <div className="space-y-2">
                          <select 
                            value={assigneeId}
                            onChange={e => setAssigneeId(e.target.value)}
                            className="w-full text-sm p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 bg-white font-medium"
                          >
                            <option value="">Select Internal Installer...</option>
                            {availableInstallers.map(inst => (
                              <option key={inst.id} value={inst.id}>{inst.name} ({inst.phone})</option>
                            ))}
                          </select>
                          <button 
                            disabled={!assigneeId || isUpdating}
                            onClick={() => handleStatusUpdate(selectedTicket.id, "assigned", assigneeId)}
                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            Assign Installer & Move to Progress
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <input 
                            type="text" 
                            placeholder="Freelancer Name" 
                            value={tpName}
                            onChange={e => setTpName(e.target.value)}
                            className="w-full text-sm p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-medium"
                          />
                          <input 
                            type="text" 
                            placeholder="Freelancer Phone (10 digits)" 
                            value={tpPhone}
                            onChange={e => setTpPhone(e.target.value)}
                            className="w-full text-sm p-3 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-medium"
                          />
                          <button 
                            disabled={!tpName || !tpPhone || isUpdating}
                            onClick={() => handleStatusUpdate(selectedTicket.id, "assigned", undefined)}
                            className="w-full bg-amber-500 text-white font-bold py-3 rounded-xl hover:bg-amber-600 transition-colors disabled:opacity-50"
                          >
                            Assign to Freelancer
                          </button>
                        </div>
                      )}
                    </div>
                  )}
`;

content = content.replace(oldDispatchUI, newDispatchUI);

fs.writeFileSync(filePath, content);
console.log("Updated SupportTicketsClient for 3rd party");
