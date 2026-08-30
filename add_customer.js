const fs = require('fs');
let c = fs.readFileSync('types/index.ts', 'utf8');
const customerType = `
export interface Customer {
  id: string;
  authUid?: string;
  name: string;
  phone: string;
  email?: string;
  type: "ONLINE_PORTAL" | "WALK_IN" | "REFERRAL" | "OTHER";
  address?: Address;
  createdAt: string;
  updatedAt?: string;
}
`;
c = c.replace('export interface Lead {', customerType + '\nexport interface Lead {\n  customerId?: string;');
fs.writeFileSync('types/index.ts', c);
console.log('done');
