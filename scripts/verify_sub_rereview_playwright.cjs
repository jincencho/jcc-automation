const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const artifactDir = 'C:\\Users\\진센조\\.gemini\\antigravity\\brain\\3ca4ffe5-d17f-4218-abfa-c9da004ae864';

(async () => {
  console.log('Verifying 58-day re-review notice with Playwright...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1200 } });
  const page = await context.newPage();

  page.on('dialog', async (d) => await d.accept());

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

  // Screenshot consult date pill
  console.log('Capturing consult date pill...');
  const dateSection = page.locator('#jcc_consult_date_input').locator('..');
  if (await dateSection.count() > 0) {
    await dateSection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await dateSection.screenshot({
      path: path.join(artifactDir, 'screenshot_consult_date_pill.png')
    });
    console.log('Saved screenshot_consult_date_pill.png');
  }

  // Go to Quotation 1 (1번 스마트 비교견적서)
  console.log('Going to Quotation 1...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('비교 결과 보기'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1500);

  // Screenshot Quotation 1 Paper
  const q1Paper = page.locator('.a4-paper').first();
  if (await q1Paper.count() > 0) {
    await q1Paper.screenshot({
      path: path.join(artifactDir, 'screenshot_quote1_rereview.png')
    });
    console.log('Saved screenshot_quote1_rereview.png');
  }

  // Back to input and test Quotation 2
  console.log('Testing Quotation 2...');
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('조건 수정하기'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(800);

  // Switch to 2번 구독 포함 계산기
  const mixedTabBtn = page.locator('button:has-text("2번 구독 포함 계산기")').first();
  await mixedTabBtn.click();
  await page.waitForTimeout(800);

  // Click 스마트 견적서 보기
  await page.evaluate(() => {
    const btns = Array.from(document.querySelectorAll('button'));
    const btn = btns.find(b => b.textContent.includes('스마트 견적서 보기'));
    if (btn) btn.click();
  });
  await page.waitForTimeout(1500);

  // Screenshot Quotation 2 Page 2
  const q2Page2 = page.locator('.a4-paper').nth(1);
  if (await q2Page2.count() > 0) {
    await q2Page2.screenshot({
      path: path.join(artifactDir, 'screenshot_quote2_rereview.png')
    });
    console.log('Saved screenshot_quote2_rereview.png');
  }

  await browser.close();
  console.log('Playwright 58-day verification complete!');
})();
