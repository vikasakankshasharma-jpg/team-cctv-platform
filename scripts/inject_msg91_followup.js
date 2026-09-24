const fs = require('fs');
const path = require('path');
const msg91Path = path.join('C:', 'Users', 'hp', 'Documents', 'TEAM Website', 'secure-easy', 'lib', 'whatsapp', 'msg91-provider.ts');

let msg91Content = fs.readFileSync(msg91Path, 'utf8');

// Add the FollowUp interface
const interfaceInjection = `
export interface Msg91FollowupPayload {
  phone: string;
  customerName: string;
}
`;
if (!msg91Content.includes('Msg91FollowupPayload')) {
  msg91Content = msg91Content.replace('export interface Msg91SurveyPayload', interfaceInjection + '\nexport interface Msg91SurveyPayload');
}

// Add the sendQuoteFollowup method
const methodInjection = `
  async sendQuoteFollowup(payload: Msg91FollowupPayload) {
    console.log(`[MSG91] Sending quote followup to ${payload.phone}`);
    
    let to = payload.phone.replace(/[^0-9]/g, '');
    if (to.length === 10) to = `91${to}`;

    const msg91Payload = {
      to,
      type: "template",
      template: {
        name: "cctv_quote_followup",
        language: { code: "en", policy: "deterministic" },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: payload.customerName || "Customer"
              }
            ]
          }
        ]
      }
    };

    return this.sendMessage(msg91Payload);
  }
`;

if (!msg91Content.includes('sendQuoteFollowup')) {
  msg91Content = msg91Content.replace('export class Msg91WhatsAppProvider {', 'export class Msg91WhatsAppProvider {' + methodInjection);
}

fs.writeFileSync(msg91Path, msg91Content);
console.log("Updated msg91-provider.ts with sendQuoteFollowup");
