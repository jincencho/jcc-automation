const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const artifactDir = 'C:/Users/진센조/.gemini/antigravity/brain/3ca4ffe5-d17f-4218-abfa-c9da004ae864';
const cropAPath = path.join(artifactDir, 'test_crop_A.jpg');
const cropCPath = path.join(artifactDir, 'test_crop_C.jpg');

const b64A = `data:image/jpeg;base64,${fs.readFileSync(cropAPath).toString('base64')}`;
const b64C = `data:image/jpeg;base64,${fs.readFileSync(cropCPath).toString('base64')}`;

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

  // Load the offline HTML
  const fileUrl = 'file:///' + path.resolve('JCC_혜택계산기.html').replace(/\\/g, '/');
  await page.goto(fileUrl, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // Switch to quote view
  const viewQuoteBtn = page.locator('button:has-text("보기 (A4 출력)")').first();
  await viewQuoteBtn.click({ force: true });
  await page.waitForTimeout(800);

  // Replace photo src with Crop A
  await page.evaluate((src) => {
    const el = document.querySelector('.a4-manager-photo');
    if (el) el.src = src;
  }, b64A);
  await page.waitForTimeout(400);

  const card = page.locator('.a4-manager-card').first();
  await card.screenshot({ path: path.join(artifactDir, 'preview_manager_card_cropA.png') });
  console.log('✓ Captured preview_manager_card_cropA.png');

  // Replace photo src with Crop C
  await page.evaluate((src) => {
    const el = document.querySelector('.a4-manager-photo');
    if (el) el.src = src;
  }, b64C);
  await page.waitForTimeout(400);
  await card.screenshot({ path: path.join(artifactDir, 'preview_manager_card_cropC.png') });
  console.log('✓ Captured preview_manager_card_cropC.png');

  await browser.close();
})();
