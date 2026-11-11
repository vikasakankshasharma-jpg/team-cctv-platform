export interface WhatsAppMessagePayload {
  messaging_product: "whatsapp";
  recipient_type: "individual";
  to: string;
  type: "text" | "interactive" | "document";
  text?: { body: string };
  interactive?: any;
  document?: { link: string; filename?: string; caption?: string };
}

/**
 * Clamp a WhatsApp Cloud API label or description to Meta's UTF-16 length limit
 * without splitting surrogate emoji pairs or Indic grapheme clusters.
 */
function clampMetaText(text: string, maxUtf16Units: number): string {
  const normalized = (text || "").trim();
  if (!normalized || normalized.length <= maxUtf16Units) return normalized;

  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    let out = "";
    for (const { segment } of segmenter.segment(normalized)) {
      if ((out + segment).length > maxUtf16Units) break;
      out += segment;
    }
    return out.trim();
  }

  let out = "";
  for (const cp of Array.from(normalized)) {
    if ((out + cp).length > maxUtf16Units) break;
    out += cp;
  }
  return out.trim();
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
   * Create an interactive button message (max 3 buttons, button title <= 20 chars).
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
            reply: { 
              id: b.id, 
              // Meta strictly enforces max 20 characters for quick reply button titles
              title: clampMetaText(b.title, 20)
            }
          }))
        }
      }
    };
  },

  /**
   * Create an interactive list message (max 10 items, button <= 20 chars, section & row title <= 24 chars, description <= 72 chars).
   */
  list(to: string, body: string, buttonText: string, sections: { title: string, rows: { id: string, title: string, description?: string }[] }[]): WhatsAppMessagePayload {
    const safeButton = clampMetaText(buttonText, 20);
    return {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "interactive",
      interactive: {
        type: "list",
        body: { text: body },
        action: {
          button: safeButton,
          sections: sections.map(s => ({
            title: clampMetaText(s.title, 24),
            rows: s.rows.map(r => ({
              id: r.id,
              title: clampMetaText(r.title, 24),
              description: r.description ? clampMetaText(r.description, 72) : undefined
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
