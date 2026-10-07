const puppeteer = require('puppeteer-core');

(async () => {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });
  
  const page = await browser.newPage();
  
  // Capture console logs
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  await page.goto('https://cctvquotation.com/test-map', { waitUntil: 'domcontentloaded' });
  await new Promise(r => setTimeout(r, 4000));
  
  const circleResult = await page.evaluate(async () => {
    return new Promise((resolve) => {
      try {
        const div = document.createElement('div');
        div.id = 'dummy-map';
        document.body.appendChild(div);
        
        // Wait for mappls to load
        if (!window.mappls) return resolve('no mappls');
        
        const map = new window.mappls.Map('dummy-map', { center: { lat: 26.4617, lng: 74.6361 }, zoom: 12 });
        
        setTimeout(() => {
          try {
            const circle = new window.mappls.Circle({
              map: map,
              center: { lat: 26.4617, lng: 74.6361 },
              radius: 4000,
              fillColor: "3b82f6",
              fillOpacity: 0.25,
              strokeColor: "1d4ed8",
              strokeWidth: 2,
            });
            resolve({ success: true, circleKeys: Object.keys(circle) });
          } catch(e) {
            resolve({ success: false, reason: e.toString() });
          }
        }, 3000);
      } catch (e) {
        resolve({ success: false, reason: e.toString() });
      }
    });
  });
  
  console.log('circleResult:', circleResult);
  await browser.close();
})();
