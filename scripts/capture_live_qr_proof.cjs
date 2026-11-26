const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const artifactDir = 'C:/Users/진센조/.gemini/antigravity/brain/3ca4ffe5-d17f-4218-abfa-c9da004ae864';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1800 } });
  const page = await context.newPage();

  page.on('dialog', async (d) => await d.accept());

  await page.addInitScript(() => {
    sessionStorage.setItem('jcc_calc_auth_user', JSON.stringify({
      id: 'admin',
      name: '조준석',
      store: '통합진주',
      level: 'admin'
    }));
    sessionStorage.removeItem('jcc_calc_screen_locked');
  });

  const fileUrl = 'file:///' + path.resolve('JCC_혜택계산기.html').replace(/\\/g, '/');
  console.log('Navigating to:', fileUrl);
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // Navigate to quote view
  const viewQuoteBtn = page.locator('button:has-text("보기 (A4 출력)")').first();
  await viewQuoteBtn.click({ force: true });
  await page.waitForTimeout(1000);

  // 1. Capture Manager Card
  const card = page.locator('.a4-manager-card').first();
  await card.screenshot({ path: path.join(artifactDir, 'screenshot_qr_live_card.png') });
  console.log('1. Saved screenshot_qr_live_card.png');

  // 2. Capture QR code close-up
  const qrBox = page.locator('.a4-manager-qr').first();
  await qrBox.screenshot({ path: path.join(artifactDir, 'screenshot_qr_live_screen.png') });
  console.log('2. Saved screenshot_qr_live_screen.png');

  // 3. Emulate Print Media
  await page.emulateMedia({ media: 'print' });
  await page.waitForTimeout(500);

  const printCard = page.locator('.a4-manager-card').first();
  await printCard.screenshot({ path: path.join(artifactDir, 'screenshot_qr_live_print.png') });
  console.log('3. Saved screenshot_qr_live_print.png');

  // 4. Capture full quote sheet in screen media
  await page.emulateMedia({ media: 'screen' });
  const quoteSheet = page.locator('.a4-print-sheet').first();
  await quoteSheet.screenshot({ path: path.join(artifactDir, 'screenshot_qr_live_quote_sheet.png') });
  console.log('4. Saved screenshot_qr_live_quote_sheet.png');

  await browser.close();
  console.log('DONE CAPTURING VERIFIED LIVE QR PROOF!');
})();
