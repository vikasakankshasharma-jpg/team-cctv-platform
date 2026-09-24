const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\lib\\whatsapp\\msg91-provider.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Update Msg91FollowupPayload interface
const oldInterface = "export interface Msg91FollowupPayload {\\n  phone: string;\\n  customerName: string;\\n}";
const newInterface = "export interface Msg91FollowupPayload {\\n  phone: string;\\n  customerName: string;\\n  amount: string | number;\\n}";
content = content.replace(/export interface Msg91FollowupPayload \{[\s\S]*?\}/, newInterface);

// Update sendQuoteFollowup parameters
const oldParamsRegex = /parameters:\s*\[\s*\{\s*type:\s*"text",\s*text:\s*payload\.customerName \|\| "Customer"\s*\}\s*\]/;
const newParams = 'parameters: [ { type: "text", text: payload.customerName || "Customer" }, { type: "text", text: (payload.amount || "your custom price").toString() } ]';
content = content.replace(oldParamsRegex, newParams);

fs.writeFileSync(filePath, content);
console.log("Fixed msg91-provider.ts for the 2-variable template");
