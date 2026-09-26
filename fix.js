const fs = require('fs');

const adminFile = 'c:/Users/hp/Documents/TEAM Website/secure-easy/components/admin/Sidebar.tsx';
let data = fs.readFileSync(adminFile, 'utf8');
data = data.replace('import { auth } from "@/lib/firebase-client";', 'import { auth } from "@/lib/firebase-client";\nimport { toast } from "sonner";');
data = data.replace('console.error("Logout failed", error);', 'console.error("Logout failed", error);\n      toast.error(\'Logout failed. Please try again.\');');
fs.writeFileSync(adminFile, data);

console.log("Fixed admin sidebar");
