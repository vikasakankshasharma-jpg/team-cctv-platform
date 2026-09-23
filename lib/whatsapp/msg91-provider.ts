export interface Msg91QuotePayload {
  phone: string;
  customerName: string;
  pdfUrl: string;
  quoteId: string;
}

export interface Msg91InvoicePayload {
  phone: string;
  customerName: string;
  pdfUrl: string;
  amount: number;
}

export interface Msg91SurveyPayload {
  phone: string;
  customerName: string;
  date: string;
  timeSlot: string;
}

export class Msg91WhatsAppProvider {
  private authKey: string;
  private fromNumber: string;
  private baseUrl = "https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/";

  constructor() {
    this.authKey = process.env.MSG91_AUTH_KEY || "";
    this.fromNumber = process.env.MSG91_WHATSAPP_NUMBER || "";
  }

  private async sendMessage(payload: any): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.authKey || !this.fromNumber) {
      return { success: false, error: "Missing MSG91 credentials" };
    }

    try {
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "authkey": this.authKey
        },
        body: JSON.stringify({
          integrated_number: this.fromNumber,
          content_type: "template",
          payload: payload
        })
      });

      const data = await response.json();
      
      if (!response.ok || data.hasError) {
        return { success: false, error: data.message || "MSG91 API Error" };
      }

      return { success: true, messageId: data.msgId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async sendQuote(payload: Msg91QuotePayload) {
    console.log(`[MSG91] Sending quote PDF to ${payload.phone}`);
    
    let to = payload.phone.replace(/[^0-9]/g, '');
    if (to.length === 10) to = `91${to}`;

    const msg91Payload = {
      to,
      type: "template",
      template: {
        name: "cctv_quote_pdf",
        language: { code: "en", policy: "deterministic" },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "document",
                document: {
                  link: payload.pdfUrl,
                  filename: `CCTV-Quote-${payload.quoteId}.pdf`
                }
              }
            ]
          },
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

  async sendInvoice(payload: Msg91InvoicePayload) {
    console.log(`[MSG91] Sending invoice PDF to ${payload.phone}`);
    
    let to = payload.phone.replace(/[^0-9]/g, '');
    if (to.length === 10) to = `91${to}`;

    const msg91Payload = {
      to,
      type: "template",
      template: {
        name: "cctv_invoice_pdf",
        language: { code: "en", policy: "deterministic" },
        components: [
          {
            type: "header",
            parameters: [
              {
                type: "document",
                document: {
                  link: payload.pdfUrl,
                  filename: `Tax-Invoice.pdf`
                }
              }
            ]
          },
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: payload.customerName || "Customer"
              },
              {
                type: "text",
                text: payload.amount.toString()
              }
            ]
          }
        ]
      }
    };

    return this.sendMessage(msg91Payload);
  }

  async sendSurveyConfirm(payload: Msg91SurveyPayload) {
    console.log(`[MSG91] Sending survey confirmation to ${payload.phone}`);
    
    let to = payload.phone.replace(/[^0-9]/g, '');
    if (to.length === 10) to = `91${to}`;

    const msg91Payload = {
      to,
      type: "template",
      template: {
        name: "cctv_survey_confirm",
        language: { code: "en", policy: "deterministic" },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: payload.customerName || "Customer"
              },
              {
                type: "text",
                text: payload.date
              },
              {
                type: "text",
                text: payload.timeSlot
              }
            ]
          }
        ]
      }
    };

    return this.sendMessage(msg91Payload);
  }
  async sendJobAlert(payload: { phone: string, installerName: string, customerAddress: string, customerPhone: string }) {
    console.log(`[MSG91] Sending job alert to installer ${payload.phone}`);
    let to = payload.phone.replace(/[^0-9]/g, '');
    if (to.length === 10) to = `91${to}`;
    return this.sendMessage({
      to, type: "template", template: {
        name: "cctv_job_alert", language: { code: "en", policy: "deterministic" },
        components: [{ type: "body", parameters: [
          { type: "text", text: payload.installerName },
          { type: "text", text: payload.customerAddress },
          { type: "text", text: payload.customerPhone }
        ]}]
      }
    });
  }

  async sendLeadWelcome(payload: { phone: string, customerName: string, configDetails: string }) {
    console.log(`[MSG91] Sending lead welcome to ${payload.phone}`);
    let to = payload.phone.replace(/[^0-9]/g, '');
    if (to.length === 10) to = `91${to}`;
    return this.sendMessage({
      to, type: "template", template: {
        name: "cctv_lead_welcome", language: { code: "en", policy: "deterministic" },
        components: [{ type: "body", parameters: [
          { type: "text", text: payload.customerName },
          { type: "text", text: payload.configDetails }
        ]}]
      }
    });
  }

  async sendRefundInitiated(payload: { phone: string, customerName: string, amount: number, orderId: string }) {
    console.log(`[MSG91] Sending refund alert to ${payload.phone}`);
    let to = payload.phone.replace(/[^0-9]/g, '');
    if (to.length === 10) to = `91${to}`;
    return this.sendMessage({
      to, type: "template", template: {
        name: "cctv_refund_initiated", language: { code: "en", policy: "deterministic" },
        components: [{ type: "body", parameters: [
          { type: "text", text: payload.customerName },
          { type: "text", text: payload.amount.toString() },
          { type: "text", text: payload.orderId }
        ]}]
      }
    });
  }

  async sendSalesLeadAlert(payload: { phone: string, customerName: string, configDetails: string }) {
    console.log(`[MSG91] Sending sales lead alert to ${payload.phone}`);
    let to = payload.phone.replace(/[^0-9]/g, '');
    if (to.length === 10) to = `91${to}`;
    return this.sendMessage({
      to, type: "template", template: {
        name: "cctv_sales_lead", language: { code: "en", policy: "deterministic" },
        components: [{ type: "body", parameters: [
          { type: "text", text: payload.customerName },
          { type: "text", text: payload.configDetails }
        ]}]
      }
    });
  }

  async sendPromoterEarned(payload: { phone: string, amount: number, customerName: string }) {
    console.log(`[MSG91] Sending promoter earned alert to ${payload.phone}`);
    let to = payload.phone.replace(/[^0-9]/g, '');
    if (to.length === 10) to = `91${to}`;
    return this.sendMessage({
      to, type: "template", template: {
        name: "cctv_promoter_earned", language: { code: "en", policy: "deterministic" },
        components: [{ type: "body", parameters: [
          { type: "text", text: payload.amount.toString() },
          { type: "text", text: payload.customerName }
        ]}]
      }
    });
  }
}

export const msg91 = new Msg91WhatsAppProvider();

export async function sendWarrantyActiveAlert(phone: string, name: string, years: string, link: string) {
  const provider = new Msg91WhatsAppProvider();
  
  let to = phone.replace(/[^0-9]/g, '');
  if (to.length === 10) to = `91${to}`;

  const msg91Payload = {
    to,
    type: "template",
    template: {
      name: "cctv_warranty_active",
      language: { code: "en", policy: "deterministic" },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: name },
            { type: "text", text: years },
            { type: "text", text: link }
          ]
        }
      ]
    }
  };

  return provider["sendMessage"](msg91Payload);
}
