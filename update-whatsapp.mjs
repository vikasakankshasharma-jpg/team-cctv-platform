import fs from "fs";
let content = fs.readFileSync("components/wizard/WizardClientV2.tsx", "utf8");

const oldStr = `  const handleSendWhatsApp = async () => {
    if (!savedQuoteId || !pdfUrl) return;
    setLoading(true);
    try {
      const res = await fetch(\`/api/quote/\${savedQuoteId}/whatsapp\`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfUrl })
      });
      const data = await res.json();
      if (data.success) {
        alert(data.idempotent ? "WhatsApp already sent previously." : "WhatsApp sent successfully!");
      } else {
        alert("Failed to send WhatsApp.");
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };`;

const newStr = `  const handleSendWhatsApp = () => {
    if (!savedQuoteId) return;
    const salesNumber = "919772699395";
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cctvquotation.com';
    const pdfLink = \`\${baseUrl}/api/quote/\${savedQuoteId}/download\`;
    const message = \`Hi team! ??\\n\\nI just generated a CCTV Quotation on your website.\\n*Quote ID:* \${savedQuoteId}\\n\\nHere is my PDF link:\\n\${pdfLink}\\n\\nPlease review it and let me know the next steps.\`;
    const whatsappUrl = \`https://wa.me/\${salesNumber}?text=\${encodeURIComponent(message)}\`;
    window.open(whatsappUrl, '_blank');
  };`;

// Replace ignoring \r
const normalize = (s) => s.replace(/\r/g, "");
const oldNormalized = normalize(oldStr);
const contentNormalized = normalize(content);

if (contentNormalized.includes(oldNormalized)) {
    const idx = contentNormalized.indexOf(oldNormalized);
    const before = contentNormalized.substring(0, idx);
    const after = contentNormalized.substring(idx + oldNormalized.length);
    fs.writeFileSync("components/wizard/WizardClientV2.tsx", before + newStr + after);
    console.log("Successfully replaced normalized string");
} else {
    console.log("Could not find normalized string");
}
