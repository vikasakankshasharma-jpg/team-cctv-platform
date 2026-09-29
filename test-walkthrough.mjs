import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
  
  try {
    await page.goto('http://127.0.0.1:3000/wizard', { waitUntil: 'domcontentloaded' });
    console.log('Page loaded');
    
    // Check if error boundary is visible
    let html = await page.content();
    if (html.includes("synchronization error")) {
      console.log("Error on load!");
      process.exit(1);
    }

    const clickBtn = async (text) => {
      await page.evaluate((t) => {
        const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes(t));
        if (btn) btn.click();
        else console.log("Button not found: " + t);
      }, text);
      await new Promise(r => setTimeout(r, 500));
    };

    // Step 1
    await clickBtn('Guided Setup');
    // Step 2
    await clickBtn('Yes, I know');
    await clickBtn('Next Step');
    // Step 3
    await clickBtn('Confirm Details');
    // Step 4
    await clickBtn('Confirm Recording');
    // Final Step
    await page.type('input[type="text"]', 'Test User');
    await page.type('input[type="tel"]', '9999999999');
    
    console.log("Submitting...");
    await clickBtn('View My CCTV Options');
    
    await new Promise(r => setTimeout(r, 4000));
    
    html = await page.content();
    if (html.includes("synchronization error")) {
      console.log("Error after quote generation!");
    } else {
      console.log("Success! Quote generated.");
    }

  } catch (err) {
    console.log('Test error:', err);
  }
  
  await browser.close();
})();
