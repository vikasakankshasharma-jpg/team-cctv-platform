import fs from 'fs';
import fetch from 'node-fetch';

async function fetchPDF() {
  const quoteId = "uR8RUc0IrPTiopnZN4Rh";
  const url = `http://localhost:3000/api/quote/${quoteId}/download`;
  console.log(`Fetching PDF from ${url}...`);
  
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`Failed to fetch PDF: ${res.status} ${res.statusText}`);
    console.log(await res.text());
    process.exit(1);
  }
  
  const buffer = await res.buffer();
  fs.writeFileSync(`Quote-${quoteId}.pdf`, buffer);
  console.log(`✅ Saved PDF to Quote-${quoteId}.pdf`);
}

fetchPDF();
