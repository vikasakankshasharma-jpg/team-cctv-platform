const puppeteer = require('puppeteer');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (q) => new Promise(resolve => rl.question(q, resolve));

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

  console.log('Navigating to wizard...');
  await page.goto('http://localhost:3000/wizard', { waitUntil: 'networkidle2' });

  try {
    // Fill the wizard quickly
    console.log('Clicking Residential...');
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Residential'))?.click();
    });
    await new Promise(r => setTimeout(r, 500));
    
    console.log('Clicking IP Cameras...');
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('IP Cameras'))?.click();
    });
    await new Promise(r => setTimeout(r, 500));
    
    console.log('Clicking 4 Cameras...');
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('4 Cameras'))?.click();
    });
    await new Promise(r => setTimeout(r, 500));
    
    console.log('Clicking Yes cable...');
    await page.evaluate(() => {
      Array.from(document.querySelectorAll('button')).find(el => el.textContent.includes('Yes, cable is laid'))?.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    
    const mobile = await ask('READY_FOR_MOBILE\n');
    console.log('Filling out LeadGate with mobile:', mobile);

    await page.type('input[placeholder="98765 43210"]', mobile);
    await page.type('input[placeholder="e.g. Rahul Sharma"]', 'AI Tester');
    
    await page.evaluate(() => { document.querySelector('input[placeholder="e.g. 302001"]').value = '' });
    await page.type('input[placeholder="e.g. 302001"]', '302012');
    
    console.log('Submitting form...');
    await page.click('button[type="submit"]');

    console.log('Waiting for reCAPTCHA/OTP response...');
    await new Promise(r => setTimeout(r, 5000)); // wait for network

    const errorText = await page.evaluate(() => {
      const errorDiv = document.querySelector('div[role="alert"]');
      return errorDiv ? errorDiv.innerText : null;
    });
    
    if (errorText) {
      console.log('🚨 ERROR DETECTED:', errorText);
    } else {
      console.log('✅ No error detected. Look at your phone.');
      const otp = await ask('READY_FOR_OTP\n');
      
      console.log('Entering OTP...');
      await page.evaluate((otpStr) => {
         const inputs = Array.from(document.querySelectorAll('input')).filter(i => !i.placeholder || i.placeholder === '-' || i.placeholder === '' || i.className.includes('text-center'));
         for (let i=0; i<6; i++) {
             if(inputs[i]) {
                 inputs[i].value = otpStr[i] || '0';
                 inputs[i].dispatchEvent(new Event('input', { bubbles: true }));
             }
         }
         Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Verify Code'))?.click();
      }, otp);
      
      await new Promise(r => setTimeout(r, 5000)); 
      
      const otpError = await page.evaluate(() => {
        const err = document.querySelector('div[role="alert"]');
        return err ? err.innerText : null;
      });
      if (otpError) {
          console.log('🚨 OTP VERIFICATION ERROR:', otpError);
      } else {
          console.log('✅ SUCCESS! Lead Generated.');
          console.log('Final URL:', page.url());
      }
    }
  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await browser.close();
    rl.close();
  }
})();
