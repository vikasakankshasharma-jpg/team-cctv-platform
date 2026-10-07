import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  await page.setViewport({ width: 1280, height: 800 });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('LIVE PAGE ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('LIVE PAGE UNHANDLED ERROR:', error.message);
  });

  const clickBtn = async (text, timeout = 5000) => {
    await page.waitForFunction(
      (t) => Array.from(document.querySelectorAll('button')).some(b => b.innerText.toLowerCase().includes(t.toLowerCase())),
      { timeout },
      text
    ).catch(() => {});
    
    await page.evaluate((t) => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes(t.toLowerCase()));
      if (btn) btn.click();
    }, text);
    await new Promise(r => setTimeout(r, 800));
  };

  try {
    console.log("Navigating to LIVE wizard...");
    await page.goto('https://cctvquotation.com/wizard?city=Jaipur&pincode=302012&served=true', { waitUntil: 'domcontentloaded' });
    
    // Step 0
    await clickBtn('Guided Setup');
    await clickBtn('Start Builder');

    // Step 1
    await clickBtn('Completely New System');
    await clickBtn('Confirm Selection');
    
    // Step 2
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        btns.forEach(b => { if (b.textContent === '+') b.click(); });
    });
    await clickBtn('Confirm Cameras');
    
    // Step 3
    await clickBtn('Confirm Recording');
    
    // Step 4
    await clickBtn('Confirm Details');
    
    // Step 5 (Final Step)
    console.log("Reached step 5 (hopefully)");
    
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: 'live-step5.png' });
    const currentUrl = page.url();
    console.log("Current URL:", currentUrl);
    
    let html = await page.content();
    if (html.includes("synchronization error") || html.includes("Something went wrong")) {
      console.log("ERROR BOUNDARY DETECTED ON LIVE SITE!");
    } else {
        console.log("NO ERROR BOUNDARY!");
    }

  } catch (err) {
    console.log('Test execution error:', err.message);
  }
  
  await browser.close();
})();
