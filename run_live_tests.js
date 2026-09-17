const { chromium } = require('@playwright/test');
const fs = require('fs');

const cookiesTxt = fs.readFileSync('cookies.txt', 'utf16le');
const lines = cookiesTxt.split('\n').map(l => l.trim()).filter(Boolean);
const adminCookie = lines[0].split('=')[1].trim();
const installerCookie = lines[1].split('=')[1].trim();

(async () => {
  const browser = await chromium.launch();
  
  // ----- ADMIN TESTS -----
  const adminContext = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  await adminContext.addCookies([
    {
      name: 'admin_session',
      value: adminCookie,
      url: 'https://cctvquotation.com'
    }
  ]);
  
  const adminPage = await adminContext.newPage();
  
  console.log('Admin Dashboard...');
  await adminPage.goto('https://cctvquotation.com/admin', { waitUntil: 'domcontentloaded' });
  await adminPage.waitForTimeout(4000);
  await adminPage.screenshot({ path: 'C:/Users/hp/.gemini/antigravity/brain/9364911f-91a7-48fa-8fc4-a1648f71bdb6/admin-dashboard-live.png' });
  
  console.log('Admin Settlements...');
  await adminPage.goto('https://cctvquotation.com/admin/operations/settlements', { waitUntil: 'domcontentloaded' });
  await adminPage.waitForTimeout(4000);
  await adminPage.screenshot({ path: 'C:/Users/hp/.gemini/antigravity/brain/9364911f-91a7-48fa-8fc4-a1648f71bdb6/admin-settlements-live.png' });
  
  await adminContext.close();
  
  // ----- INSTALLER TESTS -----
  const installerContext = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3)' });
  await installerContext.addCookies([
    {
      name: 'installer_session',
      value: installerCookie,
      url: 'https://cctvquotation.com'
    }
  ]);
  
  const installerPage = await installerContext.newPage();
  
  console.log('Installer Job Page...');
  await installerPage.goto('https://cctvquotation.com/installer/jobs/test_lead_id', { waitUntil: 'domcontentloaded' });
  await installerPage.waitForTimeout(4000);
  await installerPage.evaluate(() => window.scrollBy(0, 1000));
  await installerPage.waitForTimeout(1000);
  await installerPage.screenshot({ path: 'C:/Users/hp/.gemini/antigravity/brain/9364911f-91a7-48fa-8fc4-a1648f71bdb6/installer-job-live.png' });
  
  // Click Collect Payment button to show modal
  try {
    // Collect Payment (Cash / UPI)
    await installerPage.click('text="Collect Payment"', { timeout: 3000 });
    await installerPage.waitForTimeout(1000);
    await installerPage.screenshot({ path: 'C:/Users/hp/.gemini/antigravity/brain/9364911f-91a7-48fa-8fc4-a1648f71bdb6/installer-job-modal-live.png' });
  } catch (e) {
    console.log("Could not open modal: " + e.message);
  }
  
  console.log('Installer Ledger Page...');
  await installerPage.goto('https://cctvquotation.com/installer/ledger', { waitUntil: 'domcontentloaded' });
  await installerPage.waitForTimeout(4000);
  await installerPage.screenshot({ path: 'C:/Users/hp/.gemini/antigravity/brain/9364911f-91a7-48fa-8fc4-a1648f71bdb6/installer-ledger-live.png' });
  
  await installerContext.close();
  await browser.close();
  
  console.log('All tests completed.');
})();
