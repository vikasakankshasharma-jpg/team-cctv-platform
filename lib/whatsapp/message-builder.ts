export interface WhatsAppMessagePayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "text" | "interactive" | "document";
  text?: { body: string };
  interactive?: any;
  document?: { link: string; filename?: string; caption?: string };
}

export const MessageBuilder = {
  text(to: string, body: string): WhatsAppMessagePayload {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body },
    };
  },

  /**
   * Create an interactive button message (max 3 buttons).
   */
  buttons(to: string, body: string, buttons: { id: string; title: string }[]): WhatsAppMessagePayload {
    if (buttons.length > 3) throw new Error("Max 3 buttons allowed");
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "button",
        body: { text: body },
        action: {
          buttons: buttons.map(b => ({
            type: "reply",
            reply: { id: b.id, title: b.title }
          }))
        }
      }
    };
  },

  /**
   * Create an interactive list message (max 10 items).
   */
  list(to: string, body: string, buttonText: string, sections: { title: string, rows: { id: string, title: string, description?: string }[] }[]): WhatsAppMessagePayload {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: body },
        action: {
          button: buttonText,
          sections: sections.map(s => ({
            title: s.title,
            rows: s.rows.map(r => ({
              id: r.id,
              title: r.title,
              description: r.description
            }))
          }))
        }
      }
    };
  },
  
  document(to: string, link: string, caption: string, filename: string): WhatsAppMessagePayload {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "document",
      document: { link, caption, filename }
    };
  },

  /**
   * Create an interactive Flow message to open a native form.
   */
  flowButton(to: string, body: string, buttonText: string, flowId: string, flowToken: string): WhatsAppMessagePayload {
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "flow",
        header: {
          type: "text",
          text: "TEAM CCTV Configuration"
        },
        body: { text: body },
        action: {
          name: "flow",
          parameters: {
            flow_message_version: "3",
            flow_token: flowToken,
            flow_id: flowId,
            flow_cta: buttonText,
            flow_action: "navigate",
            flow_action_payload: {
              screen: "SCREEN_1"
            }
          }
        }
      }
    };
  }
};
