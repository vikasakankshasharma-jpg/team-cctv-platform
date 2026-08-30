const fs = require('fs');
const file = 'app/api/operations/jobs/[jobId]/route.ts';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('AuditLogger')) {
  code = code.replace(
    'import { checkRole } from "@/lib/rbac";',
    'import { checkRole } from "@/lib/rbac";\nimport { AuditLogger } from "@/lib/audit-logger";'
  );
}

// Add request tracking variables
if(!code.includes('const requestId =')) {
  code = code.replace(
    'const body = await request.json();',
    'const body = await request.json();\n    const requestId = `REQ-${Date.now()}`;\n    const actorUid = "system_generated";\n    const actorRole = "TECHNICIAN";'
  );
}

// Job completion ledger OUT
const ledgerCode = `
             // 4. Create Ledger Entry
             const ledgerRef = adminDb.collection("stock_ledger").doc();
             transaction.set(ledgerRef, {
                id: ledgerRef.id,
                skuId: item.skuId,
                type: "OUT",
                quantity: item.qty,
                referenceType: "JOB",
                referenceId: jobId,
                timestamp,
                performedBy: "Technician",
                notes: \`Installed for Job \${jobId}\`
             });
`;

const newLedgerCode = ledgerCode + `
             // 4b. Audit Log
             AuditLogger.logInTransaction(transaction, {
                actorUid,
                actorRole,
                action: "INVENTORY_CONSUME",
                resourceType: "JOB_ITEM",
                resourceId: \`\${jobId}_\${item.skuId}\`,
                afterSnapshot: { skuId: item.skuId, qty: item.qty },
                reason: \`Job Consumption: \${jobId}\`,
                requestId,
                timestamp,
                success: true
             });
`;

code = code.replace(ledgerCode.trim(), newLedgerCode.trim());
fs.writeFileSync(file, code);
console.log('done');
