import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  // Set a large viewport
  await page.setViewport({ width: 1280, height: 800 });

  const errors = [];
  const logs = [];

  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (msg.type() === 'error') {
      console.log('PAGE ERROR LOG:', text);
      errors.push(text);
    }
  });
  
  page.on('pageerror', error => {
    console.log('PAGE UNHANDLED ERROR:', error.message);
    errors.push(error.message);
  });

  const clickBtn = async (text, timeout = 5000) => {
    await page.waitForFunction(
      (t) => Array.from(document.querySelectorAll('button')).some(b => b.innerText.toLowerCase().includes(t.toLowerCase())),
      { timeout },
      text
    ).catch(() => console.log(`Timeout waiting for button: ${text}`));
    
    await page.evaluate((t) => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.toLowerCase().includes(t.toLowerCase()));
      if (btn) btn.click();
    }, text);
    await new Promise(r => setTimeout(r, 800));
  };

  try {
    console.log("Navigating to wizard...");
    await page.goto('http://localhost:3000/wizard');
    
    // Step 0
    console.log("Step 0...");
    await clickBtn('Guided Setup');
    await clickBtn('Start Builder');

    // Step 1
    console.log("Step 1...");
    await clickBtn('Completely New System');
    await clickBtn('Confirm Selection');
    
    // Step 2
    console.log("Step 2...");
    // click + for indoor
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        btns.forEach(b => { if (b.textContent === '+') b.click(); });
    });
    await clickBtn('Confirm Cameras');
    
    // Step 3
    console.log("Step 3...");
    await clickBtn('Confirm Recording');
    
    // Step 4
    console.log("Step 4...");
    await clickBtn('Confirm Details');
    
    // Step 5 (Final Step)
    console.log("Step 5...");
    await page.waitForSelector('input[type="text"]', { timeout: 15000 });
    await page.type('input[type="text"]', 'End To End Test User');
    await page.type('input[type="tel"]', '9999999999');
    
    console.log("Submitting wizard...");
    await clickBtn('View My CCTV Options');
    
    // Wait for the quote page to load (URL changes or API finishes)
    console.log("Waiting for quote generation...");
    await new Promise(r => setTimeout(r, 6000));
    
    // Check if error boundary is visible
    let html = await page.content();
    if (html.includes("synchronization error") || html.includes("Something went wrong")) {
      console.log("ERROR: Crash detected after quote generation!");
      errors.push("Crash after quote generation");
    }

    // Now we should be on the Quote Comparison screen.
    // Try to click "View Details" on the first plan
    console.log("Selecting a plan...");
    await clickBtn('View Details');
    
    await new Promise(r => setTimeout(r, 2000));

    // Now we should be on the CameraCustomizer screen
    console.log("Confirming plan...");
    await clickBtn('Confirm & Generate');

    await new Promise(r => setTimeout(r, 5000));
    
    // Now we should be on checkout
    console.log("At checkout...");
    const currentUrl = page.url();
    console.log("Current URL:", currentUrl);
    
    if (currentUrl.includes('/quote/')) {
       // Wait for checkout elements
       console.log("Clicking Complete Booking...");
       await clickBtn('Complete Booking');
       await new Promise(r => setTimeout(r, 3000));
    }

  } catch (err) {
    console.log('Test execution error:', err.message);
  }
  
  console.log("--- TEST SUMMARY ---");
  console.log("Errors detected:", errors.length);
  errors.forEach(e => console.log("-", e));
  
  await browser.close();
})();
