const fs = require('fs');
const msg91Path = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\lib\\whatsapp\\msg91-provider.ts';
const cronPath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\app\\api\\cron\\auto-chaser\\route.ts';

// 1. Update msg91-provider.ts
let msg91Content = fs.readFileSync(msg91Path, 'utf8');
const newMethod = `
  async sendNegotiationNudge(payload: Msg91FollowupPayload) {
    console.log(`[MSG91] Sending negotiation nudge to ${payload.phone}`);
    
    let to = payload.phone.replace(/[^0-9]/g, '');
    if (to.length === 10) to = `91${to}`;

    const msg91Payload = {
      to,
      type: "template",
      template: {
        name: "cctv_negotiation_nudge",
        language: { code: "en", policy: "deterministic" },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: payload.customerName || "Customer" },
              { type: "text", text: (payload.amount || "your custom price").toString() }
            ]
          }
        ]
      }
    };

    return this.sendMessage(msg91Payload);
  }
`;

if (!msg91Content.includes('sendNegotiationNudge')) {
  msg91Content = msg91Content.replace('export class Msg91WhatsAppProvider {', 'export class Msg91WhatsAppProvider {' + newMethod);
  fs.writeFileSync(msg91Path, msg91Content);
}

// 2. Update auto-chaser/route.ts
let cronContent = fs.readFileSync(cronPath, 'utf8');
cronContent = cronContent.replace(
  /\} else if \(lead\.status === "negotiating"\) \{[\s\S]*?const res = await msg91\.sendQuoteFollowup\(\{[\s\S]*?\}\);/g,
  `} else if (lead.status === "negotiating") {
        let quoteAmount = lead.total_payable || "your custom price";
        if (!lead.total_payable) {
           const qs = await adminDb.collection("quotes").where("lead_id", "==", leadId).orderBy("created_at", "desc").limit(1).get();
           if (!qs.empty) {
             quoteAmount = qs.docs[0].data().total_payable || quoteAmount;
           }
        }

        const res = await msg91.sendNegotiationNudge({
          phone: lead.phone,
          customerName: lead.name || "Customer",
          amount: quoteAmount
        });`
);

fs.writeFileSync(cronPath, cronContent);
console.log("Wired up cctv_negotiation_nudge");
