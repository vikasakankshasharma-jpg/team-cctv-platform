import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  try {
    // Go to the local dev server
    await page.goto('http://127.0.0.1:3000/wizard?city=Jaipur&pincode=302012&served=true', { waitUntil: 'networkidle2' });
    console.log('Page loaded');
    
    // Evaluate in page to see if error boundary is visible
    const errorText = await page.evaluate(() => document.body.innerText);
    if (errorText.includes("synchronization error")) {
      console.log("Error Boundary is visible on load!");
    } else {
      console.log("No error boundary on load.");
    }
  } catch (err) {
    console.log('Test error:', err);
  }
  
  await browser.close();
})();
