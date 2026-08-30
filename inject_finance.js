const fs = require('fs');

// 1. RMA
let rmaFile = 'app/api/operations/rma/route.ts';
let rmaCode = fs.readFileSync(rmaFile, 'utf8');

if (!rmaCode.includes('AuditLogger')) {
  rmaCode = rmaCode.replace('import { checkRole } from "@/lib/rbac";', 'import { checkRole } from "@/lib/rbac";\nimport { AuditLogger } from "@/lib/audit-logger";\nimport crypto from "crypto";');
  
  rmaCode = rmaCode.replace('const body = await request.json();', 'const body = await request.json();\n    const requestId = crypto.randomUUID();\n    const actorRole = "OPERATIONS";\n    const actorUid = "system_generated";');
  
  const rmaLedgerCode = `           notes: \`RMA Warranty Replacement. Outgoing SN: \${newSerialNumber}\`\n       });`;
  const newRmaLedgerCode = rmaLedgerCode + `\n\n       // 9. Audit Log\n       AuditLogger.logInTransaction(transaction, {\n          actorUid,\n          actorRole,\n          action: "SERIAL_RMA",\n          resourceType: "SERIAL_ASSET",\n          resourceId: oldSerialNumber,\n          customerId: oldAsset.customerId || customerId || null,\n          afterSnapshot: { newSerialNumber },\n          reason,\n          requestId,\n          timestamp,\n          success: true\n       });`;
  
  rmaCode = rmaCode.replace(rmaLedgerCode, newRmaLedgerCode);
  fs.writeFileSync(rmaFile, rmaCode);
}


// 2. Invoice Create API
let invoiceFile = 'app/api/finance/invoices/route.ts';
if (fs.existsSync(invoiceFile)) {
  let invCode = fs.readFileSync(invoiceFile, 'utf8');
  if (!invCode.includes('AuditLogger')) {
    invCode = invCode.replace('import { adminDb } from "@/lib/firebase-admin";', 'import { adminDb } from "@/lib/firebase-admin";\nimport { AuditLogger } from "@/lib/audit-logger";\nimport crypto from "crypto";');
    invCode = invCode.replace('const body = await request.json();', 'const body = await request.json();\n    const requestId = crypto.randomUUID();\n    const actorRole = "FINANCE";\n    const actorUid = "system_generated";');
    
    // Inject near batch commit
    invCode = invCode.replace('batch.commit();', 'AuditLogger.logInTransaction(batch as any, { actorUid, actorRole, action: "INVOICE_CREATE", resourceType: "INVOICE", resourceId: invoiceId, customerId: body.customerId, reason: "Invoice Created", requestId, timestamp: new Date().toISOString(), success: true });\n    await batch.commit();');
    fs.writeFileSync(invoiceFile, invCode);
  }
}

// 3. Receipt / Payment API
let receiptFile = 'app/api/finance/receipts/route.ts';
if (fs.existsSync(receiptFile)) {
  let recCode = fs.readFileSync(receiptFile, 'utf8');
  if (!recCode.includes('AuditLogger')) {
    recCode = recCode.replace('import { adminDb } from "@/lib/firebase-admin";', 'import { adminDb } from "@/lib/firebase-admin";\nimport { AuditLogger } from "@/lib/audit-logger";\nimport crypto from "crypto";');
    recCode = recCode.replace('const body = await request.json();', 'const body = await request.json();\n    const requestId = crypto.randomUUID();\n    const actorRole = "FINANCE";\n    const actorUid = "system_generated";');
    
    // Inject near transaction commit
    recCode = recCode.replace('transaction.set(receiptRef, receiptData);', 'transaction.set(receiptRef, receiptData);\n       AuditLogger.logInTransaction(transaction, { actorUid, actorRole, action: "PAYMENT_RECEIVE", resourceType: "RECEIPT", resourceId: receiptRef.id, customerId: invoice.customerId, reason: "Payment Received", requestId, timestamp: new Date().toISOString(), success: true });');
    fs.writeFileSync(receiptFile, recCode);
  }
}

console.log('done');
