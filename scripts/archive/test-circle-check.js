const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/test-map', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  
  const hasCircle = await page.evaluate(() => {
    // Mappls vector SDK draws SVG or canvas.
    // If it's Mapbox GL JS (which Mappls uses), it renders a canvas, and source data is stored in map object.
    const mapContainer = document.querySelector('#mappls-boundary-map');
    return mapContainer !== null && mapContainer.innerHTML.includes('canvas');
  });
  
  const mapData = await page.evaluate(() => {
    try {
      // Find the window.mappls map instance or just assume we know the layer exists?
      // Since it's encapsulated in React, we might not have global map access.
      // But we can check for canvas or SVG.
      return { success: true, hasCanvas: document.querySelector('canvas') !== null };
    } catch(e) {
      return { success: false };
    }
  });

  console.log('Result:', { hasCircle, mapData });
  
  await browser.close();
})();
