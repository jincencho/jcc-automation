const { chromium } = require('playwright');
const path = require('path');

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
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  const viewQuoteBtn = page.locator('button:has-text("보기 (A4 출력)")').first();
  await viewQuoteBtn.click({ force: true });
  await page.waitForTimeout(1000);

  const card = page.locator('.a4-manager-card').first();
  await card.screenshot({ path: path.join(artifactDir, 'screenshot_manager_card_final.png') });
  console.log('✓ Captured screenshot_manager_card_final.png');

  const sheet = page.locator('.a4-print-sheet').first();
  await sheet.screenshot({ path: path.join(artifactDir, 'screenshot_quote_sheet_final_with_photo.png') });
  console.log('✓ Captured screenshot_quote_sheet_final_with_photo.png');

  await browser.close();
})();
