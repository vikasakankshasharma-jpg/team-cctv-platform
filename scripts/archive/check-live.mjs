import fetch from 'node-fetch';
import fs from 'fs';

async function check() {
  const res = await fetch('https://cctvquotation.com/wizard');
  const html = await res.text();
  
  // Find all JS chunk URLs
  const regex = /_next\/static\/chunks\/[^"']+\.js/g;
  const chunks = [...new Set(html.match(regex))];
  
  console.log(`Found ${chunks.length} chunks. Downloading and searching...`);
  let foundFix = false;
  let foundMappls = false;
  
  for (const chunk of chunks) {
    const chunkUrl = `https://cctvquotation.com/${chunk}`;
    try {
      const cRes = await fetch(chunkUrl);
      const cText = await cRes.text();
      
      if (cText.includes("MapplsBoundaryMap")) {
          console.log("Found MapplsBoundaryMap in:", chunk);
          foundMappls = true;
      }
      if (cText.includes("Google Maps Places library is not available")) {
          console.log("Found PlacesAutocomplete fix in:", chunk);
          foundFix = true;
      }
      if (cText.includes("GOOGLE_MAPS_LIBRARIES")) {
          console.log("Found GOOGLE_MAPS_LIBRARIES fix in:", chunk);
      }
    } catch (e) {
      console.log("Error fetching", chunk);
    }
  }
  
  console.log("Mappls (latest commit) deployed:", foundMappls);
  console.log("My Fix deployed:", foundFix);
}

check();
