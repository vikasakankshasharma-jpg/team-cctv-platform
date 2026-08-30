const fs = require('fs');
const file = 'app/api/inventory/purchase/[poId]/receive/route.ts';
let code = fs.readFileSync(file, 'utf8');

// Add import
if (!code.includes('AuditLogger')) {
  code = code.replace(
    'import { adminDb } from "@/lib/firebase-admin";',
    'import { adminDb } from "@/lib/firebase-admin";\nimport { AuditLogger } from "@/lib/audit-logger";'
  );
}

// Add request tracking variables
code = code.replace(
  'const { receivedItems, performedBy = "Admin" } = body;',
  'const { receivedItems, performedBy = "Admin" } = body;\n    const requestId = `REQ-${Date.now()}`;\n    const actorUid = "system_generated"; // In real usage, extracted from session\n    const actorRole = "OPERATIONS";'
);

// Add audit log for each item inside the transaction
const ledgerCode = `
             // 2. Create Stock Ledger Entry (IN)
             const ledgerRef = adminDb.collection("stock_ledger").doc();
             transaction.set(ledgerRef, {
                id: ledgerRef.id,
                skuId: item.skuId,
                type: "IN",
                quantity: received.qty,
                referenceType: "PURCHASE_ORDER",
                referenceId: poId,
                timestamp,
                performedBy,
                notes: \`Received from PO \${poId}\` + (isSerialized ? \` (Serials attached)\` : \`\`)
             });
`;

const newLedgerCode = ledgerCode + `
             // 3. Attach Audit Log inside transaction
             AuditLogger.logInTransaction(transaction, {
                actorUid,
                actorRole,
                action: "INVENTORY_RECEIVE",
                resourceType: "PURCHASE_ORDER_ITEM",
                resourceId: \`\${poId}_\${item.skuId}\`,
                afterSnapshot: { skuId: item.skuId, qty: received.qty },
                reason: \`PO Receive: \${poId}\`,
                requestId,
                timestamp,
                success: true
             });
`;

code = code.replace(ledgerCode.trim(), newLedgerCode.trim());

fs.writeFileSync(file, code);
console.log('done');
