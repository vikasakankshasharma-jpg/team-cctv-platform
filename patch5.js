const fs = require('fs');
const path = 'components/installer/InstallerJobDetailClient.tsx';
let content = fs.readFileSync(path, 'utf8');

// Add import
content = content.replace('import Link from "next/link";', 'import Link from "next/link";\nimport SubmitOfflinePaymentModal from "./SubmitOfflinePaymentModal";');

// Add state
content = content.replace('const [resending, setResending] = useState(false);', 'const [resending, setResending] = useState(false);\n  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);');

// Add Button & Modal UI before "handleUploadAndComplete" button UI (inside the component return)
const targetBlock = \            <button 
              onClick={handleUploadAndComplete}\;

const newBlock = \            {lead?.status !== "won" && (
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
                <label className="block text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Payment Collection</label>
                <button 
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20"
                >
                  Collect Payment (Cash / UPI)
                </button>
              </div>
            )}
            
            <button 
              onClick={handleUploadAndComplete}\;

content = content.replace(targetBlock, newBlock);

// Add Modal component at the end of the return statement
content = content.replace('</button>\\n\\n          </div>\\n        </div>\\n      </div>\\n    </div>\\n  );\\n}', '</button>\\n\\n          </div>\\n        </div>\\n      </div>\\n      \\n      <SubmitOfflinePaymentModal \\n        isOpen={isPaymentModalOpen} \\n        onClose={() => setIsPaymentModalOpen(false)}\\n        leadId={leadId}\\n        quoteId={lead?.last_quote_id || ""}\\n      />\\n    </div>\\n  );\\n}');


fs.writeFileSync(path, content);
