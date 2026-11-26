const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const artifactDir = 'C:\\Users\\진센조\\.gemini\\antigravity\\brain\\3ca4ffe5-d17f-4218-abfa-c9da004ae864';

(async () => {
  console.log('Launching Playwright Chromium...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();

  page.on('dialog', async (dialog) => {
    console.log('Dialog popped up:', dialog.message());
    await dialog.accept();
  });

  await page.addInitScript(() => {
    sessionStorage.setItem('jcc_calc_auth', 'true');
    sessionStorage.setItem('jcc_calc_auth_user', JSON.stringify({
      id: 'admin',
      name: '조준석',
      store: '통합진주',
      level: 'admin'
    }));
    sessionStorage.removeItem('jcc_calc_screen_locked');
  });

  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Click 혜택 계산기
  await page.locator('text=혜택 계산기').first().click();
  await page.waitForTimeout(1000);

  // Expand affiliate section
  console.log('Expanding affiliate section...');
  const affiliateHeader = page.locator('text=제휴 연계 추가 혜택 (상조 제휴 · 통신사 IPTV)');
  await affiliateHeader.scrollIntoViewIfNeeded();
  await affiliateHeader.click();
  await page.waitForTimeout(400);

  // Enable Sangjo & Telecom
  await page.locator('label:has-text("상조 제휴 혜택") input[type="checkbox"]').check();
  await page.waitForTimeout(200);
  await page.locator('label:has-text("통신사 IPTV") input[type="checkbox"]').check();
  await page.waitForTimeout(200);

  // Directly click result CTA via evaluate
  console.log('Clicking result CTA directly...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('비교 결과 보기'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1500);

  // Take screenshot of current page
  const screenshotPath = path.join(artifactDir, 'screenshot_quote1_view.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log('Saved screenshot to:', screenshotPath);

  await browser.close();
  console.log('Direct click verification complete!');
})();
