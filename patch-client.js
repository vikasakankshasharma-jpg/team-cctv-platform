const fs = require('fs');

let c = fs.readFileSync('app/(admin)/admin/vendor-import/VendorImportClient.tsx', 'utf8');

c = c.replace('import { FolderTree, Inbox, Play, CheckCircle2, XCircle } from "lucide-react";', 'import { FolderTree, Inbox, Play, CheckCircle2, XCircle, RefreshCw } from "lucide-react";');

const target = `<button className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600">
                   <Play className="w-4 h-4" /> Run Playwright Discovery
                </button>`;

const replace = `<div className="flex items-center gap-3">
                  <button 
                     onClick={async () => {
                        const toastId = toast.loading("Launching Sync Engine...");
                        try {
                           const res = await fetch("/api/admin/vendor/sync", { method: "POST" });
                           if (res.ok) toast.success("Live Sync launched! Check the new terminal window.", { id: toastId });
                           else toast.error("Failed to launch sync", { id: toastId });
                        } catch(e) { toast.error("Error launching sync", { id: toastId }); }
                     }}
                     className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600"
                  >
                     <RefreshCw className="w-4 h-4" /> Sync Existing Products
                  </button>
                  <button className="flex items-center gap-2 bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-600">
                     <Play className="w-4 h-4" /> Run Playwright Discovery
                  </button>
                </div>`;

c = c.replace(target, replace);
fs.writeFileSync('app/(admin)/admin/vendor-import/VendorImportClient.tsx', c);
console.log("Patched UI");
